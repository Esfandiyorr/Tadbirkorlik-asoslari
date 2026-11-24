import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { BUILTIN_AVATARS } from '../lib/avatars';
import { FINAL, parseQuestions } from '../lib/exam';
import { pickAvatar } from '../lib/server/avatars';
import { examAct, examAdmin, examAdminAct, examCert, examView, keyOf } from '../lib/server/exam';
import {
  adminServices,
  manageServices,
  saveServiceChunk,
  servicesView,
} from '../lib/server/services';
import { premiumAdmin, premiumState } from '../lib/server/premium';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';

/* 🎯 Yakuniy testga tayyorgarlik: savollarni yuklash (ikki format), bo'limni sotib olish (narx belgilanmagan:
   istalgan summa + chek skrinshoti) → administrator qabul qilishi bilan ochilishi, mashq va xatolar, yakuniy sinov va
   sertifikat; Premium obuna ham shu yo'l bilan (administrator 1 oy yoki 1 yil tanlaydi); soxta chek → blok. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => resetSiteMemory());
const who = (id: string, role = 'student', name = 'Ali Valiyev') =>
  ({ id, uid: id, role, name, classId: 'AP-223', learnerType: 'university' }) as unknown as Actor;
const admin = who('owner', 'admin', 'Admin');
const ali = who('legacy_ali');
const vali = who('legacy_vali', 'student', 'Vali Karimov');
const NOW = Date.UTC(2026, 10, 24, 9, 0);

/** n ta savol: to'g'ri javob har doim B. */
const block = (topic: number, n: number, from = 1) =>
  Array.from({ length: n }, (_, i) => {
    const k = from + i;
    return `${k}. ${topic}-mavzu ${k}-savol?\nA) noto‘g‘ri\n*B) to‘g‘ri ${k}\nC) noto‘g‘ri\nD) noto‘g‘ri`;
  }).join('\n\n');

it('reads numbered and HEMIS formats and reports mistakes', () => {
  const numbered = parseQuestions(`1. Foyda nima?
a) Xarajat
b) Daromad minus xarajat
c) Soliq
Javob: b

2) Biznes-reja
kim uchun?
A) Bank uchun
B) Faqat davlat uchun *
3. Javobsiz savol
A) bir
B) ikki`);
  expect(numbered.items).toEqual([
    { q: 'Foyda nima?', o: ['Xarajat', 'Daromad minus xarajat', 'Soliq'], c: 1 },
    { q: 'Biznes-reja kim uchun?', o: ['Bank uchun', 'Faqat davlat uchun'], c: 1 },
  ]);
  expect(numbered.errors).toEqual(['3-savol: to‘g‘ri javob belgilanmagan («*» yoki «Javob: B»).']);
  const hemis = parseQuestions(`++++
Marketing nima?
====
Ishlab chiqarish
====
#Bozorni o‘rganish va sotish
====
Buxgalteriya
++++
Ikki to‘g‘ri javobli
====
#bir
====
#ikki`);
  expect(hemis.items).toEqual([
    {
      q: 'Marketing nima?',
      o: ['Ishlab chiqarish', 'Bozorni o‘rganish va sotish', 'Buxgalteriya'],
      c: 1,
    },
  ]);
  expect(hemis.errors[0]).toContain('2-savol');
});

it('the administrator uploads questions per topic; re-uploading the same text updates instead of duplicating', async () => {
  await expect(
    examAdminAct(ali, { op: 'import', topic: 'm1', text: block(1, 2), replace: false }),
  ).rejects.toThrow('Administrator');
  let r = await examAdminAct(admin, {
    op: 'import',
    topic: 'm1',
    text: block(1, 30),
    replace: false,
  });
  expect(r).toMatchObject({ added: 30, updated: 0 });
  r = await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 5), replace: false });
  expect(r).toMatchObject({ added: 0, updated: 5 });
  await examAdminAct(admin, { op: 'import', topic: 'm2', text: block(2, 3), replace: false });
  let v = await examAdmin(admin);
  expect(v.total).toBe(33);
  expect(v.topics.map((t) => t.count).slice(0, 3)).toEqual([30, 3, 0]);
  expect(v.topics[0].items[0]).toMatchObject({
    q: '1. 1-mavzu 1-savol?'.replace(/^1\. /, ''),
    c: 1,
  });
  // almashtirish va o'chirish
  await examAdminAct(admin, { op: 'import', topic: 'm2', text: block(2, 2, 10), replace: true });
  v = await examAdmin(admin);
  expect(v.topics[1].count).toBe(2);
  await examAdminAct(admin, { op: 'remove', topic: 'm2', id: v.topics[1].items[0].id });
  await examAdminAct(admin, { op: 'clear', topic: 'm1' });
  v = await examAdmin(admin);
  expect(v.total).toBe(1);
  await expect(
    examAdminAct(admin, { op: 'import', topic: 'm1', text: 'shunchaki matn', replace: false }),
  ).rejects.toThrow();
});
/** Sodda to'lov: xarid → chek skrinshoti (rasm) → «Chekni yuborish» (istalgan summa). */
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
async function receipt(a: Actor, id: string) {
  const b = (await manageServices(a, {
    op: 'begin',
    id,
    name: 'chek.png',
    size: PNG.length,
    side: 'pay',
  })) as { fid: string };
  await saveServiceChunk(a, 'me', keyOf(a.id) + '/' + id, b.fid, 0, PNG);
  await manageServices(a, { op: 'finish', id, fid: b.fid });
}
async function pay(a: Actor, product: string, amount: number, now = NOW) {
  const { id } = (await manageServices(a, { op: 'buy', product }, now)) as { id: string };
  await receipt(a, id);
  await manageServices(a, { op: 'paid', id, amount, note: '' }, now);
  return id;
}

it('no fixed price: the user pays any amount, uploads a receipt and the section opens when the administrator accepts it', async () => {
  await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 4), replace: false });
  const v = await examView(ali, NOW);
  expect(v).toMatchObject({ access: false, total: 4, signedIn: true });
  await expect(examAct(ali, { op: 'start', mode: 'mix' })).rejects.toThrow('pullik');
  // xarid narxsiz boshlanadi (bo'lim «Pullik xizmatlar» yopiq bo'lsa ham)
  const { id } = (await manageServices(ali, { op: 'buy', product: 'yakuniy-test' }, NOW)) as {
    id: string;
  };
  expect((await servicesView(ali, NOW)).orders!.find((o) => o.id === id)).toMatchObject({
    budget: 0,
    status: 'work',
  });
  // chek skrinshotisiz va juda kichik summa bilan — yo'q
  await expect(manageServices(ali, { op: 'paid', id, amount: 7000, note: '' })).rejects.toThrow(
    'chek',
  );
  await receipt(ali, id);
  await expect(manageServices(ali, { op: 'paid', id, amount: 500, note: '' })).rejects.toThrow();
  await manageServices(ali, { op: 'paid', id, amount: 7000, note: 'Payme' }, NOW + 1000);
  let order = (await servicesView(ali, NOW)).orders!.find((o) => o.id === id)!;
  expect(order).toMatchObject({
    status: 'work',
    budget: 7000,
    paidAt: NOW + 1000,
    paidNote: 'Payme',
  });
  expect(order.granted).toBeUndefined();
  // administrator qabul qilmaguncha yopiq
  expect((await examView(ali, NOW)).access).toBe(false);
  await adminServices(admin, { op: 'confirm', uk: keyOf(ali.id), id }, NOW + 2000);
  order = (await servicesView(ali, NOW)).orders!.find((o) => o.id === id)!;
  expect(order).toMatchObject({ status: 'done', payOk: NOW + 2000, granted: NOW + 2000 });
  expect((await examView(ali, NOW)).access).toBe(true);
  await expect(manageServices(ali, { op: 'buy', product: 'yakuniy-test' })).rejects.toThrow(
    'allaqachon',
  );
  // o'qituvchi va administratorga bo'lim doim ochiq
  expect((await examView(who('t1', 'teacher', 'O‘qituvchi'), NOW)).access).toBe(true);
});

it('Premium: any amount and a receipt; the administrator opens it for 1 month or 1 year; old fixed plans are not sold', async () => {
  await expect(manageServices(vali, { op: 'buy', product: 'premium-oy' })).rejects.toThrow('yo‘q');
  const id = await pay(vali, 'premium', 3000);
  expect((await premiumState(vali, NOW)).active).toBe(false);
  await expect(pickAvatar(vali, [], { avatar: 'joy' }, BUILTIN_AVATARS, NOW)).rejects.toMatchObject(
    {
      status: 403,
    },
  );
  // «💎 Obuna» sahifasida: chek yuborganlar ro'yxati
  let pm = await premiumAdmin(admin, NOW);
  expect(pm.pending).toMatchObject([
    { id, uk: keyOf(vali.id), name: 'Vali Karimov', budget: 3000, paidAt: NOW },
  ]);
  expect(pm.pending[0].files.filter((f) => f.side === 'pay')).toHaveLength(1);
  await adminServices(admin, { op: 'confirm', uk: keyOf(vali.id), id, days: 365 }, NOW);
  const st = await premiumState(vali, NOW);
  expect(st.active).toBe(true);
  expect(st.until).toBe(NOW + 365 * 86400000);
  const view = await pickAvatar(vali, [], { avatar: 'joy' }, BUILTIN_AVATARS, NOW);
  expect(view.avatars.me).toMatchObject({ place: 0, via: 'premium', premium: true, avatar: 'joy' });
  expect((await servicesView(vali, NOW)).orders!.find((o) => o.id === id)!.days).toBe(365);
  // ikkinchi chek — 1 oy, muddat ustiga qo'shiladi
  const id2 = await pay(vali, 'premium', 5000, NOW + 1000);
  await adminServices(admin, { op: 'confirm', uk: keyOf(vali.id), id: id2, days: 30 }, NOW + 2000);
  expect((await premiumState(vali, NOW)).until).toBe(NOW + 395 * 86400000);
  // obunachilar: qancha muddatga va qancha to'lagani (tarix bilan)
  pm = await premiumAdmin(admin, NOW);
  expect(pm.pending).toEqual([]);
  expect(pm.paid).toBe(8000);
  expect(pm.grants).toMatchObject([
    {
      uid: vali.id,
      name: 'Vali Karimov',
      days: 395,
      paid: 8000,
      until: NOW + 395 * 86400000,
      hist: [
        { at: NOW, days: 365, amount: 3000, by: 'Admin' },
        { at: NOW + 2000, days: 30, amount: 5000, by: 'Admin' },
      ],
    },
  ]);
});

it('the administrator may not accept a receipt: the order closes, nothing opens, the user can send a new one', async () => {
  const id = await pay(ali, 'premium', 2000);
  await expect(adminServices(ali, { op: 'reject', uk: keyOf(ali.id), id })).rejects.toThrow(
    'Administrator',
  );
  await adminServices(
    admin,
    { op: 'reject', uk: keyOf(ali.id), id, reason: 'summa ko‘rinmaydi' },
    NOW + 1000,
  );
  expect((await servicesView(ali, NOW)).orders!.find((o) => o.id === id)).toMatchObject({
    status: 'cancel',
    reason: 'Chek qabul qilinmadi: summa ko‘rinmaydi',
    files: [],
  });
  expect((await premiumState(ali, NOW)).active).toBe(false);
  expect((await premiumAdmin(admin, NOW)).pending).toEqual([]);
  // blok yo'q — yangi chek yuborsa bo'ladi
  expect((await servicesView(ali, NOW)).banned).toBeUndefined();
  const again = await pay(ali, 'premium', 5000, NOW + 2000);
  await expect(
    adminServices(admin, { op: 'reject', uk: keyOf(ali.id), id: again + 'x' }),
  ).rejects.toThrow();
  await adminServices(admin, { op: 'confirm', uk: keyOf(ali.id), id: again, days: 30 });
  expect((await premiumState(ali, NOW)).active).toBe(true);
  await expect(
    adminServices(admin, { op: 'reject', uk: keyOf(ali.id), id: again }),
  ).rejects.toThrow('tasdiqlangan');
});

it('practice records mistakes; the final exam is graded at the end and a pass gives a verifiable certificate', async () => {
  for (let t = 1; t <= 3; t++)
    await examAdminAct(admin, { op: 'import', topic: 'm' + t, text: block(t, 5), replace: false });
  await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 1), replace: false });
  const id = await pay(ali, 'yakuniy-test', 5000);
  await adminServices(admin, { op: 'confirm', uk: keyOf(ali.id), id }, NOW);

  // mavzu bo'yicha mashq: javoblar darhol tekshiriladi, to'g'ri javob oldindan berilmaydi
  const topic = (await examAct(ali, { op: 'start', mode: 'topic', topic: 'm1' }, NOW)) as {
    items: { id: string; o: string[]; c?: number }[];
  };
  expect(topic.items).toHaveLength(5);
  expect(topic.items[0].c).toBeUndefined();
  expect(await examAct(ali, { op: 'answer', id: topic.items[0].id, choice: 0 }, NOW)).toEqual({
    ok: false,
    correct: 1,
  });
  expect(await examAct(ali, { op: 'answer', id: topic.items[1].id, choice: 1 }, NOW)).toEqual({
    ok: true,
    correct: 1,
  });
  let v = await examView(ali, NOW);
  expect(v.topics[0]).toMatchObject({ count: 5, seen: 2, right: 1, wrong: 1 });
  expect(v.mistakes).toBe(1);
  const mistakes = (await examAct(ali, { op: 'start', mode: 'mistakes' }, NOW)) as {
    items: { id: string }[];
  };
  expect(mistakes.items.map((x) => x.id)).toEqual([topic.items[0].id]);

  // yakuniy sinov: har mavzudan FINAL.perTopic tadan, vaqt chegarasi bilan
  const run = (await examAct(ali, { op: 'start', mode: 'final' }, NOW)) as {
    run: string;
    end: number;
    items: { id: string }[];
  };
  expect(run.items).toHaveLength(3 * FINAL.perTopic);
  expect(run.end).toBe(NOW + FINAL.minutes * 60000);
  // sahifa yangilansa — tugallanmagan sinov qaytadi
  expect((await examView(ali, NOW + 60000)).open?.id).toBe(run.run);
  // 9 tadan 5 tasi to'g'ri — 56 %, o'tmadi
  const answers = (ok: number) =>
    Object.fromEntries(run.items.map((x, i) => [x.id, i < ok ? 1 : 2]));
  const fail = (await examAct(
    ali,
    { op: 'finish', run: run.run, answers: answers(5) },
    NOW + 60000,
  )) as {
    pct: number;
    passed: boolean;
    cert?: string;
  };
  expect(fail).toMatchObject({ score: 5, total: 9, pct: 56, passed: false });
  expect(fail.cert).toBeUndefined();
  await expect(
    examAct(ali, { op: 'finish', run: run.run, answers: answers(9) }, NOW + 60000),
  ).rejects.toThrow('allaqachon');
  // keyingisida 6/9 — 67 % → sertifikat
  const run2 = (await examAct(ali, { op: 'start', mode: 'final' }, NOW + 120000)) as {
    run: string;
    items: { id: string }[];
  };
  const pass = (await examAct(
    ali,
    {
      op: 'finish',
      run: run2.run,
      answers: Object.fromEntries(run2.items.map((x, i) => [x.id, i < 6 ? 1 : 0])),
    },
    NOW + 180000,
  )) as { pct: number; passed: boolean; cert: string };
  expect(pass).toMatchObject({ score: 6, total: 9, pct: 67, passed: true });
  expect(pass.cert).toMatch(/^TA-[A-Z0-9]+-[A-Z0-9]{4}$/);
  const cert = await examCert(pass.cert);
  expect(cert).toMatchObject({ name: 'Ali Valiyev', group: 'AP-223', score: 6, total: 9, pct: 67 });
  expect(cert.course).toBe('Tadbirkorlik asoslari');
  await expect(examCert('TA-NOPE-0000')).rejects.toThrow('topilmadi');
  v = await examView(ali, NOW);
  expect(v.runs.map((r) => [r.pct, r.passed, !!r.cert])).toEqual([
    [67, true, true],
    [56, false, false],
  ]);
  // vaqt tugagach topshirib bo'lmaydi
  const late = (await examAct(ali, { op: 'start', mode: 'final' }, NOW)) as { run: string };
  await expect(
    examAct(ali, { op: 'finish', run: late.run, answers: {} }, NOW + (FINAL.minutes + 5) * 60000),
  ).rejects.toThrow('vaqti tugagan');
  // sertifikat yozuvi bazada, natijalar foydalanuvchi bo'yicha
  expect(await siteGet('examCerts/' + pass.cert)).toBeTruthy();
});

it('a fake receipt: the administrator rejects and blocks — nothing opens and paid services are refused', async () => {
  await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 3), replace: false });
  const id = await pay(ali, 'yakuniy-test', 10000);
  const r = (await adminServices(
    admin,
    { op: 'ban', uk: keyOf(ali.id), id, account: true },
    NOW + 9000,
  )) as { admin: { bans: { uid: string; account?: boolean; title?: string }[] } };
  expect(r.admin.bans).toMatchObject([
    { uid: ali.id, account: true, title: 'Yakuniy testga tayyorgarlik' },
  ]);
  expect((await examView(ali, NOW)).access).toBe(false);
  expect((await servicesView(ali, NOW)).orders!.find((o) => o.id === id)).toMatchObject({
    status: 'cancel',
    reason: 'To‘lov topilmadi',
  });
  expect((await servicesView(ali, NOW)).banned).toBe(true);
  await expect(manageServices(ali, { op: 'buy', product: 'yakuniy-test' })).rejects.toThrow(
    'yopilgan',
  );
  await expect(manageServices(ali, { op: 'buy', product: 'premium' })).rejects.toThrow('yopilgan');
  // blokdan chiqarish — yana sotib ola oladi
  await adminServices(admin, { op: 'unban', uk: keyOf(ali.id) });
  expect((await servicesView(ali, NOW)).banned).toBeUndefined();
  const p = await pay(ali, 'premium', 5000);
  await adminServices(admin, { op: 'confirm', uk: keyOf(ali.id), id: p, days: 30 });
  expect((await premiumState(ali, NOW)).active).toBe(true);
  // qabul qilingan to'lovni bloklab bo'lmaydi
  await expect(
    adminServices(admin, { op: 'ban', uk: keyOf(ali.id), id: p, account: false }),
  ).rejects.toThrow('tasdiqlangan');
});
