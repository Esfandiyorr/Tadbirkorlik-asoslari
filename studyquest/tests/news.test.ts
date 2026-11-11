import { beforeAll, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { manageNews, nextGame, readNews } from '../lib/server/news';

/* 📢 E'lonlar va ⚡ keyingi jonli test (asl dvigateldagi khNext bilan bir xil qoida). */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const now = Date.UTC(2026, 10, 6, 15, 0);

it('picks the next unfinished live quiz and respects the global switch', () => {
  const idx = {
    '2026-11-06-y1000': { open: now - 7200000, start: now - 7000000, end: now - 6000000, nq: 10 },
    '2026-11-07-y2000': {
      open: now + 86400000,
      start: now + 87000000,
      end: now + 88000000,
      nq: 12,
      qsec: 20,
      note: 'Iqtisod',
    },
    '2026-11-06-y2200': {
      open: now + 3000000,
      start: now + 3600000,
      end: now + 4200000,
      type: 'yz',
    },
  };
  expect(nextGame({ on: true }, idx, now)).toEqual({
    d: '2026-11-06-y2200',
    open: now + 3000000,
    start: now + 3600000,
    end: now + 4200000,
    type: 'yz',
    nq: undefined,
    qsec: undefined,
  });
  // O'yin ketayotgan payt ham «keyingi» hisoblanadi (tugaguncha).
  expect(nextGame(null, idx, now + 3700000)?.d).toBe('2026-11-06-y2200');
  expect(nextGame(null, idx, now + 4300000)).toMatchObject({
    d: '2026-11-07-y2000',
    nq: 12,
    qsec: 20,
    note: 'Iqtisod',
    type: 'quiz',
  });
  // O'qituvchi jonli testni o'chirgan: faqat maxsus (sp) o'yinlar qoladi.
  expect(nextGame({ on: false }, idx, now)).toBeNull();
  expect(
    nextGame({ on: false }, { ...idx, special: { ...idx['2026-11-07-y2000'], sp: true } }, now)?.d,
  ).toBe('special');
  expect(nextGame(null, null, now)).toBeNull();
});

it('lets only the administrator post and remove announcements, and hides expired ones', async () => {
  await expect(manageNews(teacher, { op: 'add', t: 'Salom' })).rejects.toMatchObject({
    status: 403,
  });
  await expect(manageNews(admin, { op: 'add', t: 'x' })).rejects.toThrow();
  await expect(
    manageNews(admin, { op: 'add', t: 'Havola', link: 'javascript:alert(1)' }),
  ).rejects.toThrow();
  const first = await manageNews(
    admin,
    { op: 'add', h: 'Amaliy', t: 'Seshanba kuni amaliy mashg‘ulot', link: '#lesson/m3' },
    now,
  );
  const second = await manageNews(
    admin,
    { op: 'add', t: 'Ertaga tugaydigan e’lon', until: now + 86400000 },
    now + 1000,
  );
  expect(second.news.map((x) => x.t)).toEqual([
    'Ertaga tugaydigan e’lon',
    'Seshanba kuni amaliy mashg‘ulot',
  ]);
  expect(first.news[0]).toMatchObject({ h: 'Amaliy', link: '#lesson/m3', at: now });
  // Muddati o'tgan e'lon ko'rinmaydi.
  expect((await readNews(now + 2 * 86400000)).map((x) => x.t)).toEqual([
    'Seshanba kuni amaliy mashg‘ulot',
  ]);
  const removed = await manageNews(admin, { op: 'remove', id: first.news[0].id }, now + 2000);
  expect(removed.news.map((x) => x.t)).toEqual(['Ertaga tugaydigan e’lon']);
  await manageNews(admin, { op: 'remove', id: removed.news[0].id }, now + 3000);
  expect(await readNews(now)).toEqual([]);
});

it('big-window announcements are remembered per user once read', async () => {
  const { markNewsSeen, newsSeen } = await import('../lib/server/news');
  const t = Date.UTC(2026, 10, 7, 9, 0);
  const pop = await manageNews(
    admin,
    { op: 'add', h: 'Muhim', t: 'Ertaga dars bo‘lmaydi', pop: true },
    t,
  );
  const id = pop.news.find((x) => x.t === 'Ertaga dars bo‘lmaydi')!.id;
  expect(pop.news.find((x) => x.id === id)).toMatchObject({ pop: true });
  // e'lonni yozgan administrator uchun allaqachon «o'qildi»
  expect((await newsSeen(admin, t + 1)).seen).toContain(id);
  const ali = { id: 'legacy_ali.1', role: 'student', name: 'Ali' } as unknown as Actor;
  expect((await newsSeen(ali, t + 1)).seen).not.toContain(id);
  expect((await markNewsSeen(ali, { id }, t + 2)).seen).toContain(id);
  expect((await newsSeen(ali, t + 3)).seen).toContain(id);
  // boshqa talabaga hali chiqadi
  expect((await newsSeen({ ...ali, id: 'legacy_bob' } as Actor, t + 3)).seen).not.toContain(id);
  await expect(markNewsSeen(ali, { id: '../x' }, t + 4)).rejects.toThrow();
  // e'lon o'chirilsa — ro'yxatdan ham ketadi
  await manageNews(admin, { op: 'remove', id }, t + 5);
  expect((await newsSeen(ali, t + 6)).seen).not.toContain(id);
});

it('a second-box offer can pop up once and counts as seen like an announcement', async () => {
  const { managePromo, readPromo } = await import('../lib/server/promo');
  const { markNewsSeen, newsSeen } = await import('../lib/server/news');
  const student = { id: 'legacy_ali', role: 'student', name: 'Ali' } as unknown as Actor;
  const t = Date.now();
  const r = await managePromo(
    admin,
    { op: 'add', kind: 'grant', h: 'Yoshlar granti', pop: true },
    t,
  );
  expect(r.id).toBeTruthy();
  const item = (await readPromo(t)).find((x) => x.id === r.id)!;
  expect(item.pop).toBe(true);
  // joylagan administratorga chiqmaydi, talabaga — bir marta
  expect((await newsSeen(admin, t)).seen).toContain(r.id);
  expect((await newsSeen(student, t)).seen).not.toContain(r.id);
  expect((await markNewsSeen(student, { id: r.id }, t)).seen).toContain(r.id);
  // belgisiz taklif katta oynaga chiqmaydi
  const plain = await managePromo(admin, { op: 'add', kind: 'course', h: 'Kurs' }, t);
  expect((await readPromo(t)).find((x) => x.id === plain.id)?.pop).toBeUndefined();
  await managePromo(admin, { op: 'remove', id: r.id! }, t);
  await managePromo(admin, { op: 'remove', id: plain.id! }, t);
});
