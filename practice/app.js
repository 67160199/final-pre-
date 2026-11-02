// ไฟล์นี้: สร้าง Express app และรวม route ทั้งหมด
// ไม่เรียก listen() ที่นี่ เพื่อให้ Supertest import app ไปทดสอบได้
const express = require("express");
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");

const app = express();

// แปลง JSON ใน request เป็น req.body
app.use(express.json());

// ติดตั้ง route ใต้ path หลัก
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);

// ไม่ตรงกับ route ไหนเลย ตอบ 404
app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "ไม่พบ endpoint นี้" },
  });
});

// รับ error จาก next(err) ต้องมีพารามิเตอร์ครบ 4 ตัว Express จึงรู้ว่าเป็นตัวจัดการ error
app.use((err, req, res, next) => {
  // client ส่ง JSON รูปแบบผิด
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "รูปแบบ JSON ไม่ถูกต้อง" },
    });
  }
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในระบบ" },
  });
});

module.exports = app;
