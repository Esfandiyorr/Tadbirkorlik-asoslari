/* 💎 Obuna: talaba muddatni (1 oy yoki 1 yil) o'zi tanlaydi, narx ixtiyoriy — istalgan summani to'laydi. Obuna darhol
   tanlangan muddatga ochiladi; administrator to'lovni tekshiradi (server qismi — lib/server/premium.ts). */
export type PlanId = 'oy' | 'yil';
export const PLANS: { id: PlanId; days: number; name: [string, string, string] }[] = [
  { id: 'oy', days: 30, name: ['1 oy', '1 month', '1 месяц'] },
  { id: 'yil', days: 365, name: ['1 yil', '1 year', '1 год'] },
];
export const planName = (days: number, lang: string) => {
  const p = PLANS.find((x) => x.days === days);
  if (!p) return '';
  return lang === 'en' ? p.name[1] : lang === 'ru' ? p.name[2] : p.name[0];
};
/** Administrator obuna muddatini (boshlangan kunidan) shulardan biriga o'zgartiradi. */
export const TERM_CHOICES = [30, 90, 180, 365] as const;
/** Talaba yuborgan to'lov: new — obuna ochilgan, administrator hali tekshirmagan; ok — tasdiqlangan;
    removed — to'lov topilmagan, obuna yopilgan. */
export type ClaimStatus = 'new' | 'ok' | 'removed';
export type MyClaim = { id: string; amount: number; days: number; at: number; status: ClaimStatus };
