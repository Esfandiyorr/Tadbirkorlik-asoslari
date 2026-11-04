'use client';
import { useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
export function ChangePassword() {
  const { data, request, toast, logout, lang } = useApp();
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const [currentPassword, setCurrent] = useState(''),
    [newPassword, setNew] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (data?.user?.role !== 'student' || !data.user.id.startsWith('legacy_')) return null;
  return (
    <form
      className="password-editor panel profile-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setError('');
        if (newPassword !== confirm) {
          setError(
            L(
              'Yangi parollar mos kelmadi.',
              'The new passwords do not match.',
              'Новые пароли не совпадают.',
            ),
          );
          return;
        }
        setBusy(true);
        try {
          const response = await request('/api/platform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'legacyChangePassword',
              input: { currentPassword, newPassword },
            }),
          });
          const result = await response.json();
          if (!response.ok) throw Error(result.error);
          setCurrent('');
          setNew('');
          setConfirm('');
          await logout();
          location.hash = 'login';
          toast(
            L(
              'Parol o‘zgartirildi. Ism-familiyangiz va yangi parol bilan qayta kiring.',
              'Password changed. Log in again with your name and the new password.',
              'Пароль изменён. Войдите снова с именем и новым паролем.',
            ),
          );
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>🔑 {L('Parolni o‘zgartirish', 'Change password', 'Сменить пароль')}</h2>
      {data.user.mustChangePassword && (
        <p className="muted">
          {L(
            'Boshlang‘ich parolingiz 1111. O‘zingiz uchun yangi parol tanlang.',
            'Your starting password is 1111. Choose a new one.',
            'Начальный пароль — 1111. Выберите новый.',
          )}
        </p>
      )}
      <label>
        {L('Joriy parol', 'Current password', 'Текущий пароль')}
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          minLength={4}
          maxLength={128}
          required
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </label>
      <label>
        {L('Yangi parol', 'New password', 'Новый пароль')}
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
        />
      </label>
      <label>
        {L('Yangi parolni takrorlang', 'Repeat the new password', 'Повторите новый пароль')}
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      <p className="muted">
        {L(
          'Yangi parol kamida 8 belgidan iborat bo‘lsin. Ballaringiz va bajarilgan ishlaringiz saqlanadi.',
          'Use at least 8 characters. Your points and completed work are kept.',
          'Не менее 8 символов. Баллы и выполненные работы сохранятся.',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={busy}>
        {L('Parolni o‘zgartirish', 'Change password', 'Сменить пароль')}
      </Button>
    </form>
  );
}
