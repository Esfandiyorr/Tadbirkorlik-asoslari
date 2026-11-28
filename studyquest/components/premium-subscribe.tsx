'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ReceiptPick } from './receipt';
import { tr } from '@/lib/points';
import { BUDGET_MAX, PAY_MIN } from '@/lib/services';
import { PLANS, type MyClaim, type PlanId } from '@/lib/premium-plans';
import type { PremiumInfo, PremiumState } from '@/lib/library';

export const PREMIUM_CHANGED = 'sq-premium-changed';
type View = {
  state: PremiumState;
  info: PremiumInfo;
  now: number;
  claim?: MyClaim;
  blocked?: true;
};
/** datetime-local qiymati (brauzer vaqti): «2026-11-25T14:05» */
const localValue = (t: number) => {
  const d = new Date(t - new Date(t).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const toBase64 = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi.'));
    r.readAsDataURL(b);
  });

export function PremiumSubscribe({ onDone }: { onDone?: () => void }) {
  const { lang, request, toast, refresh } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<View | null>(null);
  const [step, setStep] = useState<'pay' | 'confirm'>('pay');
  const [plan, setPlan] = useState<PlanId>('oy');
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('');
  const [receipt, setReceipt] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/premium');
      if (r.ok) setView(await r.json());
    } catch {}
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  if (!view) return <div className="skeleton ps-skeleton" />;
  const date = (t: number) =>
    new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(t);

  if (view.blocked)
    return (
      <p className="ps-note is-bad" role="status">
        ⛔{' '}
        {L(
          'Obunangizni administrator yopgan: to‘lovingiz topilmagan. Savol bo‘lsa, «Adminga xabar» orqali yozing.',
          'The administrator closed your Premium: the payment was not found. Write via “Message the admin” if you have questions.',
          'Администратор закрыл подписку: оплата не найдена. Вопросы — через «Написать админу».',
        )}
      </p>
    );
  if (view.claim?.status === 'new')
    return (
      <div className="ps-done" role="status">
        <b>{L('To‘lov tekshiruvda', 'Payment under review', 'Оплата на проверке')}</b>
        <small>
          {L(
            'Administrator tasdiqlagach, obuna faollashadi yoki uzayadi.',
            'Your subscription will start or extend once the administrator confirms payment.',
            'Подписка начнётся или продлится после подтверждения оплаты администратором.',
          )}
        </small>
        {view.state.active && (
          <small>
            {L('Amaldagi obuna', 'Current subscription', 'Текущая подписка')} —{' '}
            {date(view.state.until)}
            {L(' gacha', '', '')}
          </small>
        )}
      </div>
    );

  const info = view.info;
  const sum = Number(amount.replace(/\D/g, '')) || 0;
  const paidAt = time ? new Date(time).getTime() : 0;
  const ready = sum >= PAY_MIN && sum <= BUDGET_MAX && (!!receipt || paidAt > 0);

  async function send() {
    setBusy(true);
    setErr('');
    try {
      const body: Record<string, unknown> = { op: 'subscribe', plan, amount: sum };
      if (paidAt > 0) body.paidAt = paidAt;
      if (receipt) body.receipt = await toBase64(receipt);
      const r = await request('/api/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const v = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(v.error || 'Xatolik');
      setView(v);
      setStep('pay');
      setReceipt(null);
      window.dispatchEvent(new Event(PREMIUM_CHANGED));
      void refresh();
      toast(
        '💎 ' +
          L(
            'To‘lov tekshiruvga yuborildi.',
            'Payment submitted for review.',
            'Оплата отправлена на проверку.',
          ),
      );
      onDone?.();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ps">
      {view.claim?.status === 'removed' && (
        <p className="ps-note is-bad" role="status">
          {L(
            'Oxirgi to‘lov tasdiqlanmadi.',
            'Your last payment was declined.',
            'Последняя оплата не подтверждена.',
          )}
        </p>
      )}
      {view.state.active && (
        <p className="ps-note" role="status">
          ✅ {L('Obunangiz ochiq', 'Premium is on', 'Подписка открыта')} — {date(view.state.until)}
          {L(
            ' gacha. Uzaytirsangiz, muddat ustiga qo‘shiladi.',
            '. Extending adds to it.',
            '. Продление прибавляется.',
          )}
        </p>
      )}
      {step === 'pay' ? (
        <>
          <div
            className="ps-plans"
            role="radiogroup"
            aria-label={L('Obuna muddati', 'Subscription period', 'Срок подписки')}
          >
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={plan === p.id}
                className={'ps-plan' + (plan === p.id ? ' is-on' : '')}
                onClick={() => setPlan(p.id)}
              >
                {tr(lang, p.name[0], p.name[1], p.name[2])}
              </button>
            ))}
          </div>
          <p className="ps-lead">
            {L(
              'Narx ixtiyoriy: istalgan summani to‘lang.',
              'No fixed price: pay any amount you like.',
              'Цена не фиксирована: оплатите любую сумму.',
            )}
          </p>
          <div className="ps-card">
            <small>💳 {L('Shu kartaga to‘lang', 'Pay to this card', 'Оплатите на карту')}</small>
            {info.card ? (
              <>
                <div className="ps-card-no">
                  <b>{info.card}</b>
                  <button
                    type="button"
                    className="ps-copy"
                    onClick={() =>
                      void navigator.clipboard
                        ?.writeText(info.card.replace(/\s/g, ''))
                        .then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        })
                        .catch(() => {})
                    }
                    aria-label={L(
                      'Karta raqamini nusxalash',
                      'Copy the card number',
                      'Скопировать номер',
                    )}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {info.holder && <span className="ps-holder">{info.holder}</span>}
              </>
            ) : (
              <p className="ps-how">
                {info.how ||
                  L(
                    'Karta raqamini bilish uchun «Adminga xabar» orqali yozing.',
                    'Write via “Message the admin” to get the card number.',
                    'Узнайте номер карты через «Написать админу».',
                  )}
              </p>
            )}
            {info.card && info.how && <p className="ps-how">{info.how}</p>}
          </div>
          <Button
            className="ps-main"
            onClick={() => {
              setStep('confirm');
              setErr('');
              setTime(localValue(Date.now()));
            }}
          >
            ✅ {L('To‘lov qildim', 'I have paid', 'Я оплатил')}
          </Button>
        </>
      ) : (
        <>
          <p className="ps-chosen">
            💎 {L('Obuna', 'Premium', 'Подписка')}:{' '}
            <b>{tr(lang, ...PLANS.find((p) => p.id === plan)!.name)}</b>
          </p>
          <label className="ps-field">
            <span>
              💳{' '}
              {L(
                'Qancha to‘ladingiz? (so‘m)',
                'How much did you pay? (so‘m)',
                'Сколько вы оплатили? (сум)',
              )}
            </span>
            <input
              className="input"
              inputMode="numeric"
              value={amount}
              placeholder="10 000"
              onChange={(e) =>
                setAmount(
                  e.target.value
                    .replace(/\D/g, '')
                    .replace(/^0+/, '')
                    .slice(0, 9)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
                )
              }
            />
          </label>
          <p className="ps-lead">
            {L(
              'To‘lov qilingan aniq vaqtni yozing yoki chek rasmini yuklang — ikkalasidan bittasi yetarli.',
              'Enter the exact time of the payment or upload the receipt — one of them is enough.',
              'Укажите точное время оплаты или загрузите чек — достаточно одного.',
            )}
          </p>
          <label className="ps-field">
            <span>🕒 {L('To‘lov qilingan vaqt', 'Payment time', 'Время оплаты')}</span>
            <input
              className="input"
              type="datetime-local"
              value={time}
              max={localValue(Date.now() + 600000)}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <div className="ps-or">{L('yoki', 'or', 'или')}</div>
          <ReceiptPick value={receipt} onChange={setReceipt} />
          {err && (
            <p className="ps-note is-bad" role="alert">
              {err}
            </p>
          )}
          <div className="ps-actions">
            <Button variant="outline" disabled={busy} onClick={() => setStep('pay')}>
              {L('Orqaga', 'Back', 'Назад')}
            </Button>
            <Button className="ps-main" disabled={busy || !ready} onClick={() => void send()}>
              📤{' '}
              {busy
                ? L('Yuborilmoqda…', 'Sending…', 'Отправка…')
                : L('Yuborish', 'Send', 'Отправить')}
            </Button>
          </div>
          <small className="muted">
            {L(
              'Administrator to‘lovni tasdiqlagach, obuna faollashadi yoki uzayadi.',
              'Premium starts or extends after the administrator confirms payment.',
              'Подписка начнётся или продлится после подтверждения оплаты администратором.',
            )}
          </small>
        </>
      )}
    </div>
  );
}
