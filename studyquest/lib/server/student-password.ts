import 'server-only';
import { pbkdf2, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { legacyDb } from './repository';
const derive = promisify(pbkdf2);
export const credentialSetupVersion = 'default1111-v1';
export const credentialSetupPath = 'meta/studentCredentialSetup/' + credentialSetupVersion;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\u0400-\u04ff']/g, '');
const studentId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const personalPassword = z
  .string()
  .min(8)
  .max(128)
  .refine((v) => v.trim().length >= 8);
const readDefault = async (path: string): Promise<any> => (await legacyDb().ref(path).get()).val();
const updateDefault = async (patch: Record<string, unknown>) => legacyDb().ref().update(patch);
function hash32(value: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}
export function originalPinKey(name: string, surname: string, pin: string) {
  const value = 'terdu:' + normalize(name) + '|' + normalize(surname) + '|' + pin;
  return hash32(value, 2166136261) + hash32(value + '#2', 3323198485);
}
async function passwordKey(student: any, password: string, salt: string) {
  return (
    'p2:' +
    (
      await derive(
        password,
        'terdu-password-v2|' +
          normalize(student.name) +
          '|' +
          normalize(student.surname) +
          '|' +
          salt,
        600000,
        32,
        'sha256',
      )
    ).toString('hex')
  );
}
function validStudent(student: any) {
  check(
    student &&
      typeof student.name === 'string' &&
      typeof student.surname === 'string' &&
      student.status,
    404,
    'Talaba topilmadi.',
  );
}
async function credentialPatch(id: string, student: any, password: string) {
  const initial = password === '1111',
    salt = initial ? null : randomBytes(16).toString('hex');
  const key = initial
    ? originalPinKey(student.name, student.surname, password)
    : await passwordKey(student, password, salt!);
  return {
    ['keys/' + id]: key,
    ['owners/' + id]: null,
    ['students/' + id + '/pk']: null,
    ['students/' + id + '/authVersion']: initial ? 1 : 2,
    ['students/' + id + '/pwSalt']: salt,
    ['students/' + id + '/mustChangePassword']: initial,
    ['students/' + id + '/credentialSetupVersion']: credentialSetupVersion,
    ['students/' + id + '/updated']: Date.now(),
  };
}
export async function resetStudentPassword(
  actor: Actor,
  input: unknown,
  read = readDefault,
  update = updateDefault,
) {
  administrator(actor);
  const { id, password } = z
    .object({ id: studentId, password: z.union([z.literal('1111'), personalPassword]) })
    .strict()
    .parse(input);
  check(
    !((await read(credentialSetupPath))?.leaseUntil > Date.now()),
    409,
    'Boshlang‘ich parollar sozlanmoqda. Birozdan so‘ng qayta urining.',
  );
  const student = await read('students/' + id);
  validStudent(student);
  await update({
    ...(await credentialPatch(id, student, password)),
    ['adminAudit/' + randomUUID()]: {
      action: 'resetStudentPassword',
      studentId: id,
      by: actor.uid,
      at: Date.now(),
    },
  });
  return { ok: true, id };
}
export async function changeStudentPassword(
  actor: Actor,
  input: unknown,
  read = readDefault,
  update = updateDefault,
) {
  check(
    actor.role === 'student' && /^legacy_[a-zA-Z0-9_-]{1,100}$/.test(actor.id),
    403,
    'Talaba hisobingiz bilan kiring.',
  );
  const { currentPassword, newPassword } = z
    .object({ currentPassword: z.string().min(4).max(128), newPassword: personalPassword })
    .strict()
    .parse(input);
  check(currentPassword !== newPassword, 400, 'Yangi parol joriy paroldan farq qilsin.');
  check(
    !((await read(credentialSetupPath))?.leaseUntil > Date.now()),
    409,
    'Boshlang‘ich parollar sozlanmoqda. Birozdan so‘ng qayta urining.',
  );
  const id = actor.id.slice(7),
    student = await read('students/' + id);
  validStudent(student);
  const expected = (await read('keys/' + id)) || student.pk || '';
  const supplied =
    Number(student.authVersion) === 2
      ? await passwordKey(student, currentPassword, String(student.pwSalt || ''))
      : originalPinKey(student.name, student.surname, currentPassword);
  check(
    typeof expected === 'string' &&
      expected.length === supplied.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)),
    403,
    'Joriy parol noto‘g‘ri.',
  );
  await update({
    ...(await credentialPatch(id, student, newPassword)),
    ['adminAudit/' + randomUUID()]: {
      action: 'changeOwnPassword',
      studentId: id,
      by: actor.uid,
      at: Date.now(),
    },
  });
  return { ok: true, reauthenticate: true };
}
type CredentialStore = {
  read: (path: string) => Promise<any>;
  update: (patch: Record<string, unknown>) => Promise<unknown>;
  transaction: (
    path: string,
    fn: (value: any) => any,
  ) => Promise<{ committed: boolean; snapshot: { val(): any } }>;
};
export async function initializeStudentPasswords(
  actor: Actor,
  io: CredentialStore = {
    read: readDefault,
    update: updateDefault,
    transaction: async (path: string, fn: (value: any) => any) =>
      legacyDb().ref(path).transaction(fn),
  },
) {
  administrator(actor);
  const runId = randomUUID(),
    now = Date.now();
  const lock = await io.transaction(credentialSetupPath, (value) => {
    if (value?.completed || value?.leaseUntil > now) return;
    return {
      ...value,
      runId,
      leaseUntil: now + 120000,
      startedAt: value?.startedAt || now,
      by: actor.uid,
    };
  });
  if (!lock.committed) {
    const previous = lock.snapshot.val() || {};
    return {
      completed: !!previous.completed,
      students: Number(previous.students || 0),
      running: !previous.completed,
    };
  }
  try {
    const source = (await io.read('students')) || {};
    const entries = Object.entries(source).filter(
      ([id, s]: [string, any]) =>
        studentId.safeParse(id).success &&
        typeof s?.name === 'string' &&
        s.name &&
        typeof s.surname === 'string' &&
        s.status,
    );
    for (let start = 0; start < entries.length; start += 50) {
      const lease = await io.read(credentialSetupPath);
      check(
        lease?.runId === runId && lease.leaseUntil > Date.now(),
        409,
        'Parollarni sozlash boshqa jarayonda davom etmoqda.',
      );
      const patch: Record<string, unknown> = {};
      const updates = await Promise.all(
        entries.slice(start, start + 50).map(async ([id]) => {
          const student = await io.read('students/' + id);
          if (!student || student.credentialSetupVersion === credentialSetupVersion) return {};
          validStudent(student);
          return credentialPatch(id, student, '1111');
        }),
      );
      const currentLease = await io.read(credentialSetupPath);
      check(
        currentLease?.runId === runId && currentLease.leaseUntil > Date.now(),
        409,
        'Parollarni sozlash boshqa jarayonda davom etmoqda.',
      );
      for (const change of updates) Object.assign(patch, change);
      patch[credentialSetupPath + '/leaseUntil'] = Date.now() + 120000;
      await io.update(patch);
    }
    const result = {
      completed: true,
      students: entries.length,
      completedAt: Date.now(),
      by: actor.uid,
      runId,
    };
    await io.update({
      [credentialSetupPath]: result,
      ['adminAudit/' + randomUUID()]: {
        action: 'initializeStudentPasswords',
        students: entries.length,
        by: actor.uid,
        at: Date.now(),
      },
    });
    return result;
  } catch (error) {
    const lease = await io.read(credentialSetupPath).catch(() => null);
    if (lease?.runId === runId)
      await io.update({ [credentialSetupPath + '/leaseUntil']: 0 }).catch(() => {});
    throw error;
  }
}
export async function deleteStudent(
  actor: Actor,
  input: unknown,
  read = readDefault,
  update = updateDefault,
) {
  administrator(actor);
  const { id, confirmation } = z
    .object({ id: studentId, confirmation: z.string().min(1).max(250) })
    .strict()
    .parse(input);
  check(
    !((await read(credentialSetupPath))?.leaseUntil > Date.now()),
    409,
    'Boshlang‘ich parollar sozlanmoqda. Birozdan so‘ng qayta urining.',
  );
  const student = await read('students/' + id);
  validStudent(student);
  check(
    confirmation.trim() === [student.name, student.surname].join(' ').trim(),
    400,
    'Tasdiqlash uchun talabaning ism-familiyasini aynan kiriting.',
  );
  const archive = { ...student };
  delete archive.pk;
  delete archive.pwSalt;
  delete archive.authVersion;
  await update({
    ['deletedStudents/' + id + '/' + randomUUID()]: {
      record: archive,
      deletedAt: Date.now(),
      by: actor.uid,
    },
    ['meta/deletedStudentIds/' + id]: true,
    ['students/' + id]: null,
    ['keys/' + id]: null,
    ['owners/' + id]: null,
    ['priv/' + id]: null,
    ['adminAudit/' + randomUUID()]: {
      action: 'deleteStudent',
      studentId: id,
      by: actor.uid,
      at: Date.now(),
    },
  });
  return { ok: true, id };
}
