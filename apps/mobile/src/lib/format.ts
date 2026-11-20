/** الأرقام العربية-الهندية (٠١٢) والفارسية تتحوّل لأرقام غربية (012) — قاعدة ثابتة بكل التطبيق */
export function toWesternDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
}

/** 1250 → 1,250 */
export const formatNumber = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** تحية حسب الساعة */
export const greetingFor = (hour: number) => (hour >= 4 && hour < 12 ? 'صباح الخير' : 'مساء الخير');
