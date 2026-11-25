import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import BANK from '../lib/race-questions.json';
import { RACE, pointsFor, raceAct, raceView } from '../lib/server/race';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';

/* 🏁 Jamoaviy poyga: savollar banki, ball, jamoalar, marra va kim boshqaradi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const teacher = { id: 't1', uid: 't1', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const student = { id: 's1', uid: 's1', role: 'student', name: 'Ali' } as unknown as Actor;
type Q = { t: number; q: string; a: string[]; c: number; e: string };
const bank = BANK as Q[];
/** Ko'rsatilgan savolning to'g'ri variant raqami (aralashtirilgan tartibda). */
const rightIndex = (shown: { q: string; a: string[] }) => {
  const b = bank.find((x) => x.q === shown.q && x.a.every((o) => shown.a.includes(o)))!;
  return shown.a.indexOf(b.a[b.c]);
};

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

describe('race game', () => {
  it('runs a two-team race: join, start, answer, finish line and winner', async () => {
    const t0 = 1_800_000_000_000;
    // havola bilan kirgan birinchi talaba kutish xonasini ochadi
    const ali = await raceAct(null, { op: 'join', name: '  Ali   Valiyev ', team: 'a' }, t0);
    expect(ali.pid).toMatch(/^[0-9a-f]{16}$/);
    expect(ali.view.status).toBe('lobby');
    expect(ali.view.teams!.a.members).toEqual([{ n: 'Ali Valiyev', p: 0, r: 0, c: 0, me: true }]);
    const vali = await raceAct(null, { op: 'join', name: 'Vali', team: 'b' }, t0 + 10);
    const gid = ali.view.status !== 'none' ? ali.view.id : '';
    expect(await siteGet<string>('race/current')).toBe(gid);

    // jamoani kutish xonasida almashtirsa bo'ladi
    const moved = await raceAct(
      null,
      { op: 'join', name: 'Vali', team: 'a', pid: vali.pid },
      t0 + 20,
    );
    expect(moved.pid).toBe(vali.pid);
    expect(moved.view.teams!.a.members).toHaveLength(2);
    await raceAct(null, { op: 'join', name: 'Vali', team: 'b', pid: vali.pid }, t0 + 30);

    // savollar o'yin boshlanmaguncha chiqmaydi; boshqaruv — faqat o'qituvchi
    expect((await raceView(ali.pid!, t0 + 40)).me!.question).toBeUndefined();
    await expect(raceAct(null, { op: 'start' }, t0)).rejects.toMatchObject({ status: 403 });
    await expect(raceAct(student, { op: 'start' }, t0)).rejects.toMatchObject({ status: 403 });
    const started = await raceAct(teacher, { op: 'start' }, t0 + 1000);
    expect(started.view.status).toBe('run');
    expect(started.view.total).toBe(30);

    // o'yin boshlangach jamoa almashtirib bo'lmaydi
    await expect(
      raceAct(null, { op: 'join', name: 'Vali', team: 'a', pid: vali.pid }, t0 + 1100),
    ).rejects.toMatchObject({ status: 409 });

    // savol: to'g'ri javob yuborilmaydi; har o'yinda har mavzudan 3 tadan
    const v1 = await raceView(ali.pid!, t0 + 2000);
    const q1 = v1.me!.question!;
    expect(q1.qi).toBe(0);
    expect(q1.a).toHaveLength(4);
    expect(Object.keys(q1).sort()).toEqual(['a', 'q', 'qi', 't']);
    expect(JSON.stringify(v1)).not.toMatch(/"qs"|"right"|"explain"/);
    const meta = (await siteGet<{ qs: { i: number }[] }>(`race/g/${gid}/meta`))!;
    const topics = meta.qs.map((x) => bank[x.i].t);
    for (let t = 1; t <= 10; t++) expect(topics.filter((x) => x === t)).toHaveLength(3);

    // tez to'g'ri javob — 10 ball; qayta javob berib bo'lmaydi
    const r1 = await raceAct(
      null,
      { op: 'answer', pid: ali.pid!, qi: 0, k: rightIndex(q1) },
      t0 + 4000,
    );
    expect(r1.result).toMatchObject({ ok: true, points: 10, ms: 2000 });
    await expect(
      raceAct(null, { op: 'answer', pid: ali.pid!, qi: 0, k: 0 }, t0 + 4100),
    ).rejects.toMatchObject({ status: 409 });
    // javobdan keyin navbatdagi savol darhol beriladi; undan keyingisiga hali javob berib bo'lmaydi
    expect(r1.view.me!.question!.qi).toBe(1);
    await expect(
      raceAct(null, { op: 'answer', pid: ali.pid!, qi: 2, k: 0 }, t0 + 4200),
    ).rejects.toMatchObject({ status: 409 });

    // Vali noto'g'ri javob beradi — 0 ball, to'g'ri javob va izoh qaytadi
    const qv = (await raceView(vali.pid!, t0 + 5000)).me!.question!;
    const wrong = (rightIndex(qv) + 1) % 4;
    const rv = await raceAct(null, { op: 'answer', pid: vali.pid!, qi: 0, k: wrong }, t0 + 7000);
    expect(rv.result!.ok).toBe(false);
    expect(rv.result!.points).toBe(0);
    expect(rv.result!.right).toBe(rightIndex(qv));
    expect(rv.result!.explain).toBeTruthy();

    // Ali jamoasi marraga yetguncha tez javob beradi (o'rtacha 100 ball → 10 ta savol)
    let t = t0 + 4000;
    let last = r1.view;
    for (let i = 1; i < 10; i++) {
      t += 1500;
      const q = (await raceView(ali.pid!, t)).me!.question!;
      expect(q.qi).toBe(i);
      last = (await raceAct(null, { op: 'answer', pid: ali.pid!, qi: i, k: rightIndex(q) }, t))
        .view;
    }
    expect(last.status).toBe('done');
    expect(last.winner).toBe('a');
    expect(last.teams!.a.progress).toBe(100);
    expect(last.teams!.a.members[0]).toMatchObject({ n: 'Ali Valiyev', p: 100, r: 10, c: 10 });
    expect(last.teams!.b.avg).toBe(0);

    // tugagan o'yinga qo'shilib bo'lmaydi; o'qituvchi yangisini ochadi — eski ma'lumot o'chadi
    await expect(
      raceAct(null, { op: 'join', name: 'Kech', team: 'a' }, t + 100),
    ).rejects.toMatchObject({
      status: 409,
    });
    const fresh = await raceAct(teacher, { op: 'new' }, t + 200);
    expect(fresh.view.status).toBe('lobby');
    expect(await siteGet(`race/g/${gid}`)).toBeNull();
    expect((await raceView(ali.pid!, t + 300)).me).toBeUndefined();
  });

  it('ends on time and lets the teacher stop the race early', async () => {
    const t0 = 1_800_000_000_000;
    await raceAct(teacher, { op: 'new' }, t0);
    await expect(raceAct(teacher, { op: 'start' }, t0)).rejects.toMatchObject({ status: 409 });
    const a = await raceAct(null, { op: 'join', name: 'Ali', team: 'a' }, t0);
    const b = await raceAct(null, { op: 'join', name: 'Bek', team: 'b' }, t0);
    await raceAct(teacher, { op: 'start' }, t0 + 100);
    const qb = (await raceView(b.pid!, t0 + 200)).me!.question!;
    await raceAct(null, { op: 'answer', pid: b.pid!, qi: 0, k: rightIndex(qb) }, t0 + 9000);
    const qa = (await raceView(a.pid!, t0 + 200)).me!.question!;
    // vaqt tugagach javob qabul qilinmaydi, oldindagi jamoa yutadi
    await expect(
      raceAct(
        null,
        { op: 'answer', pid: a.pid!, qi: 0, k: rightIndex(qa) },
        t0 + 100 + RACE.ms + 1,
      ),
    ).rejects.toMatchObject({ status: 409 });
    const over = await raceView(null, t0 + 100 + RACE.ms + 1);
    expect(over).toMatchObject({ status: 'done', winner: 'b' });

    // to'xtatish: teng bo'lsa — durang
    await raceAct(teacher, { op: 'new' }, t0 + RACE.ms * 2);
    await raceAct(null, { op: 'join', name: 'Ali', team: 'a' }, t0 + RACE.ms * 2);
    await raceAct(teacher, { op: 'start' }, t0 + RACE.ms * 2 + 10);
    await expect(raceAct(student, { op: 'stop' }, t0 + RACE.ms * 2 + 20)).rejects.toMatchObject({
      status: 403,
    });
    const stopped = await raceAct(teacher, { op: 'stop' }, t0 + RACE.ms * 2 + 30);
    expect(stopped.view).toMatchObject({ status: 'done', winner: 'tie' });
  });

  it('rejects bad input', async () => {
    await expect(raceAct(null, { op: 'join', name: 'A', team: 'a' })).rejects.toThrow();
    await expect(raceAct(null, { op: 'join', name: 'Ali', team: 'c' })).rejects.toThrow();
    await expect(raceAct(null, { op: 'answer', pid: 'x', qi: 0, k: 0 })).rejects.toThrow();
    await expect(raceAct(null, { op: 'hack' })).rejects.toThrow();
    expect((await raceView(null)).status).toBe('none');
  });
});
