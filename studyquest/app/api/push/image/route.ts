import { NextRequest, NextResponse } from 'next/server';
import { actor, administrator, check, sameOrigin } from '@/lib/server/auth';
import { MAX_IMAGE } from '@/lib/server/site-content';
import { pushImage } from '@/lib/server/push';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';

/* 🔔 Administrator: «Bildirishnomalar → Xabar yuborish» dagi rasm. Rasm brauzerda kichraytirilib keladi; serverda turi
   baytlaridan tekshiriladi. Javobda manzil — xabar shu manzil bilan yuboriladi. */
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
    const file = (await req.formData()).get('file');
    check(
      file instanceof File && file.size > 0 && file.size <= MAX_IMAGE,
      400,
      '3 MB gacha rasm tanlang.',
    );
    return NextResponse.json(await pushImage(a, Buffer.from(await (file as File).arrayBuffer())), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
