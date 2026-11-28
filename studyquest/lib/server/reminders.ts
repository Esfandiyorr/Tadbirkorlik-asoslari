import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  forEveryone,
  REMINDER_GROUPS_MAX,
  REMINDER_MAX,
  REMINDER_TEXT_MAX,
  REMINDER_USERS_MAX,
  remindersFor,
  type Reminder,
  type Reminders,
  type ReminderUser,
} from '../reminders';
import { administrator, check } from './auth';
import { demo } from './repository';
import { siteGet, siteUpdate } from './site-content';

/* 🔔 Bosh sahifadagi «Eslatmalar» (lib/reminders.ts). Saqlanadi: site/reminders = {items: {<id>: Reminder}, auto}.
   Faqat administrator yozadi. Hammaga atalganlari — ochiq (e'lonlar bilan birga), guruh yoki talabaga
   atalganlari — faqat o'sha foydalanuvchining shaxsiy ma'lumotida. Har so'rovda bazani o'qimaslik uchun
   15 soniyalik xotira (o'zgartirilganda darhol yangilanadi). */

type StoredItem = Partial<Omit<Reminder, 'groups' | 'users'>> & {
  group?: unknown;
  groups?: unknown;
  users?: unknown;
};
type Stored = { items?: Record<string, StoredItem>; auto?: Partial<Reminders['auto']> };

const list = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [];
function normalize(raw: Stored | null, now: number, all = false): Reminders {
  const items = Object.entries(raw?.items || {})
    .map(([id, v]): Reminder => {
      // eski yozuvlarda bitta guruh (group) edi
      const groups = [...list(v?.groups), v?.group]
        .filter((g): g is string => typeof g === 'string' && !!g.trim())
        .map((g) => g.trim().slice(0, 60));
      const users = list(v?.users)
        .filter(
          (u): u is ReminderUser =>
            !!u &&
            typeof (u as ReminderUser).id === 'string' &&
            typeof (u as ReminderUser).name === 'string',
        )
        .map((u) => ({ id: u.id, name: u.name.slice(0, 120) }));
      return {
        id,
        t: typeof v?.t === 'string' ? v.t.slice(0, REMINDER_TEXT_MAX) : '',
        ...(typeof v?.link === 'string' && v.link ? { link: v.link } : {}),
        ...(Number(v?.until) > 0 ? { until: Number(v!.until) } : {}),
        ...(groups.length ? { groups: [...new Set(groups)] } : {}),
        ...(users.length ? { users } : {}),
        at: Number(v?.at) || 0,
      };
    })
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

const mem = ((globalThis as { __sqReminders?: { v: Stored | null; at: number } }).__sqReminders ??=
  { v: null, at: 0 });
async function stored(fresh = false, now = Date.now()): Promise<Stored | null> {
  // demo xotirasi arzon — keshlanmaydi
  if (!fresh && !demo() && mem.at && now - mem.at < 15000) return mem.v;
  mem.v = await siteGet<Stored>('reminders');
  mem.at = now;
  return mem.v;
}

/** Administrator: hamma (muddati o'tmagan) eslatmalar — kimga atalgani bilan. */
export async function readReminders(now = Date.now()): Promise<Reminders> {
  return normalize(await stored(true, now), now);
}
/** Ochiq (e'lonlar bilan birga): faqat hammaga atalgan eslatmalar va avtomatik eslatmalar sozlamasi. */
export async function publicReminders(now = Date.now()): Promise<Reminders> {
  const r = normalize(await stored(false, now), now);
  return { items: r.items.filter(forEveryone), auto: r.auto };
}
/** Shaxsiy: shu foydalanuvchining guruhiga yoki o'ziga atalgan eslatmalar (hammaga atalganlari — publicReminders da). */
export async function remindersForUser(
  who: { id: string; group?: string },
  now = Date.now(),
): Promise<Reminder[]> {
  const r = normalize(await stored(false, now), now);
  return remindersFor(
    r.items.filter((x) => !forEveryone(x)),
    who,
    now,
  ).map(({ groups, users, ...rest }) => {
    void groups;
    void users;
    // boshqa kimlarga yozilgani talabaga ko'rsatilmaydi
    return rest;
  });
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
      /** eski ko'rinish: bitta guruh */
      group: z.string().trim().max(60).optional(),
      groups: z.array(z.string().trim().min(1).max(60)).max(REMINDER_GROUPS_MAX).optional(),
      users: z
        .array(
          z
            .object({
              id: z.string().regex(/^[A-Za-z0-9_-]{1,140}$/),
              name: z.string().trim().min(1).max(120),
            })
            .strict(),
        )
        .max(REMINDER_USERS_MAX)
        .optional(),
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

/** Administrator: eslatma qo'shish (hammaga, guruhlarga yoki talabalarga), o'chirish va avtomatik eslatmalarni
    yoqish/o'chirish. */
export async function manageReminders(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = input.parse(raw);
  if (p.op === 'add') {
    const cur = normalize(await stored(true, now), now);
    check(
      cur.items.length < REMINDER_MAX,
      400,
      `Eslatmalar ko‘pi bilan ${REMINDER_MAX} ta bo‘ladi. Keraksizlarini o‘chiring.`,
    );
    check(!p.until || p.until > now, 400, 'Muddat o‘tib ketgan — keyingi sanani tanlang.');
    const groups = [...new Set([...(p.groups || []), ...(p.group ? [p.group] : [])])];
    const users = [...new Map((p.users || []).map((u) => [u.id, u])).values()];
    const id = randomUUID().replace(/-/g, '').slice(0, 12);
    await siteUpdate({
      ['reminders/items/' + id]: {
        t: p.t,
        ...(p.link ? { link: p.link } : {}),
        ...(p.until ? { until: p.until } : {}),
        ...(groups.length ? { groups } : {}),
        ...(users.length ? { users } : {}),
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
  const all = normalize(await stored(true, now), now, true);
  const old = all.items.filter((x) => x.until && x.until <= now);
  if (old.length)
    await siteUpdate(Object.fromEntries(old.map((x) => ['reminders/items/' + x.id, null])));
  return readReminders(now);
}
