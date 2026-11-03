import { NextRequest, NextResponse } from 'next/server';
import {
  accessCookie,
  accessLifetime,
  adminOnly,
  issueAccess,
  ownerUids,
} from '@/lib/server/admin-access';
import { authAdmin, configured } from '@/lib/server/repository';
import { ApiError, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    if (!adminOnly()) return NextResponse.json({ restricted: false });
    check(
      ownerUids().length && configured(),
      503,
      'Administrator kirishi uchun Firebase va STUDYQUEST_ADMIN_UIDS sozlamalarini tekshiring.',
    );
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
    check(token, 401, 'Google administrator hisobingiz bilan kiring.');
    let decoded;
    try {
      decoded = await authAdmin().verifyIdToken(token!, true);
    } catch {
      throw new ApiError(401, 'Seans tugagan. Qayta kiring.');
    }
    check(
      ownerUids().includes(decoded.uid),
      403,
      'Hozir faqat platforma administratori kirishi mumkin.',
    );
    const response = NextResponse.json(
      { restricted: true, allowed: true },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
    response.cookies.set(accessCookie, issueAccess(decoded.uid), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: accessLifetime,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(accessCookie, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
