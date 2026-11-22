import 'server-only';
import { z } from 'zod';
import { check } from './auth';
import { legacyDb } from './repository';

/* ✅ O'qituvchi tasdig'i yo'q: ro'yxatdan o'tgan (yoki hali «kutilmoqda» holatidagi) talaba hisobini egasi kirgan
   zahoti o'zi faollashtiradi. Egalik — owners/<id>/<uid> (ro'yxatdan o'tish yoki kirishda yoziladi; server ham shu
   bilan tekshiradi — lib/server/auth.ts). Bloklangan hisob bloklanganicha qoladi, mustaqil o'quvchilarga tegilmaydi. */
export async function activateStudent(
  uid: string,
  input: unknown,
  read = async (path: string): Promise<any> => (await legacyDb().ref(path).get()).val(),
  write = async (path: string, value: string) => legacyDb().ref(path).set(value),
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
  if (student.learnerType !== 'independent' && student.status !== 'ok')
    await write('students/' + id + '/status', 'ok');
  return { ok: true, status: student.learnerType === 'independent' ? student.status : 'ok' };
}
