import { NextRequest, NextResponse } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE } from '@/lib/server/site-content';
import { manageLibraryItems } from '@/lib/server/library';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 📚 Administrator: kutubxonaga manba qo'shish — bitta so'rovda (input — manba, file — ixtiyoriy muqova rasmi).
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
      file = form.get('file');
    let input: unknown = {};
    try {
      input = JSON.parse(String(form.get('input') || '{}'));
    } catch {}
    let cover: Buffer | undefined;
    if (file instanceof File && file.size > 0) {
      check(file.size <= MAX_IMAGE, 400, '3 MB gacha rasm tanlang.');
      cover = Buffer.from(await file.arrayBuffer());
    }
    return NextResponse.json(await manageLibraryItems(a, input, cover));
  } catch (e) {
    return failure(e);
  }
}
