import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { repository } from '@/lib/server/repository';
import { AccountHelp } from '@/lib/server/account-help';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: NextRequest) {
  try {
    const help = new AccountHelp(await repository());
    return NextResponse.json(
      req.nextUrl.searchParams.get('view') === 'inbox'
        ? { rows: await help.list(await actor(req, true)) }
        : await help.status(req.nextUrl.searchParams.get('receipt') || ''),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const text = await req.text();
    check(text.length <= 5000, 413, 'So‘rov juda katta.');
    return NextResponse.json(
      await new AccountHelp(await repository()).create(
        JSON.parse(text),
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      ),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    sameOrigin(req);
    const a = await actor(req),
      text = await req.text();
    check(text.length <= 5000, 413, 'So‘rov juda katta.');
    return NextResponse.json(
      await new AccountHelp(await repository()).update(a, JSON.parse(text)),
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
