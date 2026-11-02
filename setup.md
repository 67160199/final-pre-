node -v
npm.cmd -v
docker --version
docker compose version

docker info

Get-Location
Test-Path .\package.json
Test-Path .\docker-compose.yml

Copy-Item .\.env.example .\.env
notepad .\.env

docker compose up -d
docker compose ps
docker compose logs --tail 30 mysql

npm.cmd install
npm.cmd run seed
npm.cmd run check

npm.cmd test

docker compose up -d
npm.cmd run check
npm.cmd test

#หากต้องการหยุดชั่วคราวโดยเก็บ container เดิม:
docker compose stop

notepad .env
#DB_HOST=127.0.0.1
DB_PORT=3309
DB_USER=root
DB_PASSWORD=root
DB_NAME=exam_db

$env:DB_PORT = "3309"

npm.cmd run seed

คู่มือติดตั้ง final-exam-setup ทีละขั้นตอน
คู่มือนี้อ้างอิงไฟล์ final-exam-setup.zip ที่แนบมา ใช้ Windows และ PowerShell เป็นตัวอย่าง ทำตามลำดับและตรวจผลก่อนขึ้นขั้นถัดไป

ชุดนี้เตรียม MySQL, Node.js, Express, Supertest และ JWT สำหรับสอบ ยังไม่มีแอปเว็บหรือคำสั่ง npm start / npm run dev
1. เตรียมโปรแกรม
ต้องมี Node.js พร้อม npm และ Docker Desktop หากติดตั้งแล้วให้ข้ามการติดตั้งและตรวจคำสั่งได้เลย
1. ดาวน์โหลด Node.js รุ่น LTS จาก https://nodejs.org/ และติดตั้งตามหน้าจอโดยเปิดตัวเลือกเพิ่ม PATH
2. ดาวน์โหลด Docker Desktop สำหรับ Windows จาก https://www.docker.com/products/docker-desktop/ และทำตามตัวติดตั้ง หากโปรแกรมขอ WSL 2 หรือให้รีสตาร์ต ให้ทำตามก่อน
3. เปิด Docker Desktop และรอให้ Docker Engine พร้อมใช้งาน ใช้โหมด Linux containers สำหรับ MySQL ในชุดนี้
4. ปิดแล้วเปิด PowerShell ใหม่หลังติดตั้งโปรแกรม
พิมพ์ทีละคำสั่ง:
node -v
npm.cmd -v
docker --version
docker compose version
ผลที่ควรเห็น: แต่ละคำสั่งแสดงหมายเลขเวอร์ชัน ไม่มีข้อความว่าไม่รู้จักคำสั่ง

จากนั้นตรวจว่า Docker ทำงานจริง:
docker info
ผ่านเมื่อ: มีรายละเอียดฝั่ง Server และไม่มีข้อความเชื่อมต่อ Docker Engine ไม่ได้
คู่มือนี้ใช้ npm.cmd ซึ่งเรียก npm บน Windows ได้ และช่วยหลีกเลี่ยงปัญหา PowerShell บล็อก npm.ps1 หากใช้ npm ได้อยู่แล้ว สามารถใช้แทนกันได้

2. แตก ZIP และเข้าโฟลเดอร์ให้ถูก
1. คลิกขวา final-exam-setup.zip แล้วเลือก Extract All / แยกทั้งหมด
2. เปิดโฟลเดอร์ที่แตกออกมา เข้าไปจนเห็น package.json และ docker-compose.yml อยู่ในหน้าเดียวกัน
3. คลิกแถบที่อยู่ใน File Explorer พิมพ์ powershell แล้วกด Enter เพื่อเปิด PowerShell ที่โฟลเดอร์นั้น
ตรวจว่าอยู่ถูกที่:
Get-Location
Test-Path .\package.json
Test-Path .\docker-compose.yml
ผลที่ควรเห็น: สองคำสั่งท้ายเป็น True ทั้งคู่ หากเป็น False ต้องเข้าโฟลเดอร์ด้านในอีกชั้นก่อน

หากใช้ VS Code ให้เปิดโฟลเดอร์นี้ด้วย File > Open Folder แล้วเลือก Terminal > New Terminal จากนั้นตรวจด้วยคำสั่งข้างบนเช่นกัน
3. สร้างไฟล์ .env
Copy-Item .\.env.example .\.env
notepad .\.env
หากมี .env อยู่แล้ว ให้เปิดตรวจค่าก่อน ไม่ต้องคัดลอกทับค่าที่ตั้งไว้

เนื้อหาตามชุดติดตั้งต้องเป็น:
DB_HOST=127.0.0.1
DB_PORT=3309
DB_USER=root
DB_PASSWORD=root
DB_NAME=exam_db
บันทึกไฟล์แล้วปิด Notepad ชื่อต้องเป็น .env ไม่ใช่ .env.txt
ค่า	ใช้ทำอะไร
DB_HOST	เชื่อมต่อ MySQL บนเครื่องตัวเอง
DB_PORT	Node.js เชื่อมผ่านพอร์ต 3309 ของเครื่อง
DB_USER	ผู้ใช้ฐานข้อมูล root
DB_PASSWORD	รหัส root ที่ compose ของชุดนี้กำหนดไว้
DB_NAME	ชื่อฐานข้อมูล exam_db


ไม่ต้องใช้รหัส MySQL เดิมของเครื่อง ถ้าทำตามเส้นทาง Docker นี้ เพราะใช้ MySQL ของชุดติดตั้งแยกต่างหาก
config.js ใน ZIP โหลด .env ให้เอง จึงไม่ต้องเพิ่มแพ็กเกจ dotenv สำหรับชุดนี้ และค่าที่มีอยู่ใน environment ของ PowerShell จะมีลำดับความสำคัญเหนือ .env

4. เปิดฐานข้อมูล MySQL
เปิด Docker Desktop ค้างไว้ แล้วรันจากโฟลเดอร์โครงการ:
docker compose up -d
ครั้งแรกต้องดาวน์โหลด image จึงอาจใช้เวลาหลายนาที ต้องมีอินเทอร์เน็ต

ตรวจสถานะ:
docker compose ps
docker compose logs --tail 30 mysql
ผลที่ควรเห็น: service mysql อยู่สถานะ Up หรือ running และเมื่อพร้อมใช้งานจะมีข้อความ ready for connections สำหรับ MySQL ที่พอร์ตภายใน 3306

พอร์ต 3309:3306 หมายถึงเครื่อง Windows รับที่ 3309 แล้วส่งเข้า MySQL ภายใน container ที่ 3306 ดังนั้น .env ใช้ 3309

หาก container เพิ่งเริ่ม ให้รอจนฐานข้อมูลพร้อมก่อนทำขั้นใส่ข้อมูล สคริปต์ seed มีการลองเชื่อมต่อซ้ำ แต่ถ้ายังไม่พร้อมอาจล้มเหลวได้
5. ติดตั้งแพ็กเกจ Node.js
npm.cmd install
ผลที่ควรเห็น: ติดตั้งเสร็จและกลับมาที่บรรทัดรับคำสั่ง มีโฟลเดอร์ node_modules และโดยปกติจะสร้าง package-lock.json

แพ็กเกจมาจาก package.json ที่ให้มา ไม่ต้องติดตั้ง Express, mysql2, jsonwebtoken, Jest หรือ Supertest แยกทีละตัว

ข้อความแจ้ง funding หรือ audit เพียงอย่างเดียวไม่ได้แปลว่าติดตั้งล้มเหลว อย่าเพิ่งใช้ npm audit fix --force เพราะอาจเปลี่ยนเวอร์ชันที่ชุดสอบใช้อยู่
6. สร้างตารางและใส่ข้อมูลตัวอย่าง
ก่อนรัน: seed.sql จะลบและสร้างตาราง order_items, orders, menu_items ใหม่ในฐานข้อมูลที่ตั้งค่าไว้ ข้อมูลเดิมในสามตารางจะหาย จึงควรใช้ exam_db สำหรับชุดฝึกนี้เท่านั้น
npm.cmd run seed
ผลที่ควรเห็น:
seed exam_db สำเร็จ
คำสั่งนี้ใช้ scripts/seed.js อ่าน seed.sql แล้วสร้างข้อมูลดังนี้:
ตาราง	ข้อมูลเริ่มต้น
menu_items	เมนูอาหารและเครื่องดื่ม 22 รายการ
orders	คำสั่งซื้อ 3 รายการ
order_items	รายการสินค้าในคำสั่งซื้อ 5 แถว


ไม่ต้องเปิดโปรแกรม SQL หรือวาง seed.sql เอง ถ้าคำสั่งนี้สำเร็จ
7. ตรวจการเชื่อมต่อ
npm.cmd run check
ผลที่ควรเห็น:
เชื่อมต่อฐานข้อมูลได้ พบเมนู 22 รายการ
หมายความว่า Node.js เชื่อม MySQL ได้ และข้อมูลเมนูถูกใส่แล้ว
8. รันเทสต์ทั้งหมด
npm.cmd test
ผลที่ควรเห็น: เทสต์ผ่านทั้ง 3 ตัว สรุปประมาณนี้:
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
เทสต์ตรวจการเชื่อมฐานข้อมูลและมีเมนูอย่างน้อย 20 รายการ, ตรวจ Express กับ Supertest และตรวจการสร้าง/ตรวจ JWT

เมื่อขั้น 7 ได้ 22 รายการ และขั้น 8 ผ่าน 3 เทสต์ ถือว่าชุดเตรียมสภาพแวดล้อมพร้อมแล้ว

ไม่ต้องเปิด localhost:3000 เพราะชุดนี้ยังไม่มีเซิร์ฟเวอร์เว็บที่เปิดค้างไว้ /ping ถูกสร้างภายในเทสต์เท่านั้น
9. การใช้งานครั้งต่อไป
หากยังมี container เดิมอยู่ ให้เปิด Docker Desktop แล้วเข้าโฟลเดอร์เดิม:
docker compose up -d
npm.cmd run check
npm.cmd test
ไม่ต้อง npm install ใหม่ทุกครั้ง และไม่ต้อง seed ซ้ำหากยังมีตารางและข้อมูลอยู่

หากต้องการหยุดชั่วคราวโดยเก็บ container เดิม:
docker compose stop
เปิดกลับด้วย docker compose up -d ได้

README เดิมมีคำสั่ง docker compose down ซึ่งหยุดและลบ container ด้วย ไฟล์ compose นี้ไม่ได้กำหนด volume ที่ตั้งชื่อไว้สำหรับนำข้อมูลกลับมาใช้อัตโนมัติ จึงอย่าคาดว่าข้อมูลจะกลับมาเมื่อสร้าง container ใหม่ หลังใช้ down แล้วเปิดใหม่ หากยังไม่มีตารางให้รัน seed ใหม่ตามขั้น 6
10. แก้ปัญหาที่พบบ่อย
ไม่รู้จัก node / npm / docker
ปิดแล้วเปิด Terminal ใหม่ ตรวจว่าติดตั้งโปรแกรมครบ หากยังไม่พบคำสั่ง ให้ตรวจ PATH ของโปรแกรมนั้น
npm.ps1 cannot be loaded / running scripts is disabled
ใช้ npm.cmd ตามคู่มือนี้ เช่น:
npm.cmd install
npm.cmd test
ไม่จำเป็นต้องเปลี่ยน Execution Policy เพื่อทำขั้นตอนเหล่านี้
ENOENT หรือหา package.json ไม่เจอ
อยู่ผิดโฟลเดอร์ ใช้:
Test-Path .\package.json
ต้องได้ True ก่อนรัน npm
Cannot connect to Docker / error during connect
เปิด Docker Desktop รอ Engine พร้อม แล้วตรวจ docker info อีกครั้ง หากโปรแกรมแจ้งเรื่อง WSL หรือ virtualization ให้แก้ตามข้อความของ Docker ก่อนรัน compose ใหม่
พอร์ต 3309 ถูกใช้อยู่ / port is already allocated
ตรวจว่าชุดนี้เปิดอยู่แล้วหรือไม่ด้วย docker compose ps หากเป็นบริการอื่นและไม่ต้องการหยุดบริการนั้น ให้เปลี่ยนพอร์ตของชุดฝึกเป็น 3310 ทั้งสองไฟล์:

ใน docker-compose.yml เปลี่ยนส่วน ports เป็น:
    ports:
      - "3310:3306"
ใน .env เปลี่ยนเป็น:
DB_PORT=3310
แล้วรัน:
docker compose up -d
การเปลี่ยนพอร์ตอาจทำให้ container ถูกสร้างใหม่ หากตารางหายให้รัน seed ใหม่ โดยยอมรับการรีเซ็ตข้อมูลตามขั้น 6 ก่อน
ECONNREFUSED / เชื่อมต่อฐานข้อมูลไม่ได้
ตรวจตามลำดับ:
1. docker compose ps ต้องเห็น mysql ทำงาน
2. docker compose logs --tail 50 mysql ต้องไม่มีข้อผิดพลาดที่ทำให้เริ่มไม่ได้
3. .env ต้องมี DB_HOST=127.0.0.1 และพอร์ตตรงกับด้านซ้ายของ ports ใน compose
4. รอ MySQL พร้อมแล้วรันคำสั่งเดิมใหม่
Access denied for user 'root'
สำหรับ Docker ชุดเดิม ค่าเริ่มต้นคือ DB_USER=root และ DB_PASSWORD=root ตรวจว่าไม่ได้เชื่อมไป MySQL อีกตัวที่พอร์ต 3306 และตรวจ environment ของ Terminal หากเคยตั้ง DB_* ไว้ เพราะอาจทับ .env

หากเคยเปลี่ยนรหัสตอนสร้างฐานข้อมูลมาก่อน ต้องใช้รหัสที่ฐานข้อมูลนั้นตั้งไว้จริง การแก้ MYSQL_ROOT_PASSWORD ใน compose ไม่ได้เปลี่ยนรหัสในฐานข้อมูลเดิมโดยอัตโนมัติ
Table 'exam_db.menu_items' doesn't exist
ยังไม่ได้ใส่ข้อมูล หรือฐานข้อมูลถูกสร้างใหม่ ให้รันขั้น 6 แล้วตรวจขั้น 7 อีกครั้ง การ seed จะรีเซ็ตสามตารางตามที่ระบุไว้
Jest timeout 5000 ms
เทสต์ฐานข้อมูลใช้ timeout ปริยายของ Jest แต่โค้ดลองเชื่อมต่อซ้ำได้นานกว่านั้น ควรให้ npm.cmd run check สำเร็จก่อน แล้วค่อย npm.cmd test

หากฐานข้อมูลเพิ่งเริ่มและต้องการเพิ่มเวลารอเฉพาะการรันครั้งนี้:
npm.cmd test -- --testTimeout=70000
ถ้ายังไม่ผ่าน ให้ตรวจฐานข้อมูลและค่าการเชื่อมต่อ การเพิ่มเวลาไม่แก้รหัสผ่านหรือพอร์ตที่ผิด
npm ERR! Missing script: start หรือ dev
ไฟล์นี้มีเพียง seed, check, test จึงให้ใช้คำสั่งตามคู่มือ ไม่ต้องสร้าง start/dev เพื่อทดสอบชุดนี้
เช็กลิสต์ก่อนจบ
- [ ] node และ npm ใช้ได้
- [ ] Docker Engine ทำงาน
- [ ] อยู่ในโฟลเดอร์ที่มี package.json
- [ ] สร้าง .env และใช้พอร์ตตรงกับ compose
- [ ] MySQL พร้อมรับการเชื่อมต่อ
- [ ] npm.cmd install สำเร็จ
- [ ] npm.cmd run seed สำเร็จ
- [ ] npm.cmd run check พบ 22 รายการ
- [ ] npm.cmd test ผ่าน 3 เทสต์
หมายเหตุ: คู่มือนี้ตรวจเทียบกับโค้ดใน ZIP แล้ว แต่ไม่ได้รัน Docker หรือทดสอบการติดตั้งบนเครื่อง Windows ของคุณจริง ให้ใช้ผลจากแต่ละขั้นเป็นจุดตรวจบนเครื่องของคุณ