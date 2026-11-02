import 'server-only';
import type { Actor } from '../types';
import type { Repository, Row } from './repository';
import { administrator, check, staff } from './auth';
import { legacyDb } from './repository';
import { course, lessons } from '../seed';

type Read = (path: string) => Promise<any>;
const number = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
export function academicRecord(id: string, s: Row) {
  const topics: Record<string, Row> = {},
    manual: Record<string, number> = {};
  for (const lesson of lessons) {
    const value = s.topics?.[lesson.id];
    if (value && typeof value === 'object')
      topics[lesson.id] = Object.fromEntries(
        ['p', 's', 't', 'q', 'b', 'z']
          .filter((k) => value[k] !== undefined)
          .map((k) => [k, number(value[k])]),
      );
    if (number(s.manual?.[lesson.id]) <= 5 && number(s.manual?.[lesson.id]) > 0)
      manual[lesson.id] = number(s.manual[lesson.id]);
  }
  return {
    id: 'legacy_' + id,
    legacyId: id,
    name: [s.name, s.surname]
      .filter((v) => typeof v === 'string')
      .join(' ')
      .slice(0, 200),
    classId: s.learnerType === 'independent' ? '' : String(s.group || '').slice(0, 100),
    learnerType: s.learnerType === 'independent' ? 'independent' : 'university',
    legacyStatus: ['ok', 'blocked'].includes(s.status) ? s.status : 'pending',
    academicPoints: number(s.total),
    academicTopics: topics,
    manualMarks: manual,
  };
}

export class Academic {
  constructor(
    public db: Repository,
    public read: Read = async (path) => (await legacyDb().ref(path).get()).val(),
    public now = () => Date.now(),
  ) {}
  async roster(a: Actor) {
    staff(a);
    const source = (await this.read('students')) || {};
    return Object.entries(source)
      .filter(([id, s]: any) => /^[a-zA-Z0-9_-]{1,100}$/.test(id) && s?.name && s?.status)
      .map(([id, s]) => academicRecord(id, s as Row));
  }
  async board(a: Actor) {
    check(
      a.role !== 'student' || a.learnerType === 'university',
      403,
      'Universitet reytingi faqat universitet talabalari uchun.',
    );
    const [source, users] = await Promise.all([this.read('students'), this.db.list('users')]);
    const hidden = new Set(
      users.filter((u) => u.leaderboardVisible === false || u.blocked).map((u) => u.id),
    );
    const own = a.id.startsWith('legacy_') ? source?.[a.id.slice(7)] : null;
    const group = a.role === 'student' ? String(own?.group || a.classId || '') : '';
    return Object.entries(source || {})
      .filter(([id, s]: any) => /^[a-zA-Z0-9_-]{1,100}$/.test(id) && s?.name && s?.status)
      .map(([id, s]) => academicRecord(id, s as Row))
      .filter(
        (s) =>
          s.legacyStatus === 'ok' &&
          s.learnerType === 'university' &&
          !hidden.has(s.id) &&
          (!group || s.classId === group),
      )
      .sort((a, b) => b.academicPoints - a.academicPoints || a.name.localeCompare(b.name));
  }
  async sync(a: Actor) {
    administrator(a);
    const source = (await this.read('students')) || {};
    const entries = Object.entries(source).filter(
      ([id, s]: any) => /^[a-zA-Z0-9_-]{1,100}$/.test(id) && s?.name && s?.status,
    );
    // At most 20 * (user + enrollment + 15 progress) writes per transaction.
    for (let offset = 0; offset < entries.length; offset += 20) {
      await this.db.transaction(async (tx) => {
        const batch = entries.slice(offset, offset + 20),
          reads: [string, string][] = [];
        for (const [sid, raw] of batch) {
          const value = raw as Row,
            userId = 'legacy_' + sid;
          reads.push(['users', userId], ['enrollments', userId + '_' + course.id]);
          for (const lesson of lessons)
            if (value.prog?.[lesson.id] || value.reading?.[lesson.id] || value.topics?.[lesson.id])
              reads.push(['progress', userId + '_' + lesson.id]);
        }
        const cached = new Map<string, Row | null>(
          await Promise.all(
            reads.map(
              async ([collection, id]) =>
                [collection + '/' + id, await tx.get(collection, id)] as const,
            ),
          ),
        );
        for (const [sid, raw] of batch) {
          const s = raw as Row,
            record = academicRecord(sid, s),
            old = cached.get('users/' + record.id);
          tx.set('users', record.id, {
            uid: '',
            role: 'student',
            xp: 0,
            streak: 0,
            leaderboardVisible: true,
            createdAt: number(s.at) || this.now(),
            ...old,
            ...record,
            legacyLinkedAt: this.now(),
          });
          const enrollment = record.id + '_' + course.id;
          if (!cached.get('enrollments/' + enrollment))
            tx.set('enrollments', enrollment, {
              id: enrollment,
              userId: record.id,
              courseId: course.id,
              at: this.now(),
            });
          for (const lesson of lessons) {
            const progress = s.prog?.[lesson.id],
              reading = s.reading?.[lesson.id];
            if (!progress && !reading && !s.topics?.[lesson.id]) continue;
            const seen = Array.from(
              new Set(
                [...Object.keys(progress?.sl || {}), ...Object.keys(reading?.sl || {})]
                  .map((k) => /^slide(\d+)$/.exec(k))
                  .filter(Boolean)
                  .map((m) => Number(m![1]))
                  .filter((n) => n >= 0 && n < lesson.slideCount),
              ),
            );
            const key = record.id + '_' + lesson.id,
              previous = cached.get('progress/' + key);
            const combined = Array.from(new Set([...(previous?.seen || []), ...seen]));
            const legacySeen = Math.min(
                lesson.slideCount,
                Math.max(previous?.legacySeen || 0, number(s.topics?.[lesson.id]?.s)),
              ),
              legacySeconds = Math.max(
                previous?.legacySeconds || 0,
                number(s.topics?.[lesson.id]?.t),
              );
            tx.set('progress', key, {
              id: key,
              userId: record.id,
              courseId: course.id,
              lessonId: lesson.id,
              startedAt: number(progress?.f) || number(s.at) || this.now(),
              updatedAt:
                previous?.updatedAt || number(reading?.at) || number(s.updated) || this.now(),
              seen: combined,
              last:
                previous?.last ??
                Math.min(lesson.slideCount - 1, number(reading?.last) || Math.max(0, ...seen)),
              completed:
                previous?.completed ||
                (Math.max(combined.length, legacySeen) >= Math.ceil(lesson.slideCount * 0.8) &&
                  legacySeconds >= lesson.minSeconds),
              legacySeen,
              legacySeconds,
              legacyImported: true,
            });
          }
        }
      });
    }
    await this.db.transaction(async (tx) =>
      tx.set('migrations', 'legacy-v1', {
        id: 'legacy-v1',
        students: entries.length,
        syncedAt: this.now(),
        by: a.id,
      }),
    );
    return { students: entries.length };
  }
}
