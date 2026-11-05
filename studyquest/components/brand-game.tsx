'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';
import type { Lang } from '@/lib/types';

/* «Brendni top»: dunyo brendlarining belgisi chiqadi — kompaniya nomini topish kerak.
   Logotiplar: Simple Icons (CC0). Brend nomlari va belgilari egalariga tegishli; o'yin ta'lim maqsadida. */
type Brand = {
  id: string;
  name: string;
  hex: string;
  path: string;
  cat: string;
  country: string;
  year: number;
  fact: [string, string, string];
};
type Level = 'easy' | 'hard';
type Question = { brand: Brand; options: Brand[] };

const ROUNDS = 10;
const cats: Record<string, [string, string, string]> = {
  tech: ['Texnologiya', 'Technology', 'Технологии'],
  internet: ['Internet xizmatlari', 'Internet services', 'Интернет-сервисы'],
  social: ['Ijtimoiy tarmoq', 'Social network', 'Соцсеть'],
  messenger: ['Messenjer', 'Messenger', 'Мессенджер'],
  sport: ['Sport kiyimlari', 'Sportswear', 'Спортивная одежда'],
  food: ['Tez tayyor taomlar', 'Fast food', 'Фастфуд'],
  coffee: ['Qahvaxonalar tarmog‘i', 'Coffee shops', 'Сеть кофеен'],
  drink: ['Ichimliklar', 'Beverages', 'Напитки'],
  auto: ['Avtomobilsozlik', 'Car maker', 'Автопроизводитель'],
  sportscar: ['Sport avtomobillari', 'Sports cars', 'Спорткары'],
  payment: ['To‘lov tizimi', 'Payments', 'Платёжная система'],
  travel: ['Sayohat', 'Travel', 'Путешествия'],
  airline: ['Aviakompaniya', 'Airline', 'Авиакомпания'],
  games: ['Video o‘yinlar', 'Video games', 'Видеоигры'],
  energy: ['Neft va gaz', 'Oil and gas', 'Нефть и газ'],
  stream: ['Video va musiqa', 'Streaming', 'Стриминг'],
  browser: ['Brauzer', 'Web browser', 'Браузер'],
  engineering: ['Muhandislik', 'Engineering', 'Инженерия'],
};
const countries: Record<string, [string, string, string, string]> = {
  us: ['🇺🇸', 'AQSh', 'USA', 'США'],
  de: ['🇩🇪', 'Germaniya', 'Germany', 'Германия'],
  jp: ['🇯🇵', 'Yaponiya', 'Japan', 'Япония'],
  kr: ['🇰🇷', 'Janubiy Koreya', 'South Korea', 'Южная Корея'],
  cn: ['🇨🇳', 'Xitoy', 'China', 'Китай'],
  se: ['🇸🇪', 'Shvetsiya', 'Sweden', 'Швеция'],
  ae: ['🇦🇪', 'BAA', 'UAE', 'ОАЭ'],
  it: ['🇮🇹', 'Italiya', 'Italy', 'Италия'],
  at: ['🇦🇹', 'Avstriya', 'Austria', 'Австрия'],
  gb: ['🇬🇧', 'Buyuk Britaniya', 'United Kingdom', 'Великобритания'],
  fr: ['🇫🇷', 'Fransiya', 'France', 'Франция'],
  no: ['🇳🇴', 'Norvegiya', 'Norway', 'Норвегия'],
  qa: ['🇶🇦', 'Qatar', 'Qatar', 'Катар'],
  tr: ['🇹🇷', 'Turkiya', 'Türkiye', 'Турция'],
};
const pick3 = (x: [string, string, string], lang: Lang) =>
  lang === 'en' ? x[1] : lang === 'ru' ? x[2] : x[0];
const countryOf = (id: string, lang: Lang) => {
  const c = countries[id];
  return c ? c[0] + ' ' + (lang === 'en' ? c[2] : lang === 'ru' ? c[3] : c[1]) : id;
};
function shuffle<T>(list: T[]) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** Juda och rangli belgilar (masalan, sariq) qorong'i fonda ko'rsatiladi. */
const light = (hex: string) => {
  const n = parseInt(hex, 16),
    r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
};
export function makeQuestions(brands: Brand[], level: Level, rounds = ROUNDS): Question[] {
  return shuffle(brands)
    .slice(0, rounds)
    .map((brand) => {
      const same = shuffle(brands.filter((b) => b.id !== brand.id && b.cat === brand.cat)),
        rest = shuffle(brands.filter((b) => b.id !== brand.id && b.cat !== brand.cat));
      // Qiyin darajada chalg'ituvchi javoblar shu sohadan tanlanadi (masalan, avtomobillar ichidan).
      const pool = level === 'hard' ? [...same, ...rest] : [...rest.slice(0, 2), ...same, ...rest];
      return { brand, options: shuffle([brand, ...pool.slice(0, 3)]) };
    });
}

function Logo({ brand, silhouette }: { brand: Brand; silhouette: boolean }) {
  return (
    <div
      className={'brand-logo-tile' + (!silhouette && light(brand.hex) ? ' on-dark' : '')}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" role="img">
        <path d={brand.path} fill={silhouette ? 'currentColor' : '#' + brand.hex} />
      </svg>
    </div>
  );
}

export function BrandGame({ onExit }: { onExit: () => void }) {
  const { lang } = useApp();
  const [brands, setBrands] = useState<Brand[] | null>(null),
    [error, setError] = useState(''),
    [level, setLevel] = useState<Level>('easy'),
    [phase, setPhase] = useState<'menu' | 'play' | 'done'>('menu'),
    [questions, setQuestions] = useState<Question[]>([]),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState<string | null>(null),
    [hint, setHint] = useState(false),
    [score, setScore] = useState(0),
    [streak, setStreak] = useState(0),
    [results, setResults] = useState<{ id: string; ok: boolean }[]>([]),
    [left, setLeft] = useState(15),
    [best, setBest] = useState(0);
  const limit = level === 'hard' ? 12 : 15,
    deadline = useRef(0);
  useEffect(() => {
    let alive = true;
    fetch('/brands/brands.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((v: Brand[]) => alive && setBrands(v))
      .catch(() => alive && setError('load'));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem('sq-brand-best-' + level)) || 0);
    } catch {}
  }, [level, phase]);
  const q = questions[index];
  const answer = useCallback(
    (id: string | null) => {
      if (!q || choice !== null) return;
      const ok = id === q.brand.id;
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setChoice(id ?? '');
      setResults((r) => [...r, { id: q.brand.id, ok }]);
      if (ok) {
        const base = 100 + remaining * 10 + streak * 20;
        setScore((s) => s + Math.round(hint ? base / 2 : base));
        setStreak((s) => s + 1);
      } else setStreak(0);
    },
    [q, choice, streak, hint],
  );
  // Har savolga vaqt: oson — 15 s, qiyin — 12 s.
  useEffect(() => {
    if (phase !== 'play' || choice !== null) return;
    deadline.current = Date.now() + limit * 1000;
    setLeft(limit);
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) answer(null);
    }, 200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, choice === null]);
  const start = () => {
    if (!brands) return;
    setQuestions(makeQuestions(brands, level));
    setIndex(0);
    setChoice(null);
    setHint(false);
    setScore(0);
    setStreak(0);
    setResults([]);
    setPhase('play');
  };
  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      setPhase('done');
      try {
        if (score > Number(localStorage.getItem('sq-brand-best-' + level) || 0))
          localStorage.setItem('sq-brand-best-' + level, String(score));
      } catch {}
      return;
    }
    setIndex((i) => i + 1);
    setChoice(null);
    setHint(false);
  }, [index, questions.length, score, level]);
  // Klaviatura: 1–4 — javob, Enter — keyingisi.
  useEffect(() => {
    if (phase !== 'play') return;
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (choice === null && /^[1-4]$/.test(e.key)) answer(q.options[Number(e.key) - 1]?.id);
      else if (choice !== null && e.key === 'Enter') next();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase, choice, q, answer, next]);
  const correct = useMemo(() => results.filter((r) => r.ok).length, [results]);

  const header = (
    <div className="bg-head">
      <Button variant="ghost" className="bg-back" onClick={onExit}>
        <ArrowLeft size={18} />
        {tr(lang, 'O‘yinlar', 'Games', 'Игры')}
      </Button>
      <h2>🏷️ {tr(lang, 'Brendni top', 'Guess the brand', 'Угадай бренд')}</h2>
      {phase === 'play' && (
        <span className="bg-score" aria-live="polite">
          ⭐ {score}
        </span>
      )}
    </div>
  );
  if (error)
    return (
      <section className="panel brand-game">
        {header}
        <p role="alert">
          {tr(
            lang,
            'Logotiplar yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.',
            'The logos did not load. Check the connection and try again.',
            'Логотипы не загрузились. Проверьте интернет и попробуйте снова.',
          )}
        </p>
      </section>
    );
  if (phase === 'menu' || !q)
    return (
      <section className="panel brand-game">
        {header}
        <div className="bg-menu">
          <div className="bg-menu-art" aria-hidden="true">
            {(brands || []).slice(0, 8).map((b, i) => (
              <span key={b.id} style={{ animationDelay: i * -0.6 + 's' }}>
                <Logo brand={b} silhouette={false} />
              </span>
            ))}
          </div>
          <div className="bg-menu-text">
            <p>
              {tr(
                lang,
                `Ekranda dunyoga mashhur brend belgisi chiqadi — kompaniya nomini to‘rtta javobdan toping. ${ROUNDS} ta savol, har biri uchun vaqt cheklangan. Tez va ketma-ket to‘g‘ri javob — ko‘proq ball!`,
                `A famous brand’s logo appears — pick the company name from four answers. ${ROUNDS} questions, each against the clock. Fast answers and streaks earn more points!`,
                `Появляется логотип известного бренда — выберите название компании из четырёх вариантов. ${ROUNDS} вопросов на время. Быстрые ответы и серии дают больше баллов!`,
              )}
            </p>
            <div
              className="bg-levels"
              role="radiogroup"
              aria-label={tr(lang, 'Daraja', 'Level', 'Уровень')}
            >
              {(
                [
                  [
                    'easy',
                    '🟢',
                    tr(lang, 'Oson', 'Easy', 'Легко'),
                    tr(
                      lang,
                      'Rangli logotip · 15 soniya',
                      'Colour logo · 15 s',
                      'Цветной логотип · 15 с',
                    ),
                  ],
                  [
                    'hard',
                    '🔴',
                    tr(lang, 'Qiyin', 'Hard', 'Сложно'),
                    tr(
                      lang,
                      'Rangsiz siluet · bir sohadan variantlar · 12 soniya',
                      'Silhouette · same-industry options · 12 s',
                      'Силуэт · варианты из одной сферы · 12 с',
                    ),
                  ],
                ] as const
              ).map(([id, icon, label, sub]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={level === id}
                  className={level === id ? 'on' : ''}
                  onClick={() => setLevel(id)}
                >
                  <span>{icon}</span>
                  <b>{label}</b>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
            {best > 0 && (
              <p className="bg-best">
                <Trophy size={16} /> {tr(lang, 'Eng yaxshi natijangiz', 'Your best', 'Ваш рекорд')}:{' '}
                <b>{best}</b>
              </p>
            )}
            <Button size="lg" disabled={!brands} onClick={start}>
              ▶{' '}
              {brands
                ? tr(lang, 'Boshlash', 'Start', 'Начать')
                : tr(lang, 'Yuklanmoqda…', 'Loading…', 'Загрузка…')}
            </Button>
          </div>
        </div>
        <p className="bg-credit">
          {tr(
            lang,
            'Logotiplar: Simple Icons (CC0). Brend nomlari va belgilari egalariga tegishli; o‘yin faqat ta’lim maqsadida.',
            'Logos: Simple Icons (CC0). Brand names and marks belong to their owners; for education only.',
            'Логотипы: Simple Icons (CC0). Названия и знаки принадлежат владельцам; только для обучения.',
          )}
        </p>
      </section>
    );
  if (phase === 'done')
    return (
      <section className="panel brand-game">
        {header}
        <div className="bg-done">
          <div className="bg-done-medal" aria-hidden="true">
            {correct >= 9 ? '🏆' : correct >= 7 ? '🥇' : correct >= 5 ? '🥈' : '🎯'}
          </div>
          <h3>
            {score} {tr(lang, 'ball', 'points', 'баллов')}
          </h3>
          <p>
            {tr(
              lang,
              `${questions.length} tadan ${correct} ta to‘g‘ri javob`,
              `${correct} of ${questions.length} correct`,
              `${correct} из ${questions.length} верно`,
            )}
            {score >= best && score > 0
              ? ' · ' + tr(lang, '🎉 Yangi rekord!', '🎉 New best!', '🎉 Новый рекорд!')
              : ''}
          </p>
          <div className="bg-review">
            {questions.map((x, i) => (
              <div key={x.brand.id} className={results[i]?.ok ? 'ok' : 'no'} title={x.brand.name}>
                <Logo brand={x.brand} silhouette={false} />
                <small>{x.brand.name}</small>
              </div>
            ))}
          </div>
          <div className="row-actions">
            <Button onClick={start}>
              <RotateCcw size={16} />
              {tr(lang, 'Yana o‘ynash', 'Play again', 'Играть ещё')}
            </Button>
            <Button variant="outline" onClick={() => setPhase('menu')}>
              {tr(lang, 'Darajani almashtirish', 'Change level', 'Сменить уровень')}
            </Button>
          </div>
        </div>
      </section>
    );
  const b = q.brand,
    answered = choice !== null,
    won = choice === b.id;
  return (
    <section className="panel brand-game">
      {header}
      <div className="bg-progress">
        <span>
          {index + 1} / {questions.length}
        </span>
        <div className="bg-dots">
          {questions.map((x, i) => (
            <i
              key={x.brand.id}
              className={
                i < results.length ? (results[i].ok ? 'ok' : 'no') : i === index ? 'now' : ''
              }
            />
          ))}
        </div>
        {streak > 1 && <span className="bg-streak">🔥 {streak}</span>}
      </div>
      <div className="bg-stage">
        <div className={'bg-logo-wrap' + (answered ? (won ? ' won' : ' lost') : '')}>
          <Logo brand={b} silhouette={level === 'hard' && !answered} />
          {!answered && (
            <div className="bg-timer" style={{ ['--p' as string]: left / limit }}>
              <span>{left}</span>
            </div>
          )}
        </div>
        {!answered && (
          <Button variant="ghost" className="bg-hint" disabled={hint} onClick={() => setHint(true)}>
            <Lightbulb size={16} />
            {hint
              ? `${pick3(cats[b.cat] || [b.cat, b.cat, b.cat], lang)} · ${countryOf(b.country, lang)} · ${b.year}`
              : tr(
                  lang,
                  'Yordam (ball yarmiga kamayadi)',
                  'Hint (halves the points)',
                  'Подсказка (половина баллов)',
                )}
          </Button>
        )}
        <div className="bg-options">
          {q.options.map((o, i) => (
            <button
              key={o.id}
              disabled={answered}
              className={
                answered ? (o.id === b.id ? 'right' : o.id === choice ? 'wrong' : 'dim') : ''
              }
              onClick={() => answer(o.id)}
            >
              <kbd>{i + 1}</kbd>
              {o.name}
            </button>
          ))}
        </div>
        {answered && (
          <div className={'bg-fact ' + (won ? 'ok' : 'no')} role="status">
            <b>
              {won
                ? tr(lang, '✅ To‘g‘ri!', '✅ Correct!', '✅ Верно!')
                : choice === ''
                  ? tr(lang, '⏰ Vaqt tugadi', '⏰ Time is up', '⏰ Время вышло')
                  : tr(lang, '❌ Noto‘g‘ri', '❌ Not quite', '❌ Неверно')}{' '}
              — {b.name}
            </b>
            <span>
              {pick3(cats[b.cat] || [b.cat, b.cat, b.cat], lang)} · {countryOf(b.country, lang)} ·{' '}
              {tr(lang, `${b.year}-yil`, `since ${b.year}`, `с ${b.year} г.`)}
            </span>
            <p>💡 {pick3(b.fact, lang)}</p>
            <Button onClick={next}>
              {index + 1 >= questions.length
                ? tr(lang, 'Natijani ko‘rish', 'See the result', 'Посмотреть результат')
                : tr(lang, 'Keyingisi', 'Next', 'Далее')}{' '}
              →
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
