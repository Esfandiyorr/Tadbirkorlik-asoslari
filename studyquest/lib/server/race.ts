import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import BANK from '../race-questions.json';
import type { Actor } from '../types';
import { check } from './auth';
import { siteGet, siteTransaction, siteUpdate } from './site-content';

/* 🏁 Jamoaviy poyga (/poyga). Ikki xil o'yin:
   • avtomatik jamoalar (odatiy): talaba ismini yozib qo'shiladi; poyga boshlanganda server hammani tasodifiy
     jamoalarga bo'ladi — har jamoada kamida 2, ko'pi bilan 5 kishi, jamoalar soni odam soniga qarab (4 kishidan
     kam bo'lsa — bitta jamoa). Kech qolgan eng kichik jamoaga qo'shiladi (hamma jamoa 5 kishilik bo'lsa — yangi jamoa).
   • o'zlari tanlaydi: ikki jamoa (Yashil va Binafsha), talaba kirganda o'zi tanlaydi.
   O'qituvchi «Boshlash»ni bosadi yoki o'yin rejalashtirilgan bo'lsa (jonli test o'rniga — «Poyga bilan almashtirish»)
   belgilangan vaqtda o'zi boshlanadi. Hamma bir xil savollarga javob beradi (1–10-mavzulardan aralash, har o'yinda
   yangi tanlov, variantlar ham aralashtiriladi). Javobni server tekshiradi: to'g'ri va tez javob ko'proq ball beradi.
   Har jamoa mashinasi faol a'zolarining o'rtacha bali bilan yuradi — marraga birinchi yetgan (yoki vaqt tugaganda
   oldinda bo'lgan) jamoa yutadi.
   Ma'lumot (site/race): current = o'yin; g/<o'yin>/meta — holat, savollar, jamoalar (teams) va avtomatik bo'linish
   (assign: o'yinchi → jamoa, bitta tranzaksiyada); players/<pid> — ism (va tanlagan jamoa); score/<pid> — ball,
   to'g'ri javoblar, javoblar soni; shown/<pid>/<savol> — savol ko'rsatilgan vaqt; ans/<pid>/<savol> — javob. */

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
  /** rejalashtirilgan poygaga qo'shilish shuncha oldin ochiladi (e'lonlarda) */
  lobbyMs: 10 * 60000,
  teamMin: 2,
  teamMax: 5,
};
const PALETTE: [string, string][] = [
  ['Yashil jamoa', '#16a34a'],
  ['Binafsha jamoa', '#7c3aed'],
  ['Ko‘k jamoa', '#2563eb'],
  ['To‘q sariq jamoa', '#ea580c'],
  ['Pushti jamoa', '#db2777'],
  ['Moviy jamoa', '#0891b2'],
  ['Qizil jamoa', '#dc2626'],
  ['Sariq jamoa', '#ca8a04'],
  ['Jigarrang jamoa', '#92400e'],
  ['Kulrang jamoa', '#475569'],
  ['Zaytun jamoa', '#4d7c0f'],
  ['Indigo jamoa', '#4338ca'],
];
/** Jamoa kaliti: a, b, c … z, a2, b2 … */
export const teamKey = (i: number) =>
  String.fromCharCode(97 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26) + 1) : '');
const teamIndex = (key: string) => {
  const m = /^([a-z])(\d*)$/.exec(key);
  return m ? m[1].charCodeAt(0) - 97 + (m[2] ? (Number(m[2]) - 1) * 26 : 0) : 0;
};
export function teamInfo(key: string) {
  const i = teamIndex(key);
  return {
    name: i < PALETTE.length ? PALETTE[i][0] : i + 1 + '-jamoa',
    color: PALETTE[i % PALETTE.length][1],
  };
}
/** Nechta jamoa: har jamoada 2–5 kishi; 4 kishidan kam bo'lsa — bitta jamoa. */
export function teamCount(n: number) {
  return n >= RACE.teamMin * 2 ? Math.max(2, Math.ceil(n / RACE.teamMax)) : 1;
}
/** O'yinchilarni tasodifiy tartibda jamoalarga navbat bilan bo'ladi (jamoalar hajmi 1 tadan ko'p farq qilmaydi). */
export function splitTeams(ids: string[], rnd: () => number = Math.random) {
  const k = teamCount(ids.length);
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const assign: Record<string, string> = {};
  order.forEach((id, j) => (assign[id] = teamKey(j % k)));
  return { assign, teams: Array.from({ length: Math.min(k, order.length) }, (_, i) => teamKey(i)) };
}

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
  winner?: string;
  doneAt?: number;
  qs: GameQ[];
  /** avtomatik jamoalar (yo'q bo'lsa — o'zlari tanlaydi: a, b) */
  auto?: boolean;
  /** rejalashtirilgan boshlanish (o'zi boshlanadi) */
  plan?: number;
  /** jamoalar tartibi */
  teams?: string[];
  /** avtomatik bo'linish: o'yinchi → jamoa */
  assign?: Record<string, string>;
  /** hech kim qo'shilmagan holda tugagan */
  empty?: boolean;
};
type Player = { n: string; t: string; at: number };
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
const teamOf = (g: Meta & { players: Record<string, Player> }, pid: string) =>
  (g.auto ? g.assign?.[pid] : g.players[pid]?.t) || '';
const teamKeys = (g: Meta) => (g.auto ? g.teams || [] : ['a', 'b']);

async function load(): Promise<Game | null> {
  const id = await siteGet<string>('race/current');
  if (!id) return null;
  const [meta, players, score] = await Promise.all([
    siteGet<Meta>(base(id) + '/meta'),
    siteGet<Record<string, Player>>(base(id) + '/players'),
    siteGet<Record<string, Score>>(base(id) + '/score'),
  ]);
  return meta?.id ? { ...meta, players: players || {}, score: score || {} } : null;
}
/** Joriy o'yin; rejalashtirilgan vaqti kelgan bo'lsa — o'zi boshlanadi. */
async function current(now: number): Promise<Game | null> {
  const g = await load();
  if (g && g.status === 'lobby' && g.plan && now >= g.plan) return startGame(g, now, true);
  return g;
}
async function createGame(by: string, now: number, opts: { auto?: boolean; plan?: number } = {}) {
  const old = await siteGet<string>('race/current');
  const meta: Meta = {
    id: newId(6),
    status: 'lobby',
    at: now,
    by,
    qs: pickQuestions(),
    ...(opts.auto ? { auto: true } : {}),
    ...(opts.plan ? { plan: opts.plan } : {}),
  };
  await siteUpdate({
    [base(meta.id)]: { meta },
    'race/current': meta.id,
    ...(old && old !== meta.id ? { [base(old)]: null } : {}),
  });
  return { ...meta, players: {}, score: {} } as Game;
}
/** Boshlash: avtomatik o'yinda — jamoalarga bo'lish (bitta tranzaksiyada, ikki server bir vaqtda boshlasa ham bir
    marta). Rejalashtirilgan o'yinga hech kim qo'shilmagan bo'lsa — tugaydi. */
async function startGame(g: Game, now: number, scheduled: boolean): Promise<Game> {
  const ids = Object.keys(g.players);
  if (!ids.length && !scheduled) check(false, 409, 'Hali hech kim qo‘shilmagan.');
  const start = scheduled && g.plan ? g.plan : now;
  const saved = await siteTransaction<Meta>(base(g.id) + '/meta', (cur) => {
    if (!cur || cur.status !== 'lobby') return cur;
    if (!ids.length) return { ...cur, status: 'done', doneAt: now, empty: true };
    const split = cur.auto ? splitTeams(ids) : null;
    return {
      ...cur,
      status: 'run',
      start,
      ends: start + RACE.ms,
      ...(split ? { assign: split.assign, teams: split.teams } : {}),
    };
  });
  return { ...g, ...(saved || {}) };
}
/** Avtomatik o'yin ketayotganda kelgan (yoki boshlanish paytida qolib ketgan) o'yinchi — eng kichik jamoaga;
    hamma jamoa to'la bo'lsa — yangi jamoa. */
async function assignLate(g: Game, pid: string): Promise<Game> {
  const saved = await siteTransaction<Meta>(base(g.id) + '/meta', (cur) => {
    if (!cur || !cur.auto || cur.status !== 'run' || cur.assign?.[pid]) return cur;
    const teams = [...(cur.teams || [])];
    const size = (t: string) => Object.values(cur.assign || {}).filter((x) => x === t).length;
    let key = teams.length ? teams.reduce((m, t) => (size(t) < size(m) ? t : m), teams[0]) : '';
    if (!key || size(key) >= RACE.teamMax) {
      key = teamKey(teams.length);
      teams.push(key);
    }
    return { ...cur, teams, assign: { ...(cur.assign || {}), [pid]: key } };
  });
  return { ...g, ...(saved || {}) };
}

type Member = { n: string; p: number; r: number; c: number; me?: true };
export type TeamStat = {
  key: string;
  name: string;
  color: string;
  members: Member[];
  active: number;
  avg: number;
  progress: number;
};
function teamStats(g: Game, pid?: string): TeamStat[] {
  return teamKeys(g).map((key) => {
    const members: Member[] = Object.entries(g.players)
      .filter(([id]) => teamOf(g, id) === key)
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
    return {
      key,
      ...teamInfo(key),
      members,
      active: active.length,
      avg: Math.round(avg * 10) / 10,
      progress: Math.min(100, Math.round((avg / RACE.target) * 1000) / 10),
    };
  });
}
/** G'olib: o'rtacha bali eng yuqori jamoa; bir nechtasi teng (yoki hech kim ball olmagan) — durang. */
function leader(s: TeamStat[]) {
  const best = Math.max(0, ...s.map((t) => t.avg));
  const top = s.filter((t) => t.avg === best);
  return best > 0 && top.length === 1 ? top[0].key : 'tie';
}
/** O'yin tugadimi (marra, vaqt yoki hamma savollar) va kim yutdi. */
function outcome(g: Game, now: number): { done: boolean; winner?: string } {
  if (g.status !== 'run') return { done: g.status === 'done', winner: g.winner };
  const s = teamStats(g);
  const ids = Object.keys(g.players);
  const allDone = ids.length > 0 && ids.every((id) => (g.score[id]?.c || 0) >= g.qs.length);
  const finished = s.some((t) => t.progress >= 100);
  if (!finished && !allDone && now < (g.ends || 0)) return { done: false };
  return { done: true, winner: leader(s) };
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
  let g = await current(now);
  if (g) g = await finishIfOver(g, now);
  if (!g)
    return {
      status: 'none' as const,
      now,
      target: RACE.target,
      auto: true,
      teams: [] as TeamStat[],
      joined: [] as { n: string; me?: true }[],
    };
  const player = pid ? g.players[pid] : undefined;
  if (player && g.auto && g.status === 'run' && !g.assign?.[pid!]) g = await assignLate(g, pid!);
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
  const t = player ? teamOf(g, pid!) : '';
  return {
    status: g.status,
    id: g.id,
    now,
    start: g.start,
    ends: g.ends,
    total: g.qs.length,
    target: RACE.target,
    winner: g.winner,
    auto: !!g.auto,
    ...(g.plan ? { plan: g.plan } : {}),
    ...(g.empty ? { empty: true } : {}),
    teams: teamStats(g, pid || undefined),
    // avtomatik o'yinda boshlanguncha jamoa yo'q — qo'shilganlar ro'yxati
    joined: Object.entries(g.players)
      .sort((x, y) => x[1].at - y[1].at)
      .map(([id, p]) => ({ n: p.n, ...(id === pid ? { me: true as const } : {}) })),
    me: player
      ? {
          n: player.n,
          t,
          ...(t ? { team: teamInfo(t) } : {}),
          ...mine,
          ...(question ? { question } : {}),
        }
      : undefined,
  };
}
export type RaceView = Awaited<ReturnType<typeof raceView>>;

/** ⚡ E'lonlar va bildirishnomalar uchun: rejalashtirilgan (yoki ketayotgan) poyga — jonli test o'rnida. */
export async function raceLive(now = Date.now()) {
  const id = await siteGet<string>('race/current');
  if (!id) return null;
  const m = await siteGet<Meta>(base(id) + '/meta');
  if (!m?.plan || m.status === 'done') return null;
  const start = m.status === 'run' && m.start ? m.start : m.plan;
  const end = m.status === 'run' && m.ends ? m.ends : m.plan + RACE.ms;
  if (end <= now) return null;
  return {
    d: 'race-' + m.id,
    open: m.plan - RACE.lobbyMs,
    start,
    end,
    type: 'race' as const,
    note: 'Kirganlar avtomatik jamoalarga bo‘linadi (2–5 kishidan).',
  };
}

const PID = z.string().regex(/^[0-9a-f]{16}$/);
const TEAM = z.string().regex(/^[a-z]\d{0,2}$/);
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('join'),
      name: z
        .string()
        .transform((s) => s.replace(/\s+/g, ' ').trim())
        .pipe(z.string().min(2).max(30)),
      team: TEAM.optional(),
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
  z.object({ op: z.literal('new'), auto: z.boolean().optional() }).strict(),
  z.object({ op: z.literal('schedule'), start: z.number().int().positive() }).strict(),
  z.object({ op: z.literal('replaceLive'), d: z.string().regex(/^[0-9a-z-]{10,20}$/) }).strict(),
  z.object({ op: z.literal('start') }).strict(),
  z.object({ op: z.literal('stop') }).strict(),
]);
export const HOST_OPS = ['new', 'schedule', 'replaceLive', 'start', 'stop'];
export const isHost = (a: Actor | null) => a?.role === 'teacher' || a?.role === 'admin';

/** Amallar: join / answer — har kim (havola bilan); new / schedule / start / stop — o'qituvchi yoki administrator;
    replaceLive — administrator: jonli testni bekor qilib, o'sha vaqtga avtomatik jamoali poyga rejalashtiradi. */
export async function raceAct(a: Actor | null, raw: unknown, now = Date.now()) {
  const v = input.parse(raw);
  if (
    v.op === 'new' ||
    v.op === 'schedule' ||
    v.op === 'replaceLive' ||
    v.op === 'start' ||
    v.op === 'stop'
  ) {
    check(isHost(a), 403, 'Poygani o‘qituvchi boshqaradi.');
    const by = (a!.name || a!.id).slice(0, 60);
    if (v.op === 'new') await createGame(by, now, { auto: v.auto !== false });
    else if (v.op === 'schedule') {
      check(v.start > now, 400, 'Boshlanish vaqti o‘tib ketgan.');
      await createGame(by, now, { auto: true, plan: v.start });
    } else if (v.op === 'replaceLive') {
      check(a!.role === 'admin', 403, 'Jonli testni administrator almashtiradi.');
      const { liveEntry, manageLive } = await import('./live-admin');
      const e = await liveEntry(v.d, now);
      check(
        e && !e.x && Number(e.start) > now,
        409,
        'Bu jonli test boshlangan, tugagan yoki bekor qilingan.',
      );
      const start = Number(e!.start);
      await manageLive(a!, { op: 'cancel', d: v.d }, now);
      await createGame(by, now, { auto: true, plan: start });
    } else {
      const g = await current(now);
      check(g, 404, 'O‘yin topilmadi — «Yangi o‘yin»ni bosing.');
      if (v.op === 'start') {
        check(g!.status === 'lobby', 409, 'O‘yin allaqachon boshlangan.');
        await startGame(g!, now, false);
      } else {
        check(g!.status === 'run', 409, 'O‘yin ketmayapti.');
        await finishIfOver({ ...g!, ends: now }, now);
      }
    }
    return { view: await raceView(null, now) };
  }

  if (v.op === 'join') {
    let g = await current(now);
    if (!g || g.status === 'done') {
      // o'qituvchi hali o'yin ochmagan bo'lsa — birinchi kirgan talaba kutish xonasini ochadi (avtomatik jamoalar)
      check(!g || g.empty, 409, 'Bu o‘yin tugadi — o‘qituvchi yangisini boshlaydi.');
      g = await createGame('auto', now, { auto: true });
    }
    const pid = v.pid && g.players[v.pid] ? v.pid : newId(8);
    const existing = g.players[pid];
    let t = '';
    if (!g.auto) {
      check(v.team === 'a' || v.team === 'b', 400, 'Jamoangizni tanlang.');
      check(
        !existing || existing.t === v.team || g.status === 'lobby',
        409,
        'O‘yin boshlangan — jamoani almashtirib bo‘lmaydi.',
      );
      t = v.team!;
    }
    check(
      existing || Object.keys(g.players).length < RACE.maxPlayers,
      429,
      'O‘yinchilar soni to‘ldi.',
    );
    await siteUpdate({
      [base(g.id) + '/players/' + pid]: { n: v.name, t, at: existing?.at || now },
    });
    return { pid, view: await raceView(pid, now) };
  }

  // ---------- javob ----------
  const g = await current(now);
  check(
    g && g.status === 'run' && now < (g.ends || 0),
    409,
    'O‘yin tugagan yoki hali boshlanmagan.',
  );
  check(g!.players[v.pid], 404, 'Avval poygaga qo‘shiling.');
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
