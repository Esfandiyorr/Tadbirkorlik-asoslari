import { NextRequest, NextResponse } from 'next/server';
import { actor } from '@/lib/server/auth';
import { staffActivity } from '@/lib/server/staff-activity';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      { rows: await staffActivity(await actor(req, true)) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
