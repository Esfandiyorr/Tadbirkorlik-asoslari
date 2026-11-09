import { NextRequest, NextResponse } from 'next/server';
import { topicLectures } from '@/lib/server/lectures';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 📄 Dars sahifasidagi «Ma'ruza» tugmasi uchun: mavzuga yuklangan ma'ruza fayllari (ochiq ro'yxat, qisqa kesh). */
export async function GET(req: NextRequest) {
  const files = await topicLectures(req.nextUrl.searchParams.get('t') || '').catch(() => []);
  return NextResponse.json(
    { files },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' } },
  );
}
