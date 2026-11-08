import { test, expect } from '@playwright/test';

test('the teacher closes, opens or switches each topic to reading mode for everyone', async ({
  browser,
}) => {
  const teacher = await (await browser.newContext()).newPage();
  await teacher.request.post('/api/auth/demo', { data: { id: 'demo-teacher' } });
  await teacher.goto('/#teacher', { waitUntil: 'domcontentloaded' });
  await teacher.getByRole('button', { name: 'Mavzular holati' }).click();
  const rows = teacher.locator('.topic-access-row');
  await expect(rows).toHaveCount(15);
  // Boshlang'ich holat: 1–6 o'qish rejimida, 7 hammaga ochiq (ball bilan), 8–15 yopiq.
  for (let i = 0; i < 6; i++)
    await expect(rows.nth(i).getByRole('button', { name: 'O‘qish rejimi' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  // 7-mavzu boshlang'ich holatda hammaga ochiq; ball muddati (ochilgan haftaning oxiri) o'tgach o'zi o'qish
  // rejimiga o'tadi — sinov qaysi kuni ishlashidan qat'i nazar, ekran server holatini ko'rsatishi tekshiriladi.
  const m7 = (
    (await (await teacher.request.get('/api/platform?view=topicAccess')).json()).topics as {
      id: string;
      state: string;
    }[]
  ).find((t) => t.id === 'm7')!;
  expect(['open', 'read']).toContain(m7.state);
  if (m7.state === 'open') {
    await expect(rows.nth(6).getByRole('button', { name: 'Hammaga ochiq' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows.nth(6)).toContainText('Ball beriladi');
  } else
    await expect(rows.nth(6).getByRole('button', { name: 'O‘qish rejimi' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  for (let i = 7; i < 15; i++)
    await expect(rows.nth(i).getByRole('button', { name: 'Yopiq' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

  const student = await (await browser.newContext()).newPage();
  await student.request.post('/api/auth/demo', { data: { id: 'demo-student' } });
  const access = async () =>
    (await (await student.request.get('/api/platform')).json()).lessonAccess as Record<
      string,
      { state: string }
    >;
  expect((await access()).m8.state).toBe('locked');
  expect((await access()).m2.state).toBe('read');
  // Talaba holatni o'zgartira olmaydi va ro'yxatni ko'ra olmaydi.
  expect((await student.request.get('/api/platform?view=topicAccess')).status()).toBe(403);
  expect(
    (
      await student.request.post('/api/platform', {
        data: { action: 'topicMode', input: { topic: 'm8', mode: 'open' } },
      })
    ).status(),
  ).toBe(403);

  try {
    await rows.nth(7).getByRole('button', { name: 'Hammaga ochiq' }).click();
    await expect(rows.nth(7).getByRole('button', { name: 'Hammaga ochiq' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows.nth(7)).toContainText('o‘qituvchi tanlagan');
    expect((await access()).m8.state).toBe('score');
    await rows.nth(1).getByRole('button', { name: 'Yopiq' }).click();
    await expect(rows.nth(1).getByRole('button', { name: 'Yopiq' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect((await access()).m2.state).toBe('locked');
  } finally {
    // Umumiy demo xotirasi boshqa sinovlar uchun asl holatiga qaytariladi.
    for (const [topic, mode] of [
      ['m8', 'lock'],
      ['m2', 'read'],
    ])
      await teacher.request.post('/api/platform', {
        data: { action: 'topicMode', input: { topic, mode } },
      });
  }
  expect((await access()).m8.state).toBe('locked');
});
