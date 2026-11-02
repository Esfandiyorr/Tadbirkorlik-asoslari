import { NextRequest, NextResponse } from 'next/server';
import { demo } from '@/lib/server/repository';
import { demoCookie, sameOrigin } from '@/lib/server/auth';
import { demoUsers } from '@/lib/seed';
export async function POST(req: NextRequest) {
  if (!demo()) return NextResponse.json({ error: 'Demo kirish o‘chirilgan' }, { status: 404 });
  try {
    sameOrigin(req);
    const { id } = await req.json();
    if (!demoUsers.some((x) => x.id === id))
      return NextResponse.json({ error: 'Hisob topilmadi' }, { status: 400 });
    const r = NextResponse.json({ ok: true });
    r.cookies.set('sq-demo', demoCookie(id), {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });
    return r;
  } catch {
    return NextResponse.json({ error: 'Kirish bajarilmadi' }, { status: 400 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req);
    const r = NextResponse.json({ ok: true });
    r.cookies.delete('sq-demo');
    return r;
  } catch {
    return NextResponse.json({ error: 'Ruxsat yo‘q' }, { status: 403 });
  }
}
