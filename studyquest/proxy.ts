import { NextRequest, NextResponse } from 'next/server';
import { accessCookie, maintenanceData, validAccess } from './lib/server/admin-access';
import { sitePolicy } from './lib/server/site-policy';
export async function proxy(req: NextRequest) {
  if (!(await sitePolicy()).maintenance) return NextResponse.next();
  let path: string;
  try {
    path = decodeURIComponent(req.nextUrl.pathname).replace(/\\/g, '/').replace(/\/+/g, '/');
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  path = new URL(path, 'https://local.invalid').pathname;
  if (path === '/api/admin-access') return NextResponse.next();
  let image = '';
  if (path === '/_next/image') {
    try {
      image = decodeURIComponent(req.nextUrl.searchParams.get('url') || '');
    } catch {}
  }
  const protectedPath =
    path === '/legacy' ||
    path.startsWith('/legacy/') ||
    path === '/crm' ||
    path.startsWith('/crm/') ||
    path.startsWith('/api/') ||
    image.includes('/legacy/') ||
    image.includes('/crm/');
  if (!protectedPath || validAccess(req.cookies.get(accessCookie)?.value))
    return NextResponse.next();
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };
  if (path === '/api/platform' && req.method === 'GET' && !req.nextUrl.searchParams.has('view'))
    return NextResponse.json(maintenanceData(), { headers });
  return NextResponse.json(
    { error: 'Platforma vaqtincha yopiq. Faqat administrator kirishi mumkin.', code: 'ADMIN_ONLY' },
    { status: 403, headers },
  );
}
