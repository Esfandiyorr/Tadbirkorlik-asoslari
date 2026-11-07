import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { supportAct, supportList } from '@/lib/server/support';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Kelgan xabarlar (administrator) uchun to'liq rol tekshiruvi; o'z murojaatlari — yengil (faqat o'qish).
    const inbox = req.nextUrl.searchParams.get('view') === 'inbox';
    const a = await actor(req, !inbox);
    const uid = req.nextUrl.searchParams.get('uid') || undefined;
    return NextResponse.json(await supportList(a, inbox, uid), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = await req.text();
    check(body.length < 6000, 413, 'Xabar juda uzun.');
    const p = z
      .object({ action: z.enum(['send', 'reply', 'read']), input: z.unknown() })
      .strict()
      .parse(JSON.parse(body));
    const a = await actor(req, p.action === 'send');
    return NextResponse.json(await supportAct(a, p.action, p.input));
  } catch (e) {
    return failure(e);
  }
}
