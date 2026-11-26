import 'server-only';
import { z } from 'zod';
import { check } from './auth';
import { legacyDb } from './repository';

/** Avvalgi mijozlar bu so‘rov orqali hisob tasdiqlanganini tekshiradi. */
export async function activateStudent(
  uid: string,
  input: unknown,
  read = async (path: string): Promise<any> => (await legacyDb().ref(path).get()).val(),
) {
  const { id } = z
    .object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/) })
    .strict()
    .parse(input);
  const [owner, student] = await Promise.all([
    read('owners/' + id + '/' + uid),
    read('students/' + id),
  ]);
  check(owner !== null && owner !== undefined && owner !== '', 403, 'Hisobga qayta kiring.');
  check(
    typeof student?.name === 'string' && student.status !== 'blocked',
    403,
    'Hisob topilmadi yoki bloklangan.',
  );
  return { ok: true, status: student.status === 'ok' ? 'ok' : 'pending' };
}
