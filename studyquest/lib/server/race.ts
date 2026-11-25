import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import BANK from '../race-questions.json';
import type { Actor } from '../types';
import { check } from './auth';
import { siteGet, siteTransaction, siteUpdate } from './site-content';

/* 🏁 Jamoaviy poyga (/poyga): talaba havola orqali kiradi, ismini yozib ikki jamoadan birini tanlaydi.
   O'qituvchi «Boshlash»ni bosgach hamma bir xil savollarga javob beradi (1–10-mavzulardan aralash, har o'yinda
   yangi tanlov, variantlar ham aralashtiriladi). Javobni server tekshiradi: to'g'ri va tez javob ko'proq ball beradi.
   Jamoa mashinasi faol a'zolarining o'rtacha bali bilan oldinga yuradi — marraga birinchi yetgan (yoki vaqt
   tugaganda oldinda bo'lgan) jamoa yutadi.
   Ma'lumot (site/race): current = o'yin; g/<o'yin>/meta — holat va savollar; players/<pid> — ism, jamoa;
   score/<pid> — ball, to'g'ri javoblar, javoblar soni (har so'rovda shu uchtasi o'qiladi — yengil);
   shown/<pid>/<savol> — savol ko'rsatilgan vaqt; ans/<pid>/<savol> — javob. */

type BankQ = { t: number; q: string; a: string[]; c: number; e: string };
const QUESTIONS = BANK as BankQ[];

export const RACE = {
  /** har mavzudan nechta savol (10 mavzu → 30 ta) */
  perTopic: 3,
  /** o'yin davomiyligi */
  ms: 6 * 60000,
  /** marra: jamoa faol a'zolarining o'rtacha bali */
  target: 100,
  maxPlayers: 300,
};
export const TEAMS = {
  a: { name: 'Yashil jamoa', color: '#16a34a' },
  b: { name: 'Binafsha jamoa', color: '#7c3aed' },
} as const;
export type Team = keyof typeof TEAMS;

/** Ball: 4 soniyagacha — 10, keyin har 2 soniyada 1 tadan kamayadi, eng kami — 4; noto'g'ri — 0. */
export function pointsFor(ok: boolean, ms: number) {
  if (!ok) return 0;
  return Math.max(4, 10 - Math.floor(Math.max(0, ms - 4000) / 2000));
}

type GameQ = { i: number; o: number[] };
type Meta = {
  id: string;
  status: 'lobby' | 'run' | 'done';
  at: number;
  by: string;
  start?: number;
  ends?: number;
  winner?: Team | 'tie';
  doneAt?: number;
  qs: GameQ[];
};
type Player = { n: string; t: Team; at: number };
/** p — ball, r — to'g'ri javoblar, c — javob berilgan savollar soni */
type Score = { p: number; r: number; c: number };
type Game = Meta & { players: Record<string, Player>; score: Record<string, Score> };

const newId = (n = 8) => randomBytes(n).toString('hex');
const shuffle = <T>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** Har o'yinga: har mavzudan tasodifiy RACE.perTopic ta savol, aralash tartibda, variantlar ham aralash. */
function pickQuestions(): GameQ[] {
  const byTopic = new Map<number, number[]>();
  QUESTIONS.forEach((q, i) => byTopic.set(q.t, [...(byTopic.get(q.t) || []), i]));
  const chosen = [...byTopic.values()].flatMap((ids) => shuffle(ids).slice(0, RACE.perTopic));
  return shuffle(chosen).map((i) => ({ i, o: shuffle(QUESTIONS[i].a.map((_, k) => k)) }));
}

const base = (id: string) => 'race/g/' + id;
async function current(): Promise<Game | null> {
  const id = await siteGet<string>('race/current');
  if (!id) return null;
  const [meta, players, score] = await Promise.all([
    siteGet<Meta>(base(id) + '/meta'),
    siteGet<Record<string, Player>>(base(id) + '/players'),
    siteGet<Record<string, Score>>(base(id) + '/score'),
  ]);
  return meta?.id ? { ...meta, players: players || {}, score: score || {} } : null;
}
async function createGame(by: string, now: number) {
  const old = await siteGet<string>('race/current');
  const meta: Meta = { id: newId(6), status: 'lobby', at: now, by, qs: pickQuestions() };
  await siteUpdate({
    [base(meta.id)]: { meta },
    'race/current': meta.id,
    ...(old && old !== meta.id ? { [base(old)]: null } : {}),
  });
  return { ...meta, players: {}, score: {} } as Game;
}

type Member = { n: string; p: number; r: number; c: number; me?: true };
function teamStats(g: Game, pid?: string) {
  const out = {} as Record<
    Team,
    {
      name: string;
      color: string;
      members: Member[];
      active: number;
      avg: number;
      progress: number;
    }
  >;
  for (const t of Object.keys(TEAMS) as Team[]) {
    const members: Member[] = Object.entries(g.players)
      .filter(([, p]) => p?.t === t)
      .map(([id, p]) => ({
        n: p.n,
        p: g.score[id]?.p || 0,
        r: g.score[id]?.r || 0,
        c: g.score[id]?.c || 0,
        ...(id === pid ? { me: true as const } : {}),
      }))
      .sort((x, y) => y.p - x.p || y.r - x.r);
    // o'rtacha — kamida bitta savolga javob bergan a'zolar bo'yicha (telefoni o'chib qolgan jamoani pastga tortmaydi)
    const active = members.filter((m) => m.c > 0);
    const avg = active.length ? active.reduce((s, m) => s + m.p, 0) / active.length : 0;
    out[t] = {
      ...TEAMS[t],
      members,
      active: active.length,
      avg: Math.round(avg * 10) / 10,
      progress: Math.min(100, Math.round((avg / RACE.target) * 1000) / 10),
    };
  }
  return out;
}
/** O'yin tugadimi (marra, vaqt yoki hamma savollar) va kim yutdi. */
function outcome(g: Game, now: number): { done: boolean; winner?: Team | 'tie' } {
  if (g.status !== 'run') return { done: g.status === 'done', winner: g.winner };
  const s = teamStats(g);
  const ids = Object.keys(g.players);
  const allDone = ids.length > 0 && ids.every((id) => (g.score[id]?.c || 0) >= g.qs.length);
  const finished = s.a.progress >= 100 || s.b.progress >= 100;
  if (!finished && !allDone && now < (g.ends || 0)) return { done: false };
  return { done: true, winner: s.a.avg === s.b.avg ? 'tie' : s.a.avg > s.b.avg ? 'a' : 'b' };
}
async function finishIfOver(g: Game, now: number): Promise<Game> {
  const r = outcome(g, now);
  if (g.status !== 'run' || !r.done) return g;
  const saved = await siteTransaction<Meta>(base(g.id) + '/meta', (cur) =>
    !cur || cur.status !== 'run' ? cur : { ...cur, status: 'done', winner: r.winner, doneAt: now },
  );
  return { ...g, ...(saved || {}) };
}

/** Holat: hamma ko'radigan poyga + o'yinchiga navbatdagi savoli (to'g'ri javob yuborilmaydi). */
export async function raceView(pid: string | null, now = Date.now()) {
  let g = await current();
  if (g) g = await finishIfOver(g, now);
  if (!g) return { status: 'none' as const, now, target: RACE.target, teams: null };
  const player = pid ? g.players[pid] : undefined;
  const mine = (pid && g.score[pid]) || { p: 0, r: 0, c: 0 };
  let question: { qi: number; q: string; a: string[]; t: number } | undefined;
  if (player && g.status === 'run' && mine.c < g.qs.length) {
    const qi = mine.c,
      gq = g.qs[qi],
      bank = QUESTIONS[gq.i];
    // savol birinchi marta berilgan vaqt — javob tezligi shundan hisoblanadi
    const path = base(g.id) + '/shown/' + pid + '/' + qi;
    if (!(await siteGet<number>(path))) await siteUpdate({ [path]: now });
    question = { qi, q: bank.q, a: gq.o.map((k) => bank.a[k]), t: bank.t };
  }
  return {
    status: g.status,
    id: g.id,
    now,
    start: g.start,
    ends: g.ends,
    total: g.qs.length,
    target: RACE.target,
    winner: g.winner,
    teams: teamStats(g, pid || undefined),
    me: player
      ? { n: player.n, t: player.t, ...mine, ...(question ? { question } : {}) }
      : undefined,
  };
}
export type RaceView = Awaited<ReturnType<typeof raceView>>;

const PID = z.string().regex(/^[0-9a-f]{16}$/);
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('join'),
      name: z
        .string()
        .transform((s) => s.replace(/\s+/g, ' ').trim())
        .pipe(z.string().min(2).max(30)),
      team: z.enum(['a', 'b']),
      pid: PID.optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('answer'),
      pid: PID,
      qi: z.number().int().min(0).max(200),
      k: z.number().int().min(0).max(9),
    })
    .strict(),
  z.object({ op: z.literal('new') }).strict(),
  z.object({ op: z.literal('start') }).strict(),
  z.object({ op: z.literal('stop') }).strict(),
]);
export const HOST_OPS = ['new', 'start', 'stop'];
export const isHost = (a: Actor | null) => a?.role === 'teacher' || a?.role === 'admin';

/** Amallar: join / answer — har kim (havola bilan); new / start / stop — o'qituvchi yoki administrator. */
export async function raceAct(a: Actor | null, raw: unknown, now = Date.now()) {
  const v = input.parse(raw);
  if (v.op === 'new' || v.op === 'start' || v.op === 'stop') {
    check(isHost(a), 403, 'Poygani o‘qituvchi boshqaradi.');
    if (v.op === 'new') await createGame((a!.name || a!.id).slice(0, 60), now);
    else {
      const g = await current();
      check(g, 404, 'O‘yin topilmadi — «Yangi o‘yin»ni bosing.');
      if (v.op === 'start') {
        check(g!.status === 'lobby', 409, 'O‘yin allaqachon boshlangan.');
        check(Object.keys(g!.players).length > 0, 409, 'Hali hech kim qo‘shilmagan.');
        await siteTransaction<Meta>(base(g!.id) + '/meta', (cur) =>
          cur?.status === 'lobby'
            ? { ...cur, status: 'run', start: now, ends: now + RACE.ms }
            : cur,
        );
      } else {
        check(g!.status === 'run', 409, 'O‘yin ketmayapti.');
        await finishIfOver({ ...g!, ends: now }, now);
      }
    }
    return { view: await raceView(null, now) };
  }

  if (v.op === 'join') {
    let g = await current();
    if (!g || g.status === 'done') {
      // o'qituvchi hali o'yin ochmagan bo'lsa — birinchi kirgan talaba kutish xonasini ochadi
      check(!g, 409, 'Bu o‘yin tugadi — o‘qituvchi yangisini boshlaydi.');
      g = await createGame('auto', now);
    }
    const pid = v.pid && g.players[v.pid] ? v.pid : newId(8);
    const existing = g.players[pid];
    check(
      !existing || existing.t === v.team || g.status === 'lobby',
      409,
      'O‘yin boshlangan — jamoani almashtirib bo‘lmaydi.',
    );
    check(
      existing || Object.keys(g.players).length < RACE.maxPlayers,
      429,
      'O‘yinchilar soni to‘ldi.',
    );
    await siteUpdate({
      [base(g.id) + '/players/' + pid]: { n: v.name, t: v.team, at: existing?.at || now },
    });
    return { pid, view: await raceView(pid, now) };
  }

  // ---------- javob ----------
  const g = await current();
  check(
    g && g.status === 'run' && now < (g.ends || 0),
    409,
    'O‘yin tugagan yoki hali boshlanmagan.',
  );
  check(g!.players[v.pid], 404, 'Avval jamoaga qo‘shiling.');
  check(v.qi < g!.qs.length, 409, 'Savollar tugadi.');
  const shown = await siteGet<number>(base(g!.id) + '/shown/' + v.pid + '/' + v.qi);
  check(shown, 409, 'Savol hali ochilmagan.');
  const gq = g!.qs[v.qi],
    bank = QUESTIONS[gq.i];
  check(v.k < gq.o.length, 400, 'Javob topilmadi.');
  const ok = gq.o[v.k] === bank.c;
  const ms = Math.max(0, now - shown!);
  const p = pointsFor(ok, ms);
  // bitta savolga bir marta: c (javoblar soni) aynan shu savol raqamiga teng bo'lsagina yoziladi
  let saved = false;
  await siteTransaction<Score>(base(g!.id) + '/score/' + v.pid, (cur) => {
    const s = cur || { p: 0, r: 0, c: 0 };
    saved = s.c === v.qi;
    return saved ? { p: s.p + p, r: s.r + (ok ? 1 : 0), c: s.c + 1 } : s;
  });
  check(saved, 409, 'Bu savolga javob berilgan.');
  await siteUpdate({
    [base(g!.id) + '/ans/' + v.pid + '/' + v.qi]: { k: v.k, ok: ok ? 1 : 0, p, ms },
  });
  return {
    result: { ok, points: p, ms, right: gq.o.indexOf(bank.c), explain: bank.e },
    view: await raceView(v.pid, now),
  };
}
