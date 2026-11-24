'use client';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, Upload } from 'lucide-react';
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
type Filter = 'todo' | 'work' | 'review' | 'done' | 'cancel' | 'all';

const lastFrom = (o: AdminOrder) => o.msgs[o.msgs.length - 1]?.from;
/** Javob kutayotgan buyurtma: yangi (hali yozilmagan) yoki oxirgi xabar buyurtmachidan. */
const unread = (o: AdminOrder) =>
  o.status !== 'cancel' &&
  o.status !== 'done' &&
  (lastFrom(o) === 'user' || (!o.msgs.length && o.status === 'work'));
/** Buyurtmachi «To'lov qildim» degan, lekin hali tasdiqlanmagan. */
const payCheck = (o: AdminOrder) => o.status !== 'cancel' && !!o.paidAt && !o.payOk;
const needsMe = (o: AdminOrder) => unread(o) || payCheck(o);
const FILTERS: [Filter, Tri, (o: AdminOrder) => boolean][] = [
  ['todo', ['Javob kutmoqda', 'Needs reply', 'Ждут ответа'], needsMe],
  ['work', ['Tayyorlanmoqda', 'In progress', 'Готовятся'], (o) => o.status === 'work'],
  ['review', ['Yuborilgan', 'Delivered', 'Отправлены'], (o) => o.status === 'review'],
  ['done', ['Yakunlangan', 'Completed', 'Завершённые'], (o) => o.status === 'done'],
  ['cancel', ['Bekor', 'Cancelled', 'Отменённые'], (o) => o.status === 'cancel'],
  ['all', ['Hammasi', 'All', 'Все'], () => true],
];
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
      <ul className="mk-tiles is-admin">
        <li className="is-violet">
          <small>{L('Javob kutmoqda', 'Needs reply', 'Ждут ответа')}</small>
          <b>{todo}</b>
        </li>
        <li className="is-blue">
          <small>{L('Tayyorlanmoqda', 'In progress', 'Готовятся')}</small>
          <b>{view.orders.filter((o) => o.status === 'work').length}</b>
        </li>
        <li className="is-amber">
          <small>{L('To‘lovni tekshirish', 'Payments to check', 'Проверить оплату')}</small>
          <b>{view.orders.filter(payCheck).length}</b>
        </li>
        <li className="is-green">
          <small>{L('Yakunlangan', 'Completed', 'Завершено')}</small>
          <b>{view.orders.filter((o) => o.status === 'done').length}</b>
        </li>
      </ul>
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

/** 💬 Buyurtmalar: chapda ro'yxat, o'ngda tanlangan buyurtma bilan yozishma (telefonda — navbat bilan). */
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
  return (
    <>
      <div className="svc-admin-tools">
        <div className="lib-kinds" role="group" aria-label={L('Holat', 'Status', 'Статус')}>
          {FILTERS.map(([f, name, fn]) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {tr(lang, ...name)} <em>{view.orders.filter(fn).length}</em>
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
      <div className={'svc-inbox' + (current ? ' has-open' : '')}>
        <ul className="svc-inbox-list" aria-label={L('Buyurtmalar', 'Orders', 'Заказы')}>
          {!list.length && (
            <li className="muted svc-empty">
              {L(
                'Bu yerda hozircha buyurtma yo‘q.',
                'No orders here yet.',
                'Здесь пока нет заказов.',
              )}
            </li>
          )}
          {list.map((o) => {
            const k = serviceKind(o.kind);
            const last = o.msgs[o.msgs.length - 1];
            const [icon] = STATUS_LABEL[o.status];
            return (
              <li key={keyOf(o)}>
                <button
                  type="button"
                  className={
                    'svc-thread' +
                    (keyOf(o) === openKey ? ' is-on' : '') +
                    (unread(o) ? ' is-unread' : '')
                  }
                  aria-current={keyOf(o) === openKey ? 'true' : undefined}
                  style={(k ? { '--c1': k.tone[0], '--c2': k.tone[1] } : {}) as CSSProperties}
                  onClick={() => setOpenKey(keyOf(o))}
                >
                  <span className="svc-thread-ava" aria-hidden="true">
                    {k?.icon || '✨'}
                  </span>
                  <span className="svc-thread-main">
                    <span className="svc-thread-top">
                      <b>{o.name}</b>
                      <small>{dueText(o.upd, lang).date}</small>
                    </span>
                    <span className="svc-thread-kind">
                      {kindTitle(lang, o.kind)} · {o.title}
                    </span>
                    <span className="svc-thread-last">
                      {icon}{' '}
                      {last
                        ? (last.from === 'team' ? L('Siz: ', 'You: ', 'Вы: ') : '') + last.text
                        : o.text}
                    </span>
                  </span>
                  {(unread(o) || payCheck(o)) && (
                    <span className="svc-thread-flags">
                      {payCheck(o) && (
                        <em
                          title={L('To‘lovni tekshiring', 'Check the payment', 'Проверьте оплату')}
                        >
                          💳
                        </em>
                      )}
                      {unread(o) && (
                        <i aria-label={L('Javob kutmoqda', 'Needs reply', 'Ждёт ответа')} />
                      )}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {current ? (
          <AdminChat
            key={keyOf(current)}
            order={current}
            reload={reload}
            onView={onView}
            onBack={() => setOpenKey('')}
          />
        ) : (
          <div className="svc-inbox-empty muted">
            💬{' '}
            {L(
              'Buyurtmani tanlang — buyurtmachi nima yozgani va yozishma shu yerda ochiladi.',
              'Pick an order — what the client wrote and the chat open here.',
              'Выберите заказ — здесь откроется, что написал заказчик, и переписка.',
            )}
          </div>
        )}
      </div>
    </>
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
                        L('To‘lov qabul qilindi.', 'Payment accepted.', 'Оплата принята.'),
                      )
                    }
                  >
                    ✅{' '}
                    {product
                      ? L('Qabul qilish — ochish', 'Accept — unlock', 'Принять — открыть')
                      : L('Qabul qilish', 'Accept', 'Принять')}
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
