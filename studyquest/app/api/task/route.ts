import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { MAX_IMAGE } from '@/lib/server/site-content';
import {
  logoTaskFor,
  logoTaskList,
  manageLogoTask,
  retryLogo,
  submitLogo,
} from '@/lib/server/logo-task';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Sun'iy intellekt logotipni 10–30 soniyada baholaydi.
export const maxDuration = 60;

/* 🎨 8-mavzu logotip topshirig'i.
   GET            — talabaning biznesi va holati (birinchi ochganda biznes beriladi)
   GET ?view=list — o'qituvchi: barcha talabalar ishlari
   POST multipart — talaba: rasm (file), ta'rif (desc), til (lang) → sun'iy intellekt bahosi
   POST JSON      — {action: 'retry'} talaba; {action: 'admin', input} o'qituvchi/administrator */
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('view') === 'list')
      return NextResponse.json(await logoTaskList(await actor(req)), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    return NextResponse.json(await logoTaskFor(await actor(req, true)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
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
        Number(req.headers.get('content-length') || 0) <= MAX_IMAGE + 64000,
        413,
        'Rasm 3 MB dan oshmasin.',
      );
      const a = await actor(req, true);
      const form = await req.formData(),
        file = form.get('file');
      check(
        file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
        400,
        '3 MB gacha rasm tanlang.',
      );
      const lang = z.enum(['uz', 'en', 'ru']).catch('uz').parse(form.get('lang'));
      return NextResponse.json(
        await submitLogo(
          a,
          Buffer.from(await (file as File).arrayBuffer()),
          String(form.get('desc') || ''),
          lang,
        ),
      );
    }
    const body = await req.text();
    check(body.length < 4000, 413, 'So‘rov juda katta.');
    const p = z
      .object({ action: z.enum(['retry', 'admin']), input: z.unknown().optional() })
      .strict()
      .parse(JSON.parse(body));
    if (p.action === 'retry') return NextResponse.json(await retryLogo(await actor(req, true)));
    return NextResponse.json(await manageLogoTask(await actor(req), p.input));
  } catch (e) {
    return failure(e);
  }
}
