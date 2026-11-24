'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { dueText } from '@/lib/points';
import {
  isActive,
  type AdminOrder,
  type ServiceCard,
  type ServicesAdminView,
} from '@/lib/services';
import { useApp } from '../provider';
import { sendOrderFile, servicesAct } from '../service-files';
import {
  ServiceFilePicker,
  ServiceFiles,
  ServiceHistory,
  ServiceOrderStatus,
  serviceName,
  type SelectedServiceFile,
} from '../services';
import { Button } from '../ui/button';
import { useL } from './common';

export function ServicesAdmin() {
  const L = useL();
  const { request, refresh } = useApp();
  const [view, setView] = useState<ServicesAdminView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showing, setShowing] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const response = await request('/api/services?admin=1', { signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!signal?.aborted) {
          setView(result);
          setError('');
        }
      } catch (e) {
        if (!signal?.aborted) setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [request],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function act(input: unknown) {
    const { admin } = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', input);
    setView(admin);
    setError('');
  }

  async function toggle() {
    if (!view) return;
    setShowing(true);
    try {
      await act({ op: 'show', shown: !view.shown });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setShowing(false);
    }
  }

  return (
    <div className="svc-admin">
      <div className="svc-heading">
        <h2>{L('Kelgan buyurtmalar', 'Incoming orders', 'Поступившие заказы')}</h2>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      {error && (
        <p className="svc-error" role="alert">
          {error}
        </p>
      )}
      {view && (
        <>
          {view.orders.length ? (
            <div className="svc-orders">
              {view.orders.map((order, index) => (
                <IncomingOrder
                  key={order.uk + '/' + order.id}
                  order={order}
                  first={index === 0}
                  act={act}
                  refresh={load}
                />
              ))}
            </div>
          ) : (
            <p className="svc-muted">
              {L('Buyurtmalar hali kelmagan.', 'No orders yet.', 'Заказов пока нет.')}
            </p>
          )}
          <details className="panel svc-order">
            <summary>
              {L('Katalog va sozlamalar', 'Catalog and settings', 'Каталог и настройки')}
            </summary>
            <div className="svc-order-body">
              <div className="svc-heading">
                <span className="svc-muted">
                  {view.shown
                    ? L('Buyurtmalar qabul qilinmoqda', 'Accepting orders', 'Заказы принимаются')
                    : L('Bo‘lim vaqtincha yopiq', 'Temporarily closed', 'Раздел временно закрыт')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={showing}
                  onClick={() => void toggle()}
                >
                  {view.shown
                    ? L('Vaqtincha yopish', 'Close temporarily', 'Временно закрыть')
                    : L('Bo‘limni ochish', 'Open services', 'Открыть раздел')}
                </Button>
              </div>
              {view.catalog.map((service) => (
                <CatalogSetting key={service.id} service={service} act={act} />
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function IncomingOrder({
  order,
  first,
  act,
  refresh,
}: {
  order: AdminOrder;
  first: boolean;
  act: (input: unknown) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const { lang, request } = useApp();
  const L = useL();
  const [reply, setReply] = useState('');
  const [link, setLink] = useState(order.link || '');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<SelectedServiceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = isActive(order.status);
  const results = order.files.filter((file) => file.side === 'out');
  const staged = results.filter((file) => !files.some((selected) => selected.id === file.id));
  const ids = { uk: order.uk, id: order.id };

  async function deliver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      for (const file of files) await sendOrderFile(request, 'admin', ids, file.id, file.file);
      await act({ op: 'deliver', ...ids, text: reply, link });
      setFiles([]);
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function change(input: unknown) {
    setBusy(true);
    setError('');
    try {
      await act(input);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeFiles(next: SelectedServiceFile[]) {
    const removed = results.find(
      (file) =>
        files.some((old) => old.id === file.id) && !next.some((item) => item.id === file.id),
    );
    if (removed) {
      setBusy(true);
      setError('');
      try {
        await act({ op: 'unfile', ...ids, fid: removed.id });
      } catch (e) {
        setError((e as Error).message);
        return;
      } finally {
        setBusy(false);
      }
    }
    setFiles(next);
  }

  return (
    <details className="panel svc-order svc-admin-order" open={first}>
      <summary>
        <span className="svc-order-summary">
          <strong>
            {serviceName(lang, order.kind)} · {order.name}
          </strong>
          <span className="svc-muted">
            {dueText(order.at, lang).date}
            {order.group ? ' · ' + order.group : ''}
          </span>
        </span>
        <ServiceOrderStatus status={order.status} />
      </summary>
      <div className="svc-order-body">
        <p className="svc-text">{order.text}</p>
        <ServiceFiles
          order={order}
          files={order.files.filter((file) => file.side === 'in' && file.ready)}
        />
        {(order.budget || order.contact || order.due || order.paidNote) && (
          <dl className="svc-legacy">
            {order.budget && (
              <>
                <dt>{L('Avvalgi summa', 'Previous amount', 'Предыдущая сумма')}</dt>
                <dd>{order.budget.toLocaleString('uz-UZ')} so‘m</dd>
              </>
            )}
            {order.due && (
              <>
                <dt>{L('Muddat', 'Due date', 'Срок')}</dt>
                <dd>{order.due}</dd>
              </>
            )}
            {order.contact && (
              <>
                <dt>{L('Aloqa', 'Contact', 'Контакт')}</dt>
                <dd>{order.contact}</dd>
              </>
            )}
            {order.paidNote && (
              <>
                <dt>{L('To‘lov izohi', 'Payment note', 'Примечание об оплате')}</dt>
                <dd>{order.paidNote}</dd>
              </>
            )}
          </dl>
        )}
        <ServiceHistory order={order} />
        {active ? (
          <>
            <form className="svc-fields" onSubmit={deliver} aria-busy={busy}>
              <label>
                {L('Javob', 'Reply', 'Ответ')}
                <textarea
                  rows={3}
                  className="input"
                  maxLength={2500}
                  value={reply}
                  disabled={busy}
                  onChange={(e) => setReply(e.target.value)}
                />
              </label>
              <label>
                {L(
                  'Natija havolasi (ixtiyoriy)',
                  'Result link (optional)',
                  'Ссылка на результат (необязательно)',
                )}
                <input
                  type="url"
                  placeholder="https://"
                  className="input"
                  maxLength={500}
                  value={link}
                  disabled={busy}
                  onChange={(e) => setLink(e.target.value)}
                />
              </label>
              <ServiceFiles
                order={order}
                files={staged}
                disabled={busy}
                onRemove={(fid) => void change({ op: 'unfile', ...ids, fid })}
              />
              <ServiceFilePicker
                side="out"
                files={files}
                disabled={busy}
                alreadyAttached={staged.length}
                onChange={(next) => void changeFiles(next)}
              />
              <Button
                type="submit"
                disabled={
                  busy ||
                  staged.some((file) => !file.ready) ||
                  !(reply.trim() || link.trim() || files.length || staged.length)
                }
              >
                {busy
                  ? L('Yuborilmoqda…', 'Sending…', 'Отправка…')
                  : L('Javob yuborish', 'Send reply', 'Отправить ответ')}
              </Button>
            </form>
            <details className="svc-history">
              <summary>{L('Buyurtmani bekor qilish', 'Cancel order', 'Отменить заказ')}</summary>
              <form
                className="svc-fields"
                onSubmit={(event) => {
                  event.preventDefault();
                  void change({ op: 'cancel', ...ids, reason });
                }}
              >
                <label>
                  {L('Sabab', 'Reason', 'Причина')}
                  <input
                    className="input"
                    required
                    minLength={3}
                    maxLength={300}
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={busy || reason.trim().length < 3}
                >
                  {L('Bekor qilish', 'Cancel order', 'Отменить заказ')}
                </Button>
              </form>
            </details>
          </>
        ) : (
          <>
            {order.reply && <p className="svc-text">{order.reply}</p>}
            {order.link && (
              <a className="svc-result-link" href={order.link} target="_blank" rel="noreferrer">
                {L('Natijani ochish', 'Open result', 'Открыть результат')}
              </a>
            )}
            {order.reason && <p className="svc-text">{order.reason}</p>}
            <ServiceFiles order={order} files={results} />
          </>
        )}
        {error && (
          <p className="svc-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}

function CatalogSetting({
  service,
  act,
}: {
  service: ServiceCard;
  act: (input: unknown) => Promise<void>;
}) {
  const { lang, toast } = useApp();
  const L = useL();
  const [price, setPrice] = useState(service.price || '');
  const [days, setDays] = useState(service.days || '');
  const [off, setOff] = useState(!!service.off);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="svc-catalog-setting"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
          await act({ op: 'catalog', kind: service.id, price, days, off });
          toast(L('Saqlandi', 'Saved', 'Сохранено'));
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <strong>{serviceName(lang, service.id)}</strong>
      <label>
        {L('Narx', 'Price', 'Цена')}
        <input
          className="input"
          maxLength={60}
          value={price}
          disabled={busy}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <label>
        {L('Muddat', 'Turnaround', 'Срок')}
        <input
          className="input"
          maxLength={40}
          value={days}
          disabled={busy}
          onChange={(e) => setDays(e.target.value)}
        />
      </label>
      <label className="svc-catalog-hide">
        <input
          type="checkbox"
          checked={off}
          disabled={busy}
          onChange={(e) => setOff(e.target.checked)}
        />
        {L('Yashirish', 'Hide', 'Скрыть')}
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={busy}>
        {L('Saqlash', 'Save', 'Сохранить')}
      </Button>
      {error && (
        <p className="svc-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
