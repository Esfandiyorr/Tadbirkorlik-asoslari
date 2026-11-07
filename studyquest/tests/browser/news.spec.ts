import { test, expect, type Page } from '@playwright/test';

/* 📢 E'lonlar oynasi (yon menyu, har 10 soniyada almashadi; uzun e'lon bosilsa — to'liq matn) va ⚡ jonli test oynasi (boshlanishidan 20 daqiqa oldin). */
async function as(page: Page, id: string) {
  await page.request.post('/api/auth/demo', { data: { id } });
}
/** Jonli test jadvalini soxtalashtirish: asl bazadagi kahoot/idx o'rniga. */
async function withLive(page: Page, inMinutes: number, type: 'quiz' | 'yz' = 'quiz') {
  const now = Date.now();
  await page.route('**/api/platform?view=news', async (route) => {
    const response = await route.fetch(),
      body = await response.json();
    body.live = {
      d: 'demo-game',
      open: now + (inMinutes - 15) * 60000,
      start: now + inMinutes * 60000,
      end: now + (inMinutes + 15) * 60000,
      type,
      nq: 12,
      qsec: 15,
    };
    await route.fulfill({ response, json: body });
  });
}

test('the administrator posts announcements and the side box rotates them every ten seconds', async ({
  page,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  // Boshqaruv → 🛠 Sayt boshqaruvi → «📢 E'lonlar» kartochkasi.
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  const panel = page.locator('.news-manage');
  for (const [h, t] of [
    ['Amaliy mashg‘ulot', 'Seshanba kuni 3-mavzu bo‘yicha amaliy mashg‘ulot bo‘ladi.'],
    ['', 'Reytingda 1–10-o‘ringa chiqing va avatar tanlang'],
  ]) {
    if (h) await panel.getByLabel('Sarlavha').fill(h);
    await panel.getByLabel('E’lon matni').fill(t);
    await panel.getByRole('button', { name: /E’lon joylash/ }).click();
    await expect(panel.locator('.news-admin-list')).toContainText(t);
  }
  const box = page.locator('.sidebar-news');
  await expect(box.locator('.news-dots button')).toHaveCount(2);
  const text = () => box.locator('.news-slide').textContent();
  const first = await text();
  // 10 soniyadan keyin keyingi e'lon (undan oldin almashmaydi).
  await page.waitForTimeout(6000);
  expect(await text()).toBe(first);
  await expect.poll(text, { timeout: 8000 }).not.toBe(first);
  await expect(box.getByRole('button', { name: 'E’lon qo‘shish' })).toBeVisible();
  // To'xtatish tugmasi almashishni to'xtatadi.
  await box.getByRole('button', { name: 'To‘xtatish' }).click();
  await page.mouse.move(800, 800);
  const held = await text();
  await page.waitForTimeout(11000);
  expect(await text()).toBe(held);
  // Tozalash: e'lonlarni o'chirish.
  for (let i = 0; i < 2; i++) {
    await panel
      .getByRole('button', { name: /O‘chirish/ })
      .first()
      .click();
    await expect(panel.locator('.news-admin-list li:not(.muted)')).toHaveCount(1 - i);
  }
});

test('a long announcement is shortened in the box and opens in full when the student clicks it', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  const panel = page.locator('.news-manage');
  const long =
    'Hurmatli talabalar! ' +
    'Seshanba kuni soat 14:00 da 7-mavzu bo‘yicha amaliy mashg‘ulot bo‘ladi. '.repeat(6) +
    '\nOxirgi qator: biznes-model kanvasini olib keling.';
  await panel.getByLabel('Sarlavha').fill('Muhim e’lon');
  await panel.getByLabel('E’lon matni').fill(long);
  // bu e'lon faqat oynada (katta oynasiz)
  await panel.getByRole('checkbox', { name: /katta oynada ko‘rsatish/ }).uncheck();
  await panel.getByRole('button', { name: /E’lon joylash/ }).click();
  await expect(panel.locator('.news-admin-list')).toContainText('Oxirgi qator');

  const s = await (
    await browser.newContext({ baseURL: test.info().project.use.baseURL })
  ).newPage();
  await as(s, 'demo-student');
  await s.goto('/#home', { waitUntil: 'domcontentloaded' });
  const box = s.locator('.sidebar-news');
  // Oynada matn qisqartirilgan — «To'liq o'qish» belgisi chiqadi.
  await expect(box.locator('.news-more')).toHaveText(/To‘liq o‘qish/);
  const open = box.getByRole('button', { name: /Muhim e’lon/ });
  await open.click();
  const dialog = s.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Muhim e’lon' })).toBeVisible();
  await expect(dialog).toContainText('Oxirgi qator: biznes-model kanvasini olib keling.');
  await expect(dialog).toContainText('Joylangan:');
  await s.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  // Tashqariga bosilsa ham yopiladi.
  await open.click();
  await s.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  await s.context().close();

  await panel
    .getByRole('button', { name: /O‘chirish/ })
    .first()
    .click();
  await expect(panel.locator('.news-admin-list li:not(.muted)')).toHaveCount(0);
});

test('a new announcement opens big for everyone until they press “Read”', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  const panel = page.locator('.news-manage');
  await expect(panel.getByRole('checkbox', { name: /katta oynada ko‘rsatish/ })).toBeChecked();
  await panel.getByLabel('Sarlavha').fill('Dars ko‘chirildi');
  await panel
    .getByLabel('E’lon matni')
    .fill('Seshanba kungi dars chorshanba 10:00 ga ko‘chirildi.');
  await panel.getByRole('button', { name: /E’lon joylash/ }).click();
  await expect(panel.locator('.news-admin-list')).toContainText('📣');
  // e'lonni yozgan administratorga katta oyna chiqmaydi
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar-news')).toContainText('Dars ko‘chirildi');
  await expect(page.locator('.news-pop')).toHaveCount(0);

  const open = async (id: string) => {
    const p = await (
      await browser.newContext({ baseURL: test.info().project.use.baseURL })
    ).newPage();
    await as(p, id);
    await p.goto('/#home', { waitUntil: 'domcontentloaded' });
    return p;
  };
  const student = await open('demo-student');
  const pop = student.getByRole('dialog', { name: 'Dars ko‘chirildi' });
  await expect(pop).toBeVisible();
  await expect(pop).toContainText('YANGI E’LON');
  await expect(pop).toContainText('chorshanba 10:00');
  await expect(pop.getByRole('button', { name: /O‘qildi/ })).toBeFocused();
  // «×» — keyinroq: hozir yopiladi, keyingi kirishda yana chiqadi
  await pop.getByRole('button', { name: 'Keyinroq o‘qiyman' }).click();
  await expect(pop).toHaveCount(0);
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(pop).toBeVisible();
  // «O'qildi» — boshqa chiqmaydi, e'lon oynada qoladi (boshqa qurilmada ham)
  await pop.getByRole('button', { name: /O‘qildi/ }).click();
  await expect(pop).toHaveCount(0);
  await expect(student.locator('.sidebar-news')).toContainText('Dars ko‘chirildi');
  await student.reload({ waitUntil: 'domcontentloaded' });
  await expect(student.locator('.sidebar-news')).toContainText('Dars ko‘chirildi');
  await expect(student.locator('.news-pop')).toHaveCount(0);
  await student.context().close();
  const again = await open('demo-student');
  await expect(again.locator('.sidebar-news')).toContainText('Dars ko‘chirildi');
  await expect(again.locator('.news-pop')).toHaveCount(0);
  await again.context().close();
  // boshqa foydalanuvchiga hali chiqadi
  const teacher = await open('demo-teacher');
  await expect(teacher.getByRole('dialog', { name: 'Dars ko‘chirildi' })).toBeVisible();
  await teacher.context().close();

  // Tozalash: «Sayt boshqaruvi» oxirgi ochilgan bo'limni eslab qoladi — e'lonlar bo'limi darhol ochiladi.
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  await expect(panel).toBeVisible();
  await panel
    .getByRole('button', { name: /O‘chirish/ })
    .first()
    .click();
  await expect(panel.locator('.news-admin-list li:not(.muted)')).toHaveCount(0);
});

test('students see a small live quiz card twenty minutes before the start and may close it', async ({
  page,
}) => {
  await as(page, 'demo-student');
  await withLive(page, 10);
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const card = page.getByRole('dialog', { name: 'Jonli test bor!' });
  await expect(card).toContainText('Lobbi ochiq');
  await expect(card).toContainText('12 ta savol');
  await expect(card.locator('.kh-pop-meta b')).toHaveText(/⏱ (09|10):\d\d/);
  // Kichik kartochka: ekranni to'sib qo'ymaydi, sahifa ishlatiladi.
  const box = (await card.boundingBox())!;
  expect(box.width).toBeLessThan(400);
  await expect(page.locator('.hero-avatar')).toBeVisible();
  await card.getByRole('button', { name: /O‘yinga kirish/ }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/play/live');
  await expect(card).toBeHidden();
  await page.goto('/#ranking', { waitUntil: 'domcontentloaded' });
  await expect(card).toBeVisible();
  // Talaba qatnashmasligi mumkin: yopilgani qayta yuklanganda ham saqlanadi.
  await card.getByRole('button', { name: 'Qatnashmayman' }).click();
  await expect(card).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar-news .news-live')).toContainText('Lobbi ochiq');
  await expect(card).toBeHidden();
  // Fikrini o'zgartirsa — yon menyudagi e'lonlar oynasidan kiradi.
  await page
    .locator('.sidebar-news')
    .getByRole('link', { name: /O‘yinga kirish/ })
    .click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#arena/play/live');
});

test('teachers close the card too, and a later game only shows its time', async ({ page }) => {
  await as(page, 'demo-teacher');
  await withLive(page, 15, 'yz');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const card = page.getByRole('dialog', { name: 'Yozuv marafoni bor!' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Yopish' }).click();
  await expect(card).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sidebar-news .news-live')).toBeVisible();
  await expect(card).toBeHidden();

  const later = await page.context().newPage();
  await as(later, 'demo-student');
  await withLive(later, 120);
  await later.goto('/#home', { waitUntil: 'domcontentloaded' });
  const slide = later.locator('.sidebar-news .news-live');
  await expect(slide).toContainText('JONLI TEST');
  await expect(slide).toContainText(/bugun|ertaga/);
  await expect(slide).toContainText('boshlanishiga');
  await expect(later.locator('.kh-pop')).toHaveCount(0);
});

test('the administrator fills the second box with offers and students see them under the menu', async ({
  page,
  browser,
}) => {
  const student = async () => {
    const p = await (
      await browser.newContext({ baseURL: test.info().project.use.baseURL })
    ).newPage();
    await as(p, 'demo-student');
    await p.goto('/#home', { waitUntil: 'domcontentloaded' });
    await expect(p.locator('.sidebar-news')).toBeVisible();
    return p;
  };
  // Bo'sh 2-e'lon oynasini talaba ko'rmaydi; «Joriy mavzu» bloki endi yon menyuda yo'q.
  const s1 = await student();
  await expect(s1.locator('.sidebar-promo')).toHaveCount(0);
  await expect(s1.locator('.sidebar-current')).toHaveCount(0);
  await s1.context().close();

  // Administrator bo'sh oynada izohni va «+» tugmasini ko'radi — u «Sayt boshqaruvi → 2-e'lon oynasi»ni ochadi.
  await as(page, 'demo-admin');
  await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  const side = page.locator('.sidebar-promo');
  await expect(side).toContainText('2-E’LON OYNASI');
  await side.getByRole('button', { name: 'Reklama qo‘shish' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#admin');
  const panel = page.locator('.promo-manage');
  await expect(panel).toBeVisible();
  await panel.getByRole('radio', { name: /Grant dasturi/ }).click();
  await panel.getByLabel('Sarlavha').fill('Yoshlar grant dasturi');
  await panel
    .getByLabel('Matn', { exact: true })
    .fill('Startaplar uchun 50 mln so‘mgacha grant. Ariza 1-dekabrgacha.');
  await panel.getByLabel('Havola').fill('https://example.uz/grant');
  await panel.getByLabel('Tugma yozuvi').fill('Ariza topshirish');
  await panel.getByLabel('Rasm', { exact: true }).setInputFiles('public/terdu-logo.png');
  // Ko'rinishi: joylashdan oldin qanday chiqishi.
  const preview = panel.locator('.promo-preview');
  await expect(preview).toContainText('Yoshlar grant dasturi');
  await expect(preview.locator('img.promo-img')).toBeVisible();
  await panel.getByRole('button', { name: /E’lonni joylash/ }).click();
  await expect(panel.locator('.promo-admin-list')).toContainText('Yoshlar grant dasturi');
  await expect(panel.locator('.promo-admin-list img')).toHaveAttribute(
    'src',
    /^\/api\/site\/img\/pr-/,
  );
  await panel.getByRole('radio', { name: /Kurs/ }).click();
  await panel.getByLabel('Sarlavha').fill('Excel bo‘yicha bepul kurs');
  await panel.getByLabel('Havola').fill('#courses');
  await panel.getByRole('button', { name: /E’lonni joylash/ }).click();
  await expect(panel.locator('.promo-admin-list li')).toHaveCount(2);
  await expect(side.locator('.promo-dots button')).toHaveCount(2);

  // Talaba ikkala taklifni yon menyuda ko'radi (har 10 soniyada almashadi), «+» tugmasi yo'q.
  const s2 = await student();
  const box = s2.locator('.sidebar-promo');
  await expect(box.locator('.promo-dots button')).toHaveCount(2);
  await expect(box.getByRole('button', { name: 'Reklama qo‘shish' })).toHaveCount(0);
  await box.locator('.promo-dots button').nth(1).click();
  await expect(box.locator('.promo-kind')).toContainText('Grant dasturi');
  await expect(box.locator('.promo-kind')).toContainText('YANGI');
  const cta = box.getByRole('link', { name: /Ariza topshirish/ });
  await expect(cta).toHaveAttribute('href', 'https://example.uz/grant');
  await expect(cta).toHaveAttribute('target', '_blank');
  const img = box.locator('img.promo-img');
  await expect(img).toHaveAttribute('src', /^\/api\/site\/img\/pr-[a-z0-9-]+\?v=/);
  expect(
    (await s2.request.get((await img.getAttribute('src'))!)).headers()['content-type'],
  ).toMatch(/^image\//);
  // E'lon bosilsa — to'liq matni rasm va tugma bilan alohida oynada ochiladi.
  await box.getByRole('button', { name: /Yoshlar grant dasturi/ }).click();
  const dialog = s2.getByRole('dialog');
  await expect(dialog).toContainText(
    'Startaplar uchun 50 mln so‘mgacha grant. Ariza 1-dekabrgacha.',
  );
  await expect(dialog.locator('img.news-reader-img')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Ariza topshirish/ })).toHaveAttribute(
    'href',
    'https://example.uz/grant',
  );
  await dialog.getByRole('button', { name: 'Yopish' }).click();
  await expect(dialog).toHaveCount(0);
  await box.locator('.promo-dots button').nth(0).click();
  await expect(box).toContainText('Excel bo‘yicha bepul kurs');
  await expect(box.getByRole('link', { name: /Batafsil/ })).toHaveAttribute('href', '#courses');
  await s2.context().close();

  // Tozalash.
  for (let i = 0; i < 2; i++) {
    await panel
      .getByRole('button', { name: /O‘chirish/ })
      .first()
      .click();
    await expect(panel.locator('.promo-admin-list li:not(.muted)')).toHaveCount(1 - i);
  }
  await expect(side).toContainText('2-E’LON OYNASI');
});

test('on phones the home page starts with the current topic and shows both boxes as a small envelope beside it', async ({
  page,
  browser,
}) => {
  await as(page, 'demo-admin');
  await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  const panel = page.locator('.news-manage');
  if (!(await panel.isVisible()))
    await page.locator('.bo-card-btn').filter({ hasText: 'E’lonlar' }).click();
  await panel.getByLabel('Sarlavha').fill('1-ma’ruza topshirig‘i');
  await panel
    .getByLabel('E’lon matni')
    .fill('Topshiriqlar baholandi. Baho qo‘yilmagan bo‘lsa, dushanba 9:00 da 321-xonaga keling.');
  await panel.getByRole('checkbox', { name: /katta oynada ko‘rsatish/ }).uncheck();
  await panel.getByRole('button', { name: /E’lon joylash/ }).click();
  await expect(panel.locator('.news-admin-list')).toContainText('1-ma’ruza topshirig‘i');
  // 2-e'lon oynasi (taklif) ham xat tugmasiga qo'shiladi
  const promoId = await page.evaluate(async () => {
    const r = await fetch('/api/platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'promo',
        input: { op: 'add', kind: 'grant', h: 'Yoshlar grant dasturi', t: '50 mln so‘mgacha.' },
      }),
    });
    return (await r.json()).id as string;
  });

  const phone = await (
    await browser.newContext({
      baseURL: test.info().project.use.baseURL,
      viewport: { width: 390, height: 844 },
    })
  ).newPage();
  await as(phone, 'demo-student');
  await phone.goto('/#home', { waitUntil: 'domcontentloaded' });
  const hero = phone.locator('.continue-hero');
  await expect(hero).toBeVisible();
  // tepada — mavzu bloki; e'lon oynalari yo'q, ikkalasi — mavzu yonidagi ✉️ tugmada
  await expect(phone.locator('.home-news')).toHaveCount(0);
  await expect(phone.locator('.home-promo')).toHaveCount(0);
  const chip = hero
    .locator('.hero-tag-row')
    .getByRole('button', { name: /^E’lonlar: 2, yangi: 2/ });
  await expect(chip).toBeVisible();
  await expect(chip.locator('.news-chip-count.is-new')).toHaveText('2');
  const box = await chip.boundingBox();
  expect(box!.height).toBeLessThan(44);
  await chip.click();
  const list = phone.getByRole('dialog', { name: /E’LONLAR/ });
  await expect(list).toContainText('dushanba 9:00 da 321-xonaga keling');
  await expect(list.locator('.news-list-item.is-promo')).toContainText('Yoshlar grant dasturi');
  await expect(list.locator('.news-list-item.is-new')).toHaveCount(2);
  await phone.keyboard.press('Escape');
  await expect(list).toHaveCount(0);
  // ko'rilgach — raqam kulrang (umumiy soni), qizil emas; sahifa yangilansa ham
  await expect(hero.locator('.news-chip-count')).toHaveText('2');
  await expect(hero.locator('.news-chip-count.is-new')).toHaveCount(0);
  await phone.reload({ waitUntil: 'domcontentloaded' });
  await expect(hero.locator('.news-chip-count')).toHaveText('2');
  await expect(hero.locator('.news-chip-count.is-new')).toHaveCount(0);
  await phone.context().close();

  await panel
    .getByRole('button', { name: /O‘chirish/ })
    .first()
    .click();
  await expect(panel.locator('.news-admin-list li:not(.muted)')).toHaveCount(0);
  await page.evaluate(async (id) => {
    await fetch('/api/platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'promo', input: { op: 'remove', id } }),
    });
  }, promoId);
});
