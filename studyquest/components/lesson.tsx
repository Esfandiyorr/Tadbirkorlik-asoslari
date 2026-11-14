'use client';
import { ReaderHeading, ReaderControls, useReaderGestures } from './reader-controls';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Expand,
  Check,
  Download,
  Clock,
  Play,
  BookOpen,
  ZoomOut,
  ChartNoAxesColumn,
  Palette,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProgressBar, navigate } from './dashboard';
import { t } from '@/lib/i18n';
import type { Lang, Lesson as LessonType, LessonAccess, Question } from '@/lib/types';
import { AccessChip, PointsBreakdown, PointsRing } from './points-ui';
import {
  accessOf,
  dueText,
  num2,
  slidePoints,
  topicPoints,
  tr,
  type SlidePoints,
} from '@/lib/points';
import { NativeSurface } from './native-surface';
import { TopicVideoButton } from './topic-video';
import { LOGO_TOPIC } from '@/lib/logo-task';
import { CourseGate, useCourseLocked } from './course-gate';
/** Taqdimotning PDF nusxasi: to'liq havola yoki asl fayllar (public/legacy/fayllar). */
const pdfHref = (pdf: string) => (pdf.startsWith('https://') ? pdf : '/legacy/' + pdf);
export function LessonView({ id }: { id: string }) {
  return <OriginalLessonView id={id} />;
}
function OriginalLessonView({ id }: { id: string }) {
  const { data, lang, setLang, dark, call, toast, request } = useApp(),
    courseLocked = useCourseLocked(),
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
  // faol slayd nomi (taqdimotdan) — «ball qatori» test va topshiriq slaydlarini shundan taniydi
  const [slideTitle, setSlideTitle] = useState('');
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
    if (!meta || courseLocked || loaded.current === id) return;
    loaded.current = id;
    setError('');
    if (legacyMode) {
      setDetail(meta);
      return;
    }
    let alive = true;
    (async () => {
      try {
        // Asl taqdimotlar (15 mavzu) Firestore'ga tegmaydi: o'qish tarixi va ballar asl dvigatelda (RTDB)
        // yuritiladi; har slaydga Firestore yozuvi kunlik bepul kvotani tez tugatardi.
        if (data?.limited || meta.legacyFile) {
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
  }, [id, meta?.id, legacyMode, data?.limited, courseLocked, call, request]);
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
      if (!legacyMode && !data?.limited && !meta?.legacyFile)
        call('slide', { lessonId: id, index: e.data.index }).catch((e) => toast(e.message));
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [id, legacyMode, data?.limited, meta?.legacyFile, call, toast]);
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
  const gestures = useReaderGestures(
    index,
    meta?.slideCount || 1,
    !!detail,
    go,
    !!meta?.legacyFile,
  );
  async function complete() {
    setBusy(true);
    try {
      await call('completeLesson', { lessonId: id });
      toast(
        lang === 'uz'
          ? '✅ Dars yakunlandi'
          : lang === 'ru'
            ? '✅ Урок завершён'
            : '✅ Lesson completed',
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
        {lang === 'uz' ? 'Dars topilmadi' : lang === 'ru' ? 'Урок не найден' : 'Lesson not found'}
        <Button onClick={() => navigate('courses')}>{t(lang, 'courses')}</Button>
      </div>
    );
  // 🔑 talaba bo'lmagan foydalanuvchida obuna ham, ruxsat ham yo'q — dars o'rniga «obuna bo'ling / ruxsat so'rang»
  if (courseLocked)
    return (
      <section className="focus-reader course-gate-page" aria-label={meta.title}>
        <header className="reader-toolbar">
          <Button
            variant="ghost"
            size="icon"
            aria-label={tr(lang, 'Kursga qaytish', 'Back to course', 'Назад к курсу')}
            onClick={() => navigate('course/' + meta.courseId)}
          >
            <ArrowLeft size={18} />
          </Button>
          <ReaderHeading
            title={meta.title}
            topic={Number(id.slice(1)) || meta.order + 1}
            total={data!.lessons.filter((l) => l.courseId === meta.courseId).length}
          />
        </header>
        <CourseGate />
      </section>
    );
  const lesson = detail || meta,
    related = data!.quizzes.filter((q) => q.lessonId === id),
    history = data?.user?.readingHistory?.[id],
    access = accessOf(data!, id);
  return (
    <section className="focus-reader" ref={viewer} aria-label={meta.title}>
      <header className="reader-toolbar">
        <Button
          variant="ghost"
          size="icon"
          aria-label={tr(lang, 'Kursga qaytish', 'Back to course', 'Назад к курсу')}
          onClick={() => navigate('course/' + meta.courseId)}
        >
          <ArrowLeft size={18} />
        </Button>
        <ReaderHeading
          title={meta.title}
          topic={Number(id.slice(1)) || meta.order + 1}
          total={data!.lessons.filter((l) => l.courseId === meta.courseId).length}
        />
        <select
          className="reader-language"
          aria-label={tr(lang, 'Til', 'Language', 'Язык')}
          value={lang}
          onChange={(e) => setLang(e.target.value as 'uz' | 'en' | 'ru')}
        >
          <option value="uz">UZ</option>
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>
        <TopicVideoButton id={id} />
        {lesson.legacyPdf && (data?.user?.role === 'teacher' || data?.user?.role === 'admin') && (
          // 📥 O'qituvchi va administrator taqdimotning PDF nusxasini bir bosishda yuklab oladi.
          <Button
            variant="outline"
            className="reader-video-button"
            asChild
            title={tr(
              lang,
              'Taqdimotni PDF qilib yuklab olish',
              'Download the presentation as PDF',
              'Скачать презентацию в PDF',
            )}
          >
            <a href={pdfHref(lesson.legacyPdf)} download>
              <Download size={17} />
              <span>PDF</span>
            </a>
          </Button>
        )}
        {id === LOGO_TOPIC && (
          <Button
            variant="outline"
            className="reader-task-button"
            aria-label={tr(lang, 'Logotip topshirig‘i', 'Logo assignment', 'Задание «Логотип»')}
            onClick={() => navigate('topshiriq/' + id)}
          >
            <Palette size={17} />
            <span>{tr(lang, 'Topshiriq', 'Assignment', 'Задание')}</span>
          </Button>
        )}
        {lesson.legacyFile && (
          <Button
            variant={fit ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={
              lang === 'uz'
                ? 'Slaydni ekranga sig‘dirish'
                : lang === 'ru'
                  ? 'Вместить слайд'
                  : 'Fit slide'
            }
            aria-pressed={fit}
            title={
              lang === 'uz'
                ? 'Slaydni ekranga sig‘dirish'
                : lang === 'ru'
                  ? 'Вместить слайд'
                  : 'Fit slide'
            }
            onClick={() => setFit(!fit)}
          >
            <ZoomOut size={18} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            lang === 'uz' ? 'To‘liq ekran' : lang === 'ru' ? 'Во весь экран' : 'Fullscreen'
          }
          title={lang === 'uz' ? 'To‘liq ekran' : lang === 'ru' ? 'Во весь экран' : 'Fullscreen'}
          onClick={() => {
            const action = document.fullscreenElement
              ? document.exitFullscreen()
              : viewer.current?.requestFullscreen();
            action?.catch(() =>
              toast(
                tr(
                  lang,
                  'To‘liq ekran mavjud emas',
                  'Fullscreen unavailable',
                  'Полный экран недоступен',
                ),
              ),
            );
          }}
        >
          <Expand size={18} />
        </Button>
        <Button
          variant={details ? 'secondary' : 'outline'}
          className="reader-results-button"
          aria-label={lang === 'uz' ? 'Mening ballim' : lang === 'ru' ? 'Мои баллы' : 'My points'}
          aria-expanded={details}
          onClick={() => setDetails(!details)}
        >
          <ChartNoAxesColumn size={17} />
          <span>{lang === 'uz' ? 'Ballim' : lang === 'ru' ? 'Баллы' : 'Points'}</span>
        </Button>
      </header>
      <ProgressBar value={((index + 1) / meta.slideCount) * 100} />
      {error ? (
        <div role="alert" className="error-state">
          {error}
        </div>
      ) : !detail ? (
        <div
          className="skeleton reader-loading"
          aria-label={tr(lang, 'Dars yuklanmoqda', 'Loading lesson', 'Загрузка урока')}
        />
      ) : (
        <div
          {...gestures}
          className={
            'presentation-viewer reader-viewer colorful-reader ' +
            (lesson.legacyFile ? 'native-viewer' : '')
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
              onTitle={setSlideTitle}
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
      {lesson.legacyFile && detail && !error && (
        <ReaderPoints
          sp={slidePoints(id, slideTitle, meta.slideCount)}
          mode={access?.state}
          lang={lang}
          openTask={() => navigate('topshiriq/' + id)}
        />
      )}
      <ReaderControls index={index} count={meta.slideCount} ready={!!detail && !error} go={go} />
      {details && (
        <aside className="reader-details panel">
          <div className="reader-details-head">
            <h2>
              🎯 {tr(lang, 'Mening ballim', 'My points', 'Мои баллы')}
              <small>
                {(Number(id.slice(1)) || meta.order + 1) + '-' + tr(lang, 'mavzu', 'topic', 'тема')}
              </small>
            </h2>
            <AccessChip access={access} lang={lang} />
          </div>
          {access?.state === 'score' && access.due && (
            <p className={'sidebar-due' + (dueText(access.due, lang).urgent ? ' urgent' : '')}>
              <Clock size={15} />
              <span>
                {tr(lang, 'Ball beriladi', 'Points until', 'Баллы до')}:{' '}
                <b>{dueText(access.due, lang).date}</b>
                <em>{dueText(access.due, lang).left}</em>
              </span>
            </p>
          )}
          {access?.state === 'read' && (
            <p className="muted">
              {tr(
                lang,
                'Bu mavzu o‘qish rejimida: o‘qishingiz mumkin, lekin yangi ball qo‘shilmaydi.',
                'This topic is in reading mode: you can read it, but no new points are added.',
                'Тема в режиме чтения: читать можно, новые баллы не начисляются.',
              )}
            </p>
          )}
          {history ? (
            <div className="reader-points">
              <PointsRing value={topicPoints(history).total} size={84} />
              <PointsBreakdown history={history} lang={lang} hints />
            </div>
          ) : (
            <p className="muted">
              {id === LOGO_TOPIC
                ? tr(
                    lang,
                    'Bu mavzu 100 ball: 30 — barcha slaydlarni ochish, 20 — 1 soat o‘qish, 25 — yakuniy test, 25 — 🎨 logotip topshirig‘i (o‘qituvchi baholaydi).',
                    'This topic is worth 100: 30 for every slide, 20 for one hour of reading, 25 for the final test, 25 for the 🎨 logo assignment (graded by the teacher).',
                    'Тема — 100 баллов: 30 за слайды, 20 за час чтения, 25 за тест, 25 за 🎨 логотип (оценивает преподаватель).',
                  )
                : tr(
                    lang,
                    'Har mavzu 100 ball: 30 — barcha slaydlarni ochish, 20 — 1 soat o‘qish, 50 — yakuniy test.',
                    'Each topic is worth 100: 30 for opening every slide, 20 for one hour of reading, 50 for the final test.',
                    'Каждая тема — 100 баллов: 30 за все слайды, 20 за час чтения, 50 за итоговый тест.',
                  )}
            </p>
          )}
          {!legacyMode && !data?.limited && (
            <Button disabled={busy || progress?.completed} onClick={complete}>
              <Check size={16} />
              {progress?.completed
                ? tr(lang, 'Yakunlangan', 'Completed', 'Завершено')
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
                href={pdfHref(lesson.legacyPdf)}
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
    return (
      <div className="empty-state">
        {lang === 'uz' ? 'Test topilmadi' : lang === 'ru' ? 'Тест не найден' : 'Quiz not found'}
      </div>
    );
  return (
    <div className="quiz-layout">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {tr(lang, 'BILIMNI TEKSHIRISH', 'KNOWLEDGE CHECK', 'ПРОВЕРКА ЗНАНИЙ')}
          </span>
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
            {result.correct} / {result.total}
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
            {q.passingScore}% · {q.attempts}{' '}
            {lang === 'uz' ? 'urinish' : lang === 'ru' ? 'попыток' : 'attempts'}
          </p>
          <p className="muted">
            {lang === 'uz'
              ? 'Javoblar serverda tekshiriladi.'
              : lang === 'en'
                ? 'Answers are graded on the server.'
                : 'Ответы проверяются сервером.'}
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

/** 🎯 Ball qatori: hozirgi slayd (test, topshiriq) qancha ball berishi doim ko'rinib turadi. */
function ReaderPoints({
  sp,
  mode,
  lang,
  openTask,
}: {
  sp: SlidePoints;
  mode?: LessonAccess['state'];
  lang: Lang;
  openTask: () => void;
}) {
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  if (mode === 'read' || mode === 'locked')
    return (
      <p className="reader-points is-read" role="note">
        📖{' '}
        {L(
          'O‘qish rejimi — bu mavzuda endi ball berilmaydi.',
          'Reading mode — this topic no longer gives points.',
          'Режим чтения — баллы по этой теме больше не начисляются.',
        )}
      </p>
    );
  const ball = L('ball', 'pts', 'б.');
  const testName =
    sp.testKind === 'crossword'
      ? L('Krossvord', 'Crossword', 'Кроссворд')
      : sp.testKind === 'tasks'
        ? L('Masalalar', 'Problems', 'Задачи')
        : L('Test', 'Test', 'Тест');
  const unit =
    sp.testKind === 'crossword'
      ? L('har topilgan so‘z', 'each word found', 'каждое слово')
      : sp.testKind === 'tasks'
        ? L('har yechilgan masala', 'each problem solved', 'каждая задача')
        : L('har to‘g‘ri javob', 'each correct answer', 'каждый верный ответ');
  return (
    <div
      className={'reader-points is-' + sp.kind}
      role="note"
      aria-label={L('Ballar', 'Points', 'Баллы')}
    >
      {sp.kind === 'test' ? (
        <b className="rp-main">
          🧪 {testName}: {sp.test} {ball} · {unit} +{num2(sp.perAnswer)}
        </b>
      ) : sp.kind === 'task' ? (
        <b className="rp-main">
          🎨 {L('Logotip topshirig‘i', 'Logo assignment', 'Задание «Логотип»')}: {sp.task} {ball} ·{' '}
          {L('o‘qituvchi baholaydi', 'graded by the teacher', 'оценивает преподаватель')}
          <button type="button" onClick={openTask}>
            {L('Ochish →', 'Open →', 'Открыть →')}
          </button>
        </b>
      ) : (
        <b className="rp-main">
          📑 {L('Bu slayd', 'This slide', 'Этот слайд')}: +{num2(sp.slide)} {ball}
        </b>
      )}
      <span className="rp-all">
        <span>📑 {L('slaydlar', 'slides', 'слайды')} 30</span>
        <span>⏱ {L('1 soat o‘qish', '1 hour reading', '1 час чтения')} 20</span>
        <span>
          🧪 {testName.toLowerCase()} {sp.test}
        </span>
        {sp.task > 0 && (
          <span>
            🎨 {L('logotip', 'logo', 'логотип')} {sp.task}
          </span>
        )}
        <span>= 100</span>
      </span>
    </div>
  );
}
