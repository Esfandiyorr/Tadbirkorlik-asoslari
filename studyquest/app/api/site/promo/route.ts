import { NextRequest, NextResponse } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE } from '@/lib/server/site-content';
import { promoImage } from '@/lib/server/promo';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 🛍 Administrator: 2-e'lon oynasidagi e'longa rasm qo'shadi (id — e'lon). Rasm brauzerda kichraytirilib keladi;
   serverda turi baytlaridan tekshiriladi. */
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
      id = String(form.get('id') || '').slice(0, 64);
    check(
      file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
      400,
      '3 MB gacha rasm tanlang.',
    );
    return NextResponse.json(
      await promoImage(a, id, Buffer.from(await (file as File).arrayBuffer())),
    );
  } catch (e) {
    return failure(e);
  }
}
