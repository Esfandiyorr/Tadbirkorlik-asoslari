/* 🛍 2-e'lon oynasi (yon menyu pastida): mahsulotlar, kurslar va grant dasturlari reklamasi.
   Server ham, brauzer ham ishlatadigan umumiy turlar (server qismi — lib/server/promo.ts). */

export const PROMO_KINDS = ['product', 'course', 'grant', 'other'] as const;
export type PromoKind = (typeof PROMO_KINDS)[number];
export type PromoItem = {
  id: string;
  kind: PromoKind;
  /** sarlavha */
  h: string;
  /** qisqa matn */
  t?: string;
  /** https://… yoki sayt ichidagi #bo'lim */
  link?: string;
  /** tugma yozuvi (bo'lmasa — «Batafsil») */
  cta?: string;
  /** shu vaqtgacha ko'rinadi */
  until?: number;
  at: number;
  /** rasm manzili (/api/site/img/pr-<id>?v=…) */
  img?: string;
  /** saytga kirganda har kimga bir marta katta oynada chiqadi */
  pop?: boolean;
};
export const PROMO_KIND: Record<PromoKind, { icon: string; name: [string, string, string] }> = {
  product: { icon: '🛍️', name: ['Mahsulot', 'Product', 'Товар'] },
  course: { icon: '🎓', name: ['Kurs', 'Course', 'Курс'] },
  grant: { icon: '💰', name: ['Grant dasturi', 'Grant programme', 'Грантовая программа'] },
  other: { icon: '📣', name: ['E’lon', 'Notice', 'Объявление'] },
};
/** E'lon «yangi» deb belgilanadigan muddat. */
export const FRESH_MS = 3 * 86400000;
