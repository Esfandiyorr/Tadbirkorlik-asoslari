import { it, expect, beforeAll } from 'vitest';
import { SUPPORT_KEEP_MS, supportAct, supportList } from '../lib/server/support';
import type { SupportMessage } from '../lib/types';

/* «Adminga xabar» — Telegramdek suhbat: tarix, javob (iqtibos), o'qildi belgilari, 7 kunda avtomatik o'chish. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
const student = { id: 'legacy_ali.1', name: 'Ali Valiyev', role: 'student', classId: 'AP-223' };
const admin = { id: 'owner', name: 'Administrator', role: 'admin' };
const DAY = 86400000;
const mine = async (who = student, now?: number) =>
  (await supportList(who, false, undefined, now)).messages as SupportMessage[];

it('keeps the whole conversation in order, private to its owner', async () => {
  const t = 1_000_000;
  const { message } = await supportAct(student, 'send', { text: 'Ballim ko‘rinmayapti' }, t);
  expect(message).toMatchObject({ uid: 'legacy_ali_1', from: 'user', status: 'new', cat: 'other' });
  await supportAct(student, 'send', { text: 'Rahmat' }, t + 1000);
  const list = await mine(student, t + 2000);
  expect(list.map((m) => m.text)).toEqual(['Ballim ko‘rinmayapti', 'Rahmat']);
  expect(await mine({ ...student, id: 'legacy_bob' }, t + 2000)).toEqual([]);
  await expect(supportList(student, true)).rejects.toMatchObject({ status: 403 });
  await expect(supportList(student, true, 'legacy_ali_1')).rejects.toMatchObject({
    status: 403,
  });
});

it('the administrator sees threads, reads them and replies to a chosen message', async () => {
  const bob = { ...student, id: 'legacy_bob2', name: 'Bobur' };
  const t = 5_000_000;
  const first = (await supportAct(bob, 'send', { text: 'Parolni unutdim' }, t)).message!;
  await supportAct(bob, 'send', { text: 'Yordam bering', cat: 'account' }, t + 10);
  let inbox = (await supportList(admin, true, undefined, t + 20)).threads!;
  const th = inbox.find((x) => x.uid === 'legacy_bob2')!;
  expect(th).toMatchObject({ name: 'Bobur', group: 'AP-223', unread: 2, waiting: true });
  expect(th.last.text).toBe('Yordam bering');
  // o'qildi
  expect(await supportAct(admin, 'read', { uid: 'legacy_bob2' }, t + 30)).toMatchObject({
    read: 2,
  });
  expect((await mine(bob, t + 40)).every((m) => m.status === 'read')).toBe(true);
  // talaba administrator nomidan yoza olmaydi
  await expect(
    supportAct(bob, 'reply', { uid: 'legacy_bob2', text: 'O‘zim javob beraman' }, t + 50),
  ).rejects.toMatchObject({ status: 403 });
  // javob — aynan birinchi xabarga (iqtibos bilan)
  const { message: answer } = await supportAct(
    admin,
    'reply',
    { uid: 'legacy_bob2', text: 'Yangi parol yubordik.', re: first.id },
    t + 60,
  );
  expect(answer).toMatchObject({
    from: 'staff',
    name: 'Administrator',
    to: 'Bobur',
    re: { id: first.id, text: 'Parolni unutdim', name: 'Bobur' },
  });
  const list = await mine(bob, t + 70);
  expect(list.map((m) => m.from)).toEqual(['user', 'user', 'staff']);
  expect(list.filter((m) => m.from === 'user').every((m) => m.status === 'answered')).toBe(true);
  // talaba administrator xabariga javob qaytaradi
  const back = (await supportAct(bob, 'send', { text: 'Oldim, rahmat!', re: answer!.id }, t + 80))
    .message!;
  expect(back.re).toMatchObject({ id: answer!.id, name: 'Administrator' });
  // mavjud bo'lmagan xabarga javob — xato
  await expect(
    supportAct(bob, 'send', { text: 'Qaysi?', re: 'm-yoq' }, t + 90),
  ).rejects.toMatchObject({ status: 400 });
  inbox = (await supportList(admin, true, undefined, t + 100)).threads!;
  expect(inbox.find((x) => x.uid === 'legacy_bob2')).toMatchObject({ unread: 1, waiting: true });
  const one = (await supportList(admin, true, 'legacy_bob2', t + 100)).messages!;
  expect(one.map((m) => m.text)).toEqual([
    'Parolni unutdim',
    'Yordam bering',
    'Yangi parol yubordik.',
    'Oldim, rahmat!',
  ]);
});

it('validates input and limits flooding', async () => {
  const cat = { ...student, id: 'legacy_cat' };
  await expect(supportAct(cat, 'send', { text: '' })).rejects.toThrow();
  await expect(supportAct(cat, 'send', { text: 'salom', cat: 'spam' })).rejects.toThrow();
  const t = 9_000_000;
  for (let i = 0; i < 20; i++) await supportAct(cat, 'send', { text: 'Savol ' + i }, t + i);
  await expect(supportAct(cat, 'send', { text: 'Yana bitta' }, t + 100)).rejects.toMatchObject({
    status: 429,
  });
  // 10 daqiqadan keyin yana yozish mumkin
  await supportAct(cat, 'send', { text: 'Yana bitta' }, t + 600001);
});

it('messages disappear after a week, and old embedded replies show as separate messages', async () => {
  const dan = { ...student, id: 'legacy_dan', name: 'Dilshod' };
  const t = 20 * DAY;
  await supportAct(dan, 'send', { text: 'Eski savol' }, t);
  await supportAct(dan, 'send', { text: 'Yangi savol' }, t + 5 * DAY);
  // 8 kundan keyin birinchisi o'chgan, ikkinchisi turibdi
  expect((await mine(dan, t + 8 * DAY)).map((m) => m.text)).toEqual(['Yangi savol']);
  // bazadan ham o'chirilgan: vaqt orqaga qaytsa ham chiqmaydi
  expect((await mine(dan, t + 6 * DAY)).map((m) => m.text)).toEqual(['Yangi savol']);
  expect((await mine(dan, t + 5 * DAY + SUPPORT_KEEP_MS + 1)).length).toBe(0);

  // eski ko'rinishdagi yozuv: javob xabar ichida — suhbatda alohida administrator xabari
  const legacy: SupportMessage = {
    id: 'mold1',
    uid: 'legacy_eva',
    name: 'Eva',
    role: 'student',
    group: 'AP-224',
    cat: 'grade',
    text: 'Bahoim qayerda?',
    at: t,
    status: 'answered',
    reply: { text: 'Ertaga qo‘yiladi.', at: t + 1000, by: 'Ustoz' },
  };
  (globalThis as unknown as { __sqSupport: Map<string, unknown> }).__sqSupport.set('legacy_eva', {
    mold1: legacy,
  });
  const eva = await mine({ ...student, id: 'legacy_eva', name: 'Eva' }, t + 2000);
  expect(eva.map((m) => [m.from, m.text])).toEqual([
    ['user', 'Bahoim qayerda?'],
    ['staff', 'Ertaga qo‘yiladi.'],
  ]);
  expect(eva[1]).toMatchObject({ name: 'Ustoz', re: { id: 'mold1' } });
});
