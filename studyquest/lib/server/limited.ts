import 'server-only';
import type { Actor } from '../types';
import { course, modules, lessons, settings, badges } from '../seed';
import { quotaMessage } from './quota';

// Only existing, public repository materials. Never substitute demo students,
// fabricated grades, uploaded private materials, or quiz answer keys.
export function limitedCatalog(user?: Actor) {
  return {
    mode: 'firebase',
    limited: true,
    serviceMessage: quotaMessage,
    courses: [course],
    modules,
    lessons,
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
