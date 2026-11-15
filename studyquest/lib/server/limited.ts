import 'server-only';
import type { Actor } from '../types';
import {
  course,
  modules,
  lessons,
  settings,
  badges,
  extraCourses,
  extraModules,
  extraLessons,
  seesCourse,
} from '../seed';
import { quotaMessage } from './quota';

// Only existing, public repository materials. Never substitute demo students,
// fabricated grades, uploaded private materials, or quiz answer keys.
export function limitedCatalog(user?: Actor) {
  // Yopiq qo'shimcha fan (restoran kursi) faqat o'qituvchi va administratorga beriladi.
  const more = extraCourses.filter((c) => seesCourse(c, user?.role)),
    ids = new Set(more.map((c) => c.id));
  return {
    mode: 'firebase',
    limited: true,
    serviceMessage: quotaMessage,
    courses: [course, ...more],
    modules: [...modules, ...extraModules.filter((m) => ids.has(m.courseId))],
    lessons: [...lessons, ...extraLessons.filter((l) => ids.has(l.courseId))],
    quizzes: [],
    settings,
    badges,
    ...(user
      ? {
          user: {
            id: user.id,
            uid: user.uid,
            name: user.name,
            role: user.role,
            classId: user.classId,
            learnerType: user.learnerType,
            ...(user.academicPoints !== undefined ? { academicPoints: user.academicPoints } : {}),
          },
        }
      : {}),
    progress: [],
    attempts: [],
    transactions: [],
    earned: [],
    activity: [],
    notifications: [],
  };
}
