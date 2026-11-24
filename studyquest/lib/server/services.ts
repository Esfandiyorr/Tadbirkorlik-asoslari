import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  ACTIVE_MAX,
  BUDGET_MAX,
  BUDGET_MIN,
  FILE_CHUNK,
  FILE_MAX,
  FILES_PER_ORDER,
  FILE_TYPES,
  KEEP_DAYS,
  PAY_MIN,
  RECEIPT_EXT,
  PRODUCTS,
  SERVICE_KINDS,
  fileExt,
  formatSum,
  isActive,
  isProduct,
  serviceKind,
  type ProductId,
  type AdminOrder,
  type FileExt,
  type OrderFile,
  type OrderMsg,
  type ServiceCard,
  type ServiceOrder,
  type ServiceBan,
  type ServiceSetting,
  type ServiceStatus,
  type ServicesAdminView,
  type ServicesView,
} from '../services';
import { ApiError, administrator, check } from './auth';
import { demo, legacyDb, repository } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { sendPush } from './push';
import { supportAct } from './support';
import { grantPremium, premiumInfo, premiumKey } from './premium';
import { grantExamAccess } from './exam';
import { course } from '../seed';

/* 💼 Pullik xizmatlar. Asl bazaning site/ bo'limida (brauzerlar tegolmaydi, faqat server):
     serviceInfo                        = {how, open, shown} — to'lov yo'riqnomasi; bo'lim ishga tushganmi;
                                           bo'lim menyuda ko'rinadimi (yo'q bo'lsa — vaqtincha yopiq)
     serviceCatalog/<yo'nalish>         = {days, off} — odatdagi muddat, yopiq/ochiq (narx belgilanmaydi)
     serviceProducts/<mahsulot>         = narx (so'm) — yakuniy test va Premium (lib/services.ts PRODUCTS)
     serviceOrders/<buyurtmachi>/<id>   = buyurtma: matn, summa, holat, to'lov, yozishma, fayllar
     serviceFiles/<buyurtmachi>/<fayl>/<n> = faylning n-bo'lagi (base64, ≤ 2,5 MB)
     serviceStats/<yo'nalish>/<foydalanuvchi>    — shu xizmatga buyurtma bergan (kartadagi «N kishi foydalandi»)
     serviceInterest/<yo'nalish>/<foydalanuvchi> — «tez orada» paytida kutayotganini bildirgan («N kishi kutmoqda»)
   Buyurtma yo'li: work (buyurtma administratorga yozishma bo'lib keldi; foydalanuvchida «🤖 Sun'iy intellekt yordamida
   tayyorlanmoqda») → review (administrator natijani yubordi) → done (foydalanuvchi qabul qildi va baho qo'ydi);
   istalgan paytda cancel. To'lov holatni to'xtatmaydi: paidAt — foydalanuvchi «To'lov qildim» dedi, payOk —
   administrator tasdiqladi. Narx belgilanmaydi: foydalanuvchi qancha to'lagan bo'lsa, shuni yozib (budget) chek
   skrinshotini yuklaydi; oddiy xizmatda to'lov natija yuborilgandan keyin ochiladi.
   🛍 Mahsulot (yakuniy test, Premium) — narxi belgilangan buyurtma: «To'lov qildim» bosilishi bilan o'zi ochiladi
   (bo'lim yoki obuna, granted) va buyurtma yakunlanadi; administrator keyin tekshiradi: to'lov kelgan bo'lsa
   tasdiqlaydi (payOk), kelmagan bo'lsa bloklaydi (ban): ochilgan narsa yopiladi, buyurtma bekor qilinadi,
   serviceBans/<foydalanuvchi> yoziladi (pullik xizmatlar yopiladi), xohlasa saytga kirish ham bloklanadi.
   Mahsulot sotib olish bo'lim yopiq bo'lsa ham ishlaydi.
   Fayllar bekor qilinganda darhol, yakunlangandan KEEP_DAYS kun keyin o'chiriladi. */

type StoredFile = {
  side: 'in' | 'out' | 'pay';
  name: string;
  ext: FileExt;
  size: number;
  chunks: number;
  at: number;
  by?: string;
  ready?: boolean;
  got?: Record<string, number>;
};
type Stored = {
  uid: string;
  name: string;
  group?: string;
  email?: string;
  role?: string;
  kind: string;
  title: string;
  text: string;
  budget?: number;
  due?: string;
  contact?: string;
  /** eski yozuvlarda: new/quoted (jamoa narx aytgan davr), open/assigned/paid (ijrochilar bozori davri) */
  status: ServiceStatus | 'new' | 'quoted' | 'open' | 'assigned' | 'paid';
  at: number;
  upd: number;
  paidAt?: number;
  paidNote?: string;
  payOk?: number;
  granted?: number;
  deliveredAt?: number;
  doneAt?: number;
  reason?: string;
  link?: string;
  expired?: boolean;
  rating?: number;
  review?: string;
  files?: Record<string, StoredFile>;
  msgs?: Record<string, { from: 'user' | 'worker' | 'team'; text: string; at: number }>;
};
type All = Record<string, Record<string, Stored>>;

const DAY = 86400000;
const STALE_MS = DAY;
const ID = /^[a-z0-9]{6,40}$/;
const UK = /^[A-Za-z0-9_-]{1,120}$/;
const ORDERS_MAX = 50;
const MSGS_MAX = 150;
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const newId = (now: number) => now.toString(36) + randomUUID().replace(/-/g, '').slice(0, 8);
const orderPath = (uk: string, id: string) => 'serviceOrders/' + uk + '/' + id;
const dataPath = (uk: string, fid: string) => 'serviceFiles/' + uk + '/' + fid;
const kindName = (kind: string) => serviceKind(kind)?.name[0] || kind;
/** Eski yozuvlar (new/quoted/open/assigned/paid) ham «tayyorlanmoqda» bo'lib ko'rinadi. */
const statusOf = (s: Stored): ServiceStatus =>
  s.status === 'review' || s.status === 'done' || s.status === 'cancel' ? s.status : 'work';

/* ---------- 📖 o'qish ---------- */
type Marks = Record<string, Record<string, number>>;
/** Har bir xizmat bo'yicha nechta odam (va jami nechta turli odam). */
function tally(raw: Marks | null) {
  const per: Record<string, number> = {};
  const all = new Set<string>();
  for (const k of SERVICE_KINDS) {
    const who = Object.keys(raw?.[k.id] || {}).filter((u) => UK.test(u));
    per[k.id] = who.length;
    who.forEach((u) => all.add(u));
  }
  return { per, total: all.size };
}
async function readCatalog(all: boolean) {
  const [set, used, wants] = await Promise.all([
    siteGet<Record<string, ServiceSetting>>('serviceCatalog').then((v) => v || {}),
    siteGet<Marks>('serviceStats').then(tally),
    siteGet<Marks>('serviceInterest').then(tally),
  ]);
  const catalog: ServiceCard[] = SERVICE_KINDS.map((k) => {
    const s = set[k.id] || {};
    return {
      ...k,
      used: used.per[k.id] || 0,
      wants: wants.per[k.id] || 0,
      ...(s.days ? { days: String(s.days) } : {}),
      ...(s.off ? { off: true } : {}),
    };
  }).filter((k) => all || !k.off);
  return { catalog, people: used.total, fans: wants.total };
}
async function readInfo() {
  const v = await siteGet<{ how?: string; open?: boolean; shown?: boolean }>('serviceInfo');
  return {
    how: v?.how || '',
    open: v?.open === true,
    // 🔒 administrator «Bo'limni ochish» bosmaguncha bo'lim vaqtincha yopiq (menyuda yo'q, foydalanuvchi amallari qabul qilinmaydi)
    shown: v?.shown === true,
  };
}
async function readAll() {
  return ((await siteGet<All>('serviceOrders')) || {}) as All;
}
/** 🛍 Mahsulotni ochish: yakuniy test bo'limi yoki Premium (muddati — administrator tanlagani, mavjudiga qo'shiladi). */
async function fulfil(s: Stored, id: string, by: string, now: number, days?: number) {
  const product = PRODUCTS[s.kind as ProductId];
  if (product.premium)
    await grantPremium(s.uid, s.name, s.group || '', product.days || days || 30, by, now);
  else await grantExamAccess(s.uid, s.name, by, 'order:' + id, now);
}
/** ⛔ To'lov topilmadi: ochilgan mahsulot yopiladi (yakuniy test — shu buyurtma ochgan bo'lsa; Premium — butunlay). */
async function revoke(s: Stored, id: string) {
  if (!isProduct(s.kind)) return;
  if (PRODUCTS[s.kind].premium) await siteUpdate({ ['premium/' + premiumKey(s.uid)]: null });
  else {
    const access = await siteGet<{ via?: string }>('examAccess/' + keyOf(s.uid));
    if (access?.via === 'order:' + id) await siteUpdate({ ['examAccess/' + keyOf(s.uid)]: null });
  }
}
/** 🔒 Saytga kirishni bloklash yoki ochish: TerDU talabasi — asl yozuvidagi holat, boshqalar — hisob belgisi. */
async function blockAccount(uid: string, blocked: boolean) {
  if (uid.startsWith('legacy_')) {
    if (demo()) return; // demo muhit jonli talabalar bazasiga tegmaydi
    await legacyDb()
      .ref('students/' + uid.slice(7) + '/status')
      .transaction((v: string | null) =>
        v === null ? v : blocked ? 'blocked' : v === 'blocked' ? 'ok' : v,
      );
    return;
  }
  const repo = await repository();
  await repo.transaction(async (tx) => {
    const u = await tx.get('users', uid);
    if (u) tx.set('users', uid, { ...u, blocked });
  });
}
async function readBans() {
  return (await siteGet<Record<string, Omit<ServiceBan, 'uk'>>>('serviceBans')) || {};
}

function files(s: Stored): OrderFile[] {
  return Object.entries(s.files || {})
    .filter(([fid, f]) => ID.test(fid) && f?.ready && f.ext in FILE_TYPES)
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([fid, f]) => ({
      id: fid,
      side: f.side === 'out' ? 'out' : f.side === 'pay' ? 'pay' : 'in',
      name: f.name,
      ext: f.ext,
      size: f.size,
      chunks: f.chunks,
      at: f.at,
    }));
}
function msgs(s: Stored): OrderMsg[] {
  return Object.entries(s.msgs || {})
    .filter(([, m]) => m && typeof m.text === 'string')
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([mid, m]) => ({
      id: mid,
      // eski (ijrochilar davridagi) ijrochi xabarlari ham «jamoa» tomonida ko'rinadi
      from: m.from === 'user' ? 'user' : 'team',
      text: m.text,
      at: m.at,
    }));
}
/** Buyurtma (buyurtmachi yoki administrator uchun). */
function toOrder(uk: string, id: string, s: Stored): ServiceOrder {
  return {
    id,
    uk,
    kind: s.kind,
    title: s.title,
    text: s.text,
    budget: Number(s.budget) || 0,
    status: statusOf(s),
    at: s.at,
    upd: s.upd || s.at,
    ...(s.due ? { due: s.due } : {}),
    ...(s.contact ? { contact: s.contact } : {}),
    ...(s.paidAt ? { paidAt: s.paidAt } : {}),
    ...(s.paidNote ? { paidNote: s.paidNote } : {}),
    ...(s.payOk ? { payOk: s.payOk } : {}),
    ...(s.granted ? { granted: s.granted } : {}),
    ...(s.deliveredAt ? { deliveredAt: s.deliveredAt } : {}),
    ...(s.doneAt ? { doneAt: s.doneAt } : {}),
    ...(s.reason ? { reason: s.reason } : {}),
    ...(s.link ? { link: s.link } : {}),
    ...(s.expired ? { expired: true } : {}),
    ...(s.rating ? { rating: s.rating } : {}),
    ...(s.review ? { review: s.review } : {}),
    files: files(s),
    msgs: msgs(s),
  };
}
const flatten = (all: All) =>
  Object.entries(all).flatMap(([uk, list]) =>
    UK.test(uk) && list
      ? Object.entries(list)
          .filter(([id, s]) => ID.test(id) && s?.kind)
          .map(([id, s]) => ({ uk, id, s }))
      : [],
  );

/** Eskirgan fayllarni tozalash: bekor qilingan vazifa fayllari, yakunlanganiga KEEP_DAYS kun bo'lgan natijalar va
    bir kundan beri tugallanmagan yuklashlar. Bazaga yozadigan o'zgarishlarni qaytaradi (va yozuvni yangilaydi). */
function sweep(all: All, now: number) {
  const patch: Record<string, unknown> = {};
  for (const [uk, orders] of Object.entries(all)) {
    if (!UK.test(uk) || !orders) continue;
    for (const [id, s] of Object.entries(orders)) {
      if (!s?.files) continue;
      const st = statusOf(s);
      const old =
        st === 'cancel' || (st === 'done' && (s.doneAt || s.upd || 0) + KEEP_DAYS * DAY < now);
      for (const [fid, f] of Object.entries(s.files))
        if (old || (!f?.ready && now - (f?.at || 0) > STALE_MS)) {
          patch[orderPath(uk, id) + '/files/' + fid] = null;
          patch[dataPath(uk, fid)] = null;
          delete s.files[fid];
        }
      if (old && st === 'done' && !s.expired) {
        patch[orderPath(uk, id) + '/expired'] = true;
        s.expired = true;
      }
    }
  }
  return patch;
}

/** Foydalanuvchi (yoki mehmon): katalog, ko'rsatkichlar va o'z buyurtmalari. */
export async function servicesView(a: Actor | null, now = Date.now()): Promise<ServicesView> {
  const [{ catalog, people, fans }, info, all] = await Promise.all([
    readCatalog(false),
    readInfo(),
    readAll(),
  ]);
  const patch = sweep(all, now);
  if (Object.keys(patch).length) await siteUpdate(patch);
  const flat = flatten(all);
  const head = {
    open: info.open,
    shown: info.shown,
    catalog,
    people,
    fans,
    done: flat.filter((x) => statusOf(x.s) === 'done' && !isProduct(x.s.kind)).length,
  };
  if (!a) return { ...head, signedIn: false };
  const me = keyOf(a.id);
  const orders = flat
    .filter((x) => x.uk === me)
    .map((x) => toOrder(x.uk, x.id, x.s))
    .sort((x, y) => y.at - x.at);
  const banned = !!(await siteGet<{ at?: number }>('serviceBans/' + me))?.at;
  // to'lov yo'riqnomasi (karta): «Pullik xizmatlar» bo'limidagi, bo'lmasa — oldingi «Obuna» bo'limidagi matn
  const how = info.how || (await premiumInfo().catch(() => ({ how: '' }))).how;
  return { ...head, signedIn: true, how, orders, ...(banned ? { banned } : {}) };
}

/** Administrator: hamma buyurtmalar (buyurtmachi ma'lumotlari bilan, oxirgi o'zgarish bo'yicha) va sozlamalar. */
export async function servicesAdmin(a: Actor, now = Date.now()): Promise<ServicesAdminView> {
  administrator(a);
  const [all, { catalog, people, fans }, { how, open, shown }] = await Promise.all([
    readAll(),
    readCatalog(true),
    readInfo(),
  ]);
  const patch = sweep(all, now);
  if (Object.keys(patch).length) await siteUpdate(patch);
  let used = 0;
  const orders: AdminOrder[] = flatten(all).map(({ uk, id, s }) => {
    used += Object.values(s.files || {}).reduce((n, f) => n + (f?.size || 0), 0);
    return {
      ...toOrder(uk, id, s),
      name: s.name,
      ...(s.group ? { group: s.group } : {}),
      ...(s.email ? { email: s.email } : {}),
      ...(s.role ? { role: s.role } : {}),
    };
  });
  orders.sort((x, y) => y.upd - x.upd);
  const bans: ServiceBan[] = Object.entries(await readBans())
    .filter(([uk, b]) => UK.test(uk) && b?.uid)
    .map(([uk, b]) => ({ uk, ...b }))
    .sort((x, y) => y.at - x.at);
  return { open, shown, catalog, people, fans, how, orders, bans, used };
}

/* ---------- 🔔 bildirishnomalar (xatosi amalni to'xtatmaydi) ---------- */
async function notify(uids: string[], t: string, b: string, u = '/#services/mine') {
  const set = new Set(uids.filter(Boolean));
  if (!set.size) return;
  try {
    await sendPush({ t, b, u, g: 'services' }, (s) => set.has(s.uid));
  } catch {}
}
async function notifyTeam(t: string, b: string) {
  try {
    await sendPush({ t, b, u: '/#admin', g: 'services-admin' }, (s) => s.role === 'admin');
  } catch {}
}

/* ---------- ✍️ o'zgartirish ---------- */
async function load(uk: string, id: string) {
  check(UK.test(uk) && ID.test(id), 400, 'Buyurtma topilmadi.');
  const s = await siteGet<Stored>(orderPath(uk, id));
  check(s?.kind, 404, 'Buyurtma topilmadi.');
  return s!;
}
const msgId = (now: number) => 'm' + now.toString(36) + Math.random().toString(36).slice(2, 6);
function addMsg(
  patch: Record<string, unknown>,
  uk: string,
  id: string,
  s: Stored,
  from: 'user' | 'team',
  text: string,
  now: number,
) {
  check(Object.keys(s.msgs || {}).length < MSGS_MAX, 429, 'Yozishma juda uzun bo‘lib ketdi.');
  patch[orderPath(uk, id) + '/msgs/' + msgId(now)] = { from, text, at: now };
}
/** Buyurtmaning hamma fayllarini (bo'laklari bilan) o'chirish. */
function dropFiles(patch: Record<string, unknown>, uk: string, id: string, s: Stored) {
  for (const fid of Object.keys(s.files || {})) patch[dataPath(uk, fid)] = null;
  patch[orderPath(uk, id) + '/files'] = null;
}
/** Bo'lim hali ishga tushmagan bo'lsa buyurtmani faqat administrator (sinab ko'rish uchun) bera oladi. */
async function isAdminActor(a: Actor) {
  if (a.role === 'admin') return true;
  // tejamkor (readOnly) so'rovda Firestore'dagi administrator roli ko'rinmaydi — bir marta tekshiriladi
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  return stored?.role === 'admin';
}
/** 🔒 Bo'lim menyuda ko'rinadimi (asosiy sahifa ma'lumoti uchun). */
export async function servicesShown() {
  return (await readInfo()).shown;
}
/** Bo'lim vaqtincha yopiq bo'lsa — foydalanuvchi amallari qabul qilinmaydi (administrator boshqaraveradi). */
async function notClosed(a: Actor) {
  if ((await readInfo()).shown || (await isAdminActor(a))) return;
  throw new ApiError(403, 'Pullik xizmatlar bo‘limi vaqtincha yopiq.');
}
async function canOrder(a: Actor) {
  if ((await readInfo()).open || (await isAdminActor(a))) return;
  throw new ApiError(
    409,
    'Pullik xizmatlar hali ishga tushmagan. Taklifingizni yozib qoldiring — ishga tushganda xabar beramiz.',
  );
}

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ukField = z.string().regex(UK);
const fileBegin = { name: text(3, 180), size: z.number().int().positive() };
const linkField = z.union([z.literal(''), z.string().trim().max(500).url().startsWith('https://')]);
const userInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('idea'),
      kinds: z.array(z.string().max(40)).max(SERVICE_KINDS.length),
      text: z.string().trim().max(1200),
    })
    .strict(),
  z
    .object({
      op: z.literal('order'),
      kind: z.string().max(40),
      title: text(3, 160),
      text: text(10, 3000),
      // eski ilova versiyalari uchun (endi so'ralmaydi)
      budget: z.number().int().min(BUDGET_MIN).max(BUDGET_MAX).optional(),
      due: day.optional(),
      contact: z.string().trim().max(80).optional(),
    })
    .strict(),
  z.object({ op: z.literal('buy'), product: z.string().max(40) }).strict(),
  z
    .object({
      op: z.literal('paid'),
      id: z.string(),
      amount: z.number().int().min(PAY_MIN).max(BUDGET_MAX),
      note: z.string().trim().max(200),
    })
    .strict(),
  z.object({ op: z.literal('cancel'), id: z.string() }).strict(),
  z.object({ op: z.literal('msg'), id: z.string(), text: text(1, 1000) }).strict(),
  z.object({ op: z.literal('revise'), id: z.string(), text: text(3, 1000) }).strict(),
  z
    .object({
      op: z.literal('accept'),
      id: z.string(),
      rating: z.number().int().min(1).max(5),
      review: z.string().trim().max(500).optional(),
    })
    .strict(),
  z.object({ op: z.literal('remove'), id: z.string() }).strict(),
  z
    .object({
      op: z.literal('begin'),
      id: z.string(),
      ...fileBegin,
      side: z.literal('pay').optional(),
    })
    .strict(),
  z.object({ op: z.literal('finish'), id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('unfile'), id: z.string(), fid: z.string() }).strict(),
]);

/** Foydalanuvchi amallari: buyurtma berish, to'lov haqida xabar, yozishma, natijani qabul qilish yoki tuzatish so'rash. */
export async function manageServices(a: Actor, raw: unknown, now = Date.now()) {
  const v = userInput.parse(raw);
  const me = keyOf(a.id);
  const done = async () => ({ view: await servicesView(a, now) });
  // 🛍 mahsulot (yakuniy test, Premium) bo'lim yopiq yoki ishga tushmagan bo'lsa ham sotib olinadi
  const forProduct =
    v.op === 'buy' ||
    ('id' in v &&
      typeof v.id === 'string' &&
      isProduct((await siteGet<Stored>(orderPath(me, v.id)).catch(() => null))?.kind || ''));
  if (!forProduct) await notClosed(a);
  // ⛔ to'lovi topilmagan foydalanuvchiga pullik xizmatlar yopiq
  check(
    !(await siteGet<{ at?: number }>('serviceBans/' + me))?.at,
    403,
    'Sizga pullik xizmatlar yopilgan: to‘lovingiz topilmadi. Savol bo‘lsa, «Adminga xabar» orqali yozing.',
  );

  if (v.op === 'buy') {
    check(isProduct(v.product) && !PRODUCTS[v.product].legacy, 404, 'Bunday xizmat yo‘q.');
    const product = PRODUCTS[v.product as ProductId];
    const mine = (await siteGet<Record<string, Stored>>('serviceOrders/' + me)) || {};
    const open = Object.entries(mine).find(
      ([id, s]) => ID.test(id) && s?.kind === product.id && statusOf(s) === 'work',
    );
    if (open) return { id: open[0], ...(await done()) };
    if (product.id === 'yakuniy-test')
      check(
        !(await siteGet<{ at?: number }>('examAccess/' + me))?.at,
        409,
        'Bu bo‘lim sizda allaqachon ochiq.',
      );
    check(
      Object.keys(mine).length < ORDERS_MAX,
      429,
      'Buyurtmalar ro‘yxati to‘ldi — eski tugaganlarini o‘chirib qo‘ying.',
    );
    const id = newId(now);
    const order: Stored = {
      uid: a.id,
      name: (a.name || 'Foydalanuvchi').slice(0, 120),
      ...(a.classId ? { group: String(a.classId).slice(0, 40) } : {}),
      ...(a.email ? { email: a.email.slice(0, 120) } : {}),
      role: a.role,
      kind: product.id,
      title: product.name[0],
      text: product.text[0],
      budget: 0,
      status: 'work',
      at: now,
      upd: now,
    };
    await siteUpdate({ [orderPath(me, id)]: order });
    return { id, ...(await done()) };
  }

  if (v.op === 'idea') {
    // 💡 «tez orada» oynasidagi taklif: «Adminga xabar»ga tushadi va kartalardagi «N kishi kutmoqda» ni oshiradi
    const kinds = SERVICE_KINDS.filter((k) => v.kinds.includes(k.id));
    check(
      kinds.length || v.text.length >= 3,
      400,
      'Kerakli xizmatni belgilang yoki taklifingizni yozing.',
    );
    const body =
      '💡 PULLIK XIZMATLAR — TAKLIF' +
      (kinds.length ? '\nKerakli xizmatlar: ' + kinds.map((k) => k.name[0]).join(', ') : '') +
      (v.text ? '\nTaklif: ' + v.text : '');
    await supportAct(a, 'send', { text: body, cat: 'idea' }, now);
    if (kinds.length && a.role !== 'admin')
      await siteUpdate(
        Object.fromEntries(kinds.map((k) => ['serviceInterest/' + k.id + '/' + me, now])),
      );
    return done();
  }

  if (v.op === 'order') {
    await canOrder(a);
    const kind = (await readCatalog(false)).catalog.find((k) => k.id === v.kind);
    check(kind, 400, 'Bu yo‘nalish hozir yopiq. Boshqasini tanlang.');
    const mine = (await siteGet<Record<string, Stored>>('serviceOrders/' + me)) || {};
    const list = Object.values(mine).filter((s) => s?.kind);
    check(
      list.filter((s) => isActive(statusOf(s))).length < ACTIVE_MAX,
      429,
      `Bir vaqtda ${ACTIVE_MAX} tagacha buyurtma ochiq turadi. Avvalgisi tugashini kuting.`,
    );
    check(
      list.length < ORDERS_MAX,
      429,
      'Buyurtmalar ro‘yxati to‘ldi — eski tugaganlarini o‘chirib qo‘ying.',
    );
    const id = newId(now);
    const order: Stored = {
      uid: a.id,
      name: (a.name || 'Foydalanuvchi').slice(0, 120),
      ...(a.classId ? { group: String(a.classId).slice(0, 40) } : {}),
      ...(a.email ? { email: a.email.slice(0, 120) } : {}),
      role: a.role,
      kind: kind!.id,
      title: v.title,
      text: v.text,
      // narx so'ralmaydi: to'lov natija yuborilgandan keyin, istalgan summada
      budget: 0,
      ...(v.due ? { due: v.due } : {}),
      ...(v.contact ? { contact: v.contact } : {}),
      status: 'work',
      at: now,
      upd: now,
    };
    await siteUpdate({
      [orderPath(me, id)]: order,
      // kartadagi «N kishi foydalandi» (administratorning sinov buyurtmasi sanalmaydi)
      ...(a.role !== 'admin' ? { ['serviceStats/' + kind!.id + '/' + me]: now } : {}),
    });
    // 🤖 buyurtma administratorga keladi: qaysi xizmat va nima yozilgan
    await notifyTeam(
      '🤖 Yangi buyurtma · ' + kindName(kind!.id),
      order.name + ': ' + v.title + ' — ' + v.text.slice(0, 140),
    );
    return { id, ...(await done()) };
  }

  // ---------- buyurtmachining o'z buyurtmasi ----------
  const s = await load(me, v.id);
  check(s.uid === a.id, 404, 'Buyurtma topilmadi.');
  const st = statusOf(s);
  const path = orderPath(me, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'paid') {
    // 💳 istalgan summa + chek skrinshoti; administrator chekni qabul qilishi bilan mahsulot ochiladi
    check(st !== 'cancel', 409, 'Buyurtma bekor qilingan.');
    check(!s.payOk, 409, 'To‘lov allaqachon tasdiqlangan.');
    check(
      isProduct(s.kind) ? st === 'work' : !!s.deliveredAt || st === 'review' || st === 'done',
      409,
      'To‘lov ish bajarilgach (natija yuborilgach) ochiladi.',
    );
    check(
      Object.values(s.files || {}).some((f) => f?.ready && f.side === 'pay'),
      400,
      'Avval chek skrinshotini yuklang.',
    );
    Object.assign(patch, {
      [path + '/paidAt']: now,
      [path + '/paidNote']: v.note || null,
      [path + '/budget']: v.amount,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyTeam(
      '🧾 Chek keldi — qabul qiling',
      s.name + ' — ' + s.title + ' · ' + formatSum(v.amount) + (v.note ? ' · ' + v.note : ''),
    );
  } else if (v.op === 'cancel') {
    check(
      st === 'work' && !s.paidAt && !s.payOk && !s.deliveredAt,
      409,
      'To‘lovdan yoki natija yuborilgandan keyin buyurtmani administrator orqali bekor qilish mumkin — yozishmada yozing.',
    );
    dropFiles(patch, me, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: 'Buyurtmachi bekor qildi',
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyTeam('✖ Buyurtma bekor qilindi', s.name + ' — ' + s.title);
  } else if (v.op === 'msg') {
    check(st !== 'cancel', 409, 'Buyurtma bekor qilingan.');
    addMsg(patch, me, v.id, s, 'user', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    await notifyTeam('💬 ' + s.name, s.title + ': ' + v.text);
  } else if (v.op === 'revise') {
    check(st === 'review', 409, 'Tuzatishni natija yuborilgandan keyin so‘rash mumkin.');
    addMsg(patch, me, v.id, s, 'user', '🔁 Tuzatish: ' + v.text, now);
    Object.assign(patch, { [path + '/status']: 'work', [path + '/upd']: now });
    await siteUpdate(patch);
    await notifyTeam('🔁 Tuzatish so‘raldi', s.name + ' — ' + s.title + ': ' + v.text);
  } else if (v.op === 'accept') {
    check(st === 'review', 409, 'Natija hali yuborilmagan.');
    Object.assign(patch, {
      [path + '/status']: 'done',
      [path + '/doneAt']: now,
      [path + '/rating']: v.rating,
      [path + '/review']: v.review || null,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyTeam('✅ Qabul qilindi · ⭐ ' + v.rating, s.name + ' — ' + s.title);
  } else if (v.op === 'remove') {
    check(!isActive(st), 409, 'Ochiq buyurtmani o‘chirib bo‘lmaydi — avval bekor qiling.');
    for (const fid of Object.keys(s.files || {})) patch[dataPath(me, fid)] = null;
    patch[path] = null;
    await siteUpdate(patch);
  } else {
    const r = await fileOp(a, 'me', me, v.id, s, v, now);
    return 'fid' in r ? r : done();
  }
  return done();
}

const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('confirm'),
      uk: ukField,
      id: z.string(),
      // 💎 Premium: necha kunga ochiladi (1 oy, 1 yil …)
      days: z.number().int().min(1).max(730).optional(),
    })
    .strict(),
  z.object({ op: z.literal('ban'), uk: ukField, id: z.string(), account: z.boolean() }).strict(),
  z.object({ op: z.literal('unban'), uk: ukField }).strict(),
  z
    .object({
      op: z.literal('status'),
      uk: ukField,
      id: z.string(),
      status: z.enum(['work', 'review', 'done']),
    })
    .strict(),
  z.object({ op: z.literal('link'), uk: ukField, id: z.string(), link: linkField }).strict(),
  z.object({ op: z.literal('cancel'), uk: ukField, id: z.string(), reason: text(3, 300) }).strict(),
  z.object({ op: z.literal('msg'), uk: ukField, id: z.string(), text: text(1, 1000) }).strict(),
  z.object({ op: z.literal('remove'), uk: ukField, id: z.string() }).strict(),
  z.object({ op: z.literal('begin'), uk: ukField, id: z.string(), ...fileBegin }).strict(),
  z.object({ op: z.literal('finish'), uk: ukField, id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('unfile'), uk: ukField, id: z.string(), fid: z.string() }).strict(),
  z
    .object({
      op: z.literal('catalog'),
      kind: z.string().max(40),
      // narx belgilanmaydi (istalgan summa) — eski mijozlar yuborsa e'tiborsiz qoldiriladi
      price: z.string().trim().max(60).optional(),
      days: z.string().trim().max(40),
      off: z.boolean(),
    })
    .strict(),
  z.object({ op: z.literal('info'), how: z.string().trim().max(1500) }).strict(),
  z.object({ op: z.literal('launch'), open: z.boolean() }).strict(),
  z.object({ op: z.literal('show'), shown: z.boolean() }).strict(),
]);

/** Administrator amallari: yozishma, natijani yuklash va yuborish, to'lovni tasdiqlash, bekor qilish, sozlamalar. */
export async function adminServices(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = adminInput.parse(raw);
  const done = async () => ({ admin: await servicesAdmin(a, now) });
  if (v.op === 'catalog') {
    check(serviceKind(v.kind), 404, 'Yo‘nalish topilmadi.');
    await siteUpdate({
      ['serviceCatalog/' + v.kind]:
        v.days || v.off
          ? {
              ...(v.days ? { days: v.days } : {}),
              ...(v.off ? { off: true } : {}),
            }
          : null,
    });
    return done();
  }
  if (v.op === 'launch') {
    await siteUpdate({ 'serviceInfo/open': v.open || null });
    return done();
  }
  if (v.op === 'show') {
    await siteUpdate({ 'serviceInfo/shown': v.shown || null });
    return done();
  }
  if (v.op === 'info') {
    await siteUpdate({ 'serviceInfo/how': v.how || null });
    return done();
  }
  if (v.op === 'unban') {
    const ban = (await readBans())[v.uk];
    check(ban, 404, 'Bunday blok yo‘q.');
    await siteUpdate({ ['serviceBans/' + v.uk]: null });
    if (ban!.account) await blockAccount(ban!.uid, false);
    await notify([ban!.uid], '✅ Blok olib tashlandi', 'Pullik xizmatlar sizga yana ochiq.');
    return done();
  }
  const s = await load(v.uk, v.id);
  const st = statusOf(s);
  const path = orderPath(v.uk, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'ban') {
    // ⛔ «To'lov qildim» dedi, lekin to'lov topilmadi: ochilgan narsa yopiladi, buyurtma bekor, foydalanuvchi bloklanadi
    check(!s.payOk, 409, 'To‘lov tasdiqlangan — bloklab bo‘lmaydi.');
    await revoke(s, v.id);
    dropFiles(patch, v.uk, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: 'To‘lov topilmadi',
      [path + '/granted']: null,
      [path + '/upd']: now,
      ['serviceBans/' + v.uk]: {
        uid: s.uid,
        name: s.name,
        at: now,
        by: (a.name || a.id).slice(0, 60),
        title: s.title.slice(0, 120),
        ...(v.account ? { account: true } : {}),
      },
    });
    await siteUpdate(patch);
    if (v.account) await blockAccount(s.uid, true);
    await notify(
      [s.uid],
      '⛔ To‘lov topilmadi',
      s.title + ' — yopildi. Pullik xizmatlar sizga yopiq; savol bo‘lsa, administratorga yozing.',
    );
    return done();
  }
  if (v.op === 'confirm') {
    check(st !== 'cancel', 409, 'Buyurtma bekor qilingan.');
    check(!s.payOk, 409, 'To‘lov allaqachon tasdiqlangan.');
    Object.assign(patch, {
      [path + '/payOk']: now,
      [path + '/paidAt']: s.paidAt || now,
      [path + '/upd']: now,
    });
    const by = (a.name || a.id).slice(0, 60);
    if (isProduct(s.kind) && !s.granted) {
      // 🛍 chek qabul qilindi — mahsulot o'zi ochiladi (Premium — tanlangan muddatga)
      await fulfil(s, v.id, by, now, v.days);
      Object.assign(patch, {
        [path + '/granted']: now,
        [path + '/status']: 'done',
        [path + '/doneAt']: now,
      });
    }
    await siteUpdate(patch);
    await notify(
      [s.uid],
      isProduct(s.kind) && !s.granted
        ? '✅ ' + PRODUCTS[s.kind].name[0] + ' — ochildi'
        : '✅ To‘lov tasdiqlandi',
      s.title + (s.budget ? ' · ' + formatSum(s.budget) : ''),
      s.kind === 'yakuniy-test' ? '/#course/' + course.id + '/exam' : undefined,
    );
  } else if (v.op === 'status') {
    check(st !== 'cancel', 409, 'Buyurtma bekor qilingan.');
    if (v.status !== 'work')
      check(
        Object.values(s.files || {}).some((f) => f?.ready && f.side === 'out') || s.link,
        400,
        'Avval tayyor ish faylini yuklang yoki havola qo‘ying.',
      );
    Object.assign(patch, {
      [path + '/status']: v.status,
      [path + '/upd']: now,
      ...(v.status === 'review' ? { [path + '/deliveredAt']: now } : {}),
      ...(v.status === 'done' ? { [path + '/doneAt']: now, [path + '/expired']: null } : {}),
    });
    await siteUpdate(patch);
    if (v.status === 'review')
      await notify([s.uid], '📥 Buyurtmangiz tayyor', s.title + ' — yuklab oling va tekshiring.');
    if (v.status === 'done') await notify([s.uid], '✅ Buyurtma yakunlandi', s.title);
  } else if (v.op === 'link') {
    Object.assign(patch, { [path + '/link']: v.link || null, [path + '/upd']: now });
    await siteUpdate(patch);
  } else if (v.op === 'cancel') {
    check(st !== 'cancel', 409, 'Buyurtma allaqachon bekor qilingan.');
    dropFiles(patch, v.uk, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: v.reason,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify([s.uid], '✖ Buyurtma bekor qilindi', s.title + ': ' + v.reason);
  } else if (v.op === 'msg') {
    addMsg(patch, v.uk, v.id, s, 'team', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    await notify([s.uid], '💬 Administratordan xabar', s.title + ': ' + v.text);
  } else if (v.op === 'remove') {
    for (const fid of Object.keys(s.files || {})) patch[dataPath(v.uk, fid)] = null;
    patch[path] = null;
    await siteUpdate(patch);
  } else {
    const r = await fileOp(a, 'admin', v.uk, v.id, s, v, now);
    return 'fid' in r ? r : done();
  }
  return done();
}

/* ---------- 📎 fayllar ---------- */
/** Faylning birinchi baytlari kengaytmasiga mosmi (soxta fayl yuklanmasin). */
function magicOk(ext: FileExt, b: Buffer) {
  if (ext === 'pdf') return b.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === 'docx' || ext === 'pptx' || ext === 'xlsx' || ext === 'zip')
    return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  if (ext === 'png') return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === 'jpg' || ext === 'jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (ext === 'webp')
    return (
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP'
    );
  return b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

type FileOp =
  | { op: 'begin'; name: string; size: number; side?: 'pay' }
  | { op: 'finish'; fid: string }
  | { op: 'unfile'; fid: string };
type Who = 'me' | 'admin';
/** Fayl amallari: begin (joy ochish) → bo'laklar (saveServiceChunk) → finish; unfile — o'chirish.
    Buyurtmachi «in» (talablar, namuna) va «pay» (🧾 to'lov cheki), administrator «out» (tayyor ish) fayl yuklaydi. */
async function fileOp(
  a: Actor,
  who: Who,
  uk: string,
  id: string,
  s: Stored,
  v: FileOp,
  now = Date.now(),
): Promise<{ fid: string; chunk: number; chunks: number } | { ok: true }> {
  const path = orderPath(uk, id);
  const sides: StoredFile['side'][] = who === 'me' ? ['in', 'pay'] : ['out'];
  const st = statusOf(s);
  if (v.op === 'begin') {
    const side: StoredFile['side'] = who === 'me' ? (v.side === 'pay' ? 'pay' : 'in') : 'out';
    check(
      who === 'admin'
        ? st !== 'cancel'
        : side === 'pay'
          ? st !== 'cancel' && !s.payOk
          : st === 'work',
      409,
      side === 'pay'
        ? 'To‘lov tasdiqlangan — chek endi kerak emas.'
        : 'Bu buyurtmaga hozir fayl qo‘shib bo‘lmaydi.',
    );
    const ext = fileExt(v.name);
    check(
      ext,
      400,
      'Bu turdagi fayl qabul qilinmaydi: PDF, Word, PowerPoint, Excel, ZIP yoki rasm.',
    );
    check(
      side !== 'pay' || (RECEIPT_EXT as readonly string[]).includes(ext!),
      400,
      'Chek uchun rasm (PNG, JPG, WEBP) yoki PDF yuklang.',
    );
    check(v.size <= FILE_MAX[side], 413, `Fayl ${FILE_MAX[side] / 1024 / 1024} MB dan oshmasin.`);
    const list = Object.values(s.files || {}).filter((f) => f?.side === side && f.ready);
    check(
      list.length < FILES_PER_ORDER[side],
      409,
      `Bitta buyurtmaga ${FILES_PER_ORDER[side]} tagacha fayl qo‘shiladi.`,
    );
    const fid = newId(now);
    const name = v.name.replace(/[\r\n"\\/]/g, '').slice(0, 180);
    const file: StoredFile = {
      side,
      name,
      ext: ext!,
      size: v.size,
      chunks: Math.ceil(v.size / FILE_CHUNK),
      at: now,
      by: (a.name || a.id).slice(0, 80),
      ready: false,
    };
    await siteUpdate({ [path + '/files/' + fid]: file });
    return { fid, chunk: FILE_CHUNK, chunks: file.chunks };
  }
  check(ID.test(v.fid), 400, 'Fayl topilmadi.');
  const f = s.files?.[v.fid];
  check(f, 404, 'Fayl topilmadi.');
  if (v.op === 'unfile') {
    check(
      who === 'admin' ||
        (f!.side === 'in' && isActive(st)) ||
        (f!.side === 'pay' && st !== 'cancel' && !s.payOk),
      403,
      'Bu faylni o‘chirib bo‘lmaydi.',
    );
    await siteUpdate({ [path + '/files/' + v.fid]: null, [dataPath(uk, v.fid)]: null });
  } else {
    check(sides.includes(f!.side), 403, 'Bu faylni yuklab bo‘lmaydi.');
    check(!f!.ready, 409, 'Fayl allaqachon yuklangan.');
    const missing = Array.from({ length: f!.chunks }, (_, n) => n).filter((n) => !f!.got?.[n]);
    check(!missing.length, 400, 'Fayl to‘liq yuklanmadi — qaytadan urinib ko‘ring.');
    await siteUpdate({
      [path + '/files/' + v.fid + '/ready']: true,
      [path + '/files/' + v.fid + '/got']: null,
      [path + '/files/' + v.fid + '/at']: now,
      [path + '/upd']: now,
    });
  }
  return { ok: true };
}

/** Bitta bo'lakni saqlash (n — tartib raqami, 0 dan). o — «<buyurtmachi>/<buyurtma>». */
export async function saveServiceChunk(
  a: Actor,
  who: Who | boolean,
  o: string,
  fid: string,
  n: number,
  bytes: Buffer,
) {
  const role: Who = who === true || who === 'admin' ? 'admin' : 'me';
  if (role === 'admin') administrator(a);
  const [uk, id] = o.split('/');
  const s = await load(uk || '', id || '');
  // 🛍 mahsulot chekini bo'lim yopiq bo'lsa ham yuklash mumkin
  if (role === 'me' && !isProduct(s.kind)) await notClosed(a);
  if (role === 'me') check(uk === keyOf(a.id), 403, 'Bu buyurtmaga fayl yuklab bo‘lmaydi.');
  check(ID.test(fid), 400, 'Fayl topilmadi.');
  const f = s.files?.[fid];
  check(
    f && (role === 'me' ? f.side === 'in' || f.side === 'pay' : f.side === 'out'),
    404,
    'Fayl topilmadi.',
  );
  check(!f!.ready, 409, 'Fayl allaqachon yuklangan.');
  check(Number.isInteger(n) && n >= 0 && n < f!.chunks, 400, 'Bo‘lak raqami noto‘g‘ri.');
  const expected = n < f!.chunks - 1 ? FILE_CHUNK : f!.size - FILE_CHUNK * (f!.chunks - 1);
  check(bytes.length === expected, 400, 'Bo‘lak hajmi noto‘g‘ri — qaytadan urinib ko‘ring.');
  if (n === 0) check(magicOk(f!.ext, bytes), 400, 'Fayl buzilgan yoki turi nomiga mos emas.');
  await siteUpdate({
    [dataPath(uk!, fid) + '/' + n]: bytes.toString('base64'),
    [orderPath(uk!, id!) + '/files/' + fid + '/got/' + n]: bytes.length,
  });
  return { ok: true };
}

/** Faylning bir bo'lagi (yuklab olish uchun): buyurtmachining o'zi yoki administrator. */
export async function serviceChunk(a: Actor, o: string, fid: string, n: number) {
  const [uk, id] = o.split('/');
  const me = keyOf(a.id);
  const s = await load(uk || '', id || '').catch(() => null);
  const allowed = !!s && (uk === me || (await isAdminActor(a)));
  if (!allowed) throw new ApiError(404, 'Fayl topilmadi.');
  check(ID.test(fid) && Number.isInteger(n) && n >= 0 && n < 64, 404, 'Fayl topilmadi.');
  const f = s!.files?.[fid];
  check(f?.ready && n < f.chunks, 404, 'Fayl topilmadi.');
  const data = await siteGet<string>(dataPath(uk!, fid) + '/' + n);
  check(typeof data === 'string', 404, 'Fayl topilmadi.');
  return { bytes: Buffer.from(data!, 'base64'), mime: FILE_TYPES[f!.ext].mime };
}

/** Hisob o'chirilganda: avvalgi (ijrochilar bozori davridagi) ijrochi profili ham qolmasin. Buyurtmalar, fayllar va
    sanoqlarni app-store.ts o'zi o'chiradi. */
export async function forgetServiceUser(key: string) {
  return { ['serviceWorkers/' + key]: null } as Record<string, unknown>;
}
