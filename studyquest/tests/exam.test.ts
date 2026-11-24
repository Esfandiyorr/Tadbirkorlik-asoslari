import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import { FINAL, parseQuestions } from '../lib/exam';
import { examAct, examAdmin, examAdminAct, examCert, examView, keyOf } from '../lib/server/exam';
import { adminServices, manageServices, servicesView } from '../lib/server/services';
import { grantPremium, premiumState } from '../lib/server/premium';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';

/* 🎯 Yakuniy testga tayyorgarlik: savollarni yuklash (ikki format), bo'limni sotib olish (pullik xizmat, obunachiga
   50 % arzon) → to'lov tasdiqlanishi bilan ochilishi, mashq va xatolar, yakuniy sinov va sertifikat; Premium obuna
   ham shu yo'l bilan sotiladi. */
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

it('the section is bought as a paid service (50 % off for Premium) and opens when the payment is confirmed', async () => {
  await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 4), replace: false });
  // yopiq: sonlar ko'rinadi, savol berilmaydi
  let v = await examView(ali, NOW);
  expect(v).toMatchObject({ access: false, total: 4, signedIn: true });
  await expect(examAct(ali, { op: 'start', mode: 'mix' })).rejects.toThrow('pullik');
  // obunachi: 10 000 o'rniga 5 000 (bo'lim «Pullik xizmatlar» yopiq bo'lsa ham sotiladi)
  await grantPremium(ali.id, ali.name!, 'AP-223', 30, 'test', NOW);
  expect((await servicesView(ali, NOW)).discount).toBe(50);
  const { id } = (await manageServices(ali, { op: 'buy', product: 'yakuniy-test' }, NOW)) as {
    id: string;
  };
  // ikkinchi bosish — o'sha buyurtma
  expect(
    ((await manageServices(ali, { op: 'buy', product: 'yakuniy-test' }, NOW)) as { id: string }).id,
  ).toBe(id);
  let order = (await servicesView(ali, NOW)).orders!.find((o) => o.id === id)!;
  expect(order).toMatchObject({
    kind: 'yakuniy-test',
    budget: 10000,
    discount: 50,
    status: 'work',
  });
  await manageServices(ali, { op: 'paid', id, note: 'chek 1' }, NOW + 1000);
  await adminServices(admin, { op: 'confirm', uk: keyOf(ali.id), id }, NOW + 2000);
  order = (await servicesView(ali, NOW)).orders!.find((o) => o.id === id)!;
  expect(order).toMatchObject({ status: 'done', payOk: NOW + 2000 });
  v = await examView(ali, NOW);
  expect(v.access).toBe(true);
  await expect(manageServices(ali, { op: 'buy', product: 'yakuniy-test' })).rejects.toThrow(
    'allaqachon',
  );
  // obunasiz — to'liq narx
  const b = (await manageServices(vali, { op: 'buy', product: 'yakuniy-test' }, NOW)) as {
    id: string;
  };
  expect((await servicesView(vali, NOW)).orders!.find((o) => o.id === b.id)).toMatchObject({
    budget: 10000,
  });
  expect(
    (await servicesView(vali, NOW)).orders!.find((o) => o.id === b.id)!.discount,
  ).toBeUndefined();
  // administrator narxni o'zgartiradi
  await adminServices(admin, {
    op: 'prices',
    products: { 'yakuniy-test': 12000, 'premium-oy': 6000 },
  });
  expect((await servicesView(null, NOW)).products).toMatchObject({
    'yakuniy-test': 12000,
    'premium-oy': 6000,
    'premium-yil': 45000,
  });
  // o'qituvchi va administratorga bo'lim doim ochiq
  expect((await examView(who('t1', 'teacher', 'O‘qituvchi'), NOW)).access).toBe(true);
});

it('Premium is sold the same way and is added on top of the current period', async () => {
  const { id } = (await manageServices(vali, { op: 'buy', product: 'premium-oy' }, NOW)) as {
    id: string;
  };
  const o = (await servicesView(vali, NOW)).orders!.find((x) => x.id === id)!;
  expect(o).toMatchObject({ budget: 5000, kind: 'premium-oy' });
  expect(o.discount).toBeUndefined(); // Premium'ning o'ziga chegirma yo'q
  await adminServices(admin, { op: 'confirm', uk: keyOf(vali.id), id }, NOW);
  const st = await premiumState(vali, NOW);
  expect(st.active).toBe(true);
  expect(st.until).toBe(NOW + 30 * 86400000);
  // obunachining oddiy buyurtmasi ham yarim narxda
  await adminServices(admin, { op: 'show', shown: true });
  await adminServices(admin, { op: 'launch', open: true });
  const r = (await manageServices(
    vali,
    {
      op: 'order',
      kind: 'taqdimot',
      title: 'Marketing',
      text: '10 slayd, o‘zbek tilida',
      budget: 80000,
    },
    NOW + 1000,
  )) as { id: string };
  expect((await servicesView(vali, NOW + 2000)).orders!.find((x) => x.id === r.id)).toMatchObject({
    budget: 80000,
    discount: 50,
  });
});

it('practice records mistakes; the final exam is graded at the end and a pass gives a verifiable certificate', async () => {
  for (let t = 1; t <= 3; t++)
    await examAdminAct(admin, { op: 'import', topic: 'm' + t, text: block(t, 5), replace: false });
  await examAdminAct(admin, { op: 'import', topic: 'm1', text: block(1, 1), replace: false });
  const { id } = (await manageServices(ali, { op: 'buy', product: 'yakuniy-test' }, NOW)) as {
    id: string;
  };
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
