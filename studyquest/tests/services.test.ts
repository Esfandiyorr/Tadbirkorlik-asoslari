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
  servicesShown,
  servicesView,
} from '../lib/server/services';
import { resetSiteMemory, siteGet, siteUpdate } from '../lib/server/site-content';
import { supportList } from '../lib/server/support';

/* 💼 Pullik xizmatlar: buyurtma → «🤖 Sun'iy intellekt yordamida tayyorlanmoqda» (buyurtma administratorga yozishma
   bo'lib keladi) → administrator natijani yuboradi → buyurtmachi qabul qiladi yoki tuzatish so'raydi. To'lov ishni
   to'xtatmaydi: «To'lov qildim» → administrator tasdiqlaydi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(async () => {
  resetSiteMemory();
  // bo'lim ochiq va ishga tushirilgan holat (yopiq va ishga tushmagan holatlar — alohida sinovlarda)
  await adminServices(admin, { op: 'show', shown: true });
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
const PDF = Buffer.from('%PDF-1.4\n% sinov fayli\n');
const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 15, 9, 0);

async function order(a: Actor, now = NOW, kind = 'taqdimot') {
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
async function upload(a: Actor, as: 'me' | 'admin', uk: string, id: string, bytes = PDF) {
  const begin =
    as === 'admin'
      ? await adminServices(a, { op: 'begin', uk, id, name: 'natija.pdf', size: bytes.length })
      : await manageServices(a, { op: 'begin', id, name: 'talab.pdf', size: bytes.length });
  const { fid } = begin as { fid: string };
  await saveServiceChunk(a, as, uk + '/' + id, fid, 0, bytes);
  if (as === 'admin') await adminServices(a, { op: 'finish', uk, id, fid });
  else await manageServices(a, { op: 'finish', id, fid });
  return fid;
}

it('a temporarily closed section refuses users but not the administrator', async () => {
  resetSiteMemory();
  // 🔒 sozlama yo'q — bo'lim vaqtincha yopiq (administrator ochmaguncha)
  expect(await servicesShown()).toBe(false);
  expect((await servicesView(ali)).shown).toBe(false);
  expect((await servicesAdmin(admin)).shown).toBe(false);
  await expect(order(ali)).rejects.toThrow('vaqtincha yopiq');
  await expect(manageServices(ali, { op: 'idea', kinds: ['taqdimot'], text: '' })).rejects.toThrow(
    'vaqtincha yopiq',
  );
  // administrator yopiq bo'limda ham ishlaydi va uni ochadi
  await adminServices(admin, { op: 'launch', open: true });
  await order(admin, NOW);
  await adminServices(admin, { op: 'show', shown: true });
  expect((await servicesAdmin(admin)).shown).toBe(true);
  expect(await servicesShown()).toBe(true);
  const id = await order(ali, NOW + 1);
  await adminServices(admin, { op: 'show', shown: false });
  expect(await siteGet('serviceInfo/shown')).toBeNull();
  await expect(order(ali, NOW + 2)).rejects.toThrow('vaqtincha yopiq');
  await expect(
    saveServiceChunk(ali, 'me', keyOf(ali.id) + '/' + id, 'z', 0, Buffer.from('a')),
  ).rejects.toThrow('vaqtincha yopiq');
});

it('a guest sees the catalog and figures; the administrator sets hints and closes a direction', async () => {
  const guest = await servicesView(null);
  expect(guest).toMatchObject({ signedIn: false, done: 0, people: 0 });
  expect(guest.orders).toBeUndefined();
  expect(guest.how).toBeUndefined();
  expect(guest.catalog.map((k) => k.id)).toEqual(SERVICE_KINDS.map((k) => k.id));
  // narx belgilanmaydi: eski mijoz yuborgan narx saqlanmaydi, faqat muddat
  await adminServices(admin, {
    op: 'catalog',
    kind: 'taqdimot',
    price: '50 000 so‘mdan',
    days: '2–3 kun',
    off: false,
  });
  await adminServices(admin, { op: 'catalog', kind: 'video', days: '', off: true });
  await adminServices(admin, { op: 'info', how: 'Click orqali 8600 … kartaga o‘tkazing' });
  const view = await servicesView(ali);
  const card = view.catalog.find((k) => k.id === 'taqdimot')!;
  expect(card).toMatchObject({ days: '2–3 kun' });
  expect('price' in card).toBe(false);
  expect(view.catalog.some((k) => k.id === 'video')).toBe(false);
  expect(view).toMatchObject({ how: expect.stringContaining('Click'), orders: [] });
  await expect(order(ali, NOW, 'video')).rejects.toThrow('yopiq');
  await expect(adminServices(ali, { op: 'info', how: 'x' })).rejects.toThrow('Administrator');
  // ijrochilar bozori olib tashlangan: ularning amallari endi qabul qilinmaydi
  await expect(
    manageServices(ali, {
      op: 'join',
      about: 'tajriba',
      skills: ['taqdimot'],
      pay: '8600',
      agree: true,
    }),
  ).rejects.toThrow();
  await expect(adminServices(admin, { op: 'fee', fee: 10 })).rejects.toThrow();
});

it('the whole path: order (no price) → «prepared with AI» → chat → result sent → paid with a receipt → changes → accepted', async () => {
  const id = await order(ali);
  const uk = keyOf(ali.id);
  const need = await upload(ali, 'me', uk, id);
  // buyurtmachida — «tayyorlanmoqda» (sun'iy intellekt yozuvi), boshqalar buyurtmani ko'rmaydi
  let mine = (await servicesView(ali, NOW)).orders!;
  // narx so'ralmaydi — to'lov natija yuborilgandan keyin
  expect(mine[0]).toMatchObject({ id, status: 'work', budget: 0, contact: '@ali' });
  expect((await servicesView(vali, NOW)).orders).toEqual([]);
  await expect(serviceChunk(vali, uk + '/' + id, need, 0)).rejects.toThrow('topilmadi');
  // administratorga keladi: kim, qaysi xizmat, nima yozgani, fayli
  let inbox = (await servicesAdmin(admin, NOW)).orders;
  expect(inbox[0]).toMatchObject({
    uk,
    id,
    kind: 'taqdimot',
    name: 'Ali Valiyev',
    group: 'AP-223',
    title: 'Marketing asoslari',
    text: expect.stringContaining('12 slayd'),
    status: 'work',
    msgs: [],
  });
  expect((await serviceChunk(admin, uk + '/' + id, need, 0)).bytes.equals(PDF)).toBe(true);
  // yozishma: administrator savol beradi, buyurtmachi javob beradi
  await adminServices(admin, { op: 'msg', uk, id, text: 'Ranglar qanday bo‘lsin?' }, NOW + 1000);
  await manageServices(ali, { op: 'msg', id, text: 'Ko‘k va oq' }, NOW + 2000);
  inbox = (await servicesAdmin(admin, NOW)).orders;
  expect(inbox[0].msgs.map((m) => [m.from, m.text])).toEqual([
    ['team', 'Ranglar qanday bo‘lsin?'],
    ['user', 'Ko‘k va oq'],
  ]);
  // 🧾 chek rasmi: faqat rasm yoki PDF; uni buyurtmachi va administrator ko'radi, boshqalar — yo'q
  const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
  await expect(
    manageServices(ali, { op: 'begin', id, name: 'chek.docx', size: 10, side: 'pay' }),
  ).rejects.toThrow('Chek uchun');
  const rb = (await manageServices(ali, {
    op: 'begin',
    id,
    name: 'chek.png',
    size: PNG.length,
    side: 'pay',
  })) as { fid: string };
  await saveServiceChunk(ali, 'me', uk + '/' + id, rb.fid, 0, PNG);
  await manageServices(ali, { op: 'finish', id, fid: rb.fid });
  expect((await serviceChunk(admin, uk + '/' + id, rb.fid, 0)).bytes.equals(PNG)).toBe(true);
  await expect(serviceChunk(vali, uk + '/' + id, rb.fid, 0)).rejects.toThrow('topilmadi');
  // 💳 to'lov ish bajarilgach ochiladi
  await expect(manageServices(ali, { op: 'paid', id, amount: 150000, note: '' })).rejects.toThrow(
    'natija yuborilgach',
  );
  // natijasiz yuborib bo'lmaydi; fayl yuklangach — «Mijozga yuborish»
  await expect(adminServices(admin, { op: 'status', uk, id, status: 'review' })).rejects.toThrow(
    'tayyor ish',
  );
  await expect(manageServices(ali, { op: 'accept', id, rating: 5 })).rejects.toThrow(
    'yuborilmagan',
  );
  const result = Buffer.concat([PDF, Buffer.from('natija')]);
  const out = await upload(admin, 'admin', uk, id, result);
  await adminServices(admin, { op: 'status', uk, id, status: 'review' }, NOW + 3000);
  mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0]).toMatchObject({ status: 'review', deliveredAt: NOW + 3000 });
  expect((await serviceChunk(ali, uk + '/' + id, out, 0)).bytes.equals(result)).toBe(true);
  // endi to'lov: istalgan summa + chek; natija yuborilgach buyurtmachi o'zi bekor qila olmaydi
  await expect(manageServices(ali, { op: 'paid', id, amount: 500, note: '' })).rejects.toThrow();
  await manageServices(ali, { op: 'paid', id, amount: 150000, note: 'chek 12345' }, NOW + 4000);
  expect(
    (await servicesAdmin(admin, NOW)).orders[0].files.filter((f) => f.side === 'pay'),
  ).toMatchObject([{ name: 'chek.png', ext: 'png' }]);
  await expect(manageServices(ali, { op: 'cancel', id })).rejects.toThrow('administrator');
  mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0]).toMatchObject({
    status: 'review',
    budget: 150000,
    paidAt: NOW + 4000,
    paidNote: 'chek 12345',
  });
  expect(mine[0].payOk).toBeUndefined();
  await adminServices(admin, { op: 'confirm', uk, id }, NOW + 5000);
  expect((await servicesView(ali, NOW)).orders![0].payOk).toBe(NOW + 5000);
  await expect(
    manageServices(ali, { op: 'begin', id, name: 'chek2.png', size: 12, side: 'pay' }),
  ).rejects.toThrow('tasdiqlangan');
  await expect(adminServices(admin, { op: 'confirm', uk, id })).rejects.toThrow('allaqachon');
  await expect(manageServices(ali, { op: 'paid', id, amount: 150000, note: '' })).rejects.toThrow(
    'allaqachon',
  );
  // tuzatish → yana tayyorlanmoqda → qayta yuborish → qabul va baho
  await manageServices(ali, { op: 'revise', id, text: '3-slaydni o‘zgartiring' }, NOW + 6000);
  expect((await servicesView(ali, NOW)).orders![0].status).toBe('work');
  await expect(manageServices(ali, { op: 'cancel', id })).rejects.toThrow('administrator');
  await adminServices(admin, { op: 'status', uk, id, status: 'review' }, NOW + 7000);
  await manageServices(ali, { op: 'accept', id, rating: 5, review: 'Zo‘r!' }, NOW + 8000);
  mine = (await servicesView(ali, NOW)).orders!;
  expect(mine[0]).toMatchObject({ status: 'done', rating: 5, review: 'Zo‘r!' });
  expect(mine[0].msgs.at(-1)).toMatchObject({
    from: 'user',
    text: '🔁 Tuzatish: 3-slaydni o‘zgartiring',
  });
  expect(await servicesView(null, NOW)).toMatchObject({ done: 1, people: 1 });
  // yakunlanganini buyurtmachi ro'yxatdan o'chira oladi
  await manageServices(ali, { op: 'remove', id }, NOW + 9000);
  expect((await servicesView(ali, NOW)).orders).toEqual([]);
  expect(await siteGet('serviceFiles/' + uk + '/' + out)).toBeNull();
});

it('old records (worker marketplace era) open as «being prepared»; account deletion clears an old worker profile', async () => {
  const uk = keyOf(ali.id);
  const id = await order(ali);
  for (const old of ['open', 'assigned', 'paid', 'new', 'quoted']) {
    await siteUpdate({ ['serviceOrders/' + uk + '/' + id + '/status']: old });
    expect((await servicesView(ali, NOW)).orders![0].status).toBe('work');
  }
  await siteUpdate({
    ['serviceOrders/' + uk + '/' + id + '/msgs/m1']: { from: 'worker', text: 'salom', at: NOW },
  });
  expect((await servicesAdmin(admin, NOW)).orders[0].msgs).toEqual([
    { id: 'm1', from: 'team', text: 'salom', at: NOW },
  ]);
  expect(await forgetServiceUser(keyOf(vali.id))).toEqual({
    ['serviceWorkers/' + keyOf(vali.id)]: null,
  });
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
  const out = await upload(admin, 'admin', uk, id);
  await adminServices(admin, { op: 'status', uk, id, status: 'done' }, NOW);
  expect((await servicesView(ali, NOW + (KEEP_DAYS - 1) * DAY)).orders![0].files).toHaveLength(1);
  const later = await servicesView(ali, NOW + (KEEP_DAYS + 1) * DAY);
  expect(later.orders![0]).toMatchObject({ status: 'done', expired: true, files: [] });
  expect(await siteGet('serviceFiles/' + uk + '/' + out)).toBeNull();
});

it('until the administrator launches the section only the administrator can order', async () => {
  await adminServices(admin, { op: 'launch', open: false });
  expect((await servicesView(null)).open).toBe(false);
  await expect(order(ali)).rejects.toThrow('hali ishga tushmagan');
  await order(admin); // administrator sinab ko'rishi mumkin
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
