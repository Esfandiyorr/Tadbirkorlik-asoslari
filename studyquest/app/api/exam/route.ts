import { NextRequest, NextResponse } from 'next/server';
import { ApiError, actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { examAct, examAdmin, examAdminAct, examCert, examView } from '@/lib/server/exam';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 🎯 Yakuniy testga tayyorgarlik (lib/server/exam.ts).
   GET              — mavzular, savollar soni va o'z natijalari (mehmonga — faqat sonlar)
   GET ?admin=1     — administrator: hamma savollar
   GET ?cert=<id>   — sertifikatni tekshirish (hamma uchun ochiq)
   POST JSON        — {scope: 'me' | 'admin', input: {op, …}} */
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    if (q.get('cert')) return NextResponse.json(await examCert(q.get('cert')!), { headers });
    if (q.get('admin')) return NextResponse.json(await examAdmin(await actor(req)), { headers });
    let a = null;
    try {
      a = await actor(req, true);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
    }
    return NextResponse.json(await examView(a), { headers });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = await req.text();
    check(body.length < 250_000, 413, 'So‘rov juda katta.');
    const p = JSON.parse(body || '{}') as { scope?: string; input?: unknown };
    if (p.scope === 'admin')
      return NextResponse.json(await examAdminAct(await actor(req), p.input), { headers });
    return NextResponse.json(await examAct(await actor(req, true), p.input), { headers });
  } catch (e) {
    return failure(e);
  }
}
