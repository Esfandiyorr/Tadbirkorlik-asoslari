import { failure } from '@/lib/server/http';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, ApiError, check, sameOrigin } from '@/lib/server/auth';
import { repository, demo, configured } from '@/lib/server/repository';
import { legacyAccess } from '@/lib/server/legacy-access';
import { Platform } from '@/lib/server/platform';
import { course, modules, lessons, quiz, settings, badges } from '@/lib/seed';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
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
    if (req.nextUrl.searchParams.get('view') === 'leaderboard')
      return NextResponse.json({
        leaderboard: await service.leaderboard(
          a,
          req.nextUrl.searchParams.get('period') || 'all',
          req.nextUrl.searchParams.get('course') || '',
        ),
      });
    return NextResponse.json({ ...(await service.state(a)), mode });
  } catch (e) {
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
