import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { requireFeature } from '@/lib/server/student-limits';
import { failure } from '@/lib/server/http';
import { sitePolicy } from '@/lib/server/site-policy';
import { demo, configured } from '@/lib/server/repository';
import { accessCookie, validAccess } from '@/lib/server/admin-access';
import {
  accountPlayer,
  guestPlayer,
  guestCookie,
  guestTokenValid,
  readLive,
  writeLive,
} from '@/lib/server/live-player';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie, Authorization, X-Legacy-Student',
};
async function identity(req: NextRequest, write = false) {
  if (
    req.headers.has('authorization') ||
    req.headers.has('x-legacy-student') ||
    (demo() && req.cookies.has('sq-demo'))
  ) {
    const a = await actor(req, false, { allowPendingLegacy: true });
    // 🎚 «Talabalar bilan ishlash»: guruh yoki talabaga jonli test yopilgan bo'lsa — qatnasha olmaydi
    if (write) await requireFeature(a, 'live');
    return accountPlayer(a);
  }
  return guestPlayer(req.cookies.get(guestCookie)?.value || '');
}
async function publicAccess(req: NextRequest) {
  check(demo() || configured(), 503, 'Jonli test xizmati hali sozlanmagan.');
  check(
    !(await sitePolicy()).maintenance || validAccess(req.cookies.get(accessCookie)?.value),
    403,
    'Platforma vaqtincha yopiq.',
  );
}
function fail(e: unknown) {
  const response = failure(e);
  for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
  return response;
}
export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path') || 'session';
    if (path === 'session') {
      if (
        req.headers.has('authorization') ||
        req.headers.has('x-legacy-student') ||
        (demo() && req.cookies.has('sq-demo'))
      )
        return NextResponse.json({ player: await identity(req), now: Date.now() }, { headers });
      await publicAccess(req);
      const existing = req.cookies.get(guestCookie)?.value;
      const token = guestTokenValid(existing) ? existing : randomBytes(32).toString('base64url');
      const response = NextResponse.json(
        { player: guestPlayer(token), now: Date.now() },
        { headers },
      );
      if (!guestTokenValid(existing))
        response.cookies.set(guestCookie, token, {
          httpOnly: true,
          secure: req.nextUrl.protocol === 'https:',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 86400,
        });
      return response;
    }
    await publicAccess(req);
    return NextResponse.json(
      {
        value: await readLive(
          path,
          Date.now(),
          path.endsWith('/mine') ? await identity(req) : undefined,
        ),
        now: Date.now(),
      },
      { headers },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    await publicAccess(req);
    const text = await req.text();
    check(text.length <= 3000, 413, 'So‘rov juda katta.');
    return NextResponse.json(
      { value: await writeLive(await identity(req, true), JSON.parse(text)), now: Date.now() },
      { headers },
    );
  } catch (e) {
    return fail(e);
  }
}
