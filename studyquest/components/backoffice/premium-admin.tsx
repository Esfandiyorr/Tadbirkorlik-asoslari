'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Crown, Save, Trash2 } from 'lucide-react';
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
  const [info, setInfo] = useState({ price: '', how: '', free: 1 });
  const [students, setStudents] = useState<Student[]>([]),
    [q, setQ] = useState(''),
    [pick, setPick] = useState<Student | null>(null),
    [days, setDays] = useState(30);
  const saved = data?.info;
  useEffect(() => {
    if (saved) setInfo({ price: saved.price, how: saved.how, free: saved.free });
  }, [saved]);
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
  const saveInfo = (e: FormEvent) => {
    e.preventDefault();
    void act(
      { op: 'info', price: info.price.trim(), how: info.how.trim(), free: info.free },
      'info',
      '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'),
    ).catch(() => {});
  };
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
            'ta foydalanuvchida obuna amalda. Obuna: kurs darslari (talaba bo‘lmaganlarga), sun’iy intellekt taqdimotlari, kutubxonadagi 💎 manbalar va 🎭 avatar (top-10 dan tashqarida ham).',
            'users have Premium. Premium unlocks course lessons (for non-students), AI presentations, 💎 library resources and 🎭 an avatar (even outside the top 10).',
            'пользователей с подпиской. Подписка открывает уроки курса (для не-студентов), ИИ-презентации, материалы 💎 в библиотеке и 🎭 аватар (даже вне топ-10).',
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
        <form className="bo-form" onSubmit={saveInfo}>
          <h3>
            🏷 {L('Narx va to‘lov yo‘riqnomasi', 'Price and how to pay', 'Цена и как оплатить')}
          </h3>
          <label>
            {L('Narx (talabaga ko‘rinadi)', 'Price (shown to students)', 'Цена (видна студентам)')}
            <input
              className="input"
              maxLength={80}
              value={info.price}
              onChange={(e) => setInfo({ ...info, price: e.target.value })}
              placeholder={L(
                'Masalan: 25 000 so‘m / oy',
                'E.g. 25 000 so‘m / month',
                'Например: 25 000 сум / месяц',
              )}
            />
          </label>
          <label>
            {L('Qanday to‘lanadi', 'How to pay', 'Как оплатить')}
            <textarea
              className="input"
              rows={4}
              maxLength={600}
              value={info.how}
              onChange={(e) => setInfo({ ...info, how: e.target.value })}
              placeholder={L(
                'Masalan: Click yoki Payme orqali … kartaga o‘tkazing va chekni «Adminga xabar»ga yuboring. Obuna 1 soat ichida yoqiladi.',
                'E.g. pay by Click or Payme to card … and send the receipt in “Message the admin”.',
                'Например: переведите через Click или Payme на карту … и отправьте чек в «Написать админу».',
              )}
            />
          </label>
          <label>
            {L(
              'Obunasiz talabaga bepul taqdimotlar soni',
              'Free AI presentations without Premium',
              'Бесплатных презентаций без подписки',
            )}
            <select
              className="input"
              value={info.free}
              onChange={(e) => setInfo({ ...info, free: +e.target.value })}
            >
              {[0, 1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!!busy}>
              <Save size={15} /> {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
          </div>
        </form>
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
