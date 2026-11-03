'use client';
import { useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
export function ChangePassword() {
  const { data, request, toast, logout } = useApp();
  const [currentPassword, setCurrent] = useState(''),
    [newPassword, setNew] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (data?.user?.role !== 'student' || !data.user.id.startsWith('legacy_')) return null;
  return (
    <form
      className="password-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setError('');
        if (newPassword !== confirm) {
          setError('Yangi parollar mos kelmadi.');
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
          toast('Parol o‘zgartirildi. Ism-familiyangiz va yangi parol bilan qayta kiring.');
        } catch (error) {
          setError((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Parolni o‘zgartirish</h2>
      {data.user.mustChangePassword && (
        <p className="muted">Boshlang‘ich parolingiz 1111. O‘zingiz uchun yangi parol tanlang.</p>
      )}
      <label>
        Joriy parol
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
        Yangi parol
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
        Yangi parolni takrorlang
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
        Yangi parol kamida 8 belgidan iborat bo‘lsin. Ballaringiz va bajarilgan ishlaringiz
        saqlanadi.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={busy}>
        Parolni o‘zgartirish
      </Button>
    </form>
  );
}
