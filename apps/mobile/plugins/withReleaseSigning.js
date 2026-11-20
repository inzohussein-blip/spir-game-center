/* eslint-disable @typescript-eslint/no-require-imports -- إضافات Expo تنكتب بصيغة CommonJS */
// توقيع نسخة الأندرويد بمفتاح «Spir Games» الخاص (بدل المفتاح التجريبي العام)
// المفتاح ما ينحفظ بالمستودع: البناء على GitHub يكتبه من الأسرار ويمرّر مكانه وكلمة سره كخصائص Gradle.
// إذا الخصائص مو موجودة (مثلاً بناء محلي) يرجع للمفتاح التجريبي حتى البناء ما يفشل.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (project.hasProperty('SPIR_STORE_FILE')) {
                storeFile file(SPIR_STORE_FILE)
                storePassword SPIR_STORE_PASSWORD
                keyAlias SPIR_KEY_ALIAS
                keyPassword SPIR_KEY_PASSWORD
            }
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
        }`;

function addReleaseSigning(gradle) {
  if (gradle.includes('SPIR_STORE_FILE')) return gradle;
  // 1) إعداد التوقيع بجوه signingConfigs (بعد إعداد debug)
  const sc = gradle.indexOf('signingConfigs {');
  if (sc < 0) throw new Error('withReleaseSigning: signingConfigs not found');
  const debugStart = gradle.indexOf('debug {', sc);
  let debugEnd = gradle.indexOf('}', debugStart);
  // كل أنواع التوقيع (v1 + v2 + v3) حتى مثبّت الحزم بأي تلفون يقبل الملف — نفس المفتاح
  const schemes = '    enableV1Signing true\n            enableV2Signing true\n            enableV3Signing true\n        ';
  gradle = gradle.slice(0, debugEnd) + schemes + gradle.slice(debugEnd);
  debugEnd = gradle.indexOf('}', debugStart);
  gradle = gradle.slice(0, debugEnd + 1) + RELEASE_CONFIG + gradle.slice(debugEnd + 1);
  // 2) نوع البناء release يستخدمه (والتجريبي إذا ماكو مفتاح)
  const bt = gradle.indexOf('buildTypes {');
  const rel = gradle.indexOf('release {', bt);
  const line = gradle.indexOf('signingConfig signingConfigs.debug', rel);
  if (bt < 0 || rel < 0 || line < 0) throw new Error('withReleaseSigning: release buildType not found');
  gradle =
    gradle.slice(0, line) +
    "signingConfig project.hasProperty('SPIR_STORE_FILE') ? signingConfigs.release : signingConfigs.debug" +
    gradle.slice(line + 'signingConfig signingConfigs.debug'.length);
  return gradle;
}

module.exports = (config) =>
  withAppBuildGradle(config, (c) => {
    c.modResults.contents = addReleaseSigning(c.modResults.contents);
    return c;
  });
module.exports.addReleaseSigning = addReleaseSigning;
