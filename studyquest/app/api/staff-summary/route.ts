import { NextRequest, NextResponse } from 'next/server';
import { actor } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { staffSummary } from '@/lib/server/staff-summary';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await staffSummary(await actor(req, true)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
