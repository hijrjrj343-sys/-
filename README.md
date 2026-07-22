# 🎓 إعدادية القاهرة المهنية الرائدة

المنصة التعليمية الإلكترونية - نظام إدارة متكامل

## 📋 المميزات
- تسجيل دخول وإنشاء حسابات
- تصفح الأقسام المهنية (أمن سيبراني، تجميع حاسوب، ميكانيك، ميكاترونكس، ليزر)
- المواد الدراسية والجداول الأسبوعية
- الامتحانات والنتائج
- دردشة جماعية
- حضور بالـ QR Code
- بطاقات طلابية
- **لوحة تحكم** للمشرفين

## 🚀 التشغيل السريع

```bash
npm install
node server.js
```

ثم افتح `http://localhost:3000`

- حساب المشرف: `admin@school.com` / `admin123`
- لوحة التحكم: `http://localhost:3000/dashboard.html`

## 📱 تثبيت على الجوال (PWA)

1. اشترك في [Render](https://dashboard.render.com) وانشر المشروع
2. افتح الرابط في متصفح Chrome على هاتفك
3. اختر "إضافة إلى الشاشة الرئيسية"

أو استخدم مجلد `apk-builder/` لبناء APK حقيقي (انظر `apk-builder/BUILD.md`)

## 📁 هيكل المشروع

```
├── server.js            # خادم Node.js + API
├── index.html           # التطبيق الرئيسي
├── style.css / app.js   # ستايل ومنطق التطبيق
├── dashboard.html       # لوحة التحكم
├── dashboard.css/.js    # ستايل ومنطق لوحة التحكم
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
├── icons/               # SVG أيقونات
├── apk-builder/         # مشروع APK (Cordova)
└── uploads/             # رفع الملفات
```

## ⚙️ API

| المسار | الطريقة | الوصف |
|--------|--------|-------|
| `/api/login` | POST | تسجيل دخول |
| `/api/register` | POST | إنشاء حساب |
| `/api/users` | GET | قائمة المستخدمين (مشرف) |
| `/api/news` | GET/POST/PUT/DELETE | إدارة الأخبار |
| `/api/exams` | GET/POST/PUT/DELETE | إدارة الامتحانات |
| `/api/attendance` | GET/POST | تسجيل الحضور |
| `/api/messages` | GET/POST | الدردشة |

## 🛠 التقنيات

- Node.js + Express
- SQLite (better-sqlite3)
- HTML5 + CSS3 + JavaScript
- QR Code (qrcodejs, html5-qrcode)
- PWA (Service Worker + Manifest)
