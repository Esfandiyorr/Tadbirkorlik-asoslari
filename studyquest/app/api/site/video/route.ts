import { NextRequest, NextResponse } from 'next/server';
import { topicVideos } from '@/lib/server/videos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 📺 Dars sahifasidagi «Video» tugmasi uchun: mavzuga qo'yilgan YouTube videolari (ochiq ma'lumot, qisqa kesh). */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  const videos = await topicVideos(t).catch(() => []);
  return NextResponse.json(
    { videos },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' } },
  );
}
