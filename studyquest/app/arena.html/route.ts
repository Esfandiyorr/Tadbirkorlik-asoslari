import { NextRequest, NextResponse } from 'next/server';

// Browsers retain the old #/live fragment; the archive entry then opens the canonical platform stage.
export function GET(req: NextRequest) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: '/legacy/arena.html' + req.nextUrl.search },
  });
}
