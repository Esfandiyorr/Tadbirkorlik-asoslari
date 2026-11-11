import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { demo, legacyDb } from './repository';
import {
  LIVE_MIN,
  LIVE_SECTIONS,
  QSEC_CHOICES,
  khDay,
  makeGame,
  hash32,
  questionId,
  resultFits,
  scoreGame,
  sectionKey,
  startOf,
  type BankQuestion,
  type Game,
  type IdxEntry,
  type LiveCfg,
  type ResEntry,
} from '../live-quiz';

/* ⚡ Jonli testni boshqarish (administrator → Sayt boshqaruvi → Jonli test).
   Asl o'qituvchi panelidagi «⚡ Jonli test» bilan bir xil ma'lumot: kahoot/{cfg, bank, idx, games, res}.
   Avval bu ishlar o'qituvchi brauzerida bajarilardi (khAuto, khSpBuild, khSpCancel, khRebuild); endi server qiladi —
   administrator SDK qoidalarni chetlab o'tadi, talabalar bankni (to'g'ri javoblarni) o'qiy olmaydi. */

type Bank = Record<string, BankQuestion | { v?: number }>;
type State = {
  cfg: LiveCfg | null;
  bank: Bank;
  idx: Record<string, IdxEntry>;
  res: Record<string, ResEntry>;
};
type Patch = Record<string, unknown>;
interface Store {
  load(now: number): Promise<State>;
  game(d: string): Promise<Game | null>;
  patch(o: Patch): Promise<void>;
  setCfg(c: LiveCfg): Promise<void>;
}
const WINDOW = 31 * 86400000; // yakunlash va natijalar uchun so'nggi ~bir oy

/** Demo/sinov: jonli bazaga ulanmaydigan xotiradagi nusxa. */
export const demoKahoot = ((
  globalThis as {
    __sqKahoot?: {
      cfg: LiveCfg | null;
      bank: Bank;
      idx: Record<string, IdxEntry>;
      games: Record<string, Game>;
      res: Record<string, ResEntry>;
    };
  }
).__sqKahoot ??= { cfg: null, bank: {}, idx: {}, games: {}, res: {} });

function applyPatch(root: Record<string, unknown>, o: Patch) {
  for (const [path, value] of Object.entries(o)) {
    const parts = path.split('/');
    let cur = root;
    for (const part of parts.slice(0, -1)) cur = (cur[part] ??= {}) as Record<string, unknown>;
    const last = parts[parts.length - 1];
    if (value === null) delete cur[last];
    else cur[last] = structuredClone(value);
  }
}
const memoryStore: Store = {
  async load(now) {
    const from = khDay(now - WINDOW);
    const pick = <T>(o: Record<string, T>) =>
      Object.fromEntries(Object.entries(o).filter(([k]) => k >= from)) as Record<string, T>;
    return structuredClone({
      cfg: demoKahoot.cfg,
      bank: demoKahoot.bank,
      idx: pick(demoKahoot.idx),
      res: pick(demoKahoot.res),
    });
  },
  async game(d) {
    return structuredClone(demoKahoot.games[d] || null);
  },
  async patch(o) {
    applyPatch(demoKahoot as unknown as Record<string, unknown>, o);
  },
  async setCfg(c) {
    demoKahoot.cfg = structuredClone(c);
  },
};
const rtdbStore: Store = {
  async load(now) {
    const db = legacyDb(),
      from = khDay(now - WINDOW);
    const [cfg, bank, idx, res] = await Promise.all([
      db.ref('kahoot/cfg').get(),
      db.ref('kahoot/bank').get(),
      db.ref('kahoot/idx').orderByKey().startAt(from).get(),
      db.ref('kahoot/res').orderByKey().startAt(from).get(),
    ]);
    return {
      cfg: cfg.val(),
      bank: bank.val() || {},
      idx: idx.val() || {},
      res: res.val() || {},
    };
  },
  async game(d) {
    return (
      await legacyDb()
        .ref('kahoot/games/' + d)
        .get()
    ).val();
  },
  async patch(o) {
    if (Object.keys(o).length) await legacyDb().ref('kahoot').update(o);
  },
  async setCfg(c) {
    await legacyDb().ref('kahoot/cfg').set(c);
  },
};
const store = () => (demo() ? memoryStore : rtdbStore);

type Question = BankQuestion & { id: string };
const sameText = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ');
/** Savol kaliti: asl khQid (eski panel bilan bir xil). Asl kalit faqat harflarga qaraydi — faqat raqami farq qiladigan
    boshqa savol (masalan, «10 000» va «12 000») shu kalitni egallagan bo'lsa, matndan qo'shimcha belgi olinadi. */
function keyFor(bank: Bank, t: string): { key: string; dup: boolean } {
  const base = questionId(t);
  for (const key of [base, base + hash32(t, 3323198485).slice(0, 4)]) {
    const x = bank[key] as BankQuestion | undefined;
    if (!x?.t) return { key, dup: false };
    if (sameText(x.t, t)) return { key, dup: true };
  }
  return { key: base + hash32(t + '#', 3323198485), dup: false };
}
const bankList = (bank: Bank): Question[] =>
  Object.entries(bank)
    .map(([id, x]) => ({ ...(x as BankQuestion), id }))
    .filter((x) => x && x.t && Array.isArray(x.o));
function giveBack(st: State, o: Patch, ids: string[] | undefined) {
  for (const id of ids || []) {
    const x = st.bank[id] as BankQuestion | undefined;
    if (x && x.t) {
      x.u = Math.max(0, (+(x.u ?? 0) || 0) - 1);
      o['bank/' + id + '/u'] = x.u;
    }
  }
}

/** Tugagan o'yinlar natijasini yozish (sovrinlar umumiy reytingga shu yerdan qo'shiladi) — asl khAuto'ning 1-qismi. */
async function finalize(s: Store, st: State, now: number) {
  const done = Object.keys(st.idx).filter((d) => {
    const e = st.idx[d];
    return e && !e.x && +(e.end ?? 0) < now - 5000 && !resultFits(e, st.res[d]);
  });
  for (const d of done) {
    const g = await s.game(d);
    if (!g?.meta || +g.meta.start !== +st.idx[d].start) continue;
    const r = scoreGame(g),
      top = r.rows.slice(0, 5).map((x) => ({ sid: x.sid, n: x.n, g: x.g, s: x.s })),
      rows: Record<string, [number, number, number]> = {};
    r.rows.forEach((x) => (rows[x.sid] = [x.rank, Math.round(+x.s || 0), r.n]));
    const o: Patch = {},
      prev = st.res[d];
    if (prev) o['res/' + d + '~' + (+prev.st || +prev.at || now)] = prev;
    o['res/' + d] = {
      n: r.n,
      valid: r.valid,
      prizes: r.prizes,
      top,
      r: rows,
      st: +g.meta.start,
      ty: g.meta.type || null,
      at: now,
    };
    await s.patch(o);
    for (const k in o) st.res[k.slice(4)] = o[k] as ResEntry;
  }
}

/** Keyingi 14 kunlik avtomatik o'yinlar (har kuni bittadan) — asl khAuto'ning 2-qismi. Xabar qaytaradi. */
async function schedule(s: Store, st: State, now: number, rnd: () => number) {
  const c = st.cfg || {};
  if (!c.on) return '';
  const tpx = c.tpx || {};
  const pool = bankList(st.bank)
    .filter((x) => !tpx[sectionKey(x.tp)])
    .map((x) => ({ ...x, r: rnd() }));
  const nq = Math.min(+(c.nq ?? 0) || 10, pool.length);
  if (nq < 4)
    return 'Jadval tuzilmadi: kunlik o‘yinga kiradigan bo‘limlarda kamida 4 ta savol bo‘lishi kerak.';
  const days: string[] = [];
  for (let k = 0; k < 15 && days.length < 14; k++) {
    const d = khDay(now + k * 86400000);
    if (st.idx[d]) continue;
    if (startOf(d, String(c.time || '20:00')) - (+(c.lobby ?? 0) || 10) * 60000 <= now + 60000)
      continue; // bugungi vaqt o'tib ketgan
    days.push(d);
  }
  if (!days.length) return '';
  const o: Patch = {};
  for (const d of days) {
    pool.sort(
      (a, b) =>
        (+(a.u ?? 0) || 0) - (+(b.u ?? 0) || 0) ||
        String(a.l || '').localeCompare(String(b.l || '')) ||
        a.r - b.r,
    );
    const pick = pool.slice(0, nq);
    for (const x of pick) {
      x.u = (+(x.u ?? 0) || 0) + 1;
      x.l = d;
      o['bank/' + x.id + '/u'] = x.u;
      o['bank/' + x.id + '/l'] = d;
      Object.assign(st.bank[x.id], { u: x.u, l: d });
    }
    const g = makeGame(d, c, pick, rnd);
    o['games/' + d] = g;
    o['idx/' + d] = {
      start: g.meta.start,
      open: g.meta.open,
      end: g.meta.end,
      nq: g.meta.nq,
      qsec: g.meta.qsec,
      qs: pick.map((x) => x.id),
    };
    st.idx[d] = o['idx/' + d] as IdxEntry;
  }
  await s.patch(o);
  return '';
}
/** Kamida ishtirokchi soni 3 ga tushirildi: sozlama va hali tugamagan o'yinlar (lobbisi ochiq bo'lsa ham) yangilanadi.
    Arena va asl dvigatel «yana N kishi kerak» va ball berilishini o'yinning meta.min idan o'qiydi. */
async function lowerMin(s: Store, st: State, now: number) {
  const o: Patch = {};
  if (st.cfg && +(st.cfg.min ?? 0) !== LIVE_MIN) o['cfg/min'] = LIVE_MIN;
  for (const [d, e] of Object.entries(st.idx))
    if (e && !e.x && e.type !== 'yz' && +(e.end ?? 0) > now && +(e.min ?? 0) !== LIVE_MIN) {
      o['games/' + d + '/meta/min'] = LIVE_MIN;
      o['idx/' + d + '/min'] = LIVE_MIN;
    }
  if (!Object.keys(o).length) return;
  await s.patch(o);
  if (o['cfg/min'] && st.cfg) st.cfg.min = LIVE_MIN;
  for (const [d, e] of Object.entries(st.idx)) if (o['idx/' + d + '/min']) e.min = LIVE_MIN;
}
async function auto(s: Store, st: State, now: number, rnd: () => number) {
  await lowerMin(s, st, now);
  await finalize(s, st, now);
  return schedule(s, st, now, rnd);
}
/** Hali ochilmagan avtomatik o'yinlarni o'chirib, yangi sozlama bilan qayta tuzish — asl khRebuild. */
async function rebuild(s: Store, st: State, now: number, rnd: () => number) {
  const o: Patch = {};
  for (const d of Object.keys(st.idx)) {
    const e = st.idx[d];
    if (!(e && +(e.open ?? 0) > now + 60000) || e.sp) continue;
    o['games/' + d] = null;
    o['idx/' + d] = null;
    giveBack(st, o, e.qs);
  }
  await s.patch(o);
  for (const k of Object.keys(o)) if (k.startsWith('idx/')) delete st.idx[k.slice(4)];
  return auto(s, st, now, rnd);
}

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const section = z.string().refine((v) => LIVE_SECTIONS.some((x) => x.id === v), 'Bo‘lim noto‘g‘ri');
const question = z
  .object({
    t: text(8, 200),
    o: z.array(text(1, 120)).length(4),
    c: z.number().int().min(0).max(3),
    tp: section.optional(),
  })
  .strict();
const day = z.string().regex(/^\d{4}-\d\d-\d\d$/, 'Sanani kiriting');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Vaqtni kiriting');
const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('settings'),
      on: z.boolean(),
      time: hhmm,
      nq: z.number().int().min(5).max(20),
      qsec: z
        .number()
        .int()
        .refine((v) => QSEC_CHOICES.includes(v)),
      off: z.array(z.string().max(8)).max(30),
    })
    .strict(),
  z.object({ op: z.literal('race'), on: z.boolean() }).strict(),
  question.extend({ op: z.literal('save'), id: id.optional() }).strict(),
  z.object({ op: z.literal('delete'), ids: z.array(id).min(1).max(1000) }).strict(),
  z.object({ op: z.literal('import'), questions: z.array(question).min(1).max(500) }).strict(),
  z
    .object({
      op: z.literal('create'),
      date: day,
      time: hhmm,
      qsec: z
        .number()
        .int()
        .refine((v) => QSEC_CHOICES.includes(v)),
      note: z.string().trim().max(140),
      ids: z.array(id).min(4, 'Kamida 4 ta savol tanlang').max(40),
    })
    .strict(),
  z.object({ op: z.literal('cancel'), d: z.string().regex(/^[0-9a-z-]{10,20}$/) }).strict(),
  // ⏰ Rejalashtirilgan o'yinning vaqtini o'zgartirish (shu kun ichida, savollari o'zgarmaydi)
  z.object({ op: z.literal('move'), d: day, time: hhmm }).strict(),
  z.object({ op: z.literal('rebuild') }).strict(),
]);

export type LiveAdminView = ReturnType<typeof view>;
function view(st: State, now: number, msg: string) {
  const c = st.cfg || {};
  const state = (e: IdxEntry) =>
    now < +(e.open ?? e.start) ? 'wait' : now < +e.start ? 'lobby' : 'live';
  return {
    now,
    msg,
    cfg: {
      on: !!c.on,
      time: String(c.time || '20:00'),
      nq: +(c.nq ?? 0) || 10,
      qsec: +(c.qsec ?? 0) || 15,
      min: LIVE_MIN,
      lobby: +(c.lobby ?? 0) || 10,
      race: c.yz === true,
      off: Object.keys(c.tpx || {}).filter((k) => c.tpx![k]),
    },
    bank: bankList(st.bank)
      .map((x) => ({
        id: x.id,
        t: String(x.t),
        o: x.o.map(String),
        c: +x.c || 0,
        tp: x.tp || '',
        u: +(x.u ?? 0) || 0,
      }))
      .sort((a, b) => a.tp.localeCompare(b.tp) || a.t.localeCompare(b.t)),
    games: Object.keys(st.idx)
      .filter((d) => {
        const e = st.idx[d];
        return e && !e.x && +(e.end ?? 0) > now;
      })
      .sort((a, b) => +st.idx[a].start - +st.idx[b].start)
      .map((d) => {
        const e = st.idx[d];
        return {
          d,
          type: e.type === 'yz' ? ('yz' as const) : ('quiz' as const),
          own: !!e.sp,
          start: +e.start,
          open: +(e.open ?? e.start),
          end: +(e.end ?? 0),
          nq: +(e.nq ?? 0) || 0,
          qsec: +(e.qsec ?? 0) || 0,
          note: typeof e.note === 'string' ? e.note : '',
          state: state(e),
        };
      }),
    results: Object.keys(st.res)
      .filter((k) => st.res[k])
      .sort((a, b) => (+st.res[b].st || +st.res[b].at || 0) - (+st.res[a].st || +st.res[a].at || 0))
      .slice(0, 10)
      .map((k) => {
        const r = st.res[k];
        return {
          key: k,
          d: k.split('~')[0],
          start: +r.st || 0,
          type: r.ty === 'yz' ? ('yz' as const) : ('quiz' as const),
          n: +r.n || 0,
          valid: !!r.valid,
          top: (r.top || [])
            .slice(0, 3)
            .map((x) => ({ n: String(x.n || '?'), g: x.g || '', s: +x.s || 0 })),
        };
      }),
  };
}

/** Administrator panelni ochganda: holat + (asl paneldagidek) tugagan o'yinlarni yakunlash va jadvalni to'ldirish. */
export async function liveAdmin(a: Actor, now = Date.now(), rnd: () => number = Math.random) {
  administrator(a);
  const s = store(),
    st = await s.load(now);
  const msg = await auto(s, st, now, rnd);
  return view(st, now, msg);
}

export async function manageLive(
  a: Actor,
  raw: unknown,
  now = Date.now(),
  rnd: () => number = Math.random,
) {
  administrator(a);
  const p = input.parse(raw),
    s = store(),
    st = await s.load(now);
  let msg = '';
  if (p.op === 'settings') {
    const prev = st.cfg || {},
      off = [
        ...new Set(p.off.filter((k) => LIVE_SECTIONS.some((x) => sectionKey(x.id) === k))),
      ].sort();
    const next: LiveCfg = {
      on: p.on,
      time: p.time,
      nq: p.nq,
      qsec: p.qsec,
      min: LIVE_MIN,
      lobby: 10,
      yz: prev.yz === true,
      tpx: off.length ? Object.fromEntries(off.map((k) => [k, true])) : null,
    };
    const was = Object.keys(prev.tpx || {})
      .filter((k) => prev.tpx![k])
      .sort();
    const changed =
      next.time !== prev.time ||
      next.nq !== +(prev.nq ?? 0) ||
      next.qsec !== (+(prev.qsec ?? 0) || 15) ||
      next.on !== !!prev.on ||
      off.join() !== was.join();
    await s.setCfg(next);
    st.cfg = next;
    msg = changed ? await rebuild(s, st, now, rnd) : await auto(s, st, now, rnd);
  } else if (p.op === 'race') {
    await s.patch({ 'cfg/yz': p.on });
    st.cfg = { ...(st.cfg || {}), yz: p.on };
  } else if (p.op === 'save') {
    const found = p.id ? null : keyFor(st.bank, p.t),
      key = p.id || found!.key,
      old = st.bank[key] as BankQuestion | undefined;
    if (p.id) check(old?.t, 404, 'Savol topilmadi — sahifani yangilang.');
    else check(!found!.dup, 409, 'Bu savol bankda allaqachon bor.');
    const q: BankQuestion = { t: p.t, o: p.o, c: p.c, tp: p.tp || '', u: +(old?.u ?? 0) || 0 };
    if (old?.l) q.l = old.l;
    await s.patch({ ['bank/' + key]: q });
    st.bank[key] = q;
    if (!p.id) msg = await auto(s, st, now, rnd);
  } else if (p.op === 'delete') {
    const o: Patch = {};
    for (const k of p.ids) if ((st.bank[k] as BankQuestion | undefined)?.t) o['bank/' + k] = null;
    check(Object.keys(o).length, 404, 'Savollar topilmadi.');
    await s.patch(o);
    for (const k of Object.keys(o)) delete st.bank[k.slice(5)];
  } else if (p.op === 'import') {
    const o: Patch = {};
    for (const x of p.questions) {
      const { key, dup } = keyFor(st.bank, x.t);
      if (dup) continue;
      o['bank/' + key] = st.bank[key] = { t: x.t, o: x.o, c: x.c, tp: x.tp || '', u: 0 };
    }
    check(Object.keys(o).length, 409, 'Yangi savol topilmadi — hammasi bankda bor.');
    await s.patch(o);
    msg = await auto(s, st, now, rnd);
  } else if (p.op === 'create') {
    const picks = p.ids
      .map((k) => ({ id: k, x: st.bank[k] as BankQuestion | undefined }))
      .filter((v) => v.x?.t)
      .map((v) => ({ id: v.id, t: v.x!.t, o: v.x!.o.slice(), c: +v.x!.c || 0 }));
    check(picks.length >= 4, 400, 'Kamida 4 ta savol tanlang.');
    const cfg = st.cfg || {},
      g = makeGame(
        p.date,
        { time: p.time, qsec: p.qsec, min: LIVE_MIN, lobby: +(cfg.lobby ?? 0) || 10 },
        picks,
        rnd,
      );
    if (p.note) g.meta.note = p.note;
    check(
      g.meta.start > now + 60000,
      400,
      'Bu vaqt o‘tib ketgan yoki 1 daqiqadan kam qolgan — kechroq vaqt tanlang.',
    );
    if (g.meta.open <= now + 15000) g.meta.open = now + 15000; // lobbi darhol ochiladi
    const old = st.idx[p.date];
    check(
      !(old && !old.x && +(old.open ?? 0) <= now && +(old.end ?? 0) > now),
      409,
      'Bu kungi o‘yin allaqachon boshlangan yoki lobbisi ochiq.',
    );
    const o: Patch = {};
    o['games/' + p.date] = g;
    o['idx/' + p.date] = {
      start: g.meta.start,
      open: g.meta.open,
      end: g.meta.end,
      nq: g.meta.nq,
      qsec: p.qsec,
      sp: true,
      ...(p.note ? { note: p.note } : {}),
      qs: picks.map((x) => x.id),
    };
    if (old && !old.x && !old.sp && +(old.open ?? 0) > now) giveBack(st, o, old.qs);
    const prev = st.res[p.date];
    if (prev) {
      o['res/' + p.date + '~' + (+prev.st || +prev.at || now)] = prev;
      o['res/' + p.date] = null;
    }
    for (const x of picks) {
      const b = st.bank[x.id] as BankQuestion;
      b.u = (+(b.u ?? 0) || 0) + 1;
      b.l = p.date;
      o['bank/' + x.id + '/u'] = b.u;
      o['bank/' + x.id + '/l'] = p.date;
    }
    await s.patch(o);
    st.idx[p.date] = o['idx/' + p.date] as IdxEntry;
    if (prev) delete st.res[p.date];
  } else if (p.op === 'move') {
    // ⏰ Shu kungi o'yin boshqa soatga ko'chiriladi: savollar, savol vaqti va izoh saqlanadi. Lobbisi ochilgan o'yin
    // ko'chirilmaydi (qo'shilganlar yo'qolmasin). Ko'chirilgan o'yin «siz tuzgan» bo'ladi — kunlik vaqt sozlamasi
    // o'zgartirilganda avtomatik qayta tuzilmaydi.
    const e = st.idx[p.d];
    check(e && !e.x && e.type !== 'yz' && +(e.end ?? 0) > now, 404, 'O‘yin topilmadi.');
    check(
      +(e.open ?? 0) > now,
      409,
      'Lobbisi ochilgan yoki boshlangan o‘yinning vaqtini o‘zgartirib bo‘lmaydi. To‘xtatib, yangisini tuzing.',
    );
    const picks = (e.qs || [])
      .map((k) => st.bank[k] as BankQuestion | undefined)
      .filter((x): x is BankQuestion => !!x?.t && Array.isArray(x.o))
      .map((x) => ({ t: x.t, o: x.o.slice(), c: +x.c || 0 }));
    check(
      picks.length >= 4 && picks.length === (e.qs || []).length,
      409,
      'Bu o‘yinning savollari bankdan o‘chirilgan — «O‘yin tuzish» bilan yangisini tuzing.',
    );
    const cfg = st.cfg || {},
      old = await s.game(p.d),
      g = makeGame(
        p.d,
        {
          time: p.time,
          qsec: +(e.qsec ?? 0) || +(cfg.qsec ?? 0) || 15,
          min: LIVE_MIN,
          lobby: +(cfg.lobby ?? 0) || 10,
        },
        picks,
        rnd,
      );
    const note = old?.meta?.note || (typeof e.note === 'string' ? e.note : '');
    if (note) g.meta.note = note;
    check(
      g.meta.start > now + 60000,
      400,
      'Bu vaqt o‘tib ketgan yoki 1 daqiqadan kam qolgan — kechroq vaqt tanlang.',
    );
    if (g.meta.open <= now + 15000) g.meta.open = now + 15000; // lobbi darhol ochiladi
    const o: Patch = {};
    o['games/' + p.d] = g;
    o['idx/' + p.d] = {
      start: g.meta.start,
      open: g.meta.open,
      end: g.meta.end,
      nq: g.meta.nq,
      qsec: g.meta.qsec,
      sp: true,
      ...(note ? { note } : {}),
      qs: e.qs,
    };
    await s.patch(o);
    st.idx[p.d] = o['idx/' + p.d] as IdxEntry;
  } else if (p.op === 'cancel') {
    const e = st.idx[p.d];
    check(e && !e.x && +(e.end ?? 0) > now, 404, 'O‘yin topilmadi yoki allaqachon tugagan.');
    const o: Patch = { ['games/' + p.d]: null, ['idx/' + p.d]: { x: 1, start: 9e15, at: now } };
    if (now < +(e.open ?? 0)) giveBack(st, o, e.qs); // ko'rilmagan savollar qaytariladi
    await s.patch(o);
    st.idx[p.d] = o['idx/' + p.d] as IdxEntry;
  } else msg = await rebuild(s, st, now, rnd);
  return view(st, now, msg);
}

/** Jadval o'z-o'zidan to'lib tursin: sayt ochilganda (6 soatda ko'pi bilan bir marta) — avval o'qituvchi paneli
    ochilgandagina to'ldirilar edi. Qulf: site/locks/liveAuto (faqat server yozadi). */
let minChecked = false;
export async function liveTopUp(now = Date.now(), rnd: () => number = Math.random) {
  if (demo()) return;
  // har server nusxasida bir marta: kamida ishtirokchi soni (3) jadvaldagi o'yinlarga ham yetib borsin
  if (!minChecked) {
    minChecked = true;
    await lowerMin(rtdbStore, await rtdbStore.load(now), now).catch(() => (minChecked = false));
  }
  const lock = await legacyDb()
    .ref('site/locks/liveAuto')
    .transaction((cur) => (Number(cur) > now - 6 * 3600000 ? undefined : now));
  if (!lock.committed) return;
  const st = await rtdbStore.load(now);
  await auto(rtdbStore, st, now, rnd);
}
