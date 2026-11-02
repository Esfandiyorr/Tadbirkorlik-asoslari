import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { actor, check, sameOrigin } from '@/lib/server/auth';
import { repository, bucket, demo } from '@/lib/server/repository';
import { Platform } from '@/lib/server/platform';
import { failure } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    check(Number(req.headers.get('content-length') || 0) <= 4500000, 413, 'Fayl 4 MB dan oshmasin');
    const a = await actor(req),
      form = await req.formData(),
      file = form.get('file'),
      courseId = String(form.get('courseId') || '');
    check(/^[a-zA-Z0-9_-]{1,100}$/.test(courseId), 400, 'Kursni tanlang');
    check(
      file instanceof File && file.size <= 4194304 && file.size > 0,
      400,
      '4 MB gacha PDF yoki rasm tanlang',
    );
    const f = file as File,
      db = await repository();
    await new Platform(db).manage(a, courseId);
    const bytes = Buffer.from(await f.arrayBuffer());
    const pdf = bytes.subarray(0, 5).toString() === '%PDF-',
      png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    check(pdf || png || jpg, 400, 'Faqat haqiqiy PDF, PNG yoki JPEG qabul qilinadi');
    const type = pdf ? 'application/pdf' : png ? 'image/png' : 'image/jpeg',
      id = randomUUID(),
      storagePath = 'presentations/' + courseId + '/' + id;
    if (demo()) {
      const folder = path.join(process.cwd(), '.studyquest-demo/uploads');
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, id), bytes);
    } else
      await bucket()
        .file(storagePath)
        .save(bytes, {
          resumable: false,
          metadata: { contentType: type, cacheControl: 'private,no-store' },
        });
    await db.transaction(async (tx) =>
      tx.set('presentations', id, {
        id,
        courseId,
        ownerId: a.id,
        name: f.name.replace(/[\r\n]/g, '').slice(0, 180),
        type,
        size: f.size,
        path: storagePath,
        createdAt: Date.now(),
      }),
    );
    return NextResponse.json({ id, name: f.name, type });
  } catch (e) {
    return failure(e);
  }
}
