import { NextRequest, NextResponse } from 'next/server';
import { actor } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { serviceChunk } from '@/lib/server/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 💼 Buyurtma faylining bitta bo'lagi (≤ 2,5 MB): ?o=<foydalanuvchi>/<buyurtma>&f=<fayl>&n=<tartib>.
   Faqat buyurtma egasi va administratorga. Brauzer bo'laklarni ketma-ket olib, bitta faylga yig'adi. */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const n = q.get('n') || '';
    const { bytes } = await serviceChunk(
      await actor(req, true),
      q.get('o') || '',
      q.get('f') || '',
      /^\d{1,2}$/.test(n) ? Number(n) : -1,
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
