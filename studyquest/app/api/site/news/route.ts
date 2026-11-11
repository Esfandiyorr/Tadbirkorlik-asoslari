import { NextRequest, NextResponse, after } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE, imageType } from '@/lib/server/site-content';
import { manageNews, newsImage } from '@/lib/server/news';
import { newsPush, wantNewsPush } from '@/lib/server/push';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 📢 Administrator: rasmli e'lon joylash — bitta so'rovda (input — e'lon, file — rasm). Rasm brauzerda kichraytirilib
   keladi; serverda turi baytlaridan tekshiriladi (e'lon yozilishidan oldin, yaroqsiz rasm bo'lsa hech narsa
   yozilmaydi). «Telefonlarga ham yuborilsin» bo'lsa — bildirishnoma rasm bilan ketadi. */
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
    check(
      file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
      400,
      '3 MB gacha rasm tanlang.',
    );
    const bytes = Buffer.from(await (file as File).arrayBuffer());
    check(imageType(bytes), 400, 'Faqat PNG, JPEG, WEBP yoki GIF rasm qabul qilinadi.');
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(String(form.get('input') || '{}'));
    } catch {
      raw = {};
    }
    const { push, ...input } = raw;
    check(input.op === 'add', 400, 'Rasm faqat yangi e’longa qo‘shiladi.');
    const created = await manageNews(a, input);
    check('id' in created && created.id, 500, 'E’lon yozilmadi.');
    const r = await newsImage(a, created.id!, bytes);
    if (await wantNewsPush(push))
      after(() =>
        newsPush(a, String(raw.h || ''), String(raw.t || ''), Date.now(), r.img).catch(() => {}),
      );
    return NextResponse.json(r);
  } catch (e) {
    return failure(e);
  }
}
