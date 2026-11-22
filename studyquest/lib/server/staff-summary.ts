import 'server-only';
import type { Actor } from '../types';
import { staff } from './auth';
import { repository } from './repository';
import { AccountHelp } from './account-help';
import { logoTaskList } from './logo-task';
import { courseAccessAdmin } from './course-access';
import { topicAccessList } from './topic-access';
import { supportList } from './support';
import { extraCourses } from '../seed';

/** Vazifalar uchun yengil ko'rinish: umumiy talaba baholari va progress hisoboti yuklanmaydi. */
export async function staffSummary(a: Actor) {
  staff(a);
  const results = await Promise.allSettled([
    logoTaskList(a).then((v) => v.rows.filter((r) => r.status === 'sent').length),
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
    logos: get<number>(0),
    help: get<number>(1),
    messages: get<number>(2),
    courseRequests: get<number>(3),
    deadlines: get<{ id: string; title: string; due: number }[]>(4),
    at: Date.now(),
  };
}
export type StaffSummary = Awaited<ReturnType<typeof staffSummary>>;
