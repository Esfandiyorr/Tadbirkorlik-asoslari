import 'server-only';
import { catalog } from '../seed';
import type { Actor, Lesson, LessonAccess } from '../types';
import { legacyDb, demo } from './repository';
import { check } from './auth';

/* 🎚 Mavzuning umumiy holati (o'qituvchi bo'limidagi «Mavzular holati»): «lock» 🔒 hammaga yopiq, «read» 📖 hammaga
   o'qish rejimi, «open» 🟢 hammaga ochiq (ball o'sha haftaning yakshanbasi 23:59 gacha, keyin 📖).
   Bazada meta/access/<mavzu>/{m, mt}, config.json da mode/modeAt — boshlang'ich holat. Eng oxirgi amal ustun.
   DIQQAT: _reyting-manba/engine_js.txt dagi accMode bilan AYNAN bir xil bo'lishi kerak. */
export type TopicMode = 'lock' | 'read' | 'open';
const stamp = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && n > 0 ? n : 0;
};
const isMode = (m: unknown): m is TopicMode => m === 'lock' || m === 'read' || m === 'open';
export function accessMode(
  topic: { mode?: unknown; modeAt?: unknown },
  raw: any,
  now = Date.now(),
): { m: TopicMode; t: number; initial: boolean } | null {
  const a = raw || {};
  let last = stamp(a.at);
  for (const k of ['g', 's'])
    for (const v of Object.values((a[k] || {}) as Record<string, unknown>))
      last = Math.max(last, stamp(v));
  const mt = stamp(a.mt),
    ct = stamp(topic.modeAt);
  if (isMode(topic.mode) && ct && ct <= now && ct >= Math.max(last, mt))
    return { m: topic.mode, t: ct, initial: true };
  return isMode(a.m) && mt >= last ? { m: a.m, t: mt, initial: false } : null;
}
export function canReadLegacy(
  topic: { open?: boolean; read?: boolean; lim?: boolean; mode?: string; modeAt?: number },
  grant: any,
  a: Pick<Actor, 'id' | 'classId' | 'learnerType' | 'role'>,
  now = Date.now(),
) {
  if (a.role !== 'student') return true;
  if (!topic.open) return false;
  const mode = accessMode(topic as { mode?: unknown; modeAt?: unknown }, grant, now);
  if (mode) return mode.m !== 'lock';
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
export const weekEnd = (v: number) => {
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
    mode?: string;
    modeAt?: number;
  }[]) {
    const raw = access?.[topic.id];
    const mode = topic.open ? accessMode(topic, raw, now) : null;
    if (mode) {
      out[topic.id] =
        mode.m === 'lock'
          ? { state: 'locked' }
          : mode.m === 'open' && !student.independent && live(mode.t)
            ? { state: 'score', due: weekEnd(mode.t) - 60000 }
            : { state: 'read' };
      continue;
    }
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
