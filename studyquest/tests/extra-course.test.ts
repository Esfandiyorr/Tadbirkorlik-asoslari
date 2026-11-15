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

it('describes the restaurant course as a closed extra course with its lessons, blocks and video', () => {
  const restoran = extraCourses.find((c) => c.id === 'restoran')!;
  expect(restoran).toMatchObject({
    title: 'Restoran xodimlari malakasini oshirish',
    closed: true,
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

it('shows the closed course only to the teacher and the administrator', async () => {
  expect(seesCourse(extraCourses[0], 'student')).toBe(false);
  expect(seesCourse(extraCourses[0], undefined)).toBe(false);
  expect(seesCourse(extraCourses[0], 'teacher')).toBe(true);
  expect(seesCourse(extraCourses[0], 'admin')).toBe(true);

  const base = { courses: [course], modules, lessons };
  expect(ids(withExtraCourses(base, 'student').courses)).toEqual([course.id]);
  expect(ids(withExtraCourses(base).lessons)).not.toContain('r1');
  const staffView = withExtraCourses(base, 'teacher');
  expect(ids(staffView.courses)).toEqual([course.id, 'restoran']);
  expect(ids(staffView.lessons)).toContain('r1');
  // ikki marta qo'shilmaydi
  expect(ids(withExtraCourses(staffView, 'admin').courses)).toEqual([course.id, 'restoran']);

  // mehmon va talaba: fan ham, mavzulari ham yo'q
  expect(ids((await service.publicData()).courses)).toEqual([course.id]);
  const forStudent = await service.state(student);
  expect(ids(forStudent.courses)).toEqual([course.id]);
  expect(ids(forStudent.lessons as { id?: string }[]).some((id) => /^r\d/.test(String(id)))).toBe(
    false,
  );
  // o'qituvchi va administrator: oddiy ko'rinishda ham, xodimlar ko'rinishida ham bor
  for (const a of [teacher, admin]) {
    expect(ids((await service.state(a)).courses)).toContain('restoran');
    const staff = await service.state(a, true, false);
    expect(ids(staff.courses)).toContain('restoran');
    expect(ids(staff.lessons as { id?: string }[])).toContain('r1');
    expect(ids(staff.modules)).toContain('restoran-1');
  }
  // baza vaqtincha ishlamaganda beriladigan qisqa katalog ham shu qoidaga bo'ysunadi
  expect(ids(limitedCatalog(student).courses)).toEqual([course.id]);
  expect(ids(limitedCatalog().lessons)).not.toContain('r1');
  expect(ids(limitedCatalog(teacher).lessons)).toContain('r1');
});

it('enrolling in the catalog course is a no-op for staff and refused for students', async () => {
  // eski sahifa (keshdagi) yoki qidiruv «enroll» yuborsa ham, administrator va o'qituvchi darsni ochadi
  for (const a of [teacher, admin])
    await expect(service.act(a, 'enroll', { courseId: 'restoran' })).resolves.toEqual({ ok: true });
  await expect(service.act(student, 'enroll', { courseId: 'restoran' })).rejects.toMatchObject({
    status: 403,
  });
  // boshqa foydalanuvchini yopiq fanga yozib bo'lmaydi
  await expect(
    service.act(teacher, 'enroll', { courseId: 'restoran', userId: student.id }),
  ).rejects.toMatchObject({ status: 403 });
});
