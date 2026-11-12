import { test, expect, type Page } from '@playwright/test';

/* 🛠 Sayt boshqaruvi (administrator): kartochkalar va ⚡ Jonli test bo'limi — savollar banki, kunlik jadval,
   qo'lda o'yin tuzish; talaba o'yinni yon menyudagi e'lonlar oynasida ko'radi. */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
/** Toshkent vaqti (UTC+5) bo'yicha sana va soat. */
const tashkent = (ms: number) => {
  const iso = new Date(ms + 18000000).toISOString();
  return { d: iso.slice(0, 10), t: iso.slice(11, 16) };
};
const live = (page: Page, input: unknown) =>
  page.request.post('/api/platform', { data: { action: 'liveAdmin', input } });

test.afterEach(async ({ page }) => {
  // Demo xotirasini tozalash — keyingi sinovlarda jonli test oynasi chiqmasin.
  await as(page, 'demo-admin');
  await live(page, { op: 'settings', on: false, time: '20:00', nq: 10, qsec: 15, off: [] });
  const v = await (await page.request.get('/api/platform?view=liveAdmin')).json();
  for (const g of v.games || []) await live(page, { op: 'cancel', d: g.d });
  if (v.bank?.length)
    await live(page, { op: 'delete', ids: v.bank.map((x: { id: string }) => x.id) });
  // Matn, rasm va mavzu testi o'zgarishlari ham tozalanadi.
  const site = (input: unknown, action = 'siteText') =>
    page.request.post('/api/platform', { data: { action, input } });
  const c = await (await page.request.get('/api/platform?view=siteContent')).json();
  for (const t of c.texts || []) await site({ op: 'remove', o: t.o });
  for (const i of c.images || []) await site({ op: 'removeImage', o: i.o });
  await site({ op: 'reset', t: 'm1' }, 'topicQuiz');
  const lib =
    (await (await page.request.get('/api/platform?view=avatarAdmin')).json()).catalog || [];
  for (const a of lib as { id: string; custom?: boolean; off?: boolean }[])
    if (a.custom) await site({ op: 'delete', id: a.id }, 'avatarLibrary');
    else if (a.off) await site({ op: 'hide', id: a.id, off: false }, 'avatarLibrary');
});

test('the site manager opens with clear cards and leads to every admin task', async ({ page }) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  const hub = page.locator('.bo-hub');
  await expect(hub.getByRole('heading', { name: /Sayt boshqaruvi/ })).toBeVisible();
  for (const name of [
    'Jonli test',
    'Avatarlar',
    'E’lonlar',
    'Mavzular holati',
    'Talabalar va baholar',
  ])
    await expect(hub.locator('.bo-card-btn').filter({ hasText: name })).toBeVisible();
  // Kartochka ichki bo'limni ochadi, «← Sayt boshqaruvi» qaytaradi.
  await hub.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  await expect(page.locator('.news-manage')).toBeVisible();
  await page.getByRole('button', { name: 'Sayt boshqaruvi', exact: true }).click();
  // Boshqa tabga olib boradigan kartochka.
  await page.locator('.bo-card-btn').filter({ hasText: 'Mavzular holati' }).click();
  await expect(page.getByRole('button', { name: 'Mavzular holati', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the administrator fills the question bank, schedules daily games and creates a game', async ({
  page,
}) => {
  // E'lonlar oynasi javobi brauzerda 20 soniya keshlanadi — sinovda har safar yangisi olinsin.
  await page.route('**/api/platform?view=news', (route) => route.continue());
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Jonli test' }).click();
  await expect(page.locator('.bo-status')).toContainText('O‘chiq');

  // 📚 Ko'p savolni birdan qo'shish.
  await page.getByRole('tab', { name: /Savollar banki/ }).click();
  await page.getByRole('button', { name: /Ko‘p savol qo‘shish/ }).click();
  const words = ['narx', 'talab', 'taklif', 'raqobat', 'foyda', 'kapital'];
  await page
    .getByLabel('Savollar matni')
    .fill(
      words
        .map(
          (w, i) =>
            `${i + 1}) Bozor iqtisodiyotida ${w} nimani anglatadi?\nTo‘g‘ri javob ${w} *\nNoto‘g‘ri javob A\nNoto‘g‘ri javob B\nNoto‘g‘ri javob C`,
        )
        .join('\n\n') + '\n\nTushunarsiz blok\nfaqat bitta qator',
    );
  await expect(page.locator('.bo-form [role="status"]')).toContainText('Tayyor: 6');
  await expect(page.locator('.bo-form [role="status"]')).toContainText('tushunilmadi: 1');
  await page.getByRole('button', { name: /Bankka qo‘shish/ }).click();
  const list = page.locator('.bo-qlist li');
  await expect(list).toHaveCount(6);
  await expect(page.getByRole('tab', { name: /Savollar banki \(6\)/ })).toBeVisible();
  // ✏️ Bitta savolni tahrirlash.
  await list.filter({ hasText: 'narx' }).getByRole('button', { name: 'Tahrirlash' }).click();
  await page
    .getByRole('textbox', { name: 'Savol', exact: true })
    .fill('Bozor iqtisodiyotida narx nimani bildiradi?');
  await page.getByRole('button', { name: 'Saqlash', exact: true }).click();
  await expect(page.locator('.bo-qlist')).toContainText('narx nimani bildiradi?');
  await expect(list).toHaveCount(6);

  // 📅 Kunlik avtomatik o'yin (vaqti hozirdan uzoq — sinov paytida jonli test oynasi chiqmaydi).
  await page.getByRole('tab', { name: /Jadval va sozlama/ }).click();
  const later = tashkent(Date.now() + 6 * 3600000);
  await page.getByLabel(/Har kuni o‘zi tuzilsin/).check();
  await page.getByLabel('Vaqti', { exact: true }).fill(later.t);
  await page.getByLabel('Savollar soni').selectOption('5');
  await page.getByRole('button', { name: 'Saqlash', exact: true }).click();
  await expect(page.locator('.bo-status')).toContainText('Yoqilgan');
  await expect(page.locator('.bo-status')).toContainText(`soat ${later.t} da, 5 ta savol`);
  await expect(page.locator('.bo-list li').first()).toContainText('Avtomatik o‘yin');

  // 🎯 O'yin tuzish: kun, vaqt, eslatma va savollar.
  await page.getByRole('tab', { name: /O‘yin tuzish/ }).click();
  const own = tashkent(Date.now() + 45 * 60000);
  await page.getByLabel('Sana').fill(own.d);
  await page.getByLabel('Vaqti', { exact: true }).fill(own.t);
  await page.getByLabel(/Talabalarga eslatma/).fill('Iqtisod bo‘yicha');
  await page.getByRole('button', { name: /Tasodifiy 15 ta/ }).click();
  await expect(page.locator('.bo-qlist em')).toHaveCount(6);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /O‘yinni tuzish/ }).click();
  const first = page.locator('.bo-list li').first();
  await expect(first).toContainText('Siz tuzgan o‘yin');
  await expect(first).toContainText(own.t);
  await expect(first).toContainText('Iqtisod bo‘yicha');

  // ⏰ Vaqtini o'zgartirish: shu kunning o'zida boshqa soatga (savollar va eslatma saqlanadi).
  const moved = tashkent(Date.now() + 55 * 60000);
  if (moved.d === own.d) {
    await first.getByRole('button', { name: /Vaqtini o‘zgartirish/ }).click();
    await first.getByLabel('Yangi vaqt').fill(moved.t);
    await first.getByRole('button', { name: 'Ko‘chirish' }).click();
    await expect(page.locator('.bo-list li').first()).toContainText(moved.t);
    await expect(page.locator('.bo-list li').first()).toContainText('Iqtisod bo‘yicha');
    own.t = moved.t;
  }

  // Talaba keyingi o'yinni yon menyudagi e'lonlar oynasida ko'radi (20 daqiqadan uzoq — katta oyna yo'q).
  // (Faqat xesh o'zgargani uchun goto sahifani qayta yuklamaydi — reload kerak.)
  await as(page, 'demo-student');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const slide = page.locator('.sidebar-news .news-live');
  await expect(slide).toContainText('JONLI TEST');
  await expect(slide).toContainText(own.t);
  await expect(page.locator('.kh-pop')).toHaveCount(0);

  // ⛔ To'xtatish.
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.bo-status')).toBeVisible(); // bo'lim eslab qolingan
  page.once('dialog', (d) => d.accept());
  await page.locator('.bo-list li').first().getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(page.locator('.bo-list')).not.toContainText('Siz tuzgan o‘yin');
});

test('the administrator edits a topic test and the presentation uses the new questions', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Mavzu testlari' }).click();
  const topics = page.locator('.bo-topic');
  await expect(topics.filter({ hasText: 'krossvord' })).toHaveCount(2); // 4 va 5-mavzu
  await topics.filter({ hasText: 'M1 ·' }).click();
  const first = page.locator('.bo-question').first();
  await expect(page.locator('.bo-question')).toHaveCount(15);
  await first
    .getByRole('textbox', { name: '1-savol matni' })
    .fill('Tadbirkorlikning to‘rtta ustuni qaysi qatorda to‘g‘ri berilgan? (yangilangan)');
  await first
    .getByRole('textbox', { name: '1-savol, 2-javob' })
    .fill('Tashabbus, xavf, qiymat va daromad');
  await first.getByRole('radio', { name: '2-javob to‘g‘ri' }).check();
  await expect(page.locator('.bo-warn')).toContainText('Saqlanmagan');
  await page.getByRole('button', { name: 'Saqlash', exact: true }).first().click();
  await expect(page.locator('.bo-warn')).toHaveCount(0);
  await expect(topics.filter({ hasText: 'M1 ·' })).toContainText('o‘zgartirilgan');

  // Talaba: taqdimotdagi test yangi savollar bilan boshlanadi (inglizcha nusxa o'chadi).
  await as(page, 'demo-student');
  await page.route('**/legacy/demo-guard.js', async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace(
        'var memory = new Map();',
        'var memory = new Map(); memory.set("terdu_acc",JSON.stringify(Object.fromEntries(Array.from({length:15},(_,i)=>["m"+(i+1),{lim:false,at:Date.now()}]))));',
      )
      .replace("learnerType: 'independent'", "learnerType: 'university'")
      .replace("status: 'pending'", "status: 'ok'")
      .replace('t.read = true', 't.read = false');
    await route.fulfill({ response, body });
  });
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.native-document > .inner')).toBeVisible();
  let counter = (await page.locator('.reader-counter').innerText()).match(/(\d+)\s*\/\s*(\d+)/)!;
  while (Number(counter[1]) < Number(counter[2])) {
    const next = Number(counter[1]) + 1;
    await page.locator('.reader-controls').getByRole('button', { name: 'Keyingi' }).click();
    await expect(page.locator('.reader-counter')).toContainText(next + ' / ' + counter[2]);
    counter = (await page.locator('.reader-counter').innerText()).match(/(\d+)\s*\/\s*(\d+)/)!;
  }
  await page.locator('.native-document #qtGo').click();
  await page
    .locator('.native-dialog')
    .getByRole('button', { name: 'Davom etish', exact: true })
    .click();
  await expect(page.locator('.native-document .qbox')).toHaveCount(15);
  const mine = page.locator('.native-document .qbox').filter({ hasText: '(yangilangan)' });
  await expect(mine).toHaveCount(1);
  await mine
    .locator('button.opt')
    .filter({ hasText: 'Tashabbus, xavf, qiymat va daromad' })
    .click();
  await expect(mine.locator('.fb')).toContainText('To‘g‘ri');
  await page.unroute('**/legacy/demo-guard.js');

  // Asl holiga qaytarish.
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.bo-topic').filter({ hasText: 'M1 ·' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Asl holiga qaytarish/ }).click();
  await expect(page.locator('.bo-topic').filter({ hasText: 'M1 ·' })).toContainText('asl holida');
  await expect(
    page.locator('.bo-question').first().getByRole('textbox', { name: '1-savol matni' }),
  ).not.toHaveValue(/yangilangan/);
});

test('in edit mode the administrator clicks any text or picture and everyone sees the change', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.route('**/api/site/content', (route) => route.continue()); // brauzer keshisiz
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page
    .locator('.bo-cards li')
    .filter({ hasText: 'Matnlar va rasmlar' })
    .getByRole('button', { name: /Tahrirlashni boshlash/ })
    .click();
  const bar = page.locator('.se-bar');
  await expect(bar).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe('#home');
  // Havola bosilganda sahifa almashmaydi — tahrirlash oynasi ochiladi.
  const ranking = page.locator('.sidebar a[href="#library"]');
  await ranking.click();
  const dialog = page.getByRole('dialog', { name: /Matnni o‘zgartirish/ });
  await expect(dialog.locator('.se-original')).toHaveText('Kutubxona');
  await dialog.getByLabel('Yangi matn').fill('Kitoblar javoni');
  await dialog.getByRole('button', { name: 'Saqlash' }).click();
  await expect(dialog).toBeHidden();
  await expect(ranking).toHaveText('Kitoblar javoni');
  expect(new URL(page.url()).hash).toBe('#home');
  // Sonni o'zgartirib bo'lmaydi.
  // «Sahifalar bo'ylab yurish» — oddiy bosish qaytadi.
  await bar.getByRole('button', { name: /Sahifalar bo‘ylab yurish/ }).click();
  await page.locator('.sidebar a[href="#badges"]').click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#badges');
  await bar.getByRole('button', { name: /Tahrirlashga qaytish/ }).click();
  // 🖼 Logotip.
  const logo = page.locator('.sidebar img').first();
  await logo.click();
  const pic = page.getByRole('dialog', { name: /Rasmni almashtirish/ });
  await pic.locator('input[type="file"]').setInputFiles('public/icon-192.png');
  await expect(pic.getByText('Yangi rasm', { exact: true })).toBeVisible();
  await pic.getByRole('button', { name: 'Saqlash' }).click();
  await expect(pic).toBeHidden();
  await expect(logo).toHaveAttribute('src', /^\/api\/site\/img\/i[0-9a-f]{16}\?v=/);
  const logoSrc = (await logo.getAttribute('src'))!;
  expect((await page.request.get(logoSrc)).headers()['content-type']).toBe('image/png');
  // Taqdimot ichidagi yozuv ham shu yo'l bilan o'zgaradi.
  await bar.getByRole('button', { name: /Sahifalar bo‘ylab yurish/ }).click();
  await page.goto('/#lesson/m1', { waitUntil: 'domcontentloaded' });
  const title = page
    .locator('.native-document')
    .getByText('TADBIRKORLIK TAFAKKURI VA BIZNES IMKONIYATLARNI ANIQLASH', { exact: true });
  await expect(title).toBeVisible();
  await bar.getByRole('button', { name: /Tahrirlashga qaytish/ }).click();
  await title.click();
  await dialog.getByLabel('Yangi matn').fill('TADBIRKORLIK TAFAKKURI VA IMKONIYATLAR');
  await dialog.getByRole('button', { name: 'Saqlash' }).click();
  const renamed = page
    .locator('.native-document')
    .getByText('TADBIRKORLIK TAFAKKURI VA IMKONIYATLAR', { exact: true });
  await expect(renamed).toBeVisible();
  await bar.getByRole('button', { name: 'Tayyor' }).click();
  // Slayd asl taqdimotdan qayta chizilganda ham yangi matn qoladi.
  await page.locator('.reader-controls').getByRole('button', { name: 'Keyingi' }).click();
  await expect(page.locator('.reader-counter')).toHaveText('2 / 18');
  await page.locator('.reader-controls').getByRole('button', { name: 'Oldingi' }).click();
  await expect(renamed).toBeVisible();
  await expect(bar).toBeHidden();

  // Talaba: yangi matn va rasm, tahrirlash paneli yo'q.
  await as(page, 'demo-student');
  await page.evaluate(() => sessionStorage.setItem('sq-edit', '1'));
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar a[href="#library"]')).toHaveText('Kitoblar javoni');
  await expect(page.locator('.sidebar img').first()).toHaveAttribute('src', logoSrc);
  await expect(page.locator('.se-bar')).toHaveCount(0);

  // Administrator ro'yxatdan asl holiga qaytaradi.
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Matnlar va rasmlar' }).click();
  const texts = page.locator('.bo-texts li');
  await expect(texts).toHaveCount(2);
  await expect(page.locator('.bo-images li')).toHaveCount(1);
  for (let i = 2; i > 0; i--) {
    await texts
      .first()
      .getByRole('button', { name: /Asl holiga/ })
      .click();
    await expect(texts).toHaveCount(i - 1);
  }
  await page
    .locator('.bo-images li')
    .getByRole('button', { name: /Asl holiga/ })
    .click();
  await expect(page.locator('.bo-images li')).toHaveCount(0);
  await expect(page.locator('.sidebar a[href="#library"]')).toHaveText('Kutubxona');
  await expect(page.locator('.sidebar img').first()).toHaveAttribute('src', '/terdu-logo.png');
});

test('the administrator adds a new avatar and hides another; top students see the library change', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await page.request.post('/api/platform', {
    data: { action: 'avatarPick', input: { avatar: null } },
  });
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'Avatarlar' }).click();
  const grid = page.locator('.bo-avatar-grid li');
  await expect(grid).toHaveCount(10);
  // Oq fonli rasm: fon avtomatik olib tashlanadi (asl avatarlardek shaffof), qahramon chetigacha kesiladi.
  const cornerAlpha = (src: string) =>
    page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext('2d')!;
      x.drawImage(img, 0, 0);
      return { a: x.getImageData(0, 0, 1, 1).data[3], w: c.width, h: c.height };
    }, src);
  await page.getByLabel('Avatar rasmi').setInputFiles('public/icon-192.png');
  await expect(page.locator('.bo-avatar-new')).toContainText('Fon olib tashlandi');
  await page.locator('.bo-avatar-new').getByLabel('Nomi (o‘zbekcha)').fill('Termiz Burguti');
  await page.getByLabel(/Qaysi multfilm/).fill('TerDU');
  await page.getByRole('button', { name: /Kutubxonaga qo‘shish/ }).click();
  await expect(grid).toHaveCount(11);
  await expect(grid.last()).toContainText('Termiz Burguti');
  await expect(grid.last()).toContainText('siz qo‘shgan');
  const src = () => grid.last().locator('img').getAttribute('src') as Promise<string>;
  expect((await cornerAlpha(await src())).a).toBe(0);
  // Sozlama o'chiq bo'lsa — rasm foni bilan yuklanadi; «🪄 Fonni tozalash» uni keyin tozalaydi.
  await page.getByRole('checkbox', { name: /fonni avtomatik olib tashlash/ }).uncheck();
  const before = await src();
  await page
    .getByLabel('Rasmini almashtirish: Termiz Burguti')
    .setInputFiles('public/icon-192.png');
  await expect.poll(src).not.toBe(before);
  expect(await cornerAlpha(await src())).toEqual({ a: 255, w: 192, h: 192 });
  const white = await src();
  await page.getByRole('button', { name: 'Fonni tozalash: Termiz Burguti' }).click();
  await expect.poll(src).not.toBe(white);
  expect((await cornerAlpha(await src())).a).toBe(0);
  await page.getByRole('checkbox', { name: /fonni avtomatik olib tashlash/ }).check();
  await page.getByRole('button', { name: 'Yashirish: Sonik' }).click();
  await expect(grid.first()).toContainText('yashirilgan');
  // Pastdagi «kimda qaysi avatar» ro'yxati ham yangilanadi.
  await expect(page.locator('.avatar-admin-grid li')).toHaveCount(10);
  await expect(page.locator('.avatar-admin-grid')).toContainText('Termiz Burguti');

  // Top-10 talaba: kutubxonada yangi avatar bor, yashirilgani yo'q.
  await as(page, 'demo-student');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.hero-avatar').click();
  const dialog = page.getByRole('dialog', { name: /Avatarlar kutubxonasi/ });
  await expect(dialog.locator('.av-card')).toHaveCount(10);
  await expect(dialog).not.toContainText('Sonik');
  await dialog.getByRole('button', { name: /Termiz Burguti — tanlash/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.hero-avatar img')).toHaveAttribute('src', /^\/api\/site\/img\/av-c/);
  await page.request.post('/api/platform', {
    data: { action: 'avatarPick', input: { avatar: null } },
  });
});
