import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  LECTURES_PER_TOPIC,
  LECTURE_CHUNK,
  LECTURE_MAX,
  LECTURE_TYPES,
  lectureExt,
  type Lecture,
  type LectureExt,
} from '../lectures';
import { administrator, check } from './auth';
import { catalog } from '../seed';
import { siteGet, siteUpdate } from './site-content';

/* 📄 Ma'ruza fayllari. Asl bazaning site/ bo'limida (brauzerlar tegolmaydi, faqat server):
     lectures/<mavzu>/<id>  = {title, name, ext, size, chunks, at, by, ready, got: {n: uzunlik}}  — ro'yxat (yengil)
     lectureData/<id>/<n>   = bo'lak (base64)                                                       — fayl baytlari
   Yuklash: begin → har bir bo'lak (≤ 2,5 MB, alohida so'rov) → finish. Tugallanmagan yuklashlar ro'yxatda
   ko'rinmaydi va bir kundan keyin keyingi yuklashda tozalanadi. Talabalar ro'yxatni /api/site/lectures dan,
   bo'laklarni /api/site/lecture/<id>/<n> dan (CDN keshida) oladi. */

type Stored = {
  title: string;
  name: string;
  ext: LectureExt;
  size: number;
  chunks: number;
  at: number;
  by?: string;
  ready?: boolean;
  got?: Record<string, number>;
};

const topicId = z.string().regex(/^m\d{1,2}$/);
const ID = /^[a-z0-9]{6,40}$/;
const STALE_MS = 86400000;
const topics = () =>
  (catalog.topics as { id: string; title: string }[]).map((t) => ({ id: t.id, title: t.title }));

const toLecture = (id: string, s: Stored): Lecture => ({
  id,
  title: s.title,
  name: s.name,
  ext: s.ext,
  size: s.size,
  chunks: s.chunks,
  at: s.at,
});
function list(raw: Record<string, Stored> | null): Lecture[] {
  return Object.entries(raw || {})
    .filter(([id, s]) => ID.test(id) && s?.ready && s.ext in LECTURE_TYPES)
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([id, s]) => toLecture(id, s));
}

/** Talabalar uchun: mavzuning tayyor ma'ruza fayllari. */
export async function topicLectures(t: string): Promise<Lecture[]> {
  if (!topicId.safeParse(t).success) return [];
  return list(await siteGet<Record<string, Stored>>('lectures/' + t));
}

/** Administrator: hamma mavzular, ularning fayllari va umumiy hajm. */
export async function lectureAdmin(a: Actor) {
  administrator(a);
  const raw = (await siteGet<Record<string, Record<string, Stored>>>('lectures')) || {};
  const out = topics().map((x) => ({ ...x, files: list(raw[x.id] || null) }));
  const used = out.reduce((s, x) => s + x.files.reduce((n, f) => n + f.size, 0), 0);
  return { topics: out, used };
}

/** Bo'lak (yuklab olish uchun): faqat to'liq yuklangan fayldan. */
export async function lectureChunk(id: string, n: number) {
  if (!ID.test(id) || !Number.isInteger(n) || n < 0 || n > 64) return null;
  const all = (await siteGet<Record<string, Record<string, Stored>>>('lectures')) || {};
  const meta = Object.values(all).find((files) => files?.[id])?.[id];
  if (!meta?.ready || n >= meta.chunks) return null;
  const data = await siteGet<string>('lectureData/' + id + '/' + n);
  return typeof data === 'string' ? Buffer.from(data, 'base64') : null;
}

/** Faylning birinchi baytlari kengaytmasiga mosmi (soxta fayl yuklanmasin). */
function magicOk(ext: LectureExt, b: Buffer) {
  if (ext === 'pdf') return b.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === 'docx' || ext === 'pptx')
    return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  return b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

async function find(id: string) {
  check(ID.test(id), 400, 'Fayl topilmadi.');
  const all = (await siteGet<Record<string, Record<string, Stored>>>('lectures')) || {};
  for (const [t, files] of Object.entries(all))
    if (files?.[id]) return { t, s: files[id], path: 'lectures/' + t + '/' + id };
  check(false, 404, 'Fayl topilmadi.');
  throw new Error('unreachable');
}

const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('begin'),
      t: topicId,
      name: z.string().trim().min(3).max(180),
      size: z.number().int().positive(),
      title: z.string().trim().max(120).optional(),
    })
    .strict(),
  z.object({ op: z.literal('finish'), id: z.string().regex(ID) }).strict(),
  z.object({ op: z.literal('remove'), id: z.string().regex(ID) }).strict(),
  z
    .object({
      op: z.literal('rename'),
      id: z.string().regex(ID),
      title: z.string().trim().min(1).max(120),
    })
    .strict(),
]);

export async function manageLectures(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = input.parse(raw);
  if (v.op === 'begin') {
    check(
      topics().some((x) => x.id === v.t),
      404,
      'Mavzu topilmadi.',
    );
    const ext = lectureExt(v.name);
    check(ext, 400, 'Faqat PDF, Word (.docx, .doc) yoki PowerPoint (.pptx, .ppt) fayl yuklanadi.');
    check(v.size <= LECTURE_MAX, 413, 'Fayl 30 MB dan oshmasin.');
    const current = (await siteGet<Record<string, Stored>>('lectures/' + v.t)) || {};
    // bir kundan eski tugallanmagan yuklashlarni tozalash
    const stale = Object.entries(current).filter(
      ([, s]) => !s?.ready && now - (s?.at || 0) > STALE_MS,
    );
    if (stale.length)
      await siteUpdate(
        Object.fromEntries(
          stale.flatMap(([id]) => [
            ['lectures/' + v.t + '/' + id, null],
            ['lectureData/' + id, null],
          ]),
        ),
      );
    check(
      Object.values(current).filter((s) => s?.ready).length < LECTURES_PER_TOPIC,
      409,
      `Bitta mavzuga ${LECTURES_PER_TOPIC} tagacha fayl yuklanadi.`,
    );
    const id = now.toString(36) + randomUUID().replace(/-/g, '').slice(0, 10);
    const name = v.name.replace(/[\r\n"\\/]/g, '').slice(0, 180);
    const item: Stored = {
      title: v.title || name.replace(/\.[a-z0-9]+$/i, ''),
      name,
      ext: ext!,
      size: v.size,
      chunks: Math.ceil(v.size / LECTURE_CHUNK),
      at: now,
      by: (a.name || a.id).slice(0, 80),
      ready: false,
    };
    await siteUpdate({ ['lectures/' + v.t + '/' + id]: item });
    return { id, chunk: LECTURE_CHUNK, chunks: item.chunks };
  }
  const { s, path } = await find(v.id);
  if (v.op === 'remove') {
    await siteUpdate({ [path]: null, ['lectureData/' + v.id]: null });
    return lectureAdmin(a);
  }
  if (v.op === 'rename') {
    await siteUpdate({ [path + '/title']: v.title });
    return lectureAdmin(a);
  }
  check(!s.ready, 409, 'Fayl allaqachon yuklangan.');
  const missing = Array.from({ length: s.chunks }, (_, n) => n).filter((n) => !s.got?.[n]);
  check(!missing.length, 400, 'Fayl to‘liq yuklanmadi — qaytadan urinib ko‘ring.');
  await siteUpdate({ [path + '/ready']: true, [path + '/got']: null, [path + '/at']: now });
  return lectureAdmin(a);
}

/** Administrator: bitta bo'lakni saqlash (n — tartib raqami, 0 dan). */
export async function saveLectureChunk(a: Actor, id: string, n: number, bytes: Buffer) {
  administrator(a);
  const { s, path } = await find(id);
  check(!s.ready, 409, 'Fayl allaqachon yuklangan.');
  check(Number.isInteger(n) && n >= 0 && n < s.chunks, 400, 'Bo‘lak raqami noto‘g‘ri.');
  const expected = n < s.chunks - 1 ? LECTURE_CHUNK : s.size - LECTURE_CHUNK * (s.chunks - 1);
  check(bytes.length === expected, 400, 'Bo‘lak hajmi noto‘g‘ri — qaytadan urinib ko‘ring.');
  if (n === 0)
    check(
      magicOk(s.ext, bytes),
      400,
      `Bu haqiqiy ${LECTURE_TYPES[s.ext].label} fayli emas (yoki fayl buzilgan).`,
    );
  await siteUpdate({
    ['lectureData/' + id + '/' + n]: bytes.toString('base64'),
    [path + '/got/' + n]: bytes.length,
  });
  return { ok: true };
}
