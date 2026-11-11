import { beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type { Actor } from '../lib/types';
import {
  khDay,
  makeGame,
  parseBulk,
  questionId,
  scoreQuiz,
  scoreRace,
  type Game,
} from '../lib/live-quiz';
import { demoKahoot, liveAdmin, manageLive } from '../lib/server/live-admin';
import { liveGame } from '../lib/server/news';

/* ⚡ Sayt boshqaruvi → Jonli test: server asl o'qituvchi panelidagi (engine_js.txt) bilan aynan bir xil ma'lumot
   yozishi kerak — arena va taqdimotlar o'sha formatni o'qiydi. */

const root = path.resolve(__dirname, '../..');
/** Asl manbadan funksiyani olish (qavslarni sanab). */
function legacy(file: string, name: string) {
  const src = fs.readFileSync(path.join(root, '_reyting-manba', file), 'utf8'),
    start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(name + ' topilmadi');
  let depth = 0,
    i = src.indexOf('{', start);
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  return src.slice(start, i + 1);
}
const old = vm.createContext({});
vm.runInContext(
  [
    legacy('engine_js.txt', 'nrm'),
    legacy('engine_js.txt', 'hash32'),
    legacy('engine_js.txt', 'khQid'),
    legacy('engine_js.txt', 'khScore'),
    legacy('engine_js.txt', 'khParse'),
    legacy('yozuv_ball.js', 'yzWords'),
    legacy('yozuv_ball.js', 'yzScore'),
  ].join('\n'),
  old,
);
const legacyCall = (fn: string, ...args: unknown[]) =>
  JSON.parse(JSON.stringify(vm.runInContext(fn, old)(...args)));

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  Object.assign(demoKahoot, { cfg: null, bank: {}, idx: {}, games: {}, res: {} });
});
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
// 2026-11-06 15:00 UTC = 20:00 Toshkent.
const now = Date.UTC(2026, 10, 6, 15, 0);
const seeded =
  (seed = 7) =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
const questions = Array.from({ length: 6 }, (_, i) => ({
  t: `Savol raqami ${i + 1}: qaysi javob to‘g‘ri?`,
  o: [`To‘g‘ri ${i + 1}`, `Xato A${i}`, `Xato B${i}`, `Xato C${i}`],
  c: 0,
  tp: i < 3 ? 'm1' : '',
}));

it('keeps question ids, bulk parsing and scoring identical to the original engine', () => {
  for (const t of [
    'Bozor nima?',
    'Talab va taklif qonuni nimani anglatadi?',
    'Ўзбек тилида савол?',
  ])
    expect(questionId(t)).toBe(legacyCall('khQid', t));
  const bulk =
    '1) Ruchka va daftar 11 000 so‘m. Daftar necha so‘m?\n500 *\n1 000\n1 500\n100\n\n' +
    'Ikkinchi savol matni\n+ To‘g‘risi\nA) Xato\nB) Xato 2\nXato 3\n\nNotugal\nfaqat bitta javob';
  expect(parseBulk(bulk)).toEqual(legacyCall('khParse', bulk));
  expect(parseBulk(bulk).bad).toBe(1);

  // Haqiqiy o'yinga o'xshash ma'lumot: 9 o'yinchi, 5 savol, har xil tezlik.
  const g = makeGame('2026-11-07', { time: '20:00', qsec: 15 }, questions.slice(0, 5), seeded());
  g.p = {};
  g.a = {};
  const rnd = seeded(11);
  for (let s = 0; s < 9; s++) {
    g.p['s' + s] = { n: 'Talaba ' + s, g: 'AP-1', at: now + s };
    for (let i = 0; i < 5; i++) {
      const q = (g.q as Record<number, { at: number }>)[i],
        k = (g.k as Record<number, { c: number }>)[i];
      if (rnd() < 0.15) continue;
      ((g.a as Record<number, Record<string, unknown>>)[i] ??= {})['s' + s] = {
        c: rnd() < 0.75 ? k.c : (k.c + 1) % 4,
        t: q.at + Math.floor(rnd() * 15000),
      };
    }
  }
  const mine = scoreQuiz(g),
    theirs = legacyCall('khScore', g);
  expect(mine.prizes).toEqual(theirs.prizes);
  expect(mine.valid).toBe(theirs.valid);
  expect(mine.rows.map((r) => [r.sid, r.s, r.rank])).toEqual(
    theirs.rows.map((r: { sid: string; s: number; rank: number }) => [r.sid, r.s, r.rank]),
  );
  expect(Object.keys(mine.prizes)).toHaveLength(3);

  const race = {
    meta: { type: 'yz', start: now, dur: 60, mode: 'fin', nw: 4, min: 3, pr: { a: [5, 4, 3] } },
    q: { 0: { at: now - 4000, t: 'bir ikki uch tort' } },
    k: {},
    p: { a: { n: 'A', at: 1 }, b: { n: 'B', at: 2 }, c: { n: 'C', at: 3 }, d: { n: 'D', at: 4 } },
    a: {
      1: { a: { t: now + 900 }, b: { t: now + 1200 }, c: { t: now + 50 }, d: { t: now + 3000 } },
      2: { a: { t: now + 2000 }, b: { t: now + 2600 }, c: { t: now + 80 } },
      4: { a: { t: now + 4000 }, c: { t: now + 120 } },
    },
  } as unknown as Game;
  expect(scoreRace(race).prizes).toEqual(legacyCall('yzScore', race).prizes);
  expect(scoreRace(race).rows.map((r) => r.sid)).toEqual(
    legacyCall('yzScore', race).rows.map((r: { sid: string }) => r.sid),
  );
});

it('builds games in the original format: shuffled answers with a matching key', () => {
  const g = makeGame('2026-11-07', { time: '20:00', qsec: 20, lobby: 10 }, questions, seeded());
  const start = Date.UTC(2026, 10, 7, 15, 0);
  expect(g.meta).toMatchObject({
    start,
    open: start - 600000,
    intro: 10000,
    step: 27000,
    qsec: 20,
    nq: 6,
    min: 7,
    end: start + 10000 + 6 * 27000,
    pr: { big: 20, a: [5, 4, 3], b: [5, 4, 3, 2, 1] },
  });
  questions.forEach((x, i) => {
    const q = (g.q as Record<number, { at: number; t: string; o: string[] }>)[i],
      k = (g.k as Record<number, { cl: number; c: number }>)[i];
    expect(q.t).toBe(x.t);
    expect([...q.o].sort()).toEqual([...x.o].sort());
    expect(q.o[k.c]).toBe(x.o[x.c]);
    expect(q.at).toBe(start + 10000 + i * 27000);
    expect(k.cl).toBe(q.at + 20000);
  });
});

it('lets only the administrator manage the bank and schedules 14 daily games when switched on', async () => {
  await expect(liveAdmin(teacher, now)).rejects.toMatchObject({ status: 403 });
  await expect(manageLive(teacher, { op: 'rebuild' }, now)).rejects.toMatchObject({ status: 403 });
  let v = await liveAdmin(admin, now);
  expect(v.cfg).toMatchObject({ on: false, time: '20:00', nq: 10, qsec: 15 });
  expect(v.bank).toEqual([]);

  v = await manageLive(admin, { op: 'import', questions }, now, seeded());
  expect(v.bank).toHaveLength(6);
  expect(v.games).toEqual([]); // avtomatik o'yin o'chiq
  await expect(manageLive(admin, { op: 'import', questions }, now)).rejects.toMatchObject({
    status: 409,
  });
  await expect(manageLive(admin, { op: 'save', ...questions[0] }, now)).rejects.toMatchObject({
    status: 409,
  });

  v = await manageLive(
    admin,
    { op: 'settings', on: true, time: '20:00', nq: 5, qsec: 20, off: [] },
    now,
    seeded(),
  );
  // Bugun 20:00 — lobbi vaqti o'tgan, shuning uchun ertadan boshlab 14 kun.
  expect(v.games).toHaveLength(14);
  expect(v.games[0]).toMatchObject({ d: '2026-11-07', type: 'quiz', own: false, nq: 5, qsec: 20 });
  expect(v.games.at(-1)!.d).toBe('2026-11-20');
  expect(demoKahoot.cfg).toMatchObject({
    on: true,
    time: '20:00',
    nq: 5,
    qsec: 20,
    min: 7,
    lobby: 10,
  });
  // Har kuni 5 tadan savol; kam ishlatilgani oldin tanlanadi — hammasi deyarli teng.
  const uses = v.bank.map((x) => x.u);
  expect(uses.reduce((a, b) => a + b, 0)).toBe(70);
  expect(Math.max(...uses) - Math.min(...uses)).toBeLessThanOrEqual(1);
  const idx = demoKahoot.idx['2026-11-07'];
  expect(idx.qs).toHaveLength(5);
  expect(demoKahoot.games['2026-11-07'].meta.start).toBe(idx.start);
  // Asl e'lonlar oynasi ham shu jadvalni ko'radi.
  expect(await liveGame(now)).toMatchObject({ d: '2026-11-07', type: 'quiz', nq: 5 });

  // Bo'limni chiqarib tashlash (1-mavzu) — jadval qayta tuziladi, faqat «Umumiy» savollar qoladi.
  v = await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:30', nq: 5, qsec: 20, off: ['m1'] },
    now,
    seeded(),
  );
  expect(v.cfg.off).toEqual(['m1']);
  expect(v.games).toHaveLength(0);
  expect(v.msg).toMatch(/kamida 4 ta savol/);
  expect(v.bank.every((x) => x.u === 0)).toBe(true); // o'ynalmagan savollar qaytarildi
  v = await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:30', nq: 5, qsec: 20, off: [] },
    now,
    seeded(),
  );
  // Bugun 21:30 (lobbi 21:20) hali o'tmagan — bugundan boshlab.
  expect(v.games[0]).toMatchObject({ d: '2026-11-06', state: 'wait' });
  expect(v.games).toHaveLength(14);
});

it('creates a hand-picked game, replaces that day’s automatic one and can stop it', async () => {
  await manageLive(admin, { op: 'import', questions }, now, seeded());
  await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:30', nq: 5, qsec: 15, off: [] },
    now,
    seeded(),
  );
  const auto = demoKahoot.idx['2026-11-06'];
  expect(auto.sp).toBeUndefined();
  const ids = Object.keys(demoKahoot.bank).slice(0, 4);
  await expect(
    manageLive(
      admin,
      { op: 'create', date: '2026-11-06', time: '19:00', qsec: 30, note: '', ids },
      now,
    ),
  ).rejects.toMatchObject({ status: 400 }); // o'tib ketgan vaqt
  let v = await manageLive(
    admin,
    { op: 'create', date: '2026-11-06', time: '20:05', qsec: 30, note: 'Iqtisod', ids },
    now,
    seeded(),
  );
  const own = demoKahoot.idx['2026-11-06'];
  expect(own).toMatchObject({ sp: true, note: 'Iqtisod', qsec: 30, qs: ids, nq: 4 });
  // Avtomatik o'yindagi (hali ko'rilmagan) savollar bankka qaytarildi, yangi o'yinnikilar hisoblandi.
  for (const k of ids) expect(demoKahoot.bank[k]).toMatchObject({ l: '2026-11-06' });
  expect(own.start).toBe(now + 5 * 60000);
  expect(own.open).toBe(now + 15000); // lobbi darhol ochiladi
  expect(v.games[0]).toMatchObject({ d: '2026-11-06', own: true, note: 'Iqtisod' });
  expect(await liveGame(now)).toMatchObject({ d: '2026-11-06', note: 'Iqtisod', qsec: 30 });
  // Lobbi ochilgach shu kunga yangi o'yin tuzib bo'lmaydi.
  await expect(
    manageLive(
      admin,
      { op: 'create', date: '2026-11-06', time: '20:30', qsec: 15, note: '', ids },
      now + 60000,
    ),
  ).rejects.toMatchObject({ status: 409 });
  // To'xtatish: belgi qoladi (avtomatik o'yin qayta tuzilmaydi), o'yin ma'lumoti o'chadi.
  v = await manageLive(admin, { op: 'cancel', d: '2026-11-06' }, now + 60000);
  expect(demoKahoot.idx['2026-11-06']).toMatchObject({ x: 1 });
  expect(demoKahoot.games['2026-11-06']).toBeUndefined();
  expect(v.games.some((g) => g.d === '2026-11-06')).toBe(false);
  v = await manageLive(admin, { op: 'rebuild' }, now + 120000, seeded());
  expect(v.games.some((g) => g.d === '2026-11-06')).toBe(false);
  expect(await liveGame(now + 120000)).toMatchObject({ d: '2026-11-07' });
});

it('moves a scheduled game to another time the same day, keeping its questions', async () => {
  await manageLive(admin, { op: 'import', questions }, now, seeded());
  await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:00', nq: 5, qsec: 20, off: [] },
    now,
    seeded(),
  );
  const before = structuredClone(demoKahoot.idx['2026-11-06']);
  const texts = Object.values(demoKahoot.games['2026-11-06'].q).map((q) => q.t);
  const uses = () => Object.values(demoKahoot.bank).map((x) => (x as { u?: number }).u);
  const usesBefore = uses();
  expect(before.sp).toBeUndefined();
  // talaba yoki o'qituvchi ko'chira olmaydi
  await expect(
    manageLive(teacher, { op: 'move', d: '2026-11-06', time: '21:30' }, now),
  ).rejects.toMatchObject({ status: 403 });
  // o'tib ketgan vaqtga ko'chirib bo'lmaydi
  await expect(
    manageLive(admin, { op: 'move', d: '2026-11-06', time: '19:30' }, now),
  ).rejects.toMatchObject({ status: 400 });
  // 21:00 → 21:30: o'sha savollar, o'sha savol vaqti; endi «siz tuzgan» o'yin
  let v = await manageLive(admin, { op: 'move', d: '2026-11-06', time: '21:30' }, now, seeded());
  const moved = demoKahoot.idx['2026-11-06'];
  expect(moved).toMatchObject({ sp: true, qs: before.qs, nq: 5, qsec: 20 });
  expect(moved.start).toBe(Date.UTC(2026, 10, 6, 16, 30)); // 21:30 Toshkent
  expect(moved.open).toBe(moved.start - 10 * 60000);
  expect(demoKahoot.games['2026-11-06'].meta.start).toBe(moved.start);
  expect(Object.values(demoKahoot.games['2026-11-06'].q).map((q) => q.t)).toEqual(texts);
  expect(v.games[0]).toMatchObject({ d: '2026-11-06', own: true, state: 'wait' });
  // ko'chirish — yangi o'yin emas: savollarning ishlatilish hisobi o'zgarmaydi
  expect(uses()).toEqual(usesBefore);
  expect(await liveGame(now)).toMatchObject({ d: '2026-11-06', start: moved.start });
  // ko'chirilgan o'yin kunlik vaqt sozlamasi o'zgarganda qayta tuzilmaydi
  v = await manageLive(
    admin,
    { op: 'settings', on: true, time: '22:00', nq: 5, qsec: 20, off: [] },
    now,
    seeded(),
  );
  expect(demoKahoot.idx['2026-11-06'].start).toBe(moved.start);
  // lobbi ochilgach ko'chirib bo'lmaydi; yo'q kun — topilmadi
  await expect(
    manageLive(admin, { op: 'move', d: '2026-11-06', time: '22:30' }, moved.open! + 1000),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    manageLive(admin, { op: 'move', d: '2026-12-30', time: '10:00' }, now),
  ).rejects.toMatchObject({ status: 404 });
  // juda yaqin vaqt (lobbi muddatidan kam) — lobbi darhol ochiladi
  v = await manageLive(
    admin,
    { op: 'move', d: '2026-11-07', time: '20:03' },
    Date.UTC(2026, 10, 7, 15, 0),
    seeded(),
  );
  expect(demoKahoot.idx['2026-11-07'].open).toBe(Date.UTC(2026, 10, 7, 15, 0) + 15000);
});

it('finalizes finished games so prizes reach the rating, keeping an earlier result of the same day', async () => {
  await manageLive(admin, { op: 'import', questions }, now, seeded());
  const d = khDay(now - 86400000);
  const g = makeGame(d, { time: '20:00', qsec: 15 }, questions.slice(0, 4), seeded());
  g.p = {};
  g.a = {};
  for (let s = 0; s < 8; s++) {
    g.p['s' + s] = { n: 'Talaba ' + s, g: 'AP-2', at: s };
    for (let i = 0; i < 4; i++)
      ((g.a as Record<number, Record<string, unknown>>)[i] ??= {})['s' + s] = {
        c: (g.k as Record<number, { c: number }>)[i].c,
        t: (g.q as Record<number, { at: number }>)[i].at + 1000 * (s + 1),
      };
  }
  demoKahoot.games[d] = g;
  demoKahoot.idx[d] = { start: g.meta.start, open: g.meta.open, end: g.meta.end, nq: 4, qsec: 15 };
  demoKahoot.res[d] = { n: 3, valid: false, prizes: {}, top: [], r: {}, st: 123, ty: null, at: 1 };
  const v = await liveAdmin(admin, now);
  expect(demoKahoot.res[d]).toMatchObject({
    n: 8,
    valid: true,
    prizes: { s0: 5, s1: 4, s2: 3 },
    st: g.meta.start,
  });
  expect(demoKahoot.res[d + '~123']).toMatchObject({ n: 3 }); // avvalgi natija arxivda
  expect(v.results[0]).toMatchObject({
    d,
    type: 'quiz',
    n: 8,
    valid: true,
    top: [
      { n: 'Talaba 0', g: 'AP-2' },
      { n: 'Talaba 1', g: 'AP-2' },
      { n: 'Talaba 2', g: 'AP-2' },
    ],
  });
  // Ikkinchi marta ochilganda qayta yozilmaydi.
  const before = JSON.stringify(demoKahoot.res);
  await liveAdmin(admin, now + 1000);
  expect(JSON.stringify(demoKahoot.res)).toBe(before);
});

it('edits, deletes and toggles the typing marathon', async () => {
  let v = await manageLive(admin, { op: 'import', questions: questions.slice(0, 2) }, now);
  const id = v.bank[0].id;
  v = await manageLive(
    admin,
    {
      op: 'save',
      id,
      t: 'Yangilangan savol matni?',
      o: ['To‘g‘ri', 'A', 'B', 'C'],
      c: 0,
      tp: 'iqt',
    },
    now,
  );
  expect(v.bank.find((x) => x.id === id)).toMatchObject({
    t: 'Yangilangan savol matni?',
    tp: 'iqt',
  });
  await expect(
    manageLive(
      admin,
      { op: 'save', id: 'qnope', t: 'Yo‘q savol matni', o: ['a', 'b', 'c', 'd'], c: 1 },
      now,
    ),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    manageLive(admin, { op: 'save', t: 'Qisqa', o: ['a', 'b', 'c', 'd'], c: 0 }, now),
  ).rejects.toThrow();
  v = await manageLive(admin, { op: 'delete', ids: [id] }, now);
  expect(v.bank).toHaveLength(1);
  v = await manageLive(admin, { op: 'race', on: true }, now);
  expect(v.cfg.race).toBe(true);
  expect(demoKahoot.cfg?.yz).toBe(true);
});
