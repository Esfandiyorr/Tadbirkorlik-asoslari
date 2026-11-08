import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { parseYouTube, YT_ID, type TopicVideo } from '../youtube';
import { administrator, check } from './auth';
import { catalog } from '../seed';
import { siteGet, siteUpdate } from './site-content';

/* 📺 Mavzu videolari: administrator «Sayt boshqaruvi → 📺 Mavzu videolari»da mavzuga YouTube havolasini qo'yadi.
   Asl bazada site/videos/<mavzu>/<kalit> = {id, t, s, at, by} — brauzerlar bu bo'limga tegolmaydi. Talabalarga:
   taqdimot <head> idagi /api/site/quiz skripti (window.SQ_VIDEO — 8-mavzudagi video slaydi uchun) va dars sahifasidagi
   «📺 Video» tugmasi (/api/site/video?t=<mavzu>). Ikkalasi ham CDN keshida — baza daqiqasiga ko'pi bilan bir marta o'qiladi. */

type Stored = { id: string; t?: string; s?: number; at: number; by?: string };
const MAX = 6;
const topicId = z.string().regex(/^m\d{1,2}$/);
const KEY = /^[a-z0-9-]{4,40}$/;

export const videoTopics = () =>
  (catalog.topics as { id: string; title: string }[]).map((t) => ({ id: t.id, title: t.title }));

function list(raw: Record<string, Stored> | null): TopicVideo[] {
  return Object.entries(raw || {})
    .filter(([k, v]) => KEY.test(k) && v && YT_ID.test(v.id))
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .slice(0, MAX)
    .map(([key, v]) => ({
      key,
      id: v.id,
      at: v.at,
      ...(v.t ? { t: v.t } : {}),
      ...(v.s ? { s: v.s } : {}),
    }));
}

export async function topicVideos(t: string): Promise<TopicVideo[]> {
  if (!topicId.safeParse(t).success) return [];
  return list(await siteGet<Record<string, Stored>>('videos/' + t));
}
/** Hamma mavzular va ularning videolari (administrator ro'yxati). */
export async function allVideos() {
  const raw = (await siteGet<Record<string, Record<string, Stored>>>('videos')) || {};
  return { topics: videoTopics().map((x) => ({ ...x, videos: list(raw[x.id] || null) })) };
}

const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('add'),
      t: topicId,
      url: z.string().trim().min(5).max(300),
      title: z.string().trim().max(90).optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), t: topicId, key: z.string().regex(KEY) }).strict(),
]);

/** Administrator: mavzuga video qo'shish yoki o'chirish. Yangilangan ro'yxatni qaytaradi. */
export async function manageVideos(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = input.parse(raw);
  check(
    videoTopics().some((x) => x.id === v.t),
    404,
    'Mavzu topilmadi.',
  );
  if (v.op === 'remove') {
    await siteUpdate({ ['videos/' + v.t + '/' + v.key]: null });
    return allVideos();
  }
  const yt = parseYouTube(v.url);
  check(
    yt,
    400,
    'YouTube havolasi tanilmadi. Masalan: https://www.youtube.com/watch?v=… yoki https://youtu.be/…',
  );
  const current = await topicVideos(v.t);
  check(current.length < MAX, 409, `Bitta mavzuga ${MAX} tagacha video qo‘yiladi.`);
  check(!current.some((x) => x.id === yt!.id), 409, 'Bu video mavzuda allaqachon bor.');
  const key = now.toString(36) + '-' + randomUUID().slice(0, 6);
  const item: Stored = {
    id: yt!.id,
    at: now,
    by: a.name || a.id,
    ...(v.title ? { t: v.title } : {}),
    ...(yt!.s ? { s: yt!.s } : {}),
  };
  await siteUpdate({ ['videos/' + v.t + '/' + key]: item });
  return allVideos();
}
