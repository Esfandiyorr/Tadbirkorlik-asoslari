import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { requireFeature } from '@/lib/server/student-limits';
import { HOST_OPS, raceAct, raceView } from '@/lib/server/race';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 🏁 Jamoaviy poyga (lib/server/race.ts, sahifa — /poyga).
   GET ?pid=…  — o'yin holati (o'yinchiga — navbatdagi savoli bilan). Kirish shart emas: talabalar havola bilan o'ynaydi.
   POST JSON   — {op: 'join' | 'answer', …} — har kim; {op: 'new' | 'start' | 'stop'} — o'qituvchi/administrator. */
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  try {
    const pid = req.nextUrl.searchParams.get('pid');
    return NextResponse.json(await raceView(pid && /^[0-9a-f]{16}$/.test(pid) ? pid : null), {
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const text = await req.text();
    check(text.length < 2000, 413, 'So‘rov juda katta.');
    let body: { op?: unknown };
    try {
      body = JSON.parse(text || '{}');
    } catch {
      body = {};
    }
    // har bir javobda hisobni tekshirmaslik uchun: faqat boshqaruv amallarida kim ekanini aniqlaymiz
    const a = HOST_OPS.includes(String(body?.op)) ? await actor(req) : null;
    // 🎚 kirgan talabaga jonli o'yinlar yopilgan bo'lsa — poygaga qo'shilmaydi
    if (body?.op === 'join' && req.headers.has('authorization'))
      await requireFeature(await actor(req, true), 'live');
    return NextResponse.json(await raceAct(a, body), { headers });
  } catch (e) {
    return failure(e);
  }
}
