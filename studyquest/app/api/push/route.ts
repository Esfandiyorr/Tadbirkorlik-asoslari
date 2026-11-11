import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { actor, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import {
  broadcastPush,
  liveReminder,
  pushStats,
  subscribePush,
  testPush,
  unsubscribePush,
  vapidKeys,
} from '@/lib/server/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 🔔 Bildirishnomalar (lib/server/push.ts).
   GET ?view=key   — ochiq kalit (brauzer obunasi uchun)
   GET ?view=tick  — jonli test eslatmasini tekshirish (ochiq; o'yin boshiga bir marta yuboriladi). GitHub Actions
                     har 5 daqiqada chaqiradi, sayt ochiq bo'lsa e'lonlar so'rovi ham chaqiradi
   GET ?view=stats — o'qituvchi/administrator: nechta qurilma yoqilgan
   POST {op}       — subscribe | unsubscribe | test (o'z qurilmalariga) | send (administrator: hammaga) */
export async function GET(req: NextRequest) {
  try {
    const view = req.nextUrl.searchParams.get('view');
    if (view === 'key')
      return NextResponse.json(
        { pub: (await vapidKeys()).pub },
        { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
      );
    if (view === 'tick') {
      const r = await liveReminder();
      return NextResponse.json(
        { ok: true, sent: r ? r.sent : 0, ...(r ? { game: r.game } : {}) },
        // CDN 1 daqiqa saqlaydi: tez-tez so'ralsa ham bazaga ortiqcha yuk tushmaydi (eslatma oynasi — 15 daqiqa)
        { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60' } },
      );
    }
    if (view === 'stats')
      return NextResponse.json(await pushStats(await actor(req, true)), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    return NextResponse.json({ error: 'Noma’lum so‘rov' }, { status: 404 });
  } catch (e) {
    return failure(e);
  }
}

const body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('subscribe'), sub: z.unknown() }).strict(),
  z.object({ op: z.literal('unsubscribe'), endpoint: z.string().max(1000) }).strict(),
  z.object({ op: z.literal('test') }).strict(),
  z.object({ op: z.literal('send'), input: z.unknown() }).strict(),
]);

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const text = await req.text();
    if (text.length > 8000)
      return NextResponse.json({ error: 'So‘rov juda katta.' }, { status: 413 });
    const p = body.parse(JSON.parse(text || '{}'));
    const a = await actor(req, true);
    const headers = { 'Cache-Control': 'private, no-store' };
    if (p.op === 'subscribe') {
      const r = await subscribePush(a, p.sub);
      // obuna paytida jonli test vaqti kelgan bo'lsa — eslatma kechikmasin
      after(() => liveReminder().catch(() => {}));
      return NextResponse.json(r, { headers });
    }
    if (p.op === 'unsubscribe')
      return NextResponse.json(await unsubscribePush(a, { endpoint: p.endpoint }), { headers });
    if (p.op === 'test') return NextResponse.json(await testPush(a), { headers });
    return NextResponse.json(await broadcastPush(a, p.input), { headers });
  } catch (e) {
    return failure(e);
  }
}
