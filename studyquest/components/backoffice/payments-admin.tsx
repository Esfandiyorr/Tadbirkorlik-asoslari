'use client';
import { useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { formatSum, PREMIUM_TERMS, termText } from '@/lib/services';
import type { PaymentReviewView, PaymentRow, PaymentStatus } from '@/lib/server/payment-review';
import { useApp } from '../provider';
import { ReceiptPreviewButton } from '../receipt';
import { Button } from '../ui/button';
import { useAdminView, useL } from './common';

type Kind = PaymentRow['type'];
type Sort = 'recent' | 'oldest' | 'highest' | 'lowest';
type Decision = 'approve' | 'reject';

function compare(a: PaymentRow, b: PaymentRow, sort: Sort) {
  if (sort === 'oldest') return a.at - b.at;
  if (sort === 'highest' || sort === 'lowest') {
    if (a.amount === undefined && b.amount !== undefined) return 1;
    if (b.amount === undefined && a.amount !== undefined) return -1;
    if (a.amount !== undefined && b.amount !== undefined && a.amount !== b.amount)
      return sort === 'highest' ? b.amount - a.amount : a.amount - b.amount;
  }
  return b.at - a.at;
}

export function PaymentsAdmin() {
  const L = useL();
  const { lang } = useApp();
  const { data, error, busy, load, act } = useAdminView<PaymentReviewView>(
    'paymentReview',
    'paymentReview',
  );
  const [type, setType] = useState<Kind | 'all'>('all');
  const [status, setStatus] = useState<PaymentStatus | 'all'>('pending');
  const [sort, setSort] = useState<Sort>('recent');
  const [query, setQuery] = useState('');
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Tashkent',
      }),
    [lang],
  );
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.payments || [])
      .filter(
        (p) =>
          (type === 'all' || type === p.type) &&
          (status === 'all' || status === p.status) &&
          [p.name, p.title, p.group, p.email].join(' ').toLowerCase().includes(q),
      )
      .sort((a, b) => compare(a, b, sort));
  }, [data, type, status, sort, query]);

  const typeLabels: Record<Kind, string> = {
    subscription: L('Obuna', 'Subscription', 'Подписка'),
    course: L('Kurs', 'Course', 'Курс'),
    avatar: L('Avatar', 'Avatar', 'Аватар'),
    service: L('Xizmat', 'Service', 'Услуга'),
  };
  const statusLabels: Record<PaymentStatus, string> = {
    pending: L('Tekshiruvda', 'Pending review', 'На проверке'),
    approved: L('Tasdiqlangan', 'Approved', 'Подтверждено'),
    rejected: L('Qabul qilinmagan', 'Not accepted', 'Не принято'),
  };

  async function decide(payment: PaymentRow, decision: Decision, days: number) {
    if (!payment.target || busy) return;
    let reason: string | undefined;
    if (decision === 'reject' && payment.target.source === 'service') {
      const text = window.prompt(
        L(
          'Rad etish sababini yozing (ixtiyoriy). Sabab buyurtmachiga yuboriladi.',
          'Enter a reason (optional). The customer will receive it.',
          'Укажите причину (необязательно). Она будет отправлена заказчику.',
        ),
        '',
      );
      if (text === null) return;
      reason = text.trim().slice(0, 300);
    }
    try {
      await act(
        {
          decision,
          target: payment.target,
          ...(decision === 'approve' && payment.selectTerm ? { days } : {}),
          ...(reason ? { reason } : {}),
        },
        payment.key,
        decision === 'approve'
          ? L('To‘lov tasdiqlandi.', 'Payment approved.', 'Оплата подтверждена.')
          : L('To‘lov qabul qilinmadi.', 'Payment rejected.', 'Оплата отклонена.'),
      );
    } catch {
      await load();
    }
  }

  return (
    <div className="bo-live">
      <section className="bo-card">
        <div className="bo-row payment-review-filters">
          <label>
            {L('To‘lov turi', 'Payment type', 'Вид оплаты')}
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as Kind | 'all')}
            >
              <option value="all">{L('Barcha turlar', 'All types', 'Все виды')}</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L('Holati', 'Status', 'Статус')}
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus | 'all')}
            >
              <option value="all">{L('Barcha holatlar', 'All statuses', 'Все статусы')}</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L('Tartiblash', 'Sort by', 'Сортировка')}
            <select
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              <option value="recent">
                {L('Avval yangilari', 'Newest first', 'Сначала новые')}
              </option>
              <option value="oldest">
                {L('Avval eskilari', 'Oldest first', 'Сначала старые')}
              </option>
              <option value="highest">
                {L('Katta summadan', 'Highest amount first', 'Сначала крупные суммы')}
              </option>
              <option value="lowest">
                {L('Kichik summadan', 'Lowest amount first', 'Сначала меньшие суммы')}
              </option>
            </select>
          </label>
          <label>
            {L('Qidirish', 'Search', 'Поиск')}
            <input
              className="input"
              type="search"
              value={query}
              placeholder={L(
                'Ism, email yoki nom',
                'Name, email or title',
                'Имя, почта или название',
              )}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="payment-review-head">
          <small className="muted" aria-live="polite">
            {data &&
              L(`${rows.length} ta to‘lov`, `${rows.length} payments`, `Платежей: ${rows.length}`)}
          </small>
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void load()}>
            <RefreshCw size={15} /> {L('Yangilash', 'Refresh', 'Обновить')}
          </Button>
        </div>
      </section>
      {error && (
        <p className="error-state" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <div className="skeleton h-64" />}
      {data &&
        (rows.length ? (
          <ul className="payment-review-list">
            {rows.map((p) => (
              <ReviewRow
                key={p.key}
                payment={p}
                typeLabel={typeLabels[p.type]}
                statusLabel={statusLabels[p.status]}
                date={date}
                busy={!!busy}
                decide={decide}
              />
            ))}
          </ul>
        ) : (
          <p className="bo-card muted">
            {L(
              'Tanlangan filtrlarga mos to‘lov topilmadi.',
              'No payments match these filters.',
              'По выбранным фильтрам оплат нет.',
            )}
          </p>
        ))}
    </div>
  );
}

function ReviewRow({
  payment: p,
  typeLabel,
  statusLabel,
  date,
  busy,
  decide,
}: {
  payment: PaymentRow;
  typeLabel: string;
  statusLabel: string;
  date: Intl.DateTimeFormat;
  busy: boolean;
  decide: (payment: PaymentRow, decision: Decision, days: number) => Promise<void>;
}) {
  const L = useL();
  const { lang } = useApp();
  const [days, setDays] = useState<number>(PREMIUM_TERMS[0]);
  const serviceReceipts = p.serviceReceipts;
  return (
    <li className="bo-card payment-review-row">
      <div className="payment-review-who">
        <div className="payment-review-labels">
          <span
            className={
              'bo-pill ' +
              (p.status === 'approved'
                ? 'on'
                : p.status === 'rejected'
                  ? 'off'
                  : 'payment-review-pending')
            }
          >
            {statusLabel}
          </span>
          <span className="muted">{typeLabel}</span>
        </div>
        <b>{p.name}</b>
        {p.title && <span>{p.title}</span>}
        {(p.group || p.email) && (
          <small className="muted">{[p.group, p.email].filter(Boolean).join(' · ')}</small>
        )}
        {p.note && <small>{p.note}</small>}
        {p.reason && <small className="muted">{p.reason}</small>}
      </div>
      <div className="payment-review-money">
        <b>
          {p.amount === undefined
            ? p.price || L('Summa ko‘rsatilmagan', 'Amount unavailable', 'Сумма не указана')
            : formatSum(p.amount)}
        </b>
        <small className="muted">
          {date.format(p.at)}
          {p.days ? ' · ' + termText(p.days, lang) : ''}
        </small>
        {p.paidAt && (
          <small className="muted">
            {L('To‘langan vaqti', 'Payment time', 'Время оплаты')} · {date.format(p.paidAt)}
          </small>
        )}
      </div>
      {(p.receiptUrl || serviceReceipts || p.target) && (
        <div className="payment-review-receipts">
          {p.receiptUrl && <ReceiptPreviewButton src={p.receiptUrl} />}
          {serviceReceipts &&
            serviceReceipts.files.map((file) => (
              <ReceiptPreviewButton key={file.id} order={serviceReceipts.order} file={file} />
            ))}
          {!p.receiptUrl && !serviceReceipts && (
            <small className="muted">
              {L('Chek biriktirilmagan', 'No receipt attached', 'Чек не приложен')}
            </small>
          )}
        </div>
      )}
      {p.target && (
        <div className="payment-review-actions">
          {p.selectTerm && (
            <select
              aria-label={L('Obuna muddati', 'Subscription period', 'Срок подписки')}
              className="input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {PREMIUM_TERMS.map((d) => (
                <option key={d} value={d}>
                  {termText(d, lang)}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" disabled={busy} onClick={() => void decide(p, 'approve', days)}>
            <Check size={15} />
            {p.approving
              ? L('Tasdiqlashni yakunlash', 'Finish approval', 'Завершить подтверждение')
              : L('Tasdiqlash', 'Approve', 'Подтвердить')}
          </Button>
          {!p.approving && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void decide(p, 'reject', days)}
            >
              <X size={15} /> {L('Rad etish', 'Reject', 'Отклонить')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
