'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { formatSum } from '@/lib/services';
import { useAdminView, useL } from './common';
import type { PremiumAdminView } from '@/lib/server/premium';

/* 💎 Obuna sozlamalari: karta va izoh (talabaga «Obuna bo'lish» oynasida ko'rinadi) va umumiy son.
   Bitta funksiya — bitta joyda:
   · to'lov cheklarini tekshirish — «To'lovlar» bo'limida;
   · kimda obuna bor, obuna berish, muddatni o'zgartirish, bekor qilish, chiqarib tashlash —
     «Talabalar bilan ishlash» bo'limida (guruh yoki talaba bo'yicha). */
export function PremiumAdmin({
  openTab,
  openSection,
}: {
  /** o'qituvchi panelining bo'limi (masalan, «Talabalar bilan ishlash») */
  openTab?: (tab: string) => void;
  /** «Sayt boshqaruvi»ning boshqa kartochkasi (masalan, «To'lovlar») */
  openSection?: (id: 'payments') => void;
}) {
  const L = useL();
  const { data, error, busy, act } = useAdminView<PremiumAdminView>('premiumAdmin', 'premiumAdmin');
  const [card, setCard] = useState<{ card: string; holder: string; how: string } | null>(null);
  useEffect(() => {
    if (data && !card)
      setCard({ card: data.info.card, holder: data.info.holder, how: data.info.how });
  }, [data, card]);
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const saveCard = (e: FormEvent) => {
    e.preventDefault();
    if (!card) return;
    void act(
      { op: 'info', card: card.card, holder: card.holder, how: card.how },
      'info',
      L('Saqlandi', 'Saved', 'Сохранено'),
    ).catch(() => {});
  };
  return (
    <div className="bo-live pa">
      <div className="pa-stats">
        <div className="pa-stat">
          <Crown size={18} />
          <b>{data.active}</b>
          <span>{L('faol obunachi', 'active', 'активных')}</span>
        </div>
        <div className={'pa-stat' + (data.fresh.length ? ' is-new' : '')}>
          <span aria-hidden="true">🆕</span>
          <b>{data.fresh.length + data.pending.length}</b>
          <span>{L('tekshirilmagan to‘lov', 'to check', 'на проверке')}</span>
        </div>
        <div className="pa-stat">
          <span aria-hidden="true">💳</span>
          <b>{data.paid > 0 ? formatSum(data.paid) : '0'}</b>
          <span>{L('jami to‘langan', 'paid in total', 'всего оплачено')}</span>
        </div>
      </div>
      <ol className="pa-how">
        <li>
          {L(
            'Talaba «Obuna bo‘lish»ni bosadi, 1 oy yoki 1 yilni tanlaydi va kartaga istalgan summani to‘laydi (narx ixtiyoriy).',
            'A student taps “Subscribe”, picks 1 month or 1 year and pays any amount to the card.',
            'Студент нажимает «Подписаться», выбирает 1 месяц или 1 год и оплачивает любую сумму.',
          )}
        </li>
        <li>
          {L(
            '«To‘lov qildim» → summa va to‘lov vaqti yoki chek → «Yuborish». To‘lov «To‘lovlar» bo‘limiga tekshiruvga keladi.',
            '“I have paid” → amount and payment time or receipt → “Send”. The payment arrives under “Payments” for review.',
            '«Я оплатил» → сумма и время или чек → «Отправить». Оплата приходит на проверку в «Платежи».',
          )}
        </li>
        <li>
          {L(
            'Kimda obuna borligi, obuna berish, muddatni o‘zgartirish va bekor qilish — «Talabalar bilan ishlash» bo‘limida.',
            'Who has Premium, giving it, changing the term and cancelling — under “Working with students”.',
            'У кого подписка, выдача, изменение срока и отмена — в разделе «Работа со студентами».',
          )}
        </li>
      </ol>
      <div className="bo-actions pa-links">
        <Button variant="outline" onClick={() => openSection?.('payments')}>
          💳 {L('To‘lovlarni tekshirish', 'Review payments', 'Проверить платежи')}
        </Button>
        <Button variant="outline" onClick={() => openTab?.('academic')}>
          👥{' '}
          {L(
            'Obunachilar (Talabalar bilan ishlash)',
            'Subscribers (students)',
            'Подписчики (студенты)',
          )}
        </Button>
      </div>
      <form className="bo-form" onSubmit={saveCard}>
        <h3>💳 {L('Karta (narx ixtiyoriy)', 'Card (any amount)', 'Карта (любая сумма)')}</h3>
        {card && (
          <>
            <label>
              {L('Karta raqami', 'Card number', 'Номер карты')}
              <input
                className="input"
                inputMode="numeric"
                value={card.card}
                maxLength={40}
                onChange={(e) => setCard({ ...card, card: e.target.value })}
                placeholder="8600 0000 0000 0000"
              />
            </label>
            <label>
              {L('Karta egasi', 'Card holder', 'Владелец карты')}
              <input
                className="input"
                value={card.holder}
                maxLength={80}
                onChange={(e) => setCard({ ...card, holder: e.target.value })}
              />
            </label>
            <label>
              {L(
                'Qo‘shimcha izoh (ixtiyoriy)',
                'Extra note (optional)',
                'Примечание (необязательно)',
              )}
              <textarea
                className="input"
                rows={2}
                maxLength={600}
                value={card.how}
                onChange={(e) => setCard({ ...card, how: e.target.value })}
                placeholder={L(
                  'Masalan: Click yoki Payme orqali',
                  'E.g. via Click or Payme',
                  'Например: через Click или Payme',
                )}
              />
            </label>
            <div className="bo-actions">
              <Button type="submit" disabled={!!busy}>
                {L('Saqlash', 'Save', 'Сохранить')}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
