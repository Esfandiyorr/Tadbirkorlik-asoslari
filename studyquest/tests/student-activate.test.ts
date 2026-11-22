import { expect, it, vi } from 'vitest';
import { activateStudent } from '../lib/server/student-activate';

/* ✅ O'qituvchi tasdig'i yo'q: «kutilmoqda» hisobni faqat uning egasi (owners/<id>/<uid>) faollashtiradi. */
const db = (records: Record<string, unknown>) => ({
  read: vi.fn(async (path: string) => records[path] ?? null),
  write: vi.fn(),
});

it('the owner of a pending account activates it at once', async () => {
  const { read, write } = db({
    'owners/ali1/anon': 'p2:key',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'pending', group: 'AP-223' },
  });
  expect(await activateStudent('anon', { id: 'ali1' }, read, write)).toEqual({
    ok: true,
    status: 'ok',
  });
  expect(write).toHaveBeenCalledExactlyOnceWith('students/ali1/status', 'ok');
});

it('an approved account is not rewritten; blocked accounts and strangers are refused', async () => {
  const ok = db({
    'owners/ali1/anon': 'shared1111:x',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'ok' },
  });
  expect(await activateStudent('anon', { id: 'ali1' }, ok.read, ok.write)).toEqual({
    ok: true,
    status: 'ok',
  });
  expect(ok.write).not.toHaveBeenCalled();

  const blocked = db({
    'owners/ali1/anon': 'p2:key',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'blocked' },
  });
  await expect(
    activateStudent('anon', { id: 'ali1' }, blocked.read, blocked.write),
  ).rejects.toMatchObject({ status: 403 });

  // boshqa birovning hisobi: egalik yozuvi yo'q
  const stranger = db({ 'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'pending' } });
  await expect(
    activateStudent('intruder', { id: 'ali1' }, stranger.read, stranger.write),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    activateStudent('anon', { id: '../owners' }, stranger.read, stranger.write),
  ).rejects.toThrow();
  expect([blocked.write, stranger.write].some((w) => w.mock.calls.length)).toBe(false);
});
