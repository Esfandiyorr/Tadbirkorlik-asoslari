import { NextRequest, NextResponse } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE, replaceSiteImage } from '@/lib/server/site-content';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 🖼 Administrator saytdagi rasmni almashtiradi (o — asl rasm yo'li, masalan /terdu-logo.png).
   Rasm brauzerda kichraytirilib keladi; serverda turi baytlaridan tekshiriladi. */
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    check(
      Number(req.headers.get('content-length') || 0) <= MAX_IMAGE + 64000,
      413,
      'Rasm 3 MB dan oshmasin.',
    );
    const a = await actor(req, true);
    administrator(a);
    const form = await req.formData(),
      file = form.get('file'),
      o = String(form.get('o') || '');
    check(
      file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
      400,
      '3 MB gacha rasm tanlang.',
    );
    return NextResponse.json(
      await replaceSiteImage(a, o, Buffer.from(await (file as File).arrayBuffer())),
    );
  } catch (e) {
    return failure(e);
  }
}
