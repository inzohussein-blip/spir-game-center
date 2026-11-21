// ملفات الخطوط تتحوّل لروابط data وقت البناء (esbuild: loader dataurl)
declare module '*.woff2' {
  const url: string;
  export default url;
}

// يثبّت بدائل لـ eval داخل Pixi (حتى يشتغل ويّا سياسة الأمان CSP)
declare module 'pixi.js/unsafe-eval';
