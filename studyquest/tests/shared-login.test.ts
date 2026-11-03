import { expect, it, vi } from 'vitest';
import { sharedLogin } from '../lib/server/shared-login';
import { changeStudentPassword, initializeStudentPasswords } from '../lib/server/student-password';
import { demoUsers } from '../lib/seed';
const record = {
  name: 'Ali',
  surname: 'Valiyev',
  status: 'ok',
  total: 375.5,
  authVersion: 2,
  pwSalt: 'old-salt',
  topics: { m1: { p: 75 } },
};
it('1111 creates a server-owned session without returning or changing personal credentials and scores', async () => {
  const read = vi.fn(async () => record),
    write = vi.fn();
  expect(
    await sharedLogin(
      'anon-uid',
      { id: 'alice', name: 'Ali', surname: 'Valiyev', password: '1111' },
      true,
      read,
      write,
    ),
  ).toEqual({ ok: true });
  expect(write).toHaveBeenCalledExactlyOnceWith(
    'owners/alice/anon-uid',
    expect.stringMatching(/^shared1111:/),
  );
  expect(JSON.stringify(write.mock.calls)).not.toMatch(/old-salt|375.5|p2:/);
});
it('refuses incorrect names, blocked users, disabled common code and revoked sessions', async () => {
  const write = vi.fn();
  await expect(
    sharedLogin(
      'uid',
      { id: 'alice', name: 'Wrong', surname: 'Valiyev', password: '1111' },
      true,
      async () => record,
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    sharedLogin(
      'uid',
      { id: 'alice', name: 'Ali', surname: 'Valiyev', password: '1111' },
      false,
      async () => record,
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    sharedLogin(
      'uid',
      { id: 'alice', session: true },
      true,
      async (path) => (path.startsWith('students/') ? record : null),
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    sharedLogin(
      'uid',
      { id: 'alice', name: 'Ali', surname: 'Valiyev', password: '1111' },
      true,
      async () => ({ ...record, status: 'blocked' }),
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(write).not.toHaveBeenCalled();
});
it('resumes an existing shared session but cannot claim a new owner without credentials', async () => {
  const read = async (path: string) =>
      path.startsWith('students/') ? record : 'shared1111:existing',
    write = vi.fn();
  expect(await sharedLogin('uid', { id: 'alice', session: true }, true, read, write)).toEqual({
    ok: true,
  });
  expect(write).not.toHaveBeenCalled();
});
it('old initialization requests are non-destructive and do not replace existing keys', async () => {
  const read = vi.fn(async () => ({ alice: record }));
  expect(await initializeStudentPasswords(demoUsers[2], { read })).toMatchObject({
    completed: true,
    students: 1,
    sharedCode: true,
  });
  expect(record.pwSalt).toBe('old-salt');
});
it('a verified shared-login student can choose a personal password using current code 1111', async () => {
  const write = vi.fn(),
    read = async (path: string): Promise<any> =>
      path.startsWith('students/')
        ? record
        : path.startsWith('owners/')
          ? 'shared1111:existing'
          : path.startsWith('keys/')
            ? 'p2:existing-key'
            : null;
  await changeStudentPassword(
    { ...demoUsers[0], id: 'legacy_alice', uid: 'uid' },
    { currentPassword: '1111', newPassword: 'Personal-Password-123' },
    read,
    write,
  );
  const patch = write.mock.calls[0][0];
  expect(patch['keys/alice']).toMatch(/^p2:/);
  expect(patch['owners/alice']).toBeNull();
  expect(Object.keys(patch)).not.toContain('students/alice/total');
});
