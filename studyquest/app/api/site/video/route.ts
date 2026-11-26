import { NextRequest, NextResponse } from 'next/server';
import { topicVideos, videoTopics } from '@/lib/server/videos';
import { actor, staff } from '@/lib/server/auth';
import { MAIN_COURSE, requireCourse, requirePaidCourse } from '@/lib/server/course-access';
import { failure } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 📺 Dars videosi: ochiq kurs uchun qisqa kesh; pullik/yopiq kurs uchun ruxsat va private, no-store. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t') || '';
  const topic = videoTopics().find((x) => x.id === t);
  const main = topic?.courseId === MAIN_COURSE;
  try {
    if (topic && (main || topic.paid || topic.closed)) {
      const a = await actor(req, true);
      if (main) await requireCourse(a);
      if (topic.closed) staff(a);
      if (topic.paid) await requirePaidCourse(a, topic.courseId);
    }
    const videos = await topicVideos(t).catch(() => []);
    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control':
            main || topic?.paid || topic?.closed
              ? 'private, no-store'
              : 'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
        },
      },
    );
  } catch (e) {
    const response = failure(e);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
}
