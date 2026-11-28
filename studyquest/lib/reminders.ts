/* 🔔 Bosh sahifadagi «Eslatmalar» (binafsha banner ichida, har bir necha soniyada almashadi).
   Ikki xil eslatma:
   · administrator yozgan qisqa eslatmalar (matn, ixtiyoriy havola, muddat va guruh);
   · avtomatik — bugun muddati tugaydigan ball beriladigan mavzular va bugungi jonli o'yin.
   Administrator «Sayt boshqaruvi → 📢 E'lonlar»da nima chiqishini boshqaradi (lib/server/reminders.ts). */

export type Reminder = {
  id: string;
  /** qisqa matn */
  t: string;
  /** bosilganda ochiladi: '#…' (sayt bo'limi), '/…' yoki https://… */
  link?: string;
  /** shu vaqtgacha ko'rinadi (ms) */
  until?: number;
  /** faqat shu guruhga (bo'sh — hammaga) */
  group?: string;
  at: number;
};
export type ReminderAuto = {
  /** bugun muddati tugaydigan, hali to'liq ball olinmagan mavzular */
  topics: boolean;
  /** bugungi jonli test, poyga yoki yozuv marafoni */
  live: boolean;
};
export type Reminders = { items: Reminder[]; auto: ReminderAuto };

export const REMINDER_MAX = 20;
export const REMINDER_TEXT_MAX = 160;
/** Eslatmalar shuncha vaqtda almashadi. */
export const REMINDER_ROTATE_MS = 6000;
export const DEFAULT_REMINDERS: Reminders = { items: [], auto: { topics: true, live: true } };

/** Talabaga tegishli eslatmalar: muddati o'tmagan va guruhi mos (yoki hammaga). */
export function remindersFor(
  r: Reminders | null | undefined,
  group: string | undefined,
  now = Date.now(),
): Reminder[] {
  const g = (group || '').trim().toLowerCase();
  return (r?.items || []).filter(
    (x) => (!x.until || x.until > now) && (!x.group || (!!g && x.group.trim().toLowerCase() === g)),
  );
}
