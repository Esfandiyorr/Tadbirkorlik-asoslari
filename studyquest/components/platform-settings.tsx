'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
type Policy = { maintenance: boolean; publicLeaderboard: boolean; allowInitialCode: boolean };
export function PlatformSettings() {
  const { request, toast, refresh } = useApp();
  const [policy, setPolicy] = useState<Policy | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    request('/api/platform?view=siteSettings')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw Error(v.error);
        setPolicy(v);
      })
      .catch((e) => setError(e.message));
  }, [request]);
  return (
    <section className="panel editor">
      <h2>Platformani boshqarish</h2>
      <p>Administrator: Isfandiyor Sayfiddinov · isfandiyor2198@gmail.com</p>
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
              toast('Platforma sozlamalari saqlandi.');
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
            Vaqtincha yopish — faqat administrator kiradi
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={policy.publicLeaderboard}
              onChange={(e) => setPolicy({ ...policy, publicLeaderboard: e.target.checked })}
            />{' '}
            Umumiy akademik reytingni hammaga ko‘rsatish
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={policy.allowInitialCode}
              onChange={(e) => setPolicy({ ...policy, allowInitialCode: e.target.checked })}
            />{' '}
            Shaxsiy kodga qo‘shimcha ravishda 1111 bilan kirish
          </label>
          <p className="muted">
            Reytingda ism-familiya, guruh va ball ko‘rinadi. Parollar va email manzillari
            chiqarilmaydi. O‘zgarishlar bir necha soniyada kuchga kiradi.
          </p>
          <Button disabled={busy}>Sozlamalarni saqlash</Button>
        </form>
      )}
      <h3>Boshqaruv bo‘limlari</h3>
      <p>
        Talabalar va baholar: tasdiqlash, bloklash, guruh, baholar, natijalar, parolni tiklash va
        hisobni o‘chirish. Kurslar, darslar va testlar: o‘quv materiallarini tahrirlash. Tahlil va
        CSV: natijalar hisoboti. Kursni boshqarish: e’lonlar, topshiriqlar va Arena sozlamalari.
      </p>
    </section>
  );
}
