'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { servicesAct } from './service-files';
import { ReceiptPick, Receipts, uploadReceipt } from './receipt';
import { tr } from '@/lib/points';
import { isPlayApp } from '@/lib/play-app';
import {
  BUDGET_MAX,
  PAY_MIN,
  formatSum,
  type ProductId,
  type ServiceOrder,
  type ServicesView,
} from '@/lib/services';

/* 💳 Sodda to'lov (yakuniy test, Premium): karta raqami (administrator yozgan yo'riqnoma) → qancha to'laganingiz →
   chek skrinshoti → «Chekni yuborish». Narx belgilanmagan. Administrator chekni qabul qilishi bilan o'zi ochiladi.
   Buyurtma «Pullik xizmatlar»da saqlanadi (lib/server/services.ts: buy → chek → paid).
   Play Market ilovasida to'lov ko'rsatilmaydi (Google qoidasi). */
export function ProductBuy({ product }: { product: ProductId }) {
  const { lang, request, toast, data, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<ServicesView | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<Blob | null>(null);
  const [play, setPlay] = useState(false);
  const signedIn = !!data?.user;
  useEffect(() => setPlay(isPlayApp()), []);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/services');
      if (r.ok) setView(await r.json());
    } catch {}
  }, [request]);
  useEffect(() => {
    void load();
  }, [load, signedIn]);
  if (play)
    return (
      <p className="pb-note">
        {L(
          'Bu imkoniyat saytda (www.tadbirkorlik-asoslari.uz) ochiladi. Ochilgach, shu hisob bilan ilovada ham ishlaydi.',
          'This opens on the website (www.tadbirkorlik-asoslari.uz). After that it also works in the app with this account.',
          'Открывается на сайте (www.tadbirkorlik-asoslari.uz). После этого работает и в приложении с этим аккаунтом.',
        )}
      </p>
    );
  if (!signedIn)
    return (
      <div className="pb">
        <Button onClick={() => setLogin(true)}>{L('Kirish', 'Sign in', 'Войти')}</Button>
      </div>
    );
  if (!view) return <div className="skeleton pb-skeleton" />;
  if (view.banned)
    return (
      <p className="pb-note is-banned" role="status">
        ⛔{' '}
        {L(
          'Sizga pullik xizmatlar yopilgan: oldingi to‘lovingiz topilmadi. Savol bo‘lsa, «Adminga xabar» orqali yozing.',
          'Paid services are closed for you: your earlier payment was not found. Write via “Message the admin” if you have questions.',
          'Платные услуги для вас закрыты: предыдущая оплата не найдена. Вопросы — через «Написать админу».',
        )}
      </p>
    );
  const order: ServiceOrder | undefined = (view.orders || []).find(
    (o) => o.kind === product && o.status === 'work',
  );
  // chek yuborilgan — administrator qabul qilishini kutadi
  if (order?.paidAt)
    return (
      <div className="pb is-wait" role="status">
        <b>
          🧾 {L('Chekingiz yuborildi', 'Your receipt was sent', 'Чек отправлен')}:{' '}
          {formatSum(order.budget)}
        </b>
        <small>
          {L(
            'Administrator chekni qabul qilishi bilan o‘zi ochiladi — bildirishnoma keladi.',
            'It opens as soon as the administrator accepts the receipt — you will be notified.',
            'Откроется сразу после того, как администратор примет чек, — придёт уведомление.',
          )}
        </small>
        <Receipts o={order.uk + '/' + order.id} files={order.files.filter((f) => f.side === 'pay')} />
      </div>
    );
  const sum = Number(amount.replace(/\D/g, '')) || 0;
  const ok = sum >= PAY_MIN && sum <= BUDGET_MAX && !!receipt;
  async function send() {
    if (!receipt) return;
    setBusy(true);
    try {
      let o = order;
      if (!o) {
        const r = await servicesAct<{ id: string; view: ServicesView }>(request, 'me', {
          op: 'buy',
          product,
        });
        o = r.view.orders?.find((x) => x.id === r.id);
        if (!o) throw new Error('Buyurtma topilmadi — qaytadan urinib ko‘ring.');
      }
      await uploadReceipt(request, o.uk + '/' + o.id, o.id, receipt);
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
        op: 'paid',
        id: o.id,
        amount: sum,
        note: note.trim(),
      });
      setView(r.view);
      setReceipt(null);
      toast(
        L(
          '🧾 Chek yuborildi! Administrator qabul qilishi bilan ochiladi.',
          '🧾 Receipt sent! It opens once the administrator accepts it.',
          '🧾 Чек отправлен! Откроется после подтверждения администратором.',
        ),
      );
    } catch (e) {
      toast((e as Error).message);
      void load();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="pb is-pay">
      <ol className="pb-steps">
        <li>
          <b>{L('Karta orqali to‘lang', 'Pay by card', 'Оплатите на карту')}</b>
          <p className="pb-how">
            {view.how ||
              L(
                'Karta raqamini bilish uchun «Adminga xabar» orqali yozing.',
                'Write via “Message the admin” to get the card number.',
                'Узнайте номер карты через «Написать админу».',
              )}
          </p>
        </li>
        <li>
          <label>
            <b>
              {L('Qancha to‘ladingiz? (so‘m)', 'How much did you pay? (so‘m)', 'Сколько вы оплатили? (сум)')}
            </b>
            <input
              className="input"
              inputMode="numeric"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                    .replace(/\D/g, '')
                    .replace(/^0+/, '')
                    .slice(0, 9)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
                )
              }
              placeholder="10 000"
            />
          </label>
        </li>
        <li>
          <b>
            {L('Chek skrinshotini yuklang', 'Upload a screenshot of the receipt', 'Загрузите скриншот чека')}
          </b>
          <ReceiptPick value={receipt} onChange={setReceipt} />
          <input
            className="input"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={L('Izoh (ixtiyoriy)', 'Note (optional)', 'Комментарий (необязательно)')}
            aria-label={L('Izoh', 'Note', 'Комментарий')}
          />
        </li>
      </ol>
      <Button disabled={busy || !ok} onClick={() => void send()}>
        📤{' '}
        {busy
          ? L('Yuborilmoqda…', 'Sending…', 'Отправка…')
          : L('Chekni yuborish', 'Send the receipt', 'Отправить чек')}
      </Button>
    </div>
  );
}
