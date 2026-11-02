import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRepository, initialState } from '../lib/server/repository';
import { Platform, safeQuestion, grade } from '../lib/server/platform';
import { canReadLegacy } from '../lib/server/legacy-access';
import { course, quiz, demoUsers } from '../lib/seed';
import { sameOrigin } from '../lib/server/auth';
import { NextRequest } from 'next/server';
import type { Actor } from '../lib/types';
const student = demoUsers[0],
  teacher = demoUsers[1],
  admin = demoUsers[2];
let db: MemoryRepository, service: Platform, clock: number;
beforeEach(() => {
  db = new MemoryRepository(initialState());
  clock = Date.UTC(2026, 10, 2, 7);
  service = new Platform(db, () => clock);
});
async function enroll(a: Actor = student) {
  await service.act(a, 'enroll', { courseId: course.id });
}
const answers = () =>
  Object.fromEntries(
    quiz.questions.map((q) => [q.id, q.type === 'short' ? q.accepted![0] : q.answer]),
  );
describe('Server-authorized learning', () => {
  it('rejects role escalation, staff edits and direct XP writes from students', async () => {
    await expect(
      service.act(student, 'role', { userId: student.id, role: 'admin' }),
    ).rejects.toThrow();
    await expect(
      service.act(student, 'saveCourse', {
        title: 'x',
        description: 'x',
        published: true,
        difficulty: 'x',
        category: 'x',
      }),
    ).rejects.toThrow();
    await expect(service.act(student, 'awardXP', { points: 999999 })).rejects.toThrow();
    await service.act(student, 'profile', {
      name: 'New name',
      leaderboardVisible: false,
      xp: 99999,
      role: 'admin',
    });
    expect((await db.get('users', student.id))!.xp).toBe(0);
    expect((await db.get('users', student.id))!.role).toBe('student');
  });
  it('requires enrollment, unique slide coverage and server elapsed time', async () => {
    await expect(service.act(student, 'beginLesson', { lessonId: 'm1' })).rejects.toThrow();
    await enroll();
    await service.act(student, 'beginLesson', { lessonId: 'm1' });
    await expect(service.act(student, 'slide', { lessonId: 'm1', index: 9999 })).rejects.toThrow();
    await service.act(student, 'slide', { lessonId: 'm1', index: 0 });
    clock += 61000;
    await expect(service.act(student, 'completeLesson', { lessonId: 'm1' })).rejects.toThrow();
    for (let i = 1; i < 15; i++) await service.act(student, 'slide', { lessonId: 'm1', index: i });
    await service.act(student, 'completeLesson', { lessonId: 'm1' });
    expect((await db.get('users', student.id))!.xp).toBe(20);
  });
  it('awards a lesson once under concurrent requests and refreshes', async () => {
    await enroll();
    await service.act(student, 'beginLesson', { lessonId: 'm1' });
    for (let i = 0; i < 15; i++) await service.act(student, 'slide', { lessonId: 'm1', index: i });
    clock += 61000;
    await Promise.all(
      Array.from({ length: 12 }, () => service.act(student, 'completeLesson', { lessonId: 'm1' })),
    );
    expect((await db.get('users', student.id))!.xp).toBe(20);
    expect((await db.list('xpTransactions')).length).toBe(1);
  });
  it('keeps answer keys off public responses and grades all four question types', async () => {
    await enroll();
    const result: any = await service.act(student, 'beginQuiz', { quizId: quiz.id });
    expect(
      result.questions.every(
        (q: any) => !('answer' in q) && !('accepted' in q) && !('explanation' in q),
      ),
    ).toBe(true);
    const graded: any = await service.act(student, 'submitQuiz', {
      attemptId: result.attempt.id,
      answers: answers(),
      score: 999,
      points: 999,
    });
    expect(graded.score).toBe(100);
    expect(graded.points).toBe(80);
    expect((await db.get('users', student.id))!.xp).toBe(80);
    await expect(
      service.act(student, 'submitQuiz', { attemptId: result.attempt.id, answers: answers() }),
    ).rejects.toThrow();
    const second: any = await service.act(student, 'beginQuiz', { quizId: quiz.id });
    await service.act(student, 'submitQuiz', { attemptId: second.attempt.id, answers: answers() });
    expect((await db.get('users', student.id))!.xp).toBe(80);
  });
  it('enforces attempt counts, ownership and expiration', async () => {
    await enroll();
    const r: any = await service.act(student, 'beginQuiz', { quizId: quiz.id });
    await expect(
      service.act(teacher, 'submitQuiz', { attemptId: r.attempt.id, answers: answers() }),
    ).rejects.toThrow();
    clock += 310000;
    await expect(
      service.act(student, 'submitQuiz', { attemptId: r.attempt.id, answers: answers() }),
    ).rejects.toThrow();
    await service.act(student, 'beginQuiz', { quizId: quiz.id });
    await service.act(student, 'beginQuiz', { quizId: quiz.id });
    await expect(service.act(student, 'beginQuiz', { quizId: quiz.id })).rejects.toThrow();
  });
  it('requires daily achievement evidence and prevents duplicate challenge rewards', async () => {
    await expect(service.act(student, 'challenge', {})).rejects.toThrow();
    await enroll();
    const r: any = await service.act(student, 'beginQuiz', { quizId: quiz.id });
    await service.act(student, 'submitQuiz', { attemptId: r.attempt.id, answers: answers() });
    await Promise.all(Array.from({ length: 5 }, () => service.act(student, 'challenge', {})));
    expect((await db.get('users', student.id))!.xp).toBe(105);
    expect((await db.get('users', student.id))!.streak).toBe(1);
  });
  it('daily challenges respect each quiz passing score instead of a fixed threshold', async () => {
    await enroll();
    await db.transaction(async (tx) => {
      const q = await tx.get('quizzes', quiz.id);
      tx.set('quizzes', quiz.id, { ...q, passingScore: 90 });
    });
    const r: any = await service.act(student, 'beginQuiz', { quizId: quiz.id });
    const values = answers();
    delete values.q4;
    const result: any = await service.act(student, 'submitQuiz', {
      attemptId: r.attempt.id,
      answers: values,
    });
    expect(result.score).toBe(75);
    expect(result.passed).toBe(false);
    await expect(service.act(student, 'challenge', {})).rejects.toThrow();
  });
  it('unpublished lessons cannot be read or tested by enrolled students', async () => {
    await enroll();
    await db.transaction(async (tx) => {
      const l = await tx.get('lessons', 'm7');
      tx.set('lessons', 'm7', { ...l, published: false });
    });
    await expect(service.act(student, 'getLesson', { lessonId: 'm7' })).rejects.toThrow();
    await expect(service.act(student, 'beginQuiz', { quizId: quiz.id })).rejects.toThrow();
  });
  it('server access checks run before lesson and quiz rewards', async () => {
    const guarded = new Platform(
      db,
      () => clock,
      async () => {
        throw new Error('closed');
      },
    );
    await enroll();
    await expect(guarded.act(student, 'beginLesson', { lessonId: 'm1' })).rejects.toThrow('closed');
    await expect(guarded.act(student, 'beginQuiz', { quizId: quiz.id })).rejects.toThrow('closed');
  });
  it('preserves independent learners outside class rankings and respects opt-out', async () => {
    await db.transaction(async (tx) => {
      tx.set('users', 'independent', {
        ...student,
        id: 'independent',
        learnerType: 'independent',
        xp: 1000,
      });
      tx.set('xpTransactions', 'ind-event', {
        id: 'ind-event',
        userId: 'independent',
        points: 1000,
        courseId: course.id,
        createdAt: clock,
        classId: '',
      });
    });
    const board = await service.leaderboard(student, 'all', '');
    expect(board.some((x) => x.id === 'independent')).toBe(false);
    await service.act(student, 'profile', { name: student.name, leaderboardVisible: false });
    expect((await service.leaderboard(teacher, 'all', '')).some((x) => x.id === student.id)).toBe(
      false,
    );
  });
  it('restricts teacher access to owned courses and new lessons preserve original materials', async () => {
    await db.transaction(async (tx) =>
      tx.set('courses', 'private', {
        ...course,
        id: 'private',
        ownerId: 'another',
        published: false,
      }),
    );
    await expect(
      service.act(teacher, 'saveCourse', { ...course, id: 'private' }),
    ).rejects.toThrow();
    await expect(
      service.act(teacher, 'saveLesson', {
        id: 'm1',
        courseId: course.id,
        moduleId: 'intro',
        title: 'Changed',
        minSeconds: 60,
        published: true,
        order: 0,
        slides: [{ title: 'A', body: 'B' }],
      }),
    ).rejects.toThrow();
    const before = await db.get('lessons', 'm1');
    await service.act(admin, 'importCatalog', {});
    expect(await db.get('lessons', 'm1')).toEqual(before);
  });
  it('rejects bad reward settings and prototype keys', async () => {
    await expect(
      service.act(admin, 'settings', {
        rewards: { lesson: -1, quiz: 50, perfect: 30, course: 200, challenge: 25 },
        levels: [
          { name: 'Beginner', xp: 0 },
          { name: 'Bad', xp: 0 },
        ],
      }),
    ).rejects.toThrow();
    await expect(
      service.act(admin, 'saveModule', {
        id: '__proto__',
        courseId: course.id,
        title: 'Bad',
        order: 0,
      }),
    ).rejects.toThrow();
  });
});
describe('Original access parity', () => {
  const u = {
    id: 'legacy_s1',
    classId: 'AP-223',
    learnerType: 'university',
    role: 'student',
  } as Actor;
  it('allows public reading but rejects independent group and personal grants', () => {
    const g = { lim: true, g: { 'AP-223': clock }, s: { s1: clock } };
    expect(canReadLegacy({ open: true, lim: true }, g, u, clock)).toBe(true);
    expect(
      canReadLegacy({ open: true, lim: true }, g, { ...u, learnerType: 'independent' }, clock),
    ).toBe(false);
    expect(
      canReadLegacy({ open: true, read: true }, g, { ...u, learnerType: 'independent' }, clock),
    ).toBe(true);
  });
});

describe('Request origin protection', () => {
  it('accepts the browser host behind the Next.js development proxy and rejects foreign origins', () => {
    expect(() =>
      sameOrigin(
        new NextRequest('http://localhost:3200/api/platform', {
          headers: { host: '127.0.0.1:3200', origin: 'http://127.0.0.1:3200' },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      sameOrigin(
        new NextRequest('http://localhost:3200/api/platform', {
          headers: { host: '127.0.0.1:3200', origin: 'https://foreign.example' },
        }),
      ),
    ).toThrow();
  });
});
