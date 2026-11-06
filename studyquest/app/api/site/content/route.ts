import { NextResponse } from 'next/server';
import { siteContent } from '@/lib/server/site-content';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ✏️ Administrator o'zgartirgan matn va rasmlar — ochiq ma'lumot, CDN da qisqa keshlanadi
   (talabalar o'zgarishni ~1 daqiqada ko'radi, baza esa har mintaqada daqiqasiga ko'pi bilan bir marta o'qiladi). */
export async function GET() {
  try {
    return NextResponse.json(await siteContent(), {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=600' },
    });
  } catch (e) {
    return failure(e);
  }
}
