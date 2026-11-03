import { expect, it, vi } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { demoUsers } from '../lib/seed';
import {
  changeStudentPassword,
  credentialSetupPath,
  credentialSetupVersion,
  deleteStudent,
  initializeStudentPasswords,
  originalPinKey,
  resetStudentPassword,
} from '../lib/server/student-password';
function database(students: any) {
  const root: any = {
    students: structuredClone(students),
    owners: { alice: { old: 'previous-key' } },
    keys: { alice: 'old-key' },
    priv: { alice: { email: 'alice@example.test' } },
  };
  const read = vi.fn(async (path: string): Promise<any> =>
    structuredClone(path.split('/').reduce((value, part) => value?.[part], root)),
  );
  function set(path: string, value: any) {
    const bits = path.split('/'),
      key = bits.pop()!;
    let target = root;
    for (const bit of bits) target = target[bit] ??= {};
    if (value === null) delete target[key];
    else target[key] = structuredClone(value);
  }
  const update = vi.fn(async (patch: Record<string, unknown>) => {
    for (const [path, value] of Object.entries(patch)) set(path, value);
  });
  const transaction = vi.fn(async (path: string, fn: (value: any) => any) => {
    const next = fn(await read(path));
    if (next !== undefined) set(path, next);
    const value = await read(path);
    return { committed: next !== undefined, snapshot: { val: () => value } };
  });
  return { root, read, update, transaction };
}
const alice = {
  name: 'Ali',
  surname: 'Valiyev',
  status: 'ok',
  group: 'AP-223',
  total: 375.5,
  topics: { m1: { p: 75 } },
  prog: { m1: { sl: { slide1: 1 } } },
};
const admin = demoUsers[2],
  student = { ...demoUsers[0], id: 'legacy_alice', uid: 'alice-owner' };
it('matches the actual original login hash for 1111', () => {
  const source = fs.readFileSync('../_reyting-manba/engine_js.txt', 'utf8');
  const functions = source.slice(
    source.indexOf('function nrm('),
    source.indexOf('function passwordOk('),
  );
  const context = vm.createContext({});
  vm.runInContext(functions, context);
  expect(originalPinKey('Ali', 'Valiyev', '1111')).toBe(
    vm.runInContext("pkey('Ali','Valiyev','1111')", context),
  );
});
it('refuses wrong current passwords and another student ID in personal password input', async () => {
  const db = database({ alice });
  db.root.keys.alice = originalPinKey('Ali', 'Valiyev', '1111');
  const writes = db.update.mock.calls.length;
  await expect(
    changeStudentPassword(
      student,
      { currentPassword: '2222', newPassword: 'My-New-Password' },
      db.read,
      db.update,
    ),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    changeStudentPassword(
      student,
      { id: 'bob', currentPassword: '1111', newPassword: 'My-New-Password' },
      db.read,
      db.update,
    ),
  ).rejects.toThrow();
  await expect(
    changeStudentPassword(
      admin,
      { currentPassword: '1111', newPassword: 'My-New-Password' },
      db.read,
      db.update,
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(db.update).toHaveBeenCalledTimes(writes);
});
it('administrator can reset to 1111 and archive-delete a selected account with exact confirmation', async () => {
  const db = database({ alice });
  await resetStudentPassword(admin, { id: 'alice', password: '1111' }, db.read, db.update);
  expect(db.root.keys.alice).toBe('old-key');
  await expect(
    deleteStudent(student, { id: 'alice', confirmation: 'Ali Valiyev' }, db.read, db.update),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    deleteStudent(admin, { id: 'alice', confirmation: 'wrong' }, db.read, db.update),
  ).rejects.toMatchObject({ status: 400 });
  await deleteStudent(admin, { id: 'alice', confirmation: 'Ali Valiyev' }, db.read, db.update);
  expect(db.root.students.alice).toBeUndefined();
  expect(db.root.keys.alice).toBeUndefined();
  expect(db.root.owners.alice).toBeUndefined();
  expect(db.root.priv.alice).toBeUndefined();
  const archive: any = Object.values(db.root.deletedStudents.alice)[0];
  expect(archive.record.total).toBe(375.5);
  expect(archive.record.prog).toEqual(alice.prog);
  expect(archive.record.pk).toBeUndefined();
  expect(archive.record.pwSalt).toBeUndefined();
});
