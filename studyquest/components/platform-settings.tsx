'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
type Policy = { maintenance: boolean; publicLeaderboard: boolean; allowInitialCode: boolean };
export function PlatformSettings() {
  const { request, toast, refresh, lang } = useApp();
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const [policy, setPolicy] = useState<Policy | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    request('/api/platform?view=siteSettings')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw Error(v.error);
        setPolicy({ ...v, publicLeaderboard: false });
      })
      .catch((e) => setError(e.message));
  }, [request]);
  return (
    <section className="panel editor">
      <h2>{L('Platformani boshqarish', 'Platform management', 'Управление платформой')}</h2>
      <p>
        {L('Administrator', 'Administrator', 'Администратор')}: Isfandiyor Sayfiddinov ·
        isfandiyor2198@gmail.com
      </p>
      {error && <p role="alert">{error}</p>}
      {policy && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const r = await request('/api/platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'siteSettings', input: policy }),
              });
              const v = await r.json();
              if (!r.ok) throw Error(v.error);
              toast(
                L(
                  'Platforma sozlamalari saqlandi.',
                  'Platform settings saved.',
                  'Настройки платформы сохранены.',
                ),
              );
              await refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={policy.maintenance}
              onChange={(e) => setPolicy({ ...policy, maintenance: e.target.checked })}
            />{' '}
            {L(
              'Vaqtincha yopish — faqat administrator kiradi',
              'Close temporarily — only the administrator can sign in',
              'Временно закрыть — входит только администратор',
            )}
          </label>
          <p>
            {L(
              'Umumiy reyting faqat hisobga kirgan foydalanuvchilarga ko‘rinadi.',
              'The overall ranking is visible only to signed-in users.',
              'Общий рейтинг видят только вошедшие пользователи.',
            )}
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={policy.allowInitialCode}
              onChange={(e) => setPolicy({ ...policy, allowInitialCode: e.target.checked })}
            />{' '}
            {L(
              'Shaxsiy kodga qo‘shimcha ravishda 1111 bilan kirish',
              'Allow sign-in with 1111 in addition to the personal code',
              'Вход с кодом 1111 в дополнение к личному коду',
            )}
          </label>
          <p className="muted">
            {L(
              'Reytingda ism-familiya, guruh va ball ko‘rinadi. Parollar va email manzillari chiqarilmaydi. O‘zgarishlar bir necha soniyada kuchga kiradi.',
              'The ranking shows names, groups and points. Passwords and email addresses are never shown. Changes apply within seconds.',
              'В рейтинге видны имя, группа и баллы. Пароли и email не показываются. Изменения вступают в силу за несколько секунд.',
            )}
          </p>
          <Button disabled={busy}>
            {L('Sozlamalarni saqlash', 'Save settings', 'Сохранить настройки')}
          </Button>
        </form>
      )}
      <h3>{L('Boshqaruv bo‘limlari', 'Management sections', 'Разделы управления')}</h3>
      <p>
        {L(
          'Talabalar va baholar: tasdiqlash, bloklash, guruh, baholar, natijalar, parolni tiklash va hisobni o‘chirish. Kurslar, darslar va testlar: o‘quv materiallarini tahrirlash. Tahlil va CSV: natijalar hisoboti. Kursni boshqarish: e’lonlar, topshiriqlar va Arena sozlamalari.',
          'Students and grades: approve, block, group, grades, results, password reset and account removal. Courses, lessons and tests: edit learning materials. Analytics and CSV: results report. Course management: announcements, assignments and Arena settings.',
          'Студенты и оценки: подтверждение, блокировка, группа, оценки, результаты, сброс пароля и удаление аккаунта. Курсы, уроки и тесты: редактирование материалов. Аналитика и CSV: отчёт о результатах. Управление курсом: объявления, задания и настройки Арены.',
        )}
      </p>
    </section>
  );
}
