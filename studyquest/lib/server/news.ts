import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { demo, legacyDb } from './repository';
import { demoKahoot } from './live-admin';
import { imageUrl, siteGet, siteUpdate, storeBlob } from './site-content';

/* 📢 E'lonlar oynasi (yon menyuda, har 10 soniyada almashadi) va ⚡ jonli test jadvali.
   E'lonlar: meta/news/<id> = {h?, t, link?, until?, at, pop?, img?} — faqat administrator (server orqali) yozadi,
   hamma o'qiydi. Rasm (ixtiyoriy) baytlari site/blob/nw-<id> da, img — uning versiyasi (saytga manzil bo'lib boradi).
   Jonli test: asl tizimdagi kahoot/cfg va kahoot/idx (administrator «Sayt boshqaruvi → ⚡ Jonli test»da yoki eski
   «Kursni boshqarish → ⚡ Jonli test» panelida rejalashtiradi). */

export type NewsItem = {
  id: string;
  h?: string;
  t: string;
  link?: string;
  until?: number;
  at: number;
  /** saytga kirganda katta oynada ko'rsatiladi (foydalanuvchi «O'qildi» bosguncha) */
  pop?: boolean;
  /** rasm manzili (/api/site/img/nw-<id>?v=…) */
  img?: string;
};
export type LiveGame = {
  d: string;
  open: number;
  start: number;
  end: number;
  type: 'quiz' | 'yz';
  nq?: number;
  qsec?: number;
  note?: string;
};

const memory = ((globalThis as { __sqNews?: { news: Record<string, NewsItem> } }).__sqNews ??= {
  news: {},
});

const tashkentDay = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 10);

export async function readNews(now = Date.now()): Promise<NewsItem[]> {
  const raw = demo()
    ? memory.news
    : (((await legacyDb().ref('meta/news').get()).val() || {}) as Record<string, NewsItem>);
  return Object.entries(raw)
    .map(([id, v]) => {
      const { img, ...rest } = v;
      return {
        ...rest,
        id,
        ...(typeof img === 'string' && /^[a-z0-9]{1,16}$/.test(img)
          ? { img: imageUrl('nw-' + id.toLowerCase(), img) }
          : {}),
      };
    })
    .filter((v) => typeof v.t === 'string' && v.t && (!v.until || v.until > now))
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, 12);
}

/** Keyingi (yoki hozir ketayotgan) jonli test — asl dvigateldagi khNext bilan bir xil qoida. */
export function nextGame(
  cfg: { on?: boolean } | null,
  idx: Record<string, Record<string, unknown>> | null,
  now = Date.now(),
): LiveGame | null {
  const off = cfg?.on === false;
  const keys = Object.keys(idx || {})
    .filter((k) => {
      const e = idx![k];
      return e && Number(e.end) > now && (!off || !!e.sp);
    })
    .sort((a, b) => Number(idx![a].start) - Number(idx![b].start));
  if (!keys.length) return null;
  const e = idx![keys[0]];
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
  return {
    d: keys[0],
    open: Number(e.open) || Number(e.start),
    start: Number(e.start),
    end: Number(e.end),
    type: e.type === 'yz' ? 'yz' : 'quiz',
    nq: num(e.nq),
    qsec: num(e.qsec),
    ...(typeof e.note === 'string' && e.note ? { note: e.note.slice(0, 300) } : {}),
  };
}

export async function liveGame(now = Date.now()): Promise<LiveGame | null> {
  // Demo/sinov: «Sayt boshqaruvi → Jonli test»da tuzilgan xotiradagi jadval (jonli bazaga ulanmaydi).
  if (demo())
    return nextGame(
      demoKahoot.cfg,
      demoKahoot.idx as unknown as Record<string, Record<string, unknown>>,
      now,
    );
  const db = legacyDb();
  const [cfg, idx] = await Promise.all([
    db
      .ref('kahoot/cfg')
      .get()
      .then((s) => s.val()),
    db
      .ref('kahoot/idx')
      .orderByKey()
      .startAt(tashkentDay(now))
      .limitToFirst(10)
      .get()
      .then((s) => s.val()),
  ]);
  return nextGame(cfg, idx, now);
}

/** E'lon havolasi: https://… yoki sayt ichidagi #bo'lim (javascript: va boshqalar — yo'q). */
export const newsLink = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || /^https:\/\/[^\s]+$/.test(v) || /^#[a-z][a-z0-9/_-]*$/i.test(v), {
    message: 'Havola https:// yoki sayt ichidagi #bo‘lim ko‘rinishida bo‘lsin.',
  });
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('add'),
      h: z.string().trim().max(60).optional(),
      t: z.string().trim().min(2).max(1500),
      link: newsLink.optional(),
      until: z.number().int().positive().optional(),
      pop: z.boolean().optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) }).strict(),
]);

/** Administrator: e'lon qo'shish yoki o'chirish. Yangilangan ro'yxatni qaytaradi. */
export async function manageNews(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = input.parse(raw);
  if (v.op === 'add') {
    const id = now.toString(36) + '-' + randomUUID().slice(0, 8);
    const item = {
      t: v.t,
      at: now,
      ...(v.h ? { h: v.h } : {}),
      ...(v.link ? { link: v.link } : {}),
      ...(v.until ? { until: v.until } : {}),
      ...(v.pop ? { pop: true } : {}),
    };
    if (demo()) memory.news[id] = { ...item, id };
    else
      await legacyDb()
        .ref('meta/news/' + id)
        .set(item);
    // e'lonni yozgan administratorga katta oyna chiqmaydi
    if (v.pop) await markSeen(a, id, now).catch(() => {});
    return { id, news: await readNews(now) };
  } else if (demo()) delete memory.news[v.id];
  else
    await legacyDb()
      .ref('meta/news/' + v.id)
      .remove();
  if (/^[a-z0-9-]{2,40}$/.test(v.id)) await siteUpdate({ ['blob/nw-' + v.id]: null });
  return { news: await readNews(now) };
}

/** Administrator: e'longa rasm qo'shish yoki almashtirish (baytlar turi serverda tekshiriladi). */
export async function newsImage(a: Actor, id: string, bytes: Buffer, now = Date.now()) {
  administrator(a);
  check(/^[a-z0-9-]{2,40}$/.test(id), 400, 'E’lon topilmadi.');
  const cur = demo()
    ? memory.news[id]
    : ((await legacyDb()
        .ref('meta/news/' + id)
        .get()
        .then((s) => s.val())) as NewsItem | null);
  check(cur, 404, 'E’lon topilmadi.');
  const saved = await storeBlob('nw-' + id, bytes, now);
  if (demo()) memory.news[id] = { ...memory.news[id], img: saved.v };
  else
    await legacyDb()
      .ref('meta/news/' + id + '/img')
      .set(saved.v);
  const news = await readNews(now);
  return { id, news, img: news.find((x) => x.id === id)?.img };
}

/* 📣 Katta oynadagi e'lonlar: kim qaysi e'lonni «O'qildi» deb belgilagan — site/newsSeen/<foydalanuvchi>/<e'lon> = vaqt.
   site/* bo'limiga brauzerlar tegolmaydi; faqat server o'qiydi va yozadi. Har qurilmada bir xil ishlaydi. */
const seenKey = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const newsId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

/** Foydalanuvchi o'qigan (amaldagi) e'lonlar ro'yxati. */
export async function newsSeen(a: Actor, now = Date.now()) {
  const [raw, news] = await Promise.all([
    siteGet<Record<string, number>>('newsSeen/' + seenKey(a.id)),
    readNews(now),
  ]);
  const live = new Set(news.map((n) => n.id));
  return { seen: Object.keys(raw || {}).filter((id) => live.has(id)) };
}
async function markSeen(a: Actor, id: string, now: number) {
  const key = 'newsSeen/' + seenKey(a.id);
  const [cur, news] = await Promise.all([siteGet<Record<string, number>>(key), readNews(now)]);
  const live = new Set(news.map((n) => n.id));
  const patch: Record<string, unknown> = { [key + '/' + id]: now };
  // o'chirilgan yoki muddati o'tgan e'lonlar belgisi tozalanadi
  for (const old of Object.keys(cur || {}))
    if (old !== id && !live.has(old)) patch[key + '/' + old] = null;
  await siteUpdate(patch);
}
/** Foydalanuvchi katta oynadagi e'lonni «O'qildi» deb belgilaydi. */
export async function markNewsSeen(a: Actor, raw: unknown, now = Date.now()) {
  const { id } = z.object({ id: newsId }).strict().parse(raw);
  await markSeen(a, id, now);
  return newsSeen(a, now);
}
