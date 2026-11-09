import { NextRequest, NextResponse } from 'next/server';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
import { LECTURE_CHUNK } from '@/lib/lectures';
import { lectureAdmin, manageLectures, saveLectureChunk } from '@/lib/server/lectures';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 📄 Ma'ruzalarni yuklash (faqat administrator).
   GET            — hamma mavzular va ularning fayllari
   POST JSON      — {op: 'begin' | 'finish' | 'remove' | 'rename', ...}
   POST multipart — bitta bo'lak: id, n (tartib raqami), file (≤ 2,5 MB) */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await lectureAdmin(await actor(req)), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const type = req.headers.get('content-type') || '';
    if (type.startsWith('multipart/form-data')) {
      check(
        Number(req.headers.get('content-length') || 0) <= LECTURE_CHUNK + 64000,
        413,
        'Bo‘lak juda katta.',
      );
      const a = await actor(req);
      const form = await req.formData(),
        file = form.get('file');
      check(file instanceof File && file.size <= LECTURE_CHUNK, 400, 'Bo‘lak topilmadi.');
      return NextResponse.json(
        await saveLectureChunk(
          a,
          String(form.get('id') || ''),
          Number(form.get('n')),
          Buffer.from(await (file as File).arrayBuffer()),
        ),
      );
    }
    const body = await req.text();
    check(body.length < 4000, 413, 'So‘rov juda katta.');
    return NextResponse.json(await manageLectures(await actor(req), JSON.parse(body)));
  } catch (e) {
    return failure(e);
  }
}
