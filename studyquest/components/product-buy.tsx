'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { servicesAct } from './service-files';
import { ReceiptPick, Receipts, uploadReceipt } from './receipt';
import { tr } from '@/lib/points';
import { isPlayApp } from '@/lib/play-app';
import {
  PRODUCTS,
  formatSum,
  payable,
  type ProductId,
  type ServiceOrder,
  type ServicesView,
} from '@/lib/services';

/* 🛍 Tayyor mahsulotni sotib olish (yakuniy test bo'limi, Premium obuna): narx (obunachiga chegirma bilan) →
   «Sotib olish» → to'lov yo'riqnomasi va «To'lov qildim» → administrator tasdiqlashi bilan o'zi ochiladi.
   Buyurtma «Pullik xizmatlar»da saqlanadi (lib/server/services.ts, op: 'buy'), administratorga yozishma bo'lib boradi.
   Play Market ilovasida narx va to'lov ko'rsatilmaydi (Google qoidasi). */
export function ProductBuy({
  product,
  compact = false,
}: {
  product: ProductId;
  compact?: boolean;
}) {
  const { lang, request, toast, data, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<ServicesView | null>(null);
  const [busy, setBusy] = useState('');
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
  const p = PRODUCTS[product];
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
  if (!view) return <div className="skeleton pb-skeleton" />;
  const price = view.products?.[product] ?? p.price;
  const discount = p.discount ? view.discount || 0 : 0;
  const pay = payable({ budget: price, discount });
  const order: ServiceOrder | undefined = (view.orders || []).find(
    (o) => o.kind === product && o.status === 'work',
  );
  async function act(input: Record<string, unknown>, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', input);
      setView(r.view);
      if (done) toast(done);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const priceLine = (
    <p className="pb-price">
      {discount ? (
        <>
          <s>{formatSum(price)}</s> <b>{formatSum(pay)}</b>{' '}
          <em>
            💎 −{discount}% {L('obunachiga', 'for Premium', 'подписчикам')}
          </em>
        </>
      ) : (
        <b>{formatSum(pay)}</b>
      )}
    </p>
  );
  if (!signedIn)
    return (
      <div className={'pb' + (compact ? ' is-compact' : '')}>
        {priceLine}
        <Button onClick={() => setLogin(true)}>{L('Kirish', 'Sign in', 'Войти')}</Button>
      </div>
    );
  if (!order)
    return (
      <div className={'pb' + (compact ? ' is-compact' : '')}>
        {priceLine}
        <Button
          disabled={!!busy}
          onClick={() =>
            void act(
              { op: 'buy', product },
              'buy',
              L(
                'Buyurtma yaratildi — endi to‘lov qiling.',
                'Order created — now make the payment.',
                'Заказ создан — теперь оплатите.',
              ),
            )
          }
        >
          {p.icon} {L('Sotib olish', 'Buy', 'Купить')}
        </Button>
      </div>
    );
  if (order.paidAt && !order.payOk)
    return (
      <div className={'pb is-wait' + (compact ? ' is-compact' : '')} role="status">
        <b>
          🔎 {L('To‘lov tekshirilmoqda', 'Checking your payment', 'Оплата проверяется')}:{' '}
          {formatSum(payable(order))}
        </b>
        <small>
          {L(
            'Administrator tasdiqlashi bilan o‘zi ochiladi — bildirishnoma keladi.',
            'It opens automatically once the administrator confirms — you will be notified.',
            'Откроется автоматически после подтверждения администратором — придёт уведомление.',
          )}
        </small>
        <Receipts
          o={order.uk + '/' + order.id}
          files={order.files.filter((f) => f.side === 'pay')}
        />
      </div>
    );
  return (
    <div className={'pb is-pay' + (compact ? ' is-compact' : '')}>
      <b>
        💳 {L('To‘lov', 'Payment', 'Оплата')}: {formatSum(payable(order))}
        {order.discount ? ` (💎 −${order.discount}%)` : ''}
      </b>
      <p className="pb-how">
        {view.how ||
          L(
            'To‘lov usulini bilish uchun «Adminga xabar» orqali yozing.',
            'Write via “Message the admin” to learn how to pay.',
            'Напишите через «Написать админу», чтобы узнать способ оплаты.',
          )}
      </p>
      <ReceiptPick value={receipt} onChange={setReceipt} />
      <label>
        {L(
          'Chek raqami yoki izoh (ixtiyoriy)',
          'Receipt number or note (optional)',
          'Номер чека или комментарий',
        )}
        <input
          className="input"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="pb-row">
        <Button
          disabled={!!busy}
          onClick={async () => {
            // 🧾 avval chek rasmi yuklanadi, keyin «To'lov qildim»
            if (receipt) {
              setBusy('paid');
              try {
                await uploadReceipt(request, order.uk + '/' + order.id, order.id, receipt);
              } catch (e) {
                toast((e as Error).message);
                setBusy('');
                return;
              }
            }
            await act(
              { op: 'paid', id: order.id, note: note.trim() },
              'paid',
              L(
                'Rahmat! To‘lov tasdiqlangach o‘zi ochiladi.',
                'Thank you! It opens once the payment is confirmed.',
                'Спасибо! Откроется после подтверждения оплаты.',
              ),
            );
            setReceipt(null);
          }}
        >
          💳 {L('To‘lov qildim', 'I paid', 'Я оплатил')}
        </Button>
        <Button
          variant="outline"
          disabled={!!busy}
          onClick={() => void act({ op: 'cancel', id: order.id }, 'cancel')}
        >
          {L('Bekor qilish', 'Cancel', 'Отменить')}
        </Button>
      </div>
    </div>
  );
}
