'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';

/* 🔑 1111 bilan kirgan talaba (yoki paroli hali 1111) — majburiy «Parolni almashtiring» oynasi. Yopib bo'lmaydi:
   yangi parol qo'yadi yoki hisobdan chiqadi. Yangi paroldan keyin 1111 bilan kirib bo'lmaydi (server
   lib/server/shared-login.ts tekshiradi); administrator «1111 ga tiklash» qilsa — yana shu oyna chiqadi. */
export function ForcePasswordChange() {
  const { data, request, toast, logout, lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [next, setNext] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const first = useRef<HTMLInputElement>(null);
  const u = data?.user;
  const show = u?.role === 'student' && u.id.startsWith('legacy_') && !!u.mustChangePassword;
  useEffect(() => {
    if (!show) return;
    first.current?.focus();
    // orqadagi sahifa aylanmasin
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);
  if (!show || typeof document === 'undefined') return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (next.trim().length < 8)
      return setError(
        L(
          'Yangi parol kamida 8 belgidan iborat bo‘lsin.',
          'Use at least 8 characters.',
          'Не менее 8 символов.',
        ),
      );
    if (next === '1111' || next.trim() === '1111')
      return setError(
        L(
          '1111 dan boshqa parol tanlang.',
          'Choose a password other than 1111.',
          'Выберите пароль, отличный от 1111.',
        ),
      );
    if (next !== confirm)
      return setError(
        L(
          'Yangi parollar mos kelmadi.',
          'The new passwords do not match.',
          'Новые пароли не совпадают.',
        ),
      );
    setBusy(true);
    try {
      const response = await request('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'legacyChangePassword',
          input: { currentPassword: '1111', newPassword: next },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Xatolik');
      await logout();
      location.hash = 'login';
      toast(
        L(
          '🔑 Parol o‘zgartirildi. Endi ism-familiyangiz va yangi parolingiz bilan kiring — 1111 endi ishlamaydi.',
          '🔑 Password changed. Log in with your name and the new password — 1111 no longer works.',
          '🔑 Пароль изменён. Войдите с именем и новым паролем — 1111 больше не работает.',
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return createPortal(
    <div className="modal-backdrop force-password-backdrop">
      <form
        className="panel force-password"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fp-h"
        onSubmit={(e) => void submit(e)}
        onKeyDown={(e) => {
          // Escape oynani yopmaydi
          if (e.key === 'Escape') e.preventDefault();
        }}
      >
        <span className="force-password-ic" aria-hidden="true">
          <KeyRound size={26} />
        </span>
        <h2 id="fp-h">{L('Parolni almashtiring', 'Change your password', 'Смените пароль')}</h2>
        <p>
          {L(
            'Siz boshlang‘ich 1111 paroli bilan kirdingiz. Davom etish uchun o‘zingizga yangi parol qo‘ying. Shundan keyin 1111 bilan kirib bo‘lmaydi.',
            'You logged in with the starting password 1111. Set your own password to continue. After that, 1111 will no longer work.',
            'Вы вошли с начальным паролем 1111. Чтобы продолжить, задайте свой пароль. После этого 1111 перестанет работать.',
          )}
        </p>
        <label>
          {L('Yangi parol', 'New password', 'Новый пароль')}
          <input
            ref={first}
            className="input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
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
            'Kamida 8 belgi. Parolni eslab qoling yoki yozib qo‘ying. Ballaringiz va bajarilgan ishlaringiz saqlanadi.',
            'At least 8 characters. Remember it or write it down. Your points and completed work are kept.',
            'Не менее 8 символов. Запомните или запишите пароль. Баллы и выполненные работы сохранятся.',
          )}
        </p>
        {error && (
          <p role="alert" className="force-password-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy
            ? L('Saqlanmoqda…', 'Saving…', 'Сохранение…')
            : L('Yangi parolni saqlash', 'Save the new password', 'Сохранить пароль')}
        </Button>
        <button
          type="button"
          className="force-password-out"
          disabled={busy}
          onClick={() => void logout().then(() => (location.hash = 'login'))}
        >
          {L('Hisobdan chiqish', 'Log out', 'Выйти')}
        </button>
      </form>
    </div>,
    document.body,
  );
}
