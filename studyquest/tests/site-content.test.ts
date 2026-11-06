import { beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Actor } from '../lib/types';
import {
  cleanHtml,
  manageTopicQuiz,
  resetSiteMemory,
  topicQuiz,
  topicQuizList,
} from '../lib/server/site-content';
import { GET as quizScript } from '../app/api/site/quiz/route';

/* 🛠 Sayt boshqaruvi → 📝 Mavzu testlari: faqat administrator, savollar soni o'zgarmaydi, xavfli HTML o'tmaydi,
   taqdimot /api/site/quiz skriptidan administrator saqlagan savollarni oladi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const admin = { id: 'owner', role: 'admin', name: 'Administrator' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const original = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/legacy/quiz/m6.json'), 'utf8'),
).questions as { q: string; a?: string[]; c?: number; o?: string[]; e?: string }[];
const script = async (t: string) =>
  (await quizScript(new NextRequest('http://localhost/api/site/quiz?t=' + t))).text();

it('extracts the original questions from the presentation at build time', () => {
  expect(original).toHaveLength(20);
  expect(original.filter((x) => x.o)).toHaveLength(6);
  expect(original[0]).toMatchObject({ c: 0 });
  expect(original[0].a).toHaveLength(4);
  const html = fs.readFileSync(path.join(__dirname, '../public/legacy/mavzu-6.html'), 'utf8');
  expect(html).toContain('<script src="/api/site/quiz?t=m6"></script>');
  expect(html).toContain('\nvar Q=window.SQ_Q||[');
  expect(html).toContain('\nvar QEN=window.SQ_Q?null:[');
  expect(html).toContain('(window.SQ_QV?"_v"+window.SQ_QV:"")');
  // Skript inline test kodidan oldin yuklanadi.
  expect(html.indexOf('/api/site/quiz?t=m6')).toBeLessThan(html.indexOf('var Q=window.SQ_Q'));
});

it('lets only the administrator save a topic test with the same number of questions', async () => {
  const edited = original.map((x) => ({ ...x }));
  edited[0] = { ...edited[0], q: 'Yangi savol: kafe egasi qaysi blokni tekshiryapti?', c: 2 };
  await expect(
    manageTopicQuiz(teacher, { op: 'save', t: 'm6', questions: edited }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    manageTopicQuiz(admin, { op: 'save', t: 'm6', questions: edited.slice(1) }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    manageTopicQuiz(admin, { op: 'save', t: 'm4', questions: edited }),
  ).rejects.toMatchObject({ status: 404 }); // 4-mavzuda test o'rniga krossvord
  expect(await script('m6')).toBe('/* asl savollar */');

  const now = Date.UTC(2026, 10, 6, 12);
  const saved = await manageTopicQuiz(admin, { op: 'save', t: 'm6', questions: edited }, now);
  expect(saved.changed).toMatchObject({ at: now, by: 'Administrator' });
  expect((await topicQuiz('m6'))!.q[0]).toMatchObject({ q: edited[0].q, c: 2 });
  const list = await topicQuizList();
  expect(list.find((t) => t.id === 'm6')).toMatchObject({ count: 20, changed: { at: now } });
  expect(list.find((t) => t.id === 'm4')).toMatchObject({ count: 0, changed: null });

  const js = await script('m6');
  expect(js).toMatch(/^window\.SQ_Q=\[/);
  expect(js).toContain(JSON.stringify(edited[0].q));
  expect(js).toContain('window.SQ_QV="' + now.toString(36) + '"');
  expect(await script('m1')).toBe('/* asl savollar */');
  expect(await script('../../etc')).toBe('/* asl savollar */');

  await manageTopicQuiz(admin, { op: 'reset', t: 'm6' });
  expect(await topicQuiz('m6')).toBeNull();
  expect(await script('m6')).toBe('/* asl savollar */');
});

it('keeps simple formatting but turns any other markup into plain text', async () => {
  expect(cleanHtml('Hisoblang <i>(faqat son)</i> va <b>yozing</b><br/>')).toBe(
    'Hisoblang <i>(faqat son)</i> va <b>yozing</b><br/>',
  );
  expect(cleanHtml('<img src=x onerror=alert(1)><script>x</script><b onclick="y">z</b>')).toBe(
    '&lt;img src=x onerror=alert(1)>&lt;script>x&lt;/script>&lt;b onclick="y">z</b>',
  );
  const edited = original.map((x) => ({ ...x }));
  edited[1] = { q: 'Savol <svg onload=alert(1)> matni', a: ['A', 'B', 'C', 'D'], c: 1 };
  edited[2] = { q: 'Ochiq savol matni?', o: ['javob', 'answer'], e: 'Izoh' };
  await manageTopicQuiz(admin, { op: 'save', t: 'm6', questions: edited });
  const q = (await topicQuiz('m6'))!.q;
  expect(q[1].q).toBe('Savol &lt;svg onload=alert(1)> matni');
  expect(q[2]).toEqual({ q: 'Ochiq savol matni?', o: ['javob', 'answer'], e: 'Izoh' });
  // Variantli savolda aynan 4 ta javob bo'lishi kerak (dvigatel shuni kutadi).
  edited[1] = { q: 'Uch javobli savol?', a: ['A', 'B', 'C'], c: 0 };
  await expect(
    manageTopicQuiz(admin, { op: 'save', t: 'm6', questions: edited }),
  ).rejects.toThrow();
});

it('replaces site texts and pictures for everyone, only by the administrator', async () => {
  const { manageSiteText, siteContent, siteContentAdmin, replaceSiteImage, readImage, contentKey } =
    await import('../lib/server/site-content');
  const { GET: content } = await import('../app/api/site/content/route');
  const { GET: image } = await import('../app/api/site/img/[key]/route');
  await expect(
    manageSiteText(teacher, { op: 'set', o: 'Reyting', n: 'Reyting jadvali' }),
  ).rejects.toMatchObject({ status: 403 });
  const now = Date.UTC(2026, 10, 6, 12);
  // Bo'shliqlar bitta qilinadi: sahifadagi yozuv bilan aynan mos kelishi uchun.
  let v = await manageSiteText(admin, { op: 'set', o: '  Reyting \n', n: 'Reyting  jadvali' }, now);
  expect(v.texts).toEqual({ Reyting: 'Reyting jadvali' });
  expect(v.rev).toBe(now);
  await expect(manageSiteText(admin, { op: 'set', o: '15', n: '20' })).rejects.toMatchObject({
    status: 400,
  });
  await expect(manageSiteText(admin, { op: 'set', o: 'Kurslar', n: '   ' })).rejects.toMatchObject({
    status: 400,
  });
  // Ochiq API: hamma ko'radi, CDN qisqa keshlaydi.
  const r = await content();
  expect(r.headers.get('cache-control')).toContain('s-maxage=30');
  expect(await r.json()).toMatchObject({ texts: { Reyting: 'Reyting jadvali' } });

  // Rasm: faqat haqiqiy rasm baytlari, SVG va boshqa fayllar yo'q.
  const png = fs.readFileSync(path.join(__dirname, '../public/icon-192.png'));
  await expect(replaceSiteImage(teacher, '/terdu-logo.png', png)).rejects.toMatchObject({
    status: 403,
  });
  await expect(
    replaceSiteImage(admin, '/terdu-logo.png', Buffer.from('<svg onload=alert(1)>')),
  ).rejects.toMatchObject({ status: 400 });
  await expect(replaceSiteImage(admin, '/api/site/img/x', png)).rejects.toThrow();
  await expect(replaceSiteImage(admin, '/avatars/sonic.webp', png)).rejects.toThrow();
  v = await replaceSiteImage(admin, '/terdu-logo.png', png, now + 1000);
  const key = contentKey('i', '/terdu-logo.png');
  expect(v.images['/terdu-logo.png']).toBe(
    '/api/site/img/' + key + '?v=' + (now + 1000).toString(36),
  );
  expect((await readImage(key))!.bytes.equals(png)).toBe(true);
  const served = await image(new NextRequest('http://localhost/api/site/img/' + key), {
    params: Promise.resolve({ key }),
  });
  expect(served.headers.get('content-type')).toBe('image/png');
  expect(served.headers.get('cache-control')).toContain('immutable');
  expect(Buffer.from(await served.arrayBuffer()).equals(png)).toBe(true);
  const bad = await image(new NextRequest('http://localhost/api/site/img/..%2Fx'), {
    params: Promise.resolve({ key: '../x' }),
  });
  expect(bad.status).toBe(404);

  const list = await siteContentAdmin(admin);
  expect(list.texts[0]).toMatchObject({ o: 'Reyting', n: 'Reyting jadvali', by: 'Administrator' });
  expect(list.images[0]).toMatchObject({ o: '/terdu-logo.png', size: png.length });
  // Asl holiga qaytarish.
  await manageSiteText(admin, { op: 'remove', o: 'Reyting' });
  v = await manageSiteText(admin, { op: 'removeImage', o: '/terdu-logo.png' });
  expect(v).toEqual({ texts: {}, images: {}, rev: 0 });
  expect(await readImage(key)).toBeNull();
  expect((await siteContent()).texts).toEqual({});
});
