/**
 * تحويل رسوم SVG (من spir-art) إلى Textures بدقة الشاشة.
 * الرسم يصير مرة وحدة بالبداية (bake) وبعدها كلشي sprites سريعة.
 * الـ Texture حجمها «منطقي» (نفس w×h) وبكسلاتها مضروبة بـ px حتى تبقى حادة.
 */
import { CanvasSource, Texture } from 'pixi.js';

export type ArtDef = { svg: string; w: number; h: number };

function rasterize(def: ArtDef, px: number): Promise<Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(def.w * px));
      c.height = Math.max(1, Math.round(def.h * px));
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      resolve(new Texture({ source: new CanvasSource({ resource: c, resolution: px }) }));
    };
    img.onerror = () => resolve(Texture.WHITE);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(def.svg);
  });
}

/** يحوّل مجموعة رسوم لـ Textures (بالتوازي) */
export async function bake<K extends string>(defs: Record<K, ArtDef>, px: number): Promise<Record<K, Texture>> {
  const keys = Object.keys(defs) as K[];
  const list = await Promise.all(keys.map((k) => rasterize(defs[k], px)));
  const out = {} as Record<K, Texture>;
  keys.forEach((k, i) => (out[k] = list[i]));
  return out;
}
