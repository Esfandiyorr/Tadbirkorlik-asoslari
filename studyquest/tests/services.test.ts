import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { KEEP_DAYS, SERVICE_KINDS } from '../lib/services';
import {
  adminServices,
  forgetServiceUser,
  keyOf,
  manageServices,
  saveServiceChunk,
  serviceChunk,
  servicesAdmin,
  servicesView,
} from '../lib/server/services';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';
import { supportList } from '../lib/server/support';

/* 💼 Talabalar ish bozori: vazifa va summa → ijrochilar «Men qilaman» → administrator tasdiqlaydi → to'lov →
   ish → topshirish → qabul va baho → administrator ijrochiga pul o'tkazadi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(async () => {
  resetSiteMemory();
  // bo'lim ishga tushirilgan holat (ishga tushmagan holat — alohida sinovda)
  await adminServices(admin, { op: 'launch', open: true });
});
const who = (id: string, role = 'student', name = 'Ali Valiyev') =>
  ({
    id,
    uid: id,
    role,
    name: role === 'admin' ? 'Admin' : name,
    classId: 'AP-223',
    learnerType: 'university',
  }) as unknown as Actor;
const admin = who('owner', 'admin');
const ali = who('legacy_ali');
const vali = who('legacy_vali', 'student', 'Vali Karimov');
const gani = who('legacy_gani', 'student', 'G‘ani Soliyev');
const PDF = Buffer.from('%PDF-1.4\n% sinov fayli\n');
const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 15, 9, 0);

async function order(a: Actor, now = NOW, kind = 'taqdimot', budget = 150000) {
  const r = await manageServices(
    a,
    {
      op: 'order',
      kind,
      title: 'Marketing asoslari',
      text: '12 slayd, o‘zbek tilida, oxirida savollar bo‘lsin',
      budget,
      due: '2026-12-01',
      contact: '@ali',
    },
    now,
  );
  return (r as { id: string }).id;
}
const join = (a: Actor, skills = ['taqdimot', 'dizayn']) =>
  manageServices(a, {
    op: 'join',
    about: 'PowerPoint va dizaynda 2 yillik tajriba',
    skills,
    pay: '8600 1234 5678 9012',
    agree: true,
  });
/** Kichik faylni yuklash: begin → bitta bo'lak → finish. */
async function upload(
  a: Actor,
  as: 'me' | 'worker' | 'admin',
  uk: string,
  id: string,
  bytes = PDF,
) {
  const begin =
    as === 'admin'
      ? await adminServices(a, { op: 'begin', uk, id, name: 'natija.pdf', size: bytes.length })
      : as === 'worker'
        ? await manageServices(a, { op: 'wbegin', uk, id, name: 'natija.pdf', size: bytes.length })
        : await manageServices(a, { op: 'begin', id, name: 'talab.pdf', size: bytes.length });
  const { fid } = begin as { fid: string };
  await saveServiceChunk(a, as, uk + '/' + id, fid, 0, bytes);
  if (as === 'admin') await adminServices(a, { op: 'finish', uk, id, fid });
  else if (as === 'worker') await manageServices(a, { op: 'wfinish', uk, id, fid });
  else await manageServices(a, { op: 'finish', id, fid });
  return fid;
}

it('a guest sees the catalog and figures; the administrator sets hints, the fee and closes a direction', async () => {
  const guest = await servicesView(null);
  expect(guest).toMatchObject({
    signedIn: false,
    fee: 0,
    stats: { tasks: 0, workers: 0, done: 0 },
  });
  expect(guest.board).toBeUndefined();
  expect(guest.catalog.map((k) => k.id)).toEqual(SERVICE_KINDS.map((k) => k.id));
  await adminServices(admin, {
    op: 'catalog',
    kind: 'taqdimot',
    price: '50 000 so‘mdan',
    days: '2–3 kun',
    off: false,
  });
  await adminServices(admin, { op: 'catalog', kind: 'video', price: '', days: '', off: true });
  await adminServices(admin, { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' });
  await adminServices(admin, { op: 'fee', fee: 10 });
  const view = await servicesView(ali);
  expect(view.catalog.find((k) => k.id === 'taqdimot')).toMatchObject({ price: '50 000 so‘mdan' });
  expect(view.catalog.some((k) => k.id === 'video')).toBe(false);
  expect(view).toMatchObject({ how: expect.stringContaining('Click'), fee: 10, me: null });
  await expect(order(ali, NOW, 'video')).rejects.toThrow('yopiq');
  // summa chegaradan kichik bo'lmasin
  await expect(order(ali, NOW, 'taqdimot', 1000)).rejects.toThrow();
  await expect(adminServices(ali, { op: 'fee', fee: 0 })).rejects.toThrow('Administrator');
});

it('the whole path: task → «I will do it» → approved → paid → work → delivered → accepted → paid out', async () => {
  await adminServices(admin, { op: 'fee', fee: 10 });
  const id = await order(ali);
  const uk = keyOf(ali.id);
  const need = await upload(ali, 'me', uk, id);
  // vali — hali ijrochi emas: e'lonni ko'radi, lekin ariza bera olmaydi
  let v = await servicesView(vali, NOW);
  expect(v.board).toHaveLength(1);
  expect(v.board![0]).toMatchObject({ id, uk, budget: 150000, apps: 0, by: 'Ali V.' });
  expect(JSON.stringify(v.board)).not.toContain('@ali'); // aloqa ma'lumoti e'londa yo'q
  await expect(manageServices(vali, { op: 'apply', uk, id })).rejects.toThrow('Ijrochi bo‘lish');
  await join(vali);
  await join(gani, ['sayt']);
  // o'z vazifasiga ariza berib bo'lmaydi
  await join(ali);
  await expect(manageServices(ali, { op: 'apply', uk, id })).rejects.toThrow('O‘z vazifangizga');
  await manageServices(vali, { op: 'apply', uk, id, note: '2 kunda tayyorlayman' }, NOW + 1000);
  await manageServices(gani, { op: 'apply', uk, id }, NOW + 2000);
  v = await servicesView(vali, NOW);
  expect(v.board![0]).toMatchObject({ apps: 2, applied: { note: '2 kunda tayyorlayman' } });
  expect(v.me).toMatchObject({ name: 'Vali Karimov', jobs: 0, pay: '8600 1234 5678 9012' });
  // buyurtmachi arizalarni ko'radi (to'liq ism va to'lov ma'lumotisiz)
  let mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0].apps.map((x) => [x.name, x.note])).toEqual([
    ['Vali K.', '2 kunda tayyorlayman'],
    ['G‘ani S.', undefined],
  ]);
  expect(JSON.stringify(mine)).not.toContain('8600 1234');
  // ijrochi tasdiqlanmaguncha buyurtmachining fayli unga yopiq
  await expect(serviceChunk(vali, uk + '/' + id, need, 0)).rejects.toThrow('topilmadi');
  // administrator ijrochini tasdiqlaydi — buyurtmachi to'laydi
  const board = await servicesAdmin(admin, NOW);
  expect(board.orders[0].apps.map((x) => x.name)).toEqual(['Vali Karimov', 'G‘ani Soliyev']);
  expect(board.workers.map((w) => [w.name, w.pay])).toContainEqual([
    'Vali Karimov',
    '8600 1234 5678 9012',
  ]);
  await expect(
    adminServices(admin, { op: 'assign', uk, id, worker: keyOf('legacy_nobody') }),
  ).rejects.toThrow('ariza bermagan');
  await adminServices(admin, { op: 'assign', uk, id, worker: keyOf(vali.id) }, NOW + 3000);
  expect((await servicesView(gani, NOW)).board).toEqual([]); // e'londan chiqdi
  mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0]).toMatchObject({ status: 'assigned', worker: { name: 'Vali K.' } });
  await manageServices(ali, { op: 'paid', id, note: 'chek 12345' }, NOW + 4000);
  await expect(manageServices(ali, { op: 'cancel', id })).rejects.toThrow('administrator');
  // to'lov tasdiqlanmaguncha ijrochi natija yuklay olmaydi
  await expect(
    manageServices(vali, { op: 'wbegin', uk, id, name: 'x.pdf', size: 10 }),
  ).rejects.toThrow('fayl qo‘shib bo‘lmaydi');
  await adminServices(admin, { op: 'confirm', uk, id }, NOW + 5000);
  // endi ijrochi talablar faylini ko'radi, yozishmada qatnashadi, natijani topshiradi
  expect((await serviceChunk(vali, uk + '/' + id, need, 0)).bytes.equals(PDF)).toBe(true);
  await expect(serviceChunk(gani, uk + '/' + id, need, 0)).rejects.toThrow('topilmadi');
  await manageServices(vali, { op: 'wmsg', uk, id, text: 'Ranglar qanday bo‘lsin?' }, NOW + 6000);
  await expect(manageServices(gani, { op: 'wmsg', uk, id, text: 'salom' })).rejects.toThrow(
    'berilmagan',
  );
  await expect(manageServices(vali, { op: 'deliver', uk, id })).rejects.toThrow('tayyor ish');
  const result = Buffer.concat([PDF, Buffer.from('natija')]);
  const out = await upload(vali, 'worker', uk, id, result);
  await manageServices(vali, { op: 'deliver', uk, id }, NOW + 7000);
  mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0]).toMatchObject({ status: 'review' });
  expect(mine[0].msgs.map((m) => m.from)).toEqual(['worker']);
  expect((await serviceChunk(ali, uk + '/' + id, out, 0)).bytes.equals(result)).toBe(true);
  // tuzatish → qayta topshirish → qabul va baho
  await manageServices(ali, { op: 'revise', id, text: '3-slaydni o‘zgartiring' }, NOW + 8000);
  expect((await servicesView(vali, NOW)).jobs![0].status).toBe('work');
  await manageServices(vali, { op: 'deliver', uk, id }, NOW + 9000);
  await manageServices(ali, { op: 'accept', id, rating: 5, review: 'Zo‘r!' }, NOW + 10000);
  v = await servicesView(vali, NOW);
  expect(v.me).toMatchObject({ jobs: 1, rating: 5, earned: 0, pending: 135000 });
  expect(v.jobs![0]).toMatchObject({ status: 'done', rating: 5 });
  expect(v.jobs![0].contact).toBeUndefined(); // ijrochi buyurtmachining aloqasini ko'rmaydi
  // administrator ijrochiga pulini o'tkazadi
  await expect(manageServices(ali, { op: 'remove', id })).rejects.toThrow('pul o‘tkazilgandan');
  await adminServices(admin, { op: 'payout', uk, id, amount: 135000, note: 'Click' }, NOW + 11000);
  v = await servicesView(vali, NOW);
  expect(v.me).toMatchObject({ earned: 135000, pending: 0 });
  expect(v.jobs![0].payout).toMatchObject({ amount: 135000 });
  const guest = await servicesView(null, NOW);
  expect(guest.top[0]).toMatchObject({ name: 'Vali K.', jobs: 1, rating: 5 });
  expect(guest.stats).toMatchObject({ tasks: 0, workers: 3, done: 1 });
});

it('workers: blocked ones cannot apply, leaving removes open applications, the administrator can take a task back', async () => {
  const uk = keyOf(ali.id);
  const id = await order(ali);
  await join(vali);
  await expect(
    manageServices(vali, { op: 'join', about: 'qisqa', skills: [], pay: '1', agree: true }),
  ).rejects.toThrow();
  await manageServices(vali, { op: 'apply', uk, id });
  await manageServices(vali, { op: 'leave' });
  expect((await servicesView(ali, NOW)).orders![0].apps).toEqual([]);
  expect((await servicesView(vali, NOW)).me).toBeNull();
  await join(vali);
  await adminServices(admin, { op: 'worker', wk: keyOf(vali.id), status: 'blocked' });
  await expect(manageServices(vali, { op: 'apply', uk, id })).rejects.toThrow('to‘xtatilgan');
  await expect(join(vali)).rejects.toThrow('to‘xtatilgan');
  await adminServices(admin, { op: 'worker', wk: keyOf(vali.id), status: 'active' });
  await manageServices(vali, { op: 'apply', uk, id });
  // tanlangan ijrochi profilidan chiqib keta olmaydi
  await adminServices(admin, { op: 'assign', uk, id, worker: keyOf(vali.id) });
  await expect(manageServices(vali, { op: 'leave' })).rejects.toThrow('tugallanmagan');
  // administrator ijrochini qaytarib oladi — vazifa yana e'londa
  await adminServices(admin, { op: 'unassign', uk, id });
  expect((await servicesView(gani, NOW)).board).toHaveLength(1);
  // hisob o'chirilsa — profil va arizalar o'chadi
  const patch = await forgetServiceUser(keyOf(vali.id));
  expect(patch).toMatchObject({ ['serviceWorkers/' + keyOf(vali.id)]: null });
  expect(Object.keys(patch).some((k) => k.endsWith('/apps/' + keyOf(vali.id)))).toBe(true);
});

it('cancelling removes the files; open tasks are limited; finished ones can be removed', async () => {
  const uk = keyOf(ali.id);
  const id = await order(ali);
  const fid = await upload(ali, 'me', uk, id);
  expect(await siteGet('serviceFiles/' + uk + '/' + fid + '/0')).toBeTruthy();
  await manageServices(ali, { op: 'cancel', id }, NOW);
  expect(await siteGet('serviceFiles/' + uk + '/' + fid)).toBeNull();
  expect((await servicesView(ali, NOW)).orders![0]).toMatchObject({ status: 'cancel', files: [] });
  await manageServices(ali, { op: 'remove', id }, NOW);
  expect((await servicesView(ali, NOW)).orders).toEqual([]);
  for (let i = 0; i < 5; i++) await order(ali, NOW + i);
  await expect(order(ali, NOW + 10)).rejects.toThrow('5 tagacha');
  const open = (await servicesView(ali, NOW)).orders![0].id;
  await expect(manageServices(ali, { op: 'remove', id: open }, NOW)).rejects.toThrow(
    'bekor qiling',
  );
  const begin = (await manageServices(ali, {
    op: 'begin',
    id: open,
    name: 'soxta.pdf',
    size: 5,
  })) as { fid: string };
  await expect(
    saveServiceChunk(ali, 'me', uk + '/' + open, begin.fid, 0, Buffer.from('hello')),
  ).rejects.toThrow('buzilgan');
  await expect(saveServiceChunk(vali, 'me', uk + '/' + open, begin.fid, 0, PDF)).rejects.toThrow(
    'yuklab bo‘lmaydi',
  );
});

it(`result files are deleted ${KEEP_DAYS} days after completion`, async () => {
  const uk = keyOf(ali.id);
  const id = await order(ali);
  await join(vali);
  await manageServices(vali, { op: 'apply', uk, id });
  await adminServices(admin, { op: 'assign', uk, id, worker: keyOf(vali.id) });
  await adminServices(admin, { op: 'confirm', uk, id });
  const out = await upload(admin, 'admin', uk, id);
  await adminServices(admin, { op: 'status', uk, id, status: 'done' }, NOW);
  expect((await servicesView(ali, NOW + (KEEP_DAYS - 1) * DAY)).orders![0].files).toHaveLength(1);
  const later = await servicesView(ali, NOW + (KEEP_DAYS + 1) * DAY);
  expect(later.orders![0]).toMatchObject({ status: 'done', expired: true, files: [] });
  expect(await siteGet('serviceFiles/' + uk + '/' + out)).toBeNull();
});

it('until the administrator launches the section only the administrator can post; workers can join', async () => {
  await adminServices(admin, { op: 'launch', open: false });
  expect((await servicesView(null)).open).toBe(false);
  await expect(order(ali)).rejects.toThrow('hali ishga tushmagan');
  await order(admin); // administrator sinab ko'rishi mumkin
  await join(vali); // ijrochilar oldindan ro'yxatdan o'tadi
  await adminServices(admin, { op: 'info', how: 'Karta: 8600 …' });
  expect(await servicesAdmin(admin)).toMatchObject({ open: false, how: 'Karta: 8600 …' });
  await expect(adminServices(ali, { op: 'launch', open: true })).rejects.toThrow('Administrator');
  await adminServices(admin, { op: 'launch', open: true });
  await order(ali);
  expect((await servicesAdmin(admin)).how).toBe('Karta: 8600 …');
});

it('cards count the people who ordered and who wait; suggestions reach «Message the admin»', async () => {
  const card = async (a: Actor | null, id: string) =>
    (await servicesView(a, NOW)).catalog.find((k) => k.id === id)!;
  await adminServices(admin, { op: 'launch', open: false });
  await expect(manageServices(ali, { op: 'idea', kinds: [], text: '' }, NOW)).rejects.toThrow(
    'belgilang',
  );
  await manageServices(
    ali,
    { op: 'idea', kinds: ['taqdimot', 'sayt', 'nomalum'], text: 'Arzonroq bo‘lsin' },
    NOW,
  );
  await manageServices(vali, { op: 'idea', kinds: ['taqdimot'], text: '' }, NOW);
  await manageServices(ali, { op: 'idea', kinds: ['taqdimot'], text: '' }, NOW + 1000);
  await manageServices(admin, { op: 'idea', kinds: ['taqdimot'], text: '' }, NOW);
  expect(await card(null, 'taqdimot')).toMatchObject({ wants: 2, used: 0 });
  expect(await servicesView(null, NOW)).toMatchObject({ fans: 2, people: 0 });
  const msgs = (await supportList(ali, false, undefined, NOW)).messages!;
  expect(msgs[0]).toMatchObject({ cat: 'idea' });
  expect(msgs[0].text).toBe(
    '💡 PULLIK XIZMATLAR — TAKLIF\nKerakli xizmatlar: Taqdimot, Sayt yaratish\nTaklif: Arzonroq bo‘lsin',
  );
  await adminServices(admin, { op: 'launch', open: true });
  await order(ali);
  await order(ali, NOW + 1);
  await order(vali, NOW, 'sayt');
  await order(admin); // sanalmaydi
  expect(await card(ali, 'taqdimot')).toMatchObject({ used: 1 });
  expect(await servicesView(ali, NOW)).toMatchObject({ people: 2 });
});
