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
