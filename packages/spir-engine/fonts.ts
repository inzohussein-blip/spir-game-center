/**
 * الخطوط مضمّنة داخل اللعبة (بدون نت): Baloo Bhaijaan 2 للنص، وLalezar للعناوين.
 * esbuild يحوّل ملفات woff2 لروابط data (loader: dataurl).
 */
import balooAr600 from '@fontsource/baloo-bhaijaan-2/files/baloo-bhaijaan-2-arabic-600-normal.woff2';
import balooAr800 from '@fontsource/baloo-bhaijaan-2/files/baloo-bhaijaan-2-arabic-800-normal.woff2';
import balooLa600 from '@fontsource/baloo-bhaijaan-2/files/baloo-bhaijaan-2-latin-600-normal.woff2';
import balooLa800 from '@fontsource/baloo-bhaijaan-2/files/baloo-bhaijaan-2-latin-800-normal.woff2';
import lalezarAr from '@fontsource/lalezar/files/lalezar-arabic-400-normal.woff2';
import lalezarLa from '@fontsource/lalezar/files/lalezar-latin-400-normal.woff2';

export const FONT_BODY = 'Baloo Bhaijaan 2';
export const FONT_DISPLAY = 'Lalezar';

const AR = 'U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F';
const LA = 'U+0000-00FF, U+2000-206F, U+2190-21FF, U+2600-27BF';

export async function loadFonts() {
  const faces = [
    new FontFace(FONT_BODY, `url(${balooAr600})`, { weight: '600', unicodeRange: AR }),
    new FontFace(FONT_BODY, `url(${balooLa600})`, { weight: '600', unicodeRange: LA }),
    new FontFace(FONT_BODY, `url(${balooAr800})`, { weight: '800', unicodeRange: AR }),
    new FontFace(FONT_BODY, `url(${balooLa800})`, { weight: '800', unicodeRange: LA }),
    new FontFace(FONT_DISPLAY, `url(${lalezarAr})`, { weight: '400', unicodeRange: AR }),
    new FontFace(FONT_DISPLAY, `url(${lalezarLa})`, { weight: '400', unicodeRange: LA }),
  ];
  await Promise.all(
    faces.map(async (f) => {
      try {
        document.fonts.add(await f.load());
      } catch {
        // إذا خط ما تحمّل نكمل بخط النظام
      }
    }),
  );
}
