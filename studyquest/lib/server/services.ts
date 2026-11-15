import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  ACTIVE_MAX,
  FILE_CHUNK,
  FILE_MAX,
  FILES_PER_ORDER,
  FILE_TYPES,
  KEEP_DAYS,
  SERVICE_KINDS,
  fileExt,
  isActive,
  serviceKind,
  type AdminOrder,
  type FileExt,
  type OrderFile,
  type OrderMsg,
  type ServiceCard,
  type ServiceOrder,
  type ServiceSetting,
  type ServiceStatus,
  type ServicesAdminView,
  type ServicesView,
} from '../services';
import { ApiError, administrator, check } from './auth';
import { repository } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { sendPush } from './push';
import { supportAct } from './support';

/* 💼 Pullik xizmatlar. Asl bazaning site/ bo'limida (brauzerlar tegolmaydi, faqat server):
     serviceInfo                       = {how, open}           — to'lov yo'riqnomasi; open — bo'lim ishga tushganmi
                                                                 (yo'q bo'lsa talabaga «tez orada» oynasi, buyurtma yo'q)
     serviceCatalog/<yo'nalish>        = {price, days, off}    — narx, muddat, yopiq/ochiq
     serviceOrders/<foydalanuvchi>/<id> = buyurtma (matn, holat, narx, yozishma, fayllar ro'yxati)
     serviceFiles/<foydalanuvchi>/<fayl>/<n> = faylning n-bo'lagi (base64, ≤ 2,5 MB)
     serviceStats/<yo'nalish>/<foydalanuvchi>    = vaqt — shu xizmatga buyurtma bergan (kartadagi «N kishi foydalandi»)
     serviceInterest/<yo'nalish>/<foydalanuvchi> = vaqt — «tez orada» paytida kutayotganini bildirgan («N kishi kutmoqda»)
     (har bir odam bir marta sanaladi; administratorning sinov buyurtmalari sanalmaydi)
   Holatlar: new (jamoa ko'rib chiqadi) → quoted (narx aytildi) → paid (talaba «To'lov qildim» bosdi) → work (to'lov
   tasdiqlandi, ish bajarilmoqda) → done (natija yuklandi); istalgan paytda cancel. Fayllar bekor qilinganda darhol,
   topshirilgandan KEEP_DAYS kun keyin o'chiriladi. Hisob o'chirilganda foydalanuvchining ikkala bo'limi ham
   o'chadi (app-store.ts). */

type StoredFile = {
  side: 'in' | 'out';
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
  due?: string;
  contact?: string;
  status: ServiceStatus;
  at: number;
  upd: number;
  price?: string;
  eta?: string;
  paidAt?: number;
  paidNote?: string;
  doneAt?: number;
  reason?: string;
  link?: string;
  expired?: boolean;
  files?: Record<string, StoredFile>;
  msgs?: Record<string, { from: 'user' | 'team'; text: string; at: number }>;
};

const DAY = 86400000;
const STALE_MS = DAY;
const ID = /^[a-z0-9]{6,40}$/;
const UK = /^[A-Za-z0-9_-]{1,120}$/;
const ORDERS_MAX = 50;
const MSGS_MAX = 100;
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const newId = (now: number) => now.toString(36) + randomUUID().replace(/-/g, '').slice(0, 8);
const orderPath = (uk: string, id: string) => 'serviceOrders/' + uk + '/' + id;
const dataPath = (uk: string, fid: string) => 'serviceFiles/' + uk + '/' + fid;
const kindName = (kind: string) => serviceKind(kind)?.name[0] || kind;

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
      ...(s.price ? { price: String(s.price) } : {}),
      ...(s.days ? { days: String(s.days) } : {}),
      ...(s.off ? { off: true } : {}),
    };
  }).filter((k) => all || !k.off);
  return { catalog, people: used.total, fans: wants.total };
}
async function readInfo() {
  const v = await siteGet<{ how?: string; open?: boolean }>('serviceInfo');
  return { how: v?.how || '', open: v?.open === true };
}
/** Bo'lim hali ishga tushmagan bo'lsa buyurtmani faqat administrator (sinab ko'rish uchun) bera oladi. */
async function canOrder(a: Actor) {
  if ((await readInfo()).open || a.role === 'admin') return;
  // tejamkor (readOnly) so'rovda Firestore'dagi administrator roli ko'rinmaydi — bir marta tekshiriladi
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  check(
    stored?.role === 'admin',
    409,
    'Pullik xizmatlar hali ishga tushmagan. Taklifingizni yozib qoldiring — ishga tushganda xabar beramiz.',
  );
}

function toOrder(uk: string, id: string, s: Stored): ServiceOrder {
  const files: OrderFile[] = Object.entries(s.files || {})
    .filter(([fid, f]) => ID.test(fid) && f?.ready && f.ext in FILE_TYPES)
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([fid, f]) => ({
      id: fid,
      side: f.side === 'out' ? 'out' : 'in',
      name: f.name,
      ext: f.ext,
      size: f.size,
      chunks: f.chunks,
      at: f.at,
    }));
  const msgs: OrderMsg[] = Object.entries(s.msgs || {})
    .filter(([, m]) => m && typeof m.text === 'string')
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([mid, m]) => ({
      id: mid,
      from: m.from === 'team' ? 'team' : 'user',
      text: m.text,
      at: m.at,
    }));
  return {
    id,
    uk,
    kind: s.kind,
    title: s.title,
    text: s.text,
    status: s.status,
    at: s.at,
    upd: s.upd || s.at,
    ...(s.due ? { due: s.due } : {}),
    ...(s.contact ? { contact: s.contact } : {}),
    ...(s.price ? { price: s.price } : {}),
    ...(s.eta ? { eta: s.eta } : {}),
    ...(s.paidAt ? { paidAt: s.paidAt } : {}),
    ...(s.paidNote ? { paidNote: s.paidNote } : {}),
    ...(s.doneAt ? { doneAt: s.doneAt } : {}),
    ...(s.reason ? { reason: s.reason } : {}),
    ...(s.link ? { link: s.link } : {}),
    ...(s.expired ? { expired: true } : {}),
    files,
    msgs,
  };
}

/** Eskirgan fayllarni tozalash: bekor qilingan buyurtma fayllari, topshirilganiga KEEP_DAYS kun bo'lgan natijalar va
    bir kundan beri tugallanmagan yuklashlar. Bazaga yozadigan o'zgarishlarni qaytaradi (va `orders` ni yangilaydi). */
function sweep(uk: string, orders: Record<string, Stored>, now: number) {
  const patch: Record<string, unknown> = {};
  for (const [id, s] of Object.entries(orders)) {
    if (!s?.files) continue;
    const old =
      s.status === 'cancel' ||
      (s.status === 'done' && (s.doneAt || s.upd || 0) + KEEP_DAYS * DAY < now);
    for (const [fid, f] of Object.entries(s.files))
      if (old || (!f?.ready && now - (f?.at || 0) > STALE_MS)) {
        patch[orderPath(uk, id) + '/files/' + fid] = null;
        patch[dataPath(uk, fid)] = null;
        delete s.files[fid];
      }
    if (old && s.status === 'done' && !s.expired) {
      patch[orderPath(uk, id) + '/expired'] = true;
      s.expired = true;
    }
  }
  return patch;
}

/** Foydalanuvchi (yoki mehmon): katalog, to'lov yo'riqnomasi va o'z buyurtmalari. */
export async function servicesView(a: Actor | null, now = Date.now()): Promise<ServicesView> {
  const [{ catalog, people, fans }, info] = await Promise.all([readCatalog(false), readInfo()]);
  const head = { open: info.open, catalog, people, fans };
  if (!a) return { ...head, signedIn: false };
  const uk = keyOf(a.id);
  const raw = await siteGet<Record<string, Stored>>('serviceOrders/' + uk);
  const how = info.how;
  const own = raw || {};
  const patch = sweep(uk, own, now);
  if (Object.keys(patch).length) await siteUpdate(patch);
  const orders = Object.entries(own)
    .filter(([id, s]) => ID.test(id) && s?.kind)
    .map(([id, s]) => toOrder(uk, id, s))
    .sort((x, y) => y.at - x.at);
  return { ...head, how, orders, signedIn: true };
}

const STATUS_ORDER: Record<ServiceStatus, number> = {
  new: 0,
  paid: 1,
  quoted: 2,
  work: 3,
  done: 4,
  cancel: 5,
};
/** Administrator: hamma buyurtmalar (buyurtmachi ma'lumotlari bilan), katalog sozlamalari va to'lov yo'riqnomasi. */
export async function servicesAdmin(a: Actor, now = Date.now()): Promise<ServicesAdminView> {
  administrator(a);
  const [all, { catalog, people, fans }, { how, open }] = await Promise.all([
    siteGet<Record<string, Record<string, Stored>>>('serviceOrders'),
    readCatalog(true),
    readInfo(),
  ]);
  const orders: AdminOrder[] = [];
  const patch: Record<string, unknown> = {};
  let used = 0;
  for (const [uk, list] of Object.entries(all || {})) {
    if (!UK.test(uk) || !list) continue;
    Object.assign(patch, sweep(uk, list, now));
    for (const [id, s] of Object.entries(list)) {
      if (!ID.test(id) || !s?.kind) continue;
      used += Object.values(s.files || {}).reduce((n, f) => n + (f?.size || 0), 0);
      orders.push({
        ...toOrder(uk, id, s),
        name: s.name,
        ...(s.group ? { group: s.group } : {}),
        ...(s.email ? { email: s.email } : {}),
        ...(s.role ? { role: s.role } : {}),
      });
    }
  }
  if (Object.keys(patch).length) await siteUpdate(patch);
  orders.sort((x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || y.upd - x.upd);
  return { open, catalog, people, fans, how, orders, used };
}

/* ---------- 🔔 bildirishnomalar (xatosi buyurtmani to'xtatmaydi) ---------- */
async function notifyUser(uid: string, t: string, b: string) {
  try {
    await sendPush({ t, b, u: '/#services', g: 'services' }, (s) => s.uid === uid);
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

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const fileBegin = { name: text(3, 180), size: z.number().int().positive() };
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
      due: day.optional(),
      contact: z.string().trim().max(80).optional(),
    })
    .strict(),
  z.object({ op: z.literal('paid'), id: z.string(), note: z.string().trim().max(200) }).strict(),
  z.object({ op: z.literal('cancel'), id: z.string() }).strict(),
  z.object({ op: z.literal('msg'), id: z.string(), text: text(1, 1000) }).strict(),
  z.object({ op: z.literal('revise'), id: z.string(), text: text(3, 1000) }).strict(),
  z.object({ op: z.literal('remove'), id: z.string() }).strict(),
  z.object({ op: z.literal('begin'), id: z.string(), ...fileBegin }).strict(),
  z.object({ op: z.literal('finish'), id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('unfile'), id: z.string(), fid: z.string() }).strict(),
]);

/** Foydalanuvchi amallari: buyurtma berish, «To'lov qildim», bekor qilish, yozishma, tuzatish so'rash, fayl biriktirish. */
export async function manageServices(a: Actor, raw: unknown, now = Date.now()) {
  const v = userInput.parse(raw);
  const uk = keyOf(a.id);
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
        Object.fromEntries(kinds.map((k) => ['serviceInterest/' + k.id + '/' + uk, now])),
      );
    return { view: await servicesView(a, now) };
  }
  if (v.op === 'order') {
    await canOrder(a);
    const kind = (await readCatalog(false)).catalog.find((k) => k.id === v.kind);
    check(kind, 400, 'Bu yo‘nalish hozir yopiq. Boshqasini tanlang.');
    const mine = (await siteGet<Record<string, Stored>>('serviceOrders/' + uk)) || {};
    const list = Object.values(mine).filter((s) => s?.kind);
    check(
      list.filter((s) => isActive(s.status)).length < ACTIVE_MAX,
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
      ...(v.due ? { due: v.due } : {}),
      ...(v.contact ? { contact: v.contact } : {}),
      status: 'new',
      at: now,
      upd: now,
    };
    await siteUpdate({
      [orderPath(uk, id)]: order,
      // kartadagi «N kishi foydalandi» (administratorning sinov buyurtmasi sanalmaydi)
      ...(a.role !== 'admin' ? { ['serviceStats/' + kind!.id + '/' + uk]: now } : {}),
    });
    await notifyTeam('💼 Yangi buyurtma', kindName(kind!.id) + ': ' + v.title);
    return { id, view: await servicesView(a, now) };
  }
  const s = await load(uk, v.id);
  check(s.uid === a.id, 404, 'Buyurtma topilmadi.');
  const path = orderPath(uk, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'paid') {
    check(s.status === 'quoted', 409, 'Bu buyurtma to‘lov kutayotgani yo‘q.');
    Object.assign(patch, {
      [path + '/status']: 'paid',
      [path + '/paidAt']: now,
      [path + '/paidNote']: v.note || null,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyTeam(
      '💳 To‘lov qilindi',
      s.name + ' — ' + s.title + (v.note ? ' · ' + v.note : ''),
    );
  } else if (v.op === 'cancel') {
    check(
      s.status === 'new' || s.status === 'quoted',
      409,
      'To‘lovdan keyin buyurtmani administrator orqali bekor qilish mumkin — yozishmada yozing.',
    );
    dropFiles(patch, uk, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: 'Buyurtmachi bekor qildi',
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
  } else if (v.op === 'msg') {
    check(s.status !== 'cancel', 409, 'Buyurtma bekor qilingan.');
    addMsg(patch, uk, v.id, s, 'user', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    await notifyTeam('💬 ' + s.name, s.title + ': ' + v.text);
  } else if (v.op === 'revise') {
    check(s.status === 'done', 409, 'Tuzatishni ish tayyor bo‘lgandan keyin so‘rash mumkin.');
    check(!s.expired, 409, 'Bu buyurtma fayllari saqlash muddati tugagan — yangi buyurtma bering.');
    addMsg(patch, uk, v.id, s, 'user', '🔁 Tuzatish: ' + v.text, now);
    Object.assign(patch, { [path + '/status']: 'work', [path + '/upd']: now });
    await siteUpdate(patch);
    await notifyTeam('🔁 Tuzatish so‘raldi', s.name + ' — ' + s.title);
  } else if (v.op === 'remove') {
    check(!isActive(s.status), 409, 'Ochiq buyurtmani o‘chirib bo‘lmaydi — avval bekor qiling.');
    for (const fid of Object.keys(s.files || {})) patch[dataPath(uk, fid)] = null;
    patch[path] = null;
    await siteUpdate(patch);
  } else return fileOp(a, false, uk, v.id, s, v, now);
  return { view: await servicesView(a, now) };
}

const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('quote'),
      uk: z.string(),
      id: z.string(),
      price: text(1, 60),
      eta: z.string().trim().max(60).optional(),
      note: z.string().trim().max(1000).optional(),
    })
    .strict(),
  z.object({ op: z.literal('confirm'), uk: z.string(), id: z.string() }).strict(),
  z
    .object({
      op: z.literal('status'),
      uk: z.string(),
      id: z.string(),
      status: z.enum(['work', 'done']),
    })
    .strict(),
  z
    .object({
      op: z.literal('link'),
      uk: z.string(),
      id: z.string(),
      link: z.union([z.literal(''), z.string().trim().max(500).url().startsWith('https://')]),
    })
    .strict(),
  z
    .object({ op: z.literal('cancel'), uk: z.string(), id: z.string(), reason: text(3, 300) })
    .strict(),
  z.object({ op: z.literal('msg'), uk: z.string(), id: z.string(), text: text(1, 1000) }).strict(),
  z.object({ op: z.literal('remove'), uk: z.string(), id: z.string() }).strict(),
  z.object({ op: z.literal('begin'), uk: z.string(), id: z.string(), ...fileBegin }).strict(),
  z.object({ op: z.literal('finish'), uk: z.string(), id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('unfile'), uk: z.string(), id: z.string(), fid: z.string() }).strict(),
  z
    .object({
      op: z.literal('catalog'),
      kind: z.string().max(40),
      price: z.string().trim().max(60),
      days: z.string().trim().max(40),
      off: z.boolean(),
    })
    .strict(),
  z.object({ op: z.literal('info'), how: z.string().trim().max(1500) }).strict(),
  z.object({ op: z.literal('launch'), open: z.boolean() }).strict(),
]);

/** Administrator amallari: narx aytish, to'lovni tasdiqlash, natija yuklash, topshirish, bekor qilish, katalog. */
export async function adminServices(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = adminInput.parse(raw);
  if (v.op === 'catalog') {
    check(serviceKind(v.kind), 404, 'Yo‘nalish topilmadi.');
    await siteUpdate({
      ['serviceCatalog/' + v.kind]:
        v.price || v.days || v.off
          ? {
              ...(v.price ? { price: v.price } : {}),
              ...(v.days ? { days: v.days } : {}),
              ...(v.off ? { off: true } : {}),
            }
          : null,
    });
    return { admin: await servicesAdmin(a, now) };
  }
  if (v.op === 'launch') {
    await siteUpdate({ 'serviceInfo/open': v.open || null });
    return { admin: await servicesAdmin(a, now) };
  }
  if (v.op === 'info') {
    await siteUpdate({ 'serviceInfo/how': v.how || null });
    return { admin: await servicesAdmin(a, now) };
  }
  const s = await load(v.uk, v.id);
  const path = orderPath(v.uk, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'quote') {
    check(
      s.status === 'new' || s.status === 'quoted',
      409,
      'Narxni to‘lovdan oldin belgilash mumkin.',
    );
    Object.assign(patch, {
      [path + '/status']: 'quoted',
      [path + '/price']: v.price,
      [path + '/eta']: v.eta || null,
      [path + '/upd']: now,
    });
    if (v.note) addMsg(patch, v.uk, v.id, s, 'team', v.note, now);
    await siteUpdate(patch);
    await notifyUser(
      s.uid,
      '💳 Narx belgilandi',
      s.title + ': ' + v.price + (v.eta ? ' · ' + v.eta : ''),
    );
  } else if (v.op === 'confirm') {
    check(
      s.status === 'quoted' || s.status === 'paid',
      409,
      'Bu buyurtma to‘lov kutayotgani yo‘q.',
    );
    Object.assign(patch, {
      [path + '/status']: 'work',
      [path + '/paidAt']: s.paidAt || now,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyUser(s.uid, '🛠 To‘lov tasdiqlandi', s.title + ' — ish boshlandi.');
  } else if (v.op === 'status') {
    check(
      s.status === 'work' || s.status === 'done' || s.status === 'paid',
      409,
      'Avval narx belgilang va to‘lovni tasdiqlang.',
    );
    if (v.status === 'done')
      check(
        Object.values(s.files || {}).some((f) => f?.ready && f.side === 'out') || s.link,
        400,
        'Avval tayyor ish faylini yuklang yoki havola qo‘ying.',
      );
    Object.assign(patch, {
      [path + '/status']: v.status,
      [path + '/upd']: now,
      ...(v.status === 'done' ? { [path + '/doneAt']: now, [path + '/expired']: null } : {}),
    });
    await siteUpdate(patch);
    if (v.status === 'done')
      await notifyUser(s.uid, '✅ Buyurtmangiz tayyor', s.title + ' — yuklab oling.');
  } else if (v.op === 'link') {
    Object.assign(patch, { [path + '/link']: v.link || null, [path + '/upd']: now });
    await siteUpdate(patch);
  } else if (v.op === 'cancel') {
    check(s.status !== 'cancel', 409, 'Buyurtma allaqachon bekor qilingan.');
    dropFiles(patch, v.uk, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: v.reason,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyUser(s.uid, '✖ Buyurtma bekor qilindi', s.title + ': ' + v.reason);
  } else if (v.op === 'msg') {
    addMsg(patch, v.uk, v.id, s, 'team', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    await notifyUser(s.uid, '💬 Jamoadan xabar', s.title + ': ' + v.text);
  } else if (v.op === 'remove') {
    for (const fid of Object.keys(s.files || {})) patch[dataPath(v.uk, fid)] = null;
    patch[path] = null;
    await siteUpdate(patch);
  } else {
    const r = await fileOp(a, true, v.uk, v.id, s, v, now);
    return 'fid' in r ? r : { admin: await servicesAdmin(a, now) };
  }
  return { admin: await servicesAdmin(a, now) };
}

/* ---------- 📎 fayllar ---------- */
/** Faylning birinchi baytlari kengaytmasiga mosmi (soxta fayl yuklanmasin). */
function magicOk(ext: FileExt, b: Buffer) {
  if (ext === 'pdf') return b.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === 'docx' || ext === 'pptx' || ext === 'xlsx' || ext === 'zip')
    return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  if (ext === 'png') return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === 'jpg' || ext === 'jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

type FileOp =
  | { op: 'begin'; name: string; size: number }
  | { op: 'finish'; fid: string }
  | { op: 'unfile'; fid: string };
/** Fayl amallari: begin (joy ochish) → bo'laklar (saveServiceChunk) → finish; unfile — o'chirish.
    Talaba faqat o'z buyurtmasiga «in» fayl, jamoa «out» (tayyor ish) fayl yuklaydi. */
async function fileOp(
  a: Actor,
  team: boolean,
  uk: string,
  id: string,
  s: Stored,
  v: FileOp,
  now: number,
): Promise<{ fid: string; chunk: number; chunks: number } | { view: ServicesView } | { ok: true }> {
  const path = orderPath(uk, id);
  const side = team ? 'out' : 'in';
  if (v.op === 'begin') {
    check(
      team ? s.status !== 'cancel' : isActive(s.status),
      409,
      'Bu buyurtmaga fayl qo‘shib bo‘lmaydi.',
    );
    const ext = fileExt(v.name);
    check(
      ext,
      400,
      'Bu turdagi fayl qabul qilinmaydi: PDF, Word, PowerPoint, Excel, ZIP yoki rasm.',
    );
    check(v.size <= FILE_MAX[side], 413, `Fayl ${FILE_MAX[side] / 1024 / 1024} MB dan oshmasin.`);
    const files = Object.values(s.files || {}).filter((f) => f?.side === side && f.ready);
    check(
      files.length < FILES_PER_ORDER[side],
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
    check(team || (f!.side === 'in' && isActive(s.status)), 403, 'Bu faylni o‘chirib bo‘lmaydi.');
    await siteUpdate({ [path + '/files/' + v.fid]: null, [dataPath(uk, v.fid)]: null });
  } else {
    check(f!.side === side, 403, 'Bu faylni yuklab bo‘lmaydi.');
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
  return team ? { ok: true } : { view: await servicesView(a, now) };
}

/** Bitta bo'lakni saqlash (n — tartib raqami, 0 dan). o — «<foydalanuvchi>/<buyurtma>». */
export async function saveServiceChunk(
  a: Actor,
  team: boolean,
  o: string,
  fid: string,
  n: number,
  bytes: Buffer,
) {
  if (team) administrator(a);
  const [uk, id] = o.split('/');
  check(team || uk === keyOf(a.id), 403, 'Bu buyurtmaga fayl yuklab bo‘lmaydi.');
  const s = await load(uk || '', id || '');
  check(ID.test(fid), 400, 'Fayl topilmadi.');
  const f = s.files?.[fid];
  check(f && f.side === (team ? 'out' : 'in'), 404, 'Fayl topilmadi.');
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

/** Faylning bir bo'lagi (yuklab olish uchun): faqat buyurtma egasi yoki administrator, faqat to'liq yuklangan fayl. */
export async function serviceChunk(a: Actor, o: string, fid: string, n: number) {
  const [uk, id] = o.split('/');
  let allowed = uk === keyOf(a.id) || a.role === 'admin';
  if (!allowed) {
    // tejamkor (readOnly) so'rovda Firestore'dagi administrator roli ko'rinmaydi — bir marta tekshiriladi
    const stored = await repository()
      .then((r) => r.get('users', a.id))
      .catch(() => null);
    allowed = stored?.role === 'admin';
  }
  if (!allowed) throw new ApiError(404, 'Fayl topilmadi.');
  const s = await load(uk || '', id || '');
  check(ID.test(fid) && Number.isInteger(n) && n >= 0 && n < 64, 404, 'Fayl topilmadi.');
  const f = s.files?.[fid];
  check(f?.ready && n < f.chunks, 404, 'Fayl topilmadi.');
  const data = await siteGet<string>(dataPath(uk!, fid) + '/' + n);
  check(typeof data === 'string', 404, 'Fayl topilmadi.');
  return { bytes: Buffer.from(data!, 'base64'), mime: FILE_TYPES[f!.ext].mime };
}
