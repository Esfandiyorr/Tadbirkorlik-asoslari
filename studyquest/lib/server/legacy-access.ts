import 'server-only';
import { catalog } from '../seed';
import type { Actor, Lesson } from '../types';
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
