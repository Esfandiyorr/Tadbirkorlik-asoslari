import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { makeDeck, readDeck, removeDeck, slidesView } from '@/lib/server/slides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Sun'iy intellekt taqdimotni 1–2 daqiqada tuzishi mumkin
export const maxDuration = 300;

/* 🎞 Taqdimot (lib/server/slides.ts).
   GET            — bo'lim holati: obuna, bepul sinov qoldig'i, saqlangan taqdimotlar ro'yxati
   GET ?id=<id>   — bitta saqlangan taqdimot (slaydlari bilan)
   POST {op:'make', input} — yangi taqdimot tuzish · {op:'remove', id} — saqlanganini o'chirish */
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: NextRequest) {
  try {
    const a = await actor(req, true);
    const id = req.nextUrl.searchParams.get('id');
    return NextResponse.json(id ? await readDeck(a, id) : await slidesView(a), { headers });
  } catch (e) {
    return failure(e);
  }
}

const body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('make'), input: z.unknown() }).strict(),
  z.object({ op: z.literal('remove'), id: z.string().max(60) }).strict(),
]);
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const text = await req.text();
    if (text.length > 4000)
      return NextResponse.json({ error: 'So‘rov juda katta.' }, { status: 413 });
    const p = body.parse(JSON.parse(text || '{}'));
    const a = await actor(req, true);
    return NextResponse.json(
      p.op === 'make' ? await makeDeck(a, p.input) : await removeDeck(a, p.id),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
