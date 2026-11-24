'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronRight, Download, Paperclip, X } from 'lucide-react';
import { dueText, tr } from '@/lib/points';
import {
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  FILE_TYPES,
  STATUS_LABEL,
  fileExt,
  fileSize,
  isActive,
  serviceKind,
  type OrderFile,
  type ServiceCard,
  type ServiceOrder,
  type ServicesView,
} from '@/lib/services';
import type { Lang } from '@/lib/types';
import { navigate } from './dashboard';
import { useApp } from './provider';
import { saveOrderFile, sendOrderFile, servicesAct } from './service-files';
import { Button } from './ui/button';

export function serviceName(lang: Lang, kind: string) {
  const service = serviceKind(kind);
  return service ? tr(lang, ...service.name) : kind;
}

const waiting = (lang: Lang) =>
  tr(
    lang,
    'AI javobini kuting. Javob tayyor bo‘lganda sizga xabar beramiz.',
    'Please wait for the AI response. We’ll let you know when it’s ready.',
    'Ожидайте ответа ИИ. Мы сообщим, когда ответ будет готов.',
  );

export function Services({ sub = '' }: { sub?: string }) {
  const { data, lang, request, toast } = useApp();
  const [view, setView] = useState<ServicesView | null>(null);
  const [selected, setSelected] = useState<ServiceCard | null>(null);
  const [error, setError] = useState('');
  const mine = sub === 'mine';
  const admin = data?.user?.role === 'admin';
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await request('/api/services', { signal });
        const value = await response.json();
        if (!response.ok) throw new Error(value.error);
        if (!signal?.aborted) {
          setView(value);
          setError('');
        }
      } catch (e) {
        if (!signal?.aborted) setError((e as Error).message);
      }
    },
    [request],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, mine]);

  return (
    <div className="svc-page">
      <div className="page-heading">
        <h1>
          {mine
            ? tr(lang, 'Buyurtmalarim', 'My orders', 'Мои заказы')
            : tr(lang, 'Pullik xizmatlar', 'Paid services', 'Платные услуги')}
        </h1>
        <div className="svc-actions">
          {mine ? (
            <Button variant="outline" size="sm" asChild>
              <a href="#services">
                <ArrowLeft size={15} />
                {tr(lang, 'Katalog', 'Catalog', 'Каталог')}
              </a>
            </Button>
          ) : (
            view?.signedIn && (
              <Button variant="outline" size="sm" asChild>
                <a href="#services/mine">{tr(lang, 'Buyurtmalarim', 'My orders', 'Мои заказы')}</a>
              </Button>
            )
          )}
          {admin && (
            <Button asChild size="sm" variant="outline">
              <a href="#admin/services">{tr(lang, 'Boshqarish', 'Manage', 'Управление')}</a>
            </Button>
          )}
        </div>
      </div>
      {error && (
        <div role="alert" className="svc-actions">
          <span className="svc-error">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            {tr(lang, 'Qayta urinish', 'Try again', 'Повторить')}
          </Button>
        </div>
      )}
      {mine ? (
        <>
          {view?.orders?.length ? (
            <div className="svc-orders">
              {view.orders.map((order, index) => (
                <CustomerOrder
                  key={order.id}
                  order={order}
                  first={index === 0}
                  onUpdate={setView}
                />
              ))}
            </div>
          ) : (
            view && (
              <p className="svc-muted">
                {tr(lang, 'Buyurtmalar yo‘q.', 'No orders yet.', 'Заказов пока нет.')}
              </p>
            )
          )}
        </>
      ) : (
        <>
          <section className="panel svc-guide" aria-labelledby="services-guide">
            <h2 id="services-guide">
              {tr(lang, 'Qanday ishlaydi?', 'How it works', 'Как это работает?')}
            </h2>
            <p>
              {tr(
                lang,
                'Xizmatni tanlang, nima kerakligini yozing va kerakli fayllarni biriktiring. Buyurtmani admin ko‘rib chiqadi va tayyor javobni «Buyurtmalarim» bo‘limiga yuboradi.',
                'Choose a service, describe what you need and attach any relevant files. The admin reviews your order and sends the completed reply to My orders.',
                'Выберите услугу, опишите задачу и прикрепите нужные файлы. Администратор рассмотрит заказ и пришлёт готовый ответ в раздел «Мои заказы».',
              )}
            </p>
          </section>
          {view && (
            <section className="svc-catalog" aria-labelledby="services-catalog">
              <h2 id="services-catalog">
                {tr(lang, 'Xizmatlar katalogi', 'Service catalog', 'Каталог услуг')}
              </h2>
              {view.catalog.length ? (
                <ul className="svc-grid">
                  {view.catalog.map((service) => (
                    <li key={service.id}>
                      <button
                        className="svc-card"
                        type="button"
                        onClick={() => setSelected(service)}
                      >
                        <span className="svc-card-icon" aria-hidden="true">
                          {service.icon}
                        </span>
                        <span>{tr(lang, ...service.name)}</span>
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="svc-muted">
                  {tr(
                    lang,
                    'Hozircha xizmatlar mavjud emas.',
                    'No services are available right now.',
                    'Сейчас нет доступных услуг.',
                  )}
                </p>
              )}
            </section>
          )}
        </>
      )}
      {selected && view && (
        <OrderForm
          service={selected}
          signedIn={view.signedIn}
          onClose={() => setSelected(null)}
          onSent={() => {
            setSelected(null);
            toast(
              tr(
                lang,
                'Buyurtmangiz adminga yuborildi.',
                'Your order was sent to the admin.',
                'Ваш заказ отправлен администратору.',
              ),
            );
            navigate('services/mine');
          }}
        />
      )}
    </div>
  );
}

function OrderForm({
  service,
  signedIn,
  onClose,
  onSent,
}: {
  service: ServiceCard;
  signedIn: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const { lang, request } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const draft = useRef('');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<SelectedServiceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const id = (draft.current ||= crypto.randomUUID().replaceAll('-', ''));
      const { uk, submitted } = await servicesAct<{ uk: string; submitted: boolean }>(
        request,
        'me',
        { op: 'draft', id, kind: service.id, text, files: files.map((f) => f.id) },
      );
      if (!submitted) {
        for (const item of files)
          await sendOrderFile(request, 'me', { uk, id }, item.id, item.file);
      }
      await servicesAct(request, 'me', {
        op: 'submit',
        id,
      });
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="svc-form"
      aria-labelledby="service-order-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <h2 id="service-order-title">{tr(lang, ...service.name)}</h2>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label={tr(lang, 'Yopish', 'Close', 'Закрыть')}
        >
          <X size={20} />
        </Button>
      </header>
      <p className="svc-muted">{tr(lang, ...service.text)}</p>
      {(service.price || service.days) && (
        <p className="svc-muted">{[service.price, service.days].filter(Boolean).join(' · ')}</p>
      )}
      {signedIn ? (
        <form onSubmit={submit} className="svc-fields" aria-busy={busy}>
          <label>
            {tr(lang, 'Nima kerak?', 'What do you need?', 'Что вам нужно?')}
            <textarea
              className="input"
              rows={4}
              required
              minLength={3}
              maxLength={3000}
              placeholder={tr(lang, ...service.hint)}
              value={text}
              disabled={busy}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <ServiceFilePicker side="in" files={files} disabled={busy} onChange={setFiles} />
          {error && (
            <p className="svc-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || text.trim().length < 3}>
            {busy
              ? tr(lang, 'Yuborilmoqda…', 'Sending…', 'Отправка…')
              : tr(lang, 'Buyurtmani yuborish', 'Send order', 'Отправить заказ')}
          </Button>
        </form>
      ) : (
        <Button asChild onClick={onClose}>
          <a href="#login">
            {tr(
              lang,
              'Buyurtma berish uchun kiring',
              'Sign in to order',
              'Войдите, чтобы заказать',
            )}
          </a>
        </Button>
      )}
    </dialog>
  );
}

function CustomerOrder({
  order,
  first,
  onUpdate,
}: {
  order: ServiceOrder;
  first: boolean;
  onUpdate: (view: ServicesView) => void;
}) {
  const { lang, request } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const outputs = order.files.filter((file) => file.side === 'out');
  async function remove() {
    if (
      !confirm(
        tr(lang, 'Buyurtmani olib tashlaysizmi?', 'Remove this order?', 'Удалить этот заказ?'),
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      const { view } = await servicesAct<{ view: ServicesView }>(request, 'me', {
        op: 'remove',
        id: order.id,
      });
      onUpdate(view);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel svc-order" open={first}>
      <summary>
        <span className="svc-order-summary">
          <strong>{serviceName(lang, order.kind)}</strong>
          <span className="svc-muted">{dueText(order.at, lang).date}</span>
        </span>
        <ServiceOrderStatus status={order.status} />
      </summary>
      <div className="svc-order-body">
        <p className="svc-text">{order.text}</p>
        <ServiceFiles order={order} files={order.files.filter((file) => file.side === 'in')} />
        {isActive(order.status) && <p className="svc-muted">{waiting(lang)}</p>}
        {order.reason && <p className="svc-text">{order.reason}</p>}
        {(order.reply || order.link || outputs.length > 0 || order.expired) && (
          <div className="svc-result">
            <h3>{tr(lang, 'Admin javobi', 'Admin reply', 'Ответ администратора')}</h3>
            {order.reply && <p className="svc-text">{order.reply}</p>}
            {order.link && (
              <a href={order.link} target="_blank" rel="noreferrer" className="svc-result-link">
                {tr(lang, 'Natijani ochish', 'Open result', 'Открыть результат')}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
            <ServiceFiles order={order} files={outputs} />
            {order.expired && (
              <p className="svc-muted">
                {tr(
                  lang,
                  'Fayllarni yuklab olish muddati tugagan.',
                  'The download period has expired.',
                  'Срок загрузки файлов истёк.',
                )}
              </p>
            )}
          </div>
        )}
        <ServiceHistory order={order} />
        {error && (
          <p className="svc-error" role="alert">
            {error}
          </p>
        )}
        {!isActive(order.status) && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void remove()}>
            {tr(lang, 'Buyurtmani olib tashlash', 'Remove order', 'Удалить заказ')}
          </Button>
        )}
      </div>
    </details>
  );
}

export function ServiceOrderStatus({ status }: { status: ServiceOrder['status'] }) {
  const { lang } = useApp();
  return <span className={'svc-status is-' + status}>{tr(lang, ...STATUS_LABEL[status])}</span>;
}

export function ServiceHistory({ order }: { order: ServiceOrder }) {
  const { lang } = useApp();
  if (!order.msgs.length) return null;
  return (
    <details className="svc-history">
      <summary>
        {tr(lang, 'Avvalgi yozishmalar', 'Previous messages', 'Предыдущая переписка')}
      </summary>
      <ul>
        {order.msgs.map((message) => (
          <li key={message.id}>
            <small className="svc-muted">{dueText(message.at, lang).date}</small>
            <p className="svc-text">{message.text}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

export type SelectedServiceFile = { id: string; file: File };

export function ServiceFilePicker({
  side,
  files,
  onChange,
  disabled = false,
  alreadyAttached = 0,
}: {
  side: OrderFile['side'];
  files: SelectedServiceFile[];
  onChange: (files: SelectedServiceFile[]) => void;
  disabled?: boolean;
  alreadyAttached?: number;
}) {
  const { lang } = useApp();
  const [error, setError] = useState('');
  const limit = FILES_PER_ORDER[side];
  const maxSize = FILE_MAX[side];
  const label =
    side === 'out'
      ? tr(lang, 'Natija faylini biriktirish', 'Attach a result file', 'Прикрепить файл результата')
      : tr(lang, 'Fayl biriktirish', 'Attach files', 'Прикрепить файлы');
  return (
    <div className="svc-attachment">
      <label className="svc-file-picker">
        <Paperclip size={16} aria-hidden="true" />
        {label}
        <input
          type="file"
          multiple
          accept={FILE_ACCEPT}
          disabled={disabled || files.length + alreadyAttached >= limit}
          onChange={(event) => {
            const chosen = Array.from(event.target.files || []);
            event.target.value = '';
            if (!chosen.length) return;
            if (chosen.length + files.length + alreadyAttached > limit) {
              setError(
                tr(
                  lang,
                  `Ko‘pi bilan ${limit} ta fayl biriktiring.`,
                  `Attach up to ${limit} files.`,
                  `Прикрепите не более ${limit} файлов.`,
                ),
              );
              return;
            }
            const invalid = chosen.find(
              (file) => !fileExt(file.name) || !file.size || file.size > maxSize,
            );
            if (invalid) {
              setError(
                invalid.name +
                  ' — ' +
                  tr(
                    lang,
                    'fayl turi yoki hajmi mos kelmaydi.',
                    'unsupported file type or size.',
                    'неподходящий тип или размер файла.',
                  ),
              );
              return;
            }
            setError('');
            onChange([
              ...files,
              ...chosen.map((file) => ({ id: crypto.randomUUID().replaceAll('-', ''), file })),
            ]);
          }}
        />
      </label>
      <small className="svc-muted">
        {tr(
          lang,
          `${limit} tagacha, har biri ${fileSize(maxSize)} gacha`,
          `Up to ${limit}, ${fileSize(maxSize)} each`,
          `До ${limit} файлов, по ${fileSize(maxSize)} каждый`,
        )}
      </small>
      {files.length > 0 && (
        <ul className="svc-files">
          {files.map(({ id, file }) => (
            <li key={id}>
              <span>{file.name}</span>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={disabled}
                aria-label={tr(lang, 'Olib tashlash', 'Remove', 'Удалить') + ' ' + file.name}
                onClick={() => {
                  setError('');
                  onChange(files.filter((item) => item.id !== id));
                }}
              >
                <X size={15} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="svc-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ServiceFiles({
  order,
  files,
  onRemove,
  disabled = false,
}: {
  order: Pick<ServiceOrder, 'uk' | 'id'>;
  files: OrderFile[];
  onRemove?: (id: string) => void;
  disabled?: boolean;
}) {
  const { lang, request } = useApp();
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');
  async function download(file: OrderFile) {
    setError('');
    setDownloading(file.id);
    try {
      await saveOrderFile(request, order.uk + '/' + order.id, file);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading('');
    }
  }
  if (!files.length) return null;
  return (
    <div>
      <ul className="svc-files">
        {files.map((file) => (
          <li key={file.id}>
            <span aria-hidden="true">{FILE_TYPES[file.ext].icon}</span>
            <span className="svc-file-name">
              {file.name}
              <small className="svc-muted">
                {file.ready
                  ? fileSize(file.size)
                  : tr(lang, 'Yuklash tugallanmagan', 'Upload incomplete', 'Загрузка не завершена')}
              </small>
            </span>
            {file.ready && (
              <Button
                size="sm"
                variant="outline"
                type="button"
                disabled={disabled || !!downloading}
                onClick={() => void download(file)}
              >
                <Download size={14} />
                {downloading === file.id
                  ? tr(lang, 'Yuklanmoqda…', 'Downloading…', 'Загрузка…')
                  : tr(lang, 'Yuklab olish', 'Download', 'Скачать')}
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={disabled}
                onClick={() => onRemove(file.id)}
                aria-label={tr(lang, 'Olib tashlash', 'Remove', 'Удалить') + ' ' + file.name}
              >
                <X size={15} />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p className="svc-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
