import { it, expect, beforeAll } from 'vitest';
import { accessMode, canReadLegacy, lessonAccessStates } from '../lib/server/legacy-access';
import { setTopicMode, summarize, topicAccessList } from '../lib/server/topic-access';
import { catalog } from '../lib/seed';

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
const initialAt = (catalog.topics as { modeAt?: number }[])[0].modeAt!;
const after = initialAt + 3600000; // boshlang'ich holat qo'yilganidan bir soat keyin
const student = { id: 'ali', group: 'AP-223', independent: false };

it('applies the requested initial state: 1–6 reading, 7 open with points, 8–15 closed', () => {
  const access = lessonAccessStates({}, student, after);
  for (const id of ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'])
    expect(access[id]).toEqual({ state: 'read' });
  expect(access.m7.state).toBe('score');
  // Ball shu haftaning yakshanbasi 23:59 (UTC+5) gacha: 8-noyabr 23:59 = 18:59 UTC.
  expect(access.m7.due).toBe(Date.UTC(2026, 10, 8, 18, 59));
  for (let n = 8; n <= 15; n++) expect(access['m' + n]).toEqual({ state: 'locked' });
  // Mustaqil o'quvchi ochiq mavzuni faqat o'qiydi; muddat o'tgach 7-mavzu ham o'qish rejimiga o'tadi.
  expect(lessonAccessStates({}, { ...student, independent: true }, after).m7).toEqual({
    state: 'read',
  });
  expect(lessonAccessStates({}, student, Date.UTC(2026, 10, 9, 5)).m7).toEqual({ state: 'read' });
});

it('the latest action wins: teacher mode over older group grants, a newer group grant over the mode', () => {
  const old = { lim: true, g: { 'AP-223': initialAt - 86400000 }, s: {}, at: 0 };
  // Eski guruh ochilishi boshlang'ich holatni bekor qilmaydi.
  expect(lessonAccessStates({ m6: old }, student, after).m6).toEqual({ state: 'read' });
  // Holatdan keyin guruhga ochilsa — guruh qoidasi: o'sha guruh ball oladi, boshqalar o'qiydi.
  const fresh = { lim: true, g: { 'AP-223': after - 60000 }, s: {}, at: 0 };
  expect(lessonAccessStates({ m6: fresh }, student, after).m6.state).toBe('score');
  expect(lessonAccessStates({ m6: fresh }, { ...student, group: 'FIZ-123' }, after).m6).toEqual({
    state: 'read',
  });
  // O'qituvchi bazada tanlagan holat boshlang'ichdan ustun.
  const teacher = {
    m3: { m: 'lock', mt: after - 1000, lim: true },
    m9: { m: 'open', mt: after - 1000, lim: false, at: after - 1000 },
  };
  const access = lessonAccessStates(teacher, student, after);
  expect(access.m3).toEqual({ state: 'locked' });
  expect(access.m9.state).toBe('score');
  // Holatdan oldingi guruh ochilishi baribir e'tiborga olinmaydi, keyingisi esa holatni bekor qiladi.
  expect(accessMode({}, { m: 'read', mt: 5000, g: { X: 4000 } }, 10000)?.m).toBe('read');
  expect(accessMode({}, { m: 'read', mt: 5000, g: { X: 6000 } }, 10000)).toBeNull();
  // Kelajakdagi boshlang'ich holat hali amal qilmaydi.
  expect(accessMode({ mode: 'lock', modeAt: 20000 }, null, 10000)).toBeNull();
});

it('a closed topic cannot be read through the server lesson endpoint either', () => {
  const topic = (
    catalog.topics as { id: string; open?: boolean; mode?: string; modeAt?: number }[]
  ).find((t) => t.id === 'm8')!;
  const reader = {
    id: 'legacy_ali',
    classId: 'AP-223',
    learnerType: 'university',
    role: 'student',
  } as const;
  expect(canReadLegacy(topic, null, reader, after)).toBe(false);
  expect(canReadLegacy(topic, { m: 'read', mt: after - 1, lim: false, at: 1 }, reader, after)).toBe(
    true,
  );
  expect(canReadLegacy(topic, null, { ...reader, role: 'teacher' }, after)).toBe(true);
});

it('summarizes every topic for the teacher and stores a new state', async () => {
  const rows = summarize({}, after);
  expect(rows).toHaveLength(15);
  expect(rows.map((r) => r.state).join(',')).toBe(
    'read,read,read,read,read,read,open,lock,lock,lock,lock,lock,lock,lock,lock',
  );
  expect(rows[6]).toMatchObject({
    id: 'm7',
    source: 'initial',
    due: Date.UTC(2026, 10, 8, 18, 59),
  });
  const groups = summarize(
    { m8: { lim: true, g: { 'AP-223': after - 1000 }, s: { x: after } } },
    after,
  );
  expect(groups[7]).toMatchObject({ state: 'groups', groups: ['AP-223'], students: 1 });

  await expect(setTopicMode({ topic: 'm16', mode: 'open' })).rejects.toThrow();
  await expect(setTopicMode({ topic: 'm8', mode: 'hidden' })).rejects.toThrow();
  const { topics } = await setTopicMode({ topic: 'm8', mode: 'open' });
  expect(topics[7]).toMatchObject({ state: 'open', source: 'teacher' });
  await setTopicMode({ topic: 'm8', mode: 'lock' });
  expect((await topicAccessList()).topics[7]).toMatchObject({ state: 'lock', source: 'teacher' });
});
