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
  Upload,
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
  fileSize,
  formatSum,
  isActive,
  serviceKind,
  type BoardTask,
  type OrderFile,
  type ServiceCard,
  type ServiceGroup,
  type ServiceOrder,
  type ServicesView,
  type Tri,
  type WorkerProfile,
} from '@/lib/services';
import type { Lang } from '@/lib/types';

/* 💼 Pullik xizmatlar — talabalar ish bozori.
   • 🛒 Buyurtma berish: katalogdan yo'nalishni tanlab vazifani va to'lay oladigan summani yozish;
   • 📋 Vazifalar: ochiq vazifalar e'loni — ijrochi talabalar «🙋 Men qilaman» deydi;
   • 📦 Buyurtmalarim: arizalar, to'lov, natijani tekshirish, qabul qilish va baho;
   • 💸 Ishlab topish: ijrochi bo'lib ro'yxatdan o'tish va kabinet (ishlar, topilgan pul, reyting).
   Pulni hamma vaqt administrator qabul qiladi va ijrochiga o'tkazadi. Server — lib/server/services.ts.
   Administrator bo'limni ishga tushirguncha (view.open = false) talaba kirganda «🚀 Tez orada ishga tushadi» oynasi
   chiqadi: taklif yuboradi yoki oldindan ijrochi bo'lib ro'yxatdan o'tadi. */
const IDEA_KEY = 'sq-svc-idea';
type Tab = 'order' | 'board' | 'mine' | 'work';
const TABS: Tab[] = ['order', 'board', 'mine', 'work'];

const STEPS: [string, Tri, Tri][] = [
  [
    '📝',
    ['Vazifani yozing', 'Post a task', 'Опишите задачу'],
    [
      'Nima kerakligini, muddatni va qancha to‘lay olishingizni yozing.',
      'Say what you need, by when and how much you can pay.',
      'Опишите задачу, срок и сколько готовы заплатить.',
    ],
  ],
  [
    '🙋',
    ['Ijrochilar ariza beradi', 'Workers apply', 'Исполнители откликаются'],
    [
      'Ishlaydigan talabalar vazifani ko‘rib «Men qilaman» deydi.',
      'Student workers see the task and say “I’ll do it”.',
      'Студенты-исполнители видят задачу и откликаются.',
    ],
  ],
  [
    '🛡',
    ['Admin tasdiqlaydi', 'Admin approves', 'Админ утверждает'],
    [
      'Administrator eng mos ijrochini tasdiqlaydi — shundan keyin to‘lov qilasiz.',
      'The administrator approves the best worker — then you pay.',
      'Администратор утверждает исполнителя — затем вы оплачиваете.',
    ],
  ],
  [
    '🛠',
    ['Ish bajariladi', 'The work is done', 'Работа выполняется'],
    [
      'Ijrochi ishlaydi, savollarni yozishmada so‘raydi va natijani yuklaydi.',
      'The worker does the job, asks in the chat and uploads the result.',
      'Исполнитель работает, задаёт вопросы в чате и загружает результат.',
    ],
  ],
  [
    '⭐',
    ['Qabul va baho', 'Accept and rate', 'Приёмка и оценка'],
    [
      'Natijani tekshirib qabul qilasiz — administrator ijrochiga pulini o‘tkazadi.',
      'You check and accept — the administrator pays the worker.',
      'Вы принимаете работу — администратор переводит деньги исполнителю.',
    ],
  ],
];
const TRACK_NAME: Tri[] = [
  ['E’lon', 'Posted', 'Объявление'],
  ['Ijrochi', 'Worker', 'Исполнитель'],
  ['To‘lov', 'Payment', 'Оплата'],
  ['Ish', 'Work', 'Работа'],
  ['Qabul', 'Accept', 'Приёмка'],
];
/** Holat → kuzatuv chizig'idagi qadam (0..5). */
const stepOf = (s: ServiceOrder['status']) =>
  ({ open: 0, assigned: 1, paid: 2, work: 3, review: 4, done: 5, cancel: -1 })[s];
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
const share = (budget: number, fee: number) => Math.round((budget * (100 - fee)) / 100);
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
  const activeJobs = (view?.jobs || []).filter((j) => isActive(j.status)).length;
  // bo'lim hali ishga tushmagan: talaba buyurtma o'rniga taklif yuboradi (administrator sinab ko'rishi mumkin)
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
    ['board', '📋', L('Vazifalar', 'Tasks', 'Задачи'), view?.stats.tasks || 0],
    ['mine', '📦', L('Buyurtmalarim', 'My orders', 'Мои заказы'), openOrders],
    [
      'work',
      '💸',
      view?.me ? L('Ishlarim', 'My jobs', 'Мои работы') : L('Ishlab topish', 'Earn', 'Заработать'),
      activeJobs,
    ],
  ];
  return (
    <>
      <header className="page-heading svc-hero">
        <div className="svc-hero-text">
          <span className="eyebrow">
            {L('TALABALAR ISH BOZORI', 'STUDENT MARKETPLACE', 'БИРЖА СТУДЕНТОВ')}
          </span>
          <h1>💼 {L('Pullik xizmatlar', 'Paid services', 'Платные услуги')}</h1>
          <p>
            {L(
              'Vazifangizni yozing — ijrochi talabalar bajaradi. Yoki o‘zingiz boshqalarning ishini qilib pul ishlang.',
              'Post your task — student workers will do it. Or earn money doing tasks for others.',
              'Опишите задачу — студенты-исполнители её выполнят. Или зарабатывайте, выполняя чужие задачи.',
            )}
          </p>
          <ul className="svc-hero-stats" aria-label={L('Ko‘rsatkichlar', 'Figures', 'Показатели')}>
            <li>
              <b>{view ? view.stats.tasks : '…'}</b>
              <span>{L('ochiq vazifa', 'open tasks', 'открытых задач')}</span>
            </li>
            <li>
              <b>{view ? view.stats.workers : '…'}</b>
              <span>{L('ijrochi talaba', 'student workers', 'исполнителей')}</span>
            </li>
            <li>
              <b>{view ? (view.open ? view.stats.done : view.fans) : '…'}</b>
              <span>
                {soonMode
                  ? L('kishi kutmoqda', 'people waiting', 'ждут запуска')
                  : L('bajarilgan ish', 'jobs done', 'выполнено')}
              </span>
            </li>
          </ul>
          <div className="page-heading-side">
            <Button onClick={() => (waiting ? setSoon([]) : go('order'))}>
              ➕ {L('Vazifa berish', 'Post a task', 'Дать задачу')}
            </Button>
            <Button variant="outline" className="svc-hero-ghost" onClick={() => go('work')}>
              💸 {L('Ishlab topish', 'Earn money', 'Заработать')}
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
          <span>💸</span>
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
                    'Taklifingiz administratorga yetib bordi — rahmat! Bo‘lim ishga tushganda shu yerda vazifa bera olasiz. Hozirdan ijrochi bo‘lib ro‘yxatdan o‘tishingiz mumkin.',
                    'Your suggestion reached the administrator — thank you! You will be able to post tasks once the section opens. You can sign up as a worker already.',
                    'Ваше предложение получено — спасибо! Когда раздел заработает, задачи можно будет давать здесь. Стать исполнителем можно уже сейчас.',
                  )
                : L(
                    'Jamoa tayyorgarlik ko‘ryapti. Sizga qaysi xizmat kerakligini yozing yoki hozirdan ijrochi bo‘lib ro‘yxatdan o‘ting.',
                    'The team is getting ready. Tell us which services you need or sign up as a worker now.',
                    'Команда готовится. Напишите, какие услуги нужны, или уже сейчас станьте исполнителем.',
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
            'Bo‘lim talabalar uchun vaqtincha yopiq: menyuda ko‘rinmaydi, talaba va ijrochi amallari qabul qilinmaydi. Sahifani faqat siz ko‘ryapsiz. Ochish — «Boshqarish» → «Bo‘limni ochish».',
            'The section is temporarily closed for students: hidden from the menu, student and worker actions are refused. Only you see this page. Reopen via “Manage” → “Open the section”.',
            'Раздел временно закрыт для студентов: скрыт из меню, действия студентов и исполнителей не принимаются. Страницу видите только вы. Открыть — «Управление» → «Открыть раздел».',
          )}
        </p>
      )}
      {admin && soonMode && (
        <p className="svc-soon is-admin">
          ⏸{' '}
          {L(
            'Bo‘lim hali ishga tushmagan: talabalar «Tez orada» oynasini ko‘radi, taklif yuboradi va ijrochi bo‘lib ro‘yxatdan o‘ta oladi. Siz sinab ko‘rish uchun vazifa bera olasiz. Ishga tushirish — «Boshqarish» tugmasi orqali.',
            'The section is not launched: students see “Launching soon”, send suggestions and can sign up as workers. You can post test tasks. Launch it via “Manage”.',
            'Раздел ещё не запущен: студенты видят «Скоро запуск», отправляют идеи и могут стать исполнителями. Вы можете дать тестовую задачу. Запуск — через «Управление».',
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
                        'Kartani bosing — vazifa va summani yozasiz, ijrochi talabalar ariza beradi.',
                        'Tap a card — describe the task and your budget, student workers will apply.',
                        'Нажмите на карточку — опишите задачу и бюджет, исполнители откликнутся.',
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
                        : L('Vazifa berish', 'Post a task', 'Дать задачу') + ' →'}
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
                  'Vazifa berish uchun hisobingizga kiring.',
                  'Sign in to post a task.',
                  'Войдите, чтобы дать задачу.',
                )}{' '}
                <Button size="sm" variant="outline" onClick={() => setLogin(true)}>
                  {L('Kirish', 'Sign in', 'Войти')}
                </Button>
              </p>
            )}
          </section>
          <HowItWorks />
          {!!view.top.length && <TopWorkers view={view} />}
        </>
      )}

      {view && tab === 'board' && <Board view={view} onView={setView} goWork={() => go('work')} />}

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
              <b>{L('Hali vazifa bermagansiz', 'No tasks yet', 'Заданий пока нет')}</b>
              <p className="muted">
                {L(
                  'Katalogdan yo‘nalish tanlang, vazifa va summani yozing — ijrochilar ariza beradi.',
                  'Pick a direction, describe the task and budget — workers will apply.',
                  'Выберите направление, опишите задачу и бюджет — исполнители откликнутся.',
                )}
              </p>
              <Button onClick={() => (waiting ? setSoon([]) : go('order'))}>
                ➕ {L('Vazifa berish', 'Post a task', 'Дать задачу')}
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

      {view && tab === 'work' && (
        <WorkTab view={view} onView={setView} goBoard={() => go('board')} />
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
          onWorker={() => {
            setSoon(null);
            go('work');
          }}
        />
      )}
      {pick && (
        <OrderForm
          card={pick}
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
            'Pul to‘g‘ridan-to‘g‘ri ijrochiga emas, administratorga to‘lanadi: ish qabul qilingandan keyingina administrator uni ijrochiga o‘tkazadi. Kurs ishi, BMI, referat va maqolada ijrochi faqat yordam beradi (reja, manbalar, tahrir, rasmiylashtirish) — matnni o‘zingiz yozasiz.',
            'You pay the administrator, not the worker directly: the administrator passes the money on only after you accept the work. For course papers, theses, essays and articles workers only assist (outline, sources, editing, formatting) — you write the text.',
            'Оплата идёт администратору, а не исполнителю напрямую: деньги передаются исполнителю только после приёмки работы. В курсовых, ВКР, рефератах и статьях исполнитель только помогает (план, источники, редактура, оформление) — текст пишете вы.',
          )}
        </span>
      </p>
    </section>
  );
}

function TopWorkers({ view }: { view: ServicesView }) {
  const { lang } = useApp();
  return (
    <section className="mk-top" aria-labelledby="mk-top-h">
      <h2 id="mk-top-h" className="svc-h2">
        🏆 {tr(lang, 'Eng faol ijrochilar', 'Top workers', 'Лучшие исполнители')}
      </h2>
      <ul>
        {view.top.map((w, i) => (
          <li key={i}>
            <span className="mk-avatar" aria-hidden="true">
              {w.name[0]}
            </span>
            <span>
              <b>{w.name}</b>
              <small>
                {w.skills.map((s) => serviceKind(s)?.icon).join(' ')} ·{' '}
                {tr(lang, `${w.jobs} ta ish`, `${w.jobs} jobs`, `работ: ${w.jobs}`)}
              </small>
            </span>
            <Stars n={w.rating} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 📋 vazifalar e'loni ---------- */
function Board({
  view,
  onView,
  goWork,
}: {
  view: ServicesView;
  onView: (v: ServicesView) => void;
  goWork: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [kind, setKind] = useState('');
  const [open, setOpen] = useState<BoardTask | null>(null);
  if (!view.signedIn) return <SignInNote />;
  const board = view.board || [];
  const kinds = [...new Set(board.map((t) => t.kind))];
  const list = board.filter((t) => !kind || t.kind === kind);
  return (
    <section className="mk-board" aria-labelledby="mk-board-h">
      <h2 id="mk-board-h" className="svc-h2">
        📋 {L('Ochiq vazifalar', 'Open tasks', 'Открытые задачи')}
      </h2>
      <p className="muted">
        {L(
          'Talabalar bergan vazifalar. Qila oladiganingizni tanlang va «Men qilaman» deng — administrator tasdiqlaydi.',
          'Tasks posted by students. Pick one you can do and say “I’ll do it” — the administrator approves.',
          'Задачи от студентов. Выберите подходящую и откликнитесь — администратор утвердит.',
        )}
      </p>
      {!view.me && (
        <div className="mk-cta">
          <span aria-hidden="true">💸</span>
          <div>
            <b>{L('Ishlab pul toping!', 'Earn money!', 'Зарабатывайте!')}</b>
            <p>
              {L(
                'Ariza berish uchun avval ijrochi bo‘lib ro‘yxatdan o‘ting — bir daqiqa.',
                'Sign up as a worker first to apply — it takes a minute.',
                'Чтобы откликаться, сначала станьте исполнителем — это минута.',
              )}
            </p>
          </div>
          <Button onClick={goWork}>
            🧑‍💻 {L('Ijrochi bo‘lish', 'Become a worker', 'Стать исполнителем')}
          </Button>
        </div>
      )}
      {kinds.length > 1 && (
        <div
          className="lib-kinds svc-groups"
          role="group"
          aria-label={L('Yo‘nalish', 'Kind', 'Вид')}
        >
          <button className={!kind ? 'on' : ''} onClick={() => setKind('')}>
            {L('Hammasi', 'All', 'Все')} <em>{board.length}</em>
          </button>
          {kinds.map((k) => (
            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {kindTitle(lang, k)} <em>{board.filter((t) => t.kind === k).length}</em>
            </button>
          ))}
        </div>
      )}
      {!list.length ? (
        <div className="mk-empty">
          <span aria-hidden="true">🌱</span>
          <b>{L('Hozircha ochiq vazifa yo‘q', 'No open tasks yet', 'Открытых задач пока нет')}</b>
          <p className="muted">
            {L(
              'Yo‘nalishingiz bo‘yicha yangi vazifa chiqqanda bildirishnoma keladi.',
              'You will be notified when a new task in your field appears.',
              'Когда появится задача по вашему направлению, придёт уведомление.',
            )}
          </p>
        </div>
      ) : (
        <ul className="mk-tasks">
          {list.map((t) => (
            <li key={t.uk + t.id}>
              <button
                type="button"
                className={'mk-task' + (t.applied ? ' is-applied' : '') + (t.own ? ' is-own' : '')}
                style={toneOf(t.kind)}
                onClick={() => setOpen(t)}
              >
                <span className="mk-task-top">
                  <span className="mk-kind">{kindTitle(lang, t.kind)}</span>
                  <span className="mk-budget">{formatSum(t.budget)}</span>
                </span>
                <b className="mk-task-title">{t.title}</b>
                <small className="mk-task-text">{t.text}</small>
                <span className="mk-task-meta">
                  <span>
                    👤 {t.by}
                    {t.group ? ' · ' + t.group : ''}
                  </span>
                  {t.due && <span>📅 {daysLeft(t.due, lang)}</span>}
                  <span>🙋 {L(`${t.apps} ariza`, `${t.apps} applied`, `откликов: ${t.apps}`)}</span>
                </span>
                <span className="mk-task-go">
                  {t.own
                    ? L('Sizning vazifangiz', 'Your task', 'Ваша задача')
                    : t.applied
                      ? '✅ ' + L('Ariza yuborilgan', 'Applied', 'Отклик отправлен')
                      : '🙋 ' + L('Men qilaman', 'I’ll do it', 'Возьмусь')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <TaskModal
          task={open}
          view={view}
          onClose={() => setOpen(null)}
          onView={(v) => {
            onView(v);
            setOpen(null);
          }}
          goWork={goWork}
        />
      )}
    </section>
  );
}

function Modal({
  label,
  onClose,
  children,
  className = '',
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const { lang } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className={'panel svc-form ' + className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button
          ref={closeRef}
          type="button"
          className="av-close"
          aria-label={tr(lang, 'Yopish', 'Close', 'Закрыть')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function TaskModal({
  task: t,
  view,
  onClose,
  onView,
  goWork,
}: {
  task: BoardTask;
  view: ServicesView;
  onClose: () => void;
  onView: (v: ServicesView) => void;
  goWork: () => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [note, setNote] = useState(t.applied?.note || '');
  const [busy, setBusy] = useState(false);
  const k = serviceKind(t.kind);
  async function act(input: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
        uk: t.uk,
        id: t.id,
        ...input,
      });
      toast(done);
      onView(r.view);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal label={t.title} onClose={onClose} className="mk-task-modal">
      <span className="mk-kind" style={toneOf(t.kind)}>
        {kindTitle(lang, t.kind)}
      </span>
      <h2>{t.title}</h2>
      <div className="mk-modal-sum">
        <span>
          <small>{L('Buyurtmachi to‘laydi', 'Client pays', 'Заказчик платит')}</small>
          <b>{formatSum(t.budget)}</b>
        </span>
        <span>
          <small>{L('Siz olasiz', 'You get', 'Вы получите')}</small>
          <b className="mk-green">{formatSum(share(t.budget, view.fee))}</b>
        </span>
        {t.due && (
          <span>
            <small>{L('Muddat', 'Due', 'Срок')}</small>
            <b>
              {t.due} · {daysLeft(t.due, lang)}
            </b>
          </span>
        )}
      </div>
      <p className="svc-text">{t.text}</p>
      <p className="muted">
        👤 {t.by}
        {t.group ? ' · ' + t.group : ''} · 🙋{' '}
        {L(`${t.apps} ariza`, `${t.apps} applied`, `откликов: ${t.apps}`)}
      </p>
      {k?.help && (
        <p className="svc-honest svc-honest-small">
          <span aria-hidden="true">🤝</span>
          <span>
            {L(
              'Ilmiy ish: faqat yordam bering (reja, manbalar, tahrir, rasmiylashtirish) — matnni talabaning o‘zi yozadi.',
              'Academic work: assist only (outline, sources, editing, formatting) — the student writes the text.',
              'Научная работа: только помощь (план, источники, редактура, оформление) — текст пишет студент.',
            )}
          </span>
        </p>
      )}
      {t.own ? (
        <p className="svc-note">
          {L(
            'Bu sizning vazifangiz — arizalarni «Buyurtmalarim» bo‘limida ko‘rasiz.',
            'This is your task — see applications under “My orders”.',
            'Это ваша задача — отклики в разделе «Мои заказы».',
          )}
        </p>
      ) : !view.me ? (
        <div className="mk-cta">
          <span aria-hidden="true">🧑‍💻</span>
          <div>
            <b>
              {L('Avval ijrochi bo‘ling', 'Become a worker first', 'Сначала станьте исполнителем')}
            </b>
          </div>
          <Button
            onClick={() => {
              onClose();
              goWork();
            }}
          >
            {L('Ro‘yxatdan o‘tish', 'Sign up', 'Зарегистрироваться')}
          </Button>
        </div>
      ) : view.me.status === 'blocked' ? (
        <p className="svc-note">
          {L(
            'Ijrochi hisobingiz to‘xtatilgan. Administratorga yozing.',
            'Your worker account is suspended. Write to the administrator.',
            'Аккаунт исполнителя приостановлен. Напишите администратору.',
          )}
        </p>
      ) : (
        <form
          className="mk-apply"
          onSubmit={(e) => {
            e.preventDefault();
            void act(
              { op: 'apply', ...(note.trim() ? { note: note.trim() } : {}) },
              '🙋 ' +
                L(
                  'Ariza yuborildi — administrator tasdiqlasa xabar keladi.',
                  'Applied — you will be notified if approved.',
                  'Отклик отправлен — придёт уведомление, если вас утвердят.',
                ),
            );
          }}
        >
          <label>
            {L(
              'Buyurtmachi va administratorga qisqa izoh (ixtiyoriy)',
              'A short note (optional)',
              'Короткий комментарий (необязательно)',
            )}
            <textarea
              className="input"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={L(
                'Masalan: 2 kunda tayyorlayman, shunga o‘xshash ishlarim bor',
                'E.g. I can deliver in 2 days, I have done similar work',
                'Например: сделаю за 2 дня, есть похожие работы',
              )}
            />
          </label>
          <div className="svc-form-actions">
            <Button type="submit" disabled={busy}>
              {t.applied
                ? '✏️ ' + L('Izohni yangilash', 'Update note', 'Обновить')
                : '🙋 ' + L('Men qilaman', 'I’ll do it', 'Возьмусь')}
            </Button>
            {t.applied && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void act(
                    { op: 'unapply' },
                    L('Ariza qaytarib olindi.', 'Application withdrawn.', 'Отклик отозван.'),
                  )
                }
              >
                {L('Arizani qaytarish', 'Withdraw', 'Отозвать')}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ---------- 💸 ijrochi: ro'yxatdan o'tish va kabinet ---------- */
function WorkTab({
  view,
  onView,
  goBoard,
}: {
  view: ServicesView;
  onView: (v: ServicesView) => void;
  goBoard: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [edit, setEdit] = useState(false);
  if (!view.signedIn) return <SignInNote />;
  const me = view.me;
  if (!me || edit)
    return (
      <WorkerJoin
        view={view}
        me={me}
        onView={(v) => {
          onView(v);
          setEdit(false);
        }}
        onCancel={me ? () => setEdit(false) : undefined}
      />
    );
  const jobs = view.jobs || [];
  const active = jobs.filter((j) => isActive(j.status));
  const finished = jobs.filter((j) => !isActive(j.status));
  const applied = (view.board || []).filter((t) => t.applied);
  return (
    <section className="mk-work" aria-labelledby="mk-work-h">
      <div className="mk-me">
        <span className="mk-avatar is-big" aria-hidden="true">
          {me.name[0]}
        </span>
        <div>
          <h2 id="mk-work-h" className="svc-h2">
            {me.name}
          </h2>
          <p className="muted">{me.skills.map((s) => kindTitle(lang, s)).join(' · ')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
          ✏️ {L('Profil', 'Profile', 'Профиль')}
        </Button>
      </div>
      {me.status === 'blocked' && (
        <p className="svc-note">
          ⛔{' '}
          {L(
            'Ijrochi hisobingiz to‘xtatilgan. Administratorga yozing.',
            'Your worker account is suspended. Write to the administrator.',
            'Аккаунт исполнителя приостановлен. Напишите администратору.',
          )}
        </p>
      )}
      <ul className="mk-tiles">
        <li className="is-green">
          <small>{L('Ishlab topilgan', 'Earned', 'Заработано')}</small>
          <b>{formatSum(me.earned)}</b>
        </li>
        <li className="is-amber">
          <small>{L('O‘tkazilishi kutilmoqda', 'Awaiting payout', 'Ожидает выплаты')}</small>
          <b>{formatSum(me.pending)}</b>
        </li>
        <li className="is-violet">
          <small>{L('Bajarilgan ishlar', 'Jobs done', 'Выполнено')}</small>
          <b>{me.jobs}</b>
        </li>
        <li className="is-blue">
          <small>{L('Reyting', 'Rating', 'Рейтинг')}</small>
          <b>{me.rating ? '⭐ ' + me.rating : '—'}</b>
        </li>
      </ul>
      <h3 className="mk-h3">🛠 {L('Faol ishlar', 'Active jobs', 'Текущие работы')}</h3>
      {!active.length ? (
        <div className="mk-empty is-small">
          <p className="muted">
            {L(
              'Hozir faol ishingiz yo‘q. Vazifalar e’lonidan tanlab ariza bering.',
              'No active jobs. Pick a task on the board and apply.',
              'Текущих работ нет. Выберите задачу и откликнитесь.',
            )}
          </p>
          <Button onClick={goBoard}>
            📋 {L('Vazifalarni ko‘rish', 'See tasks', 'Смотреть задачи')}
          </Button>
        </div>
      ) : (
        <ul className="mk-jobs">
          {active.map((j) => (
            <li key={j.uk + j.id}>
              <JobCard job={j} fee={view.fee} onView={onView} />
            </li>
          ))}
        </ul>
      )}
      {!!applied.length && (
        <>
          <h3 className="mk-h3">🙋 {L('Arizalarim', 'My applications', 'Мои отклики')}</h3>
          <ul className="mk-applied">
            {applied.map((t) => (
              <li key={t.uk + t.id}>
                <span>{kindTitle(lang, t.kind)}</span>
                <b>{t.title}</b>
                <em>{formatSum(share(t.budget, view.fee))}</em>
                <small className="muted">
                  ⏳ {L('Administrator ko‘rib chiqmoqda', 'Under review', 'На рассмотрении')}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
      {!!finished.length && (
        <>
          <h3 className="mk-h3">✅ {L('Yakunlangan ishlar', 'Finished jobs', 'Завершённые')}</h3>
          <ul className="mk-jobs">
            {finished.map((j) => (
              <li key={j.uk + j.id}>
                <JobCard job={j} fee={view.fee} onView={onView} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function WorkerJoin({
  view,
  me,
  onView,
  onCancel,
}: {
  view: ServicesView;
  me: WorkerProfile | null | undefined;
  onView: (v: ServicesView) => void;
  onCancel?: () => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [about, setAbout] = useState(me?.about || '');
  const [skills, setSkills] = useState<string[]>(me?.skills || []);
  const [pay, setPay] = useState(me?.pay || '');
  const [agree, setAgree] = useState(!!me);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
        op: 'join',
        about: about.trim(),
        skills,
        pay: pay.trim(),
        agree: true,
      });
      toast(
        me
          ? L('Profil saqlandi.', 'Profile saved.', 'Профиль сохранён.')
          : '🎉 ' +
              L(
                'Siz endi ijrochisiz! Vazifalar e’lonidan ish tanlang.',
                'You are now a worker! Pick a task on the board.',
                'Теперь вы исполнитель! Выберите задачу.',
              ),
      );
      onView(r.view);
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    if (
      !window.confirm(
        L(
          'Ijrochilikdan chiqasizmi? Ochiq arizalaringiz o‘chiriladi.',
          'Stop being a worker? Your open applications will be removed.',
          'Перестать быть исполнителем? Открытые отклики удалятся.',
        ),
      )
    )
      return;
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', { op: 'leave' });
      onView(r.view);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  const ready = about.trim().length >= 10 && skills.length > 0 && pay.trim().length >= 4 && agree;
  return (
    <section className="mk-join" aria-labelledby="mk-join-h">
      {!me && (
        <div className="mk-join-hero">
          <span aria-hidden="true">💸</span>
          <div>
            <h2 id="mk-join-h">
              {L('Bilimingiz bilan pul ishlang', 'Earn with your skills', 'Зарабатывайте знаниями')}
            </h2>
            <p>
              {L(
                'Taqdimot, dizayn, tarjima, sayt va boshqa ishlarni qila olsangiz — boshqa talabalarning vazifalarini bajarib daromad oling. Pulni administrator hisobingizga o‘tkazadi.',
                'If you can do slides, design, translation, websites and more — do other students’ tasks and earn. The administrator transfers the money to your account.',
                'Умеете делать презентации, дизайн, переводы, сайты? Выполняйте задачи других студентов и зарабатывайте. Деньги переводит администратор.',
              )}
            </p>
            <ul className="mk-perks">
              <li>
                📣{' '}
                {L(
                  'Yangi vazifalar haqida bildirishnoma',
                  'Notifications about new tasks',
                  'Уведомления о новых задачах',
                )}
              </li>
              <li>
                🛡{' '}
                {L(
                  'To‘lov oldindan administratorda turadi',
                  'Payment is held by the administrator',
                  'Оплата хранится у администратора',
                )}
              </li>
              <li>
                ⭐{' '}
                {L(
                  'Reyting va «Eng faol ijrochilar» ro‘yxati',
                  'Rating and the top workers list',
                  'Рейтинг и список лучших',
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
      <form
        className="panel mk-join-form"
        onSubmit={(e) => void submit(e)}
        aria-label={L('Ijrochi profili', 'Worker profile', 'Профиль исполнителя')}
      >
        <h3>
          {me
            ? '✏️ ' + L('Ijrochi profili', 'Worker profile', 'Профиль исполнителя')
            : '🧑‍💻 ' +
              L('Ijrochi bo‘lib ro‘yxatdan o‘tish', 'Sign up as a worker', 'Стать исполнителем')}
        </h3>
        <fieldset className="svc-soon-kinds">
          <legend>{L('Qaysi ishlarni qila olasiz?', 'What can you do?', 'Что вы умеете?')}</legend>
          {view.catalog.map((k) => {
            const on = skills.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                className={on ? 'on' : ''}
                onClick={() => setSkills(on ? skills.filter((x) => x !== k.id) : [...skills, k.id])}
              >
                {k.icon} {tr(lang, ...k.name)}
              </button>
            );
          })}
        </fieldset>
        <label>
          {L('O‘zingiz haqingizda', 'About you', 'О себе')}
          <textarea
            className="input"
            rows={3}
            maxLength={600}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={L(
              'Masalan: PowerPoint va Canva’da 2 yillik tajriba, 20 dan ortiq taqdimot qilganman',
              'E.g. 2 years in PowerPoint and Canva, 20+ presentations done',
              'Например: 2 года в PowerPoint и Canva, 20+ презентаций',
            )}
          />
        </label>
        <label>
          {L(
            'Pul o‘tkazish uchun: karta yoki telefon raqami (faqat administrator ko‘radi)',
            'For payouts: card or phone number (only the administrator sees it)',
            'Для выплат: карта или номер телефона (видит только администратор)',
          )}
          <input
            className="input"
            maxLength={120}
            value={pay}
            onChange={(e) => setPay(e.target.value)}
            placeholder="8600 …  /  +998 …"
          />
        </label>
        <div className="mk-rules">
          <b>📜 {L('Qoidalar', 'Rules', 'Правила')}</b>
          <ul>
            <li>
              {L(
                'Ishni o‘z vaqtida va sifatli bajaraman; savollarni yozishmada so‘rayman.',
                'I do the work on time and well; I ask questions in the chat.',
                'Делаю работу вовремя и качественно; вопросы задаю в чате.',
              )}
            </li>
            <li>
              {L(
                'To‘lovni faqat platforma orqali olaman — buyurtmachidan to‘g‘ridan-to‘g‘ri pul so‘ramayman.',
                'I get paid only through the platform — never directly from the client.',
                'Получаю оплату только через платформу — не напрямую от заказчика.',
              )}
            </li>
            <li>
              {L(
                'Kurs ishi, BMI, referat va maqolada faqat yordam beraman — birovning ishini to‘liq yozib bermayman.',
                'For papers and theses I only assist — I never write someone’s work for them.',
                'В курсовых и дипломах только помогаю — не пишу работу за другого.',
              )}
            </li>
          </ul>
          <label className="mk-agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            {L('Qoidalarga roziman', 'I agree to the rules', 'Согласен с правилами')}
          </label>
        </div>
        <div className="svc-form-actions">
          <Button type="submit" disabled={busy || !ready}>
            {me
              ? L('Saqlash', 'Save', 'Сохранить')
              : '🚀 ' + L('Ijrochi bo‘lish', 'Become a worker', 'Стать исполнителем')}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {L('Bekor', 'Cancel', 'Отмена')}
            </Button>
          )}
          {me && (
            <Button type="button" variant="outline" onClick={() => void leave()}>
              {L('Ijrochilikdan chiqish', 'Stop being a worker', 'Перестать быть исполнителем')}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

/** Ijrochining ishi: holat, buyurtmachi fayllari, yozishma, natija yuklash va topshirish, pul o'tkazilgani. */
function JobCard({
  job: j,
  fee,
  onView,
}: {
  job: ServiceOrder;
  fee: number;
  onView: (v: ServicesView) => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState(j.link || '');
  const [progress, setProgress] = useState('');
  const [icon, name] = STATUS_LABEL[j.status];
  const o = j.uk + '/' + j.id;
  async function act(input: Record<string, unknown>, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
        uk: j.uk,
        id: j.id,
        ...input,
      });
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
  async function upload(list: FileList | null) {
    const files = Array.from(list || []);
    setBusy('upload');
    try {
      for (const [i, f] of files.entries()) {
        if (f.size > FILE_MAX.out) {
          toast(L('Fayl 30 MB dan oshmasin: ', 'Max 30 MB: ', 'Не больше 30 МБ: ') + f.name);
          continue;
        }
        await sendOrderFile(request, 'worker', o, { uk: j.uk, id: j.id }, f, (x) =>
          setProgress(`${i + 1}/${files.length} · ${Math.round(x * 100)}%`),
        );
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      const r = await request('/api/services');
      if (r.ok) onView(await r.json());
      setBusy('');
      setProgress('');
    }
  }
  const ins = j.files.filter((f) => f.side === 'in'),
    outs = j.files.filter((f) => f.side === 'out');
  const waitPay = j.status === 'assigned' || j.status === 'paid';
  const working = j.status === 'work' || j.status === 'review';
  return (
    <article className={'panel svc-order is-' + j.status} style={toneOf(j.kind)}>
      <header>
        <div>
          <small className="muted">
            {kindTitle(lang, j.kind)} · {dueText(j.at, lang).date}
          </small>
          <h3>{j.title}</h3>
        </div>
        <span className={'svc-status is-' + j.status}>
          {icon} {tr(lang, ...name)}
        </span>
      </header>
      <p className="svc-order-meta">
        <span>
          💸 {L('Siz olasiz', 'You get', 'Вы получите')}: <b>{formatSum(share(j.budget, fee))}</b>
        </span>
        {j.due && (
          <span>
            📅 {j.due} · {daysLeft(j.due, lang)}
          </span>
        )}
      </p>
      {waitPay && (
        <p className="svc-note">
          🎉{' '}
          {L(
            'Sizni tanlashdi! Buyurtmachining to‘lovi tasdiqlangach ishni boshlaysiz — bildirishnoma keladi.',
            'You were chosen! Start once the client’s payment is confirmed — you will be notified.',
            'Вас выбрали! Начинайте после подтверждения оплаты — придёт уведомление.',
          )}
        </p>
      )}
      {j.status === 'review' && (
        <p className="svc-note">
          👀{' '}
          {L(
            'Natija topshirildi — buyurtmachi tekshirmoqda.',
            'Delivered — the client is reviewing it.',
            'Сдано — заказчик проверяет.',
          )}
        </p>
      )}
      {j.status === 'done' && (
        <p className={'svc-note' + (j.payout ? ' mk-paid' : '')}>
          {j.payout
            ? '💸 ' +
              L(
                `${formatSum(j.payout.amount)} hisobingizga o‘tkazildi`,
                `${formatSum(j.payout.amount)} paid to you`,
                `${formatSum(j.payout.amount)} переведено вам`,
              )
            : '⏳ ' +
              L(
                'Ish qabul qilindi — administrator pulingizni o‘tkazadi.',
                'Accepted — the administrator will pay you.',
                'Принято — администратор переведёт оплату.',
              )}{' '}
          <Stars n={j.rating} />
          {j.review && <q className="mk-review">{j.review}</q>}
        </p>
      )}
      {j.status === 'cancel' && j.reason && (
        <p className="svc-note">
          ✖ {L('Sabab', 'Reason', 'Причина')}: {j.reason}
        </p>
      )}
      {!waitPay && (
        <details className="svc-details" open={j.status === 'work'}>
          <summary>
            📄 {L('Vazifa matni', 'Task', 'Задача')}
            {ins.length ? ` · 📎 ${ins.length}` : ''}
          </summary>
          <p className="svc-text">{j.text}</p>
          {!!ins.length && <FileList files={ins} o={o} />}
        </details>
      )}
      {working && (
        <div className="svc-deliver">
          <b className="svc-sub">📥 {L('Natija', 'Result', 'Результат')}</b>
          {!!outs.length && (
            <FileList
              files={outs}
              o={o}
              remove={
                j.status === 'work'
                  ? async (f) => {
                      const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
                        op: 'wunfile',
                        uk: j.uk,
                        id: j.id,
                        fid: f.id,
                      });
                      onView(r.view);
                    }
                  : undefined
              }
            />
          )}
          {j.status === 'work' && (
            <>
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
                    { op: 'wlink', link: link.trim() },
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
              <Button
                disabled={!!busy || (!outs.length && !j.link)}
                onClick={() =>
                  void act(
                    { op: 'deliver' },
                    'deliver',
                    '📦 ' + L('Topshirildi!', 'Delivered!', 'Сдано!'),
                  )
                }
              >
                📦 {L('Ishni topshirish', 'Deliver the work', 'Сдать работу')}
              </Button>
            </>
          )}
          {j.link && (
            <a className="svc-link" href={j.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> {j.link}
            </a>
          )}
        </div>
      )}
      {!waitPay && j.status !== 'cancel' && (
        <Chat
          msgs={j.msgs}
          me="worker"
          open={working}
          send={
            j.status === 'done' ? undefined : async (text) => await act({ op: 'wmsg', text }, 'msg')
          }
        />
      )}
    </article>
  );
}

/** Vazifa yozishmasi (buyurtmachi, ijrochi va administrator). */
export function Chat({
  msgs,
  me,
  open,
  send,
}: {
  msgs: ServiceOrder['msgs'];
  me: 'user' | 'worker' | 'team';
  open?: boolean;
  send?: (text: string) => Promise<boolean>;
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
        : f === 'worker'
          ? L('Ijrochi', 'Worker', 'Исполнитель')
          : L('Buyurtmachi', 'Client', 'Заказчик');
  return (
    <details className="svc-details" open={!!open}>
      <summary>
        💬 {L('Yozishma', 'Conversation', 'Переписка')} {msgs.length ? `(${msgs.length})` : ''}
      </summary>
      {msgs.length ? (
        <ul className="svc-msgs">
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
  onWorker,
}: {
  catalog: ServiceCard[];
  initial: string[];
  signedIn: boolean;
  onClose: () => void;
  onSent: (v: ServicesView) => void;
  onWorker: () => void;
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
            'Talabalar bir-birining vazifasini bajarib pul ishlaydigan bozor: siz vazifa berasiz — ijrochi talabalar bajaradi. Hozir fikringiz kerak: qaysi xizmatlar kerak?',
            'A marketplace where students do tasks for each other and earn. Right now we need your opinion: which services do you need?',
            'Биржа, где студенты выполняют задачи друг для друга и зарабатывают. Сейчас нам важно ваше мнение: какие услуги нужны?',
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
            <button type="button" className="mk-soon-worker" onClick={onWorker}>
              💸{' '}
              {L(
                'Ishlab topmoqchimisiz? Hozirdan ijrochi bo‘lib ro‘yxatdan o‘ting →',
                'Want to earn? Sign up as a worker now →',
                'Хотите зарабатывать? Станьте исполнителем уже сейчас →',
              )}
            </button>
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

/* ---------- 📝 vazifa berish ---------- */
function OrderForm({
  card,
  onClose,
  onDone,
}: {
  card: ServiceCard;
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
              'Vazifa e’lon qilindi, lekin ba’zi fayllar yuklanmadi — vazifa kartasidan qayta qo‘shing.',
              'Task posted, but some files failed — add them again from the task card.',
              'Задача опубликована, но часть файлов не загрузилась — добавьте их снова.',
            )
          : '📣 ' +
              L(
                'Vazifa e’lon qilindi! Ijrochilar ariza berishi bilan xabar keladi.',
                'Task posted! You will be notified when workers apply.',
                'Задача опубликована! Придёт уведомление, когда откликнутся исполнители.',
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
                'Bu yo‘nalishda ijrochi yordam beradi: reja, manbalar, tahrir, rasmiylashtirish. Matnni o‘zingiz yozasiz.',
                'Here the worker assists: outline, sources, editing, formatting. You write the text yourself.',
                'Здесь исполнитель помогает: план, источники, редактура, оформление. Текст пишете вы сами.',
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
                    'Adolatli summa yozsangiz, ijrochilar tezroq topiladi.',
                    'A fair amount attracts workers faster.',
                    'Честная сумма быстрее привлечёт исполнителей.',
                  )}
          </small>
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
              'Ixtiyoriy: 3 tagacha, har biri 10 MB gacha. Fayllarni faqat tasdiqlangan ijrochi ko‘radi.',
              'Optional: up to 3 files, 10 MB each. Only the approved worker sees them.',
              'Необязательно: до 3 файлов по 10 МБ. Их видит только утверждённый исполнитель.',
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
            <Send size={16} /> {busy || L('E’lon qilish', 'Post the task', 'Опубликовать')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={!!busy}>
            {L('Bekor', 'Cancel', 'Отмена')}
          </Button>
        </div>
        <small className="muted">
          {L(
            'Hozir hech narsa to‘lamaysiz: administrator ijrochini tasdiqlagandan keyin to‘laysiz. Ijrochi pulni ishingizni qabul qilganingizdan keyin oladi.',
            'You pay nothing now: you pay after the administrator approves a worker. The worker is paid only after you accept the work.',
            'Сейчас ничего не платите: оплата после утверждения исполнителя. Исполнитель получит деньги после приёмки работы.',
          )}
        </small>
      </form>
    </div>,
    document.body,
  );
}

/* ---------- 📦 buyurtmachining vazifasi ---------- */
function OrderCard({
  order: o,
  how,
  onView,
}: {
  order: ServiceOrder;
  how: string;
  onView: (v: ServicesView) => void;
}) {
  const { lang, request, toast } = useApp();
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
          {icon} {tr(lang, ...name)}
        </span>
      </header>
      {o.status !== 'cancel' && (
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
          💰 <b>{formatSum(o.budget)}</b>
        </span>
        {o.due && (
          <span>
            📅 {o.due} · {daysLeft(o.due, lang)}
          </span>
        )}
        {o.worker && (
          <span>
            🧑‍💻 {o.worker.name} <Stars n={o.worker.rating} />
          </span>
        )}
      </p>

      {o.status === 'open' && (
        <div className="mk-apps">
          {o.apps.length ? (
            <>
              <b>
                🙋{' '}
                {L(
                  `${o.apps.length} ta ijrochi tayyor`,
                  `${o.apps.length} workers ready`,
                  `Готовы исполнители: ${o.apps.length}`,
                )}
              </b>
              <ul>
                {o.apps.map((x) => (
                  <li key={x.uk}>
                    <span className="mk-avatar" aria-hidden="true">
                      {x.name[0]}
                    </span>
                    <span>
                      <b>{x.name}</b>{' '}
                      <small className="muted">
                        {L(`${x.jobs} ta ish`, `${x.jobs} jobs`, `работ: ${x.jobs}`)}
                      </small>{' '}
                      <Stars n={x.rating} />
                      {x.note && <q>{x.note}</q>}
                    </span>
                  </li>
                ))}
              </ul>
              <small className="muted">
                {L(
                  'Administrator eng mos ijrochini tasdiqlaydi — xabar keladi.',
                  'The administrator will approve the best fit — you will be notified.',
                  'Администратор утвердит лучшего исполнителя — придёт уведомление.',
                )}
              </small>
            </>
          ) : (
            <p className="svc-note">
              📣{' '}
              {L(
                'Vazifa e’londa — ijrochi talabalar ariza berishini kuting.',
                'Your task is on the board — wait for workers to apply.',
                'Задача опубликована — ждите откликов исполнителей.',
              )}
            </p>
          )}
        </div>
      )}
      {o.status === 'assigned' && (
        <div className="svc-pay">
          <b>
            💳 {L('To‘lov', 'Payment', 'Оплата')}: {formatSum(o.budget)}
          </b>
          <p className="svc-pay-how">
            {how ||
              L(
                'To‘lov usulini bilish uchun pastdagi yozishmada so‘rang.',
                'Ask in the conversation below how to pay.',
                'Спросите в переписке ниже, как оплатить.',
              )}
          </p>
          <small className="muted">
            🛡{' '}
            {L(
              'Pul administratorda turadi va ijrochiga faqat ishni qabul qilganingizdan keyin o‘tkaziladi.',
              'The money stays with the administrator and goes to the worker only after you accept.',
              'Деньги хранятся у администратора и уходят исполнителю только после приёмки.',
            )}
          </small>
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
            disabled={!!busy}
            onClick={() =>
              void act(
                { op: 'paid', note: note.trim() },
                'paid',
                L(
                  'Rahmat! To‘lov tekshirilgach ijrochi ishni boshlaydi.',
                  'Thank you! The worker starts once the payment is checked.',
                  'Спасибо! Исполнитель начнёт после проверки оплаты.',
                ),
              )
            }
          >
            💳 {L('To‘lov qildim', 'I paid', 'Я оплатил')}
          </Button>
        </div>
      )}
      {o.status === 'paid' && (
        <p className="svc-note">
          {L(
            'To‘lovingiz tekshirilmoqda. Tasdiqlangach ijrochi ishni boshlaydi.',
            'Your payment is being checked. The worker starts once it is confirmed.',
            'Оплата проверяется. После подтверждения исполнитель начнёт работу.',
          )}
        </p>
      )}
      {o.status === 'work' && (
        <p className="svc-note">
          🛠{' '}
          {L(
            'Ijrochi ishlamoqda. Natija tayyor bo‘lgach bildirishnoma keladi.',
            'The worker is on it. You will be notified when the result is ready.',
            'Исполнитель работает. Когда результат будет готов, придёт уведомление.',
          )}
        </p>
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
          📄 {L('Vazifa tafsilotlari', 'Task details', 'Детали задачи')}
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
        {isActive(o.status) && o.status !== 'review' && ins.length < FILES_PER_ORDER.in && (
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
        {(o.status === 'open' || o.status === 'assigned') && (
          <Button
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => {
              if (
                window.confirm(
                  L('Vazifani bekor qilasizmi?', 'Cancel this task?', 'Отменить задачу?'),
                )
              )
                void act({ op: 'cancel' }, 'cancel');
            }}
          >
            {L('Bekor qilish', 'Cancel task', 'Отменить')}
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
                    'Vazifa va uning fayllari butunlay o‘chiriladi. Davom etasizmi?',
                    'The task and its files will be deleted for good. Continue?',
                    'Задача и её файлы будут удалены навсегда. Продолжить?',
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

/** Fayllar ro'yxati: yuklab olish (bo'laklab, foiz bilan) va (berilgan bo'lsa) o'chirish. o — «<buyurtmachi>/<vazifa>». */
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
