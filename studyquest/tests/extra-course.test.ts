import { beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MemoryRepository, initialState } from '../lib/server/repository';
import { Platform, withExtraCourses } from '../lib/server/platform';
import { limitedCatalog } from '../lib/server/limited';
import {
  catalog,
  course,
  demoUsers,
  extraCourses,
  extraLessons,
  extraModules,
  lessons,
  modules,
  seesCourse,
} from '../lib/seed';
import { slidePoints } from '../lib/points';
import type { Actor } from '../lib/types';

/* 🍽️ Ikkinchi fan — «Restoran xodimlari malakasini oshirish» (RS 24): katalogdan beriladi, hozircha HAMMAGA YOPIQ —
   talaba va mehmon ma'lumotida umuman bo'lmaydi, faqat o'qituvchi va administrator ko'radi. Asosiy fanning
   (Tadbirkorlik asoslari) 15 mavzusi, ball va reyting hisob-kitobi o'zgarmaydi. */
const [student, teacher, admin] = demoUsers as unknown as Actor[];
let service: Platform;
beforeEach(() => {
  service = new Platform(new MemoryRepository(initialState()), () => Date.UTC(2026, 10, 10, 7));
});
const ids = (rows: { id?: string }[]) => rows.map((r) => r.id);

it('keeps the main course catalog untouched: 15 topics, no restaurant topics in scoring', () => {
  expect(catalog.topics).toHaveLength(15);
  expect(catalog.topics.every((t) => /^m\d{1,2}$/.test(t.id))).toBe(true);
  expect(lessons).toHaveLength(15);
  expect(lessons.every((l) => l.courseId === course.id)).toBe(true);
});

it('describes the restaurant course as a paid extra course with its lessons, blocks and video', () => {
  const restoran = extraCourses.find((c) => c.id === 'restoran')!;
  expect(restoran).toMatchObject({
    title: 'Restoran xodimlari malakasini oshirish',
    paid: true,
    extra: true,
    published: true,
  });
  expect(extraModules.filter((m) => m.courseId === 'restoran').map((m) => m.title)).toEqual([
    'Xizmat asoslari va mehmon bilan muloqot',
    'Menyu bilan ishlash va xalqaro xizmat amaliyoti',
    'Hisob yuritish va smena amaliyoti',
    'Yakuniy imtihonlar',
  ]);
  // to'liq dastur: 10 modul + 2 yakuniy imtihon, har birida o'quv dasturidagi reja
  const all = extraLessons.filter((l) => l.courseId === 'restoran');
  expect(ids(all)).toEqual(Array.from({ length: 12 }, (_, i) => 'r' + (i + 1)));
  expect(all.every((l) => l.plan?.hours && l.plan.about && l.plan.task && l.plan.result)).toBe(
    true,
  );
  expect(all.filter((l) => l.exam).map((l) => l.id)).toEqual(['r11', 'r12']);
  expect(all.find((l) => l.id === 'r11')?.moduleId).toBe('restoran-4');
  // taqdimoti hali yo'q darslar — «tayyorlanmoqda» (faylsiz), ochilmaydi
  for (const l of all.filter((x) => x.draft)) expect(l.legacyFile).toBeUndefined();
  const mine = all.filter((l) => !l.draft);
  expect(mine.length).toBeGreaterThanOrEqual(1);
  expect(mine[0]).toMatchObject({
    id: 'r1',
    title: 'Kasbiy etika va xizmat sikli',
    legacyFile: 'restoran-1.html',
    legacyVideo: 'fayllar/video/R1.mp4',
    moduleId: 'restoran-1',
  });
  // har bir mavzuning taqdimoti, videosi, subtitri va muqovasi omborda bor
  const root = path.resolve(__dirname, '../..');
  for (const l of mine) {
    expect(fs.existsSync(path.join(root, l.legacyFile!)), l.legacyFile).toBe(true);
    // video yig'ilgan darslarda — video, subtitr va muqova omborda bor
    if (!l.legacyVideo) continue;
    const video = l.legacyVideo;
    expect(video).toMatch(/^fayllar\/video\/R\d+\.mp4$/);
    for (const ext of ['.mp4', '.vtt', '.jpg'])
      expect(
        fs.existsSync(path.join(root, video.replace(/\.mp4$/, ext))),
        video.replace(/\.mp4$/, ext),
      ).toBe(true);
    expect(fs.readFileSync(path.join(root, video.replace(/\.mp4$/, '.vtt')), 'utf8')).toMatch(
      /^WEBVTT\n\n1\n00:00:0/,
    );
  }
  // ball qatori: qo'shimcha fan mavzusida ham slayd va test ulushi hisoblanadi
  expect(slidePoints('r1', 'TEST · Bilimni tekshirish', 20)).toMatchObject({
    kind: 'test',
    test: 50,
    slide: 1.5,
  });
});

it('shows the paid course to everyone; a closed course would be staff-only', async () => {
  const restoran = extraCourses.find((c) => c.id === 'restoran')!;
  expect(restoran).toMatchObject({ paid: true });
  expect(restoran.closed).toBeFalsy();
  // 💳 pullik kurs — hammaga ko'rinadi (darslarni ochish — alohida tekshiriladi)
  for (const role of ['student', undefined, 'teacher', 'admin'])
    expect(seesCourse(restoran, role)).toBe(true);
  // 🔒 yopiq kurs bo'lsa — faqat o'qituvchi va administrator
  const closed = { ...restoran, paid: false, closed: true };
  expect(seesCourse(closed, 'student')).toBe(false);
  expect(seesCourse(closed, undefined)).toBe(false);
  expect(seesCourse(closed, 'teacher')).toBe(true);

  const base = { courses: [course], modules, lessons };
  expect(ids(withExtraCourses(base, 'student').courses)).toEqual([course.id, 'restoran']);
  expect(ids(withExtraCourses(base).lessons)).toContain('r1');
  // ikki marta qo'shilmaydi
  const staffView = withExtraCourses(base, 'teacher');
  expect(ids(withExtraCourses(staffView, 'admin').courses)).toEqual([course.id, 'restoran']);

  // mehmon, talaba, o'qituvchi va administrator — hammaning ma'lumotida kurs va mashg'ulotlar ro'yxati bor
  expect(ids((await service.publicData()).courses)).toContain('restoran');
  for (const a of [student, teacher, admin]) {
    const v = await service.state(a);
    expect(ids(v.courses)).toContain('restoran');
    expect(ids(v.lessons as { id?: string }[])).toContain('r1');
  }
  const staff = await service.state(admin, true, false);
  expect(ids(staff.modules)).toContain('restoran-1');
  // baza vaqtincha ishlamaganda beriladigan qisqa katalog ham
  expect(ids(limitedCatalog(student).courses)).toContain('restoran');
  expect(ids(limitedCatalog().lessons)).toContain('r1');
});

it('enrolling in the catalog course is a harmless no-op (lessons are checked separately)', async () => {
  // eski sahifa (keshdagi) yoki qidiruv «enroll» yuborsa ham xato chiqmaydi; darsni ochish — alohida tekshiriladi
  for (const a of [student, teacher, admin])
    await expect(service.act(a, 'enroll', { courseId: 'restoran' })).resolves.toEqual({ ok: true });
  // boshqa foydalanuvchini yopiq fanga yozib bo'lmaydi
  await expect(
    service.act(teacher, 'enroll', { courseId: 'restoran', userId: student.id }),
  ).rejects.toMatchObject({ status: 403 });
});
