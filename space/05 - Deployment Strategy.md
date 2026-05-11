GL-Orbit: Deployment Guide

Step 1: Database Setup (Neon.tech)

สร้าง Project ใหม่ใน Neon.tech

คัดลอก DATABASE_URL (Connection String)

Step 2: Environment Variables

สร้างไฟล์ .env สำหรับ Development และตั้งค่าใน Vercel Dashboard:

DATABASE_URL: Connection string จาก Neon

AUTH_SECRET: สุ่ม String ยาวๆ สำหรับจัดการ Session (ใช้ sign JWT)

Step 3: Migration

รัน npx drizzle-kit generate เพื่อสร้าง Migration files

รัน npx drizzle-kit push เพื่ออัปเดตโครงสร้างตารางไปยัง Neon

Step 4: Seed Data

รัน npx tsx scripts/seed-admin.ts --email=admin@example.com --password=yourpassword --username=admin

รัน npx tsx scripts/seed-data.ts เพื่อเพิ่ม mock data (studios, platforms, artists, series, episodes, schedules, users)

Step 5: Vercel Deploy

เชื่อมต่อ GitHub Repository กับ Vercel

เลือก Framework เป็น SvelteKit

ระบบจะจัดการ SSL และ Deploy ให้อัตโนมัติทุกครั้งที่ Push code
