'use client';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Send, Upload } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { FileList } from '../services';
import { sendOrderFile, servicesAct } from '../service-files';
import { dueText, tr } from '@/lib/points';
import {
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  STATUS_LABEL,
  fileSize,
  isActive,
  type AdminOrder,
  type ServiceCard,
  type ServiceStatus,
  type ServicesAdminView,
} from '@/lib/services';

/* 💼 Sayt boshqaruvi → Pullik xizmatlar: buyurtmalar (narx aytish, to'lovni tasdiqlash, tayyor ishni yuklash,
   topshirish, yozishma, bekor qilish), yo'nalishlar katalogi (narx, muddat, yopish) va to'lov yo'riqnomasi. */
type Tab = 'orders' | 'catalog' | 'pay';
type Filter = 'open' | ServiceStatus | 'all';

export function ServicesAdmin() {
  const L = useL();
  const { request, toast } = useApp();
  const [view, setView] = useState<ServicesAdminView | null>(null),
    [error, setError] = useState(''),
    [tab, setTab] = useState<Tab>('orders'),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/services?admin=1'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <p className="error-state">{error}</p>;
  if (!view) return <div className="skeleton" style={{ height: 220 }} />;
  const waiting = view.orders.filter((o) => o.status === 'new' || o.status === 'paid').length;
  /** Bo'limni ishga tushirish yoki yana «tez orada» rejimiga qaytarish. */
  async function launch(open: boolean) {
    if (
      !window.confirm(
        open
          ? L(
              'Bo‘lim ishga tushirilsinmi? Talabalar buyurtma bera boshlaydi. Avval narxlar va to‘lov yo‘riqnomasini tekshiring.',
              'Launch the section? Students will start ordering. Check prices and payment instructions first.',
              'Запустить раздел? Студенты начнут оформлять заказы. Сначала проверьте цены и инструкцию по оплате.',
            )
          : L(
              'Bo‘lim «Tez orada» rejimiga qaytarilsinmi? Yangi buyurtma qabul qilinmaydi, ochiq buyurtmalar davom etadi.',
              'Switch back to “Launching soon”? New orders stop; open orders continue.',
              'Вернуть режим «Скоро запуск»? Новые заказы не принимаются, открытые продолжаются.',
            ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'launch',
        open,
      });
      setView(r.admin);
      toast(
        open
          ? L('🚀 Bo‘lim ishga tushdi!', '🚀 The section is live!', '🚀 Раздел запущен!')
          : L(
              '⏸ «Tez orada» rejimi yoqildi.',
              '⏸ “Launching soon” is on.',
              '⏸ Режим «Скоро запуск».',
            ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="svc-admin">
      <div className={'svc-launch' + (view.open ? ' is-open' : '')}>
        <span className={'bo-pill ' + (view.open ? 'on' : 'off')}>
          {view.open ? L('Ishlayapti', 'Live', 'Работает') : L('Tez orada', 'Coming soon', 'Скоро')}
        </span>
        <p>
          {view.open
            ? L(
                'Talabalar buyurtma beryapti.',
                'Students can place orders.',
                'Студенты оформляют заказы.',
              )
            : L(
                'Bo‘lim hali ishga tushmagan: talaba kirganda «🚀 Tez orada ishga tushadi» oynasi chiqadi va u taklif yuboradi. Takliflar «Kelgan xabarlar»ga 💡 belgisi bilan tushadi.',
                'Not launched yet: students see “🚀 Launching soon” and send suggestions. Suggestions arrive in the inbox marked 💡.',
                'Ещё не запущен: студенты видят «🚀 Скоро запуск» и отправляют идеи. Идеи приходят во «Входящие» со значком 💡.',
              )}
        </p>
        {view.open ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void launch(false)}>
            ⏸ {L('«Tez orada»ga qaytarish', 'Back to “coming soon”', 'Вернуть «Скоро»')}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => void launch(true)}>
            🚀 {L('Ishga tushirish', 'Launch', 'Запустить')}
          </Button>
        )}
      </div>
      <div className="bo-subtabs" role="tablist">
        {(
          [
            [
              'orders',
              '📦 ' + L('Buyurtmalar', 'Orders', 'Заказы') + (waiting ? ` (${waiting})` : ''),
            ],
            [
              'catalog',
              '🗂 ' + L('Yo‘nalishlar va narxlar', 'Directions and prices', 'Направления и цены'),
            ],
            [
              'pay',
              '💳 ' + L('To‘lov yo‘riqnomasi', 'Payment instructions', 'Инструкция по оплате'),
            ],
          ] as [Tab, string][]
        ).map(([id, name]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === 'orders' && <Orders view={view} reload={load} onView={setView} />}
      {tab === 'catalog' && <Catalog view={view} onView={setView} />}
      {tab === 'pay' && <PayInfo view={view} onView={setView} />}
      <p className="muted svc-used">
        {L('Saqlangan fayllar hajmi', 'Stored files', 'Объём файлов')}: {fileSize(view.used || 1)}
      </p>
    </div>
  );
}

const FILTERS: [Filter, [string, string, string]][] = [
  ['open', ['Ochiq', 'Open', 'Открытые']],
  ['new', ['Yangi', 'New', 'Новые']],
  ['paid', ['To‘lov tekshiruvi', 'Check payment', 'Проверка оплаты']],
  ['quoted', ['Narx aytilgan', 'Quoted', 'Цена названа']],
  ['work', ['Ishda', 'In progress', 'В работе']],
  ['done', ['Tayyor', 'Done', 'Готово']],
  ['cancel', ['Bekor', 'Cancelled', 'Отменённые']],
  ['all', ['Hammasi', 'All', 'Все']],
];

function Orders({
  view,
  reload,
  onView,
}: {
  view: ServicesAdminView;
  reload: () => Promise<void>;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang } = useApp();
  const [filter, setFilter] = useState<Filter>('open'),
    [q, setQ] = useState(''),
    [openId, setOpenId] = useState('');
  const count = (f: Filter) =>
    view.orders.filter((o) =>
      f === 'all' ? true : f === 'open' ? isActive(o.status) : o.status === f,
    ).length;
  const needle = q.trim().toLowerCase();
  const list = view.orders.filter(
    (o) =>
      (filter === 'all' || (filter === 'open' ? isActive(o.status) : o.status === filter)) &&
      (!needle ||
        (o.title + ' ' + o.name + ' ' + (o.group || '') + ' ' + (o.email || ''))
          .toLowerCase()
          .includes(needle)),
  );
  return (
    <>
      <div className="svc-admin-tools">
        <div className="lib-kinds" role="group" aria-label={L('Holat', 'Status', 'Статус')}>
          {FILTERS.map(([f, name]) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {tr(lang, ...name)} <em>{count(f)}</em>
            </button>
          ))}
        </div>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={L('Ism, guruh yoki mavzu', 'Name, group or topic', 'Имя, группа или тема')}
          aria-label={L('Buyurtmalardan qidirish', 'Search orders', 'Поиск заказов')}
        />
        <Button size="sm" variant="outline" onClick={() => void reload()}>
          <RefreshCw size={14} /> {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      {!list.length && (
        <p className="muted svc-empty">
          {L('Bu yerda hozircha buyurtma yo‘q.', 'No orders here yet.', 'Здесь пока нет заказов.')}
        </p>
      )}
      <ul className="svc-admin-list">
        {list.map((o) => (
          <li key={o.uk + o.id}>
            <AdminOrderCard
              order={o}
              card={view.catalog.find((k) => k.id === o.kind)}
              open={openId === o.uk + o.id}
              toggle={() => setOpenId(openId === o.uk + o.id ? '' : o.uk + o.id)}
              reload={reload}
              onView={onView}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function AdminOrderCard({
  order: o,
  card,
  open,
  toggle,
  reload,
  onView,
}: {
  order: AdminOrder;
  card?: ServiceCard;
  open: boolean;
  toggle: () => void;
  reload: () => Promise<void>;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [busy, setBusy] = useState(''),
    [price, setPrice] = useState(o.price || ''),
    [eta, setEta] = useState(o.eta || ''),
    [note, setNote] = useState(''),
    [msg, setMsg] = useState(''),
    [link, setLink] = useState(o.link || ''),
    [progress, setProgress] = useState('');
  const [icon, name] = STATUS_LABEL[o.status];
  async function act(input: Record<string, unknown>, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        uk: o.uk,
        id: o.id,
        ...input,
      });
      onView(r.admin);
      if (done) toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  async function upload(list: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length) return;
    setBusy('upload');
    try {
      for (const [i, f] of files.entries()) {
        if (f.size > FILE_MAX.out) {
          toast(L('Fayl 30 MB dan oshmasin: ', 'Max 30 MB: ', 'Не больше 30 МБ: ') + f.name);
          continue;
        }
        await sendOrderFile(request, 'admin', o.uk + '/' + o.id, { uk: o.uk, id: o.id }, f, (x) =>
          setProgress(`${i + 1}/${files.length} · ${Math.round(x * 100)}%`),
        );
      }
      await reload();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
      setProgress('');
    }
  }
  const ins = o.files.filter((f) => f.side === 'in'),
    outs = o.files.filter((f) => f.side === 'out');
  return (
    <article className={'panel svc-aorder is-' + o.status + (open ? ' is-open' : '')}>
      <button type="button" className="svc-aorder-head" onClick={toggle} aria-expanded={open}>
        <span className={'svc-status is-' + o.status}>
          {icon} {tr(lang, ...name)}
        </span>
        <span className="svc-aorder-title">
          <b>
            {card?.icon} {o.title}
          </b>
          <small>
            {o.name}
            {o.group ? ' · ' + o.group : ''} · {dueText(o.at, lang).date}
            {o.price ? ' · 💰 ' + o.price : ''}
          </small>
        </span>
      </button>
      {open && (
        <div className="svc-aorder-body">
          <dl className="svc-dl">
            <dt>{L('Yo‘nalish', 'Direction', 'Направление')}</dt>
            <dd>{card ? card.icon + ' ' + tr(lang, ...card.name) : o.kind}</dd>
            <dt>{L('Buyurtmachi', 'Customer', 'Заказчик')}</dt>
            <dd>
              {o.name}
              {o.group ? ' · ' + o.group : ''}
              {o.email ? ' · ' + o.email : ''}
            </dd>
            {o.contact && (
              <>
                <dt>{L('Aloqa', 'Contact', 'Контакт')}</dt>
                <dd>{o.contact}</dd>
              </>
            )}
            {o.due && (
              <>
                <dt>{L('Kerakli sana', 'Needed by', 'Нужно к')}</dt>
                <dd>{o.due}</dd>
              </>
            )}
            {o.paidAt && (
              <>
                <dt>{L('To‘lov', 'Payment', 'Оплата')}</dt>
                <dd>
                  {dueText(o.paidAt, lang).date}
                  {o.paidNote ? ' · ' + o.paidNote : ''}
                </dd>
              </>
            )}
            {o.reason && (
              <>
                <dt>{L('Bekor qilish sababi', 'Cancel reason', 'Причина отмены')}</dt>
                <dd>{o.reason}</dd>
              </>
            )}
          </dl>
          <p className="svc-text">{o.text}</p>
          {!!ins.length && (
            <>
              <b className="svc-sub">
                📎 {L('Buyurtmachi fayllari', 'Customer files', 'Файлы заказчика')}
              </b>
              <FileList files={ins} o={o} removable team={() => void reload()} />
            </>
          )}

          {(o.status === 'new' || o.status === 'quoted') && (
            <form
              className="svc-quote"
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  { op: 'quote', price: price.trim(), eta: eta.trim(), note: note.trim() },
                  'quote',
                  L('Narx yuborildi.', 'Price sent.', 'Цена отправлена.'),
                ).then((ok) => ok && setNote(''));
              }}
            >
              <b className="svc-sub">💰 {L('Narx va muddat', 'Price and timing', 'Цена и срок')}</b>
              <div className="svc-form-row">
                <label>
                  {L('Narx', 'Price', 'Цена')}
                  <input
                    className="input"
                    required
                    maxLength={60}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="80 000 so‘m"
                  />
                </label>
                <label>
                  {L('Tayyor bo‘lish muddati', 'Ready in', 'Срок готовности')}
                  <input
                    className="input"
                    maxLength={60}
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder={L('3 kun', '3 days', '3 дня')}
                  />
                </label>
              </div>
              <label>
                {L('Izoh (ixtiyoriy)', 'Note (optional)', 'Комментарий')}
                <input
                  className="input"
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <Button type="submit" size="sm" disabled={!!busy || !price.trim()}>
                {o.status === 'quoted'
                  ? L('Narxni yangilash', 'Update the price', 'Обновить цену')
                  : L('Narxni yuborish', 'Send the price', 'Отправить цену')}
              </Button>
            </form>
          )}
          {(o.status === 'quoted' || o.status === 'paid') && (
            <div className="svc-row">
              <Button
                size="sm"
                disabled={!!busy}
                onClick={() =>
                  void act(
                    { op: 'confirm' },
                    'confirm',
                    L(
                      'To‘lov tasdiqlandi — ish boshlandi.',
                      'Payment confirmed.',
                      'Оплата подтверждена.',
                    ),
                  )
                }
              >
                ✅ {L('To‘lovni tasdiqlash', 'Confirm payment', 'Подтвердить оплату')}
              </Button>
            </div>
          )}

          {(o.status === 'work' || o.status === 'done' || o.status === 'paid') && (
            <div className="svc-deliver">
              <b className="svc-sub">📥 {L('Tayyor ish', 'Result', 'Результат')}</b>
              {!!outs.length && (
                <FileList files={outs} o={o} removable team={() => void reload()} />
              )}
              {outs.length < FILES_PER_ORDER.out && (
                <label className="svc-attach-btn">
                  <Upload size={16} />
                  {progress ||
                    L(
                      'Fayl yuklash (30 MB gacha)',
                      'Upload files (up to 30 MB)',
                      'Загрузить файлы (до 30 МБ)',
                    )}
                  <input
                    type="file"
                    multiple
                    accept={FILE_ACCEPT}
                    disabled={!!busy}
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
              <form
                className="svc-msg-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(
                    { op: 'link', link: link.trim() },
                    'link',
                    L('Saqlandi.', 'Saved.', 'Сохранено.'),
                  );
                }}
              >
                <input
                  className="input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={L(
                    'Havola (katta fayl, sayt, Google Drive) — https://…',
                    'Link (big file, website, Google Drive) — https://…',
                    'Ссылка (большой файл, сайт, Google Drive) — https://…',
                  )}
                  aria-label={L('Natija havolasi', 'Result link', 'Ссылка на результат')}
                />
                <Button type="submit" size="sm" variant="outline" disabled={!!busy}>
                  {L('Saqlash', 'Save', 'Сохранить')}
                </Button>
              </form>
              {o.link && (
                <a className="svc-link" href={o.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> {o.link}
                </a>
              )}
              <div className="svc-row">
                {o.status !== 'done' ? (
                  <Button
                    size="sm"
                    disabled={!!busy || (!outs.length && !o.link)}
                    onClick={() =>
                      void act(
                        { op: 'status', status: 'done' },
                        'done',
                        L('Talabaga yuborildi.', 'Sent to the student.', 'Отправлено студенту.'),
                      )
                    }
                  >
                    ✅{' '}
                    {L(
                      'Tayyor — talabaga yuborish',
                      'Ready — send to the student',
                      'Готово — отправить',
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => void act({ op: 'status', status: 'work' }, 'work')}
                  >
                    🛠 {L('Qayta ishga olish', 'Back to work', 'Вернуть в работу')}
                  </Button>
                )}
              </div>
            </div>
          )}

          <b className="svc-sub">💬 {L('Yozishma', 'Conversation', 'Переписка')}</b>
          {o.msgs.length ? (
            <ul className="svc-msgs">
              {o.msgs.map((m) => (
                <li key={m.id} className={m.from === 'team' ? 'is-me' : 'is-team'}>
                  <small>
                    {m.from === 'team' ? L('Jamoa', 'Team', 'Команда') : o.name} ·{' '}
                    {dueText(m.at, lang).date}
                  </small>
                  <p>{m.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{L('Xabar yo‘q.', 'No messages.', 'Сообщений нет.')}</p>
          )}
          <form
            className="svc-msg-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act({ op: 'msg', text: msg.trim() }, 'msg')) setMsg('');
            }}
          >
            <input
              className="input"
              maxLength={1000}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={L(
                'Buyurtmachiga xabar…',
                'Message to the customer…',
                'Сообщение заказчику…',
              )}
              aria-label={L(
                'Buyurtmachiga xabar',
                'Message to the customer',
                'Сообщение заказчику',
              )}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!!busy || !msg.trim()}
              aria-label={L('Yuborish', 'Send', 'Отправить')}
            >
              <Send size={15} />
            </Button>
          </form>

          <footer className="svc-order-actions">
            {o.status !== 'cancel' && (
              <Button
                size="sm"
                variant="outline"
                disabled={!!busy}
                onClick={() => {
                  const reason = window.prompt(
                    L(
                      'Bekor qilish sababi (talabaga ko‘rinadi):',
                      'Reason (the student sees it):',
                      'Причина (увидит студент):',
                    ),
                  );
                  if (reason && reason.trim().length >= 3)
                    void act({ op: 'cancel', reason: reason.trim() }, 'cancel');
                }}
              >
                ✖ {L('Bekor qilish', 'Cancel', 'Отменить')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="danger"
              disabled={!!busy}
              onClick={() => {
                if (
                  window.confirm(
                    L(
                      'Buyurtma va fayllari butunlay o‘chirilsinmi?',
                      'Delete the order and its files for good?',
                      'Удалить заказ и файлы навсегда?',
                    ),
                  )
                )
                  void act({ op: 'remove' }, 'remove');
              }}
            >
              {L('O‘chirish', 'Delete', 'Удалить')}
            </Button>
          </footer>
        </div>
      )}
    </article>
  );
}

function Catalog({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      view.catalog.map((k) => [k.id, { price: k.price || '', days: k.days || '', off: !!k.off }]),
    ),
  );
  const [busy, setBusy] = useState('');
  async function save(kind: string) {
    setBusy(kind);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'catalog',
        kind,
        ...rows[kind],
      });
      onView(r.admin);
      toast(L('Saqlandi.', 'Saved.', 'Сохранено.'));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <p className="muted">
        {L(
          'Narx va muddat katalog kartasida ko‘rinadi («50 000 so‘mdan», «2–3 kun»). Bo‘sh qoldirsangiz — ko‘rinmaydi. «Yopiq» belgilangan yo‘nalish talabalarga ko‘rinmaydi.',
          'The price and timing appear on the catalog card (“from 50 000 so‘m”, “2–3 days”). Leave empty to hide. “Closed” directions are hidden from students.',
          'Цена и срок видны на карточке («от 50 000 сум», «2–3 дня»). Пусто — не показывается. «Закрыто» — направление скрыто от студентов.',
        )}
      </p>
      <ul className="svc-cat-admin">
        {view.catalog.map((k) => {
          const r = rows[k.id];
          return (
            <li key={k.id} className={r.off ? 'is-off' : ''}>
              <b>
                {k.icon} {tr(lang, ...k.name)}
                <small className="svc-cat-count">
                  👥 {k.used} · 🙋 {k.wants}
                </small>
              </b>
              <input
                className="input"
                maxLength={60}
                value={r.price}
                onChange={(e) => setRows({ ...rows, [k.id]: { ...r, price: e.target.value } })}
                placeholder={L('Narx (masalan 50 000 so‘mdan)', 'Price', 'Цена')}
                aria-label={L('Narx', 'Price', 'Цена') + ': ' + tr(lang, ...k.name)}
              />
              <input
                className="input"
                maxLength={40}
                value={r.days}
                onChange={(e) => setRows({ ...rows, [k.id]: { ...r, days: e.target.value } })}
                placeholder={L('Muddat (2–3 kun)', 'Timing', 'Срок')}
                aria-label={L('Muddat', 'Timing', 'Срок') + ': ' + tr(lang, ...k.name)}
              />
              <label className="svc-off">
                <input
                  type="checkbox"
                  checked={r.off}
                  onChange={(e) => setRows({ ...rows, [k.id]: { ...r, off: e.target.checked } })}
                />
                {L('Yopiq', 'Closed', 'Закрыто')}
              </label>
              <Button size="sm" disabled={!!busy} onClick={() => void save(k.id)}>
                {L('Saqlash', 'Save', 'Сохранить')}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function PayInfo({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { request, toast } = useApp();
  const [how, setHow] = useState(view.how),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="svc-pay-admin"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
            op: 'info',
            how: how.trim(),
          });
          onView(r.admin);
          toast(L('Saqlandi.', 'Saved.', 'Сохранено.'));
        } catch (err) {
          toast((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {L(
          'To‘lov yo‘riqnomasi (narx aytilgan buyurtmada talabaga ko‘rinadi)',
          'Payment instructions (shown to the student once a price is quoted)',
          'Инструкция по оплате (видна студенту после того, как названа цена)',
        )}
        <textarea
          className="input"
          rows={5}
          maxLength={1500}
          value={how}
          onChange={(e) => setHow(e.target.value)}
          placeholder={L(
            'Masalan: Click yoki Payme orqali … kartaga o‘tkazing va «To‘lov qildim» tugmasini bosing.',
            'E.g. pay by Click or Payme to card … and press “I paid”.',
            'Например: переведите через Click или Payme на карту … и нажмите «Я оплатил».',
          )}
        />
      </label>
      <Button type="submit" disabled={busy}>
        {L('Saqlash', 'Save', 'Сохранить')}
      </Button>
      <small className="muted">
        {L(
          'Click ulanganda to‘lov avtomatik tasdiqlanadi. Play Market ilovasida bu bo‘lim ko‘rinmaydi (Google qoidasi) — buyurtmalar saytda beriladi.',
          'Once Click is connected, payments are confirmed automatically. This section is hidden in the Play Market app (Google rules) — orders are placed on the website.',
          'После подключения Click оплата подтверждается автоматически. В приложении Play Market раздел скрыт (правила Google) — заказы оформляются на сайте.',
        )}
      </small>
    </form>
  );
}
