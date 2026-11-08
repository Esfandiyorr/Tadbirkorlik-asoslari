import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  LOGO_DESC_MAX,
  LOGO_DESC_MIN,
  LOGO_MAX_SCORE,
  LOGO_MAX_TRIES,
  briefOf,
  pickBrief,
  type LogoAi,
  type LogoTaskRow,
  type LogoTaskStatus,
  type LogoTaskView,
} from '../logo-task';
import { ApiError, administrator, check, staff } from './auth';
import { imageUrl, readImage, siteGet, siteUpdate, storeBlob } from './site-content';
import { LogoAiError, aiConfigured, gradeLogo } from './logo-ai';

/* 🎨 Logotip topshirig'i (8-mavzu). Asl bazaning site/logoTask bo'limida (brauzerlar tegolmaydi, faqat server):
     b/<talaba>  = {c: biznes kodi, g: guruh}       — kimga qaysi biznes berilgani (yangi biznes tanlashda o'qiladi)
     s/<talaba>  = yozuv: biznes, ta'rif, AI bahosi, urinishlar, o'qituvchi bahosi
     cfg         = {open}                             — topshiriq qabul qilinadimi (administrator)
   Rasm — site/blob/lg-<xesh> (talabaning oxirgi yuklagani; manzil versiya bilan, /api/site/img orqali).
   Har urinishda sun'iy intellekt baholaydi; 3 ta muvaffaqiyatli baholash (o'qituvchi qo'shimcha berishi mumkin),
   eng yaxshi natija hisobga olinadi, o'qituvchi bahosi esa undan ustun. */

type Lang = 'uz' | 'en' | 'ru';
type Stored = {
  name: string;
  group: string;
  code: string;
  at: number;
  status: LogoTaskStatus;
  img?: string;
  desc?: string;
  sentAt?: number;
  lang?: Lang;
  ai?: LogoAi;
  tries?: { at: number; score: number }[];
  final?: { score: number; by: string; at: number; note?: string };
  extra?: number;
  error?: string;
  lock?: number;
};

const LOCK_MS = 90_000;
const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const blobKey = (uid: string) =>
  'lg-' + createHash('sha256').update(uid).digest('hex').slice(0, 16);
const UID = z.string().regex(/^[A-Za-z0-9_-]{1,120}$/);

async function config() {
  const c = await siteGet<{ open?: boolean }>('logoTask/cfg');
  return { open: c?.open !== false };
}

const ERRORS: Record<string, string> = {
  'not-configured':
    'Sun’iy intellekt hali ulanmagan — ishingiz saqlandi, o‘qituvchi baholaydi (yoki AI ulangach avtomatik baholanadi).',
  auth: 'Sun’iy intellekt kaliti noto‘g‘ri — ishingiz saqlandi, o‘qituvchiga xabar berildi.',
  busy: 'Sun’iy intellekt hozir band — ishingiz saqlandi. Bir necha daqiqadan keyin «Qayta baholash»ni bosing.',
  timeout: 'Baholash juda uzoq davom etdi — ishingiz saqlandi. «Qayta baholash»ni bosing.',
  refusal:
    'Sun’iy intellekt bu rasmni baholay olmadi — ishingiz saqlandi, o‘qituvchi ko‘rib chiqadi.',
  format: 'Baholash natijasi tushunarsiz keldi — ishingiz saqlandi. «Qayta baholash»ni bosing.',
};
const errorText = (e: unknown) =>
  e instanceof LogoAiError
    ? ERRORS[e.message] ||
      'Baholashda xatolik bo‘ldi — ishingiz saqlandi. Birozdan keyin «Qayta baholash»ni bosing.'
    : 'Baholashda xatolik bo‘ldi — ishingiz saqlandi. Birozdan keyin «Qayta baholash»ni bosing.';

function bestOf(s: Stored) {
  const list = s.tries || [];
  return list.length ? Math.max(...list.map((t) => t.score)) : undefined;
}
function left(s: Stored) {
  return Math.max(0, LOGO_MAX_TRIES + (s.extra || 0) - (s.tries?.length || 0));
}
/** Baholash boshlanib, javobsiz qolgan (masalan, funksiya vaqti tugagan) ish. */
const stale = (s: Stored) => s.status === 'pending' && Date.now() - (s.lock || 0) > LOCK_MS;
function view(uid: string, s: Stored, open: boolean): LogoTaskView {
  return {
    brief: briefOf(s.code)!,
    status: stale(s) ? 'failed' : s.status,
    ...(s.img ? { img: imageUrl(blobKey(uid), s.img) } : {}),
    ...(s.desc ? { desc: s.desc } : {}),
    ...(s.sentAt ? { sentAt: s.sentAt } : {}),
    ...(s.ai ? { ai: s.ai } : {}),
    tries: s.tries || [],
    left: left(s),
    ...(bestOf(s) !== undefined ? { best: bestOf(s) } : {}),
    ...(s.final ? { final: s.final } : {}),
    ...(s.error || stale(s) ? { error: s.error || ERRORS.timeout } : {}),
    open,
    aiReady: aiConfigured(),
  };
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
  const fresh: Stored = { name: a.name.slice(0, 80), group, code, at: now, status: 'new' };
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

/** AI bilan baholash va natijani saqlash. counted — muvaffaqiyatli baho urinish sifatida yoziladimi. */
async function runGrade(uid: string, s: Stored, now: number, replaceLast = false): Promise<Stored> {
  const img = await readImage(blobKey(uid));
  check(img && s.desc, 409, 'Avval logotip va ta’rifni yuboring.');
  const brief = briefOf(s.code)!;
  // Ish (yangi rasm va ta'rif) baholashdan oldin to'liq saqlanadi: funksiya vaqti tugab qolsa ham rasm va ta'rif
  // mos keladi, «Qayta baholash» esa aynan shu ishni baholaydi.
  const pending: Stored = { ...s, status: 'pending', lock: now };
  delete pending.error;
  await siteUpdate({ ['logoTask/s/' + uid]: pending });
  let next: Stored;
  try {
    const ai = await gradeLogo(img!, brief, s.desc!, s.lang || 'uz', now);
    const tries = [...(s.tries || [])];
    if (replaceLast && tries.length) tries[tries.length - 1] = { at: now, score: ai.score };
    else tries.push({ at: now, score: ai.score });
    next = { ...s, ai, tries, status: 'graded' };
    delete next.error;
    delete next.lock;
  } catch (e) {
    const queued = e instanceof LogoAiError && e.message === 'not-configured';
    next = { ...s, status: queued ? 'queued' : 'failed', error: errorText(e) };
    delete next.lock;
    if (!(e instanceof LogoAiError)) console.error('logo-ai', e);
  }
  await siteUpdate({ ['logoTask/s/' + uid]: next });
  return next;
}

/** Talaba: logotip rasmi va ta'rifini yuboradi; sun'iy intellekt darhol baholaydi. */
export async function submitLogo(
  a: Actor,
  bytes: Buffer,
  rawDesc: string,
  lang: Lang,
  now = Date.now(),
) {
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
    !(s.status === 'pending' && now - (s.lock || 0) < LOCK_MS),
    409,
    'Oldingi yuborilgan ish hali baholanmoqda — biroz kuting.',
  );
  check(
    left(s) > 0,
    429,
    'Urinishlar tugadi. Qo‘shimcha urinish kerak bo‘lsa, o‘qituvchiga yozing.',
  );
  const saved = await storeBlob(blobKey(uid), bytes, now);
  const sent: Stored = {
    ...s,
    name: a.name.slice(0, 80),
    group: (a.classId || s.group || '').slice(0, 40),
    img: saved.v,
    desc,
    lang,
    sentAt: now,
  };
  delete sent.ai;
  const next = await runGrade(uid, sent, now);
  return { task: view(uid, next, cfg.open) };
}

/** Talaba: AI ulanmagan yoki xato bo'lgan holda joriy ishni qayta baholatish (yangi urinish sarflanmaydi). */
export async function retryLogo(a: Actor, now = Date.now()) {
  const [{ uid, s }, cfg] = await Promise.all([ensure(a, now), config()]);
  check(
    s.status === 'failed' ||
      s.status === 'queued' ||
      (s.status === 'pending' && now - (s.lock || 0) > LOCK_MS),
    409,
    'Ish allaqachon baholangan.',
  );
  check(left(s) > 0, 429, 'Urinishlar tugadi.');
  const next = await runGrade(uid, s, now);
  return { task: view(uid, next, cfg.open) };
}

/* ---------- O'qituvchi va administrator ---------- */

export async function logoTaskList(a: Actor) {
  staff(a);
  const [all, cfg] = await Promise.all([siteGet<Record<string, Stored>>('logoTask/s'), config()]);
  const rows: LogoTaskRow[] = Object.entries(all || {})
    .filter(([, s]) => s?.code && briefOf(s.code))
    .map(([uid, s]) => {
      const { open: _o, aiReady: _r, ...v } = view(uid, s, cfg.open);
      return { ...v, uid, name: s.name, group: s.group, extra: s.extra || 0 };
    })
    .sort(
      (x, y) =>
        x.group.localeCompare(y.group) ||
        x.name.localeCompare(y.name, 'uz') ||
        x.uid.localeCompare(y.uid),
    );
  return { rows, open: cfg.open, aiReady: aiConfigured() };
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
  z.object({ op: z.literal('extra'), uid: UID }).strict(),
  z.object({ op: z.literal('regrade'), uid: UID }).strict(),
  z.object({ op: z.literal('gradeQueued') }).strict(),
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
  if (v.op === 'gradeQueued') {
    check(aiConfigured(), 409, 'Sun’iy intellekt kaliti (ANTHROPIC_API_KEY) hali qo‘yilmagan.');
    const all = (await siteGet<Record<string, Stored>>('logoTask/s')) || {};
    const waiting = Object.entries(all)
      .filter(
        ([, s]) =>
          s?.desc &&
          s.img &&
          (s.status === 'queued' ||
            s.status === 'failed' ||
            (s.status === 'pending' && now - (s.lock || 0) > LOCK_MS)),
      )
      .slice(0, 3);
    await Promise.all(waiting.map(([uid, s]) => runGrade(uid, s, Date.now())));
    return { ...(await logoTaskList(a)), graded: waiting.length };
  }
  const path = 'logoTask/s/' + v.uid;
  const s = await siteGet<Stored>(path);
  if (!s?.code) throw new ApiError(404, 'Talaba yozuvi topilmadi.');
  if (v.op === 'grade')
    await siteUpdate({
      [path + '/final']: {
        score: v.score,
        by: (a.name || a.id).slice(0, 80),
        at: now,
        ...(v.note ? { note: v.note } : {}),
      },
    });
  else if (v.op === 'clearGrade') await siteUpdate({ [path + '/final']: null });
  else if (v.op === 'extra') await siteUpdate({ [path + '/extra']: (s.extra || 0) + 1 });
  else if (v.op === 'regrade') {
    check(aiConfigured(), 409, 'Sun’iy intellekt kaliti (ANTHROPIC_API_KEY) hali qo‘yilmagan.');
    check(s.desc && s.img, 409, 'Talaba hali ish yubormagan.');
    check(
      !(s.status === 'pending' && now - (s.lock || 0) < LOCK_MS),
      409,
      'Ish hozir baholanmoqda.',
    );
    await runGrade(v.uid, s, now, s.status === 'graded');
  }
  return logoTaskList(a);
}
