import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { premiumReceipt, premiumView, subscribe } from '@/lib/server/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 💎 Obuna (lib/server/premium.ts).
   GET                  — mening obunam: holat, karta va narxlar, oxirgi to'lovim
   GET ?receipt=<uid>/<id> — chek rasmi (faqat administrator)
   POST {op:'subscribe', plan, paidAt?, receipt?} — o'zi obuna bo'lish: obuna darhol ochiladi */
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(req: NextRequest) {
  try {
    const receipt = req.nextUrl.searchParams.get('receipt');
    if (receipt) {
      const [uid, id] = receipt.split('/');
      const r = await premiumReceipt(await actor(req, true), uid || '', id || '');
      return new NextResponse(new Uint8Array(r.bytes), {
        headers: { ...headers, 'Content-Type': r.type, 'X-Content-Type-Options': 'nosniff' },
      });
    }
    return NextResponse.json(await premiumView(await actor(req, true)), { headers });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const text = await req.text();
    check(text.length < 1_700_000, 413, 'Chek rasmi 1 MB dan oshmasin.');
    const { op, ...rest } = JSON.parse(text || '{}') as { op?: string };
    check(op === 'subscribe', 400, 'So‘rov noto‘g‘ri.');
    return NextResponse.json(await subscribe(await actor(req, true), rest), { headers });
  } catch (e) {
    return failure(e);
  }
}
