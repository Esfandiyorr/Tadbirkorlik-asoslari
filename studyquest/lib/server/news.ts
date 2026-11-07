import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator } from './auth';
import { demo, legacyDb } from './repository';
import { demoKahoot } from './live-admin';

/* 📢 E'lonlar oynasi (yon menyuda, har 10 soniyada almashadi) va ⚡ jonli test jadvali.
   E'lonlar: meta/news/<id> = {h?, t, link?, until?, at} — faqat administrator (server orqali) yozadi, hamma o'qiydi.
   Jonli test: asl tizimdagi kahoot/cfg va kahoot/idx (administrator «Sayt boshqaruvi → ⚡ Jonli test»da yoki eski
   «Kursni boshqarish → ⚡ Jonli test» panelida rejalashtiradi). */

export type NewsItem = {
  id: string;
  h?: string;
  t: string;
  link?: string;
  until?: number;
  at: number;
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
    .map(([id, v]) => ({ ...v, id }))
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
    };
    if (demo()) memory.news[id] = { ...item, id };
    else
      await legacyDb()
        .ref('meta/news/' + id)
        .set(item);
  } else if (demo()) delete memory.news[v.id];
  else
    await legacyDb()
      .ref('meta/news/' + v.id)
      .remove();
  return { news: await readNews(now) };
}
