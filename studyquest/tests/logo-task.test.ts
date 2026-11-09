import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { BUSINESSES, LOGO_MAX_SCORE, briefOf, pickBrief } from '../lib/logo-task';
import { parseYouTube } from '../lib/youtube';
import {
  demoTaskMark,
  logoTaskFor,
  logoTaskList,
  manageLogoTask,
  submitLogo,
} from '../lib/server/logo-task';
import { academicRecord } from '../lib/server/academic';
import { topicPoints } from '../lib/points';
import { allVideos, manageVideos, topicVideos } from '../lib/server/videos';
import { resetSiteMemory } from '../lib/server/site-content';

/* 🎨 8-mavzu logotip topshirig'i (har talabaga alohida biznes, o'qituvchi 0–25 ball qo'yadi — mavzu balining
   logotip qismi) va 📺 mavzu videolari (YouTube havolalari). Demo rejimida — xotirada. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const student = (id: string, classId = 'AP-223') =>
  ({ id, uid: id, role: 'student', name: 'Talaba ' + id, classId }) as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
const desc =
  'Ramz — tandir va undan chiqayotgan bug‘: issiq non va oila iliqligi. Ranglar: to‘q sariq va jigarrang. Shrift qalin va yumaloq, oq-qora rangda ham o‘qiladi, mijozlar uchun sodda.';

it('reads YouTube links in every common form and rejects other sites', () => {
  expect(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
    id: 'dQw4w9WgXcQ',
    s: 0,
  });
  expect(parseYouTube('https://youtu.be/dQw4w9WgXcQ?t=90')).toEqual({ id: 'dQw4w9WgXcQ', s: 90 });
  expect(parseYouTube('youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ id: 'dQw4w9WgXcQ', s: 0 });
  expect(parseYouTube('https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')?.s).toBe(90);
  expect(parseYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ?start=12')?.s).toBe(12);
  expect(parseYouTube('dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ');
  expect(parseYouTube('https://vimeo.com/123456')).toBeNull();
  expect(parseYouTube('https://evil.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  expect(parseYouTube('https://www.youtube.com/watch?v=bad')).toBeNull();
  expect(parseYouTube('javascript:alert(1)')).toBeNull();
});

it('only the administrator adds topic videos; duplicates and bad links are refused', async () => {
  await expect(
    manageVideos(teacher, { op: 'add', t: 'm8', url: 'https://youtu.be/dQw4w9WgXcQ' }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    manageVideos(admin, { op: 'add', t: 'm8', url: 'https://vimeo.com/1' }),
  ).rejects.toMatchObject({
    status: 400,
  });
  const r = await manageVideos(admin, {
    op: 'add',
    t: 'm8',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30',
    title: 'Reklama psixologiyasi',
  });
  const m8 = r.topics.find((x) => x.id === 'm8')!;
  expect(m8.videos).toMatchObject([{ id: 'dQw4w9WgXcQ', s: 30, t: 'Reklama psixologiyasi' }]);
  await expect(
    manageVideos(admin, { op: 'add', t: 'm8', url: 'https://youtu.be/dQw4w9WgXcQ' }),
  ).rejects.toMatchObject({ status: 409 });
  expect(await topicVideos('m8')).toHaveLength(1);
  expect(await topicVideos('../x')).toEqual([]);
  await manageVideos(admin, { op: 'remove', t: 'm8', key: m8.videos[0].key });
  expect((await allVideos()).topics.find((x) => x.id === 'm8')!.videos).toEqual([]);
});

it('gives every student in a group a different business and keeps it', async () => {
  const used: { code: string; group: string }[] = [];
  for (let i = 0; i < BUSINESSES.length; i++)
    used.push({ code: pickBrief(used, 'AP-223'), group: 'AP-223' });
  expect(new Set(used.map((u) => u.code.split(':')[0])).size).toBe(BUSINESSES.length);
  // 400 ta talaba — hammasining topshirig'i har xil
  const many: { code: string; group: string }[] = [];
  for (let i = 0; i < 400; i++) {
    const g = 'G-' + (i % 14);
    many.push({ code: pickBrief(many, g), group: g });
  }
  expect(new Set(many.map((u) => u.code)).size).toBe(400);
  expect(many.every((u) => briefOf(u.code))).toBe(true);

  const first = (await logoTaskFor(student('legacy_a'))).task;
  expect(first).toMatchObject({ status: 'new', canSend: true, open: true });
  expect(first.brief.name).toBeTruthy();
  expect((await logoTaskFor(student('legacy_a'))).task.brief.code).toBe(first.brief.code);
  expect((await logoTaskFor(student('legacy_b'))).task.brief.k).not.toBe(first.brief.k);
});

it('the student sends a logo, the teacher grades it out of 25 and the mark reaches the topic points', async () => {
  const s = student('legacy_c');
  await expect(submitLogo(s, png, 'qisqa')).rejects.toMatchObject({ status: 400 });
  await expect(submitLogo(s, Buffer.from('not an image at all'), desc)).rejects.toMatchObject({
    status: 400,
  });
  // yuborilmagan ishni baholab bo'lmaydi
  await expect(
    manageLogoTask(teacher, { op: 'grade', uid: 'legacy_c', score: 20 }),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    manageLogoTask(teacher, { op: 'grade', uid: 'legacy_zz', score: 20 }),
  ).rejects.toMatchObject({ status: 404 });
  const one = (await submitLogo(s, png, desc)).task;
  expect(one).toMatchObject({ status: 'sent', canSend: true, desc });
  expect(one.img).toMatch(/^\/api\/site\/img\/lg-[0-9a-f]{16}\?v=/);
  // baholanguncha almashtirish mumkin
  expect((await submitLogo(s, png, desc + ' Yangi variant.')).task.desc).toMatch(/Yangi variant/);

  // o'qituvchi ro'yxati: kim nima yukladi
  const list = (await logoTaskList(teacher)).rows;
  expect(list.find((r) => r.uid === 'legacy_c')).toMatchObject({
    name: 'Talaba legacy_c',
    group: 'AP-223',
    status: 'sent',
  });
  await expect(manageLogoTask(s, { op: 'grade', uid: 'legacy_c', score: 9 })).rejects.toMatchObject(
    {
      status: 403,
    },
  );
  await expect(logoTaskList(s)).rejects.toMatchObject({ status: 403 });
  await expect(
    manageLogoTask(teacher, { op: 'grade', uid: 'legacy_c', score: LOGO_MAX_SCORE + 1 }),
  ).rejects.toThrow();

  const graded = await manageLogoTask(teacher, {
    op: 'grade',
    uid: 'legacy_c',
    score: 21,
    note: 'Zo‘r g‘oya',
  });
  expect(graded.rows.find((r) => r.uid === 'legacy_c')).toMatchObject({
    status: 'graded',
    final: { score: 21, by: 'Ustoz', note: 'Zo‘r g‘oya' },
  });
  expect(demoTaskMark('legacy_c')).toBe(21);
  const mine = (await logoTaskFor(s)).task;
  expect(mine).toMatchObject({ status: 'graded', canSend: false, final: { score: 21 } });
  await expect(submitLogo(s, png, desc)).rejects.toMatchObject({ status: 409 });

  // qayta yuborishga ruxsat: yangi variant kelguncha va qayta baholanguncha eski baho turadi
  await manageLogoTask(teacher, { op: 'again', uid: 'legacy_c' });
  expect((await logoTaskFor(s)).task).toMatchObject({ canSend: true, again: true });
  const resent = (await submitLogo(s, png, desc + ' Ikkinchi variant.')).task;
  expect(resent).toMatchObject({
    status: 'sent',
    resent: true,
    final: { score: 21 },
    canSend: false,
  });
  expect(demoTaskMark('legacy_c')).toBe(21);
  await manageLogoTask(teacher, { op: 'grade', uid: 'legacy_c', score: 24 });
  expect((await logoTaskFor(s)).task).toMatchObject({ status: 'graded', final: { score: 24 } });
  expect((await logoTaskFor(s)).task.resent).toBeUndefined();
  expect(demoTaskMark('legacy_c')).toBe(24);

  await manageLogoTask(teacher, { op: 'clearGrade', uid: 'legacy_c' });
  expect((await logoTaskFor(s)).task).toMatchObject({ status: 'sent', canSend: true });
  expect(demoTaskMark('legacy_c')).toBeUndefined();
});

it('only the administrator closes submissions', async () => {
  await expect(manageLogoTask(teacher, { op: 'settings', open: false })).rejects.toMatchObject({
    status: 403,
  });
  await manageLogoTask(admin, { op: 'settings', open: false });
  const s = student('legacy_d');
  expect((await logoTaskFor(s)).task).toMatchObject({ open: false, canSend: false });
  await expect(submitLogo(s, png, desc)).rejects.toMatchObject({ status: 403 });
  await manageLogoTask(admin, { op: 'settings', open: true });
  expect((await submitLogo(s, png, desc)).task.status).toBe('sent');
});

it('topic 8 is worth 100 points: slides 30, time 20, test 25 and the teacher’s logo mark 25', () => {
  const base = { name: 'Ali', surname: 'Valiyev', group: 'AP-223', status: 'ok', total: 0 };
  const sl = Object.fromEntries(Array.from({ length: 24 }, (_, i) => ['slide' + i, 1]));
  const ac = Object.fromEntries(Array.from({ length: 20 }, (_, i) => ['test' + i, 1]));
  // hammasi bajarilgan, logotip hali baholanmagan — 75 ball
  const done = academicRecord('ali', {
    ...base,
    prog: { m8: { sl, ac, tm: { d: 3600 } } },
  }).readingHistory.m8;
  expect(done).toMatchObject({
    testMax: 25,
    taskMax: 25,
    parts: { slides: 30, time: 20, test: 25 },
    score: 75,
  });
  expect(done.parts!.task).toBeUndefined();
  // o'qituvchi 21 ball qo'ydi — 96 ball (dvigatel yozgan eski p e'tiborga olinmaydi)
  const graded = academicRecord('ali', {
    ...base,
    topics: { m8: { p: 75 } },
    prog: { m8: { sl, ac, tm: { d: 3600 } } },
    task: { m8: 21 },
  });
  expect(graded.readingHistory.m8).toMatchObject({ parts: { task: 21 }, score: 96 });
  expect(topicPoints(graded.readingHistory.m8)).toMatchObject({ test: 25, task: 21, total: 96 });
  // faqat logotip bahosi bor — mavzu yozuvi baribir paydo bo'ladi
  const only = academicRecord('ali', { ...base, task: { m8: 30 } });
  expect(only.readingHistory.m8.score).toBe(25);
  expect(only.academicTopics.m8).toMatchObject({ p: 25 });
  // boshqa mavzular o'zgarmaydi: test 50
  expect(academicRecord('ali', { ...base, prog: { m7: { ac } } }).readingHistory.m7).toMatchObject({
    parts: { test: 50 },
  });
  expect(academicRecord('ali', base).readingHistory.m7.taskMax).toBeUndefined();
});
