// ไฟล์นี้: middleware ตรวจสิทธิ์
// เรียก next() = ผ่านไปขั้นถัดไป, เรียก res.status(...) = จบตรงนี้
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config");

// ตรวจว่าเป็นใคร ถ้าไม่ผ่านตอบ 401
function authenticateToken(req, res, next) {
  // client ส่ง header รูปแบบ Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "ต้องส่ง Bearer token" },
    });
  }

  const token = header.split(" ")[1];

  // jwt.verify โยน error ถ้า token ผิดหรือหมดอายุ
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "token ไม่ถูกต้องหรือหมดอายุ" },
    });
  }
}

// ตรวจว่าเป็น admin ถ้าไม่ใช่ตอบ 403 ต้องวางหลัง authenticateToken
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "เฉพาะ admin เท่านั้น" },
    });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
