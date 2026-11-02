// ไฟล์นี้: จุดเริ่มต้นของ server มีหน้าที่เดียวคือเปิด port
// วิธีรัน: node practice/server.js
const app = require("./app");
// { port } คือการดึงเฉพาะค่า port ออกจาก object ที่ config.js export มา
const { port } = require("../config");

// listen = เริ่มรอรับ request ที่ port นี้
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
