// ไฟล์นี้: เทสต์ระดับ Integration กับฐานข้อมูลจริงใน Docker
// Jest หาไฟล์ที่ลงท้าย .test.js ให้เอง
// request คือ Supertest ใช้ยิง HTTP เข้า app โดยไม่ต้องเปิด port
const request = require("supertest");
const app = require("./app");
const { pool } = require("../db");

// เก็บ id ออเดอร์ที่เทสต์สร้าง เพื่อตามลบตอนจบ
const createdOrderIds = [];
let customerToken;
let adminToken;

// ฟังก์ชันช่วย login แล้วคืน token
async function login(username, password) {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ username, password });
  return res.body.token;
}

// สร้าง header สำหรับ .set(...)
function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// ฟังก์ชันช่วยสร้างออเดอร์ในนามลูกค้า และจำ id ไว้ถ้าสร้างสำเร็จ
async function createOrder(items = [{ menuItemId: 1, quantity: 2 }]) {
  const res = await request(app)
    .post("/api/v1/orders")
    .set(auth(customerToken))
    .send({ items });
  if (res.statusCode === 201) createdOrderIds.push(res.body.data.id);
  return res;
}

// beforeAll รันครั้งเดียวก่อนทุกเทสต์ในไฟล์
beforeAll(async () => {
  customerToken = await login("somchai", "customer123");
  adminToken = await login("admin", "admin123");
});

// afterAll รันครั้งเดียวหลังจบทุกเทสต์: ล้างข้อมูลและปิด pool
// ถ้าไม่ปิด pool Jest อาจค้างเพราะ connection ยังเปิดอยู่
afterAll(async () => {
  // order_items ถูกลบตามด้วย ON DELETE CASCADE
  if (createdOrderIds.length > 0) {
    await pool.query("DELETE FROM orders WHERE id IN (?)", [createdOrderIds]);
  }
  await pool.end();
});

// describe = จัดกลุ่มเทสต์, it = เทสต์ 1 ข้อ
// แต่ละข้อเรียงตาม Arrange (เตรียม), Act (เรียก), Assert (expect ตรวจผล)
describe("POST /api/v1/auth/login", () => {
  it("ตอบ 401 เมื่อรหัสผ่านผิด", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "wrong" });
    // toBe เทียบค่า primitive ด้วย ===
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/v1/menu", () => {
  it("คืนเมนูพร้อม pagination", async () => {
    const res = await request(app).get("/api/v1/menu?page=2&limit=5");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(5);
    // toEqual เทียบค่าข้างใน object แบบ deep
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 5,
      totalItems: 22,
      totalPages: 5,
    });
  });

  it("กรองเฉพาะเมนูที่สั่งได้", async () => {
    const res = await request(app).get("/api/v1/menu?available=true&limit=100");
    expect(res.statusCode).toBe(200);
    // seed มี 22 เมนู หมด 2 เมนู จึงเหลือ 20
    expect(res.body.pagination.totalItems).toBe(20);
    expect(res.body.data.every((item) => item.available)).toBe(true);
  });

  it("ตอบ 400 เมื่อ query ไม่ถูกต้อง", async () => {
    const res = await request(app).get("/api/v1/menu?page=0");
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/orders", () => {
  it("ตอบ 401 เมื่อไม่มี token", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe("NO_TOKEN");
  });

  it("สร้างออเดอร์และคำนวณราคาจากฐานข้อมูล", async () => {
    // เมนู 1 ราคา 60 x 2 + เมนู 15 ราคา 25 x 1 = 145
    const res = await createOrder([
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 15, quantity: 1 },
    ]);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.total).toBe(145);
    expect(res.body.data.status).toBe("pending");
  });

  it("ตอบ 400 เมื่อ quantity ไม่ถูกต้อง", async () => {
    const res = await createOrder([{ menuItemId: 1, quantity: 0 }]);
    expect(res.statusCode).toBe(400);
  });

  it("ตอบ 404 เมื่อไม่พบเมนู", async () => {
    const res = await createOrder([{ menuItemId: 9999, quantity: 1 }]);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe("MENU_NOT_FOUND");
  });

  it("ตอบ 409 เมื่อเมนูหมด และไม่สร้างออเดอร์ค้าง", async () => {
    // เมนู 9 (ข้าวขาหมู) ใน seed มี available = FALSE
    // นับจำนวนก่อนและหลัง เพื่อยืนยันว่า rollback ทำงาน
    const [[before]] = await pool.query("SELECT COUNT(*) AS n FROM orders");
    const res = await createOrder([{ menuItemId: 9, quantity: 1 }]);
    const [[after]] = await pool.query("SELECT COUNT(*) AS n FROM orders");

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe("MENU_UNAVAILABLE");
    expect(after.n).toBe(before.n);
  });
});

describe("GET /api/v1/orders/:id", () => {
  it("เจ้าของดูออเดอร์ของตัวเองได้", async () => {
    const created = await createOrder();
    const res = await request(app)
      .get(`/api/v1/orders/${created.body.data.id}`)
      .set(auth(customerToken));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.items[0].name).toBe("ข้าวผัดกุ้ง");
    expect(res.body.data.total).toBe(120);
  });

  it("ตอบ 403 เมื่อดูออเดอร์ของคนอื่น", async () => {
    // ออเดอร์ 2 ใน seed เป็นของสมหญิง
    const res = await request(app)
      .get("/api/v1/orders/2")
      .set(auth(customerToken));
    expect(res.statusCode).toBe(403);
  });

  it("ตอบ 404 เมื่อไม่พบออเดอร์", async () => {
    const res = await request(app)
      .get("/api/v1/orders/999999")
      .set(auth(adminToken));
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /api/v1/orders/:id/status", () => {
  it("ตอบ 403 เมื่อไม่ใช่ admin", async () => {
    const created = await createOrder();
    const res = await request(app)
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set(auth(customerToken))
      .send({ status: "preparing" });
    expect(res.statusCode).toBe(403);
  });

  it("admin เปลี่ยนสถานะตามลำดับได้ แต่ข้ามไปสถานะที่ไม่อนุญาตไม่ได้", async () => {
    const created = await createOrder();
    const url = `/api/v1/orders/${created.body.data.id}/status`;

    // pending ข้ามไป delivered ไม่ได้
    const skip = await request(app)
      .patch(url)
      .set(auth(adminToken))
      .send({ status: "delivered" });
    expect(skip.statusCode).toBe(409);
    expect(skip.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    // pending ไป preparing ได้
    const next = await request(app)
      .patch(url)
      .set(auth(adminToken))
      .send({ status: "preparing" });
    expect(next.statusCode).toBe(200);
    expect(next.body.data.status).toBe("preparing");
  });

  it("ตอบ 400 เมื่อ status ไม่อยู่ในรายการ", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/1/status")
      .set(auth(adminToken))
      .send({ status: "flying" });
    expect(res.statusCode).toBe(400);
  });
});
