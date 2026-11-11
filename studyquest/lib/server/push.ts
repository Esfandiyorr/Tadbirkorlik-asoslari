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
   Nima yuboriladi:
   ⚡ jonli test (va Yozuv marafoni) boshlanishidan 15 daqiqa oldin — «… da boshlanadi, qo'shilish … da ochiladi»;
      har o'yin uchun bir marta (site/push/sent/<o'yin>). Tekshiruvni har ochiq sahifaning e'lonlar so'rovi va
      /api/push?view=tick (GitHub Actions har 5 daqiqada) ishga tushiradi;
   📢 administrator yangi e'lon qo'shganda («Telefonlarga ham yuborilsin» belgisi bilan);
   🧪 foydalanuvchining o'zi «Sinab ko'rish» ni bosganda — faqat o'z qurilmalariga. */

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
/** Sinovlar uchun: keshlangan kalitni unutish. */
export function forgetVapid() {
  vapidCache = null;
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
export async function subscribePush(a: Actor, raw: unknown, now = Date.now()) {
  const s = subscription.parse(raw);
  const rec: PushSub = {
    e: s.endpoint,
    p: s.keys.p256dh.replace(/=+$/, ''),
    a: s.keys.auth.replace(/=+$/, ''),
    uid: a.id,
    role: a.role,
    ...(a.learnerType ? { lt: a.learnerType } : {}),
    ...(a.classId ? { g: String(a.classId).slice(0, 40) } : {}),
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

/** Administrator: e'lonni hammaga yuborish. */
export async function broadcastPush(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = z
    .object({
      t: z.string().trim().min(2).max(80),
      b: z.string().trim().max(300),
      u: z
        .string()
        .trim()
        .max(300)
        .refine((x) => !x || /^https:\/\/\S+$/.test(x) || /^\/#[a-z][a-z0-9/_-]*$/i.test(x)),
    })
    .strict()
    .parse(raw);
  return sendPush({ t: v.t, b: v.b, u: v.u || '/#home', g: 'sq-news' }, () => true, now);
}

/* ---------- ⚡ jonli test eslatmasi ---------- */
export const LIVE_REMIND_MS = 15 * 60000;
const hm = (ms: number) => new Date(ms + 18000000).toISOString().slice(11, 16);
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
/** Bir marta bajariladigan amal belgisi (bir vaqtda bir necha server tekshirsa ham faqat bittasi yuboradi). */
async function claimOnce(key: string, now: number) {
  const path = 'push/sent/' + key.replace(/[^0-9A-Za-z_-]/g, '_').slice(0, 80);
  if (demo()) {
    if (await siteGet(path)) return false;
    await siteUpdate({ [path]: now });
    return true;
  }
  const r = await legacyDb()
    .ref('site/' + path)
    .transaction((cur) => (cur ? undefined : now));
  return r.committed;
}
/** Jonli test boshlanishidan 15 daqiqa oldin (boshlanguncha) — bir marta, mustaqil o'quvchilardan boshqa hammaga. */
export async function liveReminder(now = Date.now()) {
  const g = await liveGame(now);
  if (!g || now < g.start - LIVE_REMIND_MS || now >= g.start) return null;
  if (!(await claimOnce('live-' + g.d + '-' + g.start, now))) return null;
  return {
    game: g.d,
    ...(await sendPush(liveReminderText(g), (s) => s.lt !== 'independent', now)),
  };
}
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
