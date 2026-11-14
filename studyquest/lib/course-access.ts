/* 🔑 Kursga kirish holati (server: lib/server/course-access.ts). Brauzer va server uchun umumiy turlar. */

/** Nega ochiq: o'qituvchi/administrator, TerDU talabasi, 💎 obuna, administrator ruxsati yoki kurs hammaga ochiq. */
export type CourseVia = 'staff' | 'student' | 'premium' | 'grant' | 'open';
export type CourseEntry = {
  ok: boolean;
  via?: CourseVia;
  /** obuna tugash vaqti (via = premium) */
  until?: number;
  /** «ruxsat so'rash» yuborilgan vaqt (administrator hali ko'rmagan) */
  pending?: number | null;
};
export type CourseGrant = {
  uid: string;
  name: string;
  email?: string;
  at: number;
  by: string;
};
export type CourseRequest = {
  uid: string;
  name: string;
  email?: string;
  at: number;
  note?: string;
};
