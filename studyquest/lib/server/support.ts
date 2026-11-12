import 'server-only';
import { z } from 'zod';
import { ApiError, check } from './auth';
import { demo, legacyDb } from './repository';
import type { SupportMessage, SupportThread } from '../types';

/* «Adminga xabar» — Telegramdek suhbat: talaba (yoki o'qituvchi) va administrator bir-biriga yozadi, istalgan
   xabarga javob (iqtibos bilan) qaytarish mumkin. Asosiy (Realtime) bazada: support/<suhbat egasi>/<xabar>;
   har bir xabar — alohida yozuv, «from» — kim yozgani. Xabarlar 7 kundan keyin avtomatik o'chiriladi (o'qishda
   eskilari bazadan ham olib tashlanadi). Eski yozuvlardagi «reply» (xabar ichidagi javob) alohida xabar bo'lib
   ko'rsatiladi. Demo muhitda — xotirada. */
export const supportCategories = [
  'tech',
  'grade',
  'account',
  'idea',
  'avatar',
  'report', // 🚩 chatdagi xabar yoki foydalanuvchi ustidan shikoyat
  'other',
] as const;
export const SUPPORT_KEEP_MS = 7 * 86400000;
type Who = { id: string; name: string; role: string; classId?: string };
type Raw = Record<string, SupportMessage>;

const memory = ((globalThis as { __sqSupport?: Map<string, Raw> }).__sqSupport ??= new Map());
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const staff = (a: Who) => a.role === 'admin' || a.role === 'teacher';
const snippet = (t: string) => (t.length > 140 ? t.slice(0, 139) + '…' : t);
const newId = (now: number) => 'm' + now.toString(36) + Math.random().toString(36).slice(2, 6);
/** Yozuvning eng so'nggi vaqti (eski yozuvda javob keyinroq yozilgan bo'lishi mumkin). */
const lastAt = (m: SupportMessage) => Math.max(m.at || 0, m.reply?.at || 0);

async function readUser(uid: string): Promise<Raw> {
  if (demo()) return { ...(memory.get(uid) || {}) };
  return ((
    await legacyDb()
      .ref('support/' + uid)
      .get()
  ).val() || {}) as Raw;
}
async function readAll(): Promise<Record<string, Raw>> {
  if (demo()) return Object.fromEntries([...memory].map(([k, v]) => [k, { ...v }]));
  return ((await legacyDb().ref('support').limitToLast(300).get()).val() || {}) as Record<
    string,
    Raw
  >;
}
/** Bir nechta xabarni birdan yozish yoki o'chirish (null). */
async function update(uid: string, patch: Record<string, SupportMessage | null>) {
  if (!Object.keys(patch).length) return;
  if (demo()) {
    const cur = { ...(memory.get(uid) || {}) };
    for (const [id, v] of Object.entries(patch))
      if (v === null) delete cur[id];
      else cur[id] = v;
    if (Object.keys(cur).length) memory.set(uid, cur);
    else memory.delete(uid);
    return;
  }
  await legacyDb()
    .ref('support/' + uid)
    .update(patch);
}
/** 7 kundan eski yozuvlarni bazadan o'chiradi va qolganini qaytaradi. */
async function fresh(uid: string, raw: Raw, now: number) {
  const old = Object.entries(raw).filter(([, m]) => !m || now - lastAt(m) > SUPPORT_KEEP_MS);
  if (old.length) {
    await update(uid, Object.fromEntries(old.map(([id]) => [id, null]))).catch(() => {});
    for (const [id] of old) delete raw[id];
  }
  return raw;
}
/** Yozuvlardan suhbat: eski «reply» — alohida administrator xabari; vaqt bo'yicha (eskisidan yangisiga). */
function expand(raw: Raw, now: number): SupportMessage[] {
  const out: SupportMessage[] = [];
  for (const [id, m] of Object.entries(raw)) {
    if (!m || typeof m.text !== 'string') continue;
    const { reply, ...rest } = m;
    out.push({ ...rest, id, from: m.from || 'user' });
    if (reply?.text)
      out.push({
        id: id + '-r',
        uid: m.uid,
        from: 'staff',
        name: reply.by,
        role: 'admin',
        group: m.group,
        cat: 'other',
        text: reply.text,
        at: reply.at,
        status: 'read',
        re: { id, text: snippet(m.text), name: m.name },
        to: m.name,
      });
  }
  return out.filter((m) => now - m.at <= SUPPORT_KEEP_MS).sort((a, b) => a.at - b.at);
}
function thread(uid: string, list: SupportMessage[]): SupportThread | null {
  if (!list.length) return null;
  const last = list[list.length - 1],
    owner = [...list].reverse().find((m) => m.from !== 'staff');
  return {
    uid,
    name: owner?.name || last.to || uid,
    group: owner?.group || last.group || '',
    role: owner?.role || 'student',
    last,
    unread: list.filter((m) => m.from !== 'staff' && m.status === 'new').length,
    waiting: last.from !== 'staff',
  };
}

/** Foydalanuvchi o'z suhbatini; administrator/o'qituvchi — suhbatlar ro'yxatini yoki bitta suhbatni ko'radi. */
export async function supportList(a: Who, inbox: boolean, uid?: string, now = Date.now()) {
  if (inbox) {
    check(staff(a), 403, 'Bu bo‘lim faqat administrator uchun.');
    if (uid) {
      check(/^[A-Za-z0-9_-]{1,120}$/.test(uid), 400, 'Suhbat topilmadi');
      return { messages: expand(await fresh(uid, await readUser(uid), now), now) };
    }
    const all = await readAll();
    const threads: SupportThread[] = [];
    for (const [id, raw] of Object.entries(all)) {
      const t = thread(id, expand(await fresh(id, raw || {}, now), now));
      if (t) threads.push(t);
    }
    // javob kutayotganlar tepada, keyin eng yangi suhbat
    threads.sort((x, y) => Number(y.waiting) - Number(x.waiting) || y.last.at - x.last.at);
    return { threads: threads.slice(0, 200) };
  }
  const me = keyOf(a.id);
  return { messages: expand(await fresh(me, await readUser(me), now), now) };
}

const reSchema = z.string().regex(/^[A-Za-z0-9_-]{1,44}$/);
const sendSchema = z
  .object({
    text: z.string().trim().min(1).max(1500),
    cat: z.enum(supportCategories).optional(),
    re: reSchema.optional(),
  })
  .strict();
const replySchema = z
  .object({
    uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
    text: z.string().trim().min(1).max(1500),
    re: reSchema.optional(),
  })
  .strict();
const readSchema = z.object({ uid: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/) }).strict();

/** Javob berilayotgan xabar shu suhbatda bormi — iqtibos uchun qisqa matni. */
function quote(list: SupportMessage[], re?: string) {
  if (!re) return undefined;
  const m = list.find((x) => x.id === re);
  if (!m)
    throw new ApiError(400, 'Javob berilayotgan xabar topilmadi (o‘chirilgan bo‘lishi mumkin).');
  return { id: m.id, text: snippet(m.text), name: m.name };
}

export async function supportAct(a: Who, action: string, input: unknown, now = Date.now()) {
  if (action === 'send') {
    const v = sendSchema.parse(input);
    const uid = keyOf(a.id),
      raw = await fresh(uid, await readUser(uid), now),
      list = expand(raw, now);
    // Ko'p xabar yuborishning oldini olish: 10 daqiqada 20 tadan ko'p emas.
    check(
      list.filter((m) => m.from !== 'staff' && now - m.at < 600000).length < 20,
      429,
      'Juda ko‘p xabar yubordingiz. Birozdan keyin yozing.',
    );
    const id = newId(now);
    const re = quote(list, v.re);
    const message: SupportMessage = {
      id,
      uid,
      from: 'user',
      name: a.name.slice(0, 80),
      role: a.role,
      group: (a.classId || '').slice(0, 40),
      cat: v.cat || 'other',
      text: v.text,
      at: now,
      status: 'new',
      ...(re ? { re } : {}),
    };
    await update(uid, { [id]: message });
    return { message };
  }
  check(staff(a), 403, 'Javobni faqat administrator yozadi.');
  if (action === 'reply') {
    const v = replySchema.parse(input);
    const raw = await fresh(v.uid, await readUser(v.uid), now),
      list = expand(raw, now);
    check(list.length, 404, 'Suhbat topilmadi');
    const owner = [...list].reverse().find((m) => m.from !== 'staff');
    const id = newId(now);
    const re = quote(list, v.re);
    const message: SupportMessage = {
      id,
      uid: v.uid,
      from: 'staff',
      name: a.name.slice(0, 80),
      role: a.role,
      group: owner?.group || '',
      cat: 'other',
      text: v.text,
      at: now,
      status: 'read',
      to: owner?.name || '',
      ...(re ? { re } : {}),
    };
    // suhbat egasining xabarlari — «javob berildi»
    const patch: Record<string, SupportMessage> = { [id]: message };
    for (const [k, m] of Object.entries(raw))
      if ((m.from || 'user') === 'user' && m.status !== 'answered')
        patch[k] = { ...m, status: 'answered' };
    await update(v.uid, patch);
    return { message };
  }
  if (action === 'read') {
    const v = readSchema.parse(input);
    const raw = await readUser(v.uid);
    const patch: Record<string, SupportMessage> = {};
    for (const [k, m] of Object.entries(raw))
      if ((m.from || 'user') === 'user' && m.status === 'new') patch[k] = { ...m, status: 'read' };
    await update(v.uid, patch);
    return { ok: true, read: Object.keys(patch).length };
  }
  throw new ApiError(400, 'Noma’lum amal');
}
