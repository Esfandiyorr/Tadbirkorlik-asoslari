import { NextRequest, NextResponse } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE } from '@/lib/server/site-content';
import { uploadAvatar } from '@/lib/server/avatar-library';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 🎭 Administrator: yangi avatar qo'shish (rasm + nom) yoki mavjud avatar rasmini almashtirish (id bilan). */
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
      field = (k: string) => String(form.get(k) || '').slice(0, 200);
    check(
      file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
      400,
      '3 MB gacha rasm tanlang.',
    );
    const catalog = await uploadAvatar(
      a,
      {
        id: field('id') || undefined,
        name: field('name'),
        en: field('en'),
        ru: field('ru'),
        from: field('from'),
      },
      Buffer.from(await (file as File).arrayBuffer()),
    );
    return NextResponse.json({ catalog });
  } catch (e) {
    return failure(e);
  }
}
