'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowLeft, RotateCcw, Users } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { t } from '@/lib/i18n';
import { NativeSurface } from './native-surface';
import { BrandGame } from './brand-game';
const pairs: [Tri, Tri][] = [
  [
    ['TAM', 'TAM', 'TAM'],
    ['Umumiy mumkin bo‘lgan bozor', 'Total addressable market', 'Общий объём рынка'],
  ],
  [
    ['SAM', 'SAM', 'SAM'],
    ['Xizmat ko‘rsatish mumkin bo‘lgan bozor', 'Serviceable available market', 'Доступный рынок'],
  ],
  [
    ['SOM', 'SOM', 'SOM'],
    ['Egallash rejalashtirilgan bozor', 'Obtainable market share', 'Достижимая доля рынка'],
  ],
  [
    ['Foyda', 'Profit', 'Прибыль'],
    ['Tushum − xarajat', 'Revenue − costs', 'Выручка − затраты'],
  ],
  [
    ['MVP', 'MVP', 'MVP'],
    ['Minimal ishlaydigan mahsulot', 'Minimum viable product', 'Минимально жизнеспособный продукт'],
  ],
  [
    ['CRM', 'CRM', 'CRM'],
    [
      'Mijozlar bilan munosabatlarni boshqarish',
      'Customer relationship management',
      'Управление отношениями с клиентами',
    ],
  ],
];
type Tri = [string, string, string];
type GameCard = {
  id: string;
  emoji: string;
  title: Tri;
  desc: Tri;
  tag: Tri;
  to: string;
  legacy?: boolean;
  tone: string;
};
const online: GameCard[] = [
  {
    id: 'dama',
    emoji: '🔴',
    tone: 'red',
    title: ['Shashka', 'Draughts', 'Шашки'],
    desc: [
      'Klassik stol o‘yini, vaqt cheklanmagan',
      'The classic board game, no time limit',
      'Классика без ограничения времени',
    ],
    tag: ['2 kishi', '2 players', '2 игрока'],
    to: 'play/create/dama',
    legacy: true,
  },
  {
    id: 'chess',
    emoji: '♟️',
    tone: 'slate',
    title: ['Shaxmat', 'Chess', 'Шахматы'],
    desc: [
      'Guruhdoshingiz bilan aql bellashuvi',
      'A battle of minds with a classmate',
      'Битва умов с одногруппником',
    ],
    tag: ['2 kishi', '2 players', '2 игрока'],
    to: 'play/create/chess',
    legacy: true,
  },
  {
    id: 'c4',
    emoji: '🟡',
    tone: 'amber',
    title: ['To‘rttalik', 'Connect Four', 'Четыре в ряд'],
    desc: [
      'Ketma-ket to‘rtta toshni birinchi tering',
      'Be the first to line up four',
      'Первым соберите четыре в ряд',
    ],
    tag: ['2 kishi', '2 players', '2 игрока'],
    to: 'play/create/c4',
    legacy: true,
  },
  {
    id: 'pzl',
    emoji: '🧩',
    tone: 'violet',
    title: ['Puzzle duel', 'Puzzle duel', 'Пазл-дуэль'],
    desc: [
      'Kim rasmni tezroq yig‘adi?',
      'Who completes the picture first?',
      'Кто быстрее соберёт картинку?',
    ],
    tag: ['2 kishi', '2 players', '2 игрока'],
    to: 'play/create/pzl',
    legacy: true,
  },
  {
    id: 'pzt',
    emoji: '🖼️',
    tone: 'teal',
    title: ['Jamoaviy puzzle', 'Team puzzle', 'Командный пазл'],
    desc: [
      'Bitta rasmni birgalikda yig‘ing',
      'Build one picture together',
      'Соберите картинку вместе',
    ],
    tag: ['2–8 kishi', '2–8 players', '2–8 игроков'],
    to: 'play/create/pzt',
    legacy: true,
  },
  {
    id: 'sudoku',
    emoji: '🔢',
    tone: 'blue',
    title: ['Sudoku poygasi', 'Sudoku race', 'Судоку-гонка'],
    desc: [
      'Bir xil sudokuni kim tez yechadi',
      'Race to solve the same sudoku',
      'Кто быстрее решит судоку',
    ],
    tag: ['2–20 kishi', '2–20 players', '2–20 игроков'],
    to: 'play/create/sudoku',
    legacy: true,
  },
  {
    id: 'word',
    emoji: '🔤',
    tone: 'green',
    title: ['So‘z topish', 'Word game', 'Найди слово'],
    desc: [
      'Biznes atamalarini tez toping',
      'Find business terms fast',
      'Быстро находите бизнес-термины',
    ],
    tag: ['2–20 kishi', '2–20 players', '2–20 игроков'],
    to: 'play/create/word',
    legacy: true,
  },
  {
    id: 'memory',
    emoji: '🃏',
    tone: 'pink',
    title: ['Xotira kartalari', 'Memory cards', 'Карточки памяти'],
    desc: [
      'Juftliklarni hammadan oldin oching',
      'Open the pairs before everyone',
      'Откройте пары раньше всех',
    ],
    tag: ['2–20 kishi', '2–20 players', '2–20 игроков'],
    to: 'play/create/memory',
    legacy: true,
  },
  {
    id: 'yozuv',
    emoji: '⌨️',
    tone: 'orange',
    title: ['Yozuv Marafoni', 'Typing Marathon', 'Марафон набора'],
    desc: [
      'Tez yozing — yuguruvchingiz marraga chopadi',
      'Type fast — your runner races to the finish',
      'Печатайте быстро — бегун мчится к финишу',
    ],
    tag: ['Poyga', 'Race', 'Гонка'],
    to: 'play/yozuv',
    legacy: true,
  },
  {
    id: 'live',
    emoji: '⚡',
    tone: 'violet',
    title: ['Jonli test', 'Live quiz', 'Живой тест'],
    desc: [
      'O‘qituvchi boshlaydigan sinf viktorinasi',
      'A class quiz run by the teacher',
      'Викторина, которую ведёт преподаватель',
    ],
    tag: ['Butun guruh', 'Whole class', 'Вся группа'],
    to: 'play/live',
    legacy: true,
  },
];
const solo: GameCard[] = [
  {
    id: 'puzzle',
    emoji: '🧩',
    tone: 'violet',
    title: ['Puzzle', 'Jigsaw puzzle', 'Пазл'],
    desc: [
      '16–200 bo‘lak, rasmni o‘zingiz tanlaysiz',
      '16–200 pieces, pick your picture',
      '16–200 деталей, картинка на выбор',
    ],
    tag: ['Yolg‘iz', 'Solo', 'Один'],
    to: 'play/puzzle',
    legacy: true,
  },
  {
    id: 'sudoku-solo',
    emoji: '🔢',
    tone: 'blue',
    title: ['Sudoku', 'Sudoku', 'Судоку'],
    desc: ['Mantiqni charxlang', 'Sharpen your logic', 'Тренируйте логику'],
    tag: ['Yolg‘iz', 'Solo', 'Один'],
    to: 'play/solo/sudoku',
    legacy: true,
  },
  {
    id: 'word-solo',
    emoji: '🔤',
    tone: 'green',
    title: ['So‘z topish', 'Word game', 'Найди слово'],
    desc: [
      'Atamalarni topib, ball to‘plang',
      'Find terms and score points',
      'Находите термины и набирайте баллы',
    ],
    tag: ['Yolg‘iz', 'Solo', 'Один'],
    to: 'play/solo/word',
    legacy: true,
  },
  {
    id: 'memory-solo',
    emoji: '🃏',
    tone: 'pink',
    title: ['Xotira kartalari', 'Memory cards', 'Карточки памяти'],
    desc: ['Xotirangizni sinang', 'Test your memory', 'Проверьте память'],
    tag: ['Yolg‘iz', 'Solo', 'Один'],
    to: 'play/solo/memory',
    legacy: true,
  },
  {
    id: 'terms',
    emoji: '🧠',
    tone: 'teal',
    title: ['Atama va ta’rif', 'Term and meaning', 'Термин и смысл'],
    desc: [
      'TAM, SAM, SOM va foyda tushunchalari',
      'TAM, SAM, SOM and profit',
      'TAM, SAM, SOM и прибыль',
    ],
    tag: ['Hisobsiz ham', 'No account needed', 'Без аккаунта'],
    to: 'terms',
  },
  {
    id: 'math',
    emoji: '🧮',
    tone: 'amber',
    title: ['Foyda hisobi', 'Profit maths', 'Расчёт прибыли'],
    desc: [
      'Narx va tannarxdan foydani toping',
      'Find profit from price and cost',
      'Найдите прибыль по цене и себестоимости',
    ],
    tag: ['Hisobsiz ham', 'No account needed', 'Без аккаунта'],
    to: 'math',
  },
  {
    id: 'kross',
    emoji: '✏️',
    tone: 'slate',
    title: ['Krossvord yasash', 'Crossword maker', 'Конструктор кроссвордов'],
    desc: [
      'Savol-javobdan krossvord tuzib, PDF oling',
      'Turn clues into a crossword PDF',
      'Кроссворд из вопросов — в PDF',
    ],
    tag: ['Ijod', 'Create', 'Творчество'],
    to: 'play/kross',
    legacy: true,
  },
];
const LEGACY =
  /^(create\/(dama|chess|c4|pzl|pzt|sudoku|word|memory)|solo\/(word|memory|sudoku)|puzzle|yozuv|live|kross)$/;
const T3 = (lang: string, x: Tri) => (lang === 'en' ? x[1] : lang === 'ru' ? x[2] : x[0]);

/** O'qituvchi/administrator arenada o'z nomi bilan o'ynashi uchun alohida o'yinchi hisobi (talaba hisobi bo'lmasa). */
function staffPlayer(user: { id: string; name: string }) {
  try {
    const [name, ...rest] = (user.name || 'O‘qituvchi').trim().split(/\s+/);
    localStorage.setItem(
      'terdu_staff_player',
      JSON.stringify({
        id: 'tc_' + user.id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60),
        name,
        surname: rest.join(' '),
      }),
    );
  } catch {}
}

export function Games({ sub = '' }: { sub?: string }) {
  const { data, lang, legacy, setLogin } = useApp();
  const user = data?.user,
    staff = user?.role === 'teacher' || user?.role === 'admin',
    independent = user?.role === 'student' && user.learnerType === 'independent',
    canArena =
      !independent && (staff || !!legacy || data?.mode === 'demo' || user?.role === 'student'),
    signedIn = !!user || !!legacy;
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const open = (c: GameCard) => {
    if (c.legacy && !signedIn) {
      if (data?.mode === 'demo') navigate('login');
      else setLogin(true);
      return;
    }
    navigate('arena/' + c.to);
  };
  // ---- eski arena (guruh o'yinlari) sahifa ichida ----
  const playPath = sub.startsWith('play/') ? sub.slice(5) : '';
  if (sub === 'live' || (playPath && LEGACY.test(playPath))) {
    if (staff && user) staffPlayer(user);
    const card = [...online, ...solo].find((c) => c.to === 'play/' + playPath);
    const hash =
      sub === 'live'
        ? new URLSearchParams(typeof window === 'undefined' ? '' : location.search).get('arena') ||
          '#/'
        : '#/' + playPath;
    const src =
      '/legacy/arena.html?sqEmbed=arena' +
      (data?.mode === 'demo' ? '&sqDemo=1' : '') +
      (staff ? '&sqStaff=1' : '') +
      hash;
    return (
      <>
        <div className="arena-bar">
          <Button variant="ghost" onClick={() => navigate('arena')}>
            <ArrowLeft size={18} />
            {L('Barcha o‘yinlar', 'All games', 'Все игры')}
          </Button>
          <h1>
            {card
              ? card.emoji + ' ' + T3(lang, card.title)
              : '⚔️ ' + L('Guruh arenasi', 'Class arena', 'Арена группы')}
          </h1>
          {sub !== 'live' && (
            <Button variant="outline" asChild>
              <a href="#arena/live">
                <Users size={16} />
                {L('Onlayn o‘yinchilar', 'Players online', 'Игроки онлайн')}
              </a>
            </Button>
          )}
        </div>
        {staff && (
          <p className="arena-note">
            👩‍🏫{' '}
            {L(
              'Siz o‘qituvchi sifatida o‘ynayapsiz: talabalar sizni «Hozir onlayn» ro‘yxatida ko‘radi va o‘yinga taklif qila oladi. Natijangiz reytingga qo‘shilmaydi.',
              'You are playing as a teacher: students see you under “Online now” and can invite you. Your results are not added to the ranking.',
              'Вы играете как преподаватель: студенты видят вас в списке «Сейчас онлайн» и могут пригласить. Результаты не идут в рейтинг.',
            )}
          </p>
        )}
        <div className="panel arena-frame">
          <NativeSurface
            key={src}
            className="native-workspace native-arena"
            title={L('Guruh o‘yinlari arenasi', 'Class games arena', 'Арена игр группы')}
            src={src}
          />
        </div>
      </>
    );
  }
  if (sub === 'brand') return <BrandGame onExit={() => navigate('arena')} />;
  if (sub === 'terms' || sub === 'math')
    return (
      <>
        <div className="arena-bar">
          <Button variant="ghost" onClick={() => navigate('arena')}>
            <ArrowLeft size={18} />
            {L('Barcha o‘yinlar', 'All games', 'Все игры')}
          </Button>
        </div>
        {sub === 'terms' ? <Memory /> : <MathGame />}
      </>
    );
  const cardButton = (c: GameCard) => {
    const locked = c.legacy && signedIn && !canArena;
    return (
      <button
        key={c.id}
        className={'arena-card tone-' + c.tone + (locked ? ' is-locked' : '')}
        disabled={locked}
        onClick={() => open(c)}
      >
        <span className="arena-card-emoji" aria-hidden="true">
          {c.emoji}
        </span>
        <span className="arena-card-body">
          <b>{T3(lang, c.title)}</b>
          <small>{T3(lang, c.desc)}</small>
        </span>
        <span className="arena-card-tag">
          {c.legacy && !signedIn
            ? '🔐 ' + L('Kirish kerak', 'Sign-in needed', 'Нужен вход')
            : T3(lang, c.tag)}
        </span>
      </button>
    );
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {L(
              'O‘YNANG · O‘RGANING · BELLASHING',
              'PLAY · LEARN · COMPETE',
              'ИГРАЙТЕ · УЧИТЕСЬ · СОРЕВНУЙТЕСЬ',
            )}
          </span>
          <h1>🎮 {t(lang, 'arena')}</h1>
          <p>
            {L(
              'Bilimni o‘yin orqali mustahkamlang: guruhdoshlar bilan onlayn bellashing yoki yolg‘iz mashq qiling.',
              'Reinforce what you learn through play: compete online with classmates or practise on your own.',
              'Закрепляйте знания в игре: соревнуйтесь с одногруппниками онлайн или тренируйтесь сами.',
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="#arena/live">
            {L('Guruh musobaqalari', 'Class competitions', 'Соревнования группы')}
            <ArrowUpRight size={16} />
          </a>
        </Button>
      </div>
      <button className="arena-feature" onClick={() => navigate('arena/brand')}>
        <span className="arena-feature-text">
          <span className="arena-feature-new">{L('YANGI O‘YIN', 'NEW GAME', 'НОВАЯ ИГРА')}</span>
          <b>🏷️ {L('Brendni top', 'Guess the brand', 'Угадай бренд')}</b>
          <span>
            {L(
              'Dunyoga mashhur 50 dan ortiq brend belgisi: kompaniya nomini toping, sohasi, mamlakati va qiziqarli faktini bilib oling.',
              'Over 50 world-famous logos: name the company and learn its industry, country and a fun fact.',
              'Более 50 известных логотипов: назовите компанию и узнайте сферу, страну и интересный факт.',
            )}
          </span>
          <span className="arena-feature-go">▶ {L('O‘ynash', 'Play', 'Играть')}</span>
        </span>
        <span className="arena-feature-art" aria-hidden="true">
          <i>🍎</i>
          <i>👟</i>
          <i>☕</i>
          <i>🚗</i>
          <i>✈️</i>
          <i>🎧</i>
        </span>
      </button>
      {independent && (
        <p className="arena-note">
          ℹ️{' '}
          {L(
            'Guruh arenasi universitet talabalari uchun. Mustaqil o‘quvchilar «Brendni top», «Atama va ta’rif» va «Foyda hisobi» o‘yinlarini o‘ynay oladi.',
            'The class arena is for university students. Independent learners can play “Guess the brand”, “Term and meaning” and “Profit maths”.',
            'Арена группы — для студентов университета. Самостоятельным ученикам доступны «Угадай бренд», «Термин и смысл» и «Расчёт прибыли».',
          )}
        </p>
      )}
      <section className="arena-section">
        <div className="section-heading">
          <h2>
            👥{' '}
            {L(
              'Guruhdoshlar bilan (onlayn)',
              'With classmates (online)',
              'С одногруппниками (онлайн)',
            )}
          </h2>
        </div>
        <div className="arena-grid">{online.map(cardButton)}</div>
      </section>
      <section className="arena-section">
        <div className="section-heading">
          <h2>🎯 {L('Yolg‘iz mashq', 'Practise alone', 'Тренировка в одиночку')}</h2>
        </div>
        <div className="arena-grid">
          {solo.map(cardButton)}
          {data?.quizzes.map((q) => (
            <button
              key={q.id}
              className="arena-card tone-orange"
              onClick={() => navigate('quiz/' + q.id)}
            >
              <span className="arena-card-emoji" aria-hidden="true">
                📝
              </span>
              <span className="arena-card-body">
                <b>{q.title}</b>
                <small>
                  {L(
                    'Vaqtli test, natija serverda tekshiriladi',
                    'A timed quiz graded on the server',
                    'Тест на время, проверка на сервере',
                  )}
                </small>
              </span>
              <span className="arena-card-tag">{L('Test', 'Quiz', 'Тест')}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
function Memory() {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const [cards, setCards] = useState<{ pair: number; text: string }[]>([]),
    [open, setOpen] = useState<number[]>([]),
    [found, setFound] = useState<number[]>([]),
    [moves, setMoves] = useState(0);
  function reset() {
    setCards(
      pairs
        .flatMap((p, i) => p.map((text) => ({ pair: i, text: T3(lang, text) })))
        .sort(() => Math.random() - 0.5),
    );
    setOpen([]);
    setFound([]);
    setMoves(0);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [lang]);
  useEffect(() => {
    if (open.length !== 2) return;
    if (cards[open[0]].pair === cards[open[1]].pair) {
      setFound((f) => [...f, cards[open[0]].pair]);
      setOpen([]);
    } else {
      const timer = setTimeout(() => setOpen([]), 900);
      return () => clearTimeout(timer);
    }
  }, [open, cards]);
  return (
    <div className="panel game-play">
      <div className="section-heading">
        <h2>🧠 {L('Atama va ta’rif', 'Term and meaning', 'Термин и смысл')}</h2>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw size={15} />
          {L('Yurishlar', 'Moves', 'Ходы')}: {moves}
        </Button>
      </div>
      <p>
        {L(
          'Atamani uning ta’rifi bilan juftlang. Ikki kartani oching — mos kelsa, ochiq qoladi.',
          'Match each term with its meaning. Open two cards — matching pairs stay open.',
          'Сопоставьте термин с определением. Откройте две карты — совпавшие остаются открытыми.',
        )}
      </p>
      <div className="memory-grid">
        {cards.map((c, i) => (
          <button
            key={i}
            className={open.includes(i) || found.includes(c.pair) ? 'flipped' : ''}
            disabled={open.includes(i) || found.includes(c.pair) || open.length === 2}
            onClick={() => {
              setOpen([...open, i]);
              setMoves((m) => m + 1);
            }}
          >
            {open.includes(i) || found.includes(c.pair) ? c.text : '✦'}
          </button>
        ))}
      </div>
      {found.length === pairs.length && (
        <p className="success-text">
          🎉{' '}
          {L(
            `Ajoyib! Barcha juftliklar ${moves} ta yurishda topildi.`,
            `Great! All pairs found in ${moves} moves.`,
            `Отлично! Все пары найдены за ${moves} ходов.`,
          )}
        </p>
      )}
    </div>
  );
}
type Task = {
  kind: 'unit' | 'total' | 'even';
  price: number;
  cost: number;
  qty: number;
  fixed: number;
  answer: number;
};
function newTask(): Task {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  const cost = r(2, 9) * 1000,
    margin = r(1, 6) * 1000,
    price = cost + margin,
    qty = r(2, 12) * 10,
    kind = (['unit', 'total', 'even'] as const)[r(0, 2)],
    fixed = margin * r(5, 40);
  return {
    kind,
    price,
    cost,
    qty,
    fixed,
    answer: kind === 'unit' ? margin : kind === 'total' ? margin * qty : fixed / margin,
  };
}
function MathGame() {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const [task, setTask] = useState<Task>(() => newTask()),
    [correct, setCorrect] = useState(0),
    [tries, setTries] = useState(0),
    [value, setValue] = useState(''),
    [feedback, setFeedback] = useState('');
  const so = (n: number) => n.toLocaleString('ru-RU') + ' ' + L('so‘m', 'UZS', 'сум');
  const question =
    task.kind === 'unit'
      ? L(
          `Tannarx ${so(task.cost)}, sotuv narxi ${so(task.price)}. Bir donadan foyda qancha (so‘m)?`,
          `Cost ${so(task.cost)}, price ${so(task.price)}. What is the profit per unit (UZS)?`,
          `Себестоимость ${so(task.cost)}, цена ${so(task.price)}. Какая прибыль с единицы (сум)?`,
        )
      : task.kind === 'total'
        ? L(
            `Tannarx ${so(task.cost)}, narx ${so(task.price)}. ${task.qty} dona sotilsa, jami foyda qancha (so‘m)?`,
            `Cost ${so(task.cost)}, price ${so(task.price)}. Total profit for ${task.qty} units (UZS)?`,
            `Себестоимость ${so(task.cost)}, цена ${so(task.price)}. Общая прибыль за ${task.qty} шт. (сум)?`,
          )
        : L(
            `Doimiy xarajat ${so(task.fixed)}. Narx ${so(task.price)}, o‘zgaruvchan xarajat ${so(task.cost)}. Zararsizlik nuqtasi necha dona?`,
            `Fixed costs ${so(task.fixed)}. Price ${so(task.price)}, variable cost ${so(task.cost)}. How many units to break even?`,
            `Постоянные затраты ${so(task.fixed)}. Цена ${so(task.price)}, переменные ${so(task.cost)}. Сколько штук до безубыточности?`,
          );
  const formula =
    task.kind === 'unit'
      ? L('foyda = narx − tannarx', 'profit = price − cost', 'прибыль = цена − себестоимость')
      : task.kind === 'total'
        ? L(
            'jami foyda = (narx − tannarx) × soni',
            'total = (price − cost) × units',
            'итого = (цена − себестоимость) × шт.',
          )
        : L(
            'dona = doimiy xarajat ÷ (narx − o‘zgaruvchan xarajat)',
            'units = fixed ÷ (price − variable)',
            'шт. = постоянные ÷ (цена − переменные)',
          );
  return (
    <div className="panel game-play">
      <h2>🧮 {L('Foyda hisobi', 'Profit maths', 'Расчёт прибыли')}</h2>
      <p>{question}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTries((n) => n + 1);
          if (Number(value.replace(/\s/g, '')) === task.answer) {
            setFeedback('✅ ' + L('To‘g‘ri!', 'Correct!', 'Верно!'));
            setCorrect((n) => n + 1);
            setTask(newTask());
            setValue('');
          } else
            setFeedback(
              '💡 ' + L('Yana urinib ko‘ring', 'Try again', 'Попробуйте ещё') + ': ' + formula,
            );
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          aria-label={L('Javob', 'Answer', 'Ответ')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <Button>{L('Tekshirish', 'Check', 'Проверить')}</Button>
      </form>
      <p role="status">{feedback}</p>
      <p>
        {L(
          `${tries} ta urinishdan ${correct} ta to‘g‘ri javob`,
          `${correct} correct out of ${tries} tries`,
          `${correct} верных из ${tries} попыток`,
        )}
      </p>
    </div>
  );
}
