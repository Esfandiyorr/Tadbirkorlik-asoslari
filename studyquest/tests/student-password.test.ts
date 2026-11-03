import { expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { resetStudentPassword } from '../lib/server/student-password';
import { demoUsers } from '../lib/seed';
const student = {
  name: 'Ali',
  surname: 'Valiyev',
  status: 'ok',
  total: 375.5,
  group: 'AP-223',
  topics: { m1: { p: 75, b: 4 } },
  prog: { m1: { sl: { slide0: 1 } } },
  manual: { m1: 4 },
};
it('creates credentials compatible with original login, revokes owners, preserves all learning data and audits without secrets', async () => {
  const original = structuredClone(student),
    update = vi.fn();
  const result = await resetStudentPassword(
    demoUsers[2],
    { id: 'alice', password: 'NewPassword-123' },
    async () => student,
    update,
  );
  const patch = update.mock.calls[0][0];
  expect(result).toEqual({ ok: true, id: 'alice' });
  expect(patch['owners/alice']).toBeNull();
  expect(patch['students/alice/pk']).toBeNull();
  expect(patch['students/alice/authVersion']).toBe(2);
  const key = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('NewPassword-123'),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await webcrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 600000,
      salt: new TextEncoder().encode(
        'terdu-password-v2|ali|valiyev|' + patch['students/alice/pwSalt'],
      ),
    },
    key,
    256,
  );
  expect(patch['keys/alice']).toBe('p2:' + Buffer.from(bits).toString('hex'));
  expect(student).toEqual(original);
  expect(Object.keys(patch).some((k) => /total|prog|topics|manual|group/.test(k))).toBe(false);
  const audit = Object.entries(patch).find(([k]) => k.startsWith('adminAudit/'))![1];
  expect(audit).toMatchObject({ action: 'resetStudentPassword', studentId: 'alice' });
  expect(JSON.stringify(audit)).not.toContain('NewPassword-123');
  expect(JSON.stringify(result)).not.toMatch(/password|p2:|pwSalt/i);
});
it('refuses staff/students, malformed IDs, short passwords and missing students before writing', async () => {
  const read = vi.fn(async () => null),
    write = vi.fn();
  await expect(
    resetStudentPassword(
      demoUsers[0],
      { id: 'alice', password: 'valid-long-password' },
      read,
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    resetStudentPassword(
      demoUsers[1],
      { id: 'alice', password: 'valid-long-password' },
      read,
      write,
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(read).not.toHaveBeenCalled();
  await expect(
    resetStudentPassword(
      demoUsers[2],
      { id: '../alice', password: 'valid-long-password' },
      read,
      write,
    ),
  ).rejects.toThrow();
  await expect(
    resetStudentPassword(demoUsers[2], { id: 'alice', password: '1234' }, read, write),
  ).rejects.toThrow();
  await expect(
    resetStudentPassword(
      demoUsers[2],
      { id: 'alice', password: 'valid-long-password' },
      read,
      write,
    ),
  ).rejects.toMatchObject({ status: 404 });
  expect(write).not.toHaveBeenCalled();
});
