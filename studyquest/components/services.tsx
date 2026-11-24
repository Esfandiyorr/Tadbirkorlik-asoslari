'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  ExternalLink,
  Lightbulb,
  Paperclip,
  Search,
  Send,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { openBackOffice } from './backoffice';
import { saveOrderFile, sendOrderFile, servicesAct } from './service-files';
import { dueText, tr } from '@/lib/points';
import {
  BUDGET_MAX,
  BUDGET_MIN,
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  FILE_TYPES,
  KEEP_DAYS,
  SERVICE_GROUPS,
  STATUS_LABEL,
  PRODUCTS,
  fileSize,
  formatSum,
  isActive,
  isProduct,
  payable,
  serviceKind,
  type OrderFile,
  type ServiceCard,
  type ServiceGroup,
  type ServiceOrder,
  type ServicesView,
  type Tri,
} from '@/lib/services';
import type { Lang } from '@/lib/types';

/* 💼 Pullik xizmatlar.
   • 🛒 Buyurtma berish: katalogdan yo'nalishni tanlab nima kerakligini va to'lay oladigan summani yozish;
   • 📦 Buyurtmalarim: «🤖 Sun'iy intellekt yordamida tayyorlanmoqda», to'lov, yozishma, natijani yuklab olish,
     qabul qilish yoki tuzatish so'rash va baho.
   Buyurtma administratorga yozishma bo'lib keladi (Sayt boshqaruvi → Pullik xizmatlar), u natijani shu yerga yuboradi.
   Server — lib/server/services.ts. Administrator bo'limni ishga tushirguncha (view.open = false) foydalanuvchi kirganda
   «🚀 Tez orada ishga tushadi» oynasi chiqadi va u taklif yuboradi. */
const IDEA_KEY = 'sq-svc-idea';
type Tab = 'order' | 'mine';
const TABS: Tab[] = ['order', 'mine'];

const STEPS: [string, Tri, Tri][] = [
  [
    '📝',
    ['Buyurtma bering', 'Place an order', 'Оформите заказ'],
    [
      'Nima kerakligini, muddatni va qancha to‘lay olishingizni yozing, kerak bo‘lsa fayl biriktiring.',
      'Say what you need, by when and how much you can pay; attach files if needed.',
      'Опишите, что нужно, срок и сколько готовы заплатить; приложите файлы при необходимости.',
    ],
  ],
  [
    '🤖',
    ['Sun’iy intellekt tayyorlaydi', 'Prepared with AI', 'Готовится с помощью ИИ'],
    [
      'Buyurtmangiz sun’iy intellekt yordamida tayyorlanadi. Savol bo‘lsa, yozishmada so‘raymiz.',
      'Your order is prepared with the help of AI. If we have questions, we ask in the chat.',
      'Заказ готовится с помощью искусственного интеллекта. Вопросы зададим в переписке.',
    ],
  ],
  [
    '💳',
    ['To‘lov', 'Payment', 'Оплата'],
    [
      'Buyurtma sahifasidagi yo‘riqnoma bo‘yicha to‘lab, «To‘lov qildim» tugmasini bosasiz.',
      'Pay as shown on the order page and press “I paid”.',
      'Оплатите по инструкции на странице заказа и нажмите «Я оплатил».',
    ],
  ],
  [
    '📥',
    ['Natijani oling', 'Get the result', 'Получите результат'],
    [
      'Tayyor ish shu yerga keladi — yuklab olasiz, kerak bo‘lsa tuzatish so‘raysiz.',
      'The finished work arrives here — download it or ask for changes.',
      'Готовая работа придёт сюда — скачайте её или попросите правки.',
    ],
  ],
  [
    '⭐',
    ['Qabul va baho', 'Accept and rate', 'Приёмка и оценка'],
    [
      'Natija yoqsa, qabul qilib baho qo‘yasiz.',
      'If you like the result, accept it and rate it.',
      'Если результат устраивает — примите и оцените.',
    ],
  ],
];
const TRACK_NAME: Tri[] = [
  ['Buyurtma', 'Order', 'Заказ'],
  ['Tayyorlanmoqda', 'In progress', 'Готовится'],
  ['Natija', 'Result', 'Результат'],
  ['Qabul', 'Accept', 'Приёмка'],
];
/** Holat → kuzatuv chizig'idagi qadam (0..4). */
const stepOf = (s: ServiceOrder['status']) => ({ work: 1, review: 2, done: 4, cancel: -1 })[s];
const today = () => new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);
const daysLeft = (due: string | undefined, lang: Lang) => {
  if (!due) return '';
  const d = Math.ceil((Date.parse(due + 'T23:59:59+05:00') - Date.now()) / 86400000);
  return d < 0
    ? tr(lang, 'muddat o‘tgan', 'overdue', 'срок прошёл')
    : d === 0
      ? tr(lang, 'bugun', 'today', 'сегодня')
      : tr(lang, `${d} kun qoldi`, `${d} days left`, `осталось ${d} дн.`);
};
const groupDigits = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const kindTitle = (lang: Lang, id: string) => {
  const k = serviceKind(id);
  return k ? k.icon + ' ' + tr(lang, ...k.name) : id;
};
const toneOf = (id: string) => {
  const k = serviceKind(id);
  return (k ? { '--c1': k.tone[0], '--c2': k.tone[1] } : {}) as CSSProperties;
};
function Stars({ n }: { n: number | null | undefined }) {
  if (!n) return null;
  const r = Math.round(n);
  return (
    <span className="mk-stars" aria-label={n + ' / 5'}>
      {'★'.repeat(r)}
      <i>{'★'.repeat(5 - r)}</i> {n}
    </span>
  );
}

export function Services({ sub = '' }: { sub?: string }) {
  const { data, lang, request, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const tab: Tab = (TABS as string[]).includes(sub) ? (sub as Tab) : 'order';
  const [view, setView] = useState<ServicesView | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState<ServiceCard | null>(null);
  // «tez orada» oynasi: null — yopiq, massiv — oldindan belgilangan yo'nalishlar
  const [soon, setSoon] = useState<string[] | null>(null);
  const [sent, setSent] = useState(false);
  const [group, setGroup] = useState<ServiceGroup | ''>('');
  const [q, setQ] = useState('');
  const shown = useRef(false);
  const uid = data?.user?.id;
  const load = useCallback(async () => {
    try {
      const r = await request('/api/services'),
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
  }, [load, uid]);
  const admin = data?.user?.role === 'admin';
  const orders = view?.orders || [];
  const openOrders = orders.filter((o) => isActive(o.status)).length;
  // bo'lim hali ishga tushmagan: foydalanuvchi buyurtma o'rniga taklif yuboradi (administrator sinab ko'rishi mumkin)
  const soonMode = !!view && !view.open;
  const waiting = soonMode && !admin;
  useEffect(() => {
    if (!waiting || shown.current) return;
    shown.current = true;
    let before = false;
    try {
      before = !!localStorage.getItem(IDEA_KEY);
    } catch {}
    setSent(before);
    // kirganda oyna chiqadi (taklif allaqachon yuborilgan bo'lsa — faqat sahifadagi tugma orqali)
    if (!before) setSoon([]);
  }, [waiting]);
  const go = (t: Tab) => navigate('services' + (t === 'order' ? '' : '/' + t));
  const groups = (Object.keys(SERVICE_GROUPS) as ServiceGroup[]).filter((g) =>
    view?.catalog.some((k) => k.group === g),
  );
  const needle = q.trim().toLowerCase();
  const list = (view?.catalog || []).filter(
    (k) =>
      (!group || k.group === group) &&
      (!needle || (tr(lang, ...k.name) + ' ' + tr(lang, ...k.text)).toLowerCase().includes(needle)),
  );
  const tabs: [Tab, string, string, number][] = [
    ['order', '🛒', L('Buyurtma berish', 'Order', 'Заказать'), 0],
    ['mine', '📦', L('Buyurtmalarim', 'My orders', 'Мои заказы'), openOrders],
  ];
  return (
    <>
      <header className="page-heading svc-hero">
        <div className="svc-hero-text">
          <span className="eyebrow">
            🤖 {L('SUN’IY INTELLEKT YORDAMIDA', 'WITH THE HELP OF AI', 'С ПОМОЩЬЮ ИИ')}
          </span>
          <h1>💼 {L('Pullik xizmatlar', 'Paid services', 'Платные услуги')}</h1>
          <p>
            {L(
              'Nima kerakligini yozing — taqdimot, biznes-reja, dizayn, tarjima va boshqa ishlar sun’iy intellekt yordamida tayyorlanib, shu yerga keladi.',
              'Tell us what you need — presentations, business plans, design, translation and more are prepared with the help of AI and delivered here.',
              'Опишите, что нужно, — презентации, бизнес-планы, дизайн, переводы и другое готовятся с помощью ИИ и приходят сюда.',
            )}
          </p>
          <ul className="svc-hero-stats" aria-label={L('Ko‘rsatkichlar', 'Figures', 'Показатели')}>
            <li>
              <b>{view ? view.catalog.length : '…'}</b>
              <span>{L('xizmat turi', 'services', 'видов услуг')}</span>
            </li>
            <li>
              <b>{view ? (view.open ? view.people : view.fans) : '…'}</b>
              <span>
                {soonMode
                  ? L('kishi kutmoqda', 'people waiting', 'ждут запуска')
                  : L('kishi foydalandi', 'people used it', 'воспользовались')}
              </span>
            </li>
            <li>
              <b>{view ? view.done : '…'}</b>
              <span>{L('bajarilgan buyurtma', 'orders done', 'выполнено заказов')}</span>
            </li>
          </ul>
          <div className="page-heading-side">
            <Button onClick={() => (waiting ? setSoon([]) : go('order'))}>
              ➕ {L('Buyurtma berish', 'Place an order', 'Сделать заказ')}
            </Button>
            {admin && (
              <Button
                variant="outline"
                className="svc-hero-ghost"
                onClick={() => {
                  openBackOffice('services');
                  navigate('admin');
                }}
              >
                <Settings2 size={16} /> {L('Boshqarish', 'Manage', 'Управление')}
              </Button>
            )}
          </div>
        </div>
        <div className="svc-hero-art" aria-hidden="true">
          <span>📊</span>
          <span>🎨</span>
          <span>🌐</span>
          <span>🤖</span>
        </div>
      </header>

      {waiting && (
        <div className="svc-soon" role="status">
          <span className="svc-soon-icon" aria-hidden="true">
            🚀
          </span>
          <div>
            <b>{L('Tez orada ishga tushadi!', 'Launching soon!', 'Скоро запуск!')}</b>
            <p>
              {sent
                ? L(
                    'Taklifingiz administratorga yetib bordi — rahmat! Bo‘lim ishga tushganda shu yerda buyurtma bera olasiz.',
                    'Your suggestion reached the administrator — thank you! You will be able to order here once the section opens.',
                    'Ваше предложение получено — спасибо! Когда раздел заработает, заказывать можно будет здесь.',
                  )
                : L(
                    'Tayyorgarlik ko‘ryapmiz. Sizga qaysi xizmat kerakligini yozib qoldiring.',
                    'We are getting ready. Tell us which services you need.',
                    'Мы готовимся. Напишите, какие услуги вам нужны.',
                  )}
            </p>
          </div>
          <Button onClick={() => setSoon([])}>
            <Lightbulb size={16} /> {L('Taklif yuborish', 'Send a suggestion', 'Отправить идею')}
          </Button>
        </div>
      )}
      {admin && view && !view.shown && (
        <p className="svc-soon is-admin svc-closed-note" role="status">
          🔒{' '}
          {L(
            'Bo‘lim foydalanuvchilar uchun vaqtincha yopiq: menyuda ko‘rinmaydi, buyurtmalar qabul qilinmaydi. Sahifani faqat siz ko‘ryapsiz. Ochish — «Boshqarish» → «Bo‘limni ochish».',
            'The section is temporarily closed: hidden from the menu, orders are refused. Only you see this page. Reopen via “Manage” → “Open the section”.',
            'Раздел временно закрыт: скрыт из меню, заказы не принимаются. Страницу видите только вы. Открыть — «Управление» → «Открыть раздел».',
          )}
        </p>
      )}
      {admin && soonMode && (
        <p className="svc-soon is-admin">
          ⏸{' '}
          {L(
            'Bo‘lim hali ishga tushmagan: foydalanuvchilar «Tez orada» oynasini ko‘radi va taklif yuboradi. Siz sinab ko‘rish uchun buyurtma bera olasiz. Ishga tushirish — «Boshqarish» tugmasi orqali.',
            'The section is not launched: users see “Launching soon” and send suggestions. You can place test orders. Launch it via “Manage”.',
            'Раздел ещё не запущен: пользователи видят «Скоро запуск» и отправляют идеи. Вы можете сделать тестовый заказ. Запуск — через «Управление».',
          )}
        </p>
      )}

      <nav className="mk-tabs" aria-label={L('Bo‘limlar', 'Sections', 'Разделы')}>
        {tabs.map(([id, icon, name, n]) => (
          <a
            key={id}
            href={'#services' + (id === 'order' ? '' : '/' + id)}
            className={tab === id ? 'on' : ''}
            aria-current={tab === id ? 'page' : undefined}
          >
            <span aria-hidden="true">{icon}</span> {name}
            {!!n && <em>{n}</em>}
          </a>
        ))}
      </nav>
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton svc-skeleton" />}

      {view && tab === 'order' && (
        <>
          <section aria-labelledby="svc-cat-h" className="svc-catalog">
            <div className="svc-cat-head">
              <div>
                <h2 id="svc-cat-h" className="svc-h2">
                  {L('Xizmatlar katalogi', 'Service catalog', 'Каталог услуг')}
                </h2>
                <p className="muted">
                  {waiting
                    ? L(
                        'Kartani bosing — shu xizmatni kutayotganingizni bildiring.',
                        'Tap a card to say you are waiting for that service.',
                        'Нажмите на карточку, чтобы сообщить, что ждёте эту услугу.',
                      )
                    : L(
                        'Kartani bosing — nima kerakligini va summani yozasiz, buyurtmangiz sun’iy intellekt yordamida tayyorlanadi.',
                        'Tap a card — describe what you need and your budget; your order is prepared with the help of AI.',
                        'Нажмите на карточку — опишите, что нужно, и бюджет; заказ подготовят с помощью ИИ.',
                      )}
                </p>
              </div>
              <label className="lib-search svc-search">
                <Search size={17} aria-hidden="true" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={L('Xizmatni qidirish', 'Search services', 'Поиск услуги')}
                  aria-label={L('Xizmatlardan qidirish', 'Search services', 'Поиск по услугам')}
                />
              </label>
            </div>
            <div
              className="lib-kinds svc-groups"
              role="group"
              aria-label={L('Guruh', 'Group', 'Группа')}
            >
              <button className={!group ? 'on' : ''} onClick={() => setGroup('')}>
                {L('Hammasi', 'All', 'Все')} <em>{view.catalog.length}</em>
              </button>
              {groups.map((g) => (
                <button key={g} className={group === g ? 'on' : ''} onClick={() => setGroup(g)}>
                  {tr(lang, ...SERVICE_GROUPS[g])}{' '}
                  <em>{view.catalog.filter((k) => k.group === g).length}</em>
                </button>
              ))}
            </div>
            {!list.length && (
              <p className="muted svc-empty">
                {L('Hech narsa topilmadi.', 'Nothing found.', 'Ничего не найдено.')}
              </p>
            )}
            <ul className="svc-grid">
              {(!group || group === 'study') && !needle && (
                // 🎯 tayyor mahsulot: yakuniy testga tayyorgarlik (narxi belgilangan, kurs ichida ochiladi)
                <li>
                  <a
                    className="svc-card is-product"
                    href={'#course/' + (data?.courses?.[0]?.id || '') + '/exam'}
                    style={
                      {
                        '--c1': PRODUCTS['yakuniy-test'].tone[0],
                        '--c2': PRODUCTS['yakuniy-test'].tone[1],
                      } as CSSProperties
                    }
                  >
                    <span className="svc-card-tag">
                      {tr(lang, ...SERVICE_GROUPS.study)} · 🛍 {L('Tayyor', 'Ready-made', 'Готово')}
                    </span>
                    <b className="svc-card-name">{tr(lang, ...PRODUCTS['yakuniy-test'].name)}</b>
                    <small className="svc-card-text">
                      {tr(lang, ...PRODUCTS['yakuniy-test'].text)}
                    </small>
                    <span className="svc-card-meta">
                      <em>
                        💰{' '}
                        {view.discount ? (
                          <>
                            <s>{formatSum(view.products['yakuniy-test'])}</s>{' '}
                            {formatSum(
                              payable({
                                budget: view.products['yakuniy-test'],
                                discount: view.discount,
                              }),
                            )}
                          </>
                        ) : (
                          formatSum(view.products['yakuniy-test'])
                        )}
                      </em>
                      <em>💎 {L('obunachiga −50 %', '−50% with Premium', '−50 % подписчикам')}</em>
                    </span>
                    <span className="svc-card-go">{L('Ko‘rish', 'Open', 'Открыть')} →</span>
                    <span className="svc-card-art" aria-hidden="true">
                      🎯
                    </span>
                  </a>
                </li>
              )}
              {list.map((k, i) => (
                <li key={k.id} style={{ animationDelay: Math.min(i, 12) * 45 + 'ms' }}>
                  <button
                    type="button"
                    className="svc-card"
                    style={{ '--c1': k.tone[0], '--c2': k.tone[1] } as CSSProperties}
                    onClick={() =>
                      waiting ? setSoon([k.id]) : view.signedIn ? setPick(k) : setLogin(true)
                    }
                  >
                    <span className="svc-card-tag">
                      {tr(lang, ...SERVICE_GROUPS[k.group])}
                      {k.help && (
                        <em className="svc-help"> · 🤝 {L('Yordam', 'Assistance', 'Помощь')}</em>
                      )}
                    </span>
                    <b className="svc-card-name">{tr(lang, ...k.name)}</b>
                    <span className="svc-card-users">
                      <UserCount card={k} soon={soonMode} />
                    </span>
                    <small className="svc-card-text">{tr(lang, ...k.text)}</small>
                    {(k.price || k.days) && (
                      <span className="svc-card-meta">
                        {k.price && <em>💰 {k.price}</em>}
                        {k.days && <em>⏱ {k.days}</em>}
                      </span>
                    )}
                    <span className="svc-card-go">
                      {waiting
                        ? '🚀 ' + L('Tez orada', 'Coming soon', 'Скоро')
                        : L('Buyurtma berish', 'Order', 'Заказать') + ' →'}
                    </span>
                    <span className="svc-card-art" aria-hidden="true">
                      {k.art}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!view.signedIn && !waiting && (
              <p className="svc-signin muted">
                {L(
                  'Buyurtma berish uchun hisobingizga kiring.',
                  'Sign in to place an order.',
                  'Войдите, чтобы сделать заказ.',
                )}{' '}
                <Button size="sm" variant="outline" onClick={() => setLogin(true)}>
                  {L('Kirish', 'Sign in', 'Войти')}
                </Button>
              </p>
            )}
          </section>
          <HowItWorks />
        </>
      )}

      {view && tab === 'mine' && (
        <section className="svc-mine" aria-labelledby="svc-mine-h">
          <h2 id="svc-mine-h" className="svc-h2">
            📦 {L('Mening buyurtmalarim', 'My orders', 'Мои заказы')}
          </h2>
          {!view.signedIn ? (
            <SignInNote />
          ) : !orders.length ? (
            <div className="mk-empty">
              <span aria-hidden="true">🛒</span>
              <b>{L('Hali buyurtma bermagansiz', 'No orders yet', 'Заказов пока нет')}</b>
              <p className="muted">
                {L(
                  'Katalogdan xizmatni tanlang va nima kerakligini yozing — buyurtmangiz sun’iy intellekt yordamida tayyorlanadi.',
                  'Pick a service and describe what you need — your order is prepared with the help of AI.',
                  'Выберите услугу и опишите, что нужно, — заказ подготовят с помощью ИИ.',
                )}
              </p>
              <Button onClick={() => (waiting ? setSoon([]) : go('order'))}>
                ➕ {L('Buyurtma berish', 'Place an order', 'Сделать заказ')}
              </Button>
            </div>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o.id}>
                  <OrderCard order={o} how={view.how || ''} onView={setView} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {soon && view && (
        <SoonModal
          catalog={view.catalog}
          initial={soon}
          signedIn={view.signedIn}
          onClose={() => setSoon(null)}
          onSent={(v) => {
            setView(v);
            setSent(true);
            try {
              localStorage.setItem(IDEA_KEY, String(Date.now()));
            } catch {}
          }}
        />
      )}
      {pick && (
        <OrderForm
          card={pick}
          discount={view?.discount || 0}
          onClose={() => setPick(null)}
          onDone={(v) => {
            setView(v);
            setPick(null);
            go('mine');
          }}
        />
      )}
    </>
  );
}

/** Kartadagi sanoq: ishga tushgach — nechta odam foydalangani, «tez orada» paytida — nechta odam kutayotgani. */
function UserCount({ card: k, soon }: { card: ServiceCard; soon: boolean }) {
  const { lang } = useApp();
  const n = soon ? k.wants : k.used;
  if (!n) return <>✨ {tr(lang, 'Birinchi bo‘ling', 'Be the first', 'Будьте первым')}</>;
  return soon ? (
    <>🙋 {tr(lang, `${n} kishi kutmoqda`, `${n} waiting`, `ждут: ${n}`)}</>
  ) : (
    <>👥 {tr(lang, `${n} kishi foydalandi`, `${n} people used it`, `воспользовались: ${n}`)}</>
  );
}

function SignInNote() {
  const { lang, setLogin } = useApp();
  return (
    <div className="mk-empty">
      <span aria-hidden="true">🔐</span>
      <b>{tr(lang, 'Hisobingizga kiring', 'Please sign in', 'Войдите в аккаунт')}</b>
      <Button onClick={() => setLogin(true)}>{tr(lang, 'Kirish', 'Sign in', 'Войти')}</Button>
    </div>
  );
}

function HowItWorks() {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  return (
    <section className="svc-how" aria-labelledby="svc-how-h">
      <h2 id="svc-how-h" className="svc-h2">
        {L('Qanday ishlaydi?', 'How it works', 'Как это работает')}
      </h2>
      <ol className="svc-steps">
        {STEPS.map(([icon, name, text], i) => (
          <li key={i}>
            <span className="svc-step-n" aria-hidden="true">
              {icon}
              <em>{i + 1}</em>
            </span>
            <b>{tr(lang, ...name)}</b>
            <small>{tr(lang, ...text)}</small>
          </li>
        ))}
      </ol>
      <p className="svc-honest">
        <span aria-hidden="true">🛡</span>
        <span>
          {L(
            'Buyurtmangizni va fayllaringizni faqat administrator ko‘radi. Kurs ishi, BMI, referat va maqolada faqat yordam beramiz (reja, manbalar, tahrir, rasmiylashtirish) — matnni o‘zingiz yozasiz.',
            'Only the administrator sees your order and files. For course papers, theses, essays and articles we only assist (outline, sources, editing, formatting) — you write the text.',
            'Заказ и файлы видит только администратор. В курсовых, ВКР, рефератах и статьях мы только помогаем (план, источники, редактура, оформление) — текст пишете вы.',
          )}
        </span>
      </p>
    </section>
  );
}

/** Buyurtma bo'yicha yozishma. lead — birinchi xabar o'rnida buyurtmaning o'zi (administrator oynasida: qaysi xizmat
    va nima yozilgan). */
export function Chat({
  msgs,
  me,
  open,
  send,
  lead,
}: {
  msgs: ServiceOrder['msgs'];
  me: 'user' | 'team';
  open?: boolean;
  send?: (text: string) => Promise<boolean>;
  lead?: { head: string; text: string; at: number; extra?: ReactNode };
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const who = (f: string) =>
    f === me
      ? L('Siz', 'You', 'Вы')
      : f === 'team'
        ? L('Administrator', 'Administrator', 'Администратор')
        : L('Buyurtmachi', 'Client', 'Заказчик');
  return (
    <details className="svc-details" open={!!open}>
      <summary>
        💬 {L('Yozishma', 'Conversation', 'Переписка')} {msgs.length ? `(${msgs.length})` : ''}
      </summary>
      {msgs.length || lead ? (
        <ul className="svc-msgs">
          {lead && (
            <li className="is-team from-user is-lead">
              <small>
                {who('user')} · {dueText(lead.at, lang).date}
              </small>
              <b>{lead.head}</b>
              <p>{lead.text}</p>
              {lead.extra}
            </li>
          )}
          {msgs.map((m) => (
            <li key={m.id} className={(m.from === me ? 'is-me' : 'is-team') + ' from-' + m.from}>
              <small>
                {who(m.from)} · {dueText(m.at, lang).date}
              </small>
              <p>{m.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          {L(
            'Savolingiz bo‘lsa, shu yerda yozing.',
            'Have a question? Write here.',
            'Есть вопрос? Напишите здесь.',
          )}
        </p>
      )}
      {send && (
        <form
          className="svc-msg-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            if (await send(text.trim())) setText('');
            setBusy(false);
          }}
        >
          <input
            className="input"
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={L('Xabar yozing…', 'Write a message…', 'Напишите сообщение…')}
            aria-label={L('Xabar', 'Message', 'Сообщение')}
          />
          <Button
            type="submit"
            size="sm"
            disabled={busy || !text.trim()}
            aria-label={L('Yuborish', 'Send', 'Отправить')}
          >
            <Send size={15} />
          </Button>
        </form>
      )}
    </details>
  );
}

/* ---------- 🚀 «tez orada» oynasi: taklif yuborish ---------- */
function SoonModal({
  catalog,
  initial,
  signedIn,
  onClose,
  onSent,
}: {
  catalog: ServiceCard[];
  initial: string[];
  signedIn: boolean;
  onClose: () => void;
  onSent: (v: ServicesView) => void;
}) {
  const { lang, request, toast, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [kinds, setKinds] = useState<string[]>(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const ready = kinds.length > 0 || text.trim().length >= 3;
  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // server taklifni «Adminga xabar»ga yozadi va kartalardagi «kutmoqda» sanog'ini oshiradi
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
        op: 'idea',
        kinds,
        text: text.trim(),
      });
      toast(
        '💡 ' +
          L(
            'Rahmat! Taklifingiz administratorga yuborildi.',
            'Thank you! Your suggestion was sent to the administrator.',
            'Спасибо! Ваше предложение отправлено администратору.',
          ),
      );
      onSent(r.view);
      onClose();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="panel svc-form svc-soon-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="svc-soon-h"
        onSubmit={(e) => void send(e)}
      >
        <button
          ref={closeRef}
          type="button"
          className="av-close"
          aria-label={L('Yopish', 'Close', 'Закрыть')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="svc-soon-rocket" aria-hidden="true">
          🚀
        </span>
        <h2 id="svc-soon-h">
          {L(
            'Pullik xizmatlar tez orada ishga tushadi',
            'Paid services are launching soon',
            'Платные услуги скоро заработают',
          )}
        </h2>
        <p className="muted">
          {L(
            'Nima kerakligini yozasiz — ish sun’iy intellekt yordamida tayyorlanib, shu yerga keladi. Hozir fikringiz kerak: qaysi xizmatlar kerak?',
            'Describe what you need — the work is prepared with the help of AI and delivered here. Right now we need your opinion: which services do you need?',
            'Опишите, что нужно, — работа готовится с помощью ИИ и приходит сюда. Сейчас нам важно ваше мнение: какие услуги нужны?',
          )}
        </p>
        {signedIn ? (
          <>
            <fieldset className="svc-soon-kinds">
              <legend>
                {L(
                  'Qaysi xizmatlar kerak? (bir nechtasini tanlang)',
                  'Which services do you need? (pick any)',
                  'Какие услуги нужны? (можно несколько)',
                )}
              </legend>
              {catalog.map((k) => {
                const on = kinds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={on}
                    className={on ? 'on' : ''}
                    onClick={() =>
                      setKinds(on ? kinds.filter((x) => x !== k.id) : [...kinds, k.id])
                    }
                  >
                    {k.icon} {tr(lang, ...k.name)}
                  </button>
                );
              })}
            </fieldset>
            <label>
              {L(
                'Taklifingiz yoki istagingiz',
                'Your suggestion or wish',
                'Ваше предложение или пожелание',
              )}
              <textarea
                className="input"
                rows={3}
                maxLength={1200}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={L(
                  'Masalan: diplom himoyasi uchun taqdimot va narxi talabaga mos bo‘lsin',
                  'E.g. presentations for the thesis defence at a student-friendly price',
                  'Например: презентация к защите диплома по доступной цене',
                )}
              />
            </label>
            <div className="svc-form-actions">
              <Button type="submit" disabled={busy || !ready}>
                <Send size={16} />{' '}
                {busy
                  ? L('Yuborilmoqda…', 'Sending…', 'Отправка…')
                  : L('Taklif yuborish', 'Send the suggestion', 'Отправить предложение')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {L('Keyinroq', 'Later', 'Позже')}
              </Button>
            </div>
            <small className="muted">
              {L(
                'Taklifingiz «Adminga xabar» orqali administratorga boradi — javobni o‘sha yerda ko‘rasiz.',
                'Your suggestion goes to the administrator through “Message the admin” — you will see the reply there.',
                'Предложение придёт администратору через «Написать админу» — ответ увидите там же.',
              )}
            </small>
          </>
        ) : (
          <div className="svc-form-actions">
            <Button
              type="button"
              onClick={() => {
                onClose();
                setLogin(true);
              }}
            >
              {L('Kirib taklif yuborish', 'Sign in to send a suggestion', 'Войти и отправить идею')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {L('Keyinroq', 'Later', 'Позже')}
            </Button>
          </div>
        )}
      </form>
    </div>,
    document.body,
  );
}

/* ---------- 📝 buyurtma berish ---------- */
function OrderForm({
  card,
  discount,
  onClose,
  onDone,
}: {
  card: ServiceCard;
  /** obunachi chegirmasi (%) */
  discount: number;
  onClose: () => void;
  onDone: (v: ServicesView) => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [f, setF] = useState({ title: '', text: '', due: '', contact: '', budget: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, busy]);
  const budget = Number(f.budget.replace(/\D/g, '')) || 0;
  const budgetOk = budget >= BUDGET_MIN && budget <= BUDGET_MAX;
  function addFiles(list: FileList | null) {
    const picked = Array.from(list || []);
    const big = picked.find((x) => x.size > FILE_MAX.in);
    if (big)
      setError(
        L('Fayl 10 MB dan oshmasin: ', 'Max 10 MB per file: ', 'Не больше 10 МБ: ') + big.name,
      );
    setFiles((cur) =>
      [...cur, ...picked.filter((x) => x.size <= FILE_MAX.in)].slice(0, FILES_PER_ORDER.in),
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(L('Yuborilmoqda…', 'Sending…', 'Отправка…'));
    try {
      const r = await servicesAct<{ id: string; view: ServicesView }>(request, 'me', {
        op: 'order',
        kind: card.id,
        title: f.title.trim(),
        text: f.text.trim(),
        budget,
        ...(f.due ? { due: f.due } : {}),
        ...(f.contact.trim() ? { contact: f.contact.trim() } : {}),
      });
      let view = r.view;
      const made = view.orders?.find((o) => o.id === r.id);
      let failed = 0;
      for (const [i, file] of files.entries()) {
        try {
          await sendOrderFile(request, 'me', made!.uk + '/' + r.id, { id: r.id }, file, (x) =>
            setBusy(
              L('Fayl yuklanmoqda', 'Uploading', 'Загрузка файла') +
                ` ${i + 1}/${files.length} · ${Math.round(x * 100)}%`,
            ),
          );
        } catch {
          failed++;
        }
      }
      if (files.length) {
        const fresh = await request('/api/services');
        if (fresh.ok) view = await fresh.json();
      }
      toast(
        failed
          ? L(
              'Buyurtma qabul qilindi, lekin ba’zi fayllar yuklanmadi — buyurtma kartasidan qayta qo‘shing.',
              'Order received, but some files failed — add them again from the order card.',
              'Заказ принят, но часть файлов не загрузилась — добавьте их снова из карточки заказа.',
            )
          : '🤖 ' +
              L(
                'Buyurtma qabul qilindi! Sun’iy intellekt yordamida tayyorlanmoqda — tayyor bo‘lgach xabar keladi.',
                'Order received! It is being prepared with AI — you will be notified when it is ready.',
                'Заказ принят! Готовится с помощью ИИ — когда будет готов, придёт уведомление.',
              ),
      );
      onDone(view);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        className="panel svc-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="svc-form-h"
        onSubmit={(e) => void submit(e)}
      >
        <button
          type="button"
          className="av-close"
          aria-label={L('Yopish', 'Close', 'Закрыть')}
          onClick={onClose}
          disabled={!!busy}
        >
          <X size={20} />
        </button>
        <h2 id="svc-form-h">
          <span aria-hidden="true">{card.icon}</span> {tr(lang, ...card.name)}
        </h2>
        <p className="muted">{tr(lang, ...card.text)}</p>
        {card.help && (
          <p className="svc-honest svc-honest-small">
            <span aria-hidden="true">🤝</span>
            <span>
              {L(
                'Bu yo‘nalishda yordam beramiz: reja, manbalar, tahrir, rasmiylashtirish. Matnni o‘zingiz yozasiz.',
                'Here we assist: outline, sources, editing, formatting. You write the text yourself.',
                'Здесь мы помогаем: план, источники, редактура, оформление. Текст пишете вы сами.',
              )}
            </span>
          </p>
        )}
        <label>
          {L('Mavzu yoki ish nomi', 'Topic or title', 'Тема или название')}
          <input
            ref={first}
            className="input"
            required
            minLength={3}
            maxLength={160}
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </label>
        <label>
          {L('Nima kerak? Batafsil yozing', 'What do you need? Details', 'Что нужно? Подробно')}
          <textarea
            className="input"
            required
            minLength={10}
            maxLength={3000}
            rows={4}
            value={f.text}
            onChange={(e) => setF({ ...f, text: e.target.value })}
            placeholder={tr(lang, ...card.hint)}
          />
        </label>
        <label className="mk-budget-field">
          {L(
            'Qancha to‘lay olasiz? (so‘m)',
            'How much can you pay? (so‘m)',
            'Сколько готовы заплатить? (сум)',
          )}
          <input
            className="input"
            inputMode="numeric"
            required
            value={f.budget}
            onChange={(e) => {
              const n = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
              setF({ ...f, budget: groupDigits(n) });
            }}
            placeholder="100 000"
          />
          <small className="muted">
            {budget > 0 && !budgetOk
              ? L(
                  `Summa ${formatSum(BUDGET_MIN)} dan kam bo‘lmasin.`,
                  `At least ${formatSum(BUDGET_MIN)}.`,
                  `Не меньше ${formatSum(BUDGET_MIN)}.`,
                )
              : card.price
                ? '💡 ' + L('Odatdagi narx', 'Usual price', 'Обычная цена') + ': ' + card.price
                : L(
                    'Ish hajmiga mos summani yozing.',
                    'Write an amount that fits the job.',
                    'Укажите сумму, соответствующую объёму работы.',
                  )}
          </small>
          {!!discount && budgetOk && (
            <small className="svc-discount">
              💎{' '}
              {L(
                `Premium chegirmasi −${discount} %: siz ${formatSum(payable({ budget, discount }))} to‘laysiz`,
                `Premium discount −${discount}%: you pay ${formatSum(payable({ budget, discount }))}`,
                `Скидка подписчика −${discount}%: вы платите ${formatSum(payable({ budget, discount }))}`,
              )}
            </small>
          )}
        </label>
        <div className="svc-form-row">
          <label>
            {L('Qachongacha kerak?', 'Needed by', 'Нужно к')}
            <input
              className="input"
              type="date"
              min={today()}
              value={f.due}
              onChange={(e) => setF({ ...f, due: e.target.value })}
            />
          </label>
          <label>
            {L(
              'Telefon yoki Telegram (ixtiyoriy)',
              'Phone or Telegram (optional)',
              'Телефон или Telegram',
            )}
            <input
              className="input"
              maxLength={80}
              value={f.contact}
              onChange={(e) => setF({ ...f, contact: e.target.value })}
              placeholder="@username"
            />
          </label>
        </div>
        <div className="svc-attach">
          <label className="svc-attach-btn">
            <Paperclip size={16} />
            {L('Fayl biriktirish', 'Attach files', 'Прикрепить файлы')}
            <input
              type="file"
              multiple
              accept={FILE_ACCEPT}
              disabled={files.length >= FILES_PER_ORDER.in || !!busy}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <small className="muted">
            {L(
              'Ixtiyoriy: 3 tagacha, har biri 10 MB gacha. Fayllarni faqat administrator ko‘radi.',
              'Optional: up to 3 files, 10 MB each. Only the administrator sees them.',
              'Необязательно: до 3 файлов по 10 МБ. Их видит только администратор.',
            )}
          </small>
          {!!files.length && (
            <ul>
              {files.map((x, i) => (
                <li key={i}>
                  <span>
                    📎 {x.name} · {fileSize(x.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={L('Olib tashlash', 'Remove', 'Убрать') + ': ' + x.name}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    disabled={!!busy}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="error-state">{error}</p>}
        <div className="svc-form-actions">
          <Button
            type="submit"
            disabled={!!busy || f.title.trim().length < 3 || f.text.trim().length < 10 || !budgetOk}
          >
            <Send size={16} /> {busy || L('Buyurtma berish', 'Place the order', 'Заказать')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={!!busy}>
            {L('Bekor', 'Cancel', 'Отмена')}
          </Button>
        </div>
        <small className="muted">
          {L(
            'To‘lov yo‘riqnomasi buyurtmangiz sahifasida chiqadi. Savollar bo‘lsa, buyurtma yozishmasida javob beramiz.',
            'Payment instructions appear on your order page. If you have questions, we answer in the order chat.',
            'Инструкция по оплате появится на странице заказа. На вопросы ответим в переписке по заказу.',
          )}
        </small>
      </form>
    </div>,
    document.body,
  );
}

/* ---------- 📦 buyurtmachining buyurtmasi ---------- */
function OrderCard({
  order: o,
  how,
  onView,
}: {
  order: ServiceOrder;
  how: string;
  onView: (v: ServicesView) => void;
}) {
  const { lang, request, toast, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [fix, setFix] = useState('');
  const [mode, setMode] = useState<'' | 'fix' | 'accept'>('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [icon, name] = STATUS_LABEL[o.status];
  async function act(input: Record<string, unknown>, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', { id: o.id, ...input });
      onView(r.view);
      if (done) toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  async function attach(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (file.size > FILE_MAX.in)
      return toast(L('Fayl 10 MB dan oshmasin.', 'Max 10 MB.', 'Не больше 10 МБ.'));
    setBusy('attach');
    try {
      await sendOrderFile(request, 'me', o.uk + '/' + o.id, { id: o.id }, file);
      const r = await request('/api/services');
      if (r.ok) onView(await r.json());
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const step = stepOf(o.status);
  const ins = o.files.filter((f) => f.side === 'in'),
    outs = o.files.filter((f) => f.side === 'out');
  // 🛍 mahsulot (yakuniy test, Premium): tayyorlanmaydi — to'lov tasdiqlanishi bilan o'zi ochiladi
  const product = isProduct(o.kind);
  const [sIcon, sName]: [string, Tri] = !product
    ? [icon, name]
    : o.status === 'done'
      ? ['✅', ['Ochildi', 'Unlocked', 'Открыто']]
      : o.status === 'cancel'
        ? [icon, name]
        : o.paidAt
          ? ['🔎', ['To‘lov tekshirilmoqda', 'Checking payment', 'Проверка оплаты']]
          : ['💳', ['To‘lov kutilmoqda', 'Awaiting payment', 'Ожидает оплаты']];
  const pay = payable(o);
  return (
    <article className={'panel svc-order is-' + o.status} style={toneOf(o.kind)}>
      <header>
        <div>
          <small className="muted">
            {kindTitle(lang, o.kind)} · {dueText(o.at, lang).date}
          </small>
          <h3>{o.title}</h3>
        </div>
        <span className={'svc-status is-' + o.status}>
          {sIcon} {tr(lang, ...sName)}
        </span>
      </header>
      {o.status !== 'cancel' && !product && (
        <ol className="svc-track" aria-label={L('Bosqichlar', 'Stages', 'Этапы')}>
          {TRACK_NAME.map((n, i) => (
            <li key={i} className={i < step ? 'done' : i === step ? 'now' : ''}>
              {tr(lang, ...n)}
            </li>
          ))}
        </ol>
      )}
      <p className="svc-order-meta">
        <span>
          💰 <b>{formatSum(pay)}</b>
          {!!o.discount && (
            <>
              {' '}
              <s className="muted">{formatSum(o.budget)}</s> 💎 −{o.discount} %
            </>
          )}
        </span>
        {o.due && (
          <span>
            📅 {o.due} · {daysLeft(o.due, lang)}
          </span>
        )}
      </p>

      {product && o.status === 'done' && (
        <p className="svc-note mk-paid">
          ✅{' '}
          {o.kind === 'yakuniy-test' ? (
            <a href={'#course/' + (data?.courses?.[0]?.id || '') + '/exam'}>
              {L(
                'Bo‘lim ochildi — yakuniy testga tayyorgarlikka o‘tish →',
                'Unlocked — go to the final exam preparation →',
                'Открыто — перейти к подготовке к итоговому тесту →',
              )}
            </a>
          ) : (
            L('Premium obuna faollashdi.', 'Premium is active.', 'Подписка активирована.')
          )}
        </p>
      )}
      {o.status === 'work' && !product && (
        <div className="svc-ai" role="status">
          <span className="svc-ai-icon" aria-hidden="true">
            🤖
          </span>
          <div>
            <b>
              {L(
                'Sun’iy intellekt yordamida tayyorlanmoqda',
                'Being prepared with AI',
                'Готовится с помощью ИИ',
              )}
              <span className="svc-ai-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </b>
            <small>
              {L(
                'Tayyor bo‘lgach bildirishnoma keladi. Savol bo‘lsa, pastdagi yozishmada so‘raymiz.',
                'You will be notified when it is ready. If we have questions, we ask in the chat below.',
                'Когда будет готово, придёт уведомление. Вопросы зададим в переписке ниже.',
              )}
            </small>
          </div>
        </div>
      )}
      {o.status !== 'cancel' && o.budget > 0 && !(product && o.status === 'done') && (
        <div className={'svc-pay' + (o.payOk ? ' is-ok' : '')}>
          {o.payOk ? (
            <b>
              ✅ {L('To‘lov tasdiqlangan', 'Payment confirmed', 'Оплата подтверждена')}:{' '}
              {formatSum(pay)}
            </b>
          ) : o.paidAt ? (
            <>
              <b>
                🔎 {L('To‘lov tekshirilmoqda', 'Checking payment', 'Оплата проверяется')}:{' '}
                {formatSum(pay)}
              </b>
              {o.paidNote && <small className="muted">🧾 {o.paidNote}</small>}
            </>
          ) : (
            <>
              <b>
                💳 {L('To‘lov', 'Payment', 'Оплата')}: {formatSum(pay)}
              </b>
              <p className="svc-pay-how">
                {how ||
                  L(
                    'To‘lov usulini bilish uchun pastdagi yozishmada so‘rang.',
                    'Ask in the conversation below how to pay.',
                    'Спросите в переписке ниже, как оплатить.',
                  )}
              </p>
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
              <Button
                size="sm"
                disabled={!!busy}
                onClick={() =>
                  void act(
                    { op: 'paid', note: note.trim() },
                    'paid',
                    L(
                      'Rahmat! To‘lovingiz tekshiriladi.',
                      'Thank you! Your payment will be checked.',
                      'Спасибо! Оплата будет проверена.',
                    ),
                  )
                }
              >
                💳 {L('To‘lov qildim', 'I paid', 'Я оплатил')}
              </Button>
            </>
          )}
        </div>
      )}
      {o.status === 'cancel' && o.reason && (
        <p className="svc-note">
          ✖ {L('Sabab', 'Reason', 'Причина')}: {o.reason}
        </p>
      )}

      {(outs.length > 0 || o.link) && (
        <div className="svc-result">
          <b>📥 {L('Natija', 'Result', 'Результат')}</b>
          {!!outs.length && <FileList files={outs} o={o.uk + '/' + o.id} />}
          {o.link && (
            <a className="svc-link" href={o.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} /> {L('Havolani ochish', 'Open the link', 'Открыть ссылку')}
            </a>
          )}
          {o.status === 'done' && (
            <small className="muted">
              {L(
                `Fayllar ${KEEP_DAYS} kun saqlanadi — o‘z qurilmangizga yuklab oling.`,
                `Files are kept for ${KEEP_DAYS} days — save them to your device.`,
                `Файлы хранятся ${KEEP_DAYS} дней — сохраните их на устройство.`,
              )}
            </small>
          )}
        </div>
      )}
      {o.status === 'review' && (
        <div className="mk-review-box">
          <b>👀 {L('Natijani tekshiring', 'Check the result', 'Проверьте результат')}</b>
          {mode === 'accept' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await act(
                    { op: 'accept', rating, ...(review.trim() ? { review: review.trim() } : {}) },
                    'accept',
                    '⭐ ' +
                      L(
                        'Rahmat! Ish qabul qilindi.',
                        'Thanks! Work accepted.',
                        'Спасибо! Работа принята.',
                      ),
                  )
                )
                  setMode('');
              }}
            >
              <div className="mk-rate" role="radiogroup" aria-label={L('Baho', 'Rating', 'Оценка')}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={n + ' / 5'}
                    className={n <= rating ? 'on' : ''}
                    onClick={() => setRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <input
                className="input"
                maxLength={500}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={L(
                  'Fikringiz (ixtiyoriy)',
                  'Your feedback (optional)',
                  'Отзыв (необязательно)',
                )}
                aria-label={L('Fikringiz', 'Feedback', 'Отзыв')}
              />
              <div className="svc-row">
                <Button type="submit" size="sm" disabled={!!busy}>
                  ✅ {L('Qabul qilaman', 'Accept', 'Принимаю')}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setMode('')}>
                  {L('Bekor', 'Cancel', 'Отмена')}
                </Button>
              </div>
            </form>
          ) : mode === 'fix' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await act({ op: 'revise', text: fix.trim() }, 'revise')) {
                  setFix('');
                  setMode('');
                }
              }}
            >
              <textarea
                className="input"
                rows={3}
                maxLength={1000}
                value={fix}
                onChange={(e) => setFix(e.target.value)}
                aria-label={L('Nimani tuzatish kerak?', 'What should change?', 'Что исправить?')}
                placeholder={L('Nimani tuzatish kerak?', 'What should change?', 'Что исправить?')}
              />
              <div className="svc-row">
                <Button type="submit" size="sm" disabled={!!busy || fix.trim().length < 3}>
                  🔁 {L('Tuzatish so‘rash', 'Ask for changes', 'Попросить правки')}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setMode('')}>
                  {L('Bekor', 'Cancel', 'Отмена')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="svc-row">
              <Button size="sm" onClick={() => setMode('accept')}>
                ✅ {L('Qabul qilish', 'Accept', 'Принять')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode('fix')}>
                🔁 {L('Tuzatish kerak', 'Needs changes', 'Нужны правки')}
              </Button>
            </div>
          )}
        </div>
      )}
      {o.status === 'done' && (
        <p className="svc-note mk-paid">
          ✅ {L('Yakunlandi', 'Completed', 'Завершено')} <Stars n={o.rating} />
          {o.review && <q className="mk-review">{o.review}</q>}
        </p>
      )}
      {o.expired && (
        <p className="svc-note">
          {L(
            `Fayllar saqlash muddati (${KEEP_DAYS} kun) tugagani uchun o‘chirildi.`,
            `The files were deleted after ${KEEP_DAYS} days.`,
            `Файлы удалены по истечении ${KEEP_DAYS} дней.`,
          )}
        </p>
      )}

      <details className="svc-details">
        <summary>
          📄 {L('Buyurtma tafsilotlari', 'Order details', 'Детали заказа')}
          {!!ins.length && ` · 📎 ${ins.length}`}
        </summary>
        <p className="svc-text">{o.text}</p>
        {o.contact && <p className="muted">📞 {o.contact}</p>}
        {!!ins.length && (
          <FileList
            files={ins}
            o={o.uk + '/' + o.id}
            remove={
              isActive(o.status)
                ? async (f) => {
                    const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
                      op: 'unfile',
                      id: o.id,
                      fid: f.id,
                    });
                    onView(r.view);
                  }
                : undefined
            }
          />
        )}
        {isActive(o.status) &&
          !product &&
          o.status !== 'review' &&
          ins.length < FILES_PER_ORDER.in && (
            <label className="svc-attach-btn is-small">
              <Paperclip size={15} />
              {busy === 'attach'
                ? L('Yuklanmoqda…', 'Uploading…', 'Загрузка…')
                : L('Fayl qo‘shish', 'Add a file', 'Добавить файл')}
              <input
                type="file"
                accept={FILE_ACCEPT}
                disabled={!!busy}
                onChange={(e) => {
                  void attach(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}
      </details>
      {o.status !== 'cancel' && (
        <Chat
          msgs={o.msgs}
          me="user"
          open={o.status !== 'done' && o.msgs.length > 0}
          send={async (text) => await act({ op: 'msg', text }, 'msg')}
        />
      )}

      <footer className="svc-order-actions">
        {o.status === 'work' && !o.paidAt && !o.payOk && !o.deliveredAt && (
          <Button
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => {
              if (
                window.confirm(
                  L('Buyurtmani bekor qilasizmi?', 'Cancel this order?', 'Отменить заказ?'),
                )
              )
                void act({ op: 'cancel' }, 'cancel');
            }}
          >
            {L('Bekor qilish', 'Cancel order', 'Отменить')}
          </Button>
        )}
        {!isActive(o.status) && (
          <Button
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => {
              if (
                window.confirm(
                  L(
                    'Buyurtma va uning fayllari butunlay o‘chiriladi. Davom etasizmi?',
                    'The order and its files will be deleted for good. Continue?',
                    'Заказ и его файлы будут удалены навсегда. Продолжить?',
                  ),
                )
              )
                void act({ op: 'remove' }, 'remove');
            }}
          >
            <Trash2 size={14} /> {L('Ro‘yxatdan o‘chirish', 'Delete', 'Удалить')}
          </Button>
        )}
      </footer>
    </article>
  );
}

/** Fayllar ro'yxati: yuklab olish (bo'laklab, foiz bilan) va (berilgan bo'lsa) o'chirish. o — «<buyurtmachi>/<buyurtma>». */
export function FileList({
  files,
  o,
  remove,
}: {
  files: OrderFile[];
  o: string;
  remove?: (f: OrderFile) => Promise<void>;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [state, setState] = useState<Record<string, string>>({});
  async function get(f: OrderFile) {
    setState((s) => ({ ...s, [f.id]: '0%' }));
    try {
      await saveOrderFile(request, o, f, (x) =>
        setState((s) => ({ ...s, [f.id]: Math.round(x * 100) + '%' })),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setState((s) => ({ ...s, [f.id]: '' }));
    }
  }
  async function drop(f: OrderFile) {
    if (
      !window.confirm(
        L('Fayl o‘chirilsinmi?', 'Delete this file?', 'Удалить файл?') + '\n' + f.name,
      )
    )
      return;
    try {
      await remove!(f);
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <ul className="svc-files">
      {files.map((f) => (
        <li key={f.id}>
          <span className="svc-file-name">
            {FILE_TYPES[f.ext].icon} {f.name}
            <small> · {fileSize(f.size)}</small>
          </span>
          <Button size="sm" variant="outline" disabled={!!state[f.id]} onClick={() => void get(f)}>
            <Download size={14} /> {state[f.id] || L('Yuklab olish', 'Download', 'Скачать')}
          </Button>
          {remove && (
            <Button
              size="sm"
              variant="outline"
              aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + f.name}
              onClick={() => void drop(f)}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
