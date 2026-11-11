import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import {
  LIVE_ANNOUNCE_MS,
  LIVE_REMIND_MS,
  broadcastPush,
  demoOutbox,
  encryptPush,
  forgetVapid,
  liveAnnounce,
  liveReminder,
  liveReminderText,
  managePush,
  pushAdmin,
  pushAuto,
  pushHostOk,
  pushTick,
  pushStats,
  pushSubs,
  sendPush,
  setPushSender,
  subscribePush,
  testPush,
  topicPush,
  unsubscribePush,
  vapidAuth,
  vapidKeys,
  videoPush,
} from '../lib/server/push';
import { demoKahoot, manageLive } from '../lib/server/live-admin';
import { resetSiteMemory } from '../lib/server/site-content';

/* 🔔 Bildirishnomalar: shifr (RFC 8291) va imzo (RFC 8292) haqiqiy brauzer ochadigan ko'rinishda, obuna faqat ma'lum
   push xizmatlariga, jonli test eslatmasi o'yin boshiga bir marta va mustaqil o'quvchilarga emas. */
const { subtle } = globalThis.crypto;
const b64u = (b: Uint8Array) => Buffer.from(b).toString('base64url');
const ub = (s: string) => new Uint8Array(Buffer.from(s, 'base64url'));
const te = new TextEncoder();

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
  forgetVapid();
  demoOutbox.length = 0;
  Object.assign(demoKahoot, { cfg: null, bank: {}, idx: {}, games: {}, res: {} });
});
afterEach(() => setPushSender(null));

const who = (id: string, role = 'student', learnerType = 'university') =>
  ({ id, uid: id, role, name: id, classId: 'AP-223', learnerType }) as unknown as Actor;
async function device(host = 'https://fcm.googleapis.com/fcm/send/') {
  const k = (await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const auth = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return {
    k,
    auth,
    sub: {
      endpoint: host + Math.random().toString(36).slice(2),
      expirationTime: null,
      keys: {
        p256dh: b64u(new Uint8Array(await subtle.exportKey('raw', k.publicKey))),
        auth: b64u(auth),
      },
    },
  };
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const key = await subtle.importKey('raw', ikm as BufferSource, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: salt as BufferSource, info: info as BufferSource },
      key,
      len * 8,
    ),
  );
}
/** Brauzer qiladigan ish: xabarni ochish (RFC 8291). */
async function open(d: Awaited<ReturnType<typeof device>>, body: Uint8Array) {
  const salt = body.slice(0, 16),
    idl = body[20],
    asPub = body.slice(21, 21 + idl),
    ct = body.slice(21 + idl);
  expect([...body.slice(16, 20)]).toEqual([0, 0, 16, 0]);
  const asKey = await subtle.importKey(
    'raw',
    asPub,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await subtle.deriveBits({ name: 'ECDH', public: asKey }, d.k.privateKey, 256),
  );
  const uaPub = ub(d.sub.keys.p256dh);
  const ikm = await hkdf(
    d.auth,
    shared,
    new Uint8Array([...te.encode('WebPush: info\0'), ...uaPub, ...asPub]),
    32,
  );
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const pt = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ct));
  return JSON.parse(new TextDecoder().decode(pt.slice(0, pt.lastIndexOf(2))));
}

it('encrypts like a browser expects and signs a valid VAPID token', async () => {
  const d = await device();
  const body = await encryptPush(
    JSON.stringify({ t: 'Salom', b: 'Matn' }),
    d.sub.keys.p256dh,
    d.sub.keys.auth,
  );
  expect(await open(d, body)).toEqual({ t: 'Salom', b: 'Matn' });
  const v = await vapidKeys();
  expect(ub(v.pub)).toHaveLength(65);
  expect(await vapidKeys()).toEqual(v); // bir marta yaratiladi
  const auth = await vapidAuth(d.sub.endpoint, v, Date.UTC(2026, 10, 11));
  const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(auth)!;
  expect(k).toBe(v.pub);
  const [h, p, sig] = jwt.split('.');
  expect(JSON.parse(Buffer.from(p, 'base64url').toString())).toMatchObject({
    aud: 'https://fcm.googleapis.com',
    sub: 'mailto:noreply@terdu.uz',
  });
  const pubKey = await subtle.importKey(
    'raw',
    ub(v.pub),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  expect(
    await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pubKey,
      ub(sig),
      te.encode(h + '.' + p),
    ),
  ).toBe(true);
});

it('accepts only real push services and keeps one record per device', async () => {
  expect(pushHostOk('https://fcm.googleapis.com/fcm/send/x')).toBe(true);
  expect(pushHostOk('https://web.push.apple.com/abc')).toBe(true);
  expect(pushHostOk('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
  expect(pushHostOk('https://wns2-par02p.notify.windows.com/w/?token=x')).toBe(true);
  expect(pushHostOk('http://fcm.googleapis.com/x')).toBe(false);
  expect(pushHostOk('https://evil.example/fcm.googleapis.com')).toBe(false);
  expect(pushHostOk('https://fcm.googleapis.com:8443/x')).toBe(false);
  expect(pushHostOk('https://169.254.169.254/latest')).toBe(false);

  const ali = who('legacy_ali'),
    d = await device();
  await expect(
    subscribePush(ali, { ...d.sub, endpoint: 'https://evil.example/x' }),
  ).rejects.toThrow();
  await expect(
    subscribePush(ali, { ...d.sub, keys: { p256dh: 'abc', auth: d.sub.keys.auth } }),
  ).rejects.toThrow();
  expect(await subscribePush(ali, d.sub)).toMatchObject({ ok: true, devices: 1 });
  expect(await subscribePush(ali, d.sub)).toMatchObject({ devices: 1 }); // takror — o'sha yozuv
  const subs = Object.values(await pushSubs());
  expect(subs).toHaveLength(1);
  expect(subs[0]).toMatchObject({
    uid: 'legacy_ali',
    role: 'student',
    lt: 'university',
    g: 'AP-223',
  });
  // boshqa foydalanuvchi birovning qurilmasini o'chira olmaydi
  await unsubscribePush(who('legacy_vali'), { endpoint: d.sub.endpoint });
  expect(Object.keys(await pushSubs())).toHaveLength(1);
  expect(await unsubscribePush(ali, { endpoint: d.sub.endpoint })).toMatchObject({ devices: 0 });
  expect(await pushSubs()).toEqual({});
});

it('sends to the right devices and forgets subscriptions the push service rejected', async () => {
  const a = await device(),
    b = await device(),
    gone = await device();
  await subscribePush(who('legacy_ali'), a.sub);
  await subscribePush(who('legacy_ali'), b.sub);
  await subscribePush(who('legacy_vali'), gone.sub);
  const seen: { e: string; payload: unknown; headers: Record<string, string> }[] = [];
  setPushSender(async (s, body, headers) => {
    const dev = [a, b, gone].find((x) => x.sub.endpoint === s.e)!;
    seen.push({ e: s.e, payload: await open(dev, body), headers });
    return dev === gone ? 410 : 201;
  });
  const r = await testPush(who('legacy_ali'));
  expect(r).toMatchObject({ total: 2, sent: 2, failed: 0 });
  expect(seen.map((x) => x.payload)).toEqual([
    expect.objectContaining({ t: '🔔 Bildirishnomalar ishlayapti', u: '/#home' }),
    expect.objectContaining({ t: '🔔 Bildirishnomalar ishlayapti' }),
  ]);
  expect(seen[0].headers).toMatchObject({ 'Content-Encoding': 'aes128gcm', Urgency: 'high' });
  expect(seen[0].headers.Authorization).toMatch(/^vapid t=.+, k=/);
  await expect(testPush(who('legacy_nobody'))).rejects.toMatchObject({ status: 404 });

  // administrator e'loni — hammaga; eskirgan obuna (410) o'chiriladi
  await expect(
    broadcastPush(who('legacy_ali'), { t: 'E’lon', b: 'x', u: '' }),
  ).rejects.toMatchObject({
    status: 403,
  });
  const all = await broadcastPush(who('owner', 'admin'), {
    t: '📢 Yangi e’lon',
    b: 'Ertaga dars yo‘q',
    u: '',
  });
  expect(all).toMatchObject({ total: 3, sent: 2, failed: 1, removed: 1 });
  expect(Object.values(await pushSubs()).map((s) => s.uid)).toEqual(['legacy_ali', 'legacy_ali']);
  expect(await pushStats(who('tc', 'teacher'))).toEqual({ devices: 2, users: 1, students: 1 });
  await expect(pushStats(who('legacy_ali'))).rejects.toMatchObject({ status: 403 });
  // havola faqat https yoki sayt ichidagi bo'lim
  await expect(
    broadcastPush(who('owner', 'admin'), { t: 'Xabar', b: '', u: 'javascript:alert(1)' }),
  ).rejects.toThrow();
});

it('reminds about a live quiz once, 15 minutes before the start, but not independent learners', async () => {
  const questions = Array.from({ length: 5 }, (_, i) => ({
    t: `Jonli test savoli ${i + 1}: to‘g‘ri javobni toping`,
    o: ['To‘g‘ri', 'Xato 1', 'Xato 2', 'Xato 3'],
    c: 0,
  }));
  const admin = who('owner', 'admin');
  const now = Date.UTC(2026, 10, 11, 15, 0); // 20:00 Toshkent
  await manageLive(admin, { op: 'import', questions }, now);
  await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:30', nq: 5, qsec: 20, off: [] },
    now,
  );
  const start = Date.UTC(2026, 10, 11, 16, 30);
  await subscribePush(who('legacy_ali'), (await device()).sub);
  await subscribePush(who('tc', 'teacher'), (await device()).sub);
  await subscribePush(who('u_free', 'student', 'independent'), (await device()).sub);

  expect(await liveReminder(start - LIVE_REMIND_MS - 60000)).toBeNull(); // hali erta
  const r = await liveReminder(start - LIVE_REMIND_MS + 1000);
  expect(r).toMatchObject({ game: '2026-11-11', total: 2, sent: 2 });
  expect(demoOutbox.map((x) => x.sub.uid).sort()).toEqual(['legacy_ali', 'tc']);
  expect(demoOutbox[0].payload).toEqual({
    t: '⚡ Jonli test 21:30 da boshlanadi',
    b: 'Qo‘shilish 21:20 da ochiladi · 5 ta savol. Kechikmang — o‘yin boshlangach qo‘shilib bo‘lmaydi!',
    u: '/#arena/play/live',
    g: 'sq-live',
  });
  // ikkinchi marta (boshqa server, boshqa sahifa) — yuborilmaydi
  expect(await liveReminder(start - 5 * 60000)).toBeNull();
  expect(demoOutbox).toHaveLength(2);
  // o'yin boshlangach — kech
  expect(await liveReminder(start + 1000)).toBeNull();

  // o'yin boshqa vaqtga ko'chirilsa — yangi vaqt uchun yana bir marta
  await manageLive(
    admin,
    { op: 'settings', on: true, time: '21:30', nq: 5, qsec: 20, off: [] },
    now,
  );
  await manageLive(admin, { op: 'move', d: '2026-11-12', time: '09:30' }, now);
  const next = Date.UTC(2026, 10, 12, 4, 30);
  expect(await liveReminder(next - 10 * 60000)).toMatchObject({ game: '2026-11-12', sent: 2 });
  expect(demoOutbox.at(-1)!.payload.t).toBe('⚡ Jonli test 09:30 da boshlanadi');
  expect(
    liveReminderText({ d: 'x', open: 0, start: 4 * 3600000, end: 1, type: 'yz' }),
  ).toMatchObject({ t: '⌨️ Yozuv marafoni 09:00 da boshlanadi', u: '/#arena/play/yozuv' });
  await sendPush({ t: 'x', b: '', u: '/', g: 'x' }, () => false);
});

const questions = Array.from({ length: 5 }, (_, i) => ({
  t: `Jonli test savoli ${i + 1}: to‘g‘ri javobni toping`,
  o: ['To‘g‘ri', 'Xato 1', 'Xato 2', 'Xato 3'],
  c: 0,
}));
async function dailyAt(time: string, now: number) {
  const admin = who('owner', 'admin');
  await manageLive(admin, { op: 'import', questions }, now);
  await manageLive(admin, { op: 'settings', on: true, time, nq: 5, qsec: 20, off: [] }, now);
}

it('announces a live quiz once 14 hours before, then reminds, and lets the admin switch each off', async () => {
  const admin = who('owner', 'admin');
  const early = Date.UTC(2026, 10, 11, 1, 0); // 06:00 Toshkent
  await dailyAt('21:30', early);
  const start = Date.UTC(2026, 10, 11, 16, 30);
  await subscribePush(who('legacy_ali'), (await device()).sub);
  await subscribePush(who('u_free', 'student', 'independent'), (await device()).sub);

  expect(await liveAnnounce(start - LIVE_ANNOUNCE_MS - 60000)).toBeNull(); // hali erta
  const a = await pushTick(start - LIVE_ANNOUNCE_MS + 1000);
  expect(a.ann).toMatchObject({ game: '2026-11-11', total: 1, sent: 1 });
  expect(a.rem).toBeNull();
  expect(demoOutbox.map((x) => x.payload)).toEqual([
    {
      t: '📅 Bugun 21:30 da jonli test',
      b: 'Qo‘shilish 21:20 da ochiladi · 5 ta savol. Boshlanishidan 15 daqiqa oldin yana eslatamiz.',
      u: '/#arena/play/live',
      g: 'sq-live-new',
    },
  ]);
  expect((await pushTick(start - 3600000)).ann).toBeNull(); // bir marta
  const r = await pushTick(start - 10 * 60000);
  expect(r.rem).toMatchObject({ sent: 1 });
  expect(demoOutbox).toHaveLength(2);

  // tarix: yangisi tepada, kimga ketgani bilan
  const v = await pushAdmin(admin, start - 5 * 60000);
  expect(v.log.map((x) => [x.k, x.aud, x.s, x.n])).toEqual([
    ['live', 'live', 1, 1],
    ['ann', 'live', 1, 1],
  ]);
  expect(v.next).toMatchObject({ d: '2026-11-11', sentAnn: true, sentRem: true });

  // ertangi 09:30 dagi o'yin — kechqurun «Ertaga …»; eslatma 30 daqiqa oldin
  await manageLive(admin, { op: 'move', d: '2026-11-12', time: '09:30' }, early);
  const next = Date.UTC(2026, 10, 12, 4, 30);
  await managePush(admin, {
    op: 'settings',
    auto: { live: true, liveMin: 30, liveNew: true, topics: true, news: true, videos: true },
  });
  expect((await pushAuto()).liveMin).toBe(30);
  const evening = Date.UTC(2026, 10, 11, 17, 0); // 22:00 — bugungi o'yin tugagan
  expect((await pushTick(evening)).ann).toMatchObject({ game: '2026-11-12' });
  expect(demoOutbox.at(-1)!.payload.t).toBe('📅 Ertaga 09:30 da jonli test');
  expect(demoOutbox.at(-1)!.payload.b).toContain('30 daqiqa oldin yana eslatamiz');
  expect((await pushTick(next - 25 * 60000)).rem).toMatchObject({ sent: 1 });

  // o'chirilgan bo'lsa — hech narsa ketmaydi
  await managePush(admin, {
    op: 'settings',
    auto: { live: false, liveMin: 15, liveNew: false, topics: true, news: true, videos: true },
  });
  await manageLive(admin, { op: 'move', d: '2026-11-12', time: '10:30' }, early);
  const later = Date.UTC(2026, 10, 12, 5, 30);
  expect(await pushTick(later - 5 * 3600000)).toEqual({ ann: null, rem: null });
  expect(await pushTick(later - 5 * 60000)).toEqual({ ann: null, rem: null });
  await expect(managePush(who('legacy_ali'), { op: 'settings', auto: {} })).rejects.toMatchObject({
    status: 403,
  });
  await expect(
    managePush(admin, { op: 'settings', auto: { live: true, liveMin: 2 } }),
  ).rejects.toThrow();
});

it('a game created late is announced at once, but not right before its reminder', async () => {
  const now = Date.UTC(2026, 10, 11, 14, 0); // 19:00
  await dailyAt('21:30', now);
  await subscribePush(who('legacy_ali'), (await device()).sub);
  expect((await pushTick(now)).ann).toMatchObject({ sent: 1 });
  resetSiteMemory();
  forgetVapid();
  Object.assign(demoKahoot, { cfg: null, bank: {}, idx: {}, games: {}, res: {} });
  const close = Date.UTC(2026, 10, 11, 16, 8); // 21:08 — eslatmaga 7 daqiqa qoldi
  await dailyAt('21:30', close);
  await subscribePush(who('legacy_ali'), (await device()).sub);
  expect(await pushTick(close)).toEqual({ ann: null, rem: null });
});

it('the admin sends to everyone, a group or only to themselves, and sees app and browser devices', async () => {
  const admin = who('owner', 'admin');
  await subscribePush(who('legacy_ali'), (await device()).sub, Date.now(), true);
  await subscribePush(who('legacy_vali'), (await device()).sub);
  await subscribePush({ ...who('legacy_sobir'), classId: 'BM-101' } as Actor, (await device()).sub);
  await subscribePush(who('tc', 'teacher'), (await device()).sub);
  let v = await pushAdmin(admin);
  expect(v.stats).toMatchObject({
    devices: 4,
    app: 1,
    browser: 3,
    students: 3,
    staff: 1,
    studentDevices: 3,
    staffDevices: 1,
    mine: 0,
  });
  expect(v.groups).toEqual([
    { g: 'AP-223', devices: 2, users: 2 },
    { g: 'BM-101', devices: 1, users: 1 },
  ]);
  await expect(
    managePush(admin, { op: 'send', msg: { t: 'Sinov', b: '', u: '', self: true } }),
  ).rejects.toMatchObject({ status: 404 });
  // ikkala xabar bir millisekundda — tarixda baribir yuborilgan tartibda turishi kerak
  const same = Date.UTC(2026, 10, 11, 9, 0);
  const g = await managePush(
    admin,
    {
      op: 'send',
      msg: { t: '👥 AP-223 ga', b: 'Ertaga 2-bino', u: '/#courses', aud: 'g:AP-223' },
    },
    same,
  );
  expect(g.result).toMatchObject({ total: 2, sent: 2 });
  expect(demoOutbox.map((x) => x.sub.uid).sort()).toEqual(['legacy_ali', 'legacy_vali']);
  const st = await managePush(
    admin,
    { op: 'send', msg: { t: 'O‘qituvchilarga', b: '', u: '', aud: 'staff' } },
    same,
  );
  expect(st.result).toMatchObject({ total: 1 });
  expect(demoOutbox.at(-1)!.sub.uid).toBe('tc');
  await subscribePush(admin, (await device()).sub);
  const me = await managePush(admin, {
    op: 'send',
    msg: { t: 'Sinov', b: '', u: '', self: true },
  });
  expect(me.result).toMatchObject({ total: 1 });
  expect(demoOutbox.at(-1)!.sub.uid).toBe('owner');
  v = await pushAdmin(admin);
  // sinov tarixga yozilmaydi; qo'lda yuborilganlar — kim yuborgani bilan
  expect(v.log.map((x) => [x.k, x.aud, x.n, x.by])).toEqual([
    ['manual', 'staff', 1, 'owner'],
    ['manual', 'g:AP-223', 2, 'owner'],
  ]);
  await expect(
    managePush(admin, { op: 'send', msg: { t: 'x', b: '', u: '', aud: 'g:../x' } }),
  ).rejects.toThrow();
  await expect(pushAdmin(who('tc', 'teacher'))).rejects.toMatchObject({ status: 403 });
});

it('tells students when a topic opens or a video is added, unless switched off', async () => {
  await subscribePush(who('legacy_ali'), (await device()).sub);
  await subscribePush(who('tc', 'teacher'), (await device()).sub);
  const due = Date.UTC(2026, 10, 15, 18, 59);
  const now = Date.UTC(2026, 10, 11, 10, 0);
  const t = await topicPush({ id: 'm5', order: 4, title: 'Biznes reja', state: 'open', due }, now);
  expect(t).toMatchObject({ total: 1, sent: 1 });
  expect(demoOutbox[0]).toMatchObject({
    sub: { uid: 'legacy_ali' },
    payload: {
      t: '🟢 5-mavzu ochildi',
      b: 'Biznes reja · Ball yig‘ish muddati: 15.11 23:59 gacha.',
      u: '/#lesson/m5',
    },
  });
  // ikki marta bosilsa — bir soat ichida qayta ketmaydi; yopilganda — umuman
  expect(
    await topicPush({ id: 'm5', order: 4, title: 'x', state: 'open' }, now + 60000),
  ).toBeNull();
  expect(await topicPush({ id: 'm6', order: 5, title: 'x', state: 'lock' }, now)).toBeNull();
  expect(
    await topicPush({ id: 'm6', order: 5, title: 'Marketing', state: 'read' }, now),
  ).toMatchObject({ sent: 1 });
  expect(demoOutbox.at(-1)!.payload.t).toBe('📖 6-mavzu o‘qish uchun ochildi');
  expect(
    await videoPush(
      { id: 'm8', title: 'M8 · Reklama psixologiyasi' },
      'Reklama — 12 daqiqada',
      now,
    ),
  ).toMatchObject({ sent: 1 });
  expect(demoOutbox.at(-1)!.payload).toMatchObject({
    t: '📺 Yangi video: Reklama — 12 daqiqada',
    b: '8-mavzu: Reklama psixologiyasi',
    u: '/#lesson/m8',
  });
  await managePush(who('owner', 'admin'), {
    op: 'settings',
    auto: { live: true, liveMin: 15, liveNew: true, topics: false, news: true, videos: false },
  });
  expect(await topicPush({ id: 'm7', order: 6, title: 'x', state: 'open' }, now)).toBeNull();
  expect(await videoPush({ id: 'm8', title: 'M8 · x' }, undefined, now)).toBeNull();
  expect(demoOutbox).toHaveLength(3);
});
