/* 💎 Obuna: narx ixtiyoriy — talaba istalgan summani to'laydi, obuna darhol DEFAULT_DAYS ga ochiladi; administrator
   tasdiqlayotganda muddatni (1 oy, 1 yil …) o'zi tanlaydi (server qismi — lib/server/premium.ts). */
export const DEFAULT_DAYS = 30;
/** Administrator obuna muddatini (boshlangan kunidan) shulardan biriga o'zgartiradi. */
export const TERM_CHOICES = [30, 90, 180, 365] as const;
/** Yangi obunani tasdiqlash tugmalari: «✅ 1 oy», «✅ 1 yil». */
export const VERIFY_TERMS = [30, 365] as const;
/** Talaba yuborgan to'lov: new — obuna ochilgan, administrator hali tekshirmagan; ok — tasdiqlangan;
    removed — to'lov topilmagan, obuna yopilgan. */
export type ClaimStatus = 'new' | 'ok' | 'removed';
export type MyClaim = { id: string; amount: number; days: number; at: number; status: ClaimStatus };
