import { createHash } from 'node:crypto';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { staffSummary } from '../lib/server/staff-summary';
import { resetSiteMemory, siteGet, siteUpdate } from '../lib/server/site-content';

/* 🎨 8-mavzu logotip topshirig'i yakunlangan: administrator panelni ochganda uning yozuvlari va rasmlari bir marta
   o'chiriladi; ballar talabaning asl yozuvida (students/<id>/task/m8) qoladi va bu yerda tegilmaydi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const who = (id: string, role: string) => ({ id, uid: id, role, name: 'X' }) as unknown as Actor;
const blob = (uid: string) =>
  'blob/lg-' + createHash('sha256').update(uid).digest('hex').slice(0, 16);

it('the closed logo assignment leaves no records or pictures behind; teachers do not trigger it', async () => {
  await siteUpdate({
    'logoTask/s/legacy_a': { name: 'Ali', group: 'AP-1', code: 'x', at: 1, final: { score: 21 } },
    'logoTask/cfg': { open: true },
    [blob('legacy_a')]: { t: 'image/png', d: 'AAAA', v: 'v1' },
    'blob/other': { t: 'image/png', d: 'BBBB', v: 'v1' },
  });
  await staffSummary(who('t1', 'teacher'));
  expect(await siteGet('logoTask')).toBeTruthy();
  const s = await staffSummary(who('owner', 'admin'));
  expect(s).not.toHaveProperty('logos');
  expect(await siteGet('logoTask')).toBeNull();
  expect(await siteGet(blob('legacy_a'))).toBeNull();
  expect(await siteGet('blob/other')).toBeTruthy(); // boshqa rasmlarga tegilmaydi
  await staffSummary(who('owner', 'admin')); // ikkinchi marta — hech narsa qilmaydi
});
