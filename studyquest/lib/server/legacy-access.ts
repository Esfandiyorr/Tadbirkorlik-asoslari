import 'server-only';
import { catalog } from '../seed';
import type { Actor, Lesson, LessonAccess } from '../types';
import { legacyDb, demo } from './repository';
import { check } from './auth';
export function canReadLegacy(
  topic: { open?: boolean; read?: boolean; lim?: boolean },
  grant: any,
  a: Pick<Actor, 'id' | 'classId' | 'learnerType' | 'role'>,
  now = Date.now(),
) {
  if (a.role !== 'student') return true;
  if (!topic.open) return false;
  const g = grant
    ? { lim: !!grant.lim, g: grant.g || {}, s: grant.s || {}, at: +grant.at || 0 }
    : { lim: !!topic.lim, g: {}, s: {}, at: 0 };
  const end = (v: number) => {
    const d = new Date(v + 18000000),
      day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return day + (((7 - d.getUTCDay()) % 7) + 1) * 86400000 - 18000000;
  };
  const gone = (v: unknown) => typeof v === 'number' && v > 0 && now >= end(v);
  const all =
    topic.read ||
    !g.lim ||
    gone(g.at) ||
    Object.values(g.g).some(gone) ||
    Object.values(g.s).some(gone);
  if (a.learnerType === 'independent') return !!all;
  const sid = a.id.startsWith('legacy_') ? a.id.slice(7) : null;
  return !!(
    all ||
    (sid && g.s[sid]) ||
    (a.classId && g.g[a.classId.trim().replace(/\s+/g, ' ').slice(0, 60)])
  );
}
export async function legacyAccess(a: Actor, l: Lesson) {
  if (demo() || !l.legacyFile || a.role !== 'student') return;
  const topic = catalog.topics.find((x) => x.id === l.id);
  check(topic, 404, 'Asl dars topilmadi');
  const grant = (
    await legacyDb()
      .ref('meta/access/' + l.id)
      .get()
  ).val();
  const actual = a.id.startsWith('legacy_')
    ? (
        await legacyDb()
          .ref('students/' + a.id.slice(7))
          .get()
      ).val()
    : null;
  const reader = actual
    ? {
        ...a,
        classId: actual.group || '',
        learnerType:
          actual.learnerType === 'independent' ? ('independent' as const) : ('university' as const),
      }
    : a;
  check(canReadLegacy(topic!, grant, reader), 403, 'Bu dars hali siz uchun ochilmagan.');
}

/* Asl tizimdagi accState ning aynan nusxasi (_reyting-manba/engine_js.txt): har mavzu talaba uchun
   «score» — ball beriladi (ochilgan haftaning yakshanbasi 23:59 gacha), «read» — 📖 o'qish rejimi, «locked» — yopiq. */
const weekEnd = (v: number) => {
  const d = new Date(v + 18000000),
    day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return day + (((7 - d.getUTCDay()) % 7) + 1) * 86400000 - 18000000;
};
const groupKey = (g: unknown) =>
  String(g || '\u2014')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60) || '\u2014';
export function lessonAccessStates(
  access: Record<string, any> | null | undefined,
  student: { id: string; group: string; independent: boolean },
  now = Date.now(),
): Record<string, LessonAccess> {
  const live = (v: unknown): v is number => typeof v === 'number' && v > 0 && now < weekEnd(v);
  const gone = (v: unknown) => typeof v === 'number' && v > 0 && !live(v);
  const out: Record<string, LessonAccess> = {};
  for (const topic of catalog.topics as {
    id: string;
    open?: boolean;
    read?: boolean;
    lim?: boolean;
  }[]) {
    const raw = access?.[topic.id];
    const a = raw
      ? { lim: !!raw.lim, g: raw.g || {}, s: raw.s || {}, at: +raw.at || 0 }
      : {
          lim: !!topic.lim,
          g: {} as Record<string, unknown>,
          s: {} as Record<string, unknown>,
          at: 0,
        };
    const allRead =
      !!topic.read ||
      (!a.lim
        ? !live(a.at)
        : gone(a.at) || Object.values(a.g).some(gone) || Object.values(a.s).some(gone));
    if (!topic.open) {
      out[topic.id] = { state: 'locked' };
      continue;
    }
    if (student.independent) {
      out[topic.id] = { state: !a.lim || allRead ? 'read' : 'locked' };
      continue;
    }
    const liveAt = !a.lim
      ? live(a.at)
        ? a.at
        : 0
      : Math.max(0, ...[a.s[student.id], a.g[groupKey(student.group)]].filter(live));
    if (liveAt) {
      out[topic.id] = { state: 'score', due: weekEnd(liveAt) - 60000 };
      continue;
    }
    const own = !a.lim || !!(a.s[student.id] || (student.group && a.g[groupKey(student.group)]));
    out[topic.id] = { state: own || allRead ? 'read' : 'locked' };
  }
  return out;
}
