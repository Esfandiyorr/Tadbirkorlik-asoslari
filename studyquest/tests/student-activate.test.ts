import { expect, it, vi } from 'vitest';
import { activateStudent } from '../lib/server/student-activate';

const db = (records: Record<string, unknown>) =>
  vi.fn(async (path: string) => records[path] ?? null);

it('the owner of a pending account cannot approve their own group registration', async () => {
  const read = db({
    'owners/ali1/anon': 'p2:key',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'pending', group: 'AP-223' },
  });
  expect(await activateStudent('anon', { id: 'ali1' }, read)).toEqual({
    ok: true,
    status: 'pending',
  });
});

it('an approved account is recognized; blocked accounts and strangers are refused', async () => {
  const ok = db({
    'owners/ali1/anon': 'shared1111:x',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'ok' },
  });
  expect(await activateStudent('anon', { id: 'ali1' }, ok)).toEqual({
    ok: true,
    status: 'ok',
  });

  const blocked = db({
    'owners/ali1/anon': 'p2:key',
    'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'blocked' },
  });
  await expect(activateStudent('anon', { id: 'ali1' }, blocked)).rejects.toMatchObject({
    status: 403,
  });

  // boshqa birovning hisobi: egalik yozuvi yo'q
  const stranger = db({ 'students/ali1': { name: 'Ali', surname: 'Valiyev', status: 'pending' } });
  await expect(activateStudent('intruder', { id: 'ali1' }, stranger)).rejects.toMatchObject({
    status: 403,
  });
  await expect(activateStudent('anon', { id: '../owners' }, stranger)).rejects.toThrow();
});
