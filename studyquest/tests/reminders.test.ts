import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { remindersFor } from '../lib/reminders';
import {
  manageReminders,
  publicReminders,
  readReminders,
  remindersForUser,
} from '../lib/server/reminders';
import { resetSiteMemory, siteUpdate } from '../lib/server/site-content';

/* 🔔 Bosh sahifadagi «Eslatmalar»: administrator boshqaradi; hammaga, guruhlarga yoki talabalarga. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const who = (id: string, role: string) =>
  ({ id, uid: id, role, name: 'X', classId: '', learnerType: 'university' }) as unknown as Actor;
const admin = who('owner', 'admin');

it('the administrator adds, limits and removes reminders and switches the automatic ones', async () => {
  const now = Date.now();
  expect(await readReminders(now)).toEqual({ items: [], auto: { topics: true, live: true } });
  await expect(
    manageReminders(who('t', 'teacher'), { op: 'add', t: 'Ertaga seminar' }),
  ).rejects.toMatchObject({ status: 403 });
  await manageReminders(admin, { op: 'add', t: 'Ertaga 9:00 da seminar', link: '#courses' }, now);
  const r = await manageReminders(
    admin,
    { op: 'add', t: 'Bir soatlik', until: now + 3600000 },
    now + 1,
  );
  expect(r.items.map((x) => x.t)).toEqual(['Bir soatlik', 'Ertaga 9:00 da seminar']);
  expect((await readReminders(now + 7200000)).items.map((x) => x.t)).toEqual([
    'Ertaga 9:00 da seminar',
  ]);
  await expect(
    manageReminders(admin, { op: 'add', t: 'x', link: 'javascript:alert(1)' }),
  ).rejects.toBeTruthy();
  await expect(
    manageReminders(admin, { op: 'add', t: 'Eski', until: now - 1000 }, now),
  ).rejects.toMatchObject({ status: 400 });
  let next = await manageReminders(admin, { op: 'auto', topics: false }, now);
  expect(next.auto).toEqual({ topics: false, live: true });
  next = await manageReminders(admin, { op: 'remove', id: next.items[0].id }, now);
  expect(next.items.map((x) => x.t)).toEqual(['Ertaga 9:00 da seminar']);
});

it('reminders for groups and students reach only them and are never public', async () => {
  const now = Date.now();
  await manageReminders(admin, { op: 'add', t: 'Hammaga' }, now);
  await manageReminders(
    admin,
    { op: 'add', t: 'Ikki guruhga', groups: ['AP-223', 'FIZ-123'] },
    now + 1,
  );
  await manageReminders(
    admin,
    { op: 'add', t: 'Aliga shaxsan', users: [{ id: 'legacy_ali', name: 'Ali Valiyev' }] },
    now + 2,
  );
  const all = await readReminders(now);
  expect(all.items.find((x) => x.t === 'Ikki guruhga')?.groups).toEqual(['AP-223', 'FIZ-123']);
  expect(all.items.find((x) => x.t === 'Aliga shaxsan')?.users).toEqual([
    { id: 'legacy_ali', name: 'Ali Valiyev' },
  ]);
  // ochiq ma'lumotda — faqat hammaga atalgani
  expect((await publicReminders(now)).items.map((x) => x.t)).toEqual(['Hammaga']);
  // shaxsiy: guruhiga va o'ziga atalganlari (boshqa kimlarga yozilgani ko'rinmaydi)
  const ali = await remindersForUser({ id: 'legacy_ali', group: 'ap-223' }, now);
  expect(ali.map((x) => x.t)).toEqual(['Aliga shaxsan', 'Ikki guruhga']);
  expect(ali.every((x) => !('users' in x) && !('groups' in x))).toBe(true);
  expect(
    (await remindersForUser({ id: 'legacy_vali', group: 'FIZ-123' }, now)).map((x) => x.t),
  ).toEqual(['Ikki guruhga']);
  expect(await remindersForUser({ id: 'legacy_x', group: 'T-123' }, now)).toEqual([]);
  // mijoz tomonidagi filtr ham shunday
  expect(remindersFor(all.items, { id: 'legacy_x', group: 'T-123' }, now).map((x) => x.t)).toEqual([
    'Hammaga',
  ]);
  // eski yozuv (bitta group) ham guruhga atalgan bo'lib o'qiladi
  await siteUpdate({
    'reminders/items/abcdefabcdef': { t: 'Eski guruh', group: 'T-123', at: now },
  });
  expect((await remindersForUser({ id: 'z', group: 'T-123' }, now)).map((x) => x.t)).toEqual([
    'Eski guruh',
  ]);
  await expect(
    manageReminders(admin, { op: 'add', t: 'Yomon', users: [{ id: '../x', name: 'X' }] }),
  ).rejects.toBeTruthy();
});
