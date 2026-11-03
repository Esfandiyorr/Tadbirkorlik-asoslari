import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { check } from './auth';
import { legacyDb } from './repository';
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\u0400-\u04ff']/g, '');
export const sharedSessionKey = 'shared1111';
export async function sharedLogin(
  uid: string,
  input: unknown,
  enabled: boolean,
  read = async (path: string): Promise<any> => (await legacyDb().ref(path).get()).val(),
  write = async (path: string, value: string) => legacyDb().ref(path).set(value),
) {
  const p = z
    .object({
      id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
      session: z.boolean().optional(),
      name: z.string().min(2).max(200).optional(),
      surname: z.string().min(2).max(200).optional(),
      password: z.literal('1111').optional(),
    })
    .strict()
    .parse(input);
  const student = await read('students/' + p.id);
  check(
    typeof student?.name === 'string' &&
      typeof student.surname === 'string' &&
      student.status &&
      student.status !== 'blocked',
    403,
    'Hisob topilmadi yoki bloklangan.',
  );
  if (p.session) {
    const owner = await read('owners/' + p.id + '/' + uid);
    check(
      typeof owner === 'string' && owner.startsWith('shared1111:'),
      403,
      'Seans tugagan. Qayta kiring.',
    );
  } else {
    check(
      enabled &&
        p.password === '1111' &&
        p.name &&
        p.surname &&
        normalize(p.name) === normalize(student.name) &&
        normalize(p.surname) === normalize(student.surname),
      403,
      'Ism, familiya yoki kod noto‘g‘ri.',
    );
    await write('owners/' + p.id + '/' + uid, 'shared1111:' + randomBytes(24).toString('hex'));
  }
  return { ok: true };
}
