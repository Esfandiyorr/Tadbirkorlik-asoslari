/* 🔑 Kursga kirish holati (server: lib/server/course-access.ts). Brauzer va server uchun umumiy turlar. */

export type CourseVia = 'staff' | 'student' | 'grant';
export type CourseEntry = {
  ok: boolean;
  via?: CourseVia;
  /** «ruxsat so'rash» yuborilgan vaqt (administrator hali ko'rmagan) */
  pending?: number | null;
  /** 🎓 «Talabaman» deb guruhi bilan yozilgan bo'lsa — guruh (o'qituvchi tasdiqlashini kutmoqda) */
  group?: string;
};
export type CourseGrant = {
  uid: string;
  name: string;
  email?: string;
  /** 🎓 talaba sifatida yozilganda ko'rsatgan guruhi */
  group?: string;
  at: number;
  by: string;
};
export type CourseRequest = {
  uid: string;
  name: string;
  email?: string;
  /** 🎓 kursni boshlaganda «Talabaman» deb yozgan guruhi */
  group?: string;
  at: number;
  note?: string;
};
/** 💳 Pullik kurs: narx va to'lov yo'riqnomasi (administrator «🔑 Kursga ruxsat» bo'limida yozadi). */
export type CourseShop = { price: string; how: string };
/** Foydalanuvchining pullik kursdagi holati (kira oladimi, so'rov yuborganmi) va kurs narxi. */
export type PaidCourseState = CourseEntry & CourseShop;
/** Asosiy fan («Tadbirkorlik asoslari») — kursga ruxsat bo'limidagi birinchi yorliq. */
export const MAIN_COURSE_ID = 'tad-asoslari';
