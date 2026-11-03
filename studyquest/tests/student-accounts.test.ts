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
it('initializes the cohort once, preserves scores/status, and never resets a changed personal password', async () => {
  const db = database({
    alice,
    bob: { ...alice, name: 'Bobur', status: 'blocked' },
    staff: { name: 'Staff', role: 'teacher' },
  });
  const result = await initializeStudentPasswords(admin, db);
  expect(result).toMatchObject({ completed: true, students: 2 });
  expect(db.root.keys.alice).toBe(originalPinKey('Ali', 'Valiyev', '1111'));
  expect(db.root.students.alice).toMatchObject({
    total: 375.5,
    mustChangePassword: true,
    credentialSetupVersion,
    authVersion: 1,
  });
  expect(db.root.students.alice.prog).toEqual(alice.prog);
  expect(db.root.students.bob.status).toBe('blocked');
  expect(db.root.students.staff.authVersion).toBeUndefined();
  expect(db.root.owners.alice).toBeUndefined();
  await changeStudentPassword(
    student,
    { currentPassword: '1111', newPassword: 'Personal-Password-123' },
    db.read,
    db.update,
  );
  const changed = db.root.keys.alice;
  expect(changed).toMatch(/^p2:/);
  expect(db.root.students.alice.mustChangePassword).toBe(false);
  const writes = db.update.mock.calls.length;
  await initializeStudentPasswords(admin, db);
  expect(db.root.keys.alice).toBe(changed);
  expect(db.update).toHaveBeenCalledTimes(writes);
  expect(db.root.students.alice.total).toBe(375.5);
});
it('refuses wrong current passwords and another student ID in personal password input', async () => {
  const db = database({ alice });
  await initializeStudentPasswords(admin, db);
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
  expect(db.root.keys.alice).toBe(originalPinKey('Ali', 'Valiyev', '1111'));
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
it('resumes an interrupted cohort job without resetting completed students or taking an active lease', async () => {
  const records = Object.fromEntries(
    Array.from({ length: 51 }, (_, i) => ['s' + i, { ...alice, name: 'Student' + i }]),
  );
  const db = database(records),
    update = db.update;
  let batches = 0;
  const failing = async (patch: Record<string, unknown>) => {
    if (++batches === 2) throw Error('interrupted');
    await update(patch);
  };
  await expect(initializeStudentPasswords(admin, { ...db, update: failing })).rejects.toThrow(
    'interrupted',
  );
  expect(db.root.students.s0.credentialSetupVersion).toBe(credentialSetupVersion);
  await changeStudentPassword(
    { ...student, id: 'legacy_s0' },
    { currentPassword: '1111', newPassword: 'Already-Changed-123' },
    db.read,
    db.update,
  );
  const personalKey = db.root.keys.s0;
  await initializeStudentPasswords(admin, db);
  expect(db.root.keys.s0).toBe(personalKey);
  expect((await db.read(credentialSetupPath)).completed).toBe(true);
  const busy = database({ alice });
  await busy.update({ [credentialSetupPath]: { leaseUntil: Date.now() + 120000, runId: 'other' } });
  expect(await initializeStudentPasswords(admin, busy)).toMatchObject({
    running: true,
    completed: false,
  });
  expect(busy.root.keys.alice).toBe('old-key');
});
