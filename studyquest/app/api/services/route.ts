import { NextRequest, NextResponse } from 'next/server';
import { ApiError, actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { FILE_CHUNK } from '@/lib/services';
import {
  adminServices,
  manageServices,
  saveServiceChunk,
  servicesAdmin,
  servicesView,
} from '@/lib/server/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 💼 Pullik xizmatlar (lib/server/services.ts).
   GET              — katalog, to'lov yo'riqnomasi va o'z buyurtmalari (kirmagan mehmonga — faqat katalog)
   GET ?admin=1     — administrator: hamma buyurtmalar va sozlamalar
   POST JSON        — {scope: 'me' | 'admin', input: {op, …}}
   POST multipart   — fayl bo'lagi: scope (me | worker | admin), o («<buyurtmachi>/<vazifa>»), fid, n, file (≤ 2,5 MB) */
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('admin'))
      return NextResponse.json(await servicesAdmin(await actor(req)), { headers });
    let a = null;
    try {
      a = await actor(req, true);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
    }
    return NextResponse.json(await servicesView(a), { headers });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const type = req.headers.get('content-type') || '';
    if (type.startsWith('multipart/form-data')) {
      check(
        Number(req.headers.get('content-length') || 0) <= FILE_CHUNK + 64000,
        413,
        'Bo‘lak juda katta.',
      );
      const form = await req.formData(),
        file = form.get('file'),
        scope = form.get('scope'),
        who = scope === 'admin' ? 'admin' : scope === 'worker' ? 'worker' : 'me';
      check(file instanceof File && file.size <= FILE_CHUNK, 400, 'Bo‘lak topilmadi.');
      const a = await actor(req, who !== 'admin');
      return NextResponse.json(
        await saveServiceChunk(
          a,
          who,
          String(form.get('o') || ''),
          String(form.get('fid') || ''),
          Number(form.get('n')),
          Buffer.from(await (file as File).arrayBuffer()),
        ),
        { headers },
      );
    }
    const body = await req.text();
    check(body.length < 8000, 413, 'So‘rov juda katta.');
    const p = JSON.parse(body || '{}') as { scope?: string; input?: unknown };
    if (p.scope === 'admin')
      return NextResponse.json(await adminServices(await actor(req), p.input), { headers });
    return NextResponse.json(await manageServices(await actor(req, true), p.input), { headers });
  } catch (e) {
    return failure(e);
  }
}
