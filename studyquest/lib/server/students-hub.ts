import 'server-only';
import type { Actor, User } from '../types';
import { staff } from './auth';
import { readLimits } from './student-limits';
import { premiumAdmin } from './premium';
import { courseAccessAdmin } from './course-access';
import { readAvatars } from './avatars';

/* 👥 «Talabalar bilan ishlash» — guruh va talaba bo'yicha hamma amal bitta joyda: bo'limlarni ochish/yopish,
   amaliy baho va testga ikkinchi urinish, obuna (kimda bor, berish, muddat, bekor qilish), kursga ruxsat,
   avatar ruxsati, holat, guruh, parol va hisobni o'chirish. Bu ko'rinish faqat o'qiydi; amallar mavjud server
   funksiyalari orqali bajariladi (legacyStudent, premiumAdmin, courseAccessAdmin, avatarAdmin, studentLimits).
   O'qituvchiga — talabalar, baholar va bo'limlar; obuna, kurs, avatar, parol va o'chirish — faqat administratorga. */

/** Asl bazadagi talaba yozuvi (lib/server/academic.ts roster) — uid va rol bo'lmasligi mumkin. */
export type RosterRow = Partial<User> & { id: string; name: string };
export type HubStudent = RosterRow & {
  /** asl talabalar bazasida yo'q foydalanuvchi (masalan, Google bilan kirgan, obuna yoki kurs ruxsati bor) */
  other?: boolean;
};
export type HubCourse = { id: string; title: string; paid: boolean; grants: string[] };
export type StudentsHubView = {
  admin: boolean;
  students: HubStudent[];
  limits: Awaited<ReturnType<typeof readLimits>>;
  /** foydalanuvchi id → obuna (faqat administratorga) */
  premium?: Record<string, { until: number; since: number; paid: number }>;
  /** o'zi qayta obuna bo'la olmaydiganlar (kalitlar) */
  premiumBlocked?: string[];
  courses?: HubCourse[];
  avatarAllow?: string[];
  now: number;
};

export async function studentsHubView(
  a: Actor,
  roster: RosterRow[],
  now = Date.now(),
): Promise<StudentsHubView> {
  staff(a);
  const limits = await readLimits(true, now);
  const students: HubStudent[] = roster
    .map((r) => ({ ...r }))
    .sort(
      (x, y) => (x.classId || '').localeCompare(y.classId || '') || x.name.localeCompare(y.name),
    );
  if (a.role !== 'admin') return { admin: false, students, limits, now };
  const main = await courseAccessAdmin(a);
  const [prem, avatars, ...views] = await Promise.all([
    premiumAdmin(a, now),
    readAvatars(now).catch(() => ({ allow: {} as Record<string, number> })),
    ...main.courses.filter((c) => c.id !== main.course).map((c) => courseAccessAdmin(a, c.id)),
  ]);
  const courses: HubCourse[] = [main, ...views].map((v) => ({
    id: v.course,
    title: main.courses.find((c) => c.id === v.course)?.title || v.course,
    paid: v.paid,
    grants: v.grants.map((g) => g.uid),
  }));
  const premium: StudentsHubView['premium'] = {};
  for (const g of prem.grants) premium[g.uid] = { until: g.until, since: g.since, paid: g.paid };
  // asl bazada yo'q, lekin obuna yoki kursga ruxsati bor foydalanuvchilar ham shu yerda boshqariladi
  const known = new Set(students.map((s) => s.id));
  const add = (uid: string, name: string, group = '', email = '') => {
    if (!uid || known.has(uid)) return;
    known.add(uid);
    students.push({
      id: uid,
      name: name || uid,
      role: 'student',
      classId: group,
      ...(email ? { email } : {}),
      other: true,
    } as HubStudent);
  };
  for (const g of prem.grants) add(g.uid, g.name, g.group);
  for (const v of [main, ...views])
    for (const g of v.grants) add(g.uid, g.name, g.group || '', g.email || '');
  return {
    admin: true,
    students,
    limits,
    premium,
    premiumBlocked: prem.blocked.map((b) => b.key),
    courses,
    avatarAllow: Object.keys(avatars.allow || {}).filter(
      (id) => (avatars.allow as Record<string, number>)[id],
    ),
    now,
  };
}
