import 'server-only';
import { pbkdf2, randomBytes, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { legacyDb } from './repository';
const derive = promisify(pbkdf2);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\u0400-\u04ff']/g, '');
export async function resetStudentPassword(
  actor: Actor,
  input: unknown,
  read = async (path: string): Promise<any> => (await legacyDb().ref(path).get()).val(),
  update = async (patch: Record<string, unknown>) => legacyDb().ref().update(patch),
) {
  administrator(actor);
  const { id, password } = z
    .object({
      id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
      password: z
        .string()
        .min(8)
        .max(128)
        .refine((v) => v.trim().length >= 8),
    })
    .strict()
    .parse(input);
  const student = await read('students/' + id);
  check(
    student &&
      typeof student.name === 'string' &&
      typeof student.surname === 'string' &&
      student.status,
    404,
    'Talaba topilmadi.',
  );
  const salt = randomBytes(16).toString('hex');
  const bits = await derive(
    password,
    'terdu-password-v2|' + normalize(student.name) + '|' + normalize(student.surname) + '|' + salt,
    600000,
    32,
    'sha256',
  );
  const at = Date.now();
  await update({
    ['keys/' + id]: 'p2:' + bits.toString('hex'),
    ['owners/' + id]: null,
    ['students/' + id + '/pk']: null,
    ['students/' + id + '/authVersion']: 2,
    ['students/' + id + '/pwSalt']: salt,
    ['students/' + id + '/updated']: at,
    ['adminAudit/' + randomUUID()]: {
      action: 'resetStudentPassword',
      studentId: id,
      by: actor.uid,
      at,
    },
  });
  return { ok: true, id };
}
