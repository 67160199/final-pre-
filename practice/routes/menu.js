// ไฟล์นี้: ดูรายการเมนู แบ่งหน้าและกรองได้
const express = require("express");
const { pool } = require("../../db");

const router = express.Router();

// GET /api/v1/menu?page=1&limit=10&available=true
router.get("/", async (req, res, next) => {
  try {
    // ค่าใน URL เป็น string จึงแปลงเป็นตัวเลข ถ้าไม่ส่งมาใช้ค่าเริ่มต้น
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const available = req.query.available;

    // ตรวจ input ถ้าผิดตอบ 400
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "page หรือ limit ไม่ถูกต้อง" },
      });
    }

    // เติมเงื่อนไขเฉพาะเมื่อมีการกรอง
    // ? คือ placeholder ส่งค่าแยกจาก SQL เพื่อกัน SQL Injection
    let where = "";
    const params = [];
    if (available === "true" || available === "false") {
      where = "WHERE available = ?";
      params.push(available === "true");
    }

    // นับทั้งหมด เพื่อคำนวณจำนวนหน้า
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM menu_items ${where}`,
      params,
    );
    const totalItems = countRows[0].total;

    // OFFSET คือจำนวนแถวที่ข้าม
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT id, name, price, available FROM menu_items ${where}
       ORDER BY id LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
