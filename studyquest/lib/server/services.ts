import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import {
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
  type ServiceOrder,
  type ServiceSetting,
  type ServiceStatus,
  type ServicesAdminView,
  type ServicesView,
} from '../services';
import { ApiError, administrator, check } from './auth';
import { sendPush } from './push';
import { repository } from './repository';
import { siteGet, siteTransaction, siteUpdate } from './site-content';

/* So‘rovlar va fayllar RTDBdagi avvalgi serviceOrders va serviceFiles yo‘llarida saqlanadi.
   «draft» admin ro‘yxatiga chiqmaydi. So‘rov va natija barcha fayllari tayyor bo‘lgach yuboriladi. */
type StoredFile = {
  side: OrderFile['side'];
  name: string;
  ext: FileExt;
  size: number;
  chunks: number;
  at: number;
  ready?: boolean;
  got?: Record<number, number>;
  scoped?: true;
};
type Stored = {
  uid: string;
  name: string;
  group?: string;
  kind: string;
  title: string;
  text: string;
  status: ServiceStatus | 'draft' | 'open' | 'quoted' | 'assigned' | 'paid' | 'review';
  at: number;
  upd: number;
  draftFiles?: string[];
  reply?: string;
  link?: string;
  reason?: string;
  expired?: boolean;
  doneAt?: number;
  deliveredAt?: number;
  files?: Record<string, StoredFile>;
  msgs?: Record<string, Omit<OrderMsg, 'id'>>;
  // Avvalgi buyurtmalar va hisobni o‘chirish uchun saqlanadigan maydonlar.
  budget?: number;
  paidNote?: string;
  due?: string;
  contact?: string;
  apps?: Record<string, unknown>;
  worker?: { uk: string };
  payout?: unknown;
};
type Orders = Record<string, Stored>;

const DAY = 86400000;
const ID = /^[a-z0-9]{6,40}$/;
const UK = /^[A-Za-z0-9_-]{1,120}$/;
const ACTIVE_MAX = 5;
const ORDERS_MAX = 50;
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const ordersPath = (uk: string) => 'serviceOrders/' + uk;
const orderPath = (uk: string, id: string) => ordersPath(uk) + '/' + id;
const dataPath = (uk: string, id: string, fid: string, file: StoredFile) =>
  'serviceFiles/' + uk + '/' + (file.scoped ? id + '/' : '') + fid;

function statusOf(s: Stored): ServiceStatus {
  if (s.status === 'work' || s.status === 'cancel' || s.status === 'done') return s.status;
  if (s.status === 'review') return 'done';
  return 'new';
}

async function readCatalog(includeDisabled = false) {
  const settings = await siteGet<Record<string, ServiceSetting>>('serviceCatalog');
  return SERVICE_KINDS.map((kind) => {
    const { price, days, off } = settings?.[kind.id] || {};
    return { ...kind, price, days, off };
  }).filter((kind) => includeDisabled || !kind.off);
}

export async function servicesShown() {
  return (await siteGet<boolean>('serviceInfo/shown')) === true;
}

async function isAdminActor(a: Actor) {
  if (a.role === 'admin') return true;
  // Read-only Firebase sessions may lack a role sourced from the user record.
  const user = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  return user?.role === 'admin';
}

async function canOrder(a: Actor) {
  check(
    (await servicesShown()) || (await isAdminActor(a)),
    403,
    'Pullik xizmatlar bo‘limi vaqtincha yopiq.',
  );
}

function hasResult(s: Stored) {
  return statusOf(s) === 'done' || Boolean(s.deliveredAt && s.status === 'work');
}

function toOrder(uk: string, id: string, s: Stored, admin = false): ServiceOrder {
  const showResult = hasResult(s);
  const files = Object.entries(s.files || {})
    .filter(([fid, f]) => {
      if (!ID.test(fid) || !f || !Object.hasOwn(FILE_TYPES, f.ext)) return false;
      return admin || (f.ready && (f.side !== 'out' || showResult));
    })
    .sort(([, a], [, b]) => a.at - b.at)
    .map(([fid, f]): OrderFile => ({
      id: fid,
      side: f.side === 'out' ? 'out' : 'in',
      name: f.name,
      ext: f.ext,
      size: f.size,
      chunks: f.chunks,
      ready: f.ready === true,
    }));
  const msgs = Object.entries(s.msgs || {})
    .filter(([, m]) => m && typeof m.text === 'string')
    .sort(([, a], [, b]) => a.at - b.at)
    .map(([mid, m]) => ({ id: mid, from: m.from, text: m.text, at: m.at }));

  return {
    id,
    uk,
    kind: s.kind,
    title: s.title,
    text: s.text,
    status: statusOf(s),
    at: s.at,
    upd: s.upd || s.at,
    ...(showResult && s.reply ? { reply: s.reply } : {}),
    ...((showResult || admin) && s.link?.startsWith('https://') ? { link: s.link } : {}),
    ...(s.reason ? { reason: s.reason } : {}),
    ...(s.expired ? { expired: true } : {}),
    files,
    msgs,
  };
}

async function deleteFileData(paths: string[]) {
  if (paths.length) await siteUpdate(Object.fromEntries(paths.map((path) => [path, null])));
}

function expiredFiles(s: Stored, now: number) {
  return (
    s.status === 'cancel' ||
    (s.status === 'done' && (s.doneAt || s.upd || s.at) + KEEP_DAYS * DAY < now)
  );
}

async function sweepOrders(uk: string, orders: Orders, now: number) {
  for (const [id, order] of Object.entries(orders)) {
    if (!ID.test(id) || !order?.kind) continue;
    const stale = (s: Stored) => s.status === 'draft' && now - s.upd > DAY;
    const toRemove = (s: Stored) =>
      Object.entries(s.files || {}).filter(
        ([fid, f]) => ID.test(fid) && f && (expiredFiles(s, now) || (!f.ready && now - f.at > DAY)),
      );
    if (!stale(order) && !toRemove(order).length) continue;
    let removed: string[] = [];
    const current = await siteTransaction<Stored>(orderPath(uk, id), (s) => {
      removed = [];
      if (!s) return null;
      if (stale(s)) {
        removed = Object.entries(s.files || {})
          .filter(([fid, f]) => ID.test(fid) && f)
          .map(([fid, f]) => dataPath(uk, id, fid, f));
        return null;
      }
      const files = { ...s.files };
      for (const [fid, f] of toRemove(s)) {
        removed.push(dataPath(uk, id, fid, f));
        delete files[fid];
      }
      return {
        ...s,
        files,
        ...(s.status === 'done' && expiredFiles(s, now) ? { expired: true } : {}),
      };
    });
    if (current) orders[id] = current;
    else delete orders[id];
    await deleteFileData(removed);
  }
}

export async function servicesView(a: Actor | null, now = Date.now()): Promise<ServicesView> {
  const [catalog, shown] = await Promise.all([readCatalog(), servicesShown()]);
  if (!a) return { shown, catalog, signedIn: false };
  const uk = keyOf(a.id);
  const orders = (await siteGet<Orders>(ordersPath(uk))) || {};
  await sweepOrders(uk, orders, now);
  return {
    shown,
    catalog,
    signedIn: true,
    orders: Object.entries(orders)
      .filter(([id, s]) => ID.test(id) && s?.uid === a.id && s.kind && s.status !== 'draft')
      .map(([id, s]) => toOrder(uk, id, s))
      .sort((a, b) => b.upd - a.upd),
  };
}

export async function servicesAdmin(a: Actor, now = Date.now()): Promise<ServicesAdminView> {
  administrator(a);
  const [catalog, shown, all] = await Promise.all([
    readCatalog(true),
    servicesShown(),
    siteGet<Record<string, Orders>>('serviceOrders'),
  ]);
  const orders: AdminOrder[] = [];
  for (const [uk, list] of Object.entries(all || {})) {
    if (!UK.test(uk) || !list) continue;
    await sweepOrders(uk, list, now);
    for (const [id, s] of Object.entries(list)) {
      if (!ID.test(id) || !s?.kind || s.status === 'draft') continue;
      orders.push({
        ...toOrder(uk, id, s, true),
        name: s.name,
        ...(s.group ? { group: s.group } : {}),
        ...(s.budget ? { budget: s.budget } : {}),
        ...(s.paidNote ? { paidNote: s.paidNote } : {}),
        ...(s.due ? { due: s.due } : {}),
        ...(s.contact ? { contact: s.contact } : {}),
      });
    }
  }
  orders.sort((a, b) => Number(isActive(b.status)) - Number(isActive(a.status)) || b.upd - a.upd);
  return { shown, catalog, orders };
}

async function notifyAdmin(kind: string) {
  await sendPush(
    {
      t: 'Yangi xizmat buyurtmasi',
      b: serviceKind(kind)?.name[0] || 'Pullik xizmatlar',
      u: '/#admin/services',
      g: 'services-admin',
    },
    (s) => s.role === 'admin',
  ).catch(() => {});
}

async function notifyCustomer(order: Stored) {
  await sendPush(
    {
      t: order.status === 'cancel' ? 'Buyurtma bekor qilindi' : 'Buyurtmangizga javob tayyor',
      b: serviceKind(order.kind)?.name[0] || 'Pullik xizmatlar',
      u: '/#services/mine',
      g: 'services',
    },
    (s) => s.uid === order.uid,
  ).catch(() => {});
}

async function load(uk: string, id: string) {
  const s = await siteGet<Stored>(orderPath(uk, id));
  if (!s?.kind) throw new ApiError(404, 'Buyurtma topilmadi.');
  return s;
}

async function editOrder(uk: string, id: string, edit: (order: Stored) => Stored) {
  // A cold RTDB client can receive null before the server's current value.
  const s = await siteTransaction<Stored>(orderPath(uk, id), (current) =>
    current?.kind ? edit(current) : null,
  );
  if (!s?.kind) throw new ApiError(404, 'Buyurtma topilmadi.');
  return s;
}

const idField = z.string().regex(ID);
const ukField = z.string().regex(UK);
const orderKeys = { uk: ukField, id: idField };
const fileFields = {
  fid: idField,
  name: z.string().trim().min(3).max(180),
  size: z.number().int().positive(),
};
const linkField = z.union([z.literal(''), z.string().trim().max(500).url().startsWith('https://')]);
const userInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('draft'),
      id: idField,
      kind: z.string().max(40),
      text: z.string().trim().min(3).max(3000),
      files: z.array(idField).max(FILES_PER_ORDER.in),
    })
    .strict(),
  z.object({ op: z.literal('submit'), id: idField }).strict(),
  z.object({ op: z.literal('remove'), id: idField }).strict(),
  z.object({ op: z.literal('begin'), id: idField, ...fileFields }).strict(),
  z.object({ op: z.literal('finish'), id: idField, fid: idField }).strict(),
]);

const adminInput = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('catalog'),
      kind: z.string().max(40),
      price: z.string().trim().max(60),
      days: z.string().trim().max(40),
      off: z.boolean(),
    })
    .strict(),
  z.object({ op: z.literal('show'), shown: z.boolean() }).strict(),
  z
    .object({
      op: z.literal('deliver'),
      ...orderKeys,
      text: z.string().trim().max(2500),
      link: linkField,
    })
    .strict(),
  z
    .object({
      op: z.literal('cancel'),
      ...orderKeys,
      reason: z.string().trim().min(3).max(300),
    })
    .strict(),
  z.object({ op: z.literal('begin'), ...orderKeys, ...fileFields }).strict(),
  z.object({ op: z.literal('finish'), ...orderKeys, fid: idField }).strict(),
  z.object({ op: z.literal('unfile'), ...orderKeys, fid: idField }).strict(),
]);

function owner(a: Actor, s: Stored) {
  check(s.uid === a.id, 404, 'Buyurtma topilmadi.');
}

async function saveDraft(
  a: Actor,
  uk: string,
  v: Extract<z.infer<typeof userInput>, { op: 'draft' }>,
  now: number,
) {
  const setting = serviceKind(v.kind)
    ? await siteGet<ServiceSetting>('serviceCatalog/' + v.kind)
    : null;
  const enabled = serviceKind(v.kind) && !setting?.off;
  let removed: string[] = [];
  const orders = await siteTransaction<Orders>(ordersPath(uk), (current) => {
    removed = [];
    const prev = current?.[v.id];
    if (prev) {
      owner(a, prev);
      if (prev.status !== 'draft') return current;
    }
    check(enabled, 400, 'Bu xizmat hozir mavjud emas.');
    if (!prev) {
      const orders = Object.values(current || {}).filter((s) => s?.kind);
      check(
        orders.filter((s) => isActive(statusOf(s))).length < ACTIVE_MAX,
        429,
        `Bir vaqtda ${ACTIVE_MAX} tagacha buyurtma yuborish mumkin.`,
      );
      check(
        orders.length < ORDERS_MAX,
        429,
        'Ro‘yxat to‘ldi. Eski buyurtmalardan birini olib tashlang.',
      );
    }
    const files = { ...prev?.files };
    for (const [fid, f] of Object.entries(files)) {
      if (v.files.includes(fid)) continue;
      if (f && ID.test(fid)) removed.push(dataPath(uk, v.id, fid, f));
      delete files[fid];
    }
    const draft: Stored = {
      uid: a.id,
      name: (a.name || 'Foydalanuvchi').slice(0, 120),
      ...(a.classId ? { group: String(a.classId).slice(0, 40) } : {}),
      kind: v.kind,
      title: v.text.split(/\r?\n/, 1)[0].slice(0, 160),
      text: v.text,
      status: 'draft',
      at: prev?.at || now,
      upd: now,
      draftFiles: [...new Set(v.files)],
      files,
    };
    return { ...current, [v.id]: draft };
  });
  await deleteFileData(removed);
  return { uk, submitted: orders?.[v.id]?.status !== 'draft' };
}

export async function manageServices(a: Actor, raw: unknown, now = Date.now()) {
  const v = userInput.parse(raw);
  const uk = keyOf(a.id);
  if (v.op === 'remove') {
    const s = await load(uk, v.id);
    owner(a, s);
    check(!isActive(statusOf(s)), 409, 'Faqat tugagan buyurtmani olib tashlash mumkin.');
    check(
      !s.worker || s.payout || s.status === 'cancel',
      409,
      'Bu eski buyurtma bo‘yicha adminga murojaat qiling.',
    );
    await deleteFileData(
      Object.entries(s.files || {})
        .filter(([fid, f]) => ID.test(fid) && f)
        .map(([fid, f]) => dataPath(uk, v.id, fid, f)),
    );
    await siteUpdate({ [orderPath(uk, v.id)]: null });
    return { view: await servicesView(a, now) };
  }
  await canOrder(a);
  if (v.op === 'draft') return saveDraft(a, uk, v, now);
  if (v.op === 'submit') {
    let submitted = false;
    const order = await editOrder(uk, v.id, (s) => {
      submitted = false;
      owner(a, s);
      if (s.status !== 'draft') return s;
      check(
        (s.draftFiles || []).every((fid) => s.files?.[fid]?.ready),
        409,
        'Avval tanlangan fayllarni to‘liq yuklang.',
      );
      submitted = true;
      const { draftFiles: _, ...confirmed } = s;
      return { ...confirmed, status: 'new', at: now, upd: now };
    });
    if (submitted) await notifyAdmin(order.kind);
    return { view: await servicesView(a, now) };
  }
  return fileOp(a, 'in', uk, v, now);
}

export async function adminServices(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = adminInput.parse(raw);
  if (v.op === 'show') {
    await siteUpdate({ 'serviceInfo/shown': v.shown || null });
  } else if (v.op === 'catalog') {
    check(serviceKind(v.kind), 404, 'Xizmat topilmadi.');
    await siteUpdate({
      ['serviceCatalog/' + v.kind]:
        v.price || v.days || v.off ? { price: v.price, days: v.days, off: v.off } : null,
    });
  } else if (v.op === 'deliver' || v.op === 'cancel') {
    let changed = false;
    const order = await editOrder(v.uk, v.id, (s) => {
      changed = false;
      const status = statusOf(s);
      if (v.op === 'cancel' && status === 'cancel') return s;
      if (v.op === 'deliver' && s.status === 'done' && s.reply === v.text && s.link === v.link)
        return s;
      check(s.status !== 'draft' && isActive(status), 409, 'Buyurtma allaqachon yopilgan.');
      if (v.op === 'cancel') {
        changed = true;
        return { ...s, status: 'cancel', reason: v.reason, upd: now };
      }
      const results = Object.values(s.files || {}).filter((f) => f?.side === 'out');
      check(
        results.every((f) => f.ready),
        409,
        'Tugallanmagan faylni yuklang yoki olib tashlang.',
      );
      check(v.text || v.link || results.length, 400, 'Javob matni, fayl yoki havola kiriting.');
      changed = true;
      return {
        ...s,
        status: 'done',
        reply: v.text,
        link: v.link,
        deliveredAt: now,
        doneAt: now,
        upd: now,
      };
    });
    if (changed) await notifyCustomer(order);
  } else {
    const output = await fileOp(a, 'out', v.uk, v, now);
    if (v.op !== 'unfile') return output;
  }
  return { admin: await servicesAdmin(a, now) };
}

function magicOk(ext: FileExt, b: Buffer) {
  if (ext === 'pdf') return b.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === 'docx' || ext === 'pptx' || ext === 'xlsx' || ext === 'zip')
    return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  if (ext === 'png') return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === 'jpg' || ext === 'jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

type FileOp =
  | { op: 'begin'; id: string; fid: string; name: string; size: number }
  | { op: 'finish' | 'unfile'; id: string; fid: string };

function canUpload(a: Actor, s: Stored, side: OrderFile['side'], fid: string) {
  if (side === 'in') {
    owner(a, s);
    check(
      s.status === 'draft' && s.draftFiles?.includes(fid),
      409,
      'Bu fayl buyurtmada tanlanmagan.',
    );
  } else {
    check(s.status !== 'draft' && isActive(statusOf(s)), 409, 'Buyurtma allaqachon yopilgan.');
  }
}

async function fileOp(a: Actor, side: OrderFile['side'], uk: string, v: FileOp, now: number) {
  let removed: string[] = [];
  const s = await editOrder(uk, v.id, (s) => {
    canUpload(a, s, side, v.fid);
    const files = { ...s.files };
    const f = files[v.fid];
    if (v.op === 'begin') {
      const ext = fileExt(v.name);
      check(ext, 400, 'PDF, Word, PowerPoint, Excel, ZIP yoki rasm yuklang.');
      check(v.size <= FILE_MAX[side], 413, `Fayl ${FILE_MAX[side] / 1024 / 1024} MB dan oshmasin.`);
      const name = v.name.replace(/[\r\n"\\/]/g, '');
      if (f) {
        check(
          f.side === side && f.name === name && f.size === v.size,
          409,
          'Bu fayl boshqasi bilan band.',
        );
        return s;
      }
      check(
        Object.values(files).filter((file) => file?.side === side).length < FILES_PER_ORDER[side],
        409,
        `Bitta buyurtmaga ${FILES_PER_ORDER[side]} tagacha fayl qo‘shiladi.`,
      );
      files[v.fid] = {
        side,
        name,
        ext: ext!,
        size: v.size,
        chunks: Math.ceil(v.size / FILE_CHUNK),
        at: now,
        scoped: true,
      };
    } else {
      if (v.op === 'unfile') {
        removed = f?.side === side ? [dataPath(uk, v.id, v.fid, f)] : [];
        if (removed.length) delete files[v.fid];
      } else if (!f || f.side !== side) throw new ApiError(404, 'Fayl topilmadi.');
      else if (!f.ready) {
        check(
          Array.from({ length: f.chunks }, (_, n) => f.got?.[n]).every(Boolean),
          400,
          'Fayl to‘liq yuklanmadi. Qayta urinib ko‘ring.',
        );
        const { got: _, ...ready } = f;
        files[v.fid] = { ...ready, at: now, ready: true };
      }
    }
    return { ...s, files, upd: now };
  });
  await deleteFileData(removed);
  if (v.op === 'begin') {
    const f = s.files![v.fid];
    return {
      chunk: FILE_CHUNK,
      missing: f.ready
        ? []
        : Array.from({ length: f.chunks }, (_, n) => n).filter((n) => !f.got?.[n]),
    };
  }
  return { ok: true };
}

function fileOrder(o: string) {
  const [uk, id, extra] = o.split('/');
  check(UK.test(uk) && ID.test(id || '') && extra === undefined, 404, 'Buyurtma topilmadi.');
  return { uk, id };
}

export async function saveServiceChunk(
  a: Actor,
  scope: 'me' | 'admin',
  o: string,
  fid: string,
  n: number,
  bytes: Buffer,
) {
  if (scope === 'admin') administrator(a);
  else await canOrder(a);
  const side = scope === 'admin' ? 'out' : 'in';
  const { uk, id } = fileOrder(o);
  check(ID.test(fid), 404, 'Fayl topilmadi.');
  const s = await load(uk, id);
  canUpload(a, s, side, fid);
  const f = s.files?.[fid];
  if (!f || f.side !== side) throw new ApiError(404, 'Fayl topilmadi.');
  check(Number.isInteger(n) && n >= 0 && n < f.chunks, 400, 'Bo‘lak raqami noto‘g‘ri.');
  if (f.ready || f.got?.[n]) return { ok: true };
  const expected = Math.min(FILE_CHUNK, f.size - FILE_CHUNK * n);
  check(bytes.length === expected, 400, 'Bo‘lak hajmi noto‘g‘ri.');
  if (n === 0) check(magicOk(f.ext, bytes), 400, 'Fayl buzilgan yoki turi nomiga mos emas.');
  const path = dataPath(uk, id, fid, f) + '/' + n;
  await siteUpdate({ [path]: bytes.toString('base64') });
  try {
    await editOrder(uk, id, (current) => {
      const currentFile = current.files?.[fid];
      if (currentFile?.ready) return current;
      canUpload(a, current, side, fid);
      if (!currentFile || currentFile.side !== side) throw new ApiError(404, 'Fayl topilmadi.');
      currentFile.got = { ...currentFile.got, [n]: bytes.length };
      return current;
    });
  } catch (err) {
    const current = await siteGet<Stored>(orderPath(uk, id));
    if (!current?.files?.[fid]) await siteUpdate({ [path]: null });
    throw err;
  }
  return { ok: true };
}

export async function serviceChunk(a: Actor, o: string, fid: string, n: number) {
  const { uk, id } = fileOrder(o);
  check(ID.test(fid) && Number.isInteger(n) && n >= 0, 404, 'Fayl topilmadi.');
  const s = await load(uk, id);
  const actingAsOwner = s.uid === a.id;
  const f = s.files?.[fid];
  const ownerCanRead = actingAsOwner && (f?.side !== 'out' || hasResult(s));
  const admin = !ownerCanRead && (await isAdminActor(a));
  check(
    f?.ready &&
      s.status !== 'draft' &&
      s.status !== 'cancel' &&
      !expiredFiles(s, Date.now()) &&
      n < f.chunks &&
      (admin || ownerCanRead),
    404,
    'Fayl topilmadi.',
  );
  const data = await siteGet<string>(dataPath(uk, id, fid, f!) + '/' + n);
  if (typeof data !== 'string') throw new ApiError(404, 'Fayl topilmadi.');
  return { bytes: Buffer.from(data, 'base64') };
}

/** Hisob o‘chirilganda avvalgi ijrochi ma’lumotlari ham olib tashlanadi. */
export async function forgetServiceUser(key: string) {
  const patch: Record<string, unknown> = { ['serviceWorkers/' + key]: null };
  const all = await siteGet<Record<string, Orders>>('serviceOrders');
  for (const [uk, list] of Object.entries(all || {})) {
    if (uk === key) continue;
    for (const [id, s] of Object.entries(list || {})) {
      if (s?.apps?.[key]) patch[orderPath(uk, id) + '/apps/' + key] = null;
      if (s?.worker?.uk === key)
        patch[orderPath(uk, id) + '/worker/name'] = 'O‘chirilgan foydalanuvchi';
    }
  }
  return patch;
}
