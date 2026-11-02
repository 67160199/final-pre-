// ไฟล์นี้: สร้างออเดอร์ ดูออเดอร์ และเปลี่ยนสถานะ
const express = require("express");
const { pool } = require("../../db");
const { authenticateToken, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// สถานะถัดไปที่อนุญาต เช่น pending เปลี่ยนเป็น preparing หรือ cancelled ได้
// [] คือสถานะจบแล้ว เปลี่ยนต่อไม่ได้
const NEXT_STATUS = {
  pending: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// POST /api/v1/orders สร้างออเดอร์ (ต้อง login)
router.post("/", authenticateToken, async (req, res, next) => {
  const items = req.body.items;

  // ตรวจ input ถ้าผิดตอบ 400
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "ต้องส่ง items อย่างน้อย 1 รายการ" },
    });
  }
  for (const item of items) {
    if (!Number.isInteger(item.menuItemId) || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "menuItemId หรือ quantity ไม่ถูกต้อง" },
      });
    }
  }

  // transaction ต้องใช้ connection เส้นเดียว จึงขอจาก pool มาถือไว้
  const conn = await pool.getConnection();
  try {
    // เริ่ม transaction: ทุกคำสั่งหลังจากนี้จะสำเร็จพร้อมกัน หรือยกเลิกพร้อมกัน
    await conn.beginTransaction();

    // ตรวจเมนูทีละรายการ และรวมราคาจากฐานข้อมูล ไม่เชื่อราคาจาก client
    let total = 0;
    for (const item of items) {
      const [rows] = await conn.query(
        "SELECT price, available FROM menu_items WHERE id = ?",
        [item.menuItemId],
      );

      // ไม่พบเมนู ตอบ 404 โดย rollback คือยกเลิก transaction
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          error: { code: "MENU_NOT_FOUND", message: "ไม่พบเมนูนี้" },
        });
      }
      // เมนูมีจริงแต่หมด ตอบ 409
      if (!rows[0].available) {
        await conn.rollback();
        return res.status(409).json({
          error: { code: "MENU_UNAVAILABLE", message: "เมนูนี้หมดแล้ว" },
        });
      }

      total += Number(rows[0].price) * item.quantity;
    }

    // ชื่อลูกค้าเอาจาก token เพื่อไม่ให้สั่งในนามคนอื่น
    const [result] = await conn.query(
      "INSERT INTO orders (customer_name) VALUES (?)",
      [req.user.name],
    );
    // insertId คือ id ของออเดอร์ที่เพิ่งสร้าง
    const orderId = result.insertId;

    // เพิ่มรายการอาหารของออเดอร์นี้ทีละแถว
    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.menuItemId, item.quantity],
      );
    }

    // commit = ยืนยันทั้งหมดลงฐานข้อมูล
    await conn.commit();

    // 201 Created = สร้างข้อมูลใหม่สำเร็จ
    res.status(201).json({
      data: { id: orderId, customerName: req.user.name, status: "pending", total },
    });
  } catch (err) {
    // พลาดกลางทาง ยกเลิกทั้งหมด จะได้ไม่มีข้อมูลค้างครึ่งเดียว
    await conn.rollback();
    next(err);
  } finally {
    // finally ทำงานเสมอ คืน connection เข้า pool
    conn.release();
  }
});

// GET /api/v1/orders/:id เจ้าของหรือ admin เท่านั้น
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);

    // query คืน array เสมอ ถ้าไม่พบจะเป็น array ว่าง ไม่ใช่ error
    if (orders.length === 0) {
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "ไม่พบออเดอร์นี้" },
      });
    }

    const order = orders[0];

    // login แล้วก็ยังดูออเดอร์ของคนอื่นไม่ได้
    if (req.user.role !== "admin" && order.customer_name !== req.user.name) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์ดูออเดอร์นี้" },
      });
    }

    // JOIN เชื่อม order_items กับ menu_items เพื่อเอาชื่อและราคาเมนูมาด้วย
    // oi และ m คือชื่อย่อของตาราง
    const [items] = await pool.query(
      `SELECT m.name, m.price, oi.quantity
       FROM order_items oi
       JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id = ?`,
      [req.params.id],
    );

    let total = 0;
    for (const item of items) {
      total += Number(item.price) * item.quantity;
    }

    res.json({
      data: {
        id: order.id,
        customerName: order.customer_name,
        status: order.status,
        items,
        total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status เฉพาะ admin
router.patch("/:id/status", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const newStatus = req.body.status;

    // Object.keys ดึงชื่อสถานะทั้งหมดจาก NEXT_STATUS
    // ค่าที่ระบบไม่รู้จัก ตอบ 400
    if (!Object.keys(NEXT_STATUS).includes(newStatus)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "status ไม่ถูกต้อง" },
      });
    }

    const [orders] = await pool.query("SELECT status FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "ไม่พบออเดอร์นี้" },
      });
    }

    // ค่าถูกต้อง แต่เปลี่ยนจากสถานะปัจจุบันไม่ได้ ตอบ 409
    const current = orders[0].status;
    if (!NEXT_STATUS[current].includes(newStatus)) {
      return res.status(409).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `เปลี่ยนจาก ${current} เป็น ${newStatus} ไม่ได้`,
        },
      });
    }

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
      newStatus,
      req.params.id,
    ]);

    res.json({ data: { id: Number(req.params.id), status: newStatus } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
