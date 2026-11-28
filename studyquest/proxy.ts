import { NextRequest, NextResponse } from 'next/server';
import { accessCookie, maintenanceData, validAccess } from './lib/server/admin-access';
import { sitePolicy } from './lib/server/site-policy';
import {
  lessonAccessCookie,
  lessonAssetTopic,
  validLessonAccess,
} from './lib/server/course-assets';

const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };

function normalizedPath(pathname: string) {
  const path = decodeURIComponent(pathname).replace(/\\/g, '/').replace(/\/+/g, '/');
  return new URL(path, 'https://local.invalid').pathname;
}

export async function proxy(req: NextRequest) {
  let path: string;
  let image = '';
  try {
    path = normalizedPath(req.nextUrl.pathname);
    const url = req.nextUrl.searchParams.get('url');
    if (path === '/_next/image' && url?.startsWith('/')) image = normalizedPath(url);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (path === '/api/admin-access') return NextResponse.next();
  const protectedPath =
    path === '/legacy' ||
    path.startsWith('/legacy/') ||
    path.startsWith('/api/') ||
    image.includes('/legacy/');
  const owner = validAccess(req.cookies.get(accessCookie)?.value);
  if (protectedPath && (await sitePolicy()).maintenance && !owner) {
    if (path === '/api/platform' && req.method === 'GET' && !req.nextUrl.searchParams.has('view'))
      return NextResponse.json(maintenanceData(), { headers: privateHeaders });
    return NextResponse.json(
      {
        error: 'Platforma vaqtincha yopiq. Faqat administrator kirishi mumkin.',
        code: 'ADMIN_ONLY',
      },
      { status: 403, headers: privateHeaders },
    );
  }
  const topic = lessonAssetTopic(path) || lessonAssetTopic(image);
  if (!topic) return NextResponse.next();
  if (!owner && !validLessonAccess(topic, req.cookies.get(lessonAccessCookie(topic))?.value)) {
    // Eski (nusxalangan) dars havolasi brauzerda to'g'ridan-to'g'ri ochilsa — saytdagi o'sha darsga: ruxsati bo'lsa
    // dars ochiladi, bo'lmasa kurs sahifasi ruxsat so'rashni tushuntiradi. Sayt ichidagi oyna (iframe), PDF va video
    // avvalgidek faqat ruxsat bilan.
    const dest = req.headers.get('sec-fetch-dest');
    const page =
      path.endsWith('.html') &&
      (dest === 'document' || (!dest && (req.headers.get('accept') || '').includes('text/html')));
    if (page && req.method === 'GET')
      return NextResponse.redirect(new URL('/#lesson/' + topic, req.url), {
        status: 307,
        headers: privateHeaders,
      });
    return new NextResponse('Darsga ruxsat talab qilinadi.', {
      status: 403,
      headers: privateHeaders,
    });
  }
  return NextResponse.next({ headers: privateHeaders });
}
