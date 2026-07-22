# 📱 بناء تطبيق APK

## الطريقة 1: PWA - إضافة إلى الشاشة الرئيسية (بدون برمجة)

1. انشر التطبيق على Render/Railway
2. افتح الرابط في كروم على هاتفك
3. اضغط على قائمة كروم ← "إضافة إلى الشاشة الرئيسية"
4. سيظهر التطبيق كأيقونة في هاتفك (يعمل كتطبيق أصلي)

## الطريقة 2: بناء APK باستخدام Cordova

### المتطلبات:
- Node.js (v18+)
- Android SDK (Android Studio)
- Java JDK 17

### الخطوات:

```bash
# 1. ثبّت Cordova
npm install -g cordova

# 2. ادخل مجلد apk-builder
cd apk-builder

# 3. ثبّت المتطلبات
npm install

# 4. أضف منصة Android
cordova platform add android

# 5. ابنِ APK
cordova build android

# 6. ملف APK موجود في:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

ملاحظة: قبل البناء، غير عنوان الخادم في ملفات www/app.js إلى رابط السيرفر الخاص بك.
