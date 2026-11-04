import { NextRequest, NextResponse } from 'next/server';
import { crmAccess, readCrm, writeCrm } from '@/lib/server/crm';
import { sameOrigin, check } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await readCrm(await crmAccess(req)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const a = await crmAccess(req);
    const body = await req.text();
    check(body.length < 1000, 413, 'So‘rov juda katta.');
    return NextResponse.json(await writeCrm(a, JSON.parse(body)));
  } catch (e) {
    return failure(e);
  }
}
