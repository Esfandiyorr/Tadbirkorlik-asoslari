'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Zap,
  Keyboard,
  Calculator,
  Shuffle,
  ArrowUpRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { t } from '@/lib/i18n';
const pairs = [
  ['TAM', 'Umumiy mumkin bo‘lgan bozor'],
  ['SAM', 'Xizmat ko‘rsatish mumkin bo‘lgan bozor'],
  ['SOM', 'Egallash rejalashtirilgan bozor'],
  ['Foyda', 'Tushum − xarajat'],
];
export function Games() {
  const { data, lang } = useApp(),
    [game, setGame] = useState('');
  const games = [
    { id: 'quiz', title: 'Quiz Battle', description: 'Bilimingizni vaqt bilan sinang', icon: Zap },
    { id: 'memory', title: 'Memory Cards', description: 'Atama va ma’nolarni toping', icon: Brain },
    {
      id: 'word',
      title: 'Word Challenge',
      description: 'Biznes so‘zlarini o‘rganing',
      icon: Shuffle,
    },
    {
      id: 'math',
      title: 'Math Challenge',
      description: 'Biznes hisob-kitoblarini yeching',
      icon: Calculator,
    },
    {
      id: 'typing',
      title: 'Typing Challenge',
      description: 'Aniq va tez yozishni mashq qiling',
      icon: Keyboard,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLAY. LEARN. REPEAT.</span>
          <h1>{t(lang, 'arena')}</h1>
          <p>
            {lang === 'uz'
              ? 'Mashqlar bilimni mustahkamlaydi. Mashq o‘yinlari XP bermaydi.'
              : lang === 'en'
                ? 'Practice builds knowledge. Practice games do not award XP.'
                : 'Практика закрепляет знания. Тренировочные игры не дают XP.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={'/legacy/arena.html' + (data?.mode === 'demo' ? '?sqDemo=1' : '')}>
            {lang === 'uz'
              ? 'Guruh musobaqalari'
              : lang === 'en'
                ? 'Class competitions'
                : 'Соревнования класса'}
            <ArrowUpRight size={16} />
          </a>
        </Button>
      </div>
      <div className="game-grid">
        {games.map((g, i) => (
          <button
            key={g.id}
            className={'game-card tone-' + (i % 3) + (game === g.id ? ' selected' : '')}
            onClick={() => setGame(g.id)}
          >
            <g.icon size={35} />
            <h3>{g.title}</h3>
            <p>{g.description}</p>
          </button>
        ))}
      </div>
      {game === 'memory' && <Memory />}
      {game === 'typing' && <Typing />}
      {game === 'math' && <MathGame />}
      {game === 'word' && <Word />}
      {game === 'quiz' && (
        <div className="panel game-play">
          <Zap size={36} />
          <h2>Quiz Battle</h2>
          <p>
            {lang === 'uz'
              ? 'Vaqtli testni boshlang. Natija serverda tekshiriladi.'
              : lang === 'en'
                ? 'Start the timed quiz. Your result is graded on the server.'
                : 'Начните тест на время. Результат проверяется сервером.'}
          </p>
          {data?.quizzes.map((q) => (
            <Button key={q.id} onClick={() => navigate('quiz/' + q.id)}>
              {q.title}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}
function Memory() {
  const [cards, setCards] = useState<{ pair: number; text: string }[]>([]),
    [open, setOpen] = useState<number[]>([]),
    [found, setFound] = useState<number[]>([]),
    [moves, setMoves] = useState(0);
  function reset() {
    setCards(
      pairs.flatMap((p, i) => p.map((text) => ({ pair: i, text }))).sort(() => Math.random() - 0.5),
    );
    setOpen([]);
    setFound([]);
    setMoves(0);
  }
  useEffect(reset, []);
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
        <h2>Memory Cards</h2>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw size={15} />
          {moves}
        </Button>
      </div>
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
      {found.length === 4 && <p className="success-text">✓ Ajoyib! Barcha juftliklar topildi.</p>}
    </div>
  );
}
function MathGame() {
  const [correct, setCorrect] = useState(0),
    [cost, setCost] = useState(7000),
    [price, setPrice] = useState(10000),
    [value, setValue] = useState(''),
    [feedback, setFeedback] = useState('');
  return (
    <div className="panel game-play">
      <h2>Math Challenge</h2>
      <p>
        Tannarx {cost.toLocaleString()} so‘m. Sotuv narxi {price.toLocaleString()} so‘m. Bir dona
        mahsulotdan foyda qancha?
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(value) === price - cost) {
            setFeedback('✓ To‘g‘ri!');
            setCorrect((n) => n + 1);
            setCost(1000 * (Math.floor(Math.random() * 8) + 2));
            setPrice(15000 + 1000 * Math.floor(Math.random() * 8));
            setValue('');
          } else setFeedback('Yana urinib ko‘ring: foyda = narx − tannarx.');
        }}
      >
        <input
          className="input"
          type="number"
          aria-label="Foyda"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <Button>Tekshirish</Button>
      </form>
      <p role="status">{feedback}</p>
      <p>{correct} ta to‘g‘ri javob</p>
    </div>
  );
}
function Word() {
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState(''),
    [score, setScore] = useState(0);
  return (
    <div className="panel game-play">
      <h2>Word Challenge</h2>
      <p>
        <b>{pairs[index][0]}</b> nimani anglatadi?
      </p>
      <div className="word-options">
        {pairs.map((p) => (
          <Button
            variant="outline"
            key={p[1]}
            disabled={!!selected}
            onClick={() => {
              setSelected(p[1]);
              if (p[1] === pairs[index][1]) setScore((s) => s + 1);
            }}
          >
            {p[1]}
          </Button>
        ))}
      </div>
      {selected && (
        <>
          <p>{selected === pairs[index][1] ? '✓ To‘g‘ri!' : 'To‘g‘ri javob: ' + pairs[index][1]}</p>
          <Button
            onClick={() => {
              setSelected('');
              setIndex((index + 1) % pairs.length);
            }}
          >
            Keyingisi
          </Button>
        </>
      )}
      <p>{score} ta to‘g‘ri javob</p>
    </div>
  );
}
function Typing() {
  const target = 'Tadbirkor mijoz muammosini tushunadi va foydali yechim yaratadi.',
    [value, setValue] = useState(''),
    [start, setStart] = useState(0),
    [elapsed, setElapsed] = useState(0);
  const done = value === target;
  useEffect(() => {
    if (!start || done) return;
    const timer = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(timer);
  }, [start, done]);
  const correct = value.split('').filter((x, i) => target[i] === x).length;
  return (
    <div className="panel game-play">
      <h2>Typing Challenge</h2>
      <p className="typing-target">
        {target.split('').map((c, i) => (
          <span
            key={i}
            className={i < value.length ? (value[i] === c ? 'typed-correct' : 'typed-wrong') : ''}
          >
            {c}
          </span>
        ))}
      </p>
      <textarea
        className="input"
        aria-label="Typing practice"
        value={value}
        disabled={done}
        onPaste={(e) => e.preventDefault()}
        onChange={(e) => {
          if (!start) setStart(Date.now());
          setValue(e.target.value);
        }}
      />
      <div className="typing-stats">
        <b>{Math.round((correct / 5 / Math.max(1, elapsed)) * 60)} WPM</b>
        <b>{value.length ? Math.round((correct / value.length) * 100) : 100}%</b>
        <b>{Math.round(elapsed)} s</b>
      </div>
      {done && <p className="success-text">✓ Mashq yakunlandi!</p>}
      <Button
        variant="outline"
        onClick={() => {
          setValue('');
          setStart(0);
          setElapsed(0);
        }}
      >
        Qayta boshlash
      </Button>
    </div>
  );
}
