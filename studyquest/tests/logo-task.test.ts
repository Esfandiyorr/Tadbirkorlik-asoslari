import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { BUSINESSES, LOGO_MAX_TRIES, briefOf, pickBrief } from '../lib/logo-task';
import { parseYouTube } from '../lib/youtube';
import {
  logoTaskFor,
  logoTaskList,
  manageLogoTask,
  retryLogo,
  submitLogo,
} from '../lib/server/logo-task';
import { toLogoAi } from '../lib/server/logo-ai';
import { allVideos, manageVideos, topicVideos } from '../lib/server/videos';
import { resetSiteMemory, siteUpdate } from '../lib/server/site-content';

/* 🎨 8-mavzu logotip topshirig'i (har talabaga alohida biznes, sun'iy intellekt bahosi, o'qituvchi bahosi) va
   📺 mavzu videolari (YouTube havolalari). Demo rejimida — xotirada va tarmoqsiz «sinov baholovchisi» bilan. */
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
  expect(first).toMatchObject({ status: 'new', left: LOGO_MAX_TRIES, open: true, aiReady: true });
  expect(first.brief.name).toBeTruthy();
  expect((await logoTaskFor(student('legacy_a'))).task.brief.code).toBe(first.brief.code);
  expect((await logoTaskFor(student('legacy_b'))).task.brief.k).not.toBe(first.brief.k);
});

it('grades a submitted logo, limits attempts and lets the teacher decide', async () => {
  const s = student('legacy_c');
  await expect(submitLogo(s, png, 'qisqa', 'uz')).rejects.toMatchObject({ status: 400 });
  await expect(submitLogo(s, Buffer.from('not an image at all'), desc, 'uz')).rejects.toMatchObject(
    { status: 400 },
  );
  const one = (await submitLogo(s, png, desc, 'uz')).task;
  expect(one.status).toBe('graded');
  expect(one.ai!.score).toBeGreaterThan(0);
  expect(one.ai!.score).toBeLessThanOrEqual(10);
  expect(one.img).toMatch(/^\/api\/site\/img\/lg-[0-9a-f]{16}\?v=/);
  expect(one).toMatchObject({ left: LOGO_MAX_TRIES - 1, best: one.ai!.score, desc });
  await submitLogo(s, png, desc, 'uz');
  await submitLogo(s, png, desc + ' Nike', 'uz');
  const third = (await logoTaskFor(s)).task;
  expect(third.ai).toMatchObject({ score: 0, copied: 'Nike' });
  expect(third.best).toBe(one.ai!.score);
  expect(third.left).toBe(0);
  await expect(submitLogo(s, png, desc, 'uz')).rejects.toMatchObject({ status: 429 });
  await expect(retryLogo(s)).rejects.toMatchObject({ status: 409 });

  // talaba o'qituvchi amallarini bajara olmaydi
  await expect(manageLogoTask(s, { op: 'extra', uid: 'legacy_c' })).rejects.toMatchObject({
    status: 403,
  });
  // o'qituvchi: qo'shimcha urinish va yakuniy baho
  await manageLogoTask(teacher, { op: 'extra', uid: 'legacy_c' });
  expect((await logoTaskFor(s)).task.left).toBe(1);
  const list = await manageLogoTask(teacher, {
    op: 'grade',
    uid: 'legacy_c',
    score: 9,
    note: 'Zo‘r g‘oya',
  });
  expect(list.rows.find((r) => r.uid === 'legacy_c')).toMatchObject({
    name: 'Talaba legacy_c',
    group: 'AP-223',
    extra: 1,
    final: { score: 9, by: 'Ustoz', note: 'Zo‘r g‘oya' },
  });
  expect((await logoTaskFor(s)).task.final?.score).toBe(9);
  await expect(
    manageLogoTask(teacher, { op: 'grade', uid: 'legacy_c', score: 11 }),
  ).rejects.toThrow();
  await manageLogoTask(teacher, { op: 'clearGrade', uid: 'legacy_c' });
  expect((await logoTaskFor(s)).task.final).toBeUndefined();
  await expect(logoTaskList(s)).rejects.toMatchObject({ status: 403 });
});

it('only the administrator closes submissions', async () => {
  await expect(manageLogoTask(teacher, { op: 'settings', open: false })).rejects.toMatchObject({
    status: 403,
  });
  await manageLogoTask(admin, { op: 'settings', open: false });
  const s = student('legacy_d');
  expect((await logoTaskFor(s)).task.open).toBe(false);
  await expect(submitLogo(s, png, desc, 'uz')).rejects.toMatchObject({ status: 403 });
  await manageLogoTask(admin, { op: 'settings', open: true });
  expect((await submitLogo(s, png, desc, 'uz')).task.status).toBe('graded');
});

it('keeps AI marks inside the rubric and zeroes non-logos', () => {
  const base = {
    is_logo: true,
    copied_brand: null,
    scores: { fit: 7, simplicity: -2, legibility: 1.6, color: 1, description: 2 },
    summary: 'Yaxshi',
    strengths: ['a', 'b', 'c', 'd'],
    improvements: ['x'],
  };
  const ai = toLogoAi(base, 'm', 1);
  expect(ai.parts).toEqual({ fit: 3, simple: 0, legible: 2, color: 1, desc: 2 });
  expect(ai.score).toBe(8);
  expect(ai.good).toHaveLength(3);
  const none = toLogoAi({ ...base, is_logo: false }, 'm', 1);
  expect(none).toMatchObject({ score: 0, notLogo: true });
  expect(toLogoAi({ ...base, copied_brand: 'Apple' }, 'm', 1)).toMatchObject({
    score: 0,
    copied: 'Apple',
  });
});

it('work left «pending» by a timed-out grading can be graded again without losing an attempt', async () => {
  const s = student('legacy_e');
  const t = Date.now();
  await submitLogo(s, png, desc, 'uz', t);
  // Funksiya baholash paytida to'xtab qolgandek: holat «pending», qulf eskirgan.
  await siteUpdate({
    'logoTask/s/legacy_e/status': 'pending',
    'logoTask/s/legacy_e/lock': t - 120_000,
  });
  const stuck = (await logoTaskFor(s)).task;
  expect(stuck.status).toBe('failed');
  expect(stuck.error).toMatch(/Qayta baholash/);
  expect(stuck.desc).toBe(desc);
  const again = (await retryLogo(s)).task;
  expect(again.status).toBe('graded');
  expect(again.tries).toHaveLength(2);
});
