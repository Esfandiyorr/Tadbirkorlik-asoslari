/* 📚 Kutubxona: server ham, brauzer ham ishlatadigan umumiy turlar (server qismi — lib/server/library.ts). */

export const LIBRARY_KINDS = [
  'book',
  'guide',
  'article',
  'video',
  'law',
  'template',
  'other',
] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export type LibraryItem = {
  id: string;
  kind: LibraryKind;
  /** nomi */
  h: string;
  /** muallif yoki manba */
  a?: string;
  /** qisqa izoh */
  t?: string;
  /** https://… havola (obunasiz foydalanuvchiga 💎 manbada berilmaydi) */
  link?: string;
  /** muqova rasmi (/api/site/img/lb-<id>?v=…) */
  img?: string;
  /** 💎 faqat obunachilar uchun */
  pro?: boolean;
  /** 💎 manba, lekin bu foydalanuvchida obuna yo'q — havola yashirilgan */
  locked?: boolean;
  at: number;
};
export const LIBRARY_KIND: Record<LibraryKind, { icon: string; name: [string, string, string] }> = {
  book: { icon: '📕', name: ['Kitob', 'Book', 'Книга'] },
  guide: { icon: '📘', name: ['Qo‘llanma', 'Guide', 'Пособие'] },
  article: { icon: '📰', name: ['Maqola', 'Article', 'Статья'] },
  video: { icon: '🎬', name: ['Video', 'Video', 'Видео'] },
  law: { icon: '⚖️', name: ['Qonun va hujjat', 'Law or document', 'Закон и документ'] },
  template: { icon: '📄', name: ['Namuna', 'Template', 'Шаблон'] },
  other: { icon: '🔗', name: ['Boshqa', 'Other', 'Другое'] },
};

/* 💎 Obuna (premium) — umumiy turlar (server qismi — lib/server/premium.ts). */
export type PremiumInfo = {
  /** narx matni, masalan «25 000 so'm / oy» */
  price: string;
  /** qanday to'lash (talabaga ko'rsatiladi) */
  how: string;
  /** obunasiz foydalanuvchiga nechta bepul sun'iy intellekt taqdimoti */
  free: number;
};
export type PremiumState = {
  /** obuna amalda (o'qituvchi va administratorda doim) */
  active: boolean;
  /** shu vaqtgacha (0 — yo'q) */
  until: number;
  staff: boolean;
};
