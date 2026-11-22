import { beforeEach, expect, it } from 'vitest';
import { recordStaffActivity, staffActivity } from '../lib/server/staff-activity';
import { resetSiteMemory } from '../lib/server/site-content';
import type { Actor } from '../lib/types';
const actor = (role: Actor['role'], id = role) => ({ id, role }) as Actor;
beforeEach(() => {
  process.env.STUDYQUEST_DEMO = 'true';
  resetSiteMemory();
});
it('keeps recent scope information private to staff and bounds the history', async () => {
  const admin = actor('admin'),
    teacher = actor('teacher');
  await expect(staffActivity(actor('student'))).rejects.toMatchObject({ status: 403 });
  await expect(recordStaffActivity(actor('student'), 'topic:open', 'm1')).rejects.toMatchObject({
    status: 403,
  });
  await recordStaffActivity(admin, 'course:revoke', 'restoran · user1');
  expect(await staffActivity(teacher)).toEqual([]);
  await recordStaffActivity(teacher, 'topic:read', 'tad-asoslari · m1');
  expect(await staffActivity(teacher)).toHaveLength(1);
  expect(await staffActivity(admin)).toHaveLength(2);
  for (let i = 0; i < 55; i++)
    await recordStaffActivity(admin, 'topic:open', 'tad-asoslari · m' + i);
  expect(await staffActivity(admin)).toHaveLength(50);
});
