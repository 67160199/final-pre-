// ไฟล์นี้: route สำหรับ login แล้วออก JWT
const express = require("express");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config");

// Router คือกลุ่ม route ย่อย ที่ app.js นำไปติดตั้งใต้ /api/v1/auth
const router = express.Router();

// บัญชีตัวอย่างสำหรับซ้อมเท่านั้น เพราะ seed.sql ไม่มีตาราง users
// ระบบจริงต้องเก็บรหัสผ่านแบบ hash ในฐานข้อมูล
const DEMO_USERS = [
  { username: "somchai", password: "customer123", name: "สมชาย", role: "customer" },
  { username: "admin", password: "admin123", name: "ผู้ดูแล", role: "admin" },
];

// POST /api/v1/auth/login
router.post("/login", (req, res) => {
  // || {} กันกรณีไม่ได้ส่ง body มา จะได้ไม่ error ตอนดึงค่า
  const { username, password } = req.body || {};
  // find คืนสมาชิกตัวแรกที่เงื่อนไขเป็นจริง ถ้าไม่เจอคืน undefined
  const user = DEMO_USERS.find(
    (u) => u.username === username && u.password === password,
  );

  // ใช้ข้อความเดียวกันทั้งกรณี user ผิดและรหัสผิด เพื่อไม่บอกใบ้ว่า username ไหนมีจริง
  if (!user) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      },
    });
  }

  // jwt.sign สร้าง token โดยใส่ข้อมูล (payload) และลงนามด้วย secret
  // payload อ่านได้ทุกคน จึงห้ามใส่รหัสผ่าน
  // expiresIn กำหนดอายุ token
  const token = jwt.sign({ name: user.name, role: user.role }, jwtSecret, {
    expiresIn: "1h",
  });
  // res.json ใช้ status 200 เป็นค่าเริ่มต้น
  res.json({ token });
});

module.exports = router;
