import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { check } from './auth';
import { demo, legacyDb } from './repository';
import { demoKahoot } from './live-admin';
import { khDay, type Game } from '../live-quiz';
import type { Actor } from '../types';

export type LivePlayer = {
  id: string;
  name: string;
  surname: string;
  group: string;
  guest: boolean;
  academic: boolean;
};
export const guestCookie = 'tad-live-guest';
export const guestTokenValid = (s: string | undefined): s is string =>
  !!s && /^[A-Za-z0-9_-]{43}$/.test(s);
// The cookie is an opaque 256-bit bearer token. Only its hash is ever returned to the player list.
export function guestPlayer(token: string): LivePlayer {
  check(guestTokenValid(token), 401, 'Avval jonli test sahifasini oching.');
  return {
    id: 'guest_' + createHash('sha256').update(token).digest('base64url'),
    name: 'Mehmon',
    surname: '',
    group: '',
    guest: true,
    academic: false,
  };
}
export function accountPlayer(a: Actor): LivePlayer {
  return {
    id: a.id.startsWith('legacy_')
      ? a.id.slice(7)
      : 'usr_' + createHash('sha256').update(a.id).digest('base64url'),
    name: String(a.name || 'O‘quvchi')
      .trim()
      .slice(0, 60),
    surname: '',
    group: String(a.classId || '').slice(0, 30),
    guest: false,
    academic: a.id.startsWith('legacy_') && a.learnerType !== 'independent',
  };
}
const gameKey = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:-[A-Za-z0-9_-]{1,40})?$/);
const inputSchema = z
  .object({
    path: z.string().max(220),
    value: z.unknown(),
    start: z.number().finite().optional(),
  })
  .strict();
const nameSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine((s) => !/[\u0000-\u001f\u007f]/.test(s));
type PlayerRow = NonNullable<Game['p']>[string];
type AnswerRow = { c: number; t: number };

async function game(d: string): Promise<Game | null> {
  gameKey.parse(d);
  return demo()
    ? structuredClone(demoKahoot.games[d] || null)
    : (
        await legacyDb()
          .ref('kahoot/games/' + d)
          .get()
      ).val();
}
function available(g: Game | null): asserts g is Game {
  check(g?.meta && g.meta.type !== 'yz', 404, 'Jonli test topilmadi yoki bekor qilingan.');
}
// Same game transaction covers cancellation/replanning, lobby admission and the first answer together.
// A child write would recreate an orphan answer if the teacher deleted the game during the request.
const queues = globalThis as typeof globalThis & { __sqLiveQueue?: Promise<unknown> };
async function updateGame(d: string, change: (g: Game) => void): Promise<Game> {
  gameKey.parse(d);
  if (demo()) {
    const task = (queues.__sqLiveQueue || Promise.resolve()).then(() => {
      const g = structuredClone(demoKahoot.games[d] || null);
      available(g);
      change(g);
      demoKahoot.games[d] = g;
      return g;
    });
    queues.__sqLiveQueue = task.catch(() => {});
    return task;
  }
  let rejected: unknown;
  const result = await legacyDb()
    .ref('kahoot/games/' + d)
    .transaction(
      (current) => {
        // RTDB may call the transaction with an initially empty local cache, then retry with server data.
        if (!current) return null;
        try {
          available(current);
          change(current);
          return current;
        } catch (e) {
          rejected = e;
          return undefined;
        }
      },
      undefined,
      false,
    );
  if (rejected) throw rejected;
  const g = result.snapshot.val() as Game | null;
  available(g);
  return g;
}

/** Public game data has the same timed visibility as the original database rules. */
export async function readLive(path: string, now = Date.now(), player?: LivePlayer) {
  if (path === 'clock') return now;
  if (path === 'idx') {
    const from = khDay(now - 86400000);
    const idx = demo()
      ? demoKahoot.idx
      : (
          await legacyDb().ref('kahoot/idx').orderByKey().startAt(from).limitToFirst(40).get()
        ).val() || {};
    return Object.fromEntries(
      Object.entries(idx)
        .filter(
          ([d, v]) =>
            d >= from && v && !(v as { x?: number }).x && (v as { type?: string }).type !== 'yz',
        )
        .slice(0, 40)
        .map(([d, v]) => {
          const x = v as {
            start: number;
            open?: number;
            end?: number;
            nq?: number;
            qsec?: number;
            note?: string;
          };
          return [
            d,
            {
              start: x.start,
              open: x.open ?? 0,
              end: x.end ?? 0,
              nq: x.nq ?? 0,
              qsec: x.qsec ?? 15,
              note: x.note || '',
            },
          ];
        }),
    );
  }
  const parts = path.split('/');
  check(
    parts[0] === 'games' && parts.length >= 2 && parts.length <= 4,
    400,
    'So‘rov yo‘li noto‘g‘ri.',
  );
  const d = gameKey.parse(parts[1]);
  const kind = parts[2] || '',
    index = parts[3];
  check(['', 'meta', 'p', 'mine', 'q', 'k', 'a'].includes(kind), 400, 'So‘rov yo‘li noto‘g‘ri.');
  const indexed = ['q', 'k', 'a'].includes(kind);
  check(
    indexed ? /^\d{1,3}$/.test(index || '') : parts.length <= 3,
    400,
    'Savol raqami noto‘g‘ri.',
  );
  const g = await game(d);
  // A removed game's meta must be null so an open stage can display cancellation immediately.
  if (!g?.meta && kind === 'meta') return null;
  available(g);
  if (kind === 'meta') return g.meta;
  if (kind === 'p') return g.p || {};
  if (kind === 'mine') {
    check(player, 401, 'Ishtirokchi seansi topilmadi.');
    const answers: Record<string, AnswerRow> = {};
    for (const [i, a] of Object.entries(g.a || {}))
      if (a?.[player!.id]) answers[i] = a[player!.id] as AnswerRow;
    return { joined: !!g.p?.[player!.id], answers };
  }
  if (!kind) {
    check(now >= g.meta.end, 403, 'Yakuniy natijalar hali ochilmagan.');
    return g;
  }
  const i = Number(index);
  check(i >= 0 && i < g.meta.nq && !!g.q?.[i] && !!g.k?.[i], 404, 'Savol topilmadi.');
  if (kind === 'q') {
    check(now >= g.q[i].at, 403, 'Savol hali ochilmagan.');
    return g.q[i];
  }
  check(now >= g.k[i].cl, 403, 'Savol vaqti hali tugamagan.');
  return kind === 'k' ? g.k[i] : g.a?.[i] || {};
}

/** Names/IDs, timestamps and scores from the browser are never authoritative. */
export async function writeLive(player: LivePlayer, raw: unknown, clock = Date.now) {
  const input = inputSchema.parse(raw);
  if (input.path.startsWith('clock/')) return clock();
  const p = input.path.split('/');
  check(
    p[0] === 'games' && (p[2] === 'p' ? p.length === 4 : p[2] === 'a' && p.length === 5),
    400,
    'So‘rov yo‘li noto‘g‘ri.',
  );
  const d = gameKey.parse(p[1]),
    join = p[2] === 'p',
    sid = p[join ? 3 : 4];
  check(sid === player.id, 403, 'Faqat o‘z nomingizdan qatnashishingiz mumkin.');
  const i = join ? -1 : z.coerce.number().int().min(0).max(999).parse(p[3]);
  const value = join
    ? z.object({ n: z.string().optional() }).passthrough().parse(input.value)
    : z
        .object({ c: z.number().int().min(0).max(3) })
        .passthrough()
        .parse(input.value);
  const g = await updateGame(d, (current) => {
    const now = clock();
    check(
      input.start === undefined || input.start === current.meta.start,
      409,
      'O‘yin vaqti o‘zgardi. Sahifani yangilang.',
    );
    if (join) {
      if (current.p?.[sid]) return;
      check(
        now >= current.meta.open && now < current.meta.start,
        409,
        'Qo‘shilish vaqti tugagan yoki lobbi hali ochilmagan.',
      );
      const name = player.guest ? nameSchema.parse((value as { n?: string }).n) : player.name;
      (current.p ??= {})[sid] = { n: name, g: player.group, at: now };
      return;
    }
    check(current.p?.[sid], 403, 'Avval o‘yinga qo‘shiling.');
    check(
      Object.keys(current.p || {}).length >= current.meta.min,
      409,
      'Ishtirokchilar yetarli emas — o‘yin bekor qilingan.',
    );
    const c = (value as { c: number }).c;
    const previous = current.a?.[i]?.[sid];
    if (previous) {
      check(previous.c === c, 409, 'Bu savolga javob allaqachon qabul qilingan.');
      return;
    }
    const q = current.q?.[i],
      key = current.k?.[i];
    check(
      i < current.meta.nq && q && key && now >= q.at && now < key.cl && now < current.meta.end,
      409,
      'Bu savolning javob vaqti ochilmagan yoki tugagan.',
    );
    ((current.a ??= {})[i] ??= {})[sid] = { c, t: now };
  });
  return join ? (g.p![sid] as PlayerRow) : (g.a![i][sid] as AnswerRow);
}
