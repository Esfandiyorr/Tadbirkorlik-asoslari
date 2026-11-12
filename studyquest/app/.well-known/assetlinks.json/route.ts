import { NextResponse } from 'next/server';
import { appInfo, assetLinks } from '@/lib/server/app-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 🔗 Digital Asset Links: Android ilovasi (Play Market) shu saytniki ekanini tasdiqlaydi — shunda ilova saytni
   to'liq ekranda, brauzer manzil satrisiz ochadi. Paket nomi va imzo izi (SHA-256) administrator
   «Sayt boshqaruvi → 📱 Ilova»da kiritadi; kiritilmagan bo'lsa — bo'sh ro'yxat. */
export async function GET() {
  return NextResponse.json(assetLinks(await appInfo()), {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}
