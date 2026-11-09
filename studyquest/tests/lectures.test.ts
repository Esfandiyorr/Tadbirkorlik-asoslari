import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { LECTURE_CHUNK, LECTURES_PER_TOPIC, fileSize, lectureExt } from '../lib/lectures';
import {
  lectureAdmin,
  lectureChunk,
  manageLectures,
  saveLectureChunk,
  topicLectures,
} from '../lib/server/lectures';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';

/* 📄 Ma'ruzalar: faqat administrator yuklaydi; fayl 2,5 MB lik bo'laklarda keladi, turi baytlaridan tekshiriladi,
   to'liq yuklanmaguncha talabalarga ko'rinmaydi. Demo rejimida — xotirada. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const pdf = (size: number) => {
  const b = Buffer.alloc(size, 7);
  b.write('%PDF-1.7', 0, 'latin1');
  return b;
};
async function upload(t: string, name: string, bytes: Buffer, title?: string) {
  const begun = await manageLectures(admin, { op: 'begin', t, name, size: bytes.length, title });
  const { id, chunks } = begun as { id: string; chunks: number };
  for (let n = 0; n < chunks; n++)
    await saveLectureChunk(
      admin,
      id,
      n,
      bytes.subarray(n * LECTURE_CHUNK, (n + 1) * LECTURE_CHUNK),
    );
  await manageLectures(admin, { op: 'finish', id });
  return id;
}

it('knows file kinds and sizes', () => {
  expect(lectureExt('8-mavzu.PDF')).toBe('pdf');
  expect(lectureExt('slaydlar.pptx')).toBe('pptx');
  expect(lectureExt('virus.exe')).toBeNull();
  expect(fileSize(3.3 * 1024 * 1024)).toBe('3,3 MB');
  expect(fileSize(2048)).toBe('2 KB');
});

it('only the administrator uploads; type and size are checked', async () => {
  await expect(
    manageLectures(teacher, { op: 'begin', t: 'm8', name: 'a.pdf', size: 10 }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(lectureAdmin(teacher)).rejects.toMatchObject({ status: 403 });
  await expect(
    manageLectures(admin, { op: 'begin', t: 'm8', name: 'virus.exe', size: 10 }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    manageLectures(admin, { op: 'begin', t: 'm8', name: 'katta.pdf', size: 31 * 1024 * 1024 }),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    manageLectures(admin, { op: 'begin', t: 'm99', name: 'a.pdf', size: 10 }),
  ).rejects.toMatchObject({ status: 404 });
  // .pdf deb nomlangan, lekin ichi PDF emas
  const { id } = (await manageLectures(admin, {
    op: 'begin',
    t: 'm8',
    name: 'soxta.pdf',
    size: 20,
  })) as { id: string };
  await expect(saveLectureChunk(admin, id, 0, Buffer.alloc(20, 1))).rejects.toMatchObject({
    status: 400,
  });
});

it('a 6 MB lecture arrives in three parts and students download exactly the same bytes', async () => {
  const bytes = pdf(6 * 1024 * 1024);
  const { id, chunks } = (await manageLectures(admin, {
    op: 'begin',
    t: 'm8',
    name: '8-mavzu ma’ruza.pdf',
    size: bytes.length,
    title: '8-mavzu ma’ruza matni',
  })) as { id: string; chunks: number };
  expect(chunks).toBe(3);
  await saveLectureChunk(admin, id, 0, bytes.subarray(0, LECTURE_CHUNK));
  // noto'g'ri hajmdagi bo'lak va yetishmayotgan bo'laklar bilan tugatib bo'lmaydi
  await expect(saveLectureChunk(admin, id, 1, Buffer.alloc(10))).rejects.toMatchObject({
    status: 400,
  });
  await expect(manageLectures(admin, { op: 'finish', id })).rejects.toMatchObject({ status: 400 });
  // tugallanmagan fayl talabalarga ko'rinmaydi va yuklab olinmaydi
  expect(await topicLectures('m8')).toEqual([]);
  expect(await lectureChunk(id, 0)).toBeNull();
  await saveLectureChunk(admin, id, 1, bytes.subarray(LECTURE_CHUNK, 2 * LECTURE_CHUNK));
  await saveLectureChunk(admin, id, 2, bytes.subarray(2 * LECTURE_CHUNK));
  const done = await manageLectures(admin, { op: 'finish', id });
  expect('topics' in done && done.topics.find((t) => t.id === 'm8')!.files).toHaveLength(1);
  const list = await topicLectures('m8');
  expect(list).toMatchObject([
    { id, title: '8-mavzu ma’ruza matni', ext: 'pdf', size: bytes.length, chunks: 3 },
  ]);
  const back = Buffer.concat(
    await Promise.all([0, 1, 2].map(async (n) => (await lectureChunk(id, n))!)),
  );
  expect(back.equals(bytes)).toBe(true);
  expect(await lectureChunk(id, 3)).toBeNull();
  await expect(
    saveLectureChunk(admin, id, 0, bytes.subarray(0, LECTURE_CHUNK)),
  ).rejects.toMatchObject({ status: 409 });

  await manageLectures(admin, { op: 'rename', id, title: 'Reklama psixologiyasi' });
  expect((await topicLectures('m8'))[0].title).toBe('Reklama psixologiyasi');
  const admins = await lectureAdmin(admin);
  expect(admins.used).toBe(bytes.length);
  await manageLectures(admin, { op: 'remove', id });
  expect(await topicLectures('m8')).toEqual([]);
  expect(await siteGet('lectureData/' + id)).toBeNull();
});

it('limits files per topic and accepts Word and PowerPoint', async () => {
  const docx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(100)]);
  await upload('m3', 'reja.docx', docx);
  const ppt = Buffer.concat([
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    Buffer.alloc(50),
  ]);
  await upload('m3', 'eski.ppt', ppt);
  expect((await topicLectures('m3')).map((f) => f.ext)).toEqual(['docx', 'ppt']);
  for (let i = 2; i < LECTURES_PER_TOPIC; i++) await upload('m3', i + '.pdf', pdf(100));
  await expect(
    manageLectures(admin, { op: 'begin', t: 'm3', name: 'yana.pdf', size: 100 }),
  ).rejects.toMatchObject({ status: 409 });
});
