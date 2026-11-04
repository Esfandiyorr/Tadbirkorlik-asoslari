import 'server-only';
import { z } from 'zod';
import { crmCount, crmRevision, revisionReading } from '../crm';
import { actor, check } from './auth';
import { legacyAccess } from './legacy-access';
import { legacyDb, demo } from './repository';
import { lessons } from '../seed';
import type { Actor } from '../types';
export const crmPath = (a: Actor) =>
  a.id.startsWith('legacy_')
    ? `students/${a.id.slice(7)}/readingRevisions/m7/${crmRevision}`
    : `lessonRevisions/${a.uid}/m7/${crmRevision}`;
export async function crmAccess(req: import('next/server').NextRequest) {
  const a = await actor(req, true);
  check(/^[A-Za-z0-9_-]{1,128}$/.test(a.uid), 400, 'Hisob identifikatori noto‘g‘ri.');
  await legacyAccess(
    a,
    lessons.find((l) => l.id === 'm7')!,
  );
  return a;
}
export async function readCrm(a: Actor) {
  if (demo()) return revisionReading(null);
  return revisionReading((await legacyDb().ref(crmPath(a)).get()).val());
}
export async function writeCrm(
  a: Actor,
  input: unknown,
  update = async (path: string, patch: Record<string, unknown>) =>
    legacyDb().ref(path).update(patch),
) {
  const { index } = z
    .object({
      index: z
        .number()
        .int()
        .min(0)
        .max(crmCount - 1),
    })
    .strict()
    .parse(input);
  check(a.role === 'student', 403, 'Talaba hisobingiz bilan o‘qing.');
  if (!demo())
    await update(crmPath(a), { [`seen/${index}`]: true, last: index, updatedAt: Date.now() });
  return { ok: true };
}
