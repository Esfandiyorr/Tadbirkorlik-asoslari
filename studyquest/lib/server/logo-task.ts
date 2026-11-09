import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  LOGO_DESC_MAX,
  LOGO_DESC_MIN,
  LOGO_MAX_SCORE,
  LOGO_TOPIC,
  briefOf,
  pickBrief,
  type LogoMark,
  type LogoTaskRow,
  type LogoTaskView,
} from '../logo-task';
import { ApiError, administrator, check, staff } from './auth';
import { demo, legacyDb } from './repository';
import { imageUrl, siteGet, siteUpdate, storeBlob } from './site-content';

/* 🎨 Logotip topshirig'i (8-mavzu). Asl bazaning site/logoTask bo'limida (brauzerlar tegolmaydi, faqat server):
     b/<talaba>  = {c: biznes kodi, g: guruh}       — kimga qaysi biznes berilgani (yangi biznes tanlashda o'qiladi)
     s/<talaba>  = yozuv: biznes, ta'rif, yuborilgan vaqt, o'qituvchi bahosi
     cfg         = {open}                             — topshiriq qabul qilinadimi (administrator)
   Rasm — site/blob/lg-<xesh> (talabaning oxirgi yuklagani; manzil versiya bilan, /api/site/img orqali).
   Talaba ishini o'qituvchi baholaguncha almashtira oladi; baholangandan keyin — faqat o'qituvchi ruxsat bersa
   (yangi variant kelgunicha va qayta baholanguncha eski baho turadi).
   🎯 Ball: o'qituvchi qo'ygan 0–25 ball 8-mavzuning 100 baliga kiradi (slaydlar 30 + vaqt 20 + test 25 + logotip 25).
   Shuning uchun baho talabaning asl yozuviga ham yoziladi: students/<id>/task/m8 (dvigatel va reyting o'qiydi),
   umumiy ball (students/<id>/total) esa farq miqdoricha darhol o'zgaradi. */

type Stored = {
  name: string;
  group: string;
  code: string;
  at: number;
  img?: string;
  desc?: string;
  sentAt?: number;
  final?: LogoMark;
  again?: boolean;
  resent?: boolean;
};

const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const blobKey = (uid: string) =>
  'lg-' + createHash('sha256').update(uid).digest('hex').slice(0, 16);
const UID = z.string().regex(/^[A-Za-z0-9_-]{1,120}$/);

async function config() {
  const c = await siteGet<{ open?: boolean }>('logoTask/cfg');
  return { open: c?.open !== false };
}

function fields(uid: string, s: Stored): Omit<LogoTaskView, 'open' | 'canSend'> {
  return {
    brief: briefOf(s.code)!,
    status: s.final && !s.resent ? 'graded' : s.img && s.desc ? 'sent' : 'new',
    ...(s.img ? { img: imageUrl(blobKey(uid), s.img) } : {}),
    ...(s.desc ? { desc: s.desc } : {}),
    ...(s.sentAt ? { sentAt: s.sentAt } : {}),
    ...(s.final ? { final: s.final } : {}),
    ...(s.again ? { again: true } : {}),
    ...(s.resent ? { resent: true } : {}),
  };
}
function view(uid: string, s: Stored, open: boolean): LogoTaskView {
  return { ...fields(uid, s), canSend: open && (!s.final || !!s.again), open };
}

/** Talabaning yozuvi; birinchi marta ochganda unga biznes beriladi. */
async function ensure(a: Actor, now: number): Promise<{ uid: string; s: Stored }> {
  const uid = keyOf(a.id);
  const s = await siteGet<Stored>('logoTask/s/' + uid);
  if (s?.code && briefOf(s.code)) return { uid, s };
  const used = Object.values(
    (await siteGet<Record<string, { c: string; g: string }>>('logoTask/b')) || {},
  )
    .filter((x) => x?.c)
    .map((x) => ({ code: x.c, group: x.g || '' }));
  const group = (a.classId || '').slice(0, 40);
  const code = pickBrief(used, group);
  const fresh: Stored = { name: a.name.slice(0, 80), group, code, at: now };
  await siteUpdate({
    ['logoTask/b/' + uid]: { c: code, g: group },
    ['logoTask/s/' + uid]: fresh,
  });
  return { uid, s: fresh };
}

export async function logoTaskFor(a: Actor, now = Date.now()) {
  const [{ uid, s }, cfg] = await Promise.all([ensure(a, now), config()]);
  return { task: view(uid, s, cfg.open) };
}

/** Talaba: logotip rasmi va ta'rifini yuboradi (baholanmagan bo'lsa — avvalgisi almashtiriladi). */
export async function submitLogo(a: Actor, bytes: Buffer, rawDesc: string, now = Date.now()) {
  const desc = rawDesc.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  check(
    desc.length >= LOGO_DESC_MIN,
    400,
    `Ta’rif juda qisqa: kamida ${LOGO_DESC_MIN} belgi (4–5 jumla) yozing.`,
  );
  check(desc.length <= LOGO_DESC_MAX, 400, `Ta’rif ${LOGO_DESC_MAX} belgidan oshmasin.`);
  const [{ uid, s }, cfg] = await Promise.all([ensure(a, now), config()]);
  check(cfg.open, 403, 'Topshiriq qabul qilish yopilgan.');
  check(
    !s.final || s.again,
    409,
    'Ishingiz baholangan. Qayta yuborish kerak bo‘lsa, o‘qituvchiga yozing.',
  );
  const saved = await storeBlob(blobKey(uid), bytes, now);
  const next: Stored = {
    ...s,
    name: a.name.slice(0, 80),
    group: (a.classId || s.group || '').slice(0, 40),
    img: saved.v,
    desc,
    sentAt: now,
  };
  // Qayta yuborishga ruxsat bilan yuborilgan yangi variant: eski baho turadi, o'qituvchi uni qaytadan baholaydi.
  if (s.final) next.resent = true;
  delete next.again;
  await siteUpdate({ ['logoTask/s/' + uid]: next });
  return { task: view(uid, next, cfg.open) };
}

/* ---------- 🎯 Baho → mavzu bali va reyting ---------- */

const demoMarks = ((globalThis as { __sqTaskMarks?: Map<string, number> }).__sqTaskMarks ??=
  new Map());
/** Demo/sinov: talabaning asl yozuviga yozilgan logotip bahosi. */
export const demoTaskMark = (uid: string) => demoMarks.get(uid);

/** O'qituvchi bahosini talabaning asl yozuviga yozadi (students/<id>/task/m8) va umumiy ballni farq miqdoricha
 *  o'zgartiradi — reyting darhol yangilanadi, dvigatel ham keyingi ochilishda shu bahoni hisobga oladi. */
async function syncTopicMark(uid: string, score: number | null) {
  if (!uid.startsWith('legacy_')) return; // asl bazada yozuvi yo'q (mustaqil o'quvchi) — reyting bali yo'q
  if (demo()) {
    if (score === null) demoMarks.delete(uid);
    else demoMarks.set(uid, score);
    return;
  }
  const ref = legacyDb().ref('students/' + uid.slice(7));
  const [name, kind, old] = await Promise.all([
    ref.child('name').get(),
    ref.child('learnerType').get(),
    ref.child('task/' + LOGO_TOPIC).get(),
  ]);
  if (!name.exists()) return;
  const prev = Number(old.val()) || 0,
    next = score ?? 0;
  await ref.child('task/' + LOGO_TOPIC).set(score);
  if (kind.val() === 'independent' || prev === next) return;
  await ref
    .child('total')
    .transaction((t) => Math.max(0, Math.round(((Number(t) || 0) - prev + next) * 10) / 10));
}

/* ---------- O'qituvchi va administrator ---------- */

export async function logoTaskList(a: Actor) {
  staff(a);
  const [all, cfg] = await Promise.all([siteGet<Record<string, Stored>>('logoTask/s'), config()]);
  const rows: LogoTaskRow[] = Object.entries(all || {})
    .filter(([, s]) => s?.code && briefOf(s.code))
    .map(([uid, s]) => ({ ...fields(uid, s), uid, name: s.name, group: s.group }))
    .sort(
      (x, y) =>
        x.group.localeCompare(y.group) ||
        x.name.localeCompare(y.name, 'uz') ||
        x.uid.localeCompare(y.uid),
    );
  return { rows, open: cfg.open };
}

const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('grade'),
      uid: UID,
      score: z.number().int().min(0).max(LOGO_MAX_SCORE),
      note: z.string().trim().max(600).optional(),
    })
    .strict(),
  z.object({ op: z.literal('clearGrade'), uid: UID }).strict(),
  z.object({ op: z.literal('again'), uid: UID }).strict(),
  z.object({ op: z.literal('settings'), open: z.boolean() }).strict(),
]);

export async function manageLogoTask(a: Actor, raw: unknown, now = Date.now()) {
  staff(a);
  const v = adminInput.parse(raw);
  if (v.op === 'settings') {
    administrator(a);
    await siteUpdate({ 'logoTask/cfg': { open: v.open } });
    return logoTaskList(a);
  }
  const path = 'logoTask/s/' + v.uid;
  const s = await siteGet<Stored>(path);
  if (!s?.code) throw new ApiError(404, 'Talaba yozuvi topilmadi.');
  if (v.op === 'grade') {
    check(s.img && s.desc, 409, 'Talaba hali ish yubormagan.');
    const mark: LogoMark = {
      score: v.score,
      by: (a.name || a.id).slice(0, 80),
      at: now,
      ...(v.note ? { note: v.note } : {}),
    };
    await siteUpdate({
      [path + '/final']: mark,
      [path + '/again']: null,
      [path + '/resent']: null,
    });
    await syncTopicMark(v.uid, v.score);
  } else if (v.op === 'clearGrade') {
    await siteUpdate({
      [path + '/final']: null,
      [path + '/again']: null,
      [path + '/resent']: null,
    });
    await syncTopicMark(v.uid, null);
  } else {
    check(s.final, 409, 'Ish hali baholanmagan — talaba uni o‘zi almashtira oladi.');
    await siteUpdate({ [path + '/again']: true });
  }
  return logoTaskList(a);
}
