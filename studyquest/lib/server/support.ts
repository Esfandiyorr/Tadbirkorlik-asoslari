import 'server-only';
import { z } from 'zod';
import { ApiError, check } from './auth';
import { demo, legacyDb } from './repository';
import type { SupportMessage } from '../types';

/* «Adminga xabar»: talaba yoki o'qituvchi administratorga murojaat yozadi, administrator javob beradi.
   Asosiy (Realtime) bazada saqlanadi: support/<foydalanuvchi>/<xabar>. Demo muhitda — xotirada. */
export const supportCategories = ['tech', 'grade', 'account', 'idea', 'other'] as const;
type Who = { id: string; name: string; role: string; classId?: string };

const memory = ((
  globalThis as { __sqSupport?: Map<string, Record<string, SupportMessage>> }
).__sqSupport ??= new Map());
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const staff = (a: Who) => a.role === 'admin' || a.role === 'teacher';

async function readUser(uid: string): Promise<Record<string, SupportMessage>> {
  if (demo()) return memory.get(uid) || {};
  return ((
    await legacyDb()
      .ref('support/' + uid)
      .get()
  ).val() || {}) as Record<string, SupportMessage>;
}
async function readAll(): Promise<Record<string, Record<string, SupportMessage>>> {
  if (demo()) return Object.fromEntries(memory);
  return ((await legacyDb().ref('support').limitToLast(300).get()).val() || {}) as Record<
    string,
    Record<string, SupportMessage>
  >;
}
async function write(uid: string, id: string, value: SupportMessage) {
  if (demo()) {
    memory.set(uid, { ...(memory.get(uid) || {}), [id]: value });
    return;
  }
  await legacyDb()
    .ref('support/' + uid + '/' + id)
    .set(value);
}
const sorted = (list: SupportMessage[]) => list.sort((a, b) => b.at - a.at);

/** Foydalanuvchi o'z murojaatlarini, administrator/o'qituvchi esa hammasini ko'radi. */
export async function supportList(a: Who, inbox: boolean) {
  if (inbox) {
    check(staff(a), 403, 'Bu bo‘lim faqat administrator uchun.');
    const all = await readAll();
    return {
      messages: sorted(Object.values(all).flatMap((x) => Object.values(x || {}))).slice(0, 300),
    };
  }
  return { messages: sorted(Object.values(await readUser(keyOf(a.id)))) };
}

const sendSchema = z
  .object({ cat: z.enum(supportCategories), text: z.string().trim().min(5).max(1500) })
  .strict();
const replySchema = z
  .object({
    uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
    id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
    text: z.string().trim().max(1500).optional(),
    status: z.enum(['read', 'answered', 'closed']).optional(),
  })
  .strict();

export async function supportAct(a: Who, action: string, input: unknown, now = Date.now()) {
  if (action === 'send') {
    const v = sendSchema.parse(input);
    const uid = keyOf(a.id),
      mine = Object.values(await readUser(uid));
    // Ko'p xabar yuborishning oldini olish: bir soatda 5 tadan ko'p emas.
    check(
      mine.filter((m) => now - m.at < 3600000).length < 5,
      429,
      'Bir soatda 5 tadan ortiq xabar yuborib bo‘lmaydi. Birozdan keyin urinib ko‘ring.',
    );
    const id = 'm' + now.toString(36) + Math.random().toString(36).slice(2, 6);
    const message: SupportMessage = {
      id,
      uid,
      name: a.name.slice(0, 80),
      role: a.role,
      group: (a.classId || '').slice(0, 40),
      cat: v.cat,
      text: v.text,
      at: now,
      status: 'new',
    };
    await write(uid, id, message);
    return { message };
  }
  if (action === 'reply') {
    check(staff(a), 403, 'Javobni faqat administrator yozadi.');
    const v = replySchema.parse(input);
    const current = (await readUser(v.uid))[v.id];
    if (!current) throw new ApiError(404, 'Xabar topilmadi');
    const next: SupportMessage = {
      ...current,
      status: v.text ? 'answered' : v.status || 'read',
      ...(v.text ? { reply: { text: v.text, at: now, by: a.name.slice(0, 80) } } : {}),
    };
    await write(v.uid, v.id, next);
    return { message: next };
  }
  throw new ApiError(400, 'Noma’lum amal');
}
