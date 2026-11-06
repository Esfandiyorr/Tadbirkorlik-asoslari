import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { demo, legacyDb } from './repository';
import { catalog } from '../seed';

/* 🛠 Sayt boshqaruvi ma'lumotlari — asl bazadagi site/* bo'limi. Firebase qoidalarida bu bo'lim yo'q, ya'ni
   brauzerlar unga umuman tegolmaydi: faqat server (administrator SDK) o'qiydi va yozadi, saytga esa API orqali
   (CDN keshida) beriladi. Firestore kvotasi sarflanmaydi. Demo va sinovlarda — xotiradagi nusxa. */

const memory = ((globalThis as { __sqSite?: Record<string, unknown> }).__sqSite ??= {});
export function resetSiteMemory() {
  for (const k of Object.keys(memory)) delete memory[k];
}
function walk(path: string, create: boolean) {
  const parts = path.split('/');
  let cur: Record<string, unknown> | undefined = memory;
  for (const part of parts.slice(0, -1)) {
    if (!cur) return { parent: undefined, key: '' };
    if (create && (cur[part] === undefined || cur[part] === null)) cur[part] = {};
    cur = cur[part] as Record<string, unknown> | undefined;
  }
  return { parent: cur, key: parts[parts.length - 1] };
}
export async function siteGet<T>(path: string): Promise<T | null> {
  if (demo()) {
    const { parent, key } = walk(path, false);
    const v = parent?.[key];
    return v === undefined ? null : (structuredClone(v) as T);
  }
  return (
    await legacyDb()
      .ref('site/' + path)
      .get()
  ).val() as T | null;
}
/** Bir nechta yo'lni birdan yozish (null — o'chirish). */
export async function siteUpdate(o: Record<string, unknown>) {
  if (demo()) {
    for (const [path, value] of Object.entries(o)) {
      const { parent, key } = walk(path, value !== null);
      if (!parent) continue;
      if (value === null) delete parent[key];
      else parent[key] = structuredClone(value);
    }
    return;
  }
  await legacyDb().ref('site').update(o);
}

/* ---------- 📝 Mavzu testlari ---------- */

export type TopicQuestion = { q: string; a?: string[]; c?: number; o?: string[]; e?: string };
export type QuizMeta = { v: string; at: number; by?: string };

/** Taqdimot test dvigateli matnni innerHTML bilan chiqaradi: faqat <b>, <i>, <u>, <sub>, <sup>, <br> qoladi,
    boshqa har qanday teg (va atributli teg) oddiy matnga aylanadi. */
export const cleanHtml = (s: string) => s.replace(/<(?!\/?(?:b|i|u|sub|sup)>|br\s*\/?>)/gi, '&lt;');
const rich = (min: number, max: number) => z.string().trim().min(min).max(max).transform(cleanHtml);
const choice = z
  .object({
    q: rich(5, 600),
    a: z.array(rich(1, 300)).length(4),
    c: z.number().int().min(0).max(3),
    e: rich(0, 600).optional(),
  })
  .strict();
const open = z
  .object({
    q: rich(5, 600),
    o: z.array(rich(1, 60)).min(1).max(12),
    e: rich(0, 600).optional(),
  })
  .strict();
const topicId = z.string().regex(/^m\d{1,2}$/);
const quizInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('save'),
      t: topicId,
      questions: z
        .array(z.union([choice, open]))
        .min(1)
        .max(40),
    })
    .strict(),
  z.object({ op: z.literal('reset'), t: topicId }).strict(),
]);

/** Testi bor mavzular va savollar soni (soni o'zgarmaydi — ball hisobi shunga bog'liq). */
export const quizTopics = () =>
  (catalog.topics as { id: string; title: string; test?: number }[]).map((t) => ({
    id: t.id,
    title: t.title,
    count: Number(t.test) || 0,
  }));

export async function topicQuiz(t: string) {
  return siteGet<{ q: TopicQuestion[]; v: string; at: number; by?: string }>('quiz/' + t);
}
export async function topicQuizList() {
  const meta = (await siteGet<Record<string, QuizMeta>>('quizMeta')) || {};
  return quizTopics().map((t) => ({ ...t, changed: meta[t.id] || null }));
}

/** Administrator: mavzu testini saqlash yoki asl holiga qaytarish. */
export async function manageTopicQuiz(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = quizInput.parse(raw),
    topic = quizTopics().find((x) => x.id === p.t);
  check(topic && topic.count, 404, 'Bu mavzuda test yo‘q (krossvord yoki masala).');
  if (p.op === 'reset') {
    await siteUpdate({ ['quiz/' + p.t]: null, ['quizMeta/' + p.t]: null });
    return { questions: null, changed: null };
  }
  check(
    p.questions.length === topic!.count,
    400,
    `Savollar soni ${topic!.count} ta bo‘lishi kerak — ball hisobi shunga bog‘liq.`,
  );
  const meta: QuizMeta = { v: now.toString(36), at: now, by: a.name || a.id };
  await siteUpdate({
    ['quiz/' + p.t]: { q: p.questions, ...meta },
    ['quizMeta/' + p.t]: meta,
  });
  return { questions: p.questions as TopicQuestion[], changed: meta };
}

/* ---------- ✏️ Matnlar va 🖼 rasmlar ----------
   Saytdagi istalgan yozuv yoki rasm: kalit — ko'rinib turgan asl matn (bo'shliqlar bitta qilib) yoki rasm yo'li
   (masalan, /terdu-logo.png). site/texts/<kalit> = {o, n, at, by}, site/images/<kalit> = {o, v, type, size, at, by},
   rasm baytlari alohida site/blob/<kalit> da (ro'yxat o'qilganda yuklanmaydi). */

export type TextEntry = { o: string; n: string; at: number; by?: string };
export type ImageEntry = {
  o: string;
  v: string;
  type: string;
  size: number;
  at: number;
  by?: string;
};
export const normText = (s: string) => s.replace(/\s+/g, ' ').trim();
const fnv = (str: string, seed: number) => {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
};
export const contentKey = (prefix: string, o: string) =>
  prefix + fnv(o, 2166136261) + fnv(o + '#', 3323198485);
export const imageUrl = (key: string, v: string) => '/api/site/img/' + key + '?v=' + v;
/** Rasm kaliti: sayt ichidagi yo'l (/terdu-logo.png). Avatarlar o'z bo'limida boshqariladi. */
export const imagePath = z
  .string()
  .max(300)
  .regex(/^\/(?!api\/|avatars\/)[A-Za-z0-9._~%/-]+$/, 'Rasm manzili noto‘g‘ri');

/** Saytga beriladigan (ochiq) ko'rinish: {asl matn: yangi}, {asl rasm: yangi manzil}. */
export async function siteContent() {
  const [texts, images] = await Promise.all([
    siteGet<Record<string, TextEntry>>('texts'),
    siteGet<Record<string, ImageEntry>>('images'),
  ]);
  let rev = 0;
  const t: Record<string, string> = {},
    i: Record<string, string> = {};
  for (const x of Object.values(texts || {}))
    if (x?.o && x.n) {
      t[x.o] = x.n;
      rev = Math.max(rev, +x.at || 0);
    }
  for (const [key, x] of Object.entries(images || {}))
    if (x?.o && x.v) {
      i[x.o] = imageUrl(key, x.v);
      rev = Math.max(rev, +x.at || 0);
    }
  return { texts: t, images: i, rev };
}
/** Administrator ro'yxati: kim, qachon o'zgartirgan. */
export async function siteContentAdmin(a: Actor) {
  administrator(a);
  const [texts, images] = await Promise.all([
    siteGet<Record<string, TextEntry>>('texts'),
    siteGet<Record<string, ImageEntry>>('images'),
  ]);
  return {
    texts: Object.values(texts || {})
      .filter((x) => x?.o)
      .sort((x, y) => (+y.at || 0) - (+x.at || 0)),
    images: Object.entries(images || {})
      .filter(([, x]) => x?.o)
      .map(([key, x]) => ({ ...x, url: imageUrl(key, x.v) }))
      .sort((x, y) => (+y.at || 0) - (+x.at || 0)),
  };
}
const letters = /\p{L}/u;
const textInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('set'),
      o: z.string().max(2000).transform(normText),
      n: z.string().max(2000).transform(normText),
    })
    .strict(),
  z.object({ op: z.literal('remove'), o: z.string().max(2000).transform(normText) }).strict(),
  z.object({ op: z.literal('removeImage'), o: imagePath }).strict(),
]);
/** Administrator: matnni almashtirish yoki asl holiga qaytarish; rasmni asl holiga qaytarish. */
export async function manageSiteText(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const p = textInput.parse(raw);
  if (p.op === 'removeImage') {
    const key = contentKey('i', p.o);
    await siteUpdate({ ['images/' + key]: null, ['blob/' + key]: null });
    return siteContent();
  }
  check(
    p.o && letters.test(p.o),
    400,
    'Bu yozuvda harf yo‘q — sonlar va belgilar o‘zgartirilmaydi.',
  );
  const key = contentKey('t', p.o);
  if (p.op === 'remove' || p.n === p.o) await siteUpdate({ ['texts/' + key]: null });
  else {
    check(p.n, 400, 'Yangi matnni yozing.');
    await siteUpdate({ ['texts/' + key]: { o: p.o, n: p.n, at: now, by: a.name || a.id } });
  }
  return siteContent();
}
const IMAGE_TYPES: Record<string, (b: Buffer) => boolean> = {
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/jpeg': (b) => b[0] === 255 && b[1] === 216 && b[2] === 255,
  'image/webp': (b) =>
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP',
  'image/gif': (b) => /^GIF8[79]a/.test(b.subarray(0, 6).toString('latin1')),
};
/** Rasm baytlarini tekshirish: faqat haqiqiy PNG, JPEG, WEBP yoki GIF (SVG emas — unda skript bo'lishi mumkin). */
export function imageType(bytes: Buffer) {
  return Object.keys(IMAGE_TYPES).find((t) => IMAGE_TYPES[t](bytes)) || null;
}
export const MAX_IMAGE = 3 * 1024 * 1024;
/** Rasm baytlarini saqlash: site/blob/<kalit> = {t: turi, d: base64, v: versiya}. Faqat administrator chaqiradi. */
export async function storeBlob(key: string, bytes: Buffer, now = Date.now()) {
  check(bytes.length > 0 && bytes.length <= MAX_IMAGE, 413, 'Rasm 3 MB dan oshmasin.');
  const type = imageType(bytes);
  check(type, 400, 'Faqat PNG, JPEG, WEBP yoki GIF rasm qabul qilinadi.');
  const v = now.toString(36);
  await siteUpdate({ ['blob/' + key]: { t: type, d: bytes.toString('base64'), v } });
  return { v, type: type!, size: bytes.length };
}
export async function readImage(key: string) {
  const b = await siteGet<{ t: string; d: string; v: string }>('blob/' + key);
  return b?.d && b.t ? { type: b.t, v: b.v, bytes: Buffer.from(b.d, 'base64') } : null;
}
/** Administrator: saytdagi rasmni (asl yo'li bo'yicha) almashtirish. */
export async function replaceSiteImage(a: Actor, o: string, bytes: Buffer, now = Date.now()) {
  administrator(a);
  const path = imagePath.parse(o),
    key = contentKey('i', path),
    saved = await storeBlob(key, bytes, now);
  const entry: ImageEntry = { o: path, ...saved, at: now, by: a.name || a.id };
  await siteUpdate({ ['images/' + key]: entry });
  return siteContent();
}
