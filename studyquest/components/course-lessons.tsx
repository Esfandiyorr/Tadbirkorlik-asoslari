'use client';
import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Lock } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { TopicArt } from './topic-art';
import { AccessChip, PointsBreakdown, PointsRing } from './points-ui';
import { usePaidLocked } from './course-gate';
import { accessOf, dueText, num, topicPoints, tr } from '@/lib/points';
import type { Course, Data, Lesson, Module } from '@/lib/types';

type Status = 'all' | 'started' | 'read' | 'locked';
export function CourseLessons({
  data,
  course,
  modules,
  lessons,
  open,
}: {
  data: Data;
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  open: (l: Lesson) => unknown;
}) {
  const { lang } = useApp(),
    paidLock = usePaidLocked(course.id),
    [moduleId, setModule] = useState(''),
    [status, setStatus] = useState<Status>('all'),
    [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const history = data.user?.readingHistory || {};
  const state = (l: Lesson): Status => {
    if (l.draft || paidLock || accessOf(data, l.id)?.state === 'locked') return 'locked';
    if (
      history[l.id]?.status === 'read' ||
      data.progress?.some((p) => p.lessonId === l.id && p.completed)
    )
      return 'read';
    if (history[l.id]?.status === 'started' || data.progress?.some((p) => p.lessonId === l.id))
      return 'started';
    return 'all';
  };
  const current =
    lessons.find((l) => accessOf(data, l.id)?.state === 'score') ||
    lessons.find((l) => state(l) === 'started') ||
    lessons[0];
  useEffect(() => {
    const screen = matchMedia('(max-width: 640px)');
    const reset = () =>
      setExpanded(
        Object.fromEntries(
          modules.map((m, i) => [m.id, !screen.matches || i === 0 || m.id === current?.moduleId]),
        ),
      );
    reset();
    screen.addEventListener('change', reset);
    return () => screen.removeEventListener('change', reset);
  }, [course.id, modules.map((m) => m.id).join('|'), current?.moduleId]);
  const options: [Status, string, string, string][] = [
    ['all', 'Barcha holatlar', 'All statuses', 'Все статусы'],
    ['started', 'Davom etmoqda', 'In progress', 'В процессе'],
    ['read', 'Tugallangan', 'Completed', 'Завершено'],
    ['locked', 'Ochilish kutilmoqda', 'Awaiting access', 'Ожидает открытия'],
  ];
  const selected = lessons.filter(
    (l) => (!moduleId || l.moduleId === moduleId) && (status === 'all' || state(l) === status),
  );
  const groups = modules.length
    ? modules
    : [{ id: '', title: course.title, order: 0, courseId: course.id }];
  return (
    <div className="course-learning-list">
      <div
        className="filter-row"
        aria-label={tr(lang, 'Kurs bo‘limlari', 'Course modules', 'Разделы курса')}
      >
        <Button size="sm" variant={!moduleId ? 'default' : 'outline'} onClick={() => setModule('')}>
          {tr(lang, 'Hammasi', 'All', 'Все')}
        </Button>
        {modules.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={moduleId === m.id ? 'default' : 'outline'}
            onClick={() => {
              setModule(m.id);
              setExpanded((v) => ({ ...v, [m.id]: true }));
            }}
          >
            {m.title}
          </Button>
        ))}
      </div>
      <div
        className="lesson-status-filter"
        role="group"
        aria-label={tr(lang, 'Dars holati', 'Lesson status', 'Статус урока')}
      >
        {options.map(([value, uz, en, ru]) => (
          <button
            key={value}
            aria-pressed={status === value}
            onClick={() => {
              setStatus(value);
              setExpanded(Object.fromEntries(groups.map((m) => [m.id, true])));
            }}
          >
            {tr(lang, uz, en, ru)}
          </button>
        ))}
      </div>
      {!selected.length && (
        <p className="soft-empty panel">
          {tr(
            lang,
            'Bu holatdagi darslar yo‘q. Boshqa filtrni tanlang.',
            'No lessons match. Choose another filter.',
            'Подходящих уроков нет. Выберите другой фильтр.',
          )}
        </p>
      )}
      {groups.map((m) => {
        const rows = selected.filter((l) => l.moduleId === m.id || !modules.length);
        if (!rows.length) return null;
        return (
          <details
            className="course-module"
            key={m.id}
            open={expanded[m.id] ?? true}
            onToggle={(e) => {
              const value = e.currentTarget.open;
              setExpanded((v) => (v[m.id] === value ? v : { ...v, [m.id]: value }));
            }}
          >
            <summary>
              <BookOpen size={18} />
              <span>{m.title}</span>
              <small>
                {rows.length} {tr(lang, 'dars', 'lessons', 'уроков')}
              </small>
            </summary>
            <div className="lesson-grid">
              {rows.map((l) => {
                const h = history[l.id],
                  pts = topicPoints(h),
                  access = accessOf(data, l.id),
                  locked = state(l) === 'locked',
                  progress = data.progress?.find((p) => p.lessonId === l.id),
                  seen = Math.max(
                    h?.seenSlides || 0,
                    progress?.seen.length || 0,
                    progress?.legacySeen || 0,
                  ),
                  number = lessons.findIndex((x) => x.id === l.id) + 1,
                  academic = !course.extra && !!data.user?.readingHistory;
                return (
                  <article className="lesson-item" key={l.id}>
                    <button
                      className={
                        'lesson-card panel' +
                        (l.draft ? ' is-draft' : '') +
                        (l.exam ? ' is-exam' : '') +
                        (locked ? ' is-locked' : '') +
                        (access?.state === 'score' ? ' is-live' : '')
                      }
                      onClick={() => open(l)}
                      aria-disabled={locked && !paidLock && !l.draft}
                    >
                      <div className="mini-cover">
                        <TopicArt id={l.id} number={number} />
                        {locked && (
                          <span className="lock-veil">
                            <Lock size={24} />
                          </span>
                        )}
                      </div>
                      <div className="lesson-card-top">
                        <span className="lesson-row-number">{String(number).padStart(2, '0')}</span>
                        <span className="course-level">
                          {l.exam
                            ? tr(lang, 'Yakuniy imtihon', 'Final exam', 'Итоговый экзамен')
                            : m.title}
                        </span>
                        <AccessChip access={access} lang={lang} />
                      </div>
                      <h3>
                        {number}. {l.title}
                      </h3>
                      {academic ? (
                        <>
                          <span className="lesson-compact-score">
                            {num(pts.total)} / 100 {tr(lang, 'ball', 'pts', 'баллов')}
                          </span>
                          <div className="lesson-points">
                            <PointsRing value={pts.total} size={58} />
                            <PointsBreakdown history={h} lang={lang} />
                          </div>
                        </>
                      ) : (
                        <p className="lesson-reading-count">
                          {l.plan?.hours ||
                            `${seen}/${l.slideCount} ${tr(lang, 'slayd', 'slides', 'слайдов')}`}
                        </p>
                      )}
                      <span className="lesson-link">
                        {l.draft
                          ? tr(lang, 'Tayyorlanmoqda', 'In preparation', 'Готовится')
                          : paidLock
                            ? '💳 ' + tr(lang, 'Pullik kurs', 'Paid course', 'Платный курс')
                            : locked
                              ? tr(lang, 'Hali ochilmagan', 'Not open yet', 'Пока закрыто')
                              : access?.state === 'score' && access.due
                                ? '⏳ ' + dueText(access.due, lang).date
                                : state(l) === 'started'
                                  ? tr(lang, 'Davom etish', 'Continue', 'Продолжить')
                                  : tr(lang, 'Boshlash', 'Start', 'Начать')}
                        <ChevronRight size={15} />
                      </span>
                    </button>
                    {l.plan && (
                      <details className="lesson-plan-preview">
                        <summary>{tr(lang, 'Dars rejasi', 'Lesson plan', 'План урока')}</summary>
                        <div>
                          <p>
                            <b>{l.plan.hours}</b>
                          </p>
                          <p>{l.plan.about}</p>
                          <h4>{tr(lang, 'Amaliy topshiriq', 'Practice', 'Практика')}</h4>
                          <p>{l.plan.task}</p>
                          <h4>{tr(lang, 'Natija', 'Outcome', 'Результат')}</h4>
                          <p>{l.plan.result}</p>
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
