import { it, expect, beforeAll } from 'vitest';
import { supportAct, supportList } from '../lib/server/support';

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
const student = { id: 'legacy_ali.1', name: 'Ali Valiyev', role: 'student', classId: 'AP-223' };
const admin = { id: 'owner', name: 'Administrator', role: 'admin' };

it('stores a message to the administrator and keeps it private to the sender', async () => {
  const { message } = await supportAct(
    student,
    'send',
    { cat: 'grade', text: 'Ballim ko‘rinmayapti' },
    1000,
  );
  expect(message).toMatchObject({ uid: 'legacy_ali_1', group: 'AP-223', status: 'new' });
  const mine = await supportList(student, false);
  expect(mine.messages.map((m) => m.id)).toContain(message.id);
  const other = await supportList({ ...student, id: 'legacy_bob' }, false);
  expect(other.messages).toEqual([]);
  await expect(supportList(student, true)).rejects.toMatchObject({ status: 403 });
});

it('validates input, limits flooding and lets only staff reply', async () => {
  const bob = { ...student, id: 'legacy_bob2' };
  await expect(supportAct(bob, 'send', { cat: 'spam', text: 'hello there' })).rejects.toThrow();
  await expect(supportAct(bob, 'send', { cat: 'tech', text: 'hi' })).rejects.toThrow();
  const t = 5_000_000;
  let last = '';
  for (let i = 0; i < 5; i++)
    last = (await supportAct(bob, 'send', { cat: 'tech', text: 'Savol raqami ' + i }, t + i))
      .message.id;
  await expect(
    supportAct(bob, 'send', { cat: 'tech', text: 'Oltinchi savol' }, t + 10),
  ).rejects.toMatchObject({ status: 429 });
  await expect(
    supportAct(bob, 'reply', { uid: 'legacy_bob2', id: last, text: 'O‘zim javob beraman' }),
  ).rejects.toMatchObject({ status: 403 });
  const { message } = await supportAct(admin, 'reply', {
    uid: 'legacy_bob2',
    id: last,
    text: 'Tekshirib chiqdik.',
  });
  expect(message).toMatchObject({ status: 'answered', reply: { text: 'Tekshirib chiqdik.' } });
  const inbox = await supportList(admin, true);
  expect(inbox.messages.length).toBeGreaterThanOrEqual(6);
});
