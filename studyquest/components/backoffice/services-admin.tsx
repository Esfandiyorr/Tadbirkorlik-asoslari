'use client';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, Upload } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { Chat, FileList } from '../services';
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
  isActive,
  isProduct,
  payable,
  serviceKind,
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
  async function launch(open: boolean) {
    if (
      !window.confirm(
        open
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
          {view.open ? L('Ishlayapti', 'Live', 'Работает') : L('Tez orada', 'Coming soon', 'Скоро')}
        </span>
        <p>
          {view.open
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
        <span>
          💰 <b>{formatSum(payable(o))}</b>
          {!!o.discount && (
            <>
              {' '}
              <s className="muted">{formatSum(o.budget)}</s> 💎 −{o.discount} %
            </>
          )}
        </span>
        {o.due && <span>📅 {o.due}</span>}
        <span>🕐 {dueText(o.at, lang).date}</span>
      </p>

      {o.status !== 'cancel' && (
        <div className={'svc-pay is-admin' + (o.payOk ? ' is-ok' : '')}>
          {o.payOk ? (
            <b>
              ✅ {L('To‘lov tasdiqlangan', 'Payment confirmed', 'Оплата подтверждена')} ·{' '}
              {dueText(o.payOk, lang).date}
            </b>
          ) : (
            <>
              <b>
                💳{' '}
                {o.paidAt
                  ? L(
                      'Buyurtmachi «To‘lov qildim» dedi — tekshiring',
                      'The client says they paid — check it',
                      'Заказчик сообщил об оплате — проверьте',
                    )
                  : L('To‘lov hali qilinmagan', 'Not paid yet', 'Ещё не оплачено')}
                : {formatSum(payable(o))}
              </b>
              {o.paidNote && <p className="muted">🧾 {o.paidNote}</p>}
              {product && (
                <p className="muted">
                  🛍{' '}
                  {o.kind === 'yakuniy-test'
                    ? L(
                        'Tasdiqlashingiz bilan unga «Yakuniy testga tayyorgarlik» bo‘limi o‘zi ochiladi.',
                        'Confirming opens the “Final exam preparation” section for them automatically.',
                        'После подтверждения раздел «Подготовка к итоговому тесту» откроется сам.',
                      )
                    : L(
                        `Tasdiqlashingiz bilan Premium obuna ${PRODUCTS[o.kind as ProductId].days} kunga o‘zi yoqiladi.`,
                        `Confirming turns Premium on for ${PRODUCTS[o.kind as ProductId].days} days automatically.`,
                        `После подтверждения подписка включится на ${PRODUCTS[o.kind as ProductId].days} дн.`,
                      )}
                </p>
              )}
              <div className="svc-row">
                <Button
                  size="sm"
                  variant={o.paidAt ? 'default' : 'outline'}
                  disabled={busyNow}
                  onClick={() =>
                    void act(
                      { op: 'confirm' },
                      'confirm',
                      L('To‘lov tasdiqlandi.', 'Payment confirmed.', 'Оплата подтверждена.'),
                    )
                  }
                >
                  ✅ {L('To‘lovni tasdiqlash', 'Confirm payment', 'Подтвердить оплату')}
                </Button>
              </div>
            </>
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
        {o.status !== 'cancel' && o.status !== 'done' && (
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
        {!isActive(o.status) && (
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
          'Odatdagi narx va muddat katalog kartasida va vazifa berish oynasida maslahat sifatida ko‘rinadi («50 000 so‘mdan», «2–3 kun»). Summani talabaning o‘zi yozadi. «Yopiq» yo‘nalish talabalarga ko‘rinmaydi.',
          'The usual price and timing appear on the card and as a hint in the task form (“from 50 000 so‘m”, “2–3 days”). Students set the amount themselves. “Closed” directions are hidden.',
          'Обычная цена и срок видны на карточке и как подсказка в форме задачи («от 50 000 сум», «2–3 дня»). Сумму студент пишет сам. «Закрыто» — направление скрыто.',
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
  const [prices, setPrices] = useState<Record<ProductId, string>>(
    () =>
      Object.fromEntries(
        (Object.keys(PRODUCTS) as ProductId[]).map((id) => [
          id,
          String(view.products?.[id] ?? PRODUCTS[id].price),
        ]),
      ) as Record<ProductId, string>,
  );
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
      <form
        className="svc-prices"
        onSubmit={(e) => {
          e.preventDefault();
          void save({
            op: 'prices',
            products: Object.fromEntries(
              Object.entries(prices).map(([id, v]) => [id, Number(v.replace(/\D/g, '')) || 0]),
            ),
          });
        }}
      >
        <b>
          🛍 {L('Tayyor mahsulotlar narxi (so‘m)', 'Product prices (so‘m)', 'Цены продуктов (сум)')}
        </b>
        {(Object.keys(PRODUCTS) as ProductId[]).map((id) => (
          <label key={id}>
            {PRODUCTS[id].icon} {PRODUCTS[id].name[0]}
            <input
              className="input"
              inputMode="numeric"
              value={prices[id]}
              onChange={(e) =>
                setPrices({ ...prices, [id]: e.target.value.replace(/\D/g, '').slice(0, 9) })
              }
            />
          </label>
        ))}
        <small className="muted">
          {L(
            'Premium obunachilarga yakuniy test va barcha pullik xizmatlar 50 % arzon (Premium’ning o‘zidan tashqari).',
            'Premium subscribers get 50% off the final exam and all paid services (not Premium itself).',
            'Подписчикам — скидка 50 % на итоговый тест и все платные услуги (кроме самой подписки).',
          )}
        </small>
        <Button type="submit" disabled={busy}>
          {L('Narxlarni saqlash', 'Save prices', 'Сохранить цены')}
        </Button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ op: 'info', how: how.trim() });
        }}
      >
        <label>
          {L(
            'To‘lov yo‘riqnomasi (buyurtmachiga buyurtma sahifasida ko‘rinadi)',
            'Payment instructions (shown to the client on the order page)',
            'Инструкция по оплате (видна заказчику на странице заказа)',
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
          'Buyurtmachi to‘lab «To‘lov qildim» deydi, siz buyurtma yozishmasida «To‘lovni tasdiqlash»ni bosasiz. To‘lov ishni to‘xtatmaydi — natijani qachon yuborishni o‘zingiz hal qilasiz. Play Market ilovasida bu bo‘lim ko‘rinmaydi (Google qoidasi) — buyurtmalar saytda beriladi.',
          'The client pays and presses “I paid”; you press “Confirm payment” in the order chat. Payment does not block the work — you decide when to send the result. This section is hidden in the Play Market app (Google rules) — orders are placed on the website.',
          'Заказчик оплачивает и нажимает «Я оплатил», вы нажимаете «Подтвердить оплату» в переписке. Оплата не блокирует работу — когда отправить результат, решаете вы. В приложении Play Market раздел скрыт (правила Google) — заказы делаются на сайте.',
        )}
      </small>
    </div>
  );
}
