ทำทีละขั้น

เปิด Docker Desktop ให้ทำงานก่อน แล้วเปิด terminal ในโฟลเดอร์ที่แตก zip ไว้ (โฟลเดอร์ที่มี package.json)

1. สร้างไฟล์ตั้งค่า คัดลอก .env.example เป็น .env ซึ่งเก็บค่าเชื่อมต่อฐานข้อมูล

copy .env.example .env

2. เปิดฐานข้อมูล Docker จะสร้าง MySQL 8.0 ให้ ใช้พอร์ต 3309 ของเครื่องเรา แล้วรอประมาณ 20 วินาที

docker compose up -d

3. ติดตั้งแพ็กเกจ ได้แก่ Express, mysql2, JWT, Jest และ Supertest ซึ่งจะอยู่ใน node_modules

npm install

4. ใส่ข้อมูลตัวอย่าง รัน seed.sql เพื่อสร้างตารางเมนูและออเดอร์

npm run seed

5. ตรวจการเชื่อมต่อ ต้องขึ้นว่าพบเมนู 22 รายการ

npm run check

6. ทดสอบเครื่องมือ ต้องผ่าน 3 เทสต์
npm test

ถ้าเจอปัญหา
อาการ	สาเหตุ	วิธีแก้
docker เชื่อมต่อไม่ได้	Docker Desktop ยังไม่เปิด	เปิดโปรแกรม รอให้พร้อม แล้วรันใหม่
พอร์ต 3309 ถูกใช้อยู่	มีโปรแกรมอื่นใช้พอร์ตนี้	เปลี่ยน DB_PORT ใน .env และเลขตัวหน้าใน docker-compose.yml ("3309:3306") ให้ตรงกัน
Access denied	รหัสผ่านใน .env ไม่ตรงกับ Docker	ใช้ DB_PASSWORD=root ตาม .env.example
Unknown database หรือไม่พบตาราง	ยังไม่ได้ seed หรือต่อผิดฐานข้อมูล	เช็ก .env ว่าใช้พอร์ต 3309 แล้วรัน npm run seed