import 'server-only';
import type { Actor } from '../types';
import { staff } from './auth';
import { repository } from './repository';
import { AccountHelp } from './account-help';
import { createHash } from 'node:crypto';
import { siteGet, siteUpdate } from './site-content';
import { courseAccessAdmin } from './course-access';
import { topicAccessList } from './topic-access';
import { supportList } from './support';
import { extraCourses } from '../seed';

/** 🎨 8-mavzu logotip topshirig'i yakunlangan: uning yozuvlari (biznes, ta'rif, baho) va rasmlari bir marta
    o'chiriladi. Berilgan ballar talabaning asl yozuvida (students/<id>/task/m8) qoladi — reyting o'zgarmaydi. */
async function purgeLogoTask() {
  const old = await siteGet<{ s?: Record<string, unknown> }>('logoTask');
  if (!old) return;
  const patch: Record<string, unknown> = { logoTask: null };
  for (const uid of Object.keys(old.s || {}))
    patch['blob/lg-' + createHash('sha256').update(uid).digest('hex').slice(0, 16)] = null;
  await siteUpdate(patch);
}

/** Vazifalar uchun yengil ko'rinish: umumiy talaba baholari va progress hisoboti yuklanmaydi. */
export async function staffSummary(a: Actor) {
  staff(a);
  const results = await Promise.allSettled([
    a.role === 'admin' ? purgeLogoTask() : Promise.resolve(),
    new AccountHelp(await repository())
      .list(a)
      .then((v) => v.filter((r) => r.status !== 'resolved').length),
    supportList(a, true).then((v) => v.threads?.filter((r) => r.waiting).length || 0),
    a.role === 'admin'
      ? Promise.all(
          [undefined, ...extraCourses.filter((c) => c.paid).map((c) => c.id)].map((c) =>
            courseAccessAdmin(a, c),
          ),
        ).then((v) => v.reduce((n, c) => n + c.requests.length, 0))
      : Promise.resolve(null),
    topicAccessList().then((v) =>
      v.topics
        .filter((t) => t.due && t.due > Date.now())
        .sort((x, y) => x.due! - y.due!)
        .slice(0, 3)
        .map(({ id, title, due }) => ({ id, title, due })),
    ),
  ]);
  const get = <T>(i: number): T | null =>
    results[i].status === 'fulfilled' ? (results[i].value as T) : null;
  return {
    help: get<number>(1),
    messages: get<number>(2),
    courseRequests: get<number>(3),
    deadlines: get<{ id: string; title: string; due: number }[]>(4),
    at: Date.now(),
  };
}
export type StaffSummary = Awaited<ReturnType<typeof staffSummary>>;
