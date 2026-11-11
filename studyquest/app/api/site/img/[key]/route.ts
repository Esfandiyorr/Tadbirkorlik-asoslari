import { NextRequest, NextResponse } from 'next/server';
import { readImage } from '@/lib/server/site-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Administrator yuklagan rasm. Manzilda versiya (?v=) bor — CDN va brauzer uni bir yil saqlaydi,
   yangi rasm yuklanganda manzil o'zgaradi. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const missing = () =>
    new NextResponse('Topilmadi', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  if (!/^(?:i[0-9a-f]{16}|(?:av|pr|nw|ps)-[a-z0-9-]{2,40}|lg-[0-9a-f]{16})$/.test(key))
    return missing();
  const img = await readImage(key).catch(() => null);
  if (!img) return missing();
  return new NextResponse(new Uint8Array(img.bytes), {
    headers: {
      'Content-Type': img.type,
      'Content-Length': String(img.bytes.length),
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
