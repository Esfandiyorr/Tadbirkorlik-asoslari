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
  Minimize,
  Info,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProgressBar, navigate } from './dashboard';
import { t } from '@/lib/i18n';
import type { Lesson as LessonType, Question } from '@/lib/types';
import { NativeSurface } from './native-surface';
export function LessonView({ id }: { id: string }) {
  const { data, lang, setLang, dark, call, toast, request } = useApp(),
    meta = data!.lessons.find((x) => x.id === id),
    [detail, setDetail] = useState<LessonType | null>(null),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fit, setFit] = useState(false),
    [details, setDetails] = useState(false),
    frame = useRef<HTMLIFrameElement>(null),
    viewer = useRef<HTMLDivElement>(null),
    loaded = useRef('');
  const progress = data?.progress?.find((p) => p.lessonId === id),
    legacyMode = data?.mode === 'legacy',
    initialPosition = useRef(progress?.last ?? data?.user?.readingHistory?.[id]?.lastSlide ?? 0);
  useEffect(() => {
    setFit(false);
  }, []);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { source: 'studyquest-parent', type: 'fit', value: fit },
      location.origin,
    );
    frame.current?.contentWindow?.postMessage(
      { source: 'studyquest-parent', type: 'theme', dark },
      location.origin,
    );
  }, [fit, dark, detail]);
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
        if (data?.limited) {
          const response = await request(
            '/api/platform?view=legacyLesson&lesson=' + encodeURIComponent(id),
          );
          const original = await response.json();
          if (!response.ok) throw new Error(original.error);
          if (alive) setDetail(original);
          return;
        }
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
  }, [id, meta?.id, legacyMode, data?.limited, call, request]);
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
      if (!legacyMode && !data?.limited)
        call('slide', { lessonId: id, index: e.data.index }).catch((e) => toast(e.message));
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [id, legacyMode, data?.limited, call, toast]);
  async function go(n: number) {
    if (!detail || n < 0 || n >= detail.slideCount) return;
    if (detail.legacyFile) {
      frame.current?.contentWindow?.postMessage(
        { source: 'studyquest-parent', type: 'navigate', index: n },
        location.origin,
      );
      return;
    }
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
  const lesson = detail || meta,
    related = data!.quizzes.filter((q) => q.lessonId === id);
  return (
    <section className="focus-reader" ref={viewer} aria-label={meta.title}>
      <header className="reader-toolbar">
        <Button
          variant="ghost"
          size="icon"
          aria-label={lang === 'uz' ? 'Kursga qaytish' : 'Back to course'}
          onClick={() => navigate('course/' + meta.courseId)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 title={meta.title}>{meta.title}</h1>
        <select
          className="reader-language"
          aria-label="Dars tili"
          value={lang}
          onChange={(e) => setLang(e.target.value as 'uz' | 'en' | 'ru')}
        >
          <option value="uz">UZ</option>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>
        <div className="reader-navigation">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous slide"
            disabled={!detail || index === 0}
            onClick={() => go(index - 1)}
          >
            <ArrowLeft size={17} />
          </Button>
          <span aria-live="polite">
            {index + 1} / {meta.slideCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next slide"
            disabled={!detail || index >= meta.slideCount - 1}
            onClick={() => go(index + 1)}
          >
            <ArrowRight size={17} />
          </Button>
        </div>
        {lesson.legacyFile && (
          <Button
            variant={fit ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Fit slide"
            aria-pressed={fit}
            title={lang === 'uz' ? 'Slaydni ekranga sig‘dirish' : 'Fit slide'}
            onClick={() => setFit(!fit)}
          >
            <Minimize size={17} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fullscreen"
          onClick={() => {
            const action = document.fullscreenElement
              ? document.exitFullscreen()
              : viewer.current?.requestFullscreen();
            action?.catch(() => toast('Fullscreen unavailable'));
          }}
        >
          <Expand size={18} />
        </Button>
        <Button
          variant={details ? 'secondary' : 'ghost'}
          size="icon"
          aria-label={lang === 'uz' ? 'Dars natijalari' : 'Lesson results'}
          aria-expanded={details}
          onClick={() => setDetails(!details)}
        >
          <Info size={18} />
        </Button>
      </header>
      <ProgressBar value={((index + 1) / meta.slideCount) * 100} />
      {error ? (
        <div role="alert" className="error-state">
          {error}
        </div>
      ) : !detail ? (
        <div className="skeleton reader-loading" aria-label="Loading lesson" />
      ) : (
        <div
          className={
            'presentation-viewer reader-viewer ' + (lesson.legacyFile ? 'native-viewer' : '')
          }
        >
          {lesson.legacyFile ? (
            <NativeSurface
              ref={frame}
              fit={fit}
              title={lesson.title}
              src={
                '/legacy/' +
                lesson.legacyFile +
                '?sqEmbed=lesson' +
                (data?.mode === 'demo' ? '&sqDemo=1' : '') +
                '#' +
                (initialPosition.current + 1)
              }
              onLoad={() => {
                frame.current?.contentWindow?.postMessage(
                  { source: 'studyquest-parent', type: 'fit', value: fit },
                  location.origin,
                );
                frame.current?.contentWindow?.postMessage(
                  { source: 'studyquest-parent', type: 'theme', dark },
                  location.origin,
                );
              }}
            />
          ) : (
            <div className="slide-content">
              <span className="slide-number">
                {index + 1} / {lesson.slideCount}
              </span>
              <h2>{lesson.slides[index]?.title}</h2>
              <p>{lesson.slides[index]?.body}</p>
            </div>
          )}
        </div>
      )}
      {details && (
        <aside className="reader-details panel">
          <h2>{lang === 'uz' ? 'Dars natijalari' : 'Lesson results'}</h2>
          <p>
            {lang === 'uz'
              ? 'Yakunlash uchun kamida 80% slaydni o‘qing. O‘qish vaqti hisobga olinadi.'
              : 'Read at least 80% of the slides and meet the reading time.'}
          </p>
          {!legacyMode && !data?.limited && (
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
          {lesson.legacyPdf && (
            <Button variant="outline" asChild>
              <a
                href={
                  lesson.legacyPdf.startsWith('https://')
                    ? lesson.legacyPdf
                    : '/legacy/' + lesson.legacyPdf
                }
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download size={16} />
                PDF
              </a>
            </Button>
          )}
          {related.map((q) => (
            <Button key={q.id} variant="outline" onClick={() => navigate('quiz/' + q.id)}>
              <BookOpen size={17} />
              {q.title}
            </Button>
          ))}
        </aside>
      )}
    </section>
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
