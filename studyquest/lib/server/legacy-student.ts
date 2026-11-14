import 'server-only';

/* 👥 «Talabalar va baholar»: asl bazadagi talaba yozuvini (students/<id>) o'zgartirish — holat, guruh, amaliy dars
   bahosi va 🔁 testga ikkinchi urinish. RTDB tranzaksiyasi ichida chaqiriladi; undefined — yozuv yo'q (o'zgarmaydi).
   Ikkinchi urinish asl dvigateldagi kabi: prog/<mavzu>/qx — shu paytgacha ishlangan urinishlar soni (undan keyingi
   2 ta urinish yana ball beradi), fx — ochilgan vaqt + 3 kun (o'qituvchi panelidagi «ballari bazaga yetmagan» belgisi
   uchun). */
export type LegacyStudentUpdate = {
  status?: 'ok' | 'pending' | 'blocked';
  group?: string;
  topic?: string;
  mark?: number;
  reopen?: string;
};
export const REOPEN_WINDOW = 3 * 86400000;

export function applyLegacyUpdate(
  value: any,
  u: LegacyStudentUpdate,
  now: number,
  manualPts: number,
) {
  if (!value?.name || !value?.status) return undefined;
  let touched = false;
  if (u.status) {
    value.status = u.status;
    touched = true;
  }
  if (u.group !== undefined && value.learnerType !== 'independent') {
    value.group = u.group;
    touched = true;
  }
  if (u.topic && u.mark !== undefined) {
    const previous = Number(value.manual?.[u.topic] || 0);
    value.manual = { ...value.manual, [u.topic]: u.mark || null };
    value.total = Math.max(
      0,
      Math.round((Number(value.total || 0) + (u.mark - previous) * manualPts) * 10) / 10,
    );
    touched = true;
  }
  if (u.reopen && value.learnerType !== 'independent') {
    const prog = value.prog?.[u.reopen] || {};
    value.prog = {
      ...value.prog,
      [u.reopen]: { ...prog, qx: Number(prog.qa) || 0, fx: now + REOPEN_WINDOW },
    };
  }
  // «updated» faqat boshqa o'zgarishlarda: ikkinchi urinishdan keyin talabaning o'z yozuvi kelganini shu bilan bilamiz
  if (touched) value.updated = now;
  return value;
}
