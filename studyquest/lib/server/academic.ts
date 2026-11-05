import 'server-only';
import { createHash } from 'node:crypto';
import type { Actor, ReadingHistory } from '../types';
import type { Repository, Row } from './repository';
import { administrator, check, staff } from './auth';
import { legacyDb } from './repository';
import { course, lessons, catalog } from '../seed';

type Read = (path: string) => Promise<any>;
const number = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
export function academicRecord(id: string, s: Row) {
  const topics: Record<string, Row> = {},
    manual: Record<string, number> = {},
    history: Record<string, ReadingHistory> = {};
  for (const lesson of lessons) {
    // Historical marks were earned against the archived 18-slide topic.
    const gradingSlideCount = lesson.slideCount;
    const value = s.topics?.[lesson.id] || {},
      progress = s.prog?.[lesson.id] || {},
      reading = s.reading?.[lesson.id] || {};
    const independent = s.learnerType === 'independent';
    const seen = Object.keys(independent ? reading.sl || {} : progress.sl || {})
      .map((k) => /^slide(\d+)$/.exec(k))
      .filter(Boolean)
      .map((match) => Number(match![1]))
      .filter((n) => n >= 0 && n < gradingSlideCount);
    const newer = Object.keys(progress.nw || {}),
      acts = Object.keys(progress.ac || {}).filter(
        (k) => /^(?:test|task|xw)/.test(k) && k !== 'xwAll',
      );
    const count = Math.min(
      gradingSlideCount,
      Math.max(
        seen.length,
        independent ? 0 : number(value.s),
        number(progress.sF) + newer.filter((k) => k.startsWith('slide')).length,
      ),
    );
    const seconds = Math.max(
      number(value.t),
      Object.values(progress.tm || {}).reduce<number>((sum, value) => sum + number(value), 0),
    );
    const correct = Math.max(
      number(value.q),
      acts.length,
      number(progress.qF) + newer.filter((k) => !k.startsWith('slide')).length,
    );
    const maximum = Number(catalog.topics.find((t) => t.id === lesson.id)?.quiz || 15);
    // Asl tizimdagi formula: 30 — slaydlar, 20 — faol o'qish vaqti (1 soat), 50 — to'g'ri javoblar.
    const parts = {
      slides: Math.round(300 * Math.min(1, count / gradingSlideCount)) / 10,
      time: Math.round(200 * Math.min(1, seconds / 3600)) / 10,
      test: Math.round(500 * Math.min(1, correct / maximum)) / 10,
    };
    const ratio =
      (0.3 * count) / gradingSlideCount +
      0.2 * Math.min(1, seconds / 3600) +
      0.5 * Math.min(1, correct / maximum);
    const score =
      value.p !== undefined && value.p !== null && Number.isFinite(Number(value.p))
        ? number(value.p)
        : Math.round(ratio * 1000) / 10;
    const pc = Math.round(ratio * 100),
      grade =
        number(value.b) ||
        (count || seconds || correct
          ? pc >= 90
            ? 5
            : pc >= 75
              ? 4
              : pc >= 60
                ? 3
                : pc >= 40
                  ? 2
                  : 1
          : 0);
    history[lesson.id] = {
      seenSlides: count,
      totalSlides: lesson.slideCount,
      lastSlide: Math.min(
        lesson.slideCount - 1,
        Number.isInteger(reading.last) ? Math.max(0, reading.last) : Math.max(0, ...seen),
      ),
      seconds,
      correctAnswers: correct,
      quizTotal: maximum,
      parts,
      status: count >= lesson.slideCount ? 'read' : count || seconds || correct ? 'started' : 'new',
      ...(!independent ? { score, grade } : {}),
    };
    if (!independent && (s.topics?.[lesson.id] || s.prog?.[lesson.id]))
      topics[lesson.id] = {
        p: score,
        s: count,
        t: seconds,
        q: correct,
        b: grade,
        z: Number.isFinite(value.z) ? number(value.z) : pc,
      };
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
    readingHistory: history,
    mustChangePassword: s.mustChangePassword === true,
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
    const [source, contacts] = await Promise.all([this.read('students'), this.read('priv')]);
    return Object.entries(source || {})
      .filter(([id, s]: any) => /^[a-zA-Z0-9_-]{1,100}$/.test(id) && s?.name && s?.status)
      .map(([id, s]: [string, any]) => ({
        ...academicRecord(id, s),
        email: String(contacts?.[id]?.email || s.email || '').slice(0, 254),
        legacyRegisteredAt: number(s.at),
      }));
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
  async publicBoard(now = Date.now()) {
    const source = (await this.read('students')) || {};
    // 📅 Kunlik reyting: dvigatel yozadigan dd (bugungi sana, Toshkent) va d0 (kun boshidagi ball).
    const today = new Date(now + 18000000).toISOString().slice(0, 10);
    return Object.entries(source)
      .filter(
        ([id, s]: [string, any]) =>
          /^[a-zA-Z0-9_-]{1,100}$/.test(id) &&
          s?.name &&
          s.status === 'ok' &&
          s.learnerType !== 'independent' &&
          s.leaderboardVisible !== false,
      )
      .map(([id, s]: [string, any]) => ({
        id: 'legacy_' + id,
        name: [s.name, s.surname]
          .filter((v) => typeof v === 'string')
          .join(' ')
          .slice(0, 200),
        classId: String(s.group || '').slice(0, 100),
        academicPoints: number(s.total),
        today:
          s.dd === today ? Math.round(Math.max(0, number(s.total) - number(s.d0)) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.academicPoints - a.academicPoints || a.name.localeCompare(b.name));
  }
  async sync(a: Actor) {
    administrator(a);
    const source = (await this.read('students')) || {};
    const entries = Object.entries(source).filter(
      ([id, s]: any) => /^[a-zA-Z0-9_-]{1,100}$/.test(id) && s?.name && s?.status,
    );
    const fingerprint = (sid: string, s: Row) =>
      createHash('sha256')
        .update(
          JSON.stringify({
            record: academicRecord(sid, s),
            progress: s.prog || {},
            reading: s.reading || {},
            at: s.at || 0,
            updated: s.updated || 0,
          }),
        )
        .digest('hex');
    // At most 20 * (user + enrollment + 15 progress) writes per transaction.
    for (let offset = 0; offset < entries.length; offset += 20) {
      await this.db.transaction(async (tx) => {
        const batch = entries.slice(offset, offset + 20);
        const cached = new Map<string, Row | null>(
          await Promise.all(
            batch.flatMap(([sid]) => {
              const uid = 'legacy_' + sid;
              return [
                ['users', uid],
                ['enrollments', uid + '_' + course.id],
              ].map(async ([c, id]) => [c + '/' + id, await tx.get(c, id)] as const);
            }),
          ),
        );
        const changed = batch.filter(
          ([sid, s]) =>
            cached.get('users/legacy_' + sid)?.legacySourceHash !== fingerprint(sid, s as Row) ||
            !cached.get('enrollments/legacy_' + sid + '_' + course.id),
        );
        const reads: [string, string][] = [];
        for (const [sid, raw] of changed) {
          const value = raw as Row,
            userId = 'legacy_' + sid;
          for (const lesson of lessons)
            if (value.prog?.[lesson.id] || value.reading?.[lesson.id] || value.topics?.[lesson.id])
              reads.push(['progress', userId + '_' + lesson.id]);
        }
        await Promise.all(
          reads.map(async ([collection, id]) =>
            cached.set(collection + '/' + id, await tx.get(collection, id)),
          ),
        );
        for (const [sid, raw] of changed) {
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
            legacySourceHash: fingerprint(sid, s),
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
