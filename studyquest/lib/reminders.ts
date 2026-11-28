/* 🔔 Bosh sahifadagi «Eslatmalar» (binafsha banner ichida, har bir necha soniyada almashadi).
   Ikki xil eslatma:
   · administrator yozgan qisqa eslatmalar (matn, ixtiyoriy havola va muddat) — hammaga, tanlangan guruhlarga
     yoki tanlangan talabalarga;
   · avtomatik — bugun muddati tugaydigan ball beriladigan mavzular va bugungi jonli o'yin.
   Hammaga atalganlari e'lonlar bilan birga (ochiq), guruh va talabaga atalganlari esa faqat o'sha talabaning
   o'z ma'lumoti bilan keladi — boshqalar o'qiy olmaydi (lib/server/reminders.ts).
   Administrator «Sayt boshqaruvi → 📢 E'lonlar»da yoki «👥 Talabalar bilan ishlash»da boshqaradi. */

export type ReminderUser = { id: string; name: string };
export type Reminder = {
  id: string;
  /** qisqa matn */
  t: string;
  /** bosilganda ochiladi: '#…' (sayt bo'limi), '/…' yoki https://… */
  link?: string;
  /** shu vaqtgacha ko'rinadi (ms) */
  until?: number;
  /** faqat shu guruhlarga */
  groups?: string[];
  /** faqat shu talabalarga */
  users?: ReminderUser[];
  at: number;
};
export type ReminderAuto = {
  /** bugun muddati tugaydigan, hali to'liq ball olinmagan mavzular */
  topics: boolean;
  /** bugungi jonli test, poyga yoki yozuv marafoni */
  live: boolean;
};
export type Reminders = { items: Reminder[]; auto: ReminderAuto };

export const REMINDER_MAX = 40;
export const REMINDER_TEXT_MAX = 160;
export const REMINDER_GROUPS_MAX = 30;
export const REMINDER_USERS_MAX = 100;
/** Eslatmalar shuncha vaqtda almashadi. */
export const REMINDER_ROTATE_MS = 6000;
export const DEFAULT_REMINDERS: Reminders = { items: [], auto: { topics: true, live: true } };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
/** Hammaga atalganmi (guruh ham, talaba ham tanlanmagan). */
export const forEveryone = (r: Reminder) => !r.groups?.length && !r.users?.length;
/** Shu foydalanuvchiga tegishlimi: hammaga, uning guruhiga yoki o'ziga. */
export function reminderFor(r: Reminder, who: { id?: string; group?: string }) {
  if (forEveryone(r)) return true;
  return (
    (!!who.group && !!r.groups?.some((g) => same(g, who.group!))) ||
    (!!who.id && !!r.users?.some((u) => u.id === who.id))
  );
}
/** Talabaga tegishli, muddati o'tmagan eslatmalar. */
export function remindersFor(
  items: Reminder[] | null | undefined,
  who: { id?: string; group?: string },
  now = Date.now(),
): Reminder[] {
  return (items || []).filter((x) => (!x.until || x.until > now) && reminderFor(x, who));
}
