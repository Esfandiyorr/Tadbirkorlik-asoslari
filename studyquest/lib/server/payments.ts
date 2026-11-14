import 'server-only';
import { z } from 'zod';
import { siteGet, siteUpdate } from './site-content';
import { grantPremium } from './premium';
import { grantAvatarPass } from './avatars';

/* 💳 To'lov tizimi uchun YAGONA kirish nuqtasi. Hozircha to'lovni administrator qo'lda tasdiqlaydi
   («💎 Obuna» va «🎭 Avatarlar» bo'limlari). Click (yoki Payme) bilan shartnoma tuzilgach, ularning «to'lov
   bajarildi» xabari (webhook: /api/pay/click — imzo tekshirilgandan keyin) shu fulfilPayment ni chaqiradi:
     • premium — 💎 obuna (kurs darslari, AI taqdimot, 💎 manbalar, avatar huquqi);
     • avatar  — 🎭 avatar huquqi (top-10 ga kirmasa ham), muddati — «🎭 Avatarlar → Narx va muddat».
   Bir to'lov ikki marta kelsa (tarmoq qayta yuborsa) — ikkinchi marta hech narsa berilmaydi: site/payments/<ref>.
   Click ning maxfiy kaliti (secret key) faqat server muhitida (Vercel → Environment Variables) saqlanadi. */

export const PRODUCTS = ['premium', 'avatar'] as const;
export type Product = (typeof PRODUCTS)[number];
export type Payment = {
  ref: string;
  product: Product;
  uid: string;
  name: string;
  days: number;
  amount: number;
  provider: string;
  at: number;
};
const input = z
  .object({
    ref: z.string().regex(/^[A-Za-z0-9_.:-]{1,100}$/),
    product: z.enum(PRODUCTS),
    uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
    name: z.string().trim().min(1).max(120),
    days: z.number().int().min(1).max(730),
    amount: z.number().min(0),
    provider: z.string().trim().min(1).max(30),
  })
  .strict();
const keyOf = (ref: string) => ref.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

/** To'lov tasdiqlangach: mahsulotni beradi va to'lovni yozib qo'yadi (takror kelsa — o'zgarishsiz). */
export async function fulfilPayment(raw: unknown, now = Date.now()) {
  const p = input.parse(raw);
  const path = 'payments/' + keyOf(p.provider + '_' + p.ref);
  const done = await siteGet<Payment>(path);
  if (done) return { ok: true, repeated: true, payment: done };
  if (p.product === 'premium') await grantPremium(p.uid, p.name, '', p.days, p.provider, now);
  else await grantAvatarPass(p.uid, p.name, p.days, p.provider, now);
  const payment: Payment = { ...p, at: now };
  await siteUpdate({ [path]: payment });
  return { ok: true, repeated: false, payment };
}
