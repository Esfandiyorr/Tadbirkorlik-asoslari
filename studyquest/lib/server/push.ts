import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import { administrator, check } from './auth';
import { demo, legacyDb } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { liveGame, type LiveGame } from './news';

/* 🔔 Telefonga (va kompyuterga) bildirishnoma — yangi sayt ilovasining o'z Web Push xizmati.
   Ilovani o'rnatganlar ham, saytni brauzerda ochganlar ham «🔔 Yoqish» ni bossa bo'ldi: brauzer obunasi serverga
   yuboriladi va site/push/subs/<iz> ga yoziladi (site/* — faqat server o'qiydi va yozadi).
   Kalitlar (VAPID) birinchi marta kerak bo'lganda server o'zi yaratadi va site/push/vapid da saqlaydi — sozlash shart emas.
   Shifrlash va imzo — RFC 8291 (aes128gcm) va RFC 8292 (VAPID), eski Cloudflare Worker'dagi (fayllar/push-worker.js)
   bilan bir xil, faqat qo'shimcha kutubxonasiz Node'ning WebCrypto'sida.
   Nima yuboriladi («Sayt boshqaruvi → 🔔 Bildirishnomalar»da har birini yoqish/o'chirish mumkin — site/push/auto):
   📅 jonli test e'loni — o'yindan 14 soat oldin yoki u tuzilganda («Bugun/Ertaga 21:30 da jonli test»);
   ⚡ jonli test (va Yozuv marafoni) boshlanishidan 15 daqiqa (sozlanadi) oldin — «… da boshlanadi»;
      ikkalasi ham har o'yin uchun bir marta (site/push/sent/<o'yin>). Tekshiruvni har ochiq sahifaning e'lonlar
      so'rovi, administratorning jonli test amallari va /api/push?view=tick (GitHub Actions har 5 daqiqada) qiladi;
   🟢 «Mavzular holati»da mavzu ochilganda — talabalarga;
   📢 administrator yangi e'lon qo'shganda («Telefonlarga ham yuborilsin» belgisi bilan);
   📺 mavzuga yangi video qo'shilganda;
   ✉️ administrator o'zi yozgan xabar — hammaga, talabalarga, o'qituvchilarga yoki bitta guruhga;
   🧪 foydalanuvchining o'zi «Sinab ko'rish» ni bosganda — faqat o'z qurilmalariga.
   Har yuborish tarixga yoziladi (site/push/log, oxirgi 50 ta). */

const { subtle } = globalThis.crypto;
const te = new TextEncoder();
const b64u = (b: Uint8Array) => Buffer.from(b).toString('base64url');
const ub64 = (s: string) => new Uint8Array(Buffer.from(String(s), 'base64url'));
const cat = (...a: Uint8Array[]) => {
  const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let i = 0;
  for (const x of a) {
    o.set(x, i);
    i += x.length;
  }
  return o;
};
const asBuf = (b: Uint8Array) => b as Uint8Array<ArrayBuffer>;

export type Vapid = { pub: string; d: string; at: number };
export type PushSub = {
  e: string;
  p: string;
  a: string;
  /** egasi: foydalanuvchi, roli, o'quvchi turi, guruhi */
  uid: string;
  role: string;
  lt?: string;
  g?: string;
  /** o'rnatilgan ilovadan (bosh ekrandagi) yoqilgan */
  app?: boolean;
  at: number;
};
export type PushPayload = { t: string; b: string; u: string; g: string };

/* ---------- 🔐 kalitlar ---------- */
export async function newVapid(now = Date.now()): Promise<Vapid> {
  const k = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const pub = new Uint8Array(await subtle.exportKey('raw', k.publicKey));
  const jwk = await subtle.exportKey('jwk', k.privateKey);
  return { pub: b64u(pub), d: String(jwk.d), at: now };
}
let vapidCache: Vapid | null = null;
/** Saytning push kalitlari: bo'lmasa — yaratiladi (bir vaqtda ikki server yaratsa ham bittasi qoladi). */
export async function vapidKeys(): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  let v = await siteGet<Vapid>('push/vapid');
  if (!v?.pub || !v?.d) {
    const fresh = await newVapid();
    if (demo()) {
      await siteUpdate({ 'push/vapid': fresh });
      v = fresh;
    } else {
      const r = await legacyDb()
        .ref('site/push/vapid')
        .transaction((cur) => (cur && cur.pub && cur.d ? undefined : fresh));
      v = (r.snapshot.val() as Vapid) || fresh;
    }
  }
  vapidCache = v;
  return v;
}
/** Sinovlar uchun: keshlangan kalit, sozlama va «yuborildi» belgilarini unutish. */
export function forgetVapid() {
  vapidCache = null;
  autoCache = null;
  claimed.clear();
}

/** VAPID (RFC 8292): push xizmatiga «bu xabar shu sayt egasidan» degan imzo. */
export async function vapidAuth(endpoint: string, v: Vapid, now = Date.now()) {
  const pub = ub64(v.pub);
  const key = await subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: v.d,
      x: b64u(pub.slice(1, 33)),
      y: b64u(pub.slice(33, 65)),
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const head = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(
    te.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now / 1000) + 12 * 3600,
        sub: 'mailto:noreply@terdu.uz',
      }),
    ),
  );
  const sig = new Uint8Array(
    await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body)),
  );
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + v.pub;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const k = await subtle.importKey('raw', asBuf(ikm), 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: asBuf(salt), info: asBuf(info) },
      k,
      len * 8,
    ),
  );
}
/** Xabarni shifrlash (RFC 8291, aes128gcm). */
export async function encryptPush(payload: string, p256dh: string, authSecret: string) {
  const uaPub = ub64(p256dh),
    auth = ub64(authSecret);
  const eph = (await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const asPub = new Uint8Array(await subtle.exportKey('raw', eph.publicKey));
  const uaKey = await subtle.importKey(
    'raw',
    asBuf(uaPub),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256),
  );
  const ikm = await hkdf(auth, shared, cat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await subtle.importKey('raw', asBuf(cek), 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(
    await subtle.encrypt(
      { name: 'AES-GCM', iv: asBuf(nonce) },
      key,
      asBuf(cat(te.encode(payload), new Uint8Array([2]))),
    ),
  );
  return cat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, ct);
}

/* ---------- 📇 obunalar ---------- */
/** Faqat ma'lum push xizmatlari (Google, Apple, Mozilla, Microsoft) — server boshqa manzilga so'rov yubormaydi. */
export function pushHostOk(endpoint: string) {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== 'https:' || u.port) return false;
    const h = u.hostname;
    return (
      h === 'fcm.googleapis.com' ||
      h === 'android.googleapis.com' ||
      h === 'updates.push.services.mozilla.com' ||
      h.endsWith('.push.apple.com') ||
      h.endsWith('.notify.windows.com')
    );
  } catch {
    return false;
  }
}
const subKey = (endpoint: string) =>
  createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
const b64key = (min: number, max: number) =>
  z
    .string()
    .regex(/^[A-Za-z0-9_-]+={0,2}$/)
    .refine((v) => {
      const n = ub64(v).length;
      return n >= min && n <= max;
    }, 'Obuna kaliti noto‘g‘ri');
const subscription = z
  .object({
    endpoint: z
      .string()
      .max(1000)
      .refine(pushHostOk, 'Bu brauzer bildirishnoma xizmati qo‘llab-quvvatlanmaydi.'),
    keys: z.object({ p256dh: b64key(65, 65), auth: b64key(16, 16) }).passthrough(),
  })
  .passthrough();

export async function pushSubs(): Promise<Record<string, PushSub>> {
  return (await siteGet<Record<string, PushSub>>('push/subs')) || {};
}
/** Foydalanuvchi qurilmasini obuna qilish (har qurilma — alohida yozuv; eski egasi bo'lsa almashtiriladi). */
export async function subscribePush(a: Actor, raw: unknown, now = Date.now(), app = false) {
  const s = subscription.parse(raw);
  const rec: PushSub = {
    e: s.endpoint,
    p: s.keys.p256dh.replace(/=+$/, ''),
    a: s.keys.auth.replace(/=+$/, ''),
    uid: a.id,
    role: a.role,
    ...(a.learnerType ? { lt: a.learnerType } : {}),
    ...(a.classId ? { g: String(a.classId).slice(0, 40) } : {}),
    ...(app ? { app: true } : {}),
    at: now,
  };
  await siteUpdate({ ['push/subs/' + subKey(s.endpoint)]: rec });
  return { ok: true, devices: await countMine(a.id) };
}
export async function unsubscribePush(a: Actor, raw: unknown) {
  const { endpoint } = z.object({ endpoint: z.string().max(1000) }).parse(raw);
  const key = subKey(endpoint),
    cur = await siteGet<PushSub>('push/subs/' + key);
  if (cur && (cur.uid === a.id || a.role === 'admin'))
    await siteUpdate({ ['push/subs/' + key]: null });
  return { ok: true, devices: await countMine(a.id) };
}
async function countMine(uid: string) {
  return Object.values(await pushSubs()).filter((s) => s?.uid === uid).length;
}

/* ---------- 📤 yuborish ---------- */
type Sender = (s: PushSub, body: Uint8Array, headers: Record<string, string>) => Promise<number>;
const httpSender: Sender = async (s, body, headers) =>
  (
    await fetch(s.e, {
      method: 'POST',
      body: asBuf(body),
      headers,
      signal: AbortSignal.timeout(10000),
    })
  ).status;
/** Demo/sinov: tashqi push xizmatiga so'rov yuborilmaydi — «yuborilgan» xabarlar shu ro'yxatga tushadi. */
export const demoOutbox: { sub: PushSub; payload: PushPayload }[] = ((
  globalThis as { __sqPushOutbox?: { sub: PushSub; payload: PushPayload }[] }
).__sqPushOutbox ??= []);
let sender: Sender | null = null;
/** Sinovlar uchun yuboruvchini almashtirish (null — odatiy). */
export function setPushSender(s: Sender | null) {
  sender = s;
}

export async function sendPush(
  payload: PushPayload,
  who: (s: PushSub) => boolean = () => true,
  now = Date.now(),
) {
  const subs = Object.entries(await pushSubs()).filter(([, s]) => s?.e && s.p && s.a && who(s));
  const body = JSON.stringify({
    t: payload.t.slice(0, 80),
    b: payload.b.slice(0, 300),
    u: payload.u.slice(0, 300),
    g: payload.g.slice(0, 40),
  });
  let sent = 0,
    failed = 0;
  const gone: Record<string, null> = {};
  if (demo() && !sender) {
    for (const [, s] of subs) demoOutbox.push({ sub: s, payload: JSON.parse(body) });
    return { total: subs.length, sent: subs.length, failed: 0, removed: 0 };
  }
  const v = await vapidKeys();
  const send = sender || httpSender;
  for (let i = 0; i < subs.length; i += 25)
    await Promise.all(
      subs.slice(i, i + 25).map(async ([k, s]) => {
        let code = 0;
        try {
          if (!pushHostOk(s.e)) throw 0;
          code = await send(s, await encryptPush(body, s.p, s.a), {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            TTL: '3600',
            Urgency: 'high',
            Authorization: await vapidAuth(s.e, v, now),
          });
        } catch {
          code = 0;
        }
        if (code >= 200 && code < 300) sent++;
        else {
          failed++;
          // obuna bekor qilingan yoki kalit mos emas — o'chiriladi
          if (code === 404 || code === 410 || code === 403 || !pushHostOk(s.e))
            gone['push/subs/' + k] = null;
        }
      }),
    );
  if (Object.keys(gone).length) await siteUpdate(gone);
  return { total: subs.length, sent, failed, removed: Object.keys(gone).length };
}

/* ---------- ⚙️ avtomatik xabarlar sozlamasi ---------- */
export type PushAuto = {
  /** ⚡ jonli test boshlanishidan oldin eslatma */
  live: boolean;
  /** necha daqiqa oldin (5–60) */
  liveMin: number;
  /** 📅 jonli test e'loni (14 soat oldin yoki tuzilganda) */
  liveNew: boolean;
  /** 🟢 mavzu ochilganda */
  topics: boolean;
  /** 📢 yangi e'lon — «Telefonlarga ham yuborilsin» belgisi odatda yoqilgan */
  news: boolean;
  /** 📺 mavzuga yangi video qo'shilganda */
  videos: boolean;
};
export const PUSH_AUTO_DEFAULT: PushAuto = {
  live: true,
  liveMin: 15,
  liveNew: true,
  topics: true,
  news: true,
  videos: true,
};
const autoInput = z
  .object({
    live: z.boolean(),
    liveMin: z.number().int().min(5).max(60),
    liveNew: z.boolean(),
    topics: z.boolean(),
    news: z.boolean(),
    videos: z.boolean(),
  })
  .strict();
let autoCache: { v: PushAuto; at: number } | null = null;
function normalizeAuto(raw: Partial<PushAuto> | null): PushAuto {
  const v = { ...PUSH_AUTO_DEFAULT };
  for (const k of ['live', 'liveNew', 'topics', 'news', 'videos'] as const)
    if (typeof raw?.[k] === 'boolean') v[k] = raw[k];
  const m = Math.round(Number(raw?.liveMin));
  if (m >= 5 && m <= 60) v.liveMin = m;
  return v;
}
/** Avtomatik xabarlar sozlamasi (bir daqiqa xotirada saqlanadi — tez-tez tekshiriladi). */
export async function pushAuto(): Promise<PushAuto> {
  if (autoCache && Date.now() - autoCache.at < 60000) return autoCache.v;
  const v = normalizeAuto(await siteGet<Partial<PushAuto>>('push/auto'));
  autoCache = { v, at: Date.now() };
  return v;
}

/* ---------- 🕘 tarix ---------- */
export type PushKind = 'manual' | 'test' | 'live' | 'ann' | 'topic' | 'news' | 'video';
export type PushLog = {
  at: number;
  k: PushKind;
  t: string;
  b: string;
  /** kimga: all · students · staff · g:<guruh> · live (mustaqil o'quvchilardan boshqa hamma) · self */
  aud: string;
  n: number;
  s: number;
  f: number;
  by?: string;
};
const LOG_KEEP = 50;
/** bir millisekundda bir nechta yozuv bo'lsa ham tartibi saqlansin (kalit bo'yicha saralanadi) */
let logSeq = 0;
async function logPush(e: PushLog) {
  logSeq = (logSeq + 1) % 1296;
  const key =
    e.at.toString(36).padStart(9, '0') +
    '-' +
    logSeq.toString(36).padStart(2, '0') +
    Math.random().toString(36).slice(2, 6);
  await siteUpdate({ ['push/log/' + key]: e });
  const all = Object.keys((await siteGet<Record<string, PushLog>>('push/log')) || {}).sort();
  if (all.length > LOG_KEEP)
    await siteUpdate(
      Object.fromEntries(all.slice(0, all.length - LOG_KEEP).map((k) => ['push/log/' + k, null])),
    );
}
export async function pushLog(): Promise<PushLog[]> {
  const raw = (await siteGet<Record<string, PushLog>>('push/log')) || {};
  return Object.keys(raw)
    .sort()
    .reverse()
    .map((k) => raw[k])
    .filter(Boolean);
}

/* ---------- 🎯 kimga ---------- */
const audience = z.union([
  z.enum(['all', 'students', 'staff']),
  z.string().regex(/^g:[^\s/.#$[\]]{1,40}$/),
]);
export type Audience = z.infer<typeof audience>;
export function audienceFilter(aud: string): (s: PushSub) => boolean {
  if (aud === 'students') return (s) => s.role === 'student';
  if (aud === 'staff') return (s) => s.role === 'teacher' || s.role === 'admin';
  if (aud === 'live') return (s) => s.lt !== 'independent';
  if (aud.startsWith('g:')) return (s) => s.role === 'student' && s.g === aud.slice(2);
  return () => true;
}
/** Yuborish va tarixga yozish. */
async function deliver(
  k: PushKind,
  payload: PushPayload,
  aud: string,
  now: number,
  by?: string,
  who = audienceFilter(aud),
) {
  const r = await sendPush(payload, who, now);
  await logPush({
    at: now,
    k,
    t: payload.t.slice(0, 80),
    b: payload.b.slice(0, 300),
    aud,
    n: r.total,
    s: r.sent,
    f: r.failed,
    ...(by ? { by: by.slice(0, 60) } : {}),
  }).catch(() => {});
  return r;
}

/** Foydalanuvchining o'z qurilmalariga sinov xabari. */
export async function testPush(a: Actor, now = Date.now()) {
  const r = await sendPush(
    {
      t: '🔔 Bildirishnomalar ishlayapti',
      b: 'Jonli test boshlanishi va yangi e’lonlar haqida shu yerga xabar keladi.',
      u: '/#home',
      g: 'sq-test',
    },
    (s) => s.uid === a.id,
    now,
  );
  check(r.total > 0, 404, 'Bu hisobda yoqilgan qurilma yo‘q — avval «🔔 Yoqish» ni bosing.');
  return r;
}

const link = z
  .string()
  .trim()
  .max(300)
  .refine((x) => !x || /^https:\/\/\S+$/.test(x) || /^\/#[a-z][a-z0-9/_-]*$/i.test(x));
const message = z
  .object({
    t: z.string().trim().min(2).max(80),
    b: z.string().trim().max(300),
    u: link,
    aud: audience.optional(),
    /** faqat o'z qurilmalarimga (sinab ko'rish) */
    self: z.boolean().optional(),
  })
  .strict();

/** Administrator: xabarni yuborish — hammaga yoki tanlanganlarga (self — faqat o'ziga, sinov uchun). */
export async function broadcastPush(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = message.parse(raw);
  const payload = { t: v.t, b: v.b, u: v.u || '/#home', g: 'sq-news' };
  if (v.self) {
    const r = await sendPush(payload, (s) => s.uid === a.id, now);
    check(
      r.total > 0,
      404,
      'Sizning hisobingizda yoqilgan qurilma yo‘q — avval «🔔 Yoqish» ni bosing.',
    );
    return r;
  }
  return deliver('manual', payload, v.aud || 'all', now, a.name || a.id);
}

/** 📢 Yangi e'lon (E'lonlar bo'limidan) — hammaga. */
export async function newsPush(a: Actor, h: string, text: string, now = Date.now()) {
  administrator(a);
  return deliver(
    'news',
    {
      t: ('📢 ' + (h.trim() || 'Yangi e’lon')).slice(0, 80),
      b: text.replace(/\s+/g, ' ').trim().slice(0, 280),
      u: '/#home',
      g: 'sq-news',
    },
    'all',
    now,
    a.name || a.id,
  );
}

/* ---------- ⚡ jonli test: e'lon va eslatma ---------- */
export const LIVE_REMIND_MS = 15 * 60000;
/** 📅 e'lon o'yindan shuncha oldin ketadi (21:30 dagi o'yin — 07:30 da, 09:30 dagi — kechqurun 19:30 da). */
export const LIVE_ANNOUNCE_MS = 14 * 3600000;
const hm = (ms: number) => new Date(ms + 18000000).toISOString().slice(11, 16);
const tDay = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 10);
export function liveReminderText(g: LiveGame): PushPayload {
  const yz = g.type === 'yz';
  return {
    t: (yz ? '⌨️ Yozuv marafoni ' : '⚡ Jonli test ') + hm(g.start) + ' da boshlanadi',
    b:
      'Qo‘shilish ' +
      hm(g.open) +
      ' da ochiladi' +
      (!yz && g.nq ? ' · ' + g.nq + ' ta savol' : '') +
      '. Kechikmang — o‘yin boshlangach qo‘shilib bo‘lmaydi!' +
      (g.note ? ' ' + g.note : ''),
    u: '/#arena/play/' + (yz ? 'yozuv' : 'live'),
    g: 'sq-live',
  };
}
export function liveAnnounceText(g: LiveGame, now: number, remindMin = 0): PushPayload {
  const yz = g.type === 'yz';
  const day =
    tDay(g.start) === tDay(now)
      ? 'Bugun'
      : tDay(g.start) === tDay(now + 86400000)
        ? 'Ertaga'
        : tDay(g.start).slice(8, 10) + '.' + tDay(g.start).slice(5, 7) + ' kuni';
  return {
    t: '📅 ' + day + ' ' + hm(g.start) + ' da ' + (yz ? 'Yozuv marafoni' : 'jonli test'),
    b:
      'Qo‘shilish ' +
      hm(g.open) +
      ' da ochiladi' +
      (!yz && g.nq ? ' · ' + g.nq + ' ta savol' : '') +
      '.' +
      (remindMin ? ' Boshlanishidan ' + remindMin + ' daqiqa oldin yana eslatamiz.' : '') +
      (g.note ? ' ' + g.note : ''),
    u: '/#arena/play/' + (yz ? 'yozuv' : 'live'),
    g: 'sq-live-new',
  };
}
/** Bir marta bajariladigan amal belgisi (bir vaqtda bir necha server tekshirsa ham faqat bittasi yuboradi). */
const claimed = new Set<string>();
async function claimOnce(key: string, now: number) {
  const path = 'push/sent/' + key.replace(/[^0-9A-Za-z_-]/g, '_').slice(0, 80);
  if (claimed.has(path)) return false;
  let ok: boolean;
  if (demo()) {
    ok = !(await siteGet(path));
    if (ok) await siteUpdate({ [path]: now });
  } else {
    const r = await legacyDb()
      .ref('site/' + path)
      .transaction((cur) => (cur ? undefined : now));
    ok = r.committed;
  }
  claimed.add(path);
  return ok;
}
/** Eslatma oynasi: o'yindan shuncha oldin (sozlamaga ko'ra; o'chirilgan bo'lsa — 0). */
const remindMs = (auto: PushAuto) => (auto.live ? auto.liveMin * 60000 : 0);
/** ⚡ Boshlanishidan N daqiqa oldin (boshlanguncha) — bir marta, mustaqil o'quvchilardan boshqa hammaga. */
export async function liveReminder(now = Date.now(), game?: LiveGame | null) {
  const auto = await pushAuto();
  if (!auto.live) return null;
  const g = game === undefined ? await liveGame(now) : game;
  if (!g || now < g.start - remindMs(auto) || now >= g.start) return null;
  if (!(await claimOnce('live-' + g.d + '-' + g.start, now))) return null;
  return { game: g.d, ...(await deliver('live', liveReminderText(g), 'live', now)) };
}
/** 📅 O'yindan 14 soat oldin (yoki tuzilgan zahoti) — bir marta. Eslatma 10 daqiqadan kam qolgan bo'lsa, faqat
    eslatma ketadi (ikki xabar ketma-ket kelmasin). */
export async function liveAnnounce(now = Date.now(), game?: LiveGame | null) {
  const auto = await pushAuto();
  if (!auto.liveNew) return null;
  const g = game === undefined ? await liveGame(now) : game;
  if (!g) return null;
  const cut = g.start - (auto.live ? remindMs(auto) + 10 * 60000 : 0);
  if (now < g.start - LIVE_ANNOUNCE_MS || now >= cut) return null;
  if (!(await claimOnce('ann-' + g.d + '-' + g.start, now))) return null;
  return {
    game: g.d,
    ...(await deliver('ann', liveAnnounceText(g, now, auto.live ? auto.liveMin : 0), 'live', now)),
  };
}
/** Hammasini bir tekshiruvda: e'lon va eslatma (vaqti kelmagan bo'lsa — hech narsa, bazaga ham yozilmaydi). */
export async function pushTick(now = Date.now(), game?: LiveGame | null) {
  const g = game === undefined ? await liveGame(now) : game;
  const ann = await liveAnnounce(now, g);
  const rem = await liveReminder(now, g);
  return { ann, rem };
}

/* ---------- 🟢 mavzu, 📺 video ---------- */
const dm = (ms: number) => {
  const d = new Date(ms + 18000000).toISOString();
  return d.slice(8, 10) + '.' + d.slice(5, 7) + ' ' + d.slice(11, 16);
};
/** Mavzu ochilganda (🟢 ball bilan yoki 📖 o'qish uchun) — talabalarga, bir soatda bir marta. */
export async function topicPush(
  t: { id: string; order: number; title: string; state: string; due?: number },
  now = Date.now(),
) {
  if (!(await pushAuto()).topics) return null;
  if (t.state !== 'open' && t.state !== 'read') return null;
  if (!(await claimOnce('topic-' + t.id + '-' + t.state + '-' + Math.floor(now / 3600000), now)))
    return null;
  const n = t.order + 1;
  return deliver(
    'topic',
    t.state === 'open'
      ? {
          t: '🟢 ' + n + '-mavzu ochildi',
          b: t.title + (t.due ? ' · Ball yig‘ish muddati: ' + dm(t.due) + ' gacha.' : ''),
          u: '/#lesson/' + t.id,
          g: 'sq-topic-' + t.id,
        }
      : {
          t: '📖 ' + n + '-mavzu o‘qish uchun ochildi',
          b: t.title,
          u: '/#lesson/' + t.id,
          g: 'sq-topic-' + t.id,
        },
    'students',
    now,
  );
}
/** Mavzuga yangi video qo'shilganda — talabalarga. */
export async function videoPush(
  topic: { id: string; title: string },
  title: string | undefined,
  now = Date.now(),
) {
  if (!(await pushAuto()).videos) return null;
  const name = topic.title.replace(/^M(\d+)\s*·\s*/, '$1-mavzu: ');
  return deliver(
    'video',
    {
      t: '📺 Yangi video: ' + (title || name).slice(0, 60),
      b: title ? name : 'Videoni sayt ichida ko‘rasiz.',
      u: '/#lesson/' + topic.id,
      g: 'sq-video',
    },
    'students',
    now,
  );
}

/* ---------- 🛠 administrator bo'limi ---------- */
/** Administrator ko'radigan holat: nechta qurilma yoqilgan. */
export async function pushStats(a: Actor) {
  check(a.role === 'admin' || a.role === 'teacher', 403, 'Faqat o‘qituvchi va administrator.');
  const subs = Object.values(await pushSubs());
  return {
    devices: subs.length,
    users: new Set(subs.map((s) => s.uid)).size,
    students: new Set(subs.filter((s) => s.role === 'student').map((s) => s.uid)).size,
  };
}

/** «🔔 Bildirishnomalar» bo'limi: qurilmalar, guruhlar, sozlama, navbatdagi jonli test xabarlari va tarix. */
export async function pushAdmin(a: Actor, now = Date.now()) {
  administrator(a);
  const [subsRaw, auto, log, g] = await Promise.all([
    pushSubs(),
    pushAuto(),
    pushLog(),
    liveGame(now).catch(() => null),
  ]);
  const subs = Object.values(subsRaw).filter(Boolean);
  const users = (f: (s: PushSub) => boolean) => new Set(subs.filter(f).map((s) => s.uid)).size;
  const groups: Record<string, { devices: number; users: Set<string> }> = {};
  for (const s of subs)
    if (s.role === 'student' && s.g) {
      const x = (groups[s.g] ||= { devices: 0, users: new Set() });
      x.devices++;
      x.users.add(s.uid);
    }
  const rm = remindMs(auto);
  return {
    stats: {
      devices: subs.length,
      app: subs.filter((s) => s.app).length,
      browser: subs.filter((s) => !s.app).length,
      users: users(() => true),
      students: users((s) => s.role === 'student'),
      staff: users((s) => s.role === 'teacher' || s.role === 'admin'),
      studentDevices: subs.filter((s) => s.role === 'student').length,
      staffDevices: subs.filter((s) => s.role === 'teacher' || s.role === 'admin').length,
      mine: subs.filter((s) => s.uid === a.id).length,
    },
    groups: Object.entries(groups)
      .map(([g, x]) => ({ g, devices: x.devices, users: x.users.size }))
      .sort((x, y) => x.g.localeCompare(y.g)),
    auto,
    next: g
      ? {
          d: g.d,
          type: g.type,
          start: g.start,
          ...(auto.liveNew && now < g.start - (auto.live ? rm + 10 * 60000 : 0)
            ? { announceAt: Math.max(g.start - LIVE_ANNOUNCE_MS, now) }
            : {}),
          ...(auto.live && now < g.start ? { remindAt: Math.max(g.start - rm, now) } : {}),
          sentAnn: !!(await siteGet('push/sent/ann-' + g.d + '-' + g.start)),
          sentRem: !!(await siteGet('push/sent/live-' + g.d + '-' + g.start)),
        }
      : null,
    log,
    now,
  };
}
export type PushAdminView = Awaited<ReturnType<typeof pushAdmin>>;
const adminInput = z.discriminatedUnion('op', [
  z.object({ op: z.literal('settings'), auto: autoInput }).strict(),
  z.object({ op: z.literal('send'), msg: z.unknown() }).strict(),
]);
/** Administrator amallari: sozlamani saqlash yoki xabar yuborish. Yangi holat (+ yuborish natijasi) qaytadi. */
export async function managePush(
  a: Actor,
  raw: unknown,
  now = Date.now(),
): Promise<PushAdminView & { result?: Awaited<ReturnType<typeof sendPush>> }> {
  administrator(a);
  const p = adminInput.parse(raw);
  if (p.op === 'settings') {
    await siteUpdate({ 'push/auto': p.auto });
    autoCache = { v: normalizeAuto(p.auto), at: Date.now() };
    return pushAdmin(a, now);
  }
  const result = await broadcastPush(a, p.msg, now);
  return { ...(await pushAdmin(a, now)), result };
}
