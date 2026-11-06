import { failure } from '@/lib/server/http';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, check, sameOrigin, staff, administrator } from '@/lib/server/auth';
import { repository, demo, configured, legacyDb } from '@/lib/server/repository';
import { legacyAccess, lessonAccessStates } from '@/lib/server/legacy-access';
import { demoTopicAccess, setTopicMode, topicAccessList } from '@/lib/server/topic-access';
import { Platform } from '@/lib/server/platform';
import { Academic, academicRecord } from '@/lib/server/academic';
import {
  avatarAdminView,
  avatarView,
  manageAvatars,
  pickAvatar,
  readAvatars,
} from '@/lib/server/avatars';
import { course, modules, lessons, quiz, settings, badges, catalog } from '@/lib/seed';
import { quotaExceeded } from '@/lib/server/quota';
import { limitedCatalog } from '@/lib/server/limited';
import { sitePolicy, clearPolicyCache, normalizePolicy } from '@/lib/server/site-policy';
import {
  resetStudentPassword,
  changeStudentPassword,
  initializeStudentPasswords,
  deleteStudent,
} from '@/lib/server/student-password';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
async function deletedStudentIds() {
  if (demo()) return new Set<string>();
  const records = (await legacyDb().ref('meta/deletedStudentIds').get()).val() || {};
  return new Set(
    Object.keys(records)
      .filter((id) => records[id] === true)
      .map((id) => 'legacy_' + id),
  );
}
function demoToday(id: string, total: number) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return total > 0 && h % 3 ? Math.min(total, (h % 26) + 4) : 0;
}
/* Faqat mahalliy demo: talaba ekranlarini ko'rib chiqish uchun namunaviy akademik tarix (jonli bazaga tegmaydi). */
function demoAcademic(user: { id: string }) {
  const now = Date.now();
  const sample = {
    name: 'Madina',
    surname: 'Ergasheva',
    group: 'AP-223',
    status: 'ok',
    total: 186.5,
    topics: {
      m1: { p: 100, s: 18, t: 3900, q: 15, b: 5 },
      m2: { p: 74.2, s: 20, t: 2400, q: 9, b: 3 },
      m3: { p: 12.3, s: 5, t: 600, q: 0, b: 1 },
    },
  };
  const record = academicRecord(user.id.replace(/^legacy_/, ''), sample);
  const access = lessonAccessStates(
    // namunaviy guruh ochilishi (bir daqiqa oldin) + demo o'qituvchi «Mavzular holati»da tanlaganlari
    { m3: { lim: true, g: { 'AP-223': now - 60000 }, s: {}, at: 0 }, ...demoTopicAccess() },
    { id: user.id, group: 'AP-223', independent: false },
    now,
  );
  return {
    user: {
      ...user,
      ...record,
      id: user.id,
      name: (user as { name?: string }).name || record.name,
    },
    lessonAccess: access,
  };
}
/** Umumiy reyting (barcha guruhlar): demo — namunaviy foydalanuvchilar, aks holda asl bazadagi talabalar. */
async function academicBoard() {
  if (demo())
    return (await (await repository()).list('users'))
      .filter((u) => u.role === 'student' && u.learnerType === 'university' && !u.blocked)
      .map((u) => ({
        id: u.id,
        name: u.name,
        classId: u.classId,
        academicPoints: u.academicPoints || 0,
        // Faqat demo: kunlik reyting bo'sh ko'rinmasligi uchun barqaror namunaviy kunlik ball.
        today: demoToday(u.id, u.academicPoints || 0),
      }))
      .sort((a, b) => b.academicPoints - a.academicPoints || a.name.localeCompare(b.name));
  return new Academic(await repository()).publicBoard();
}
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('view') === 'topicAccess') {
      const a = await actor(req, true);
      staff(a);
      return NextResponse.json(await topicAccessList(), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    if (req.nextUrl.searchParams.get('view') === 'siteSettings') {
      const a = await actor(req, true);
      administrator(a);
      return NextResponse.json(
        normalizePolicy(demo() ? null : (await legacyDb().ref('meta/platformPolicy').get()).val()),
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    if (req.nextUrl.searchParams.get('view') === 'loginDesign') {
      // O'qituvchi «Dizayn kutubxonasi»da tanlagan kirish oynasi (meta/design). Tanlanmagan bo'lsa — raketa.
      const saved = demo()
        ? null
        : ((
            await legacyDb()
              .ref('meta/design/login')
              .get()
              .catch(() => null)
          )?.val() as unknown);
      return NextResponse.json(
        { login: saved === 'workspace' ? 'workspace' : 'rocket' },
        { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
      );
    }
    if (req.nextUrl.searchParams.get('view') === 'academic') {
      const a = await actor(req, true);
      if ((await sitePolicy()).maintenance) administrator(a);
      const [board, avatars] = await Promise.all([academicBoard(), readAvatars()]);
      // Reyting qatorlarida amaldagi avatar; talabaga — o'rni va avatar tanlash huquqi.
      return NextResponse.json(
        avatarView(board, avatars, a.role === 'student' ? a.id : undefined),
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (req.nextUrl.searchParams.get('view') === 'avatarAdmin') {
      const a = await actor(req, true);
      administrator(a);
      const [board, avatars] = await Promise.all([academicBoard(), readAvatars()]);
      return NextResponse.json(avatarAdminView(board, avatars), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    // Existing presentations retain the original RTDB group/access checks and
    // remain available without a Firestore profile or an XP write.
    if (req.nextUrl.searchParams.get('view') === 'legacyLesson') {
      const a = await actor(req, true);
      const lesson = lessons.find((l) => l.id === req.nextUrl.searchParams.get('lesson'));
      check(lesson?.legacyFile, 404, 'Asl dars topilmadi');
      await legacyAccess(a, lesson!);
      return NextResponse.json(lesson);
    }
    const mode = demo() ? 'demo' : configured() ? 'firebase' : 'legacy';
    if (mode === 'legacy') {
      const { questions, ...q } = quiz;
      void questions;
      return NextResponse.json({
        courses: [course],
        modules,
        lessons,
        quizzes: [q],
        settings,
        badges,
        mode,
      });
    }
    const service = new Platform(await repository()),
      hasSession = req.cookies.has('sq-demo') || !!req.headers.get('authorization');
    if (!hasSession) return NextResponse.json({ ...(await service.publicData()), mode });
    const a = await actor(req);
    if (req.nextUrl.searchParams.get('view') === 'roster') {
      staff(a);
      return NextResponse.json({
        users: demo() ? [] : await new Academic(await repository()).roster(a),
      });
    }
    if (req.nextUrl.searchParams.get('view') === 'leaderboard') {
      const [leaderboard, deleted] = await Promise.all([
        service.leaderboard(
          a,
          req.nextUrl.searchParams.get('period') || 'all',
          req.nextUrl.searchParams.get('course') || '',
        ),
        deletedStudentIds(),
      ]);
      return NextResponse.json({
        leaderboard: leaderboard.filter((user) => !deleted.has(user.id)),
      });
    }
    const state = await service.state(
      a,
      req.nextUrl.searchParams.get('view') === 'staff',
      req.nextUrl.searchParams.get('reports') === '1',
    );
    const staffState = state as typeof state & {
      users?: { id: string }[];
      allProgress?: { userId: string; lessonId?: string }[];
      allAttempts?: { userId: string }[];
    };
    if (staffState.allProgress)
      staffState.allProgress = staffState.allProgress.filter((p) => p.lessonId !== 'm7');
    if (!demo() && staffState.users?.length) {
      const deleted = await deletedStudentIds();
      staffState.users = staffState.users.filter((user) => !deleted.has(user.id));
      if (staffState.allProgress)
        staffState.allProgress = staffState.allProgress.filter((row) => !deleted.has(row.userId));
      if (staffState.allAttempts)
        staffState.allAttempts = staffState.allAttempts.filter((row) => !deleted.has(row.userId));
    }
    if (!demo()) {
      const noticeSnapshot = await legacyDb()
        .ref('meta/announcements')
        .get()
        .catch(() => null);
      const notices = noticeSnapshot?.val() || {};
      state.notifications.push(
        ...Object.values(notices)
          .filter((v: any) => v && v.at)
          .map((v: any) => ({
            id: 'legacy-ann-' + v.at,
            userId: a.id,
            title: String(v.text || v.poll?.q || 'Ustozdan e’lon').slice(0, 15000),
            createdAt: Number(v.at),
            legacy: true,
          })),
      );
    }

    if (!demo() && a.id.startsWith('legacy_')) {
      const record = (
        await legacyDb()
          .ref('students/' + a.id.slice(7))
          .get()
      ).val();
      if (record) {
        Object.assign(state.user, academicRecord(a.id.slice(7), record));
        if (a.role === 'student')
          (state as { lessonAccess?: unknown }).lessonAccess = lessonAccessStates(
            (
              await legacyDb()
                .ref('meta/access')
                .get()
                .catch(() => null)
            )?.val(),
            {
              id: a.id.slice(7),
              group: String(record.group || ''),
              independent: record.learnerType === 'independent',
            },
          );
      }
    }
    if (demo() && a.role === 'student' && state.user)
      Object.assign(state, demoAcademic(state.user as { id: string }));
    return NextResponse.json({
      ...state,
      mode,
      ...(a.role === 'admin'
        ? { legacyMigration: await (await repository()).get('migrations', 'legacy-v1') }
        : {}),
    });
  } catch (e) {
    if (quotaExceeded(e) && !demo() && req.nextUrl.searchParams.get('view') === 'roster') {
      try {
        const a = await actor(req, true);
        staff(a);
        return NextResponse.json({ users: await new Academic(await repository()).roster(a) });
      } catch (authError) {
        return failure(authError);
      }
    }
    if (
      quotaExceeded(e) &&
      !demo() &&
      !['academic', 'roster', 'leaderboard', 'legacyLesson', 'siteSettings'].includes(
        req.nextUrl.searchParams.get('view') || '',
      )
    ) {
      try {
        const a = req.headers.get('authorization') ? await actor(req, true) : undefined;
        const limited = limitedCatalog(a);
        if (a?.id.startsWith('legacy_') && limited.user) {
          const original = (
            await legacyDb()
              .ref('students/' + a.id.slice(7))
              .get()
          ).val();
          if (original) {
            Object.assign(limited.user, academicRecord(a.id.slice(7), original));
            if (a.role === 'student')
              (limited as { lessonAccess?: unknown }).lessonAccess = lessonAccessStates(
                (
                  await legacyDb()
                    .ref('meta/access')
                    .get()
                    .catch(() => null)
                )?.val(),
                {
                  id: a.id.slice(7),
                  group: String(original.group || ''),
                  independent: original.learnerType === 'independent',
                },
              );
          }
        }
        return NextResponse.json(limited, { headers: { 'Cache-Control': 'no-store' } });
      } catch (authError) {
        return failure(authError);
      }
    }
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    check(Number(req.headers.get('content-length') || 0) < 128000, 413, 'So‘rov juda katta');
    const input = await req.text();
    check(input.length < 128000, 413, 'So‘rov juda katta');
    const p = z.object({ action: z.string().max(40), input: z.unknown() }).parse(JSON.parse(input));
    if (p.action === 'siteSettings') {
      const a = await actor(req, true);
      administrator(a);
      check(!demo(), 409, 'Demo sozlamalari jonli bazani o‘zgartirmaydi.');
      const policy = normalizePolicy(
        z
          .object({
            maintenance: z.boolean(),
            publicLeaderboard: z.boolean(),
            allowInitialCode: z.boolean(),
          })
          .strict()
          .parse(p.input),
      );
      await legacyDb().ref('meta/platformPolicy').set(policy);
      clearPolicyCache();
      return NextResponse.json({ ok: true });
    }
    if (p.action === 'avatarPick' || p.action === 'avatarAdmin') {
      const a = await actor(req, true);
      if ((await sitePolicy()).maintenance) administrator(a);
      const board = await academicBoard();
      return NextResponse.json(
        p.action === 'avatarPick'
          ? await pickAvatar(a, board, p.input)
          : await manageAvatars(a, board, p.input),
      );
    }
    if (p.action === 'topicMode') {
      const a = await actor(req, true);
      staff(a);
      return NextResponse.json(await setTopicMode(p.input));
    }
    if (p.action === 'legacyChangePassword') {
      const a = await actor(req, true);
      check(!demo(), 409, 'Demo muhit jonli parollarni o‘zgartirmaydi.');
      return NextResponse.json(await changeStudentPassword(a, p.input));
    }
    if (['initializeStudentPasswords', 'legacyDeleteStudent'].includes(p.action)) {
      const a = await actor(req, true);
      administrator(a);
      check(!demo(), 409, 'Demo muhit jonli hisoblarni o‘zgartirmaydi.');
      return NextResponse.json(
        p.action === 'initializeStudentPasswords'
          ? await initializeStudentPasswords(a)
          : await deleteStudent(a, p.input),
      );
    }
    if (p.action === 'legacyResetPassword') {
      const a = await actor(req, true);
      administrator(a);
      check(!demo(), 409, 'Demo muhit jonli parollarni o‘zgartirmaydi.');
      return NextResponse.json(await resetStudentPassword(a, p.input));
    }
    let a,
      legacyOnly = false;
    try {
      a = await actor(req);
    } catch (error) {
      if (!quotaExceeded(error) || p.action !== 'legacyStudent' || demo()) throw error;
      a = await actor(req, true);
      staff(a);
      legacyOnly = true;
    }
    if (p.action === 'legacyStudent') {
      if (!legacyOnly) await new Platform(await repository()).manage(a, course.id);
      check(!demo(), 409, 'Demo muhit jonli bazani o‘zgartirmaydi.');
      const update = z
        .object({
          id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
          status: z.enum(['ok', 'pending', 'blocked']).optional(),
          group: z.string().trim().max(60).optional(),
          topic: z
            .string()
            .regex(/^m(?:[1-9]|1[0-5])$/)
            .optional(),
          mark: z.number().int().min(0).max(5).optional(),
        })
        .parse(p.input);
      check(
        update.status !== undefined || update.group !== undefined || update.topic !== undefined,
        400,
        'O‘zgarishni kiriting.',
      );
      check(update.topic === undefined || update.mark !== undefined, 400, 'Bahoni kiriting.');
      const result = await legacyDb()
        .ref('students/' + update.id)
        .transaction((value) => {
          if (!value?.name || !value?.status) return;
          if (update.status) value.status = update.status;
          if (update.group !== undefined && value.learnerType !== 'independent')
            value.group = update.group;
          if (update.topic && update.mark !== undefined) {
            const previous = Number(value.manual?.[update.topic] || 0);
            value.manual = { ...value.manual, [update.topic]: update.mark || null };
            value.total = Math.max(
              0,
              Math.round(
                (Number(value.total || 0) + (update.mark - previous) * catalog.manualPts) * 10,
              ) / 10,
            );
          }
          value.updated = Date.now();
          return value;
        });
      check(result.committed, 404, 'Hisob topilmadi.');
      return NextResponse.json({ ok: true });
    }
    if (p.action === 'syncLegacy') {
      administrator(a);
      check(!demo(), 409, 'Demo muhit jonli talabalar bazasiga ulanmaydi.');
      return NextResponse.json(await new Academic(await repository()).sync(a));
    }
    return NextResponse.json(
      await new Platform(await repository(), () => Date.now(), legacyAccess).act(
        a,
        p.action,
        p.input,
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
