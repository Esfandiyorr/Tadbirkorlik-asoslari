'use client';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  Bot,
  CircleCheck,
  CircleX,
  ClipboardList,
  ExternalLink,
  MessageCircle,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { openSiteImageEditor, SiteVisual } from '../site-content';
import { visualPath } from '@/lib/site-visuals';
import { Chat, FileList } from '../services';
import { Receipts } from '../receipt';
import { sendOrderFile, servicesAct } from '../service-files';
import { dueText, tr } from '@/lib/points';
import {
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  STATUS_LABEL,
  PRODUCTS,
  fileSize,
  formatSum,
  hasTrialDebt,
  isActive,
  isProduct,
  PREMIUM_TERMS,
  serviceKind,
  termText,
  type ProductId,
  type AdminOrder,
  type ServicesAdminView,
  type Tri,
} from '@/lib/services';

/* 💼 Sayt boshqaruvi → Pullik xizmatlar:
   • 💬 Buyurtmalar — Telegram'dagi kabi: chapda buyurtmalar (kim, qaysi xizmat, oxirgi xabar), o'ngda tanlangan
     buyurtma: buyurtmachi nima yozgani (birinchi xabar), yozishma, to'lovni tasdiqlash, tayyor ishni yuklash va
     «📤 Mijozga yuborish»;
   • 🗂 Yo'nalishlar — katalog (odatdagi narx, muddat, yopish);
   • ⚙️ To'lov yo'riqnomasi — buyurtmachiga ko'rinadigan matn. */
type Tab = 'chats' | 'catalog' | 'settings';
type Filter = 'todo' | 'work' | 'review' | 'pay' | 'done' | 'cancel' | 'all';

const lastFrom = (o: AdminOrder) => o.msgs[o.msgs.length - 1]?.from;
/** Javob kutayotgan buyurtma: yangi (hali yozilmagan) yoki oxirgi xabar buyurtmachidan. */
const unread = (o: AdminOrder) =>
  o.status !== 'cancel' &&
  o.status !== 'done' &&
  (lastFrom(o) === 'user' || (!o.msgs.length && o.status === 'work'));
/** Buyurtmachi «To'lov qildim» degan, lekin hali tasdiqlanmagan. */
const payCheck = (o: AdminOrder) => o.status !== 'cancel' && !!o.paidAt && !o.payOk;
const needsMe = (o: AdminOrder) => unread(o) || payCheck(o);
const FILTERS: [Filter, Tri, (o: AdminOrder) => boolean, LucideIcon][] = [
  ['all', ['Hammasi', 'All', 'Все'], () => true, ClipboardList],
  ['todo', ['Javob kutmoqda', 'Needs reply', 'Ждут ответа'], needsMe, MessageCircle],
  ['work', ['Tayyorlanmoqda', 'In progress', 'Готовятся'], (o) => o.status === 'work', Bot],
  ['review', ['Yuborilgan', 'Delivered', 'Отправлены'], (o) => o.status === 'review', Send],
  ['pay', ['Chek keldi', 'Receipts', 'Чеки'], payCheck, Receipt],
  ['done', ['Yakunlangan', 'Completed', 'Завершённые'], (o) => o.status === 'done', CircleCheck],
  ['cancel', ['Bekor', 'Cancelled', 'Отменённые'], (o) => o.status === 'cancel', CircleX],
];
/** Tepadagi rangli kartalar (bosilsa — jadval shu bo'yicha saralanadi). */
const TILES: [Filter, string][] = [
  ['todo', 'orange'],
  ['work', 'violet'],
  ['pay', 'pink'],
  ['done', 'teal'],
];
/** Jadvaldagi qisqa holat nomi. */
const SHORT_STATUS: Record<AdminOrder['status'], Tri> = {
  work: ['Tayyorlanmoqda', 'In progress', 'Готовится'],
  review: ['Yuborilgan', 'Delivered', 'Отправлен'],
  done: ['Yakunlangan', 'Completed', 'Завершён'],
  cancel: ['Bekor', 'Cancelled', 'Отменён'],
};
const kindTitle = (lang: Parameters<typeof tr>[0], id: string) => {
  const k = serviceKind(id);
  return k ? k.icon + ' ' + tr(lang, ...k.name) : id;
};
const keyOf = (o: AdminOrder) => o.uk + '/' + o.id;

export function ServicesAdmin() {
  const L = useL();
  const { request, toast, refresh } = useApp();
  const [view, setView] = useState<ServicesAdminView | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('chats');
  const [busy, setBusy] = useState(false);
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
  const todo = view.orders.filter(needsMe).length;
  /** 🔒 Bo'limni vaqtincha yopish (menyudan olib tashlash, buyurtmalarni to'xtatish) yoki qayta ochish. */
  async function show(shown: boolean) {
    if (
      !window.confirm(
        shown
          ? L(
              'Bo‘lim ochilsinmi? «Pullik xizmatlar» menyuda va bosh sahifada yana ko‘rinadi.',
              'Open the section? “Paid services” returns to the menu and the home page.',
              'Открыть раздел? «Платные услуги» снова появятся в меню и на главной.',
            )
          : L(
              'Bo‘lim vaqtincha yopilsinmi? Menyudan yo‘qoladi, foydalanuvchilar hech narsa yubora olmaydi (ma’lumotlar o‘chmaydi).',
              'Close the section for now? It leaves the menu and users cannot send anything (no data is deleted).',
              'Временно закрыть раздел? Он исчезнет из меню, пользователи ничего не смогут отправить (данные не удаляются).',
            ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'show',
        shown,
      });
      setView(r.admin);
      void refresh();
      toast(
        shown
          ? L('👁 Bo‘lim ochildi', '👁 The section is open', '👁 Раздел открыт')
          : L('🔒 Bo‘lim vaqtincha yopildi', '🔒 The section is closed', '🔒 Раздел закрыт'),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  /** Bo'limni ishga tushirish yoki yana «tez orada» rejimiga qaytarish. */
  async function launch(open: boolean, trial = false) {
    if (
      !window.confirm(
        trial
          ? L(
              'Sinov boshlansinmi? Talabalar oldindan to‘lamaydi. Har bir topshirilgan xizmat 2 000 so‘m qarz bo‘ladi.',
              'Start the trial? Each delivered student order adds UZS 2,000 to their debt.',
              'Начать пробный режим? Каждый выполненный студенческий заказ добавит долг в 2 000 сум.',
            )
          : open
            ? L(
                'Bo‘lim ishga tushirilsinmi? Foydalanuvchilar buyurtma bera boshlaydi. Avval to‘lov yo‘riqnomasini tekshiring.',
                'Launch the section? Users will start placing orders. Check the payment instructions first.',
                'Запустить раздел? Пользователи начнут делать заказы. Сначала проверьте инструкцию по оплате.',
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
        trial,
      });
      setView(r.admin);
      void refresh();
      toast(
        trial
          ? L('Sinov boshlandi', 'Trial started', 'Пробный режим запущен')
          : open
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
      <div className={'svc-launch svc-shown' + (view.shown ? ' is-open' : ' is-closed')}>
        <span className={'bo-pill ' + (view.shown ? 'on' : 'off')}>
          {view.shown
            ? L('Menyuda', 'In the menu', 'В меню')
            : L('Vaqtincha yopiq', 'Temporarily closed', 'Временно закрыт')}
        </span>
        <p>
          {view.shown
            ? L(
                'Bo‘lim foydalanuvchilarga ko‘rinadi (menyu va bosh sahifada).',
                'Users see the section (menu and home page).',
                'Раздел виден пользователям (меню и главная).',
              )
            : L(
                'Bo‘lim yashirilgan: menyuda yo‘q, buyurtmalar qabul qilinmaydi. Eski buyurtmalar saqlanib turadi — bu yerdan boshqarishingiz mumkin.',
                'Hidden: not in the menu, orders are refused. Existing orders are kept — you can manage them here.',
                'Скрыт: нет в меню, заказы не принимаются. Существующие заказы сохраняются — управлять можно здесь.',
              )}
        </p>
        {view.shown ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void show(false)}>
            🔒 {L('Vaqtincha yopish', 'Close for now', 'Временно закрыть')}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => void show(true)}>
            👁 {L('Bo‘limni ochish', 'Open the section', 'Открыть раздел')}
          </Button>
        )}
      </div>
      <div className={'svc-launch' + (view.open ? ' is-open' : '')}>
        <span className={'bo-pill ' + (view.open ? 'on' : 'off')}>
          {view.trial
            ? L('Sinov rejimi', 'Trial mode', 'Пробный режим')
            : view.open
              ? L('Ishlayapti', 'Live', 'Работает')
              : L('Tez orada', 'Coming soon', 'Скоро')}
        </span>
        <p>
          {view.trial
            ? L(
                'Har bir topshirilgan xizmat uchun talabaga 2 000 so‘m qarz yoziladi. To‘liq rejimda qarz to‘langani tasdiqlangach yangi buyurtma ochiladi.',
                'Each delivered service adds UZS 2,000 of student debt. In full mode, new orders require confirmed settlement.',
                'За каждую выполненную услугу начисляется долг в 2 000 сум. В полном режиме новые заказы доступны после подтверждения оплаты.',
              )
            : view.open
              ? L(
                  'Foydalanuvchilar buyurtma beryapti: har bir buyurtma shu yerga yozishma bo‘lib keladi, ularda «🤖 Sun’iy intellekt yordamida tayyorlanmoqda» yozuvi turadi.',
                  'Users are ordering: each order arrives here as a chat; they see “🤖 Being prepared with AI”.',
                  'Пользователи делают заказы: каждый приходит сюда как переписка; у них отображается «🤖 Готовится с помощью ИИ».',
                )
              : L(
                  'Bo‘lim hali ishga tushmagan: foydalanuvchi kirganda «🚀 Tez orada» oynasi chiqadi va u taklif yuboradi. Takliflar «Kelgan xabarlar»ga 💡 belgisi bilan tushadi.',
                  'Not launched yet: users see “🚀 Launching soon” and send suggestions. Suggestions arrive in the inbox marked 💡.',
                  'Ещё не запущен: пользователи видят «🚀 Скоро запуск» и отправляют идеи. Идеи приходят во «Входящие» со значком 💡.',
                )}
        </p>
        {!view.trial && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void launch(true, true)}
          >
            {L('Sinovni boshlash', 'Start trial', 'Начать пробный режим')}
          </Button>
        )}
        {view.trial || !view.open ? (
          <Button size="sm" disabled={busy} onClick={() => void launch(true)}>
            {view.trial
              ? L('To‘liq rejimga o‘tish', 'Switch to full mode', 'Перейти в полный режим')
              : L('Ishga tushirish', 'Launch', 'Запустить')}
          </Button>
        ) : null}
        {view.open && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void launch(false)}>
            ⏸ {L('«Tez orada»ga qaytarish', 'Back to “coming soon”', 'Вернуть «Скоро»')}
          </Button>
        )}
      </div>
      <div className="bo-subtabs" role="tablist">
        {(
          [
            ['chats', '💬 ' + L('Buyurtmalar', 'Orders', 'Заказы') + (todo ? ` (${todo})` : '')],
            ['catalog', '🗂 ' + L('Yo‘nalishlar', 'Directions', 'Направления')],
            [
              'settings',
              '⚙️ ' + L('To‘lov yo‘riqnomasi', 'Payment instructions', 'Инструкция по оплате'),
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
      {tab === 'chats' && <Inbox view={view} reload={load} onView={setView} />}
      {tab === 'catalog' && <Catalog view={view} onView={setView} />}
      {tab === 'settings' && <Settings view={view} onView={setView} />}
      <p className="muted svc-used">
        {L('Saqlangan fayllar hajmi', 'Stored files', 'Объём файлов')}: {fileSize(view.used || 1)}
      </p>
    </div>
  );
}

/** 💬 Buyurtmalar: tepada rangli hisob kartalari va dumaloq filtr tugmalari, ostida jadval; qator bosilsa buyurtma
    yon panelda (telefonda — butun ekran) ochiladi: yozishma, to'lov, natijani yuborish. */
function Inbox({
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
  const [filter, setFilter] = useState<Filter>(() => (view.orders.some(needsMe) ? 'todo' : 'all'));
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState('');
  const test = FILTERS.find(([f]) => f === filter)![2];
  const needle = q.trim().toLowerCase();
  // ochiq turgan buyurtma amal bajarilgach boshqa filtrga o'tsa ham, yopilguncha ro'yxatda qoladi
  const list = view.orders.filter(
    (o) =>
      (test(o) || openKey === keyOf(o)) &&
      (!needle ||
        (o.title + ' ' + o.name + ' ' + (o.group || '') + ' ' + o.text)
          .toLowerCase()
          .includes(needle)),
  );
  const current = view.orders.find((o) => keyOf(o) === openKey);
  const count = (f: Filter) => view.orders.filter(FILTERS.find(([x]) => x === f)![2]).length;
  // Esc — buyurtma oynasini yopish
  useEffect(() => {
    if (!openKey) return;
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setOpenKey('');
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [openKey]);
  const payCell = (o: AdminOrder) =>
    o.status === 'cancel'
      ? '—'
      : o.payOk
        ? '✅ ' + L('Qabul qilingan', 'Accepted', 'Принят')
        : o.paidAt
          ? '💳 ' + L('Chek keldi', 'Receipt sent', 'Чек пришёл')
          : o.deliveredAt || o.status !== 'work'
            ? L('Kutilmoqda', 'Waiting', 'Ожидается')
            : '—';
  return (
    <div className={'svc-orders' + (current ? ' has-open' : '')}>
      <ul className="svc-dash-tiles">
        {TILES.map(([f, tone]) => {
          const [, name, , Icon] = FILTERS.find(([x]) => x === f)!;
          return (
            <li key={f}>
              <button
                type="button"
                className={'svc-dash-tile is-' + tone + (filter === f ? ' is-on' : '')}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                <Icon size={30} aria-hidden="true" />
                <b>{count(f)}</b>
                <span>{tr(lang, ...name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="svc-admin-tools">
        <div className="svc-round-filters" role="group" aria-label={L('Holat', 'Status', 'Статус')}>
          {FILTERS.map(([f, name, , Icon]) => (
            <button
              key={f}
              type="button"
              className={'svc-round' + (filter === f ? ' is-on' : '')}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              <span className="svc-round-ic" aria-hidden="true">
                <Icon size={18} />
              </span>
              <small>
                {tr(lang, ...name)} <em>{count(f)}</em>
              </small>
            </button>
          ))}
        </div>
        <label className="svc-table-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L('Ism, guruh yoki mavzu', 'Name, group or topic', 'Имя, группа или тема')}
            aria-label={L('Buyurtmalardan qidirish', 'Search orders', 'Поиск заказов')}
          />
        </label>
        <Button size="sm" variant="outline" onClick={() => void reload()}>
          <RefreshCw size={14} /> {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      <section className="svc-table-card" aria-labelledby="svc-table-h">
        <h3 id="svc-table-h" className="svc-table-title">
          {tr(lang, ...FILTERS.find(([x]) => x === filter)![1])} · {list.length}
        </h3>
        {list.length ? (
          <div className="svc-table-wrap">
            <table className="svc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{L('Mijoz', 'Client', 'Клиент')}</th>
                  <th>{L('Xizmat', 'Service', 'Услуга')}</th>
                  <th>{L('Mavzu', 'Topic', 'Тема')}</th>
                  <th>{L('Sana', 'Date', 'Дата')}</th>
                  <th>{L('Holat', 'Status', 'Статус')}</th>
                  <th>{L('To‘lov', 'Payment', 'Оплата')}</th>
                  <th>{L('Summa', 'Amount', 'Сумма')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o, i) => (
                  <tr
                    key={keyOf(o)}
                    className={
                      'svc-thread' +
                      (keyOf(o) === openKey ? ' is-on' : '') +
                      (unread(o) ? ' is-unread' : '')
                    }
                    tabIndex={0}
                    aria-label={o.name + ' — ' + o.title}
                    onClick={() => setOpenKey(keyOf(o))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenKey(keyOf(o));
                      }
                    }}
                  >
                    <td className="svc-td-n">{i + 1}</td>
                    <td className="svc-td-who">
                      <b>
                        {unread(o) && (
                          <i
                            className="svc-dot"
                            aria-label={L('Javob kutmoqda', 'Needs reply', 'Ждёт ответа')}
                          />
                        )}
                        {o.name}
                      </b>
                      <small>{o.group || o.email || ''}</small>
                    </td>
                    <td className="svc-td-kind">{kindTitle(lang, o.kind)}</td>
                    <td className="svc-td-title">
                      {o.title}
                      {!!o.msgs.length && (
                        <small>
                          {(o.msgs[o.msgs.length - 1].from === 'team'
                            ? L('Siz: ', 'You: ', 'Вы: ')
                            : '') + o.msgs[o.msgs.length - 1].text}
                        </small>
                      )}
                    </td>
                    <td className="svc-td-date">{dueText(o.at, lang).date}</td>
                    <td className="svc-td-status">
                      <span className={'svc-chip is-' + o.status}>
                        {tr(lang, ...SHORT_STATUS[o.status])}
                      </span>
                    </td>
                    <td
                      className={
                        'svc-thread-flags' +
                        (payCheck(o) ? ' is-check' : '') +
                        (payCell(o) === '—' ? ' is-empty' : '')
                      }
                    >
                      {payCell(o)}
                    </td>
                    <td className={'svc-td-sum' + (o.budget > 0 ? '' : ' is-empty')}>
                      {o.budget > 0 ? formatSum(o.budget) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted svc-empty">
            {L(
              'Bu yerda hozircha buyurtma yo‘q.',
              'No orders here yet.',
              'Здесь пока нет заказов.',
            )}
          </p>
        )}
      </section>
      {current && (
        // 📂 buyurtma: yon panelda (telefonda — butun ekran) yozishma va barcha amallar
        <div className="svc-drawer">
          <button
            type="button"
            className="svc-drawer-scrim"
            aria-label={L('Yopish', 'Close', 'Закрыть')}
            onClick={() => setOpenKey('')}
          />
          <div className="svc-drawer-panel">
            <AdminChat
              key={keyOf(current)}
              order={current}
              reload={reload}
              onView={onView}
              onBack={() => setOpenKey('')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AdminChat({
  order: o,
  reload,
  onView,
  onBack,
}: {
  order: AdminOrder;
  reload: () => Promise<void>;
  onView: (v: ServicesAdminView) => void;
  onBack: () => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState(o.link || '');
  const [progress, setProgress] = useState('');
  const [banAccount, setBanAccount] = useState(false);
  const [icon, name] = STATUS_LABEL[o.status];
  const k = serviceKind(o.kind);
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
    } catch (e) {
      toast((e as Error).message);
    } finally {
      await reload();
      setBusy('');
      setProgress('');
    }
  }
  const removeFile = async (f: { id: string }) => {
    await act({ op: 'unfile', fid: f.id }, 'unfile');
  };
  const ins = o.files.filter((f) => f.side === 'in'),
    outs = o.files.filter((f) => f.side === 'out');
  const ready = outs.length > 0 || !!o.link;
  // 🛍 mahsulot (yakuniy test, Premium): to'lov tasdiqlanishi bilan o'zi ochiladi — natija yuklanmaydi
  const product = isProduct(o.kind);
  const premium =
    product && !!PRODUCTS[o.kind as ProductId].premium && !PRODUCTS[o.kind as ProductId].days;
  const busyNow = !!busy;
  return (
    <article
      className={'panel svc-chat is-' + o.status}
      style={(k ? { '--c1': k.tone[0], '--c2': k.tone[1] } : {}) as CSSProperties}
      aria-label={o.title}
    >
      <header className="svc-chat-head">
        <button
          type="button"
          className="svc-chat-back"
          onClick={onBack}
          aria-label={L('Ro‘yxatga qaytish', 'Back to the list', 'Назад к списку')}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="svc-thread-ava" aria-hidden="true">
          {k?.icon || '✨'}
        </span>
        <span className="svc-chat-title">
          <b>{o.name}</b>
          <small className="muted">
            {[o.group, o.email, o.contact && '📞 ' + o.contact].filter(Boolean).join(' · ')}
          </small>
        </span>
        <span className={'svc-status is-' + o.status}>
          {icon} {tr(lang, ...name)}
        </span>
      </header>
      <p className="svc-order-meta">
        <span>{kindTitle(lang, o.kind)}</span>
        {o.budget > 0 && (
          <span>
            💰 {L('To‘lagan', 'Paid', 'Оплатил')}: <b>{formatSum(o.budget)}</b>
          </span>
        )}
        {o.due && <span>📅 {o.due}</span>}
        <span>🕐 {dueText(o.at, lang).date}</span>
      </p>

      {o.status !== 'cancel' && (!o.trial || o.trialChargedAt) && (
        <div className={'svc-pay is-admin' + (o.payOk ? ' is-ok' : '')}>
          {o.payOk ? (
            <>
              <b>
                ✅ {L('To‘lov qabul qilingan', 'Payment accepted', 'Оплата принята')}
                {o.budget ? ': ' + formatSum(o.budget) : ''}
                {o.days ? ' · 💎 ' + termText(o.days, lang) : ''} · {dueText(o.payOk, lang).date}
              </b>
              <Receipts o={o.uk + '/' + o.id} files={o.files.filter((f) => f.side === 'pay')} />
            </>
          ) : o.paidAt ? (
            <>
              <b>
                🧾{' '}
                {L(
                  'Chek keldi — tekshiring',
                  'A receipt arrived — check it',
                  'Пришёл чек — проверьте',
                )}
                : {formatSum(o.budget)}
              </b>
              {o.paidNote && <p className="muted">💬 {o.paidNote}</p>}
              <Receipts o={o.uk + '/' + o.id} files={o.files.filter((f) => f.side === 'pay')} />
              <div className="svc-row">
                {premium ? (
                  // 💎 Premium: muddatni shu yerda tanlaysiz — obuna o'zi yoqiladi
                  PREMIUM_TERMS.map((days) => (
                    <Button
                      key={days}
                      size="sm"
                      disabled={busyNow}
                      onClick={() =>
                        void act(
                          { op: 'confirm', days },
                          'confirm',
                          L('💎 Premium yoqildi.', '💎 Premium is on.', '💎 Подписка включена.'),
                        )
                      }
                    >
                      ✅{' '}
                      {days >= 365
                        ? L('1 yilga ochish', 'Open for 1 year', 'Открыть на 1 год')
                        : L('1 oyga ochish', 'Open for 1 month', 'Открыть на 1 месяц')}
                    </Button>
                  ))
                ) : (
                  <Button
                    size="sm"
                    disabled={busyNow}
                    onClick={() =>
                      void act(
                        { op: 'confirm' },
                        'confirm',
                        product
                          ? L('To‘lov qabul qilindi.', 'Payment accepted.', 'Оплата принята.')
                          : L(
                              'To‘lov qabul qilindi — mijozga yuklab olish ochildi.',
                              'Payment accepted — download opened for the client.',
                              'Оплата принята — заказчику открыто скачивание.',
                            ),
                      )
                    }
                  >
                    ✅{' '}
                    {product
                      ? L('Qabul qilish — ochish', 'Accept — unlock', 'Принять — открыть')
                      : L(
                          'Qabul qilish — yuklashni ochish',
                          'Accept — open download',
                          'Принять — открыть скачивание',
                        )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyNow}
                  onClick={() => {
                    const why = window.prompt(
                      L(
                        `${o.name}ning cheki qabul qilinmasinmi? Sababini yozing (ixtiyoriy) — buyurtmachiga boradi.`,
                        `Reject ${o.name}'s receipt? Write a reason (optional) — the client gets it.`,
                        `Не принимать чек ${o.name}? Укажите причину (необязательно).`,
                      ),
                      '',
                    );
                    if (why !== null)
                      void act(
                        {
                          op: 'reject',
                          ...(why.trim() ? { reason: why.trim().slice(0, 300) } : {}),
                        },
                        'reject',
                        '✖ ' + L('Chek qabul qilinmadi.', 'Receipt rejected.', 'Чек отклонён.'),
                      );
                  }}
                >
                  ✖ {L('Qabul qilmaslik', 'Reject', 'Не принимать')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="svc-ban-btn"
                  disabled={busyNow}
                  onClick={() => {
                    if (
                      window.confirm(
                        L(
                          `${o.name}ning cheki rad etilsinmi? Buyurtma bekor qilinadi va unga pullik xizmatlar yopiladi${banAccount ? ', saytga ham kira olmaydi' : ''}.`,
                          `Reject ${o.name}'s receipt? The order is cancelled and paid services closed for them${banAccount ? ', and they cannot sign in to the site' : ''}.`,
                          `Отклонить чек ${o.name}? Заказ отменится, платные услуги станут недоступны${banAccount ? ', и вход на сайт будет закрыт' : ''}.`,
                        ),
                      )
                    )
                      void act(
                        { op: 'ban', account: banAccount },
                        'ban',
                        '⛔ ' +
                          L(
                            'Rad etildi va bloklandi.',
                            'Rejected and blocked.',
                            'Отклонено и заблокировано.',
                          ),
                      );
                  }}
                >
                  ⛔ {L('Soxta chek — bloklash', 'Fake receipt — block', 'Поддельный чек — блок')}
                </Button>
              </div>
              <label className="svc-ban-account">
                <input
                  type="checkbox"
                  checked={banAccount}
                  onChange={(e) => setBanAccount(e.target.checked)}
                />
                🔒{' '}
                {L(
                  'Bloklaganda saytga kirishni ham yopish',
                  'Also block signing in to the site',
                  'Также закрыть вход на сайт',
                )}
              </label>
            </>
          ) : (
            <p className="muted">
              💳{' '}
              {product
                ? L('Chek hali yuborilmagan.', 'No receipt yet.', 'Чек ещё не отправлен.')
                : o.deliveredAt || o.status !== 'work'
                  ? L(
                      'Natija yuborilgan — buyurtmachi to‘lov qilib chek yuklaydi.',
                      'Result sent — the client will pay and upload a receipt.',
                      'Результат отправлен — заказчик оплатит и загрузит чек.',
                    )
                  : L(
                      'To‘lov natija yuborilgach ochiladi (narx so‘ralmaydi).',
                      'Payment opens after you send the result (no price asked).',
                      'Оплата откроется после отправки результата (цена не запрашивается).',
                    )}
            </p>
          )}
        </div>
      )}

      <Chat
        msgs={o.msgs}
        me="team"
        open
        lead={{
          head: kindTitle(lang, o.kind) + ' · ' + o.title,
          text: o.text,
          at: o.at,
          extra: ins.length ? (
            <FileList files={ins} o={o.uk + '/' + o.id} remove={removeFile} />
          ) : undefined,
        }}
        send={
          o.status === 'cancel' ? undefined : async (text) => await act({ op: 'msg', text }, 'msg')
        }
      />

      {o.status !== 'cancel' && !product && (
        <div className="svc-deliver">
          <b className="svc-sub">
            📥{' '}
            {L(
              'Tayyor ish (mijozga boradi)',
              'Finished work (goes to the client)',
              'Готовая работа (уйдёт заказчику)',
            )}
          </b>
          {outs.length ? (
            <FileList files={outs} o={o.uk + '/' + o.id} remove={removeFile} />
          ) : (
            <p className="muted">
              {L('Hali fayl yuklanmagan.', 'No files yet.', 'Файлов пока нет.')}
            </p>
          )}
          {o.status !== 'done' && outs.length < FILES_PER_ORDER.out && (
            <label className="svc-attach-btn is-small">
              <Upload size={15} />
              {progress || L('Fayl yuklash', 'Upload a file', 'Загрузить файл')}
              <input
                type="file"
                multiple
                accept={FILE_ACCEPT}
                disabled={busyNow}
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
              placeholder="https://…"
              aria-label={L('Natija havolasi', 'Result link', 'Ссылка на результат')}
            />
            <Button type="submit" size="sm" variant="outline" disabled={busyNow}>
              {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
          </form>
          {o.link && (
            <a className="svc-link" href={o.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> {o.link}
            </a>
          )}
          <small className="muted">
            👁{' '}
            {L(
              'Mijoz to‘lovgacha ishni faqat shu havola orqali ko‘radi — Google Drive, Canva va h.k.da «faqat ko‘rish» huquqi bilan ulashing. Fayllar to‘lov qabul qilingach yuklab olinadi.',
              'Before paying, the client only views the work via this link — share it as “view only” in Google Drive, Canva, etc. Files can be downloaded once the payment is accepted.',
              'До оплаты заказчик видит работу только по этой ссылке — поделитесь ею в Google Drive, Canva и т. п. с правом «только просмотр». Файлы можно скачать после подтверждения оплаты.',
            )}
          </small>
          {!!outs.length && (
            <div className={'svc-dl-state' + (o.dl ? ' is-open' : '')}>
              <span>
                {o.dl
                  ? '📥 ' +
                    L(
                      'Mijoz fayllarni yuklab ola oladi',
                      'The client can download the files',
                      'Заказчик может скачать файлы',
                    )
                  : '🔒 ' +
                    L(
                      'Yuklab olish yopiq — to‘lov qabul qilingach ochiladi',
                      'Download is closed — it opens when the payment is accepted',
                      'Скачивание закрыто — откроется после подтверждения оплаты',
                    )}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busyNow}
                onClick={() =>
                  void act(
                    { op: 'download', open: !o.dl },
                    'download',
                    o.dl
                      ? L(
                          '🔒 Yuklab olish yopildi.',
                          '🔒 Download closed.',
                          '🔒 Скачивание закрыто.',
                        )
                      : L(
                          '📥 Yuklab olish ochildi — mijozga bildirishnoma ketdi.',
                          '📥 Download opened — the client was notified.',
                          '📥 Скачивание открыто — заказчик уведомлён.',
                        ),
                  )
                }
              >
                {o.dl
                  ? L('🔒 Yuklashni yopish', '🔒 Close download', '🔒 Закрыть скачивание')
                  : L('📥 Yuklashni ochish', '📥 Open download', '📥 Открыть скачивание')}
              </Button>
            </div>
          )}
          {o.status !== 'done' && (
            <div className="svc-row">
              {o.status === 'work' && (
                <Button
                  size="sm"
                  disabled={busyNow || !ready}
                  title={
                    ready
                      ? undefined
                      : L(
                          'Avval fayl yuklang yoki havola qo‘ying',
                          'Upload a file or add a link first',
                          'Сначала загрузите файл или добавьте ссылку',
                        )
                  }
                  onClick={() =>
                    void act(
                      { op: 'status', status: 'review' },
                      'status',
                      L(
                        '📤 Mijozga yuborildi — unga bildirishnoma ketdi.',
                        '📤 Sent to the client — they were notified.',
                        '📤 Отправлено заказчику — ему пришло уведомление.',
                      ),
                    )
                  }
                >
                  📤 {L('Mijozga yuborish', 'Send to the client', 'Отправить заказчику')}
                </Button>
              )}
              {o.status === 'review' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyNow}
                  onClick={() => void act({ op: 'status', status: 'work' }, 'status')}
                >
                  🔁 {L('Ishga qaytarish', 'Back to work', 'Вернуть в работу')}
                </Button>
              )}
              {ready && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyNow}
                  onClick={() => {
                    if (
                      window.confirm(
                        L(
                          'Buyurtmachi o‘rniga buyurtmani yakunlaysizmi? (masalan, u javob bermayapti)',
                          'Complete the order for the client? (e.g. they do not respond)',
                          'Завершить заказ за заказчика? (например, он не отвечает)',
                        ),
                      )
                    )
                      void act({ op: 'status', status: 'done' }, 'status');
                  }}
                >
                  ✅ {L('Yakunlash', 'Complete', 'Завершить')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {o.status === 'done' && o.rating && (
        <p className="svc-note">
          ⭐ {o.rating}/5{o.review ? ' — ' + o.review : ''}
        </p>
      )}
      {o.status === 'cancel' && o.reason && (
        <p className="svc-note">
          ✖ {L('Sabab', 'Reason', 'Причина')}: {o.reason}
        </p>
      )}

      <footer className="svc-order-actions">
        {o.status !== 'cancel' && o.status !== 'done' && !o.trialChargedAt && (
          <Button
            size="sm"
            variant="outline"
            disabled={busyNow}
            onClick={() => {
              const reason = window.prompt(
                L('Bekor qilish sababi:', 'Reason for cancelling:', 'Причина отмены:'),
              );
              if (reason && reason.trim().length >= 3)
                void act({ op: 'cancel', reason: reason.trim() }, 'cancel');
            }}
          >
            ✖ {L('Bekor qilish', 'Cancel', 'Отменить')}
          </Button>
        )}
        {!isActive(o.status) && !hasTrialDebt(o) && (
          <Button
            size="sm"
            variant="outline"
            disabled={busyNow}
            onClick={() => {
              if (
                window.confirm(
                  L(
                    'Buyurtma va fayllari butunlay o‘chirilsinmi?',
                    'Delete the order and its files for good?',
                    'Удалить заказ и его файлы навсегда?',
                  ),
                )
              ) {
                onBack();
                void act({ op: 'remove' }, 'remove');
              }
            }}
          >
            🗑 {L('O‘chirish', 'Delete', 'Удалить')}
          </Button>
        )}
      </footer>
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
    Object.fromEntries(view.catalog.map((k) => [k.id, { days: k.days || '', off: !!k.off }])),
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
          'Narx belgilanmaydi: ish bajarilgach mijoz istalgan summani to‘laydi. Odatdagi muddat katalog kartasida ko‘rinadi («2–3 kun»). «Yopiq» yo‘nalish talabalarga ko‘rinmaydi.',
          'No prices: after the work is done the client pays any amount. The usual timing shows on the card (“2–3 days”). “Closed” directions are hidden.',
          'Цены не задаются: после выполнения клиент платит любую сумму. Обычный срок виден на карточке («2–3 дня»). «Закрыто» — направление скрыто.',
        )}
      </p>
      <ul className="svc-cat-admin">
        {view.catalog.map((k) => {
          const r = rows[k.id];
          return (
            <li key={k.id} className={r.off ? 'is-off' : ''}>
              <span className="svc-cat-identity">
                <SiteVisual
                  className="svc-card-art"
                  imageKey={visualPath('services', k.id)}
                  icon={k.art}
                />
                <span>
                  <b>{tr(lang, ...k.name)}</b>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      openSiteImageEditor(visualPath('services', k.id), {
                        icon: k.art,
                        label: tr(lang, ...k.name),
                      })
                    }
                  >
                    {L('Rasmni almashtirish', 'Change picture', 'Заменить картинку')}
                  </Button>
                </span>
              </span>
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

function Settings({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { request, toast } = useApp();
  const [how, setHow] = useState(view.how);
  const [busy, setBusy] = useState(false);
  async function save(input: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', input);
      onView(r.admin);
      toast(L('Saqlandi.', 'Saved.', 'Сохранено.'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="svc-pay-admin">
      {!!view.bans.length && (
        <section className="svc-bans" aria-label={L('Bloklanganlar', 'Blocked', 'Заблокированные')}>
          <b>
            ⛔{' '}
            {L(
              'Bloklanganlar (to‘lov topilmagan)',
              'Blocked (payment not found)',
              'Заблокированные (оплата не найдена)',
            )}
          </b>
          <ul>
            {view.bans.map((b) => (
              <li key={b.uk}>
                <span>
                  <b>{b.name}</b>
                  <small className="muted">
                    {b.title ? b.title + ' · ' : ''}
                    {new Date(b.at).toLocaleDateString('ru-RU')}
                    {b.account
                      ? ' · 🔒 ' +
                        L(
                          'saytga kirish ham yopiq',
                          'site sign-in blocked too',
                          'вход на сайт тоже закрыт',
                        )
                      : ''}
                  </small>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        L(
                          `${b.name} blokdan chiqarilsinmi?`,
                          `Unblock ${b.name}?`,
                          `Разблокировать ${b.name}?`,
                        ),
                      )
                    )
                      void save({ op: 'unban', uk: b.uk });
                  }}
                >
                  {L('Blokdan chiqarish', 'Unblock', 'Разблокировать')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ op: 'info', how: how.trim() });
        }}
      >
        <label>
          {L(
            'To‘lov yo‘riqnomasi — karta raqami (Premium, yakuniy test va pullik xizmatlar to‘lovida ko‘rinadi)',
            'Payment instructions — the card number (shown when paying for Premium, the final exam and services)',
            'Инструкция по оплате — номер карты (видна при оплате подписки, итогового теста и услуг)',
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
      </form>
      <small className="muted">
        {L(
          'Narx belgilanmaydi: foydalanuvchi istalgan summani kartaga to‘lab, chek skrinshotini yuklaydi. Siz yozishmada chekni ko‘rib «Qabul qilish»ni bosasiz — Premium (1 oy yoki 1 yil) va yakuniy test o‘zi ochiladi. Oddiy xizmatda to‘lov natija yuborilgach so‘raladi. Play Market ilovasida bu bo‘lim ko‘rinmaydi (Google qoidasi).',
          'No fixed prices: users pay any amount to the card and upload a screenshot of the receipt. You check it in the chat and press “Accept” — Premium (1 month or 1 year) and the final exam open by themselves. For services, payment is requested after you send the result. Hidden in the Play Market app (Google rules).',
          'Цены не фиксированы: пользователь платит любую сумму на карту и загружает скриншот чека. Вы проверяете его в переписке и нажимаете «Принять» — подписка (1 месяц или 1 год) и итоговый тест откроются сами. За услуги оплата запрашивается после отправки результата. В приложении Play Market раздел скрыт (правила Google).',
        )}
      </small>
    </div>
  );
}
