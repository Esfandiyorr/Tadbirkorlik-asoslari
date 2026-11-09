import { NextRequest, NextResponse } from 'next/server';
import { lectureChunk } from '@/lib/server/lectures';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 📄 Ma'ruza faylining bitta bo'lagi (≤ 2,5 MB). Fayl o'zgarmaydi (yangisi yangi id bilan yuklanadi) — CDN va
   brauzer uzoq saqlaydi. Brauzer bo'laklarni ketma-ket olib, bitta faylga yig'adi. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
) {
  const { id, n } = await params;
  const bytes = /^\d{1,2}$/.test(n) ? await lectureChunk(id, Number(n)).catch(() => null) : null;
  if (!bytes)
    return new NextResponse('Topilmadi', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
