'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Crown, Trash2 } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dueText } from '@/lib/points';
import { useAdminView, useL } from './common';
import type { PremiumAdminView } from '@/lib/server/premium';

/* 💎 Sayt boshqaruvi → Obuna: narx va to'lov yo'riqnomasi (talabaga ko'rsatiladi), talabaga obuna berish va bekor
   qilish. To'lov tizimi ulanguncha: talaba to'laydi → administrator shu yerda muddatini belgilaydi. */
type Student = { id: string; name: string; classId?: string };

export function PremiumAdmin() {
  const L = useL();
  const { lang, request } = useApp();
  const { data, error, busy, act } = useAdminView<PremiumAdminView>('premiumAdmin', 'premiumAdmin');
  const [students, setStudents] = useState<Student[]>([]),
    [q, setQ] = useState(''),
    [pick, setPick] = useState<Student | null>(null),
    [days, setDays] = useState(30);
  useEffect(() => {
    let live = true;
    // TerDU talabalari (reyting) + talaba bo'lmaganlar: kursga ruxsat so'raganlar va ruxsat berilganlar (email bilan)
    type Row = { uid: string; name: string; email?: string };
    type Lists = { leaderboard?: Student[]; requests?: Row[]; grants?: Row[] };
    const json = (url: string): Promise<Lists> =>
      request(url)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    void Promise.all([
      json('/api/platform?view=academic'),
      json('/api/platform?view=courseAccessAdmin'),
    ]).then(([board, access]) => {
      if (!live) return;
      const seen = new Set<string>();
      const others = [...(access.requests || []), ...(access.grants || [])]
        .filter((x) => !seen.has(x.uid) && !!seen.add(x.uid))
        .map((x) => ({
          id: x.uid,
          name: x.name,
          classId: x.email || '',
        }));
      setStudents([...(board.leaderboard || []), ...others]);
    });
    return () => {
      live = false;
    };
  }, [request]);
  const found = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    return students
      .filter((s) => (s.name + ' ' + (s.classId || '')).toLowerCase().includes(n))
      .slice(0, 8);
  }, [q, students]);
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const grant = async (e: FormEvent) => {
    e.preventDefault();
    if (!pick) return;
    try {
      await act(
        { op: 'grant', uid: pick.id, name: pick.name, group: pick.classId || '', days },
        'grant',
        '💎 ' + L('Obuna berildi', 'Premium granted', 'Подписка выдана'),
      );
      setPick(null);
      setQ('');
    } catch {}
  };
  return (
    <div className="bo-live">
      <div className="bo-status">
        <span className={'bo-pill ' + (data.active ? 'on' : 'off')}>
          <Crown size={13} /> {data.active}
        </span>
        <span>
          {L(
            'ta foydalanuvchida obuna amalda. Obuna: kurs darslari (talaba bo‘lmaganlarga), kutubxonadagi 💎 manbalar va 🎭 avatar (top-10 dan tashqarida ham).',
            'users have Premium. Premium unlocks course lessons (for non-students), 💎 library resources and 🎭 an avatar (even outside the top 10).',
            'пользователей с подпиской. Подписка открывает уроки курса (для не-студентов), материалы 💎 в библиотеке и 🎭 аватар (даже вне топ-10).',
          )}
        </span>
      </div>
      <div className="bo-grid">
        <form className="bo-form" onSubmit={(e) => void grant(e)}>
          <h3>
            💎 {L('Talabaga obuna berish', 'Give Premium to a student', 'Выдать подписку студенту')}
          </h3>
          <label>
            {L('Talabani toping', 'Find the student', 'Найдите студента')}
            <input
              className="input"
              value={pick ? pick.name : q}
              onChange={(e) => {
                setPick(null);
                setQ(e.target.value);
              }}
              placeholder={L(
                'Ism, guruh yoki email',
                'Name, group or email',
                'Имя, группа или email',
              )}
            />
          </label>
          {!pick && !!found.length && (
            <ul className="bo-pick">
              {found.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setPick(s)}>
                    <b>{s.name}</b>
                    {s.classId && <small>{s.classId}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label>
            {L('Muddat', 'Period', 'Срок')}
            <select className="input" value={days} onChange={(e) => setDays(+e.target.value)}>
              {[7, 30, 90, 180, 365].map((d) => (
                <option key={d} value={d}>
                  {d} {L('kun', 'days', 'дней')}
                </option>
              ))}
            </select>
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!pick || !!busy}>
              <Crown size={15} /> {L('Obuna berish', 'Give Premium', 'Выдать подписку')}
            </Button>
          </div>
          <p className="bo-hint">
            {L(
              'Talabada obuna bo‘lsa, yangi muddat uning ustiga qo‘shiladi.',
              'If the student already has Premium, the new period is added on top.',
              'Если подписка уже есть, новый срок прибавляется к текущему.',
            )}
          </p>
        </form>
        <div className="bo-form">
          <h3>🏷 {L('Narx va to‘lov', 'Price and payment', 'Цена и оплата')}</h3>
          <p className="muted">
            {L(
              'Obuna endi saytning o‘zida sotiladi: oylik va yillik tarif (narxi — «Pullik xizmatlar → ⚙️ To‘lov yo‘riqnomasi»). Obunachi «To‘lov qildim» desa, «Pullik xizmatlar → 💬 Buyurtmalar»da «To‘lovni tasdiqlash»ni bosasiz — obuna o‘zi yoqiladi (muddat mavjudiga qo‘shiladi). Bu yerdan qo‘lda ham berish mumkin.',
              'Premium is now sold on the site itself: monthly and yearly plans (prices under “Paid services → ⚙️ Payment instructions”). When a subscriber presses “I paid”, press “Confirm payment” in “Paid services → 💬 Orders” — Premium turns on by itself (added to the current period). You can still grant it by hand here.',
              'Подписка продаётся на самом сайте: месячный и годовой тариф (цены — «Платные услуги → ⚙️ Инструкция по оплате»). Когда подписчик нажмёт «Я оплатил», подтвердите оплату в «Платные услуги → 💬 Заказы» — подписка включится сама. Здесь можно выдать её и вручную.',
            )}
          </p>
        </div>
      </div>
      <div className="bo-card">
        <h3>
          👥 {L('Obunachilar', 'Subscribers', 'Подписчики')} ({data.grants.length})
        </h3>
        <ul className="bo-list bo-app-requests">
          {data.grants.map((g) => {
            const on = g.until > data.now;
            return (
              <li key={g.uid}>
                <div>
                  <b>{g.name}</b>
                  <small>
                    {(g.group ? g.group + ' · ' : '') +
                      (on
                        ? L('gacha: ', 'until ', 'до ') + dueText(g.until, lang, data.now).date
                        : L('muddati tugagan', 'expired', 'срок истёк'))}
                  </small>
                </div>
                <span className="bo-row-btns">
                  <span className={'bo-pill ' + (on ? 'on' : 'off')}>{on ? '💎' : '⌛'}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!busy}
                    aria-label={
                      L('Obunani bekor qilish', 'Remove Premium', 'Отменить подписку') +
                      ': ' +
                      g.name
                    }
                    onClick={() =>
                      void act(
                        { op: 'revoke', uid: g.uid },
                        'rv' + g.uid,
                        L('Obuna bekor qilindi', 'Premium removed', 'Подписка отменена'),
                      ).catch(() => {})
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </span>
              </li>
            );
          })}
          {!data.grants.length && (
            <li className="muted">
              {L('Hozircha obunachi yo‘q.', 'No subscribers yet.', 'Подписчиков пока нет.')}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
