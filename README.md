# Project Falcon ERP - نظام إدارة قطع غيار السيارات

نظام ERP متكامل لإدارة قطع غيار السيارات مع واجهة أمامية (React + TypeScript) وخلفية (Node.js + Express + MySQL).

## المتطلبات

- Node.js 18+
- MySQL 8.0+
- npm أو pnpm

## تثبيت قاعدة البيانات MySQL

```bash
# 1. سجل دخول إلى MySQL
mysql -u root -p

# 2. أنشئ قاعدة البيانات
CREATE DATABASE project_falcon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. أنشئ مستخدم (اختياري)
CREATE USER 'falcon'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON project_falcon.* TO 'falcon'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## إعداد المشروع

```bash
# 1. تثبيت اعتمادات الواجهة الأمامية
npm install

# 2. تثبيت اعتمادات الخلفية
cd server && npm install

# 3. إعداد متغيرات البيئة
cp server/.env.example server/.env
# عدل server/.env ببيانات قاعدة البيانات:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=project_falcon
# JWT_SECRET=your_secret_key
# PORT=5000
```

## تشغيل قاعدة البيانات (Schema + Seed Data)

```bash
# 1. أنشئ الجداول
mysql -u root -p project_falcon < server/src/schema.sql

# أو استخدم السكريبت المدمج:
cd server && npx ts-node src/seed.ts
```

## تشغيل النظام

### الطريقة 1: تشغيل الواجهة والخلفية معاً
```bash
npm run dev:full
```

### الطريقة 2: تشغيل منفصل
```bash
# ترمنال 1 - الخلفية
cd server
npm run dev

# ترمنال 2 - الواجهة الأمامية
npm run dev
```

### بيانات الدخول التجريبية
- **البريد:** admin@falcon.com
- **كلمة المرور:** admin123

## بناء للإنتاج

```bash
# بناء الواجهة الأمامية
npm run build

# بناء الخلفية
cd server && npm run build
```

## هيكل المشروع

```
project-falcon/
├── src/                    # واجهة أمامية (React + Vite)
│   ├── api/               # Axios instance
│   ├── context/           # AuthContext
│   ├── pages/             # Login page
│   └── App.tsx            # Dashboard
├── server/                # خلفية (Node.js + Express)
│   ├── src/
│   │   ├── db.ts          # MySQL connection pool
│   │   ├── schema.sql     # Database schema
│   │   ├── seed.ts        # Seed data
│   │   ├── server.ts      # Main server
│   │   ├── middleware/    # JWT auth
│   │   └── routes/        # API routes
│   └── package.json
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | تسجيل الدخول |
| /api/auth/register | POST | تسجيل مستخدم |
| /api/dashboard/kpi | GET | مؤشرات الأداء |
| /api/dashboard/sales-chart | GET | مخطط المبيعات |
| /api/dashboard/best-products | GET | أفضل المنتجات |
| /api/dashboard/alerts | GET | التنبيهات |
| /api/dashboard/operations | GET | العمليات |
| /api/dashboard/batches | GET | دفعات الاستيراد |
| /api/dashboard/exchange-rates | GET | أسعار العملات |
| /api/products | GET/POST | المنتجات |
| /api/invoices | GET/POST | الفواتير |
| /api/suppliers | GET/POST | الموردين |
| /api/customers | GET/POST | العملاء |
| /api/batches | GET/POST | دفعات الاستيراد |

## التقنيات المستخدمة

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, MySQL2
- **Auth:** JWT, bcryptjs
- **Database:** MySQL 8.0

## ترخيص

© 2025 Project Falcon ERP
