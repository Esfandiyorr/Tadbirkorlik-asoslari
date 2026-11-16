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
  SERVICE_KINDS,
  fileExt,
  formatSum,
  isActive,
  maskName,
  serviceKind,
  type AdminOrder,
  type Applicant,
  type BoardTask,
  type FileExt,
  type OrderFile,
  type OrderMsg,
  type ServiceCard,
  type ServiceOrder,
  type ServiceSetting,
  type ServiceStatus,
  type ServicesAdminView,
  type ServicesView,
  type TopWorker,
  type WorkerProfile,
} from '../services';
import { ApiError, administrator, check } from './auth';
import { repository } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { sendPush } from './push';
import { supportAct } from './support';

/* 💼 Pullik xizmatlar — talabalar ish bozori. Asl bazaning site/ bo'limida (brauzerlar tegolmaydi, faqat server):
     serviceInfo                        = {how, open, fee}  — to'lov yo'riqnomasi; bo'lim ishga tushganmi; platforma ulushi %
     serviceCatalog/<yo'nalish>         = {price, days, off} — tavsiya narx, muddat, yopiq/ochiq
     serviceOrders/<buyurtmachi>/<id>   = vazifa: matn, summa, holat, arizalar, ijrochi, to'lov, yozishma, fayllar
     serviceFiles/<buyurtmachi>/<fayl>/<n> = faylning n-bo'lagi (base64, ≤ 2,5 MB)
     serviceWorkers/<ijrochi>           = ijrochi profili: o'zi haqida, yo'nalishlari, pul o'tkazish ma'lumoti, holati
     serviceStats/<yo'nalish>/<foydalanuvchi>    — shu xizmatga buyurtma bergan (kartadagi «N kishi foydalandi»)
     serviceInterest/<yo'nalish>/<foydalanuvchi> — «tez orada» paytida kutayotganini bildirgan («N kishi kutmoqda»)
   Vazifa yo'li: open (e'lon, ijrochilar «Men qilaman» deydi) → assigned (administrator ijrochini tasdiqladi,
   buyurtmachi to'laydi) → paid («To'lov qildim») → work (administrator to'lovni tasdiqladi — ijrochi ishlaydi) →
   review (ijrochi natijani topshirdi) → done (buyurtmachi qabul qildi va baho qo'ydi; administrator ijrochiga pulini
   o'tkazadi — payout); istalgan paytda cancel. Pulni hamma vaqt administrator qabul qiladi va o'tkazadi.
   Fayllar bekor qilinganda darhol, yakunlangandan KEEP_DAYS kun keyin o'chiriladi. */

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
type StoredApp = { uid: string; name: string; note?: string; at: number };
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
  status: ServiceStatus | 'new' | 'quoted';
  at: number;
  upd: number;
  apps?: Record<string, StoredApp>;
  worker?: { uk: string; uid: string; name: string; at: number };
  paidAt?: number;
  paidNote?: string;
  deliveredAt?: number;
  doneAt?: number;
  reason?: string;
  link?: string;
  expired?: boolean;
  rating?: number;
  review?: string;
  payout?: { amount: number; at: number; note?: string; by?: string };
  files?: Record<string, StoredFile>;
  msgs?: Record<string, { from: 'user' | 'worker' | 'team'; text: string; at: number }>;
};
type StoredWorker = {
  uid: string;
  name: string;
  group?: string;
  about: string;
  skills?: string[];
  pay?: string;
  at: number;
  status?: 'active' | 'blocked';
};
type All = Record<string, Record<string, Stored>>;

const DAY = 86400000;
const STALE_MS = DAY;
const ID = /^[a-z0-9]{6,40}$/;
const UK = /^[A-Za-z0-9_-]{1,120}$/;
const ORDERS_MAX = 50;
const MSGS_MAX = 150;
const APPS_MAX = 30;
const APPLY_MAX = 20;
const JOBS_MAX = 5;
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const newId = (now: number) => now.toString(36) + randomUUID().replace(/-/g, '').slice(0, 8);
const orderPath = (uk: string, id: string) => 'serviceOrders/' + uk + '/' + id;
const dataPath = (uk: string, fid: string) => 'serviceFiles/' + uk + '/' + fid;
const kindName = (kind: string) => serviceKind(kind)?.name[0] || kind;
/** Eski yozuvlar (new/quoted — jamoa narx aytadigan davr) ham e'lon bo'lib ko'rinadi. */
const statusOf = (s: Stored): ServiceStatus =>
  s.status === 'new' || s.status === 'quoted' ? 'open' : s.status;

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
  const v = await siteGet<{ how?: string; open?: boolean; fee?: number }>('serviceInfo');
  const fee = Math.round(Number(v?.fee));
  return {
    how: v?.how || '',
    open: v?.open === true,
    fee: Number.isFinite(fee) && fee >= 0 && fee <= 50 ? fee : 0,
  };
}
async function readAll() {
  return ((await siteGet<All>('serviceOrders')) || {}) as All;
}
async function readWorkers() {
  return (await siteGet<Record<string, StoredWorker>>('serviceWorkers')) || {};
}
/** Ijrochining natijalari: bajarilgan ishlar, o'rtacha baho, o'tkazilgan va kutilayotgan pul. */
function workerStats(all: All, fee: number) {
  const out: Record<
    string,
    { jobs: number; sum: number; n: number; earned: number; pending: number }
  > = {};
  for (const list of Object.values(all))
    for (const s of Object.values(list || {})) {
      const wk = s?.worker?.uk;
      if (!wk || statusOf(s) !== 'done') continue;
      const w = (out[wk] ??= { jobs: 0, sum: 0, n: 0, earned: 0, pending: 0 });
      w.jobs++;
      if (s.rating) {
        w.sum += s.rating;
        w.n++;
      }
      if (s.payout) w.earned += s.payout.amount;
      else w.pending += share(s.budget || 0, fee);
    }
  return (wk: string) => {
    const w = out[wk];
    return {
      jobs: w?.jobs || 0,
      rating: w?.n ? Math.round((w.sum / w.n) * 10) / 10 : null,
      earned: w?.earned || 0,
      pending: w?.pending || 0,
    };
  };
}
/** Ijrochiga tegadigan summa (platforma ulushidan keyin). */
const share = (budget: number, fee: number) => Math.round((budget * (100 - fee)) / 100);

function profile(
  wk: string,
  w: StoredWorker,
  stat: ReturnType<typeof workerStats>,
  withPay: boolean,
): WorkerProfile {
  return {
    uk: wk,
    name: w.name,
    ...(w.group ? { group: w.group } : {}),
    about: w.about || '',
    skills: (w.skills || []).filter((k) => serviceKind(k)),
    at: w.at,
    status: w.status === 'blocked' ? 'blocked' : 'active',
    ...stat(wk),
    ...(withPay && w.pay ? { pay: w.pay } : {}),
  };
}

function files(s: Stored): OrderFile[] {
  return Object.entries(s.files || {})
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
}
function msgs(s: Stored): OrderMsg[] {
  return Object.entries(s.msgs || {})
    .filter(([, m]) => m && typeof m.text === 'string')
    .sort(([, a], [, b]) => (a.at || 0) - (b.at || 0))
    .map(([mid, m]) => ({
      id: mid,
      from: m.from === 'team' ? 'team' : m.from === 'worker' ? 'worker' : 'user',
      text: m.text,
      at: m.at,
    }));
}
/** Vazifa (buyurtmachi, ijrochi yoki administrator uchun). */
function toOrder(
  uk: string,
  id: string,
  s: Stored,
  stat: ReturnType<typeof workerStats>,
  forWorker = false,
): ServiceOrder {
  const apps: Applicant[] = forWorker
    ? []
    : Object.entries(s.apps || {})
        .filter(([wk, a]) => UK.test(wk) && a?.at)
        .sort(([, a], [, b]) => a.at - b.at)
        .map(([wk, a]) => ({
          uk: wk,
          name: maskName(a.name),
          ...(a.note ? { note: a.note } : {}),
          at: a.at,
          jobs: stat(wk).jobs,
          rating: stat(wk).rating,
        }));
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
    apps,
    ...(s.worker
      ? {
          worker: {
            uk: s.worker.uk,
            name: forWorker ? s.worker.name : maskName(s.worker.name),
            jobs: stat(s.worker.uk).jobs,
            rating: stat(s.worker.uk).rating,
          },
        }
      : {}),
    ...(s.due ? { due: s.due } : {}),
    ...(s.contact && !forWorker ? { contact: s.contact } : {}),
    ...(s.paidAt ? { paidAt: s.paidAt } : {}),
    ...(s.paidNote && !forWorker ? { paidNote: s.paidNote } : {}),
    ...(s.deliveredAt ? { deliveredAt: s.deliveredAt } : {}),
    ...(s.doneAt ? { doneAt: s.doneAt } : {}),
    ...(s.reason ? { reason: s.reason } : {}),
    ...(s.link ? { link: s.link } : {}),
    ...(s.expired ? { expired: true } : {}),
    ...(s.rating ? { rating: s.rating } : {}),
    ...(s.review ? { review: s.review } : {}),
    ...(s.payout && forWorker
      ? {
          payout: {
            amount: s.payout.amount,
            at: s.payout.at,
            ...(s.payout.note ? { note: s.payout.note } : {}),
          },
        }
      : {}),
    files: files(s),
    msgs: msgs(s),
  };
}

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

function topWorkers(workers: Record<string, StoredWorker>, stat: ReturnType<typeof workerStats>) {
  return Object.entries(workers)
    .filter(([wk, w]) => UK.test(wk) && w?.name && w.status !== 'blocked')
    .map(([wk, w]): TopWorker & { at: number } => ({
      name: maskName(w.name),
      jobs: stat(wk).jobs,
      rating: stat(wk).rating,
      skills: (w.skills || []).filter((k) => serviceKind(k)).slice(0, 4),
      at: w.at,
    }))
    .sort((a, b) => b.jobs - a.jobs || (b.rating || 0) - (a.rating || 0) || a.at - b.at)
    .slice(0, 6)
    .map(({ at: _at, ...t }) => t);
}

/** Foydalanuvchi (yoki mehmon): katalog, ko'rsatkichlar, o'z vazifalari, vazifalar e'loni va ijrochi kabineti. */
export async function servicesView(a: Actor | null, now = Date.now()): Promise<ServicesView> {
  const [{ catalog, people, fans }, info, all, workers] = await Promise.all([
    readCatalog(false),
    readInfo(),
    readAll(),
    readWorkers(),
  ]);
  const patch = sweep(all, now);
  if (Object.keys(patch).length) await siteUpdate(patch);
  const stat = workerStats(all, info.fee);
  const flat = Object.entries(all).flatMap(([uk, list]) =>
    UK.test(uk) && list
      ? Object.entries(list)
          .filter(([id, s]) => ID.test(id) && s?.kind)
          .map(([id, s]) => ({ uk, id, s }))
      : [],
  );
  const head = {
    open: info.open,
    catalog,
    people,
    fans,
    fee: info.fee,
    stats: {
      tasks: flat.filter((x) => statusOf(x.s) === 'open').length,
      workers: Object.values(workers).filter((w) => w?.name && w.status !== 'blocked').length,
      done: flat.filter((x) => statusOf(x.s) === 'done').length,
    },
    top: topWorkers(workers, stat),
  };
  if (!a) return { ...head, signedIn: false };
  const me = keyOf(a.id);
  const mine = workers[me];
  const orders = flat
    .filter((x) => x.uk === me)
    .map((x) => toOrder(x.uk, x.id, x.s, stat))
    .sort((x, y) => y.at - x.at);
  const board: BoardTask[] = flat
    .filter((x) => statusOf(x.s) === 'open')
    .sort((x, y) => y.s.at - x.s.at)
    .slice(0, 200)
    .map(({ uk, id, s }) => {
      const app = s.apps?.[me];
      return {
        id,
        uk,
        kind: s.kind,
        title: s.title,
        text: s.text,
        budget: Number(s.budget) || 0,
        ...(s.due ? { due: s.due } : {}),
        at: s.at,
        apps: Object.keys(s.apps || {}).length,
        ...(app ? { applied: { at: app.at, ...(app.note ? { note: app.note } : {}) } } : {}),
        ...(uk === me ? { own: true } : {}),
        by: maskName(s.name),
        ...(s.group ? { group: s.group } : {}),
      };
    });
  const jobs = flat
    .filter((x) => x.s.worker?.uk === me)
    .map((x) => toOrder(x.uk, x.id, x.s, stat, true))
    .sort((x, y) => y.upd - x.upd);
  return {
    ...head,
    signedIn: true,
    how: info.how,
    orders,
    board,
    me: mine?.name ? profile(me, mine, stat, true) : null,
    jobs,
  };
}

const STATUS_ORDER: Record<ServiceStatus, number> = {
  paid: 0,
  open: 1,
  review: 2,
  assigned: 3,
  work: 4,
  done: 5,
  cancel: 6,
};
/** Administrator: hamma vazifalar (buyurtmachi ma'lumotlari bilan), ijrochilar, sozlamalar. */
export async function servicesAdmin(a: Actor, now = Date.now()): Promise<ServicesAdminView> {
  administrator(a);
  const [all, { catalog, people, fans }, { how, open, fee }, workers] = await Promise.all([
    readAll(),
    readCatalog(true),
    readInfo(),
    readWorkers(),
  ]);
  const patch = sweep(all, now);
  if (Object.keys(patch).length) await siteUpdate(patch);
  const stat = workerStats(all, fee);
  const orders: AdminOrder[] = [];
  let used = 0;
  for (const [uk, list] of Object.entries(all)) {
    if (!UK.test(uk) || !list) continue;
    for (const [id, s] of Object.entries(list)) {
      if (!ID.test(id) || !s?.kind) continue;
      used += Object.values(s.files || {}).reduce((n, f) => n + (f?.size || 0), 0);
      const o = toOrder(uk, id, s, stat);
      orders.push({
        ...o,
        // administrator ijrochining to'liq ismini va to'lov holatini ko'radi
        ...(s.worker ? { worker: { ...o.worker!, name: s.worker.name } } : {}),
        apps: o.apps.map((x) => ({ ...x, name: s.apps?.[x.uk]?.name || x.name })),
        ...(s.payout
          ? {
              payout: {
                amount: s.payout.amount,
                at: s.payout.at,
                ...(s.payout.note ? { note: s.payout.note } : {}),
              },
            }
          : {}),
        ...(s.paidNote ? { paidNote: s.paidNote } : {}),
        name: s.name,
        ...(s.group ? { group: s.group } : {}),
        ...(s.email ? { email: s.email } : {}),
        ...(s.role ? { role: s.role } : {}),
      });
    }
  }
  orders.sort((x, y) => {
    // yakunlangan, lekin ijrochiga hali pul o'tkazilmagan vazifa — yuqorida
    const px = x.status === 'done' && !x.payout ? -1 : STATUS_ORDER[x.status];
    const py = y.status === 'done' && !y.payout ? -1 : STATUS_ORDER[y.status];
    return px - py || y.upd - x.upd;
  });
  const list = Object.entries(workers)
    .filter(([wk, w]) => UK.test(wk) && w?.name)
    .map(([wk, w]) => profile(wk, w, stat, true))
    .sort((x, y) => y.at - x.at);
  return { open, fee, catalog, people, fans, how, orders, workers: list, used };
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
  check(UK.test(uk) && ID.test(id), 400, 'Vazifa topilmadi.');
  const s = await siteGet<Stored>(orderPath(uk, id));
  check(s?.kind, 404, 'Vazifa topilmadi.');
  return s!;
}
const msgId = (now: number) => 'm' + now.toString(36) + Math.random().toString(36).slice(2, 6);
function addMsg(
  patch: Record<string, unknown>,
  uk: string,
  id: string,
  s: Stored,
  from: 'user' | 'worker' | 'team',
  text: string,
  now: number,
) {
  check(Object.keys(s.msgs || {}).length < MSGS_MAX, 429, 'Yozishma juda uzun bo‘lib ketdi.');
  patch[orderPath(uk, id) + '/msgs/' + msgId(now)] = { from, text, at: now };
}
/** Vazifaning hamma fayllarini (bo'laklari bilan) o'chirish. */
function dropFiles(patch: Record<string, unknown>, uk: string, id: string, s: Stored) {
  for (const fid of Object.keys(s.files || {})) patch[dataPath(uk, fid)] = null;
  patch[orderPath(uk, id) + '/files'] = null;
}
/** Bo'lim hali ishga tushmagan bo'lsa vazifani faqat administrator (sinab ko'rish uchun) bera oladi. */
async function isAdminActor(a: Actor) {
  if (a.role === 'admin') return true;
  // tejamkor (readOnly) so'rovda Firestore'dagi administrator roli ko'rinmaydi — bir marta tekshiriladi
  const stored = await repository()
    .then((r) => r.get('users', a.id))
    .catch(() => null);
  return stored?.role === 'admin';
}
async function canOrder(a: Actor) {
  if ((await readInfo()).open || (await isAdminActor(a))) return;
  throw new ApiError(
    409,
    'Pullik xizmatlar hali ishga tushmagan. Taklifingizni yozib qoldiring — ishga tushganda xabar beramiz.',
  );
}
async function activeWorker(a: Actor) {
  const w = await siteGet<StoredWorker>('serviceWorkers/' + keyOf(a.id));
  check(w?.name, 403, 'Avval «Ijrochi bo‘lish» bo‘limida ro‘yxatdan o‘ting.');
  check(w!.status !== 'blocked', 403, 'Ijrochi hisobingiz to‘xtatilgan. Administratorga yozing.');
  return w!;
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
      budget: z.number().int().min(BUDGET_MIN).max(BUDGET_MAX),
      due: day.optional(),
      contact: z.string().trim().max(80).optional(),
    })
    .strict(),
  z.object({ op: z.literal('paid'), id: z.string(), note: z.string().trim().max(200) }).strict(),
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
  z.object({ op: z.literal('begin'), id: z.string(), ...fileBegin }).strict(),
  z.object({ op: z.literal('finish'), id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('unfile'), id: z.string(), fid: z.string() }).strict(),
  // 🧑‍💻 ijrochi
  z
    .object({
      op: z.literal('join'),
      about: text(10, 600),
      skills: z.array(z.string().max(40)).min(1).max(SERVICE_KINDS.length),
      pay: text(4, 120),
      agree: z.literal(true),
    })
    .strict(),
  z.object({ op: z.literal('leave') }).strict(),
  z
    .object({
      op: z.literal('apply'),
      uk: ukField,
      id: z.string(),
      note: z.string().trim().max(500).optional(),
    })
    .strict(),
  z.object({ op: z.literal('unapply'), uk: ukField, id: z.string() }).strict(),
  z.object({ op: z.literal('wmsg'), uk: ukField, id: z.string(), text: text(1, 1000) }).strict(),
  z.object({ op: z.literal('wlink'), uk: ukField, id: z.string(), link: linkField }).strict(),
  z.object({ op: z.literal('deliver'), uk: ukField, id: z.string() }).strict(),
  z.object({ op: z.literal('wbegin'), uk: ukField, id: z.string(), ...fileBegin }).strict(),
  z.object({ op: z.literal('wfinish'), uk: ukField, id: z.string(), fid: z.string() }).strict(),
  z.object({ op: z.literal('wunfile'), uk: ukField, id: z.string(), fid: z.string() }).strict(),
]);

/** Foydalanuvchi amallari: buyurtmachi (vazifa berish, to'lash, qabul qilish …) va ijrochi (ariza, topshirish …). */
export async function manageServices(a: Actor, raw: unknown, now = Date.now()) {
  const v = userInput.parse(raw);
  const me = keyOf(a.id);
  const done = async () => ({ view: await servicesView(a, now) });

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

  if (v.op === 'join') {
    const skills = SERVICE_KINDS.filter((k) => v.skills.includes(k.id)).map((k) => k.id);
    check(skills.length, 400, 'Qaysi ishlarni qila olishingizni belgilang.');
    const old = await siteGet<StoredWorker>('serviceWorkers/' + me);
    check(
      old?.status !== 'blocked',
      403,
      'Ijrochi hisobingiz to‘xtatilgan. Administratorga yozing.',
    );
    const w: StoredWorker = {
      uid: a.id,
      name: (a.name || 'Talaba').slice(0, 120),
      ...(a.classId ? { group: String(a.classId).slice(0, 40) } : {}),
      about: v.about,
      skills,
      pay: v.pay,
      at: old?.at || now,
      status: 'active',
    };
    await siteUpdate({ ['serviceWorkers/' + me]: w });
    if (!old)
      await notifyTeam('🧑‍💻 Yangi ijrochi', w.name + ' — ' + skills.map(kindName).join(', '));
    return done();
  }
  if (v.op === 'leave') {
    const all = await readAll();
    const busy = Object.values(all).some((list) =>
      Object.values(list || {}).some(
        (s) => s?.worker?.uk === me && ['assigned', 'paid', 'work', 'review'].includes(statusOf(s)),
      ),
    );
    check(!busy, 409, 'Sizda tugallanmagan ish bor — avval uni topshiring.');
    const patch: Record<string, unknown> = { ['serviceWorkers/' + me]: null };
    for (const [uk, list] of Object.entries(all))
      for (const [id, s] of Object.entries(list || {}))
        if (s?.apps?.[me] && statusOf(s) === 'open')
          patch[orderPath(uk, id) + '/apps/' + me] = null;
    await siteUpdate(patch);
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
      `Bir vaqtda ${ACTIVE_MAX} tagacha vazifa ochiq turadi. Avvalgisi tugashini kuting.`,
    );
    check(
      list.length < ORDERS_MAX,
      429,
      'Vazifalar ro‘yxati to‘ldi — eski tugaganlarini o‘chirib qo‘ying.',
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
      budget: v.budget,
      ...(v.due ? { due: v.due } : {}),
      ...(v.contact ? { contact: v.contact } : {}),
      status: 'open',
      at: now,
      upd: now,
    };
    await siteUpdate({
      [orderPath(me, id)]: order,
      // kartadagi «N kishi foydalandi» (administratorning sinov vazifasi sanalmaydi)
      ...(a.role !== 'admin' ? { ['serviceStats/' + kind!.id + '/' + me]: now } : {}),
    });
    // shu yo'nalishda ishlaydigan ijrochilarga va administratorga xabar
    const workers = await readWorkers();
    const fit = Object.entries(workers)
      .filter(
        ([wk, w]) => wk !== me && w?.status !== 'blocked' && (w?.skills || []).includes(kind!.id),
      )
      .map(([, w]) => w.uid);
    const line = kindName(kind!.id) + ': ' + v.title + ' · ' + formatSum(v.budget);
    await notify(fit, '📣 Yangi vazifa', line, '/#services/board');
    await notifyTeam('📣 Yangi vazifa', line);
    return { id, ...(await done()) };
  }

  // ---------- ijrochi amallari (boshqa odamning vazifasi ustida) ----------
  if (
    v.op === 'apply' ||
    v.op === 'unapply' ||
    v.op === 'wmsg' ||
    v.op === 'wlink' ||
    v.op === 'deliver' ||
    v.op === 'wbegin' ||
    v.op === 'wfinish' ||
    v.op === 'wunfile'
  ) {
    const s = await load(v.uk, v.id);
    const path = orderPath(v.uk, v.id);
    const st = statusOf(s);
    const patch: Record<string, unknown> = {};
    if (v.op === 'apply') {
      const w = await activeWorker(a);
      check(v.uk !== me && s.uid !== a.id, 409, 'O‘z vazifangizga ariza bera olmaysiz.');
      check(st === 'open', 409, 'Bu vazifaga ijrochi allaqachon tanlangan.');
      check(Object.keys(s.apps || {}).length < APPS_MAX || s.apps?.[me], 429, 'Arizalar to‘ldi.');
      const all = await readAll();
      const mineApps = Object.values(all).reduce(
        (n, list) =>
          n +
          Object.values(list || {}).filter((x) => x?.apps?.[me] && statusOf(x) === 'open').length,
        0,
      );
      check(
        mineApps < APPLY_MAX || s.apps?.[me],
        429,
        `Bir vaqtda ${APPLY_MAX} tagacha ariza bera olasiz.`,
      );
      const busy = Object.values(all).reduce(
        (n, list) =>
          n +
          Object.values(list || {}).filter(
            (x) =>
              x?.worker?.uk === me && ['assigned', 'paid', 'work', 'review'].includes(statusOf(x)),
          ).length,
        0,
      );
      check(
        busy < JOBS_MAX,
        429,
        `Sizda ${JOBS_MAX} ta tugallanmagan ish bor — avval ularni topshiring.`,
      );
      const first = !Object.keys(s.apps || {}).length;
      patch[path + '/apps/' + me] = {
        uid: a.id,
        name: w.name,
        ...(v.note ? { note: v.note } : {}),
        at: s.apps?.[me]?.at || now,
      };
      patch[path + '/upd'] = now;
      await siteUpdate(patch);
      if (first)
        await notify([s.uid], '🙋 Ijrochi topildi', s.title + ' — administrator tasdiqlaydi.');
      await notifyTeam('🙋 Ariza: ' + maskName(w.name), s.title + ' · ' + formatSum(s.budget || 0));
      return done();
    }
    if (v.op === 'unapply') {
      check(s.apps?.[me], 404, 'Ariza topilmadi.');
      check(st === 'open', 409, 'Ijrochi tanlangan — endi arizani qaytarib bo‘lmaydi.');
      await siteUpdate({ [path + '/apps/' + me]: null });
      return done();
    }
    // qolganlari — faqat shu vazifaga tasdiqlangan ijrochi
    check(s.worker?.uk === me, 403, 'Bu vazifa sizga berilmagan.');
    if (v.op === 'wmsg') {
      check(st !== 'cancel', 409, 'Vazifa bekor qilingan.');
      addMsg(patch, v.uk, v.id, s, 'worker', v.text, now);
      patch[path + '/upd'] = now;
      await siteUpdate(patch);
      await notify([s.uid], '💬 Ijrochidan xabar', s.title + ': ' + v.text);
      return done();
    }
    if (v.op === 'wlink') {
      check(
        st === 'work' || st === 'review',
        409,
        'Natijani to‘lov tasdiqlangandan keyin yuklang.',
      );
      await siteUpdate({ [path + '/link']: v.link || null, [path + '/upd']: now });
      return done();
    }
    if (v.op === 'deliver') {
      check(st === 'work', 409, 'Natijani faqat ish jarayonida topshirish mumkin.');
      check(
        Object.values(s.files || {}).some((f) => f?.ready && f.side === 'out') || s.link,
        400,
        'Avval tayyor ish faylini yuklang yoki havola qo‘ying.',
      );
      await siteUpdate({
        [path + '/status']: 'review',
        [path + '/deliveredAt']: now,
        [path + '/upd']: now,
      });
      await notify([s.uid], '👀 Ish tayyor', s.title + ' — tekshirib, qabul qiling.');
      await notifyTeam('📦 Ish topshirildi', s.title);
      return done();
    }
    // fayllar (ijrochi — natija)
    const r = await fileOp(a, 'worker', v.uk, v.id, s, {
      op: v.op === 'wbegin' ? 'begin' : v.op === 'wfinish' ? 'finish' : 'unfile',
      ...(v.op === 'wbegin' ? { name: v.name, size: v.size } : { fid: v.fid }),
    } as FileOp);
    return 'fid' in r ? r : done();
  }

  // ---------- buyurtmachining o'z vazifasi ----------
  const s = await load(me, v.id);
  check(s.uid === a.id, 404, 'Vazifa topilmadi.');
  const st = statusOf(s);
  const path = orderPath(me, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'paid') {
    check(st === 'assigned', 409, 'Bu vazifa to‘lov kutayotgani yo‘q.');
    Object.assign(patch, {
      [path + '/status']: 'paid',
      [path + '/paidAt']: now,
      [path + '/paidNote']: v.note || null,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notifyTeam(
      '💳 To‘lov qilindi',
      s.name + ' — ' + s.title + ' · ' + formatSum(s.budget || 0) + (v.note ? ' · ' + v.note : ''),
    );
  } else if (v.op === 'cancel') {
    check(
      st === 'open' || st === 'assigned',
      409,
      'To‘lovdan keyin vazifani administrator orqali bekor qilish mumkin — yozishmada yozing.',
    );
    dropFiles(patch, me, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: 'Buyurtmachi bekor qildi',
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    if (s.worker) await notify([s.worker.uid], '✖ Vazifa bekor qilindi', s.title);
  } else if (v.op === 'msg') {
    check(st !== 'cancel', 409, 'Vazifa bekor qilingan.');
    addMsg(patch, me, v.id, s, 'user', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    if (s.worker) await notify([s.worker.uid], '💬 Buyurtmachidan xabar', s.title + ': ' + v.text);
    else await notifyTeam('💬 ' + s.name, s.title + ': ' + v.text);
  } else if (v.op === 'revise') {
    check(st === 'review', 409, 'Tuzatishni ish topshirilgandan keyin so‘rash mumkin.');
    addMsg(patch, me, v.id, s, 'user', '🔁 Tuzatish: ' + v.text, now);
    Object.assign(patch, { [path + '/status']: 'work', [path + '/upd']: now });
    await siteUpdate(patch);
    await notify([s.worker?.uid || ''], '🔁 Tuzatish so‘raldi', s.title + ': ' + v.text);
  } else if (v.op === 'accept') {
    check(st === 'review', 409, 'Ish hali topshirilmagan.');
    Object.assign(patch, {
      [path + '/status']: 'done',
      [path + '/doneAt']: now,
      [path + '/rating']: v.rating,
      [path + '/review']: v.review || null,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify(
      [s.worker?.uid || ''],
      '⭐ Ishingiz qabul qilindi',
      s.title + ' — ' + v.rating + '/5',
    );
    await notifyTeam(
      '✅ Qabul qilindi — ijrochiga to‘lang',
      s.title + ' · ' + (s.worker?.name || '') + ' · ' + formatSum(s.budget || 0),
    );
  } else if (v.op === 'remove') {
    check(!isActive(st), 409, 'Ochiq vazifani o‘chirib bo‘lmaydi — avval bekor qiling.');
    check(
      st !== 'done' || !s.worker || s.payout,
      409,
      'Ijrochiga pul o‘tkazilgandan keyin o‘chirish mumkin.',
    );
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
  z.object({ op: z.literal('assign'), uk: ukField, id: z.string(), worker: ukField }).strict(),
  z.object({ op: z.literal('unassign'), uk: ukField, id: z.string() }).strict(),
  z.object({ op: z.literal('confirm'), uk: ukField, id: z.string() }).strict(),
  z
    .object({
      op: z.literal('status'),
      uk: ukField,
      id: z.string(),
      status: z.enum(['work', 'review', 'done']),
    })
    .strict(),
  z
    .object({
      op: z.literal('payout'),
      uk: ukField,
      id: z.string(),
      amount: z.number().int().min(0).max(BUDGET_MAX),
      note: z.string().trim().max(200).optional(),
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
    .object({ op: z.literal('worker'), wk: ukField, status: z.enum(['active', 'blocked']) })
    .strict(),
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
  z.object({ op: z.literal('fee'), fee: z.number().int().min(0).max(50) }).strict(),
  z.object({ op: z.literal('launch'), open: z.boolean() }).strict(),
]);

/** Administrator amallari: ijrochini tasdiqlash, to'lovni tasdiqlash, ijrochiga pul o'tkazish, nazorat, sozlamalar. */
export async function adminServices(a: Actor, raw: unknown, now = Date.now()) {
  administrator(a);
  const v = adminInput.parse(raw);
  const done = async () => ({ admin: await servicesAdmin(a, now) });
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
    return done();
  }
  if (v.op === 'launch') {
    await siteUpdate({ 'serviceInfo/open': v.open || null });
    return done();
  }
  if (v.op === 'info') {
    await siteUpdate({ 'serviceInfo/how': v.how || null });
    return done();
  }
  if (v.op === 'fee') {
    await siteUpdate({ 'serviceInfo/fee': v.fee || null });
    return done();
  }
  if (v.op === 'worker') {
    const w = await siteGet<StoredWorker>('serviceWorkers/' + v.wk);
    check(w?.name, 404, 'Ijrochi topilmadi.');
    await siteUpdate({ ['serviceWorkers/' + v.wk + '/status']: v.status });
    await notify(
      [w!.uid],
      v.status === 'blocked' ? '⛔ Ijrochi hisobi to‘xtatildi' : '✅ Ijrochi hisobi tiklandi',
      v.status === 'blocked'
        ? 'Savollar bo‘lsa, administratorga yozing.'
        : 'Yana ariza bera olasiz.',
    );
    return done();
  }
  const s = await load(v.uk, v.id);
  const st = statusOf(s);
  const path = orderPath(v.uk, v.id);
  const patch: Record<string, unknown> = {};
  if (v.op === 'assign') {
    check(st === 'open', 409, 'Ijrochini faqat e’londagi vazifaga tanlash mumkin.');
    const app = s.apps?.[v.worker];
    check(app, 404, 'Bu ijrochi ariza bermagan.');
    const w = await siteGet<StoredWorker>('serviceWorkers/' + v.worker);
    check(w?.name && w.status !== 'blocked', 409, 'Ijrochi hisobi faol emas.');
    Object.assign(patch, {
      [path + '/status']: 'assigned',
      [path + '/worker']: { uk: v.worker, uid: w!.uid, name: w!.name, at: now },
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify(
      [s.uid],
      '💳 Ijrochi tanlandi',
      s.title + ' — ' + formatSum(s.budget || 0) + ' to‘lang, keyin ish boshlanadi.',
    );
    await notify(
      [w!.uid],
      '🎉 Sizni tanlashdi!',
      s.title + ' — to‘lov tasdiqlangach ishni boshlaysiz.',
      '/#services/work',
    );
    const others = Object.entries(s.apps || {})
      .filter(([wk]) => wk !== v.worker)
      .map(([, x]) => x.uid);
    await notify(others, 'Vazifaga boshqa ijrochi tanlandi', s.title, '/#services/board');
  } else if (v.op === 'unassign') {
    check(st === 'assigned' || st === 'paid', 409, 'Ish boshlangan — avval bekor qiling.');
    Object.assign(patch, {
      [path + '/status']: 'open',
      [path + '/worker']: null,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify([s.worker?.uid || ''], 'Vazifa sizdan olindi', s.title);
  } else if (v.op === 'confirm') {
    check(st === 'assigned' || st === 'paid', 409, 'Bu vazifa to‘lov kutayotgani yo‘q.');
    check(s.worker, 409, 'Avval ijrochini tasdiqlang.');
    Object.assign(patch, {
      [path + '/status']: 'work',
      [path + '/paidAt']: s.paidAt || now,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify([s.uid], '🛠 To‘lov tasdiqlandi', s.title + ' — ijrochi ishni boshladi.');
    await notify(
      [s.worker!.uid],
      '🛠 Ishni boshlang!',
      s.title + ' · muddat: ' + (s.due || 'kelishiladi'),
      '/#services/work',
    );
  } else if (v.op === 'status') {
    check(['work', 'review', 'done'].includes(st), 409, 'Avval ijrochini va to‘lovni tasdiqlang.');
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
      await notify([s.uid], '👀 Ish tayyor', s.title + ' — tekshirib, qabul qiling.');
    if (v.status === 'done') await notify([s.uid], '✅ Vazifa yakunlandi', s.title);
  } else if (v.op === 'payout') {
    check(st === 'done', 409, 'Pulni vazifa yakunlangandan keyin o‘tkazing.');
    check(s.worker, 409, 'Bu vazifada ijrochi yo‘q.');
    Object.assign(patch, {
      [path + '/payout']: {
        amount: v.amount,
        at: now,
        ...(v.note ? { note: v.note } : {}),
        by: (a.name || a.id).slice(0, 80),
      },
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify(
      [s.worker!.uid],
      '💸 Pul o‘tkazildi',
      formatSum(v.amount) + ' — «' + s.title + '» uchun. Rahmat!',
      '/#services/work',
    );
  } else if (v.op === 'link') {
    Object.assign(patch, { [path + '/link']: v.link || null, [path + '/upd']: now });
    await siteUpdate(patch);
  } else if (v.op === 'cancel') {
    check(st !== 'cancel', 409, 'Vazifa allaqachon bekor qilingan.');
    dropFiles(patch, v.uk, v.id, s);
    Object.assign(patch, {
      [path + '/status']: 'cancel',
      [path + '/reason']: v.reason,
      [path + '/upd']: now,
    });
    await siteUpdate(patch);
    await notify([s.uid, s.worker?.uid || ''], '✖ Vazifa bekor qilindi', s.title + ': ' + v.reason);
  } else if (v.op === 'msg') {
    addMsg(patch, v.uk, v.id, s, 'team', v.text, now);
    patch[path + '/upd'] = now;
    await siteUpdate(patch);
    await notify(
      [s.uid, s.worker?.uid || ''],
      '💬 Administratordan xabar',
      s.title + ': ' + v.text,
    );
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
  return b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

type FileOp =
  | { op: 'begin'; name: string; size: number }
  | { op: 'finish'; fid: string }
  | { op: 'unfile'; fid: string };
type Who = 'me' | 'worker' | 'admin';
/** Fayl amallari: begin (joy ochish) → bo'laklar (saveServiceChunk) → finish; unfile — o'chirish.
    Buyurtmachi «in» (talablar, namuna), ijrochi va administrator «out» (tayyor ish) fayl yuklaydi. */
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
  const side = who === 'me' ? 'in' : 'out';
  const st = statusOf(s);
  if (v.op === 'begin') {
    check(
      who === 'admin'
        ? st !== 'cancel'
        : who === 'worker'
          ? st === 'work' || st === 'review'
          : isActive(st) && st !== 'review',
      409,
      'Bu vazifaga hozir fayl qo‘shib bo‘lmaydi.',
    );
    const ext = fileExt(v.name);
    check(
      ext,
      400,
      'Bu turdagi fayl qabul qilinmaydi: PDF, Word, PowerPoint, Excel, ZIP yoki rasm.',
    );
    check(v.size <= FILE_MAX[side], 413, `Fayl ${FILE_MAX[side] / 1024 / 1024} MB dan oshmasin.`);
    const list = Object.values(s.files || {}).filter((f) => f?.side === side && f.ready);
    check(
      list.length < FILES_PER_ORDER[side],
      409,
      `Bitta vazifaga ${FILES_PER_ORDER[side]} tagacha fayl qo‘shiladi.`,
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
      who === 'admin' || (f!.side === side && isActive(st)),
      403,
      'Bu faylni o‘chirib bo‘lmaydi.',
    );
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
  return { ok: true };
}

/** Bitta bo'lakni saqlash (n — tartib raqami, 0 dan). o — «<buyurtmachi>/<vazifa>». */
export async function saveServiceChunk(
  a: Actor,
  who: Who | boolean,
  o: string,
  fid: string,
  n: number,
  bytes: Buffer,
) {
  const role: Who = who === true ? 'admin' : who === false ? 'me' : who;
  if (role === 'admin') administrator(a);
  const [uk, id] = o.split('/');
  const s = await load(uk || '', id || '');
  if (role === 'me') check(uk === keyOf(a.id), 403, 'Bu vazifaga fayl yuklab bo‘lmaydi.');
  if (role === 'worker')
    check(s.worker?.uk === keyOf(a.id), 403, 'Bu vazifaga fayl yuklab bo‘lmaydi.');
  check(ID.test(fid), 400, 'Fayl topilmadi.');
  const f = s.files?.[fid];
  check(f && f.side === (role === 'me' ? 'in' : 'out'), 404, 'Fayl topilmadi.');
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

/** Faylning bir bo'lagi (yuklab olish uchun): buyurtmachi, tasdiqlangan ijrochi yoki administrator. */
export async function serviceChunk(a: Actor, o: string, fid: string, n: number) {
  const [uk, id] = o.split('/');
  const me = keyOf(a.id);
  const s = await load(uk || '', id || '').catch(() => null);
  const allowed = !!s && (uk === me || s.worker?.uk === me || (await isAdminActor(a)));
  if (!allowed) throw new ApiError(404, 'Fayl topilmadi.');
  check(ID.test(fid) && Number.isInteger(n) && n >= 0 && n < 64, 404, 'Fayl topilmadi.');
  const f = s!.files?.[fid];
  check(f?.ready && n < f.chunks, 404, 'Fayl topilmadi.');
  const data = await siteGet<string>(dataPath(uk!, fid) + '/' + n);
  check(typeof data === 'string', 404, 'Fayl topilmadi.');
  return { bytes: Buffer.from(data!, 'base64'), mime: FILE_TYPES[f!.ext].mime };
}

/** Hisob o'chirilganda: ijrochi profili, arizalari o'chiriladi; tasdiqlangan vazifalarda ismi yashiriladi. */
export async function forgetServiceUser(key: string) {
  const patch: Record<string, unknown> = { ['serviceWorkers/' + key]: null };
  const all = await readAll();
  for (const [uk, list] of Object.entries(all))
    for (const [id, s] of Object.entries(list || {})) {
      if (s?.apps?.[key]) patch[orderPath(uk, id) + '/apps/' + key] = null;
      if (s?.worker?.uk === key)
        patch[orderPath(uk, id) + '/worker/name'] = 'O‘chirilgan foydalanuvchi';
    }
  return patch;
}
