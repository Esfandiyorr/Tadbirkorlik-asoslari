import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { REMINDER_MAX, REMINDER_TEXT_MAX, type Reminder, type Reminders } from '../reminders';
import { administrator, check } from './auth';
import { siteGet, siteUpdate } from './site-content';

/* 🔔 Bosh sahifadagi «Eslatmalar» (lib/reminders.ts). Saqlanadi: site/reminders = {items: {<id>: Reminder}, auto}.
   Hamma o'qiydi (e'lonlar bilan birga), faqat administrator yozadi. */

type Stored = { items?: Record<string, Partial<Reminder>>; auto?: Partial<Reminders['auto']> };

function normalize(raw: Stored | null, now: number, all = false): Reminders {
  const items = Object.entries(raw?.items || {})
    .map(([id, v]) => ({
      id,
      t: typeof v?.t === 'string' ? v.t.slice(0, REMINDER_TEXT_MAX) : '',
      ...(typeof v?.link === 'string' && v.link ? { link: v.link } : {}),
      ...(Number(v?.until) > 0 ? { until: Number(v!.until) } : {}),
      ...(typeof v?.group === 'string' && v.group ? { group: v.group } : {}),
      at: Number(v?.at) || 0,
    }))
    .filter((x) => x.t && (all || !x.until || x.until > now))
    .sort((a, b) => b.at - a.at);
  return {
    items,
    auto: {
      topics: raw?.auto?.topics !== false,
      live: raw?.auto?.live !== false,
    },
  };
}

/** Hamma uchun: muddati o'tmagan eslatmalar va avtomatik eslatmalar sozlamasi. */
export async function readReminders(now = Date.now()): Promise<Reminders> {
  return normalize(await siteGet<Stored>('reminders'), now);
}

/** Havola: sayt bo'limi (#…), sayt sahifasi (/…) yoki https:// manzil. */
const link = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) =>
      !v || /^#[\w/-]*$/.test(v) || /^\/(?!\/)[\w\-./?=&#%]*$/.test(v) || /^https:\/\/\S+$/.test(v),
    'Havola «#bo‘lim», «/sahifa» yoki https:// bilan boshlansin.',
  );
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('add'),
      t: z.string().trim().min(2).max(REMINDER_TEXT_MAX),
      link: link.optional(),
      until: z.number().int().positive().optional(),
      group: z.string().trim().max(60).optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), id: z.string().regex(/^[a-f0-9]{12}$/) }).strict(),
  z
    .object({
      op: z.literal('auto'),
      topics: z.boolean().optional(),
      live: z.boolean().optional(),
    })
    .strict(),
]);

/** Administrator: eslatma qo'shish, o'chirish va avtomatik eslatmalarni yoqish/o'chirish. */
export async function manageReminders(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = input.parse(raw);
  if (p.op === 'add') {
    const cur = normalize(await siteGet<Stored>('reminders'), now);
    check(
      cur.items.length < REMINDER_MAX,
      400,
      `Eslatmalar ko‘pi bilan ${REMINDER_MAX} ta bo‘ladi.`,
    );
    check(!p.until || p.until > now, 400, 'Muddat o‘tib ketgan — keyingi sanani tanlang.');
    const id = randomUUID().replace(/-/g, '').slice(0, 12);
    await siteUpdate({
      ['reminders/items/' + id]: {
        t: p.t,
        ...(p.link ? { link: p.link } : {}),
        ...(p.until ? { until: p.until } : {}),
        ...(p.group ? { group: p.group } : {}),
        at: now,
      },
    });
  } else if (p.op === 'remove') {
    await siteUpdate({ ['reminders/items/' + p.id]: null });
  } else {
    const o: Record<string, boolean> = {};
    if (p.topics !== undefined) o['reminders/auto/topics'] = p.topics;
    if (p.live !== undefined) o['reminders/auto/live'] = p.live;
    check(Object.keys(o).length, 400, 'O‘zgarishni tanlang.');
    await siteUpdate(o);
  }
  // muddati o'tganlarini ham tozalaymiz (administrator ko'rmaydigan eski yozuvlar to'planib qolmasin)
  const all = normalize(await siteGet<Stored>('reminders'), now, true);
  const old = all.items.filter((x) => x.until && x.until <= now);
  if (old.length)
    await siteUpdate(Object.fromEntries(old.map((x) => ['reminders/items/' + x.id, null])));
  return readReminders(now);
}
