'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  ExternalLink,
  Lightbulb,
  Paperclip,
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
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  FILE_TYPES,
  KEEP_DAYS,
  STATUS_LABEL,
  fileSize,
  isActive,
  type OrderFile,
  type ServiceCard,
  type ServiceOrder,
  type ServicesView,
  type Tri,
} from '@/lib/services';
import type { Lang } from '@/lib/types';

/* 💼 Pullik xizmatlar: qanday ishlashi (4 qadam), yo'nalishlar katalogi, buyurtma shakli va «Mening buyurtmalarim»
   (holat, narx, to'lov, yozishma, fayllar, tayyor ishni yuklab olish). Server — lib/server/services.ts.
   Administrator bo'limni ishga tushirguncha (view.open = false) talaba kirganda «🚀 Tez orada ishga tushadi» oynasi
   chiqadi: qaysi xizmatlar kerakligini belgilab, taklif yozadi — taklif «Adminga xabar»ga 💡 belgisi bilan tushadi. */
const IDEA_KEY = 'sq-svc-idea';

const STEPS: [string, Tri, Tri][] = [
  [
    '📝',
    ['Vazifani yozing', 'Describe the task', 'Опишите задачу'],
    [
      'Yo‘nalishni tanlang, nima kerakligini va muddatni yozing. Namuna yoki talablar bo‘lsa, fayl biriktiring.',
      'Pick a direction, say what you need and by when. Attach a sample or the requirements if you have them.',
      'Выберите направление, опишите задачу и срок. Приложите образец или требования, если есть.',
    ],
  ],
  [
    '💬',
    ['Narxni aytamiz', 'We quote a price', 'Называем цену'],
    [
      'Jamoa buyurtmani ko‘rib chiqadi va shu yerda narx hamda tayyor bo‘lish muddatini yozadi.',
      'The team reviews the order and writes the price and the delivery time right here.',
      'Команда изучит заказ и напишет здесь цену и срок готовности.',
    ],
  ],
  [
    '💳',
    ['To‘lov qilasiz', 'You pay', 'Вы оплачиваете'],
    [
      'Ko‘rsatilgan usulda to‘laysiz va «To‘lov qildim» tugmasini bosasiz — shundan keyin ish boshlanadi.',
      'Pay as shown and press “I paid” — the work starts after that.',
      'Оплатите указанным способом и нажмите «Я оплатил» — после этого начнётся работа.',
    ],
  ],
  [
    '📥',
    ['Yuklab olasiz', 'You download', 'Вы скачиваете'],
    [
      'Ish tayyor bo‘lgach, xabar keladi — faylni shu sahifadan yuklab olasiz. Kerak bo‘lsa tuzatish so‘raysiz.',
      'When it is ready you get a notification — download the file here. Ask for changes if needed.',
      'Когда работа готова, придёт уведомление — скачайте файл здесь. При необходимости попросите правки.',
    ],
  ],
];
const TRACK: ServiceOrder['status'][] = ['new', 'quoted', 'work', 'done'];
const TRACK_NAME: Record<string, Tri> = {
  new: ['Qabul', 'Received', 'Принят'],
  quoted: ['Narx', 'Price', 'Цена'],
  work: ['Ish', 'Work', 'Работа'],
  done: ['Tayyor', 'Ready', 'Готово'],
};
const today = () => new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10);

export function Services() {
  const { data, lang, request, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<ServicesView | null>(null),
    [error, setError] = useState(''),
    [pick, setPick] = useState<ServiceCard | null>(null),
    // «tez orada» oynasi: null — yopiq, massiv — oldindan belgilangan yo'nalishlar
    [soon, setSoon] = useState<string[] | null>(null),
    [sent, setSent] = useState(false);
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
  const open = orders.filter((o) => isActive(o.status)).length;
  // bo'lim hali ishga tushmagan: talaba buyurtma o'rniga taklif yuboradi (administrator sinab ko'rishi mumkin)
  const waiting = !!view && !view.open && !admin;
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
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{L('BUYURTMA ASOSIDA', 'MADE TO ORDER', 'НА ЗАКАЗ')}</span>
          <h1>💼 {L('Pullik xizmatlar', 'Paid services', 'Платные услуги')}</h1>
          <p>
            {L(
              'Kerakli ishingizni yozing — jamoamiz tayyorlab beradi, siz shu yerdan yuklab olasiz.',
              'Describe what you need — our team prepares it and you download it right here.',
              'Опишите, что нужно, — наша команда подготовит, а вы скачаете здесь же.',
            )}
          </p>
        </div>
        <div className="page-heading-side">
          {!!orders.length && (
            <a className="svc-mine-chip" href="#services" onClick={jumpToMine}>
              📦 {L('Buyurtmalarim', 'My orders', 'Мои заказы')} <em>{orders.length}</em>
              {!!open && <small>{L(`${open} ochiq`, `${open} open`, `${open} откр.`)}</small>}
            </a>
          )}
          {admin && (
            <Button
              variant="outline"
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
                    'Jamoa tayyorgarlik ko‘ryapti. Sizga qaysi xizmat kerakligini yozing — eng ko‘p so‘ralganlardan boshlaymiz.',
                    'The team is getting ready. Tell us which services you need — we will start with the most requested.',
                    'Команда готовится. Напишите, какие услуги вам нужны, — начнём с самых востребованных.',
                  )}
            </p>
          </div>
          <Button onClick={() => setSoon([])}>
            <Lightbulb size={16} /> {L('Taklif yuborish', 'Send a suggestion', 'Отправить идею')}
          </Button>
        </div>
      )}
      {admin && view && !view.open && (
        <p className="svc-soon is-admin">
          ⏸{' '}
          {L(
            'Bo‘lim hali ishga tushmagan: talabalar «Tez orada» oynasini ko‘radi va taklif yuboradi. Siz sinab ko‘rish uchun buyurtma bera olasiz. Ishga tushirish — «Boshqarish» tugmasi orqali.',
            'The section is not launched: students see “Launching soon” and send suggestions. You can place test orders. Launch it via “Manage”.',
            'Раздел ещё не запущен: студенты видят «Скоро запуск» и отправляют идеи. Вы можете оформить тестовый заказ. Запуск — через «Управление».',
          )}
        </p>
      )}

      <section className="svc-how" aria-labelledby="svc-how-h">
        <h2 id="svc-how-h">{L('Qanday ishlaydi?', 'How it works', 'Как это работает')}</h2>
        <ol className="svc-steps">
          {STEPS.map(([icon, name, text], i) => (
            <li key={i}>
              <span className="svc-step-n" aria-hidden="true">
                {icon}
              </span>
              <b>
                {i + 1}. {tr(lang, ...name)}
              </b>
              <small>{tr(lang, ...text)}</small>
            </li>
          ))}
        </ol>
        <p className="svc-honest">
          <span aria-hidden="true">🤝</span>
          <span>
            {L(
              'Kurs ishi, BMI, referat va maqolada ishni o‘zingiz yozasiz — jamoa reja tuzish, manba topish, tahrir, rasmiylashtirish va antiplagiat tekshiruvida yordam beradi. Birov yozgan ishni o‘zinikidek topshirish universitet qoidalariga zid.',
              'For course papers, theses, essays and articles you write the text yourself — the team helps with the outline, sources, editing, formatting and the plagiarism check. Submitting someone else’s work as your own breaks university rules.',
              'Курсовую, ВКР, реферат и статью вы пишете сами — команда помогает с планом, источниками, редактурой, оформлением и проверкой на антиплагиат. Сдавать чужую работу как свою запрещено правилами университета.',
            )}
          </span>
        </p>
      </section>

      <section aria-labelledby="svc-cat-h">
        <h2 id="svc-cat-h" className="svc-h2">
          {L('Yo‘nalishlar', 'What we do', 'Направления')}
        </h2>
        {error && <p className="error-state">{error}</p>}
        {!view && !error && <div className="skeleton svc-skeleton" />}
        <ul className="svc-grid">
          {view?.catalog.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                className="svc-card"
                onClick={() =>
                  waiting ? setSoon([k.id]) : view.signedIn ? setPick(k) : setLogin(true)
                }
              >
                <span className="svc-card-icon" aria-hidden="true">
                  {k.icon}
                </span>
                <b>{tr(lang, ...k.name)}</b>
                <small>{tr(lang, ...k.text)}</small>
                <span className="svc-card-meta">
                  {k.help && <em className="svc-help">🤝 {L('Yordam', 'Assistance', 'Помощь')}</em>}
                  {k.price && <em>💰 {k.price}</em>}
                  {k.days && <em>⏱ {k.days}</em>}
                </span>
                <span className="svc-card-go">
                  {waiting
                    ? '🚀 ' + L('Tez orada', 'Coming soon', 'Скоро')
                    : L('Buyurtma berish', 'Order', 'Заказать') + ' →'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {view && !view.signedIn && !waiting && (
          <p className="svc-signin muted">
            {L(
              'Buyurtma berish uchun hisobingizga kiring.',
              'Sign in to place an order.',
              'Войдите, чтобы оформить заказ.',
            )}{' '}
            <Button size="sm" variant="outline" onClick={() => setLogin(true)}>
              {L('Kirish', 'Sign in', 'Войти')}
            </Button>
          </p>
        )}
      </section>

      {!!orders.length && (
        <section id="svc-mine" className="svc-mine" aria-labelledby="svc-mine-h">
          <h2 id="svc-mine-h" className="svc-h2">
            📦 {L('Mening buyurtmalarim', 'My orders', 'Мои заказы')}
          </h2>
          <ul>
            {orders.map((o) => (
              <li key={o.id}>
                <OrderCard
                  order={o}
                  card={view?.catalog.find((k) => k.id === o.kind)}
                  how={view?.how || ''}
                  onView={setView}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {soon && view && (
        <SoonModal
          catalog={view.catalog}
          initial={soon}
          signedIn={view.signedIn}
          onClose={() => setSoon(null)}
          onSent={() => {
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
          onClose={() => setPick(null)}
          onDone={(v) => {
            setView(v);
            setPick(null);
            setTimeout(jumpToMine, 80);
          }}
        />
      )}
    </>
  );
}
function jumpToMine(e?: { preventDefault: () => void }) {
  e?.preventDefault();
  document.getElementById('svc-mine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
const kindTitle = (lang: Lang, card?: ServiceCard, id = '') =>
  card ? card.icon + ' ' + tr(lang, ...card.name) : id;

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
  onSent: () => void;
}) {
  const { lang, request, toast, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [kinds, setKinds] = useState<string[]>(initial),
    [text, setText] = useState(''),
    [busy, setBusy] = useState(false);
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
      // administrator o'qiydi — yo'nalish nomlari o'zbekcha
      const names = catalog.filter((k) => kinds.includes(k.id)).map((k) => k.name[0]);
      const body =
        '💡 PULLIK XIZMATLAR — TAKLIF' +
        (names.length ? '\nKerakli xizmatlar: ' + names.join(', ') : '') +
        (text.trim() ? '\nTaklif: ' + text.trim() : '');
      const r = await request('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', input: { text: body.slice(0, 1500), cat: 'idea' } }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Xatolik');
      toast(
        '💡 ' +
          L(
            'Rahmat! Taklifingiz administratorga yuborildi.',
            'Thank you! Your suggestion was sent to the administrator.',
            'Спасибо! Ваше предложение отправлено администратору.',
          ),
      );
      onSent();
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
            'Taqdimot, kurs ishi bo‘yicha yordam, sayt, dizayn va boshqa ishlarni buyurtma qilish mumkin bo‘ladi. Hozir sizning fikringiz kerak: qaysi xizmatlar kerak va nimani xohlaysiz?',
            'You will be able to order presentations, help with papers, websites, design and more. Right now we need your opinion: which services do you need and what would you like?',
            'Можно будет заказать презентации, помощь с курсовой, сайт, дизайн и многое другое. Сейчас нам нужно ваше мнение: какие услуги нужны и чего бы вам хотелось?',
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
                rows={4}
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

/* ---------- 📝 buyurtma shakli ---------- */
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
  const [f, setF] = useState({ title: '', text: '', due: '', contact: '' }),
    [files, setFiles] = useState<File[]>([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, busy]);
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
              'Заказ принят, но часть файлов не загрузилась — добавьте их снова в карточке заказа.',
            )
          : L(
              '✅ Buyurtma qabul qilindi! Jamoa tez orada narx va muddatni yozadi.',
              '✅ Order received! The team will soon send the price and timing.',
              '✅ Заказ принят! Команда скоро напишет цену и срок.',
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
                'Bu yo‘nalishda jamoa yordam beradi: reja, manbalar, tahrir, rasmiylashtirish. Matnni o‘zingiz yozasiz.',
                'Here the team assists: outline, sources, editing, formatting. You write the text yourself.',
                'Здесь команда помогает: план, источники, редактура, оформление. Текст пишете вы сами.',
              )}
            </span>
          </p>
        )}
        {(card.price || card.days) && (
          <p className="svc-form-meta">
            {card.price && <span>💰 {card.price}</span>}
            {card.days && <span>⏱ {card.days}</span>}
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
            rows={5}
            value={f.text}
            onChange={(e) => setF({ ...f, text: e.target.value })}
            placeholder={tr(lang, ...card.hint)}
          />
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
              'Ixtiyoriy: 3 tagacha, har biri 10 MB gacha (PDF, Word, PowerPoint, Excel, ZIP, rasm).',
              'Optional: up to 3 files, 10 MB each (PDF, Word, PowerPoint, Excel, ZIP, image).',
              'Необязательно: до 3 файлов по 10 МБ (PDF, Word, PowerPoint, Excel, ZIP, фото).',
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
            disabled={!!busy || f.title.trim().length < 3 || f.text.trim().length < 10}
          >
            <Send size={16} /> {busy || L('Buyurtma berish', 'Place the order', 'Оформить заказ')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={!!busy}>
            {L('Bekor', 'Cancel', 'Отмена')}
          </Button>
        </div>
        <small className="muted">
          {L(
            'Hozir hech narsa to‘lamaysiz: avval jamoa narxni aytadi, rozi bo‘lsangiz — to‘laysiz.',
            'You pay nothing now: the team quotes a price first, and you pay only if you agree.',
            'Сейчас ничего платить не нужно: сначала команда назовёт цену, оплатите, если согласны.',
          )}
        </small>
      </form>
    </div>,
    document.body,
  );
}

/* ---------- 📦 buyurtma kartasi ---------- */
function OrderCard({
  order: o,
  card,
  how,
  onView,
}: {
  order: ServiceOrder;
  card?: ServiceCard;
  how: string;
  onView: (v: ServicesView) => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [busy, setBusy] = useState(''),
    [note, setNote] = useState(''),
    [msg, setMsg] = useState(''),
    [fix, setFix] = useState(''),
    [fixOpen, setFixOpen] = useState(false);
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
      const r = (await sendOrderFile(request, 'me', o.uk + '/' + o.id, { id: o.id }, file)) as {
        view: ServicesView;
      };
      onView(r.view);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const step = o.status === 'paid' ? 1 : TRACK.indexOf(o.status);
  const ins = o.files.filter((f) => f.side === 'in'),
    outs = o.files.filter((f) => f.side === 'out');
  return (
    <article className={'panel svc-order is-' + o.status}>
      <header>
        <div>
          <small className="muted">
            {kindTitle(lang, card, o.kind)} · {dueText(o.at, lang).date}
          </small>
          <h3>{o.title}</h3>
        </div>
        <span className={'svc-status is-' + o.status}>
          {icon} {tr(lang, ...name)}
        </span>
      </header>
      {o.status !== 'cancel' && (
        <ol className="svc-track" aria-label={L('Bosqichlar', 'Stages', 'Этапы')}>
          {TRACK.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
              {tr(lang, ...TRACK_NAME[s])}
            </li>
          ))}
        </ol>
      )}
      {(o.price || o.eta || o.due) && (
        <p className="svc-order-meta">
          {o.price && (
            <span>
              💰 <b>{o.price}</b>
            </span>
          )}
          {o.eta && <span>⏱ {o.eta}</span>}
          {o.due && (
            <span>
              📅 {L('Sizga kerak', 'You need it by', 'Нужно к')}: {o.due}
            </span>
          )}
        </p>
      )}

      {o.status === 'new' && (
        <p className="svc-note">
          {L(
            'Jamoa buyurtmani ko‘rib chiqmoqda — narx va muddat shu yerda chiqadi, bildirishnoma ham keladi.',
            'The team is reviewing the order — the price and timing will appear here, with a notification.',
            'Команда изучает заказ — цена и срок появятся здесь, придёт уведомление.',
          )}
        </p>
      )}
      {o.status === 'quoted' && (
        <div className="svc-pay">
          <b>{L('To‘lov', 'Payment', 'Оплата')}</b>
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
            disabled={!!busy}
            onClick={() =>
              void act(
                { op: 'paid', note: note.trim() },
                'paid',
                L(
                  'Rahmat! To‘lov tekshirilgach ish boshlanadi.',
                  'Thank you! Work starts once the payment is checked.',
                  'Спасибо! Работа начнётся после проверки оплаты.',
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
            'To‘lovingiz tekshirilmoqda. Tasdiqlangach ish boshlanadi.',
            'Your payment is being checked. Work starts once it is confirmed.',
            'Оплата проверяется. После подтверждения начнётся работа.',
          )}
        </p>
      )}
      {o.status === 'work' && (
        <p className="svc-note">
          {L(
            'Ish bajarilmoqda. Tayyor bo‘lgach bildirishnoma keladi.',
            'Work in progress. You will be notified when it is ready.',
            'Работа идёт. Когда будет готово, придёт уведомление.',
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
          <b>📥 {L('Tayyor ish', 'Your result', 'Готовая работа')}</b>
          <FileList files={outs} o={o} />
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
      {o.expired && (
        <p className="svc-note">
          {L(
            `Fayllar saqlash muddati (${KEEP_DAYS} kun) tugagani uchun o‘chirildi.`,
            `The files were deleted after ${KEEP_DAYS} days.`,
            `Файлы удалены по истечении ${KEEP_DAYS} дней.`,
          )}
        </p>
      )}
      {o.status === 'done' && !o.expired && (
        <div className="svc-fix">
          {fixOpen ? (
            <>
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
                <Button
                  size="sm"
                  disabled={!!busy || fix.trim().length < 3}
                  onClick={async () => {
                    if (await act({ op: 'revise', text: fix.trim() }, 'revise')) {
                      setFix('');
                      setFixOpen(false);
                    }
                  }}
                >
                  🔁 {L('Tuzatish so‘rash', 'Ask for changes', 'Попросить правки')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFixOpen(false)}>
                  {L('Bekor', 'Cancel', 'Отмена')}
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setFixOpen(true)}>
              🔁 {L('Tuzatish kerakmi?', 'Need changes?', 'Нужны правки?')}
            </Button>
          )}
        </div>
      )}

      <details className="svc-details">
        <summary>
          📄 {L('Buyurtma tafsilotlari', 'Order details', 'Детали заказа')}
          {!!ins.length && ` · 📎 ${ins.length}`}
        </summary>
        <p className="svc-text">{o.text}</p>
        {o.contact && <p className="muted">📞 {o.contact}</p>}
        {!!ins.length && (
          <FileList files={ins} o={o} removable={isActive(o.status)} onView={onView} />
        )}
        {isActive(o.status) && ins.length < FILES_PER_ORDER.in && (
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

      <details
        className="svc-details"
        open={o.msgs.length > 0 && o.status !== 'done' && o.status !== 'cancel'}
      >
        <summary>
          💬 {L('Yozishma', 'Conversation', 'Переписка')}{' '}
          {o.msgs.length ? `(${o.msgs.length})` : ''}
        </summary>
        {o.msgs.length ? (
          <ul className="svc-msgs">
            {o.msgs.map((m) => (
              <li key={m.id} className={m.from === 'team' ? 'is-team' : 'is-me'}>
                <small>
                  {m.from === 'team' ? L('Jamoa', 'Team', 'Команда') : L('Siz', 'You', 'Вы')} ·{' '}
                  {dueText(m.at, lang).date}
                </small>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            {L(
              'Savolingiz bo‘lsa, shu yerda yozing — jamoa javob beradi.',
              'Have a question? Write here — the team will answer.',
              'Есть вопрос? Напишите здесь — команда ответит.',
            )}
          </p>
        )}
        {o.status !== 'cancel' && (
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
              placeholder={L('Xabar yozing…', 'Write a message…', 'Напишите сообщение…')}
              aria-label={L('Jamoaga xabar', 'Message to the team', 'Сообщение команде')}
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
        )}
      </details>

      <footer className="svc-order-actions">
        {(o.status === 'new' || o.status === 'quoted') && (
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

/** Fayllar ro'yxati: yuklab olish (bo'laklab, foiz bilan) va (kerak bo'lsa) o'chirish. */
export function FileList({
  files,
  o,
  removable,
  onView,
  team,
}: {
  files: OrderFile[];
  o: ServiceOrder;
  removable?: boolean;
  onView?: (v: ServicesView) => void;
  /** administrator panelida: o'chirish jamoa nomidan */
  team?: () => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [state, setState] = useState<Record<string, string>>({});
  async function get(f: OrderFile) {
    setState((s) => ({ ...s, [f.id]: '0%' }));
    try {
      await saveOrderFile(request, o.uk + '/' + o.id, f, (x) =>
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
      if (team) {
        await servicesAct(request, 'admin', { op: 'unfile', uk: o.uk, id: o.id, fid: f.id });
        team();
      } else {
        const r = await servicesAct<{ view: ServicesView }>(request, 'me', {
          op: 'unfile',
          id: o.id,
          fid: f.id,
        });
        if ('view' in r) onView?.(r.view);
      }
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
          {removable && (
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
