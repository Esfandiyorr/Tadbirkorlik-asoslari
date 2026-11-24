import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  EXAM_PER_TOPIC,
  EXAM_TOPIC_MAX,
  FINAL,
  MIX_SIZE,
  parseQuestions,
  questionId,
  type ExamAdminView,
  type ExamCert,
  type ExamItem,
  type ExamRun,
  type ExamView,
} from '../exam';
import { course, lessons } from '../seed';
import catalog from '../catalog.generated.json';
import { ApiError, administrator, check } from './auth';
import { repository } from './repository';
import { siteGet, siteUpdate } from './site-content';

/* 🎯 Yakuniy testga tayyorgarlik (lib/exam.ts). Asl bazaning site/ bo'limida (faqat server):
     examQ/<mavzu>            = {items: {<savol>: {q, o, c, n}}, at, by} — administrator yuklagan savollar
     examAccess/<foydalanuvchi> = {uid, name, at, by, via}             — bo'lim ochilgan (to'lov tasdiqlangan)
     examStats/<foydalanuvchi>/<savol> = {r, w, l, at}                  — to'g'ri/xato soni, oxirgisi to'g'rimi
     examRuns/<foydalanuvchi>/<sinov>  = {at, end, qs, done?}           — yakuniy sinov va uning natijasi
     examCerts/<sertifikat>   = {uid, uk, name, group, score, total, pct, at} — ochiq tekshiriladi (QR)
   To'g'ri javoblar brauzerga oldindan berilmaydi: mashqda har javobdan keyin, yakuniy sinovda — oxirida tekshiriladi. */

type StoredQ = { q: string; o: string[]; c: number; n: number };
type StoredTopic = { items?: Record<string, StoredQ>; at?: number; by?: string };
type Stat = { r?: number; w?: number; l?: number; at?: number };
type StoredRun = {
  at: number;
  end: number;
  qs: string[];
  done?: { at: number; score: number; total: number; pct: number; passed: boolean; cert?: string };
};
type StoredCert = {
  uid: string;
  uk: string;
  name: string;
  group?: string;
  score: number;
  total: number;
  pct: number;
  at: number;
};

const QID = /^m\d{1,2}-[a-z0-9]{1,10}$/;
const RID = /^[a-z0-9]{8,40}$/;
const GRACE = 2 * 60000;
const RUNS_KEPT = 20;
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const topics = () =>
  lessons
    .filter((l) => /^m\d+$/.test(l.id))
    .sort((a, b) => a.order - b.order)
    .map((l, i) => ({ id: l.id, n: i + 1, title: l.title }));
const staff = (a: Actor | null) => a?.role === 'admin' || a?.role === 'teacher';
const shuffle = <T>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const toItem = (topic: string, id: string, s: StoredQ): ExamItem => ({ id, topic, q: s.q, o: s.o });

async function readBank() {
  const raw = (await siteGet<Record<string, StoredTopic>>('examQ')) || {};
  const bank: Record<string, [string, StoredQ][]> = {};
  for (const t of topics())
    bank[t.id] = Object.entries(raw[t.id]?.items || {})
      .filter(([id, s]) => QID.test(id) && s && typeof s.q === 'string' && Array.isArray(s.o))
      .sort(([, a], [, b]) => (a.n || 0) - (b.n || 0));
  return bank;
}
/** O'qituvchi yoki administrator: tejamkor (readOnly) so'rovda Firestore'dagi rol ko'rinmaydi — bir marta tekshiriladi. */
async function isStaff(a: Actor | null) {
  if (!a) return false;
  if (staff(a)) return true;
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  return stored?.role === 'admin' || stored?.role === 'teacher';
}
/** Bo'lim ochiqmi: sotib olingan (to'lov tasdiqlangan) yoki o'qituvchi/administrator. */
async function accessOf(a: Actor | null) {
  if (!a) return { access: false, staff: false };
  if (staff(a)) return { access: true, staff: true };
  const granted = !!(await siteGet<{ at?: number }>('examAccess/' + keyOf(a.id)))?.at;
  const st = await isStaff(a);
  return { access: granted || st, staff: st };
}
export async function hasExamAccess(a: Actor | null) {
  return (await accessOf(a)).access;
}
/** Bo'limni ochish: to'lov tasdiqlanganda (lib/server/services.ts) yoki administrator qo'lda. */
export async function grantExamAccess(uid: string, name: string, by: string, via: string, now = Date.now()) {
  await siteUpdate({
    ['examAccess/' + keyOf(uid)]: {
      uid,
      name: name.slice(0, 120),
      at: now,
      by: by.slice(0, 60),
      via: via.slice(0, 40),
    },
  });
}
function runView(id: string, r: StoredRun): ExamRun | null {
  if (!r?.done) return null;
  return {
    id,
    at: r.done.at,
    score: r.done.score,
    total: r.done.total,
    pct: r.done.pct,
    passed: !!r.done.passed,
    ...(r.done.cert ? { cert: r.done.cert } : {}),
  };
}

/** Talaba (yoki mehmon) uchun: mavzular va savollar soni, natijalari, yakuniy sinovlar. */
export async function examView(a: Actor | null, now = Date.now()): Promise<ExamView> {
  const [bank, { access, staff: isStaffUser }] = await Promise.all([readBank(), accessOf(a)]);
  const me = a ? keyOf(a.id) : '';
  const [stats, runs] =
    a && access
      ? await Promise.all([
          siteGet<Record<string, Stat>>('examStats/' + me).then((v) => v || {}),
          siteGet<Record<string, StoredRun>>('examRuns/' + me).then((v) => v || {}),
        ])
      : [{} as Record<string, Stat>, {} as Record<string, StoredRun>];
  const list = topics().map((t) => {
    const ids = bank[t.id].map(([id]) => id);
    const mine = ids.map((id) => stats[id]).filter(Boolean) as Stat[];
    return {
      ...t,
      count: ids.length,
      seen: mine.length,
      right: mine.filter((s) => s.l === 1).length,
      wrong: mine.filter((s) => s.l === 0).length,
    };
  });
  const total = list.reduce((n, t) => n + t.count, 0);
  const open = Object.entries(runs)
    .filter(([id, r]) => RID.test(id) && r && !r.done && r.end + GRACE > now)
    .sort(([, x], [, y]) => y.at - x.at)[0];
  const byId = new Map(
    Object.values(bank)
      .flat()
      .map(([id, s]) => [id, s] as const),
  );
  return {
    access,
    staff: isStaffUser,
    signedIn: !!a,
    topics: list,
    total,
    mistakes: list.reduce((n, t) => n + t.wrong, 0),
    final: {
      count: list.reduce((n, t) => n + Math.min(FINAL.perTopic, t.count), 0),
      minutes: FINAL.minutes,
      pass: FINAL.pass,
    },
    runs: Object.entries(runs)
      .map(([id, r]) => runView(id, r))
      .filter((r): r is ExamRun => !!r)
      .sort((x, y) => y.at - x.at)
      .slice(0, 10),
    open: open
      ? {
          id: open[0],
          end: open[1].end,
          items: open[1].qs
            .map((id) => {
              const s = byId.get(id);
              return s ? toItem(id.split('-')[0], id, s) : null;
            })
            .filter((x): x is ExamItem => !!x),
        }
      : null,
  };
}

/** Administrator: hamma savollar (to'g'ri javobi bilan) va ko'rsatkichlar. */
export async function examAdmin(a: Actor): Promise<ExamAdminView> {
  administrator(a);
  const [bank, access, certs] = await Promise.all([
    readBank(),
    siteGet<Record<string, unknown>>('examAccess'),
    siteGet<Record<string, unknown>>('examCerts'),
  ]);
  const list = topics().map((t) => ({
    ...t,
    count: bank[t.id].length,
    items: bank[t.id].map(([id, s]) => ({ id, q: s.q, o: s.o, c: s.c })),
  }));
  return {
    topics: list,
    total: list.reduce((n, t) => n + t.count, 0),
    buyers: Object.keys(access || {}).length,
    certs: Object.keys(certs || {}).length,
  };
}

/** Sertifikatni tekshirish (QR-kod shu yerga olib keladi) — hamma uchun ochiq, faqat ism va natija. */
export async function examCert(id: string): Promise<ExamCert> {
  check(/^[A-Z0-9-]{6,24}$/.test(id), 404, 'Sertifikat topilmadi.');
  const c = await siteGet<StoredCert>('examCerts/' + id);
  check(c?.name, 404, 'Sertifikat topilmadi.');
  return {
    id,
    name: c!.name,
    ...(c!.group ? { group: c!.group } : {}),
    score: c!.score,
    total: c!.total,
    pct: c!.pct,
    at: c!.at,
    course: course.title,
    teacher: (catalog as { teacherName?: string }).teacherName || '',
  };
}

const userInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('start'),
      mode: z.enum(['topic', 'mix', 'mistakes', 'final']),
      topic: z.string().max(8).optional(),
    })
    .strict(),
  z
    .object({ op: z.literal('answer'), id: z.string().max(30), choice: z.number().int().min(0).max(5) })
    .strict(),
  z
    .object({
      op: z.literal('finish'),
      run: z.string().max(40),
      answers: z.record(z.string().max(30), z.number().int().min(0).max(5)),
    })
    .strict(),
]);

/** Talaba amallari: mashq boshlash, javobni tekshirish, yakuniy sinovni topshirish. */
export async function examAct(a: Actor, raw: unknown, now = Date.now()) {
  const v = userInput.parse(raw);
  if (!(await hasExamAccess(a)))
    throw new ApiError(
      402,
      'Yakuniy testga tayyorgarlik bo‘limi pullik: avval uni oching (Pullik xizmatlar).',
    );
  const me = keyOf(a.id);
  const bank = await readBank();
  const all = Object.values(bank).flat();
  const find = (id: string) => all.find(([x]) => x === id)?.[1];

  if (v.op === 'start') {
    if (v.mode === 'final') {
      const qs = topics().flatMap((t) =>
        shuffle(bank[t.id])
          .slice(0, FINAL.perTopic)
          .map(([id]) => id),
      );
      check(qs.length, 409, 'Savollar hali yuklanmagan.');
      const rid = now.toString(36) + randomUUID().replace(/-/g, '').slice(0, 8);
      const end = now + FINAL.minutes * 60000;
      // eski sinovlar ko'payib ketmasin: oxirgi RUNS_KEPT tasi qoladi (sertifikatlar alohida saqlanadi)
      const runs = (await siteGet<Record<string, StoredRun>>('examRuns/' + me)) || {};
      const old = Object.entries(runs)
        .sort(([, x], [, y]) => y.at - x.at)
        .slice(RUNS_KEPT - 1);
      await siteUpdate({
        ['examRuns/' + me + '/' + rid]: { at: now, end, qs },
        ...Object.fromEntries(old.map(([id]) => ['examRuns/' + me + '/' + id, null])),
      });
      const items = shuffle(qs).map((id) => toItem(id.split('-')[0], id, find(id)!));
      return { mode: v.mode, run: rid, end, items };
    }
    let pool = all;
    if (v.mode === 'topic') {
      check(v.topic && bank[v.topic], 404, 'Mavzu topilmadi.');
      pool = bank[v.topic!];
    } else if (v.mode === 'mistakes') {
      const stats = (await siteGet<Record<string, Stat>>('examStats/' + me)) || {};
      pool = all.filter(([id]) => stats[id]?.l === 0);
      check(pool.length, 409, 'Xato qilingan savol yo‘q — zo‘r!');
    }
    check(pool.length, 409, 'Savollar hali yuklanmagan.');
    const pick = v.mode === 'topic' ? shuffle(pool) : shuffle(pool).slice(0, MIX_SIZE);
    return {
      mode: v.mode,
      items: pick.map(([id, s]) => toItem(id.split('-')[0], id, s)),
    };
  }

  if (v.op === 'answer') {
    const s = find(v.id);
    check(s, 404, 'Savol topilmadi.');
    const ok = v.choice === s!.c;
    const old = (await siteGet<Stat>('examStats/' + me + '/' + v.id)) || {};
    await siteUpdate({
      ['examStats/' + me + '/' + v.id]: {
        r: (old.r || 0) + (ok ? 1 : 0),
        w: (old.w || 0) + (ok ? 0 : 1),
        l: ok ? 1 : 0,
        at: now,
      },
    });
    return { ok, correct: s!.c };
  }

  // 🏁 yakuniy sinov: hamma javob bir vaqtda tekshiriladi
  check(RID.test(v.run), 404, 'Sinov topilmadi.');
  const r = await siteGet<StoredRun>('examRuns/' + me + '/' + v.run);
  check(r?.qs?.length, 404, 'Sinov topilmadi.');
  check(!r!.done, 409, 'Bu sinov allaqachon topshirilgan.');
  check(now <= r!.end + GRACE, 409, 'Sinov vaqti tugagan. Yangi sinov boshlang.');
  const stats = (await siteGet<Record<string, Stat>>('examStats/' + me)) || {};
  const patch: Record<string, unknown> = {};
  const review: { id: string; choice: number | null; correct: number }[] = [];
  let score = 0;
  for (const id of r!.qs) {
    const s = find(id);
    if (!s) continue;
    const choice = v.answers[id];
    const ok = choice === s.c;
    if (ok) score++;
    review.push({ id, choice: typeof choice === 'number' ? choice : null, correct: s.c });
    const old = stats[id] || {};
    patch['examStats/' + me + '/' + id] = {
      r: (old.r || 0) + (ok ? 1 : 0),
      w: (old.w || 0) + (ok ? 0 : 1),
      l: ok ? 1 : 0,
      at: now,
    };
  }
  const total = review.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const passed = total > 0 && pct >= FINAL.pass;
  let cert: string | undefined;
  if (passed) {
    cert = 'TA-' + now.toString(36).toUpperCase() + '-' + randomUUID().slice(0, 4).toUpperCase();
    const c: StoredCert = {
      uid: a.id,
      uk: me,
      name: (a.name || 'Talaba').slice(0, 120),
      ...(a.classId ? { group: String(a.classId).slice(0, 40) } : {}),
      score,
      total,
      pct,
      at: now,
    };
    patch['examCerts/' + cert] = c;
  }
  patch['examRuns/' + me + '/' + v.run + '/done'] = {
    at: now,
    score,
    total,
    pct,
    passed,
    ...(cert ? { cert } : {}),
  };
  await siteUpdate(patch);
  return { score, total, pct, passed, ...(cert ? { cert } : {}), review };
}

const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('import'),
      topic: z.string().max(8),
      text: z.string().max(200_000),
      replace: z.boolean(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), topic: z.string().max(8), id: z.string().max(30) }).strict(),
  z.object({ op: z.literal('clear'), topic: z.string().max(8) }).strict(),
]);

/** Administrator: savollarni matndan yuklash (qo'shish yoki almashtirish), bitta savolni yoki mavzuni tozalash. */
export async function examAdminAct(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = adminInput.parse(raw);
  check(
    topics().some((t) => t.id === v.topic),
    404,
    'Mavzu topilmadi.',
  );
  const path = 'examQ/' + v.topic;
  if (v.op === 'clear') {
    await siteUpdate({ [path]: null });
    return { admin: await examAdmin(a) };
  }
  if (v.op === 'remove') {
    check(QID.test(v.id), 404, 'Savol topilmadi.');
    await siteUpdate({ [path + '/items/' + v.id]: null });
    return { admin: await examAdmin(a) };
  }
  const { items, errors } = parseQuestions(v.text);
  check(items.length, 400, errors[0] || 'Savol topilmadi — namunadagi formatda yozing.');
  const cur = v.replace ? {} : (await siteGet<StoredTopic>(path))?.items || {};
  const merged: Record<string, StoredQ> = { ...cur };
  let n = Object.values(cur).reduce((m, s) => Math.max(m, s?.n || 0), 0);
  let dup = 0;
  for (const it of items) {
    const id = questionId(v.topic, it.q);
    if (merged[id]) dup++;
    else n++;
    merged[id] = { q: it.q, o: it.o, c: it.c, n: merged[id]?.n || n };
  }
  check(
    Object.keys(merged).length <= EXAM_TOPIC_MAX,
    400,
    `Bitta mavzuga ${EXAM_TOPIC_MAX} tagacha savol (odatda ${EXAM_PER_TOPIC} ta).`,
  );
  await siteUpdate({
    [path]: { items: merged, at: now, by: (a.name || a.id).slice(0, 60) },
  });
  return { admin: await examAdmin(a), added: items.length - dup, updated: dup, errors };
}

/** Hisob o'chirilganda: bo'lim huquqi, natijalar, sinovlar va sertifikatlar. */
export async function forgetExamUser(key: string) {
  const runs = (await siteGet<Record<string, StoredRun>>('examRuns/' + key)) || {};
  const patch: Record<string, unknown> = {
    ['examAccess/' + key]: null,
    ['examStats/' + key]: null,
    ['examRuns/' + key]: null,
  };
  for (const r of Object.values(runs))
    if (r?.done?.cert && /^[A-Z0-9-]{6,24}$/.test(r.done.cert))
      patch['examCerts/' + r.done.cert] = null;
  return patch;
}
