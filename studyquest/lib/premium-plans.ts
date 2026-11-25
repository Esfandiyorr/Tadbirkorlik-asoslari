/* 💎 Obuna tariflari va talaba ko'radigan holat (server qismi — lib/server/premium.ts). */
export type PlanId = 'oy' | 'yil';
export const PLANS: { id: PlanId; days: number; name: [string, string, string] }[] = [
  { id: 'oy', days: 30, name: ['1 oy', '1 month', '1 месяц'] },
  { id: 'yil', days: 365, name: ['1 yil', '1 year', '1 год'] },
];
/** Administrator obuna muddatini (boshlangan kunidan) shulardan biriga o'zgartiradi. */
export const TERM_CHOICES = [30, 90, 180, 365] as const;
/** Talaba yuborgan to'lov: new — obuna ochilgan, administrator hali tekshirmagan; ok — tasdiqlangan;
    removed — to'lov topilmagan, obuna yopilgan. */
export type ClaimStatus = 'new' | 'ok' | 'removed';
export type MyClaim = { id: string; plan: PlanId; days: number; at: number; status: ClaimStatus };
