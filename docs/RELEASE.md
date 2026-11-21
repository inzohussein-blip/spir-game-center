# دليل الإطلاق — Spir Games

## 1. مفتاح التوقيع (مرة وحدة — لا تضيّعه!)

كل التحديثات لازم تتوقّع بنفس المفتاح، وإلا الهاتف ما يثبّت التحديث فوق النسخة القديمة.

```bash
keytool -genkeypair -v -keystore spir-release.keystore -alias spir \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 spir-release.keystore > keystore.b64
```

بمستودع GitHub: **Settings ← Secrets and variables ← Actions** أضف:
- `ANDROID_KEYSTORE_BASE64` = محتوى `keystore.b64`
- `ANDROID_KEYSTORE_PASSWORD` = كلمة السر

احفظ ملف المفتاح وكلمة السر بمكانين آمنين (مو بالمستودع).

## 2. نسخة APK (توزيع مباشر)

1. غيّر `version` بـ `apps/mobile/app.json` (مثلاً `0.3.0`).
2. **Actions ← Android APK ← Run workflow** وأشّر **«انشر كإصدار»**.
3. الملف يطلع بتبويب **Releases**.

## 3. نسخة الآيفون (ويب آب)

1. **Settings ← Pages ← Source: GitHub Actions** (مرة وحدة).
2. ادمج الفرع بـ `main` ← ينشر على `https://inzohussein-blip.github.io/spir-game-center/`.
3. سياسة الخصوصية تنشر ويّاه: `.../privacy.html` (تحتاجها لـ Google Play).

## 4. Google Play

| الخطوة | الملاحظة |
|---|---|
| حساب مطوّر | رسوم مرة وحدة 25$. الحساب الشخصي الجديد يحتاج **اختبار مغلق: 12 مختبِر × 14 يوم** قبل الإنتاج |
| ملف AAB | **Actions ← Android APK ← Run workflow** وأشّر **«ابنِ هم ملف AAB»** ← نزّل `spir-games-play-aab` |
| الجمهور المستهدف | الفئات من 5 سنين لـ 18+ ← يدخل ضمن **سياسة العائلات (Families)** |
| تقييم المحتوى (IARC) | ألعاب ألغاز وأركيد بدون عنف ولا محادثات ولا مشتريات ← متوقع «للجميع» |
| الإعلانات | **لا** |
| أمان البيانات (Data safety) | **ما نجمع ولا نشارك أي بيانات** · البيانات ما تطلع من الجهاز |
| سياسة الخصوصية | `https://inzohussein-blip.github.io/spir-game-center/privacy.html` |
| الصلاحيات | بس الاهتزاز (VIBRATE) — ماكو موقع/كاميرا/مايك |

### صور المتجر
اللقطات بـ `docs/screenshots/` تنفع كبداية (المتجر يحتاج 2–8 لقطات بالطول). الأيقونة: `apps/mobile/assets/icon.png` (512×512 من `public/icon-512.png`).

## 5. قبل كل إصدار

```bash
cd apps/mobile
npm run build:games && npm run typecheck && npm run lint && npm test
```
وجرّب الـ APK على جهاز حقيقي (ويفضّل جهاز ضعيف 2GB RAM).
