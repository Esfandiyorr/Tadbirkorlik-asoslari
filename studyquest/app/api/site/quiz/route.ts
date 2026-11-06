import { NextRequest } from 'next/server';
import { quizTopics, topicQuiz } from '@/lib/server/site-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Taqdimot (public/legacy/mavzu-N.html) <head> ida bloklovchi skript: administrator «Sayt boshqaruvi → Mavzu testlari»da
   saqlagan savollarni window.SQ_Q ga qo'yadi (SQ_QV — versiya: boshlangan urinish eski savollar bilan aralashmaydi).
   O'zgartirilmagan mavzuda — bo'sh skript, asl savollar ishlaydi. Har qanday xatoda ham asl savollar qoladi. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  let body = '/* asl savollar */';
  if (quizTopics().some((x) => x.id === t && x.count))
    try {
      const saved = await topicQuiz(t);
      if (saved?.q?.length)
        body =
          'window.SQ_Q=' +
          JSON.stringify(saved.q) +
          ';window.SQ_QV=' +
          JSON.stringify(saved.v) +
          ';';
    } catch {}
  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // Talabalar o'zgarishni ~1 daqiqada ko'radi; baza har bir mintaqada daqiqasiga ko'pi bilan bir marta o'qiladi.
      'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
