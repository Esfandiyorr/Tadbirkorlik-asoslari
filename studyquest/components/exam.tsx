'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProductBuy } from './product-buy';
import { dueText, tr } from '@/lib/points';
import type { ExamCert, ExamItem, ExamView } from '@/lib/exam';

/* 🎯 Yakuniy testga tayyorgarlik — kurs ichidagi bo'lim (#course/<id>/exam). Server — lib/server/exam.ts.
   Bo'lim yopiq bo'lsa: nimalar borligi va «Sotib olish» (pullik xizmat, obunachiga 50 % arzon). Ochiq bo'lsa:
   mavzu bo'yicha mashq, aralash mashq, xatolar ustida ishlash (har javobdan keyin tekshiriladi), vaqtli yakuniy
   sinov (oxirida tekshiriladi) va o'tganlarga QR-kodli sertifikat (#sertifikat/<id>). */

type Session =
  | { kind: 'practice'; mode: string; title: string; items: ExamItem[] }
  | { kind: 'final'; run: string; end: number; items: ExamItem[] };
type Result = {
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  cert?: string;
  review: { id: string; choice: number | null; correct: number }[];
};

async function post<T>(request: (u: string, i?: RequestInit) => Promise<Response>, input: unknown) {
  const r = await request('/api/exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: 'me', input }),
  });
  const v = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((v as { error?: string }).error || 'Xatolik');
  return v as T;
}
const LETTER = 'ABCDEF';
const ANS_KEY = (run: string) => 'sq-exam-' + run;

export function ExamPrep({ courseId }: { courseId: string }) {
  const { lang, request, toast, data, setLogin } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<ExamView | null>(null);
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = data?.user?.id;
  const load = useCallback(async () => {
    try {
      const r = await request('/api/exam'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      setError('');
      // tugallanmagan yakuniy sinov — davom ettiriladi
      if (v.open?.items?.length)
        setSession(
          (s) => s || { kind: 'final', run: v.open.id, end: v.open.end, items: v.open.items },
        );
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load, uid]);
  async function start(mode: 'topic' | 'mix' | 'mistakes' | 'final', topic?: string, title = '') {
    if (
      mode === 'final' &&
      !window.confirm(
        L(
          `Yakuniy sinov boshlansinmi? ${view?.final.count} ta savol, ${view?.final.minutes} daqiqa. Vaqt tugasa, javoblar o‘zi topshiriladi.`,
          `Start the final exam? ${view?.final.count} questions, ${view?.final.minutes} minutes. Answers are submitted when time runs out.`,
          `Начать итоговый тест? ${view?.final.count} вопросов, ${view?.final.minutes} минут. По окончании времени ответы отправятся сами.`,
        ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await post<{ mode: string; run?: string; end?: number; items: ExamItem[] }>(
        request,
        {
          op: 'start',
          mode,
          ...(topic ? { topic } : {}),
        },
      );
      setSession(
        mode === 'final'
          ? { kind: 'final', run: r.run!, end: r.end!, items: r.items }
          : { kind: 'practice', mode, title, items: r.items },
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const close = () => {
    setSession(null);
    void load();
  };

  if (error) return <p className="error-state">{error}</p>;
  if (!view) return <div className="skeleton" style={{ height: 260 }} />;
  if (session?.kind === 'practice')
    return <Practice session={session} onClose={close} onRetry={() => void start('mistakes')} />;
  if (session?.kind === 'final') return <Final session={session} onClose={close} />;

  const seen = view.topics.reduce((n, t) => n + t.seen, 0);
  const right = view.topics.reduce((n, t) => n + t.right, 0);
  const best = view.runs.reduce((m, r) => Math.max(m, r.pct), 0);
  const cert = view.runs.find((r) => r.cert);
  const head = (
    <header className="ex-hero">
      <div>
        <span className="eyebrow">
          🎯 {L('IMTIHONGA TAYYORGARLIK', 'EXAM PREP', 'ПОДГОТОВКА К ЭКЗАМЕНУ')}
        </span>
        <h2>
          {L(
            'Yakuniy testga tayyorgarlik',
            'Final exam preparation',
            'Подготовка к итоговому тесту',
          )}
        </h2>
        <p>
          {L(
            `15 mavzu bo‘yicha ${view.total || 450} ta test, xatolar tahlili va yakuniy sinov. ${view.final.pass} % va undan ko‘p to‘plaganlarga QR-kodli sertifikat beriladi.`,
            `${view.total || 450} questions on 15 topics, mistake review and a final exam. Score ${view.final.pass}% or more to get a certificate with a QR code.`,
            `${view.total || 450} вопросов по 15 темам, разбор ошибок и итоговый тест. Набравшим ${view.final.pass}% и больше — сертификат с QR-кодом.`,
          )}
        </p>
      </div>
      <span className="ex-hero-art" aria-hidden="true">
        🎯
      </span>
    </header>
  );

  if (!view.access)
    return (
      <section className="ex-page" aria-label={L('Yakuniy test', 'Final exam', 'Итоговый тест')}>
        {head}
        <div className="panel ex-locked">
          <ul className="ex-perks">
            <li>
              📚 <b>{L('450 ta test', '450 questions', '450 вопросов')}</b>
              <small>
                {L(
                  'Har mavzudan 30 tadan — mavzu bo‘yicha yoki aralash ishlaysiz',
                  '30 per topic — practise by topic or mixed',
                  'По 30 на тему — по темам или вперемешку',
                )}
              </small>
            </li>
            <li>
              🔁 <b>{L('Xatolar tahlili', 'Mistake review', 'Разбор ошибок')}</b>
              <small>
                {L(
                  'Har javobdan keyin to‘g‘risi ko‘rsatiladi, xatolaringiz alohida yig‘iladi',
                  'Each answer is checked at once; your mistakes are collected for practice',
                  'Правильный ответ сразу; ошибки собираются для повторения',
                )}
              </small>
            </li>
            <li>
              🏁{' '}
              <b>
                {L('Yakuniy sinov', 'Final exam', 'Итоговый тест')} · {view.final.count || 45}{' '}
                {L('savol', 'questions', 'вопросов')} · {view.final.minutes}{' '}
                {L('daqiqa', 'min', 'мин')}
              </b>
              <small>
                {L(
                  'Har mavzudan savollar — haqiqiy imtihondagidek',
                  'Questions from every topic — like the real exam',
                  'Вопросы по всем темам — как на настоящем экзамене',
                )}
              </small>
            </li>
            <li>
              🎓 <b>{L('Sertifikat', 'Certificate', 'Сертификат')}</b>
              <small>
                {L(
                  `${view.final.pass} % va undan ko‘p to‘plaganlarga — QR-kod bilan tekshiriladi`,
                  `For ${view.final.pass}% or more — verifiable by QR code`,
                  `За ${view.final.pass}% и больше — проверяется по QR-коду`,
                )}
              </small>
            </li>
          </ul>
          {view.total ? (
            view.signedIn ? (
              <ProductBuy product="yakuniy-test" />
            ) : (
              <Button onClick={() => setLogin(true)}>{L('Kirish', 'Sign in', 'Войти')}</Button>
            )
          ) : (
            <p className="ex-soon">
              ⏳{' '}
              {L(
                'Testlar tez orada yuklanadi — bo‘lim shundan keyin sotuvga chiqadi.',
                'Questions are coming soon — the section goes on sale after that.',
                'Вопросы скоро появятся — после этого раздел станет доступен для покупки.',
              )}
            </p>
          )}
        </div>
        <TopicList view={view} />
      </section>
    );

  return (
    <section className="ex-page" aria-label={L('Yakuniy test', 'Final exam', 'Итоговый тест')}>
      {head}
      {!view.total ? (
        <div className="panel ex-soon-box">
          <span aria-hidden="true">⏳</span>
          <p>
            {view.staff
              ? L(
                  'Savollar hali yuklanmagan. Yuklash: Sayt boshqaruvi → 🎯 Yakuniy test savollari.',
                  'No questions yet. Upload them in Site manager → 🎯 Final exam questions.',
                  'Вопросов пока нет. Загрузка: Управление сайтом → 🎯 Вопросы итогового теста.',
                )
              : L(
                  'Testlar tez orada yuklanadi — bo‘lim sizda ochiq, kutib turing.',
                  'Questions are coming soon — the section is open for you.',
                  'Вопросы скоро появятся — раздел для вас уже открыт.',
                )}
          </p>
        </div>
      ) : (
        <>
          <ul className="mk-tiles ex-tiles">
            <li className="is-violet">
              <small>{L('Ishlangan savollar', 'Questions done', 'Решено вопросов')}</small>
              <b>
                {seen}/{view.total}
              </b>
            </li>
            <li className="is-green">
              <small>{L('To‘g‘ri javoblar', 'Correct', 'Верно')}</small>
              <b>{seen ? Math.round((right / seen) * 100) : 0} %</b>
            </li>
            <li className="is-amber">
              <small>{L('Xatolarim', 'My mistakes', 'Мои ошибки')}</small>
              <b>{view.mistakes}</b>
            </li>
            <li className="is-blue">
              <small>{L('Yakuniy sinovda eng yaxshi', 'Best final score', 'Лучший итог')}</small>
              <b>{view.runs.length ? best + ' %' : '—'}</b>
            </li>
          </ul>
          <div className="ex-actions">
            <button
              type="button"
              className="ex-action is-final"
              disabled={busy}
              onClick={() => void start('final')}
            >
              <span aria-hidden="true">🏁</span>
              <b>{L('Yakuniy sinov', 'Final exam', 'Итоговый тест')}</b>
              <small>
                {view.final.count} {L('savol', 'questions', 'вопросов')} · {view.final.minutes}{' '}
                {L('daqiqa', 'min', 'мин')} · {view.final.pass} % —{' '}
                {L('sertifikat', 'certificate', 'сертификат')}
              </small>
            </button>
            <button
              type="button"
              className="ex-action"
              disabled={busy}
              onClick={() =>
                void start(
                  'mix',
                  undefined,
                  L('Aralash mashq', 'Mixed practice', 'Смешанная практика'),
                )
              }
            >
              <span aria-hidden="true">🔀</span>
              <b>{L('Aralash mashq', 'Mixed practice', 'Смешанная практика')}</b>
              <small>
                {L(
                  'Barcha mavzulardan 30 ta savol',
                  '30 questions from all topics',
                  '30 вопросов по всем темам',
                )}
              </small>
            </button>
            <button
              type="button"
              className="ex-action"
              disabled={busy || !view.mistakes}
              onClick={() =>
                void start('mistakes', undefined, L('Xatolarim', 'My mistakes', 'Мои ошибки'))
              }
            >
              <span aria-hidden="true">🔁</span>
              <b>{L('Xatolar ustida ishlash', 'Work on mistakes', 'Работа над ошибками')}</b>
              <small>
                {view.mistakes
                  ? L(
                      `${view.mistakes} ta savol`,
                      `${view.mistakes} questions`,
                      `${view.mistakes} вопросов`,
                    )
                  : L('Hozircha xato yo‘q', 'No mistakes yet', 'Ошибок пока нет')}
              </small>
            </button>
          </div>
          {cert?.cert && (
            <a className="ex-cert-link" href={'#sertifikat/' + cert.cert}>
              🎓 {L('Sertifikatingiz', 'Your certificate', 'Ваш сертификат')} · {cert.pct} % →
            </a>
          )}
        </>
      )}
      <TopicList
        view={view}
        onPractice={(id, title) => void start('topic', id, title)}
        busy={busy}
      />
      {!!view.runs.length && (
        <section className="panel ex-runs" aria-labelledby="ex-runs-h">
          <h3 id="ex-runs-h">
            🏁 {L('Yakuniy sinovlarim', 'My final exams', 'Мои итоговые тесты')}
          </h3>
          <ul>
            {view.runs.map((r) => (
              <li key={r.id} className={r.passed ? 'is-pass' : ''}>
                <span>{dueText(r.at, lang).date}</span>
                <b>
                  {r.score}/{r.total} · {r.pct} %
                </b>
                {r.cert ? (
                  <a href={'#sertifikat/' + r.cert}>
                    🎓 {L('Sertifikat', 'Certificate', 'Сертификат')}
                  </a>
                ) : (
                  <small>{r.passed ? '✅' : L('o‘tmadi', 'not passed', 'не сдан')}</small>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="muted ex-course-note" data-course={courseId}>
        {L(
          'Savollar mavzular bo‘yicha: natijangiz har javobdan keyin saqlanadi.',
          'Questions are grouped by topic; your progress is saved after every answer.',
          'Вопросы сгруппированы по темам; прогресс сохраняется после каждого ответа.',
        )}
      </p>
    </section>
  );
}

/** Mavzular ro'yxati: savollar soni va (ochiq bo'lsa) natija — xatolar tahlili. */
function TopicList({
  view,
  onPractice,
  busy,
}: {
  view: ExamView;
  onPractice?: (id: string, title: string) => void;
  busy?: boolean;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  return (
    <section className="panel ex-topics" aria-labelledby="ex-topics-h">
      <h3 id="ex-topics-h">📊 {L('Mavzular bo‘yicha', 'By topic', 'По темам')}</h3>
      <ol>
        {view.topics.map((t) => {
          const pct = t.seen ? Math.round((t.right / t.seen) * 100) : 0;
          return (
            <li key={t.id}>
              <span className="ex-topic-n">{t.n}</span>
              <span className="ex-topic-main">
                <b>{t.title}</b>
                <small>
                  {L(`${t.count} ta savol`, `${t.count} questions`, `${t.count} вопросов`)}
                  {view.access && t.seen
                    ? ' · ' +
                      L(
                        `ishlangan ${t.seen}, to‘g‘ri ${pct} %, xato ${t.wrong}`,
                        `done ${t.seen}, correct ${pct}%, wrong ${t.wrong}`,
                        `решено ${t.seen}, верно ${pct}%, ошибок ${t.wrong}`,
                      )
                    : ''}
                </small>
                {view.access && (
                  <span className="ex-bar" aria-hidden="true">
                    <i style={{ width: (t.count ? (t.right / t.count) * 100 : 0) + '%' }} />
                    <i
                      className="is-bad"
                      style={{ width: (t.count ? (t.wrong / t.count) * 100 : 0) + '%' }}
                    />
                  </span>
                )}
              </span>
              {onPractice && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !t.count}
                  onClick={() => onPractice(t.id, t.n + '. ' + t.title)}
                >
                  {L('Mashq', 'Practise', 'Практика')}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Mashq: bitta-bittadan, javob darhol tekshiriladi. */
function Practice({
  session,
  onClose,
  onRetry,
}: {
  session: Extract<Session, { kind: 'practice' }>;
  onClose: () => void;
  onRetry: () => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<number | null>(null);
  const [wrong, setWrong] = useState<ExamItem[]>([]);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const items = session.items;
  const item = items[i];
  const done = i >= items.length;
  async function choose(c: number) {
    if (picked !== null || busy) return;
    setBusy(true);
    setPicked(c);
    try {
      const r = await post<{ ok: boolean; correct: number }>(request, {
        op: 'answer',
        id: item.id,
        choice: c,
      });
      setCorrect(r.correct);
      if (r.ok) setScore((n) => n + 1);
      else setWrong((w) => [...w, item]);
    } catch (e) {
      toast((e as Error).message);
      setPicked(null);
    } finally {
      setBusy(false);
    }
  }
  const next = () => {
    setI((n) => n + 1);
    setPicked(null);
    setCorrect(null);
  };
  if (done)
    return (
      <section className="panel ex-done" aria-live="polite">
        <span className="ex-done-icon" aria-hidden="true">
          {score === items.length ? '🏆' : score / items.length >= 0.6 ? '👏' : '💪'}
        </span>
        <h2>
          {score}/{items.length} · {Math.round((score / items.length) * 100)} %
        </h2>
        <p className="muted">{session.title}</p>
        {!!wrong.length && (
          <div className="ex-wrong">
            <b>🔁 {L('Xato qilgan savollaringiz', 'Questions you missed', 'Вопросы с ошибками')}</b>
            <ol>
              {wrong.map((w) => (
                <li key={w.id}>{w.q}</li>
              ))}
            </ol>
          </div>
        )}
        <div className="ex-row">
          {!!wrong.length && (
            <Button onClick={onRetry}>
              🔁 {L('Xatolarni qayta ishlash', 'Retry mistakes', 'Повторить ошибки')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {L('Bo‘limga qaytish', 'Back', 'Назад')}
          </Button>
        </div>
      </section>
    );
  return (
    <section className="panel ex-run" aria-label={session.title}>
      <header className="ex-run-head">
        <button type="button" className="ex-back" onClick={onClose}>
          ← {L('Chiqish', 'Exit', 'Выйти')}
        </button>
        <b>{session.title}</b>
        <span>
          {i + 1}/{items.length} · ✅ {score}
        </span>
      </header>
      <div className="ex-progress" aria-hidden="true">
        <i style={{ width: ((i + (picked !== null ? 1 : 0)) / items.length) * 100 + '%' }} />
      </div>
      <Question
        item={item}
        picked={picked}
        correct={correct}
        onPick={(c) => void choose(c)}
        number={i + 1}
      />
      {correct !== null && (
        <div className={'ex-feedback ' + (picked === correct ? 'is-ok' : 'is-bad')} role="status">
          {picked === correct
            ? '✅ ' + L('To‘g‘ri!', 'Correct!', 'Верно!')
            : '❌ ' +
              L('To‘g‘ri javob', 'Correct answer', 'Правильный ответ') +
              ': ' +
              LETTER[correct] +
              ') ' +
              item.o[correct]}
          <Button size="sm" onClick={next}>
            {i + 1 < items.length
              ? L('Keyingi →', 'Next →', 'Далее →')
              : L('Natija', 'Result', 'Результат')}
          </Button>
        </div>
      )}
    </section>
  );
}

function Question({
  item,
  picked,
  correct,
  onPick,
  number,
}: {
  item: ExamItem;
  picked: number | null;
  correct: number | null;
  onPick: (c: number) => void;
  number: number;
}) {
  return (
    <fieldset className="ex-q">
      <legend>
        <span className="ex-q-n">{number}</span> {item.q}
      </legend>
      <div className="ex-opts">
        {item.o.map((o, c) => {
          const state =
            correct === null
              ? picked === c
                ? ' is-picked'
                : ''
              : c === correct
                ? ' is-right'
                : picked === c
                  ? ' is-wrong'
                  : '';
          return (
            <button
              key={c}
              type="button"
              className={'ex-opt' + state}
              aria-pressed={picked === c}
              disabled={correct !== null}
              onClick={() => onPick(c)}
            >
              <span className="ex-opt-l">{LETTER[c]}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Yakuniy sinov: hamma savol bir sahifada, vaqt hisoblagichi, oxirida topshiriladi. */
function Final({
  session,
  onClose,
}: {
  session: Extract<Session, { kind: 'final' }>;
  onClose: () => void;
}) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(ANS_KEY(session.run)) || '{}');
    } catch {
      return {};
    }
  });
  const [left, setLeft] = useState(() => Math.max(0, session.end - Date.now()));
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const sent = useRef(false);
  const submit = useCallback(
    async (auto = false) => {
      if (sent.current) return;
      sent.current = true;
      setBusy(true);
      try {
        const r = await post<Result>(request, { op: 'finish', run: session.run, answers });
        setResult(r);
        try {
          sessionStorage.removeItem(ANS_KEY(session.run));
        } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (auto)
          toast(
            L(
              '⏰ Vaqt tugadi — javoblar topshirildi.',
              '⏰ Time is up — answers submitted.',
              '⏰ Время вышло — ответы отправлены.',
            ),
          );
      } catch (e) {
        sent.current = false;
        toast((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, request, session.run],
  );
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      const l = Math.max(0, session.end - Date.now());
      setLeft(l);
      if (l <= 0) void submit(true);
    }, 1000);
    return () => clearInterval(t);
  }, [result, session.end, submit]);
  const pick = (id: string, c: number) => {
    const next = { ...answers, [id]: c };
    setAnswers(next);
    try {
      sessionStorage.setItem(ANS_KEY(session.run), JSON.stringify(next));
    } catch {}
  };
  const count = Object.keys(answers).length;
  const byId = useMemo(() => new Map(session.items.map((x) => [x.id, x])), [session.items]);
  if (result) {
    const wrong = result.review.filter((r) => r.choice !== r.correct);
    return (
      <section
        className={'panel ex-done ' + (result.passed ? 'is-pass' : 'is-fail')}
        aria-live="polite"
      >
        <span className="ex-done-icon" aria-hidden="true">
          {result.passed ? '🎓' : '💪'}
        </span>
        <h2>
          {result.score}/{result.total} · {result.pct} %
        </h2>
        <p>
          {result.passed
            ? L(
                'Tabriklaymiz! Siz yakuniy sinovdan o‘tdingiz va sertifikat oldingiz.',
                'Congratulations! You passed the final exam and earned a certificate.',
                'Поздравляем! Вы сдали итоговый тест и получили сертификат.',
              )
            : L(
                'Bu safar yetmadi — xatolaringiz ustida ishlab, yana urinib ko‘ring.',
                'Not this time — work on your mistakes and try again.',
                'В этот раз не хватило — поработайте над ошибками и попробуйте снова.',
              )}
        </p>
        <div className="ex-row">
          {result.cert && (
            <Button onClick={() => (location.hash = 'sertifikat/' + result.cert)}>
              🎓 {L('Sertifikatni ko‘rish', 'View the certificate', 'Открыть сертификат')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {L('Bo‘limga qaytish', 'Back', 'Назад')}
          </Button>
        </div>
        {!!wrong.length && (
          <div className="ex-wrong">
            <b>🔁 {L('Xatolar tahlili', 'Mistake review', 'Разбор ошибок')}</b>
            <ol>
              {wrong.map((w) => {
                const q = byId.get(w.id);
                if (!q) return null;
                return (
                  <li key={w.id}>
                    <p>{q.q}</p>
                    {w.choice !== null && (
                      <small className="is-bad">
                        ❌ {LETTER[w.choice]}) {q.o[w.choice]}
                      </small>
                    )}
                    <small className="is-ok">
                      ✅ {LETTER[w.correct]}) {q.o[w.correct]}
                    </small>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    );
  }
  const mm = Math.floor(left / 60000),
    ss = Math.floor((left % 60000) / 1000);
  return (
    <section
      className="panel ex-run is-final"
      aria-label={L('Yakuniy sinov', 'Final exam', 'Итоговый тест')}
    >
      <header className="ex-run-head is-sticky">
        <b>🏁 {L('Yakuniy sinov', 'Final exam', 'Итоговый тест')}</b>
        <span
          className={'ex-timer' + (left < 5 * 60000 ? ' is-low' : '')}
          role="timer"
          aria-live="off"
        >
          ⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <span>
          {count}/{session.items.length}
        </span>
      </header>
      {session.items.map((it, n) => (
        <Question
          key={it.id}
          item={it}
          number={n + 1}
          picked={answers[it.id] ?? null}
          correct={null}
          onPick={(c) => pick(it.id, c)}
        />
      ))}
      <div className="ex-row ex-submit">
        <Button
          disabled={busy}
          onClick={() => {
            if (
              count < session.items.length &&
              !window.confirm(
                L(
                  `${session.items.length - count} ta savolga javob bermadingiz. Topshirasizmi?`,
                  `${session.items.length - count} questions are unanswered. Submit anyway?`,
                  `Без ответа: ${session.items.length - count}. Отправить?`,
                ),
              )
            )
              return;
            void submit();
          }}
        >
          ✅ {L('Topshirish', 'Submit', 'Отправить')}
        </Button>
      </div>
    </section>
  );
}

/* ---------- 🎓 sertifikat (#sertifikat/<id>) — hamma uchun ochiq, QR-kod shu sahifaga olib keladi ---------- */
const SITE = 'https://www.tadbirkorlik-asoslari.uz/';
function QR({ text, size = 120 }: { text: string; size?: number }) {
  const svg = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [text]);
  return (
    <span
      className="cert-qr"
      style={{ width: size, height: size }}
      role="img"
      aria-label="QR"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function CertificatePage({ id }: { id: string }) {
  const { lang, request } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [cert, setCert] = useState<ExamCert | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const r = await request('/api/exam?cert=' + encodeURIComponent(id)),
          v = await r.json();
        if (!r.ok) throw new Error(v.error);
        setCert(v);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id, request]);
  useEffect(() => {
    document.body.classList.add('cert-printing');
    return () => document.body.classList.remove('cert-printing');
  }, []);
  if (error)
    return (
      <div className="panel soft-empty">
        <span>🔎</span>
        <p>
          {L(
            'Sertifikat topilmadi yoki o‘chirilgan.',
            'Certificate not found.',
            'Сертификат не найден.',
          )}
        </p>
      </div>
    );
  if (!cert) return <div className="skeleton" style={{ height: 420 }} />;
  const url = SITE + '#sertifikat/' + cert.id;
  // 24.11.2026 (Toshkent vaqti)
  const date = new Date(cert.at + 5 * 3600000)
    .toISOString()
    .slice(0, 10)
    .split('-')
    .reverse()
    .join('.');
  return (
    <>
      <div className="cert-toolbar">
        <span className="cert-valid" role="status">
          ✅ {L('Sertifikat haqiqiy', 'Certificate is valid', 'Сертификат действителен')} · №{' '}
          {cert.id}
        </span>
        <Button onClick={() => window.print()}>
          🖨 {L('Chop etish / PDF', 'Print / PDF', 'Печать / PDF')}
        </Button>
      </div>
      <div className="cert-print-root">
        <article className="cert" aria-label={L('Sertifikat', 'Certificate', 'Сертификат')}>
          <div className="cert-frame">
            <p className="cert-site">www.tadbirkorlik-asoslari.uz</p>
            <h1>SERTIFIKAT</h1>
            <p className="cert-lead">Ushbu sertifikat</p>
            <p className="cert-name">{cert.name}</p>
            {cert.group && <p className="cert-group">{cert.group}</p>}
            <p className="cert-text">
              «{cert.course}» fanidan yakuniy testni muvaffaqiyatli topshirgani uchun berildi.
            </p>
            <p className="cert-score">
              Natija: <b>{cert.score}</b> / {cert.total} · <b>{cert.pct} %</b>
            </p>
            <footer className="cert-foot">
              <div>
                <small>Sana</small>
                <b>{date}</b>
              </div>
              <div>
                <small>Fan o‘qituvchisi</small>
                <b>{cert.teacher || '—'}</b>
              </div>
              <div className="cert-check">
                <QR text={url} size={104} />
                <small>№ {cert.id}</small>
              </div>
            </footer>
            <span className="cert-seal" aria-hidden="true">
              🎓
            </span>
          </div>
        </article>
      </div>
      <p className="muted cert-note">
        {L(
          'QR-kodni skanerlab, sertifikat haqiqiyligini shu sahifada tekshirish mumkin.',
          'Scan the QR code to verify the certificate on this page.',
          'Отсканируйте QR-код, чтобы проверить сертификат на этой странице.',
        )}
      </p>
    </>
  );
}
