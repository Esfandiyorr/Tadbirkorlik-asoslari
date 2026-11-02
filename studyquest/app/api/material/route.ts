import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { actor, check } from '@/lib/server/auth';
import { repository, bucket, demo } from '@/lib/server/repository';
import { Platform } from '@/lib/server/platform';
import { failure } from '@/lib/server/http';
export async function GET(req: NextRequest) {
  try {
    const a = await actor(req),
      id = req.nextUrl.searchParams.get('id') || '';
    check(/^[a-zA-Z0-9_-]{1,100}$/.test(id), 400, 'Fayl noto‘g‘ri');
    const db = await repository(),
      file = await db.get('presentations', id);
    check(file, 404, 'Fayl topilmadi');
    await new Platform(db).requireCourse(a, file!.courseId);
    const bytes = demo()
      ? await fs.readFile(path.join(process.cwd(), '.studyquest-demo/uploads', id))
      : (await bucket().file(file!.path).download())[0];
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': file!.type,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file!.name)}`,
        'Cache-Control': 'private,no-store',
      },
    });
  } catch (e) {
    return failure(e);
  }
}
