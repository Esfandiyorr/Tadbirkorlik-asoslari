import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { remindersFor } from '../lib/reminders';
import { manageReminders, readReminders } from '../lib/server/reminders';
import { resetSiteMemory } from '../lib/server/site-content';

/* 🔔 Bosh sahifadagi «Eslatmalar»: administrator boshqaradi, talabaga guruhi va muddati bo'yicha chiqadi. */
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
  let r = await manageReminders(
    admin,
    { op: 'add', t: 'AP-223: uy vazifasi', group: 'AP-223', until: now + 3600000 },
    now + 1,
  );
  expect(r.items.map((x) => x.t)).toEqual(['AP-223: uy vazifasi', 'Ertaga 9:00 da seminar']);
  // guruh va muddat bo'yicha
  expect(remindersFor(r, 'AP-223', now).length).toBe(2);
  expect(remindersFor(r, 'ap-223', now).length).toBe(2);
  expect(remindersFor(r, 'FIZ-123', now).map((x) => x.t)).toEqual(['Ertaga 9:00 da seminar']);
  expect(remindersFor(r, undefined, now + 7200000).map((x) => x.t)).toEqual([
    'Ertaga 9:00 da seminar',
  ]);
  expect((await readReminders(now + 7200000)).items.length).toBe(1);
  await expect(
    manageReminders(admin, { op: 'add', t: 'x', link: 'javascript:alert(1)' }),
  ).rejects.toBeTruthy();
  await expect(
    manageReminders(admin, { op: 'add', t: 'Eski', until: now - 1000 }, now),
  ).rejects.toMatchObject({ status: 400 });
  r = await manageReminders(admin, { op: 'auto', topics: false }, now);
  expect(r.auto).toEqual({ topics: false, live: true });
  r = await manageReminders(admin, { op: 'remove', id: r.items[0].id }, now);
  expect(r.items.map((x) => x.t)).toEqual(['Ertaga 9:00 da seminar']);
});
