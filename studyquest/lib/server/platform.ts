import 'server-only';
import { randomUUID, randomInt } from 'node:crypto';
import { z } from 'zod';
import type { Actor, Course, Lesson, Quiz, Question, Settings, User } from '../types';
import type { Repository, Tx, Row } from './repository';
import { check, staff, administrator } from './auth';
import { settings as defaults, badges, course, modules, lessons, quiz } from '../seed';

/* Taqdimot fayllaridan (katalogdan) olingan darslar uchun nom, slaydlar soni va fayl doim katalogdan olinadi:
   bazadagi eski yozuv (masalan, 7-mavzuning avvalgi nomi va 18 slaydi) yangilangan taqdimotni buzmasligi uchun. */
const catalogLessons = new Map(lessons.filter((l) => l.legacyFile).map((l) => [l.id, l]));
export function withCatalog<T extends Row | null | undefined>(l: T): T {
  const c = l && catalogLessons.get(l.id);
  if (!l || !c) return l;
  return {
    ...l,
    title: c.title,
    slideCount: c.slideCount,
    legacyFile: c.legacyFile,
    legacyPdf: c.legacyPdf,
  } as T;
}
const id = z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,100}$/)
    .refine((v) => !['__proto__', 'constructor', 'prototype'].includes(v)),
  text = z.string().trim().min(1).max(200),
  bodyText = z.string().max(15000);
const day = (n: number) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(n);
const normalize = (x: unknown) =>
  String(x ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[‘’ʻʼ]/g, "'")
    .replace(/\s+/g, ' ');
export function grade(question: Question, value: unknown) {
  if (question.type === 'short')
    return (question.accepted || []).some((a) => normalize(a) === normalize(value));
  if (question.type === 'matching')
    return (
      !!value &&
      typeof value === 'object' &&
      Object.entries(question.answer as Record<string, string>).every(
        ([k, v]) => (value as Record<string, unknown>)[k] === v,
      )
    );
  return value === question.answer;
}
export function safeQuestion(q: Question) {
  const { answer, accepted, explanation, ...safe } = q;
  void answer;
  void accepted;
  void explanation;
  return safe;
}
export class Platform {
  constructor(
    public db: Repository,
    public now = () => Date.now(),
    public lessonAccess: (a: Actor, l: Lesson) => Promise<void> = async () => {},
  ) {}
  async requireCourse(a: Actor, courseId: string) {
    const c = await this.db.get('courses', courseId);
    check(c, 404, 'Kurs topilmadi');
    if (a.role === 'student') {
      check(c!.published, 403, 'Kurs hali ochilmagan');
      check(
        await this.db.get('enrollments', a.id + '_' + courseId),
        403,
        'Avval kursga qo‘shiling',
      );
    } else {
      check(
        c!.published || a.role === 'admin' || c!.ownerId === a.id || c!.ownerId === 'system',
        403,
        'Kursga ruxsat yo‘q',
      );
    }
    return c as Course;
  }
  async manage(a: Actor, courseId: string) {
    staff(a);
    const c = await this.db.get('courses', courseId);
    check(
      c && (a.role === 'admin' || c.ownerId === a.id || c.ownerId === 'system'),
      403,
      'Bu kursni tahrirlashga ruxsat yo‘q',
    );
    return c as Course;
  }
  async reward(
    tx: Tx,
    a: Actor,
    kind: keyof Settings['rewards'],
    target: string,
    courseId: string,
  ) {
    const key = a.id + '_' + kind + '_' + target,
      existing = await tx.get('xpTransactions', key),
      u = await tx.get('users', a.id),
      cfg = (await tx.get('settings', 'platform')) || defaults;
    if (existing) return { points: 0, duplicate: true };
    check(u, 401, 'Hisob topilmadi');
    const points = cfg.rewards[kind];
    check(
      Number.isInteger(points) && points >= 0 && points <= 10000,
      500,
      'XP sozlamasi noto‘g‘ri',
    );
    const today = day(this.now()),
      yesterday = day(this.now() - 86400000);
    const streak =
      u!.lastStudyDay === today
        ? u!.streak
        : u!.lastStudyDay === yesterday
          ? (u!.streak || 0) + 1
          : 1;
    tx.set('users', a.id, { ...u, xp: (u!.xp || 0) + points, streak, lastStudyDay: today });
    tx.set('xpTransactions', key, {
      id: key,
      userId: a.id,
      courseId,
      kind,
      points,
      createdAt: this.now(),
      classId: a.classId,
    });
    tx.set('notifications', key, {
      id: key,
      userId: a.id,
      title: '+' + points + ' XP · ' + kind,
      createdAt: this.now(),
    });
    const badge =
      kind === 'lesson'
        ? 'first'
        : kind === 'quiz'
          ? 'quiz'
          : kind === 'perfect'
            ? 'perfect'
            : kind === 'course'
              ? 'course'
              : null;
    if (badge)
      tx.set('userAchievements', a.id + '_' + badge, {
        id: a.id + '_' + badge,
        userId: a.id,
        badgeId: badge,
        at: this.now(),
      });
    if (streak >= 7)
      tx.set('userAchievements', a.id + '_streak', {
        id: a.id + '_streak',
        userId: a.id,
        badgeId: 'streak',
        at: this.now(),
      });
    return { points, duplicate: false };
  }
  async publicData() {
    const [c, m, l, q, cfg, b] = await Promise.all(
      ['courses', 'modules', 'lessons', 'quizzes', 'settings', 'achievements'].map((x) =>
        this.db.list(x),
      ),
    );
    const courses = c.filter((x) => x.published),
      ids = new Set(courses.map((x) => x.id)),
      publicLessons = l.filter((x) => x.published && ids.has(x.courseId));
    return {
      courses,
      subjects: await this.db.list('subjects'),
      modules: m.filter((x) => ids.has(x.courseId)),
      lessons: publicLessons.map(({ slides, ...x }) => withCatalog({ ...x, slides: [] })),
      quizzes: q.filter(
        (x) => x.lessonId !== 'm7' && publicLessons.some((l) => l.id === x.lessonId),
      ),
      settings: cfg.find((x) => x.id === 'platform') || defaults,
      badges: b.length ? b : badges,
    };
  }
  async state(a: Actor, includeStaff = false, includeReports = true) {
    const [catalog, user, progress, attempts, transactions, earned, ownNotices, sharedNotices] =
      await Promise.all([
        this.publicData(),
        this.db.get('users', a.id),
        this.db.find('progress', 'userId', a.id),
        this.db.find('quizAttempts', 'userId', a.id),
        this.db.find('xpTransactions', 'userId', a.id),
        this.db.find('userAchievements', 'userId', a.id),
        this.db.find('notifications', 'userId', a.id),
        this.db.find('notifications', 'userId', 'all'),
      ]);
    const activity = Array.from({ length: 7 }, (_, i) => {
      const d = day(this.now() - (6 - i) * 86400000);
      return {
        day: d.slice(5),
        xp: transactions.filter((x) => day(x.createdAt) === d).reduce((s, x) => s + x.points, 0),
      };
    });
    let staffData = {};
    // Class-wide reports are requested only on the teacher/admin screen.
    if (includeStaff && a.role !== 'student') {
      const managed = (await this.db.list('courses')).filter(
        (c) => a.role === 'admin' || c.ownerId === a.id || c.ownerId === 'system',
      );
      const ids = new Set(managed.map((c) => c.id));
      const forCourses = async (collection: string) =>
        (await Promise.all(managed.map((c) => this.db.find(collection, 'courseId', c.id)))).flat();
      const [enrollments, allProgress, allAttempts, classes] = includeReports
        ? await Promise.all([
            forCourses('enrollments'),
            forCourses('progress'),
            forCourses('quizAttempts'),
            a.role === 'admin'
              ? this.db.list('classes')
              : this.db.find('classes', 'teacherId', a.id),
          ])
        : [[], [], [], []];
      const users = !includeReports
        ? []
        : a.role === 'admin'
          ? await this.db.list('users')
          : (
              await Promise.all(
                [...new Set([a.id, ...enrollments.map((e) => e.userId)])].map((id) =>
                  this.db.get('users', id),
                ),
              )
            ).filter(Boolean);
      staffData = {
        classes,
        users,
        allProgress,
        allAttempts: allAttempts.map(({ answers, ...x }) => x),
        courses: managed,
        modules: (await this.db.list('modules')).filter((m) => ids.has(m.courseId)),
        lessons: (await this.db.list('lessons'))
          .filter((l) => ids.has(l.courseId))
          .map(withCatalog),
      };
    }
    return {
      ...catalog,
      user: {
        ...user,
        ...(a.academicPoints !== undefined ? { academicPoints: a.academicPoints } : {}),
      },
      progress,
      attempts: attempts.map(({ answers, ...x }) => x),
      transactions,
      earned: earned.map((x) => x.badgeId),
      activity,
      notifications: [...ownNotices, ...sharedNotices],
      ...staffData,
    };
  }
  async act(a: Actor, action: string, input: unknown): Promise<unknown> {
    const n = this.now();
    if (action === 'enroll') {
      const p = z.object({ courseId: id, userId: id.optional() }).parse(input),
        who = p.userId || a.id;
      if (who !== a.id) await this.manage(a, p.courseId);
      const c = await this.db.get('courses', p.courseId);
      check(c && (a.role !== 'student' || c.published), 403, 'Kursga ruxsat yo‘q');
      check(await this.db.get('users', who), 404, 'O‘quvchi topilmadi');
      return this.db.transaction(async (tx) => {
        const key = who + '_' + p.courseId;
        if (!(await tx.get('enrollments', key)))
          tx.set('enrollments', key, { id: key, userId: who, courseId: p.courseId, at: n });
        return { ok: true };
      });
    }
    if (action === 'getLesson') {
      const p = z.object({ lessonId: id }).parse(input),
        lesson = withCatalog(await this.db.get('lessons', p.lessonId));
      check(lesson, 404, 'Dars topilmadi');
      check(lesson!.published || a.role !== 'student', 403, 'Dars hali ochilmagan');
      await this.requireCourse(a, lesson!.courseId);
      await this.lessonAccess(a, lesson as Lesson);
      return lesson;
    }
    if (['beginLesson', 'slide', 'completeLesson'].includes(action)) {
      const p = z.object({ lessonId: id, index: z.number().int().min(0).optional() }).parse(input),
        l = withCatalog(await this.db.get('lessons', p.lessonId));
      check(l, 404, 'Dars topilmadi');
      check(l!.published || a.role !== 'student', 403, 'Dars hali ochilmagan');
      await this.requireCourse(a, l!.courseId);
      await this.lessonAccess(a, l as Lesson);
      check(l!.published || a.role !== 'student', 403, 'Dars hali ochilmagan');
      const key = a.id + '_' + p.lessonId;
      return this.db
        .transaction(async (tx) => {
          const old = await tx.get('progress', key),
            progress = old || {
              id: key,
              userId: a.id,
              lessonId: p.lessonId,
              courseId: l!.courseId,
              startedAt: n,
              updatedAt: n,
              seen: [],
              last: 0,
              completed: false,
            };
          if (action === 'slide') {
            check(p.index !== undefined && p.index < l!.slideCount, 400, 'Slayd raqami noto‘g‘ri');
            if (old && old.last === p.index && old.seen.includes(p.index))
              return { progress: old, reward: { points: 0, duplicate: false } };
            progress.seen = Array.from(new Set([...progress.seen, p.index]));
            progress.last = p.index;
          }
          let reward = { points: 0, duplicate: false };
          if (action === 'completeLesson') {
            check(
              progress.seen.length >= Math.max(1, Math.ceil(l!.slideCount * 0.8)) &&
                n - progress.startedAt >= l!.minSeconds * 1000,
              409,
              'Kamida 80% slaydni o‘qing va belgilangan o‘qish vaqtini bajaring.',
            );
            reward = await this.reward(tx, a, 'lesson', p.lessonId, l!.courseId);
            progress.completed = true;
          }
          progress.updatedAt = n;
          tx.set('progress', key, progress);
          return { progress, reward };
        })
        .then(async (result) => {
          if (action === 'completeLesson') await this.courseReward(a, l!.courseId);
          return result;
        });
    }
    if (action === 'beginQuiz') {
      const p = z.object({ quizId: id }).parse(input),
        q = await this.db.get('quizzes', p.quizId),
        privateQ = await this.db.get('quizKeys', p.quizId);
      check(q && privateQ, 404, 'Test topilmadi');
      const l = withCatalog(await this.db.get('lessons', q!.lessonId));
      check(l, 404, 'Dars topilmadi');
      check(l!.published || a.role !== 'student', 403, 'Dars hali ochilmagan');
      await this.requireCourse(a, l!.courseId);
      await this.lessonAccess(a, l as Lesson);
      return this.db.transaction(async (tx) => {
        const countId = a.id + '_' + p.quizId,
          usage = await tx.get('quizUsage', countId);
        check((usage?.count || 0) < q!.attempts, 409, 'Urinishlar tugagan');
        const questions = [...privateQ!.questions] as Question[];
        if (q!.randomize)
          for (let i = questions.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [questions[i], questions[j]] = [questions[j], questions[i]];
          }
        const attempt = {
          id: randomUUID(),
          userId: a.id,
          quizId: p.quizId,
          courseId: l!.courseId,
          startedAt: n,
          questionIds: questions.map((x) => x.id),
        };
        tx.set('quizAttempts', attempt.id, attempt);
        tx.set('quizUsage', countId, { id: countId, userId: a.id, count: (usage?.count || 0) + 1 });
        return { attempt, questions: questions.map(safeQuestion), timeLimit: q!.timeLimit };
      });
    }
    if (action === 'submitQuiz') {
      const p = z
        .object({ attemptId: id, answers: z.record(z.string(), z.unknown()) })
        .parse(input);
      const existing = await this.db.get('quizAttempts', p.attemptId);
      check(existing?.userId === a.id, 403, 'Urinishga ruxsat yo‘q');
      const existingQuiz = await this.db.get('quizzes', existing!.quizId),
        existingLesson =
          existingQuiz && withCatalog(await this.db.get('lessons', existingQuiz.lessonId));
      check(existingLesson, 404, 'Dars topilmadi');
      check(existingLesson!.published || a.role !== 'student', 403, 'Dars hali ochilmagan');
      await this.requireCourse(a, existingLesson!.courseId);
      await this.lessonAccess(a, existingLesson as Lesson);
      const result = await this.db.transaction(async (tx) => {
        const attempt = await tx.get('quizAttempts', p.attemptId);
        check(attempt && attempt.userId === a.id, 403, 'Urinishga ruxsat yo‘q');
        check(!attempt!.submittedAt, 409, 'Bu urinish allaqachon topshirilgan');
        const q = await tx.get('quizzes', attempt!.quizId),
          key = await tx.get('quizKeys', attempt!.quizId);
        check(q && key, 404, 'Test topilmadi');
        check(n - attempt!.startedAt <= (q!.timeLimit + 5) * 1000, 409, 'Test vaqti tugagan');
        const questions = key!.questions as Question[];
        check(
          Object.keys(p.answers).every((k) => questions.some((x) => x.id === k)),
          400,
          'Noma’lum savol',
        );
        const correct = questions.filter((x) => grade(x, p.answers[x.id])).length,
          score = Math.round((correct / questions.length) * 100);
        let points = 0;
        if (score >= q!.passingScore)
          points += (await this.reward(tx, a, 'quiz', attempt!.quizId, attempt!.courseId)).points;
        if (score === 100)
          points += (await this.reward(tx, a, 'perfect', attempt!.quizId, attempt!.courseId))
            .points;
        // In one transaction, subsequent rewards must see earlier pending user writes.
        tx.set('quizAttempts', p.attemptId, {
          ...attempt,
          submittedAt: n,
          answers: p.answers,
          score,
          correct,
          passed: score >= q!.passingScore,
        });
        return {
          score,
          correct,
          total: questions.length,
          passed: score >= q!.passingScore,
          points,
          feedback:
            q!.feedback === false
              ? []
              : questions.map((x) => ({
                  id: x.id,
                  correct: grade(x, p.answers[x.id]),
                  explanation: x.explanation,
                })),
        };
      });
      return result;
    }
    if (action === 'challenge') {
      const today = day(n),
        attempts = await this.db.find('quizAttempts', 'userId', a.id);
      check(
        attempts.some(
          (x) =>
            x.userId === a.id && x.passed === true && x.submittedAt && day(x.submittedAt) === today,
        ),
        409,
        'Avval bugungi testdan muvaffaqiyatli o‘ting.',
      );
      return this.db.transaction((tx) => this.reward(tx, a, 'challenge', today, course.id));
    }
    if (action === 'profile') {
      const p = z.object({ name: text, leaderboardVisible: z.boolean() }).parse(input);
      return this.db.transaction(async (tx) => {
        const u = await tx.get('users', a.id);
        check(u, 404, 'Hisob topilmadi');
        tx.set('users', a.id, { ...u, ...p });
        return { ok: true };
      });
    }
    if (action === 'saveSubject' || action === 'saveClass') {
      staff(a);
      const p = z.object({ id: id.optional(), title: text }).parse(input),
        collection = action === 'saveClass' ? 'classes' : 'subjects',
        key = p.id || randomUUID();
      return this.db.transaction(async (tx) => {
        const old = await tx.get(collection, key);
        check(
          !old || a.role === 'admin' || old.ownerId === a.id || old.teacherId === a.id,
          403,
          'Tahrirlashga ruxsat yo‘q',
        );
        tx.set(collection, key, {
          id: key,
          title: p.title,
          ownerId: a.id,
          ...(collection === 'classes' ? { teacherId: a.id } : {}),
        });
        return { id: key };
      });
    }
    if (action === 'assignClass') {
      staff(a);
      const p = z.object({ userId: id, classId: id }).parse(input),
        c = await this.db.get('classes', p.classId);
      check(
        c && (a.role === 'admin' || c.teacherId === a.id),
        403,
        'Guruhni boshqarish ruxsati yo‘q',
      );
      return this.db.transaction(async (tx) => {
        const u = await tx.get('users', p.userId);
        check(
          u?.role === 'student' && u.learnerType === 'university',
          400,
          'Mustaqil o‘quvchiga universitet guruhi biriktirilmaydi',
        );
        tx.set('users', p.userId, { ...u, classId: p.classId });
        return { ok: true };
      });
    }
    if (action === 'saveCourse') {
      staff(a);
      const p = z
        .object({
          id: id.optional(),
          title: text,
          description: bodyText,
          published: z.boolean(),
          difficulty: text,
          category: text,
        })
        .parse(input);
      if (p.id) await this.manage(a, p.id);
      const key = p.id || randomUUID();
      return this.db.transaction(async (tx) => {
        const old = await tx.get('courses', key);
        tx.set('courses', key, {
          ...p,
          id: key,
          ownerId: old?.ownerId || a.id,
          illustration: 'business',
        });
        return { id: key };
      });
    }
    if (action === 'saveModule') {
      const p = z
        .object({
          id: id.optional(),
          courseId: id,
          title: text,
          order: z.number().int().min(0).max(1000),
        })
        .parse(input);
      await this.manage(a, p.courseId);
      const key = p.id || randomUUID();
      return this.db.transaction(async (tx) => {
        const old = await tx.get('modules', key);
        check(!old || old.courseId === p.courseId, 403, 'Modul boshqa kursga tegishli');
        tx.set('modules', key, { ...p, id: key });
        return { id: key };
      });
    }
    if (action === 'saveLesson') {
      const p = z
        .object({
          id: id.optional(),
          courseId: id,
          moduleId: id,
          title: text,
          order: z.number().int().min(0).max(1000),
          minSeconds: z.number().int().min(30).max(7200),
          published: z.boolean(),
          materialId: id.optional(),
          slides: z
            .array(z.object({ title: text, body: bodyText }))
            .min(1)
            .max(100),
        })
        .parse(input);
      await this.manage(a, p.courseId);
      const mod = await this.db.get('modules', p.moduleId);
      check(mod?.courseId === p.courseId, 400, 'Modulni tanlang');
      if (p.materialId)
        check(
          (await this.db.get('presentations', p.materialId))?.courseId === p.courseId,
          400,
          'Material boshqa kursga tegishli',
        );
      const key = p.id || randomUUID();
      return this.db.transaction(async (tx) => {
        const old = await tx.get('lessons', key);
        check(!old || old.courseId === p.courseId, 403, 'Dars boshqa kursga tegishli');
        check(!old?.legacyFile, 409, 'Asl taqdimot o‘zgartirilmaydi; yangi dars yarating.');
        tx.set('lessons', key, { ...p, id: key, slideCount: p.slides.length });
        return { id: key };
      });
    }
    if (action === 'getQuizForEdit') {
      const p = z.object({ quizId: id }).parse(input),
        q = await this.db.get('quizzes', p.quizId);
      check(q, 404, 'Test topilmadi');
      const l = withCatalog(await this.db.get('lessons', q!.lessonId));
      check(l, 404, 'Dars topilmadi');
      await this.manage(a, l!.courseId);
      return { ...q, questions: (await this.db.get('quizKeys', p.quizId))?.questions || [] };
    }
    if (action === 'saveQuiz') {
      const schema = z.object({
        id: id.optional(),
        lessonId: id,
        title: text,
        passingScore: z.number().int().min(1).max(100),
        attempts: z.number().int().min(1).max(10),
        timeLimit: z.number().int().min(30).max(7200),
        randomize: z.boolean(),
        feedback: z.boolean().default(true),
        questions: z
          .array(
            z.object({
              id: id,
              type: z.enum(['choice', 'boolean', 'matching', 'short']),
              prompt: text,
              options: z.array(text).max(12).optional(),
              pairs: z.array(text).max(12).optional(),
              accepted: z.array(text).max(30).optional(),
              answer: z.unknown().optional(),
              explanation: bodyText,
            }),
          )
          .min(1)
          .max(100),
      });
      const p = schema.parse(input),
        l = withCatalog(await this.db.get('lessons', p.lessonId));
      check(l, 404, 'Dars topilmadi');
      await this.manage(a, l!.courseId);
      check(
        new Set(p.questions.map((x) => x.id)).size === p.questions.length,
        400,
        'Savol ID takrorlangan',
      );
      for (const q of p.questions) {
        check(
          q.type !== 'choice' || (q.options?.length && q.options.includes(q.answer as string)),
          400,
          'Variant va to‘g‘ri javobni tekshiring',
        );
        check(
          q.type !== 'boolean' || typeof q.answer === 'boolean',
          400,
          'To‘g‘ri/noto‘g‘ri javob kerak',
        );
        check(q.type !== 'short' || q.accepted?.length, 400, 'Qabul qilinadigan javoblar kerak');
        check(
          q.type !== 'matching' ||
            (q.pairs?.length &&
              q.answer &&
              typeof q.answer === 'object' &&
              q.pairs.every((k) => q.options?.includes((q.answer as Record<string, string>)[k]))),
          400,
          'Moslashtirish juftliklarini tekshiring',
        );
      }
      const key = p.id || randomUUID(),
        { questions, ...meta } = p;
      return this.db.transaction(async (tx) => {
        const old = await tx.get('quizzes', key);
        check(!old || old.lessonId === p.lessonId, 403, 'Test boshqa darsga tegishli');
        tx.set('quizzes', key, { ...meta, id: key });
        tx.set('quizKeys', key, { id: key, questions });
        return { id: key };
      });
    }
    if (action === 'role') {
      administrator(a);
      const p = z
        .object({
          userId: id,
          role: z.enum(['student', 'teacher', 'admin']),
          blocked: z.boolean().optional(),
        })
        .parse(input);
      check(
        p.userId !== a.id,
        409,
        'O‘z administrator huquqingizni shu yerda o‘zgartirib bo‘lmaydi',
      );
      return this.db.transaction(async (tx) => {
        const u = await tx.get('users', p.userId);
        check(u, 404, 'Hisob topilmadi');
        tx.set('users', p.userId, {
          ...u,
          role: p.role,
          ...(p.blocked !== undefined ? { blocked: p.blocked } : {}),
        });
        return { ok: true };
      });
    }
    if (action === 'settings') {
      administrator(a);
      const p = z
        .object({
          rewards: z.object({
            lesson: z.number().int().min(0).max(1000),
            quiz: z.number().int().min(0).max(1000),
            perfect: z.number().int().min(0).max(1000),
            challenge: z.number().int().min(0).max(1000),
            course: z.number().int().min(0).max(10000),
          }),
          levels: z
            .array(z.object({ name: text, xp: z.number().int().min(0).max(10000000) }))
            .min(2)
            .max(10),
        })
        .parse(input);
      check(
        p.levels[0].xp === 0 && p.levels.every((x, i) => !i || x.xp > p.levels[i - 1].xp),
        400,
        'Darajalar 0 dan boshlab ortib borishi kerak',
      );
      return this.db.transaction(async (tx) => {
        tx.set('settings', 'platform', p);
        return { ok: true };
      });
    }
    if (action === 'awardBadge') {
      staff(a);
      const p = z.object({ userId: id, badgeId: id, courseId: id }).parse(input);
      await this.manage(a, p.courseId);
      const enrollment = await this.db.get('enrollments', p.userId + '_' + p.courseId);
      check(
        enrollment && badges.some((b) => b.id === p.badgeId),
        400,
        'Kurs a’zosi va yutuqni tanlang',
      );
      return this.db.transaction(async (tx) => {
        const key = p.userId + '_' + p.badgeId;
        tx.set('userAchievements', key, {
          id: key,
          userId: p.userId,
          badgeId: p.badgeId,
          awardedBy: a.id,
          at: n,
        });
        return { ok: true };
      });
    }
    if (action === 'importCatalog') {
      administrator(a);
      return this.db.transaction(async (tx) => {
        const entries: [string, Row][] = [
          ['courses', course],
          ...modules.map((x) => ['modules', x] as [string, Row]),
          ...lessons.map((x) => ['lessons', x] as [string, Row]),
        ];
        for (const [c, v] of entries) if (!(await tx.get(c, v.id))) tx.set(c, v.id, v);
        if (!(await tx.get('quizzes', quiz.id))) {
          const { questions, ...q } = quiz;
          tx.set('quizzes', quiz.id, q);
          tx.set('quizKeys', quiz.id, { id: quiz.id, questions });
        }
        if (!(await tx.get('settings', 'platform'))) tx.set('settings', 'platform', defaults);
        for (const b of badges)
          if (!(await tx.get('achievements', b.id))) tx.set('achievements', b.id, b);
        return { ok: true };
      });
    }
    throw new Error('UNKNOWN_ACTION');
  }
  async courseReward(a: Actor, courseId: string) {
    const [ls, progress] = await Promise.all([
        this.db.find('lessons', 'courseId', courseId).then((x) => x.map(withCatalog)),
        this.db.find('progress', 'userId', a.id),
      ]),
      courseLessons = ls.filter((l) => l.courseId === courseId && l.published),
      mine = progress.filter((x) => x.userId === a.id && x.completed);
    if (courseLessons.length && courseLessons.every((l) => mine.some((x) => x.lessonId === l.id)))
      await this.db.transaction((tx) => this.reward(tx, a, 'course', courseId, courseId));
    if (mine.length >= 5)
      await this.db.transaction(async (tx) =>
        tx.set('userAchievements', a.id + '_explorer', {
          id: a.id + '_explorer',
          userId: a.id,
          badgeId: 'explorer',
          at: this.now(),
        }),
      );
  }
  async leaderboard(a: Actor, period: string, subject: string) {
    const [users, events] = await Promise.all([
      this.db.list('users'),
      this.db.list('xpTransactions'),
    ]);
    const time = this.now(),
      local = new Date(time + 18000000),
      midnight =
        Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 18000000,
      start =
        period === 'week'
          ? midnight - ((local.getUTCDay() + 6) % 7) * 86400000
          : period === 'month'
            ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - 18000000
            : 0;
    return users
      .filter(
        (u) =>
          u.role === 'student' &&
          u.learnerType === 'university' &&
          !u.blocked &&
          u.leaderboardVisible !== false &&
          (!a.classId || u.classId === a.classId),
      )
      .map((u) => ({
        id: u.id,
        name: u.name,
        classId: u.classId,
        xp: events
          .filter(
            (e) =>
              e.userId === u.id && e.createdAt >= start && (!subject || e.courseId === subject),
          )
          .reduce((s, e) => s + e.points, 0),
      }))
      .sort((x, y) => y.xp - x.xp)
      .slice(0, 100);
  }
}
