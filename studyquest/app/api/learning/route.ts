import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { repository } from '@/lib/server/repository';
import { LearningNotes, noteInput } from '@/lib/server/learning-notes';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: NextRequest) {
  try {
    const a = await actor(req, true),
      id = req.nextUrl.searchParams.get('lesson') || '';
    check(/^[A-Za-z0-9_-]{1,100}$/.test(id), 400, 'Dars noto‘g‘ri.');
    return NextResponse.json(await new LearningNotes(await repository()).get(a, id), { headers });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const a = await actor(req, true),
      text = await req.text();
    check(text.length <= 20000, 413, 'Qayd juda uzun.');
    const input = noteInput.parse(JSON.parse(text));
    return NextResponse.json(await new LearningNotes(await repository()).save(a, input), {
      headers,
    });
  } catch (e) {
    return failure(e);
  }
}
