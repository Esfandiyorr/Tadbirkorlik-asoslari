import { failure } from '@/lib/server/http';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, check, sameOrigin, staff, administrator } from '@/lib/server/auth';
import { repository, demo, configured, legacyDb } from '@/lib/server/repository';
import { legacyAccess } from '@/lib/server/legacy-access';
import { Platform } from '@/lib/server/platform';
import { Academic, academicRecord } from '@/lib/server/academic';
import { course, modules, lessons, quiz, settings, badges, catalog } from '@/lib/seed';
import { quotaExceeded } from '@/lib/server/quota';
import { limitedCatalog } from '@/lib/server/limited';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  try {
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
    if (req.nextUrl.searchParams.get('view') === 'academic')
      return NextResponse.json({
        leaderboard: demo()
          ? (await (await repository()).list('users'))
              .filter((u) => u.role === 'student' && u.learnerType === 'university')
              .map((u) => ({ ...u, academicPoints: u.academicPoints || 0 }))
          : await new Academic(await repository()).board(a),
      });
    if (req.nextUrl.searchParams.get('view') === 'roster') {
      staff(a);
      return NextResponse.json({
        users: demo() ? [] : await new Academic(await repository()).roster(a),
      });
    }
    if (req.nextUrl.searchParams.get('view') === 'leaderboard')
      return NextResponse.json({
        leaderboard: await service.leaderboard(
          a,
          req.nextUrl.searchParams.get('period') || 'all',
          req.nextUrl.searchParams.get('course') || '',
        ),
      });
    const state = await service.state(a, req.nextUrl.searchParams.get('view') === 'staff');
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
      if (record) Object.assign(state.user, academicRecord(a.id.slice(7), record));
    }
    return NextResponse.json({
      ...state,
      mode,
      ...(a.role === 'admin'
        ? { legacyMigration: await (await repository()).get('migrations', 'legacy-v1') }
        : {}),
    });
  } catch (e) {
    if (
      quotaExceeded(e) &&
      !demo() &&
      !['academic', 'roster', 'leaderboard', 'legacyLesson'].includes(
        req.nextUrl.searchParams.get('view') || '',
      )
    ) {
      try {
        const a = req.headers.get('authorization') ? await actor(req, true) : undefined;
        return NextResponse.json(limitedCatalog(a), { headers: { 'Cache-Control': 'no-store' } });
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
    const a = await actor(req),
      input = await req.text();
    check(input.length < 128000, 413, 'So‘rov juda katta');
    const p = z.object({ action: z.string().max(40), input: z.unknown() }).parse(JSON.parse(input));
    if (p.action === 'legacyStudent') {
      await new Platform(await repository()).manage(a, course.id);
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
