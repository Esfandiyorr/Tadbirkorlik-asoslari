'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  Check,
  Download,
  Clock,
  Play,
  BookOpen,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProgressBar, navigate } from './dashboard';
import { t } from '@/lib/i18n';
import type { Lesson as LessonType, Question } from '@/lib/types';
export function LessonView({ id }: { id: string }) {
  const { data, lang, call, toast, request } = useApp(),
    meta = data!.lessons.find((x) => x.id === id),
    [detail, setDetail] = useState<LessonType | null>(null),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    frame = useRef<HTMLIFrameElement>(null),
    viewer = useRef<HTMLDivElement>(null),
    loaded = useRef('');
  const progress = data?.progress?.find((p) => p.lessonId === id),
    legacyMode = data?.mode === 'legacy',
    initialPosition = useRef(progress?.last || 0);
  useEffect(() => {
    if (!meta || loaded.current === id) return;
    loaded.current = id;
    setError('');
    if (legacyMode) {
      setDetail(meta);
      return;
    }
    let alive = true;
    (async () => {
      try {
        await call('enroll', { courseId: meta.courseId });
        const lesson = await call<LessonType>('getLesson', { lessonId: id });
        const r = await call<{ progress: { last: number } }>('beginLesson', { lessonId: id });
        if (alive) {
          setDetail(lesson);
          setIndex(r.progress.last);
          if (!lesson.legacyFile) await call('slide', { lessonId: id, index: r.progress.last });
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
      loaded.current = '';
    };
  }, [id, meta?.id, legacyMode, call]);
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow ||
        e.data?.source !== 'studyquest-legacy' ||
        e.data.type !== 'slide' ||
        e.data.topic !== id ||
        !Number.isInteger(e.data.index)
      )
        return;
      setIndex(e.data.index);
      if (!legacyMode)
        call('slide', { lessonId: id, index: e.data.index }).catch((e) => toast(e.message));
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [id, legacyMode, call, toast]);
  async function go(n: number) {
    if (!detail || n < 0 || n >= detail.slideCount) return;
    setIndex(n);
    try {
      await call('slide', { lessonId: id, index: n });
    } catch (e) {
      toast((e as Error).message);
    }
  }
  async function complete() {
    setBusy(true);
    try {
      const r = await call<{ reward: { points: number } }>('completeLesson', { lessonId: id });
      toast(
        r.reward.points
          ? `+${r.reward.points} XP`
          : lang === 'uz'
            ? 'Dars yakunlangan'
            : 'Lesson completed',
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function material() {
    if (!detail?.materialId) return;
    try {
      const r = await request('/api/material?id=' + detail.materialId);
      if (!r.ok) throw new Error((await r.json()).error);
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement('a');
      a.href = url;
      a.download = detail.title + '.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast((e as Error).message);
    }
  }
  if (!meta)
    return (
      <div className="empty-state">
        {lang === 'uz' ? 'Dars topilmadi' : 'Lesson not found'}
        <Button onClick={() => navigate('courses')}>{t(lang, 'courses')}</Button>
      </div>
    );
  if (!detail && !legacyMode && !error)
    return (
      <div className="panel editor">
        <h1>{meta.title}</h1>
        <div className="skeleton h-64" aria-label="Loading lesson" />
      </div>
    );
  const lesson = detail || meta,
    related = data!.quizzes.filter((q) => q.lessonId === id);
  return (
    <>
      <div className="lesson-toolbar">
        <Button variant="ghost" onClick={() => navigate('course/' + meta.courseId)}>
          <ArrowLeft size={17} />
          {t(lang, 'courses')}
        </Button>
        <span>{legacyMode ? '' : `${progress?.seen.length || 0} / ${meta.slideCount}`}</span>
        <Button
          variant="outline"
          onClick={() =>
            viewer.current?.requestFullscreen().catch(() => toast('Fullscreen unavailable'))
          }
        >
          <Expand size={16} />
          <span className="desktop-label">Fullscreen</span>
        </Button>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {data!.modules.find((m) => m.id === meta.moduleId)?.title}
          </span>
          <h1>{meta.title}</h1>
        </div>
      </div>
      {error ? (
        <div role="alert" className="error-state">
          {error}
          <Button onClick={() => navigate('courses')}>{t(lang, 'courses')}</Button>
        </div>
      ) : (
        <>
          <div
            ref={viewer}
            className={'presentation-viewer ' + (lesson.legacyFile ? 'legacy-viewer' : '')}
          >
            {lesson.legacyFile ? (
              <iframe
                ref={frame}
                title={lesson.title}
                src={
                  '/legacy/' +
                  lesson.legacyFile +
                  (data?.mode === 'demo' ? '?sqDemo=1' : '') +
                  '#' +
                  (initialPosition.current + 1)
                }
                allowFullScreen
              />
            ) : (
              <>
                <div className="slide-content">
                  <span className="slide-number">
                    {index + 1} / {lesson.slideCount}
                  </span>
                  <h2>{lesson.slides[index]?.title}</h2>
                  <p>{lesson.slides[index]?.body}</p>
                </div>
                <div className="slide-controls">
                  <Button variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
                    <ArrowLeft size={17} />
                  </Button>
                  <ProgressBar value={((index + 1) / lesson.slideCount) * 100} />
                  <Button disabled={index >= lesson.slideCount - 1} onClick={() => go(index + 1)}>
                    <ArrowRight size={17} />
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="lesson-footer panel">
            <div>
              <Clock size={18} />
              <p>
                {lang === 'uz'
                  ? 'Yakunlash uchun kamida 80% slaydni o‘qing. O‘qish vaqti serverda tekshiriladi.'
                  : lang === 'en'
                    ? 'Read at least 80% of the slides. Reading time is checked by the server.'
                    : 'Прочитайте не менее 80% слайдов. Время проверяется сервером.'}
              </p>
            </div>
            {!legacyMode && (
              <Button disabled={busy || progress?.completed} onClick={complete}>
                <Check size={16} />
                {progress?.completed
                  ? lang === 'uz'
                    ? 'Yakunlangan'
                    : 'Completed'
                  : t(lang, 'complete')}
              </Button>
            )}
            {lesson.materialId && (
              <Button variant="outline" onClick={material}>
                <Download size={16} />
                PDF
              </Button>
            )}
          </div>
          {legacyMode && (
            <p className="muted">
              {lang === 'uz'
                ? 'Asl taqdimot va hisobingiz avvalgidek ishlaydi. Yangi XP xizmati hali yoqilmagan.'
                : lang === 'en'
                  ? 'Your original presentation and account work as before. The new XP service is not enabled yet.'
                  : 'Исходная презентация и аккаунт работают как раньше. Новый сервис XP пока не включён.'}
            </p>
          )}
          {!legacyMode &&
            related.map((q) => (
              <button
                className="quiz-prompt panel"
                key={q.id}
                onClick={() => navigate('quiz/' + q.id)}
              >
                <BookOpen />
                <div>
                  <h3>{q.title}</h3>
                  <p>
                    {q.timeLimit / 60} min · {q.attempts}{' '}
                    {lang === 'en' ? 'attempts' : lang === 'ru' ? 'попытки' : 'urinish'}
                  </p>
                </div>
                <Play size={20} />
              </button>
            ))}
        </>
      )}
    </>
  );
}
export function QuizView({ id }: { id: string }) {
  const { data, lang, call, toast } = useApp(),
    q = data!.quizzes.find((x) => x.id === id),
    [questions, setQuestions] = useState<Question[]>([]),
    [attempt, setAttempt] = useState(''),
    [answers, setAnswers] = useState<Record<string, unknown>>({}),
    [deadline, setDeadline] = useState(0),
    [left, setLeft] = useState(0),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<any>(null),
    submitted = useRef(false);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(seconds);
      if (!seconds && !submitted.current) {
        submitted.current = true;
        void submit();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, answers]);
  async function start() {
    setBusy(true);
    try {
      const lesson = data!.lessons.find((l) => l.id === q?.lessonId);
      if (lesson) await call('enroll', { courseId: lesson.courseId });
      const r = await call<any>('beginQuiz', { quizId: id });
      setQuestions(r.questions);
      setAttempt(r.attempt.id);
      setDeadline(r.attempt.startedAt + r.timeLimit * 1000);
      setAnswers({});
      setResult(null);
      submitted.current = false;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await call('submitQuiz', { attemptId: attempt, answers });
      setResult(r);
      setDeadline(0);
      submitted.current = true;
    } catch (e) {
      toast((e as Error).message);
      if (Date.now() >= deadline) {
        setDeadline(0);
        setResult({
          score: 0,
          correct: 0,
          total: questions.length,
          points: 0,
          feedback: [],
          expired: true,
        });
      } else submitted.current = false;
    } finally {
      setBusy(false);
    }
  }
  if (!q)
    return <div className="empty-state">{lang === 'uz' ? 'Test topilmadi' : 'Quiz not found'}</div>;
  return (
    <div className="quiz-layout">
      <div className="page-heading">
        <div>
          <span className="eyebrow">KNOWLEDGE CHECK</span>
          <h1>{q.title}</h1>
        </div>
        {deadline > 0 && (
          <div role="timer" className={'quiz-clock ' + (left < 30 ? 'urgent' : '')}>
            <Clock size={17} />
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      {result ? (
        <div className="quiz-result panel">
          <TrophyResult />
          <h2>{result.score}%</h2>
          <p>
            {result.correct} / {result.total} · +{result.points} XP
          </p>
          {result.feedback.map((f: any, i: number) => (
            <div className="answer-feedback" key={f.id}>
              <b>
                {i + 1}. {f.correct ? '✓' : '✕'}
              </b>
              <p>{f.explanation}</p>
            </div>
          ))}
          <Button onClick={start} disabled={busy}>
            {lang === 'uz' ? 'Qayta urinish' : lang === 'en' ? 'Try again' : 'Ещё раз'}
          </Button>
        </div>
      ) : !attempt ? (
        <div className="quiz-start panel">
          <BookOpen size={46} />
          <h2>{t(lang, 'quiz')}</h2>
          <p>
            {q.timeLimit / 60} min ·{' '}
            {lang === 'uz' ? 'O‘tish bali' : lang === 'en' ? 'Passing score' : 'Проходной балл'}:{' '}
            {q.passingScore}% · {q.attempts} {lang === 'uz' ? 'urinish' : 'attempts'}
          </p>
          <p className="muted">
            {lang === 'uz'
              ? 'Javoblar serverda tekshiriladi. Takroriy muvaffaqiyat uchun XP qayta berilmaydi.'
              : lang === 'en'
                ? 'Answers are graded on the server. Repeating a reward never earns duplicate XP.'
                : 'Ответы проверяются сервером. Повторные награды не дают лишних XP.'}
          </p>
          <Button onClick={start} disabled={busy}>
            {t(lang, 'begin')}
            <Play size={16} />
          </Button>
        </div>
      ) : (
        <>
          <div className="questions">
            {questions.map((x, i) => (
              <div className="question-card panel" key={x.id}>
                <span className="eyebrow">
                  {i + 1} / {questions.length}
                </span>
                <h3>{x.prompt}</h3>
                {x.type === 'choice' &&
                  x.options?.map((o) => (
                    <label
                      className={'answer-option ' + (answers[x.id] === o ? 'selected' : '')}
                      key={o}
                    >
                      <input
                        type="radio"
                        name={x.id}
                        checked={answers[x.id] === o}
                        onChange={() => setAnswers({ ...answers, [x.id]: o })}
                      />
                      {o}
                    </label>
                  ))}
                {x.type === 'boolean' &&
                  [true, false].map((v) => (
                    <label className="answer-option" key={String(v)}>
                      <input
                        type="radio"
                        name={x.id}
                        checked={answers[x.id] === v}
                        onChange={() => setAnswers({ ...answers, [x.id]: v })}
                      />
                      {v
                        ? lang === 'uz'
                          ? 'To‘g‘ri'
                          : lang === 'ru'
                            ? 'Верно'
                            : 'True'
                        : lang === 'uz'
                          ? 'Noto‘g‘ri'
                          : lang === 'ru'
                            ? 'Неверно'
                            : 'False'}
                    </label>
                  ))}
                {x.type === 'short' && (
                  <input
                    className="input"
                    aria-label={x.prompt}
                    value={String(answers[x.id] || '')}
                    onChange={(e) => setAnswers({ ...answers, [x.id]: e.target.value })}
                  />
                )}{' '}
                {x.type === 'matching' &&
                  x.pairs?.map((pair) => (
                    <label className="matching-row" key={pair}>
                      {pair}
                      <select
                        className="input"
                        value={(answers[x.id] as Record<string, string>)?.[pair] || ''}
                        onChange={(e) =>
                          setAnswers({
                            ...answers,
                            [x.id]: {
                              ...((answers[x.id] as object) || {}),
                              [pair]: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="">—</option>
                        {x.options?.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  ))}
              </div>
            ))}
          </div>
          <Button disabled={busy} onClick={submit}>
            {lang === 'uz'
              ? 'Javoblarni topshirish'
              : lang === 'en'
                ? 'Submit answers'
                : 'Отправить ответы'}
            <Check size={17} />
          </Button>
        </>
      )}
      {!!data?.attempts?.filter((a) => a.quizId === id && a.submittedAt).length && (
        <section className="panel attempt-history">
          <h3>
            {lang === 'uz'
              ? 'Urinishlar tarixi'
              : lang === 'en'
                ? 'Attempt history'
                : 'История попыток'}
          </h3>
          {data.attempts
            .filter((a) => a.quizId === id && a.submittedAt)
            .map((a) => (
              <p key={a.id}>
                {new Date(a.submittedAt!).toLocaleString(lang, { timeZone: 'Asia/Tashkent' })}
                <b>{a.score}%</b>
              </p>
            ))}
        </section>
      )}
    </div>
  );
}
function TrophyResult() {
  return <div className="result-icon">✦</div>;
}
