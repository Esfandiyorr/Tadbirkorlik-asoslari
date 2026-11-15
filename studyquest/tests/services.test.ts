import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { KEEP_DAYS, SERVICE_KINDS } from '../lib/services';
import {
  adminServices,
  keyOf,
  manageServices,
  saveServiceChunk,
  serviceChunk,
  servicesAdmin,
  servicesView,
} from '../lib/server/services';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';

/* 💼 Pullik xizmatlar: buyurtma → narx → to'lov → ish → natija, fayllar va kim nimani ko'ra oladi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(async () => {
  resetSiteMemory();
  // bo'lim ishga tushirilgan holat (ishga tushmagan holat — alohida sinovda)
  await adminServices(admin, { op: 'launch', open: true });
});
const who = (id: string, role = 'student') =>
  ({
    id,
    uid: id,
    role,
    name: role === 'admin' ? 'Admin' : 'Ali Valiyev',
    classId: 'AP-223',
    learnerType: 'university',
  }) as unknown as Actor;
const admin = who('owner', 'admin');
const ali = who('legacy_ali');
const vali = who('legacy_vali');
const PDF = Buffer.from('%PDF-1.4\n% sinov fayli\n');
const DAY = 86400000;

async function order(a: Actor, now: number, kind = 'taqdimot') {
  const r = await manageServices(
    a,
    {
      op: 'order',
      kind,
      title: 'Marketing asoslari',
      text: '12 slayd, o‘zbek tilida, oxirida savollar bo‘lsin',
      due: '2026-12-01',
      contact: '@ali',
    },
    now,
  );
  return (r as { id: string }).id;
}
/** Kichik faylni yuklash: begin → bitta bo'lak → finish. */
async function upload(a: Actor, team: boolean, uk: string, id: string, bytes: Buffer, now: number) {
  const begin = team
    ? await adminServices(a, { op: 'begin', uk, id, name: 'natija.pdf', size: bytes.length }, now)
    : await manageServices(a, { op: 'begin', id, name: 'talab.pdf', size: bytes.length }, now);
  const { fid, chunks } = begin as { fid: string; chunks: number };
  expect(chunks).toBe(1);
  await saveServiceChunk(a, team, uk + '/' + id, fid, 0, bytes);
  if (team) await adminServices(a, { op: 'finish', uk, id, fid }, now);
  else await manageServices(a, { op: 'finish', id, fid }, now);
  return fid;
}

it('a guest sees the catalog; the administrator sets prices and closes a direction', async () => {
  const guest = await servicesView(null);
  expect(guest.signedIn).toBe(false);
  expect(guest.orders).toBeUndefined();
  expect(guest.catalog.map((k) => k.id)).toEqual(SERVICE_KINDS.map((k) => k.id));
  expect(guest.catalog.filter((k) => k.help).map((k) => k.id)).toEqual([
    'kurs-ishi',
    'bmi',
    'referat',
    'maqola',
  ]);
  await adminServices(admin, {
    op: 'catalog',
    kind: 'taqdimot',
    price: '50 000 so‘mdan',
    days: '2–3 kun',
    off: false,
  });
  await adminServices(admin, { op: 'catalog', kind: 'video', price: '', days: '', off: true });
  await adminServices(admin, { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' });
  const view = await servicesView(ali);
  expect(view.catalog.find((k) => k.id === 'taqdimot')).toMatchObject({
    price: '50 000 so‘mdan',
    days: '2–3 kun',
  });
  expect(view.catalog.some((k) => k.id === 'video')).toBe(false);
  expect(view.how).toContain('Click');
  await expect(order(ali, Date.now(), 'video')).rejects.toThrow('yopiq');
  // administrator yopiq yo'nalishni ham ko'radi
  expect((await servicesAdmin(admin)).catalog.find((k) => k.id === 'video')?.off).toBe(true);
  // talaba katalogni o'zgartira olmaydi
  await expect(adminServices(ali, { op: 'info', how: 'boshqa karta' })).rejects.toThrow(
    'Administrator',
  );
});

it('the whole path: order → price → «I paid» → confirmed → result file → download → revision', async () => {
  const now = Date.UTC(2026, 10, 15, 9, 0);
  const id = await order(ali, now);
  const uk = keyOf(ali.id);
  let mine = (await servicesView(ali, now)).orders!;
  expect(mine).toHaveLength(1);
  expect(mine[0]).toMatchObject({ id, status: 'new', kind: 'taqdimot', due: '2026-12-01' });
  // talaba talablar faylini biriktiradi
  const need = await upload(ali, false, uk, id, PDF, now);
  // administrator buyurtmani buyurtmachi ma'lumotlari bilan ko'radi
  let board = await servicesAdmin(admin, now);
  expect(board.orders[0]).toMatchObject({ id, uk, name: 'Ali Valiyev', group: 'AP-223' });
  expect(board.orders[0].files.map((f) => [f.id, f.side])).toEqual([[need, 'in']]);
  expect((await serviceChunk(admin, uk + '/' + id, need, 0)).bytes.equals(PDF)).toBe(true);
  // to'lovdan oldin «To'lov qildim» bosib bo'lmaydi
  await expect(manageServices(ali, { op: 'paid', id, note: '' }, now)).rejects.toThrow(
    'to‘lov kutayotgani yo‘q',
  );
  await adminServices(
    admin,
    { op: 'quote', uk, id, price: '60 000 so‘m', eta: '2 kun', note: 'Dizayn — ko‘k rangda' },
    now + 1000,
  );
  mine = (await servicesView(ali, now)).orders!;
  expect(mine[0]).toMatchObject({ status: 'quoted', price: '60 000 so‘m', eta: '2 kun' });
  expect(mine[0].msgs.map((m) => [m.from, m.text])).toEqual([['team', 'Dizayn — ko‘k rangda']]);
  await manageServices(ali, { op: 'paid', id, note: 'chek 12345' }, now + 2000);
  // to'langandan keyin talaba o'zi bekor qila olmaydi
  await expect(manageServices(ali, { op: 'cancel', id }, now)).rejects.toThrow('administrator');
  board = await servicesAdmin(admin, now);
  expect(board.orders[0]).toMatchObject({ status: 'paid', paidNote: 'chek 12345' });
  await adminServices(admin, { op: 'confirm', uk, id }, now + 3000);
  // natijasiz «Tayyor» qilib bo'lmaydi
  await expect(adminServices(admin, { op: 'status', uk, id, status: 'done' }, now)).rejects.toThrow(
    'tayyor ish',
  );
  const result = Buffer.concat([PDF, Buffer.from('natija')]);
  const out = await upload(admin, true, uk, id, result, now + 4000);
  await adminServices(admin, { op: 'status', uk, id, status: 'done' }, now + 5000);
  mine = (await servicesView(ali, now + 5000)).orders!;
  expect(mine[0]).toMatchObject({ status: 'done', doneAt: now + 5000 });
  expect(mine[0].files.map((f) => f.side)).toEqual(['in', 'out']);
  // talaba natijani yuklab oladi; boshqa talaba — yo'q
  expect((await serviceChunk(ali, uk + '/' + id, out, 0)).bytes.equals(result)).toBe(true);
  await expect(serviceChunk(vali, uk + '/' + id, out, 0)).rejects.toThrow('topilmadi');
  expect((await servicesView(vali, now)).orders).toEqual([]);
  // talaba natija yuklay olmaydi, faqat jamoa
  await expect(
    adminServices(ali, { op: 'begin', uk, id, name: 'x.pdf', size: 10 }, now),
  ).rejects.toThrow('Administrator');
  // tuzatish so'rash — buyurtma yana ishga qaytadi
  await manageServices(ali, { op: 'revise', id, text: '3-slaydni o‘zgartiring' }, now + 6000);
  mine = (await servicesView(ali, now + 6000)).orders!;
  expect(mine[0].status).toBe('work');
  expect(mine[0].msgs.at(-1)?.text).toBe('🔁 Tuzatish: 3-slaydni o‘zgartiring');
});

it('cancelling removes the files; open orders are limited; finished ones can be removed', async () => {
  const now = Date.UTC(2026, 10, 15, 9, 0);
  const uk = keyOf(ali.id);
  const id = await order(ali, now);
  const fid = await upload(ali, false, uk, id, PDF, now);
  expect(await siteGet('serviceFiles/' + uk + '/' + fid + '/0')).toBeTruthy();
  await manageServices(ali, { op: 'cancel', id }, now);
  expect(await siteGet('serviceFiles/' + uk + '/' + fid)).toBeNull();
  const mine = (await servicesView(ali, now)).orders!;
  expect(mine[0]).toMatchObject({ status: 'cancel', files: [] });
  await manageServices(ali, { op: 'remove', id }, now);
  expect((await servicesView(ali, now)).orders).toEqual([]);
  // bir vaqtda 5 tagacha ochiq buyurtma
  for (let i = 0; i < 5; i++) await order(ali, now + i);
  await expect(order(ali, now + 10)).rejects.toThrow('5 tagacha');
  // ochiq buyurtmani o'chirib bo'lmaydi
  const open = (await servicesView(ali, now)).orders![0].id;
  await expect(manageServices(ali, { op: 'remove', id: open }, now)).rejects.toThrow(
    'bekor qiling',
  );
  // soxta fayl (nomi .pdf, ichi boshqa) qabul qilinmaydi
  const begin = (await manageServices(
    ali,
    { op: 'begin', id: open, name: 'soxta.pdf', size: 5 },
    now,
  )) as { fid: string };
  await expect(
    saveServiceChunk(ali, false, uk + '/' + open, begin.fid, 0, Buffer.from('hello')),
  ).rejects.toThrow('buzilgan');
  // boshqa talaba birovning buyurtmasiga fayl yuklay olmaydi
  await expect(saveServiceChunk(vali, false, uk + '/' + open, begin.fid, 0, PDF)).rejects.toThrow(
    'yuklab bo‘lmaydi',
  );
});

it(`result files are deleted ${KEEP_DAYS} days after delivery`, async () => {
  const now = Date.UTC(2026, 10, 15, 9, 0);
  const uk = keyOf(ali.id);
  const id = await order(ali, now);
  await adminServices(admin, { op: 'quote', uk, id, price: '10 000' }, now);
  await adminServices(admin, { op: 'confirm', uk, id }, now);
  const out = await upload(admin, true, uk, id, PDF, now);
  await adminServices(admin, { op: 'status', uk, id, status: 'done' }, now);
  expect((await servicesView(ali, now + (KEEP_DAYS - 1) * DAY)).orders![0].files).toHaveLength(1);
  const later = await servicesView(ali, now + (KEEP_DAYS + 1) * DAY);
  expect(later.orders![0]).toMatchObject({ status: 'done', expired: true, files: [] });
  expect(await siteGet('serviceFiles/' + uk + '/' + out)).toBeNull();
  await expect(
    manageServices(ali, { op: 'revise', id, text: 'yana bir bor' }, now + (KEEP_DAYS + 2) * DAY),
  ).rejects.toThrow('muddati tugagan');
});

it('until the administrator launches the section only the administrator can order', async () => {
  await adminServices(admin, { op: 'launch', open: false });
  expect((await servicesView(null)).open).toBe(false);
  expect((await servicesView(ali)).open).toBe(false);
  await expect(order(ali, Date.now())).rejects.toThrow('hali ishga tushmagan');
  // administrator sinab ko'rishi mumkin
  await order(admin, Date.now());
  // to'lov yo'riqnomasini saqlash holatni o'zgartirmaydi
  await adminServices(admin, { op: 'info', how: 'Karta: 8600 …' });
  expect(await servicesAdmin(admin)).toMatchObject({ open: false, how: 'Karta: 8600 …' });
  // talaba ishga tushira olmaydi
  await expect(adminServices(ali, { op: 'launch', open: true })).rejects.toThrow('Administrator');
  await adminServices(admin, { op: 'launch', open: true });
  expect((await servicesView(ali)).open).toBe(true);
  await order(ali, Date.now());
  expect((await servicesAdmin(admin)).how).toBe('Karta: 8600 …');
});
