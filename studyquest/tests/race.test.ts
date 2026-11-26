import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import BANK from '../lib/race-questions.json';
import {
  RACE,
  pointsFor,
  raceAct,
  raceLive,
  raceView,
  splitTeams,
  teamCount,
  teamInfo,
  teamKey,
} from '../lib/server/race';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';
import { demoKahoot, manageLive } from '../lib/server/live-admin';
import { liveGame } from '../lib/server/news';
import { liveAnnounceText, liveReminderText } from '../lib/server/push';
import { khDay, makeGame } from '../lib/live-quiz';

/* 🏁 Jamoaviy poyga: savollar banki, ball, avtomatik jamoalar (2–5 kishi), qo'lda tanlash, marra, rejalashtirish
   va jonli test o'rniga poyga. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
  Object.assign(demoKahoot, { cfg: null, bank: {}, idx: {}, games: {}, res: {} });
});
const teacher = { id: 't1', uid: 't1', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const admin = { id: 'ad', uid: 'ad', role: 'admin', name: 'Admin' } as unknown as Actor;
const student = { id: 's1', uid: 's1', role: 'student', name: 'Ali' } as unknown as Actor;
type Q = { t: number; q: string; a: string[]; c: number; e: string };
const bank = BANK as Q[];
/** Ko'rsatilgan savolning to'g'ri variant raqami (aralashtirilgan tartibda). */
const rightIndex = (shown: { q: string; a: string[] }) => {
  const b = bank.find((x) => x.q === shown.q && x.a.every((o) => shown.a.includes(o)))!;
  return shown.a.indexOf(b.a[b.c]);
};
type View = Awaited<ReturnType<typeof raceView>>;
const me = (v: View) => ('me' in v ? v.me : undefined);

describe('question bank', () => {
  it('has mixed multiple-choice questions from all ten topics', () => {
    expect(bank.length).toBeGreaterThanOrEqual(140);
    for (let t = 1; t <= 10; t++)
      expect(bank.filter((q) => q.t === t).length).toBeGreaterThanOrEqual(RACE.perTopic);
    for (const q of bank) {
      expect(q.a.length).toBe(4);
      expect(new Set(q.a).size).toBe(4);
      expect(q.c).toBeGreaterThanOrEqual(0);
      expect(q.c).toBeLessThan(4);
      expect(q.q).not.toMatch(/<[a-z]/i);
      expect(q.e.length).toBeGreaterThan(3);
    }
  });
});

it('gives more points for faster right answers and none for wrong ones', () => {
  expect(pointsFor(true, 1500)).toBe(10);
  expect(pointsFor(true, 4000)).toBe(10);
  expect(pointsFor(true, 6000)).toBe(9);
  expect(pointsFor(true, 9000)).toBe(8);
  expect(pointsFor(true, 60000)).toBe(4);
  expect(pointsFor(false, 500)).toBe(0);
});

it('splits players into teams of 2 to 5 depending on how many joined', () => {
  for (let n = 1; n <= 60; n++) {
    const ids = Array.from({ length: n }, (_, i) => 'p' + i);
    const { assign, teams } = splitTeams(ids);
    expect(teams).toHaveLength(teamCount(n));
    expect(Object.keys(assign)).toHaveLength(n);
    const sizes = teams.map((t) => Object.values(assign).filter((x) => x === t).length);
    if (n >= 4) {
      expect(teams.length).toBeGreaterThanOrEqual(2);
      for (const s of sizes) {
        expect(s).toBeGreaterThanOrEqual(RACE.teamMin);
        expect(s).toBeLessThanOrEqual(RACE.teamMax);
      }
    } else expect(teams).toHaveLength(1); // 4 kishidan kam — bitta jamoa
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  }
  expect(teamCount(4)).toBe(2);
  expect(teamCount(10)).toBe(2);
  expect(teamCount(11)).toBe(3);
  expect(teamCount(23)).toBe(5);
  expect([0, 1, 25, 26, 27].map(teamKey)).toEqual(['a', 'b', 'z', 'a2', 'b2']);
  expect(teamInfo('a')).toEqual({ name: 'Yashil jamoa', color: '#16a34a' });
  expect(teamInfo('c').name).toBe('Ko‘k jamoa');
  expect(teamInfo('a2').name).toBe('27-jamoa');
});

describe('race game', () => {
  it('auto teams: students only type a name; the start splits them into teams of 2–5; late joiners fill the smallest team', async () => {
    const t0 = 1_800_000_000_000;
    // havola bilan kirgan birinchi talaba kutish xonasini ochadi — avtomatik jamoalar
    const first = await raceAct(null, { op: 'join', name: '  Ali   Valiyev ', team: 'a' }, t0);
    expect(first.view).toMatchObject({ status: 'lobby', auto: true, teams: [] });
    expect(first.view.joined).toEqual([{ n: 'Ali Valiyev', me: true }]);
    const pids: string[] = [first.pid!];
    for (let i = 1; i < 11; i++)
      pids.push((await raceAct(null, { op: 'join', name: 'Talaba ' + i }, t0 + i)).pid!);
    // boshqaruv — faqat o'qituvchi
    await expect(raceAct(student, { op: 'start' }, t0)).rejects.toMatchObject({ status: 403 });
    const started = await raceAct(teacher, { op: 'start' }, t0 + 1000);
    expect(started.view.status).toBe('run');
    // 11 kishi → 3 jamoa (4, 4, 3)
    expect(started.view.teams.map((t) => t.members.length).sort()).toEqual([3, 4, 4]);
    expect(started.view.teams.map((t) => t.name)).toEqual([
      'Yashil jamoa',
      'Binafsha jamoa',
      'Ko‘k jamoa',
    ]);
    const v0 = await raceView(pids[0], t0 + 1100);
    expect(me(v0)!.t).toMatch(/^[abc]$/);
    expect(me(v0)!.team).toEqual(teamInfo(me(v0)!.t));
    expect(me(v0)!.question!.qi).toBe(0);

    // kech kelgan — eng kichik jamoaga (3 kishilik)
    const late = await raceAct(null, { op: 'join', name: 'Kech qolgan' }, t0 + 2000);
    const small = started.view.teams.find((t) => t.members.length === 3)!.key;
    expect(me(late.view)!.t).toBe(small);
    expect(me(late.view)!.question).toBeTruthy();
    // jamoalar to'lgach (hammasi 5 kishi) — yangi jamoa ochiladi
    for (let i = 0; i < 3; i++) await raceAct(null, { op: 'join', name: 'Kech ' + i }, t0 + 3000);
    const full = await raceView(null, t0 + 4000);
    expect(full.teams.map((t) => t.members.length)).toEqual([5, 5, 5]);
    const extra = await raceAct(null, { op: 'join', name: 'Yangi jamoa' }, t0 + 5000);
    expect(me(extra.view)!.t).toBe('d');
    expect(extra.view.teams).toHaveLength(4);

    // Ali jamoasi tez javob beradi — o'sha jamoa marraga yetadi va yutadi
    const myTeam = me(v0)!.t;
    let t = t0 + 1100,
      last = v0;
    for (let i = 0; i < 10; i++) {
      t += 1500;
      const q = me(await raceView(pids[0], t))!.question!;
      last = (await raceAct(null, { op: 'answer', pid: pids[0], qi: i, k: rightIndex(q) }, t)).view;
    }
    expect(last.status).toBe('done');
    expect('winner' in last && last.winner).toBe(myTeam);
  });

  it('pick mode: two teams chosen by the students, switching only in the lobby', async () => {
    const t0 = 1_800_000_000_000;
    await raceAct(teacher, { op: 'new', auto: false }, t0);
    await expect(raceAct(null, { op: 'join', name: 'Ali' }, t0)).rejects.toMatchObject({
      status: 400,
    });
    const ali = await raceAct(null, { op: 'join', name: 'Ali', team: 'a' }, t0);
    const vali = await raceAct(null, { op: 'join', name: 'Vali', team: 'b' }, t0 + 1);
    expect(vali.view.teams.map((t) => [t.key, t.members.length])).toEqual([
      ['a', 1],
      ['b', 1],
    ]);
    const moved = await raceAct(null, { op: 'join', name: 'Vali', team: 'a', pid: vali.pid! }, t0);
    expect(moved.pid).toBe(vali.pid);
    expect(moved.view.teams[0].members).toHaveLength(2);
    await raceAct(null, { op: 'join', name: 'Vali', team: 'b', pid: vali.pid! }, t0);
    await raceAct(teacher, { op: 'start' }, t0 + 1000);
    await expect(
      raceAct(null, { op: 'join', name: 'Vali', team: 'a', pid: vali.pid! }, t0 + 1100),
    ).rejects.toMatchObject({ status: 409 });
    // savol: to'g'ri javob yuborilmaydi; har o'yinda har mavzudan 3 tadan
    const v1 = await raceView(ali.pid!, t0 + 2000);
    const q1 = me(v1)!.question!;
    expect(Object.keys(q1).sort()).toEqual(['a', 'q', 'qi', 't']);
    expect(JSON.stringify(v1)).not.toMatch(/"qs"|"right"|"explain"|"assign"/);
    const gid = 'id' in v1 ? v1.id : '';
    const meta = (await siteGet<{ qs: { i: number }[] }>(`race/g/${gid}/meta`))!;
    const topics = meta.qs.map((x) => bank[x.i].t);
    for (let t = 1; t <= 10; t++) expect(topics.filter((x) => x === t)).toHaveLength(3);
    // tez to'g'ri javob — 10 ball; qayta javob berib bo'lmaydi; ochilmagan savolga ham
    const r1 = await raceAct(
      null,
      { op: 'answer', pid: ali.pid!, qi: 0, k: rightIndex(q1) },
      t0 + 4000,
    );
    expect(r1.result).toMatchObject({ ok: true, points: 10, ms: 2000 });
    await expect(
      raceAct(null, { op: 'answer', pid: ali.pid!, qi: 0, k: 0 }, t0 + 4100),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      raceAct(null, { op: 'answer', pid: ali.pid!, qi: 2, k: 0 }, t0 + 4200),
    ).rejects.toMatchObject({ status: 409 });
    // noto'g'ri javob — 0 ball, to'g'ri javob va izoh qaytadi
    const qv = me(await raceView(vali.pid!, t0 + 5000))!.question!;
    const rv = await raceAct(
      null,
      { op: 'answer', pid: vali.pid!, qi: 0, k: (rightIndex(qv) + 1) % 4 },
      t0 + 7000,
    );
    expect(rv.result).toMatchObject({ ok: false, points: 0, right: rightIndex(qv) });
    // o'qituvchi to'xtatadi — oldindagi jamoa yutadi; yangi o'yin eskisini o'chiradi
    const stopped = await raceAct(teacher, { op: 'stop' }, t0 + 8000);
    expect(stopped.view).toMatchObject({ status: 'done', winner: 'a' });
    await expect(
      raceAct(null, { op: 'join', name: 'Kech', team: 'a' }, t0 + 9000),
    ).rejects.toMatchObject({ status: 409 });
    await raceAct(teacher, { op: 'new' }, t0 + 9100);
    expect(await siteGet(`race/g/${gid}`)).toBeNull();
  });

  it('a scheduled race starts by itself at its time and ends on time; with nobody it closes', async () => {
    const t0 = 1_800_000_000_000;
    const start = t0 + 30 * 60000;
    await expect(raceAct(teacher, { op: 'schedule', start: t0 - 1 }, t0)).rejects.toMatchObject({
      status: 400,
    });
    await raceAct(teacher, { op: 'schedule', start }, t0);
    expect(await raceLive(t0)).toMatchObject({
      type: 'race',
      start,
      open: start - RACE.lobbyMs,
      end: start + RACE.ms,
    });
    const a = await raceAct(null, { op: 'join', name: 'Ali' }, t0 + 1000);
    for (const n of ['Bek', 'Gul', 'Dil', 'Eli'])
      await raceAct(null, { op: 'join', name: n }, t0 + 2000);
    expect((await raceView(a.pid!, start - 1)).status).toBe('lobby');
    // vaqti keldi — o'zi boshlanadi, 5 kishi → 2 jamoa (3 va 2)
    const v = await raceView(a.pid!, start + 500);
    expect(v).toMatchObject({ status: 'run', start, ends: start + RACE.ms });
    expect(v.teams.map((t) => t.members.length).sort()).toEqual([2, 3]);
    expect(me(v)!.question).toBeTruthy();
    expect((await raceView(null, start + RACE.ms + 1)).status).toBe('done');

    // hech kim qo'shilmagan rejali poyga — vaqtida yopiladi
    await raceAct(teacher, { op: 'schedule', start: start + 3600000 }, start + 1000);
    const empty = await raceView(null, start + 3600000 + 1);
    expect(empty).toMatchObject({ status: 'done', empty: true });
    expect(await raceLive(start + 3600000 + 1)).toBeNull();
    // bo'sh o'yindan keyin talaba kirsa — yangi kutish xonasi ochiladi
    const again = await raceAct(null, { op: 'join', name: 'Ali' }, start + 3600000 + 2);
    expect(again.view.status).toBe('lobby');
  });

  it('the administrator replaces today’s live quiz with a race at the same time; news and push messages show it', async () => {
    // 2026-11-26 15:00 UTC = 20:00 Toshkent
    const now = Date.UTC(2026, 10, 26, 6, 0);
    const d = khDay(now);
    const g = makeGame(
      d,
      { time: '20:00', qsec: 15 },
      [
        { id: 'q1', t: 'Savol 1', o: ['a', 'b', 'c', 'd'], c: 0, tp: 1 },
        { id: 'q2', t: 'Savol 2', o: ['a', 'b', 'c', 'd'], c: 0, tp: 1 },
        { id: 'q3', t: 'Savol 3', o: ['a', 'b', 'c', 'd'], c: 0, tp: 1 },
        { id: 'q4', t: 'Savol 4', o: ['a', 'b', 'c', 'd'], c: 0, tp: 1 },
      ] as never,
      () => 0.5,
    );
    demoKahoot.games[d] = g;
    demoKahoot.idx[d] = {
      start: g.meta.start,
      open: g.meta.open,
      end: g.meta.end,
      nq: 4,
      qsec: 15,
      qs: ['q1', 'q2', 'q3', 'q4'],
    };
    expect(await liveGame(now)).toMatchObject({ type: 'quiz', start: g.meta.start });
    // faqat administrator
    await expect(raceAct(teacher, { op: 'replaceLive', d }, now)).rejects.toMatchObject({
      status: 403,
    });
    await raceAct(admin, { op: 'replaceLive', d }, now);
    expect(demoKahoot.idx[d]).toMatchObject({ x: 1 }); // jonli test bekor qilindi
    const live = (await liveGame(now))!;
    expect(live).toMatchObject({ type: 'race', start: g.meta.start });
    await expect(raceAct(admin, { op: 'replaceLive', d }, now)).rejects.toMatchObject({
      status: 409,
    });
    expect(liveAnnounceText(live, now)).toMatchObject({
      t: '🏁 Bugun 20:00 da jamoaviy poyga',
      u: '/poyga',
    });
    expect(liveReminderText(live)).toMatchObject({
      t: '🏁 Jamoaviy poyga 20:00 da boshlanadi',
      u: '/poyga',
    });
    // talaba havola bilan kiradi; vaqti kelganda o'zi boshlanadi
    const view = await raceView(null, now);
    expect(view).toMatchObject({ status: 'lobby', auto: true, plan: g.meta.start });
  });

  it('rejects bad input', async () => {
    await expect(raceAct(null, { op: 'join', name: 'A' })).rejects.toThrow();
    await expect(raceAct(null, { op: 'join', name: 'Ali', team: 'ZZ' })).rejects.toThrow();
    await expect(raceAct(null, { op: 'answer', pid: 'x', qi: 0, k: 0 })).rejects.toThrow();
    await expect(raceAct(null, { op: 'hack' })).rejects.toThrow();
    await expect(raceAct(null, { op: 'new' })).rejects.toMatchObject({ status: 403 });
    expect((await raceView(null)).status).toBe('none');
    void manageLive;
  });
});
