'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import {
  ArrowUpRight,
  BookOpen,
  Flame,
  Play,
  Target,
  Trophy,
  ChevronRight,
  Check,
  GraduationCap,
  Sparkles,
  Lock,
  Medal,
  Compass,
  Star,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { Illustration } from './illustration';
import { t, dateLabel, weekdayLabel, levelLabel } from '@/lib/i18n';
import type { Lesson } from '@/lib/types';
export const navigate = (view: string) => {
  location.hash = view;
};
export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: Math.min(100, value) + '%' }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}
export function Dashboard() {
  const { data, lang, legacy, call, toast, setLogin } = useApp(),
    reduce = useReducedMotion(),
    lastLevel = useRef(''),
    [celebrate, setCelebrate] = useState(false);
  const d = data!,
    u = d.user;
  const name =
    u?.name || legacy?.name || { uz: 'Bilim izlovchi', en: 'Learner', ru: 'Исследователь' }[lang];
  const xp = u?.xp || 0,
    levels = d.settings.levels,
    level = [...levels].reverse().find((x) => xp >= x.xp) || levels[0],
    next = levels.find((x) => x.xp > xp),
    progress = d.progress || [],
    done = progress.filter((x) => x.completed),
    active = [...progress].sort((a, b) => b.updatedAt - a.updatedAt).find((x) => !x.completed),
    lesson =
      d.lessons.find((l) => l.id === active?.lessonId) ||
      d.lessons.find((l) => !done.some((p) => p.lessonId === l.id)) ||
      d.lessons[0],
    pct = next ? ((xp - level.xp) / (next.xp - level.xp)) * 100 : 100;
  useEffect(() => {
    if (lastLevel.current && lastLevel.current !== level.name) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
    }
    lastLevel.current = level.name;
  }, [level.name]);
  async function openLesson(l: Lesson) {
    if (d.mode === 'legacy') {
      navigate('lesson/' + l.id);
      return;
    }
    if (!u) {
      if (d.mode === 'demo') navigate('login');
      else setLogin(true);
      return;
    }
    try {
      await call('enroll', { courseId: l.courseId });
      navigate('lesson/' + l.id);
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR LEARNING JOURNEY</span>
          <h1>
            {t(lang, 'welcome')}, {name.split(' ')[0]} <span className="wave">✦</span>
          </h1>
          <p>
            {lang === 'uz'
              ? 'Har kuni kichik qadam — katta imkoniyatlar sari.'
              : lang === 'en'
                ? 'Small steps today. Bigger possibilities tomorrow.'
                : 'Маленькие шаги сегодня — большие возможности завтра.'}
          </p>
        </div>
        <div className="date-chip">{dateLabel(lang)}</div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <motion.section
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="welcome-hero"
          >
            <div>
              <span className="hero-tag">
                <Sparkles size={14} />
                {t(lang, 'explore')}
              </span>
              <h2>
                {lang === 'uz' ? (
                  <>
                    G‘oyangizni
                    <br />
                    kelajakka aylantiring.
                  </>
                ) : lang === 'en' ? (
                  <>
                    Turn your ideas
                    <br />
                    into possibilities.
                  </>
                ) : (
                  <>
                    Превратите идеи
                    <br />в возможности.
                  </>
                )}
              </h2>
              <p>
                {lang === 'uz'
                  ? 'O‘rganing. Sinab ko‘ring. O‘sishda davom eting.'
                  : lang === 'en'
                    ? 'Learn. Put it into practice. Keep growing.'
                    : 'Учитесь. Пробуйте. Продолжайте расти.'}
              </p>
              <Button className="hero-button" onClick={() => navigate('courses')}>
                {t(lang, 'begin')}
                <ArrowUpRight size={17} />
              </Button>
            </div>
            <Illustration />
          </motion.section>
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon violet">
                <Sparkles />
              </span>
              <div>
                <small>{d.mode === 'legacy' ? 'Tadbirkorlik asoslari XP' : 'TOTAL XP'}</small>
                <strong>{xp.toLocaleString()}</strong>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon coral">
                <Flame />
              </span>
              <div>
                <small>{t(lang, 'streak')}</small>
                <strong>
                  {u?.streak || 0} <em>{lang === 'en' ? 'days' : lang === 'ru' ? 'дн.' : 'kun'}</em>
                </strong>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon blue">
                <BookOpen />
              </span>
              <div>
                <small>
                  {lang === 'uz'
                    ? 'Yakunlangan darslar'
                    : lang === 'en'
                      ? 'Lessons completed'
                      : 'Пройдено уроков'}
                </small>
                <strong>
                  {done.length}
                  <em> / {d.lessons.length}</em>
                </strong>
              </div>
            </div>
          </section>
          <section>
            <div className="section-heading">
              <h2>{t(lang, 'continue')}</h2>
              <button onClick={() => navigate('courses')}>
                {lang === 'uz' ? 'Barchasini ko‘rish' : lang === 'en' ? 'View all' : 'Смотреть все'}
                <ChevronRight size={15} />
              </button>
            </div>
            {lesson ? (
              <div className="continue-card">
                <div className="lesson-cover lavender">
                  <GraduationCap size={52} />
                  <span className="cover-orbit" />
                </div>
                <div className="continue-content">
                  <span className="tiny-tag">
                    {d.courses.find((x) => x.id === lesson.courseId)?.title}
                  </span>
                  <h3>{lesson.title}</h3>
                  <p>
                    {active ? Math.round((active.seen.length / lesson.slideCount) * 100) : 0}% ·{' '}
                    {lesson.slideCount}{' '}
                    {lang === 'en' ? 'slides' : lang === 'ru' ? 'слайдов' : 'slayd'}
                  </p>
                  <ProgressBar
                    value={active ? (active.seen.length / lesson.slideCount) * 100 : 0}
                  />
                </div>
                <Button
                  size="icon"
                  aria-label={t(lang, 'continue')}
                  onClick={() => openLesson(lesson)}
                >
                  <Play size={18} fill="currentColor" />
                </Button>
              </div>
            ) : (
              <div className="empty-state">{t(lang, 'empty')}</div>
            )}
          </section>
          <section>
            <div className="section-heading">
              <h2>{t(lang, 'featured')}</h2>
              <span className="muted">{d.courses.length}</span>
            </div>
            <div className="course-grid">
              {d.courses.map((c, i) => {
                const count = d.lessons.filter((x) => x.courseId === c.id).length,
                  finished = done.filter((x) => x.courseId === c.id).length;
                return (
                  <button
                    className="course-card"
                    key={c.id}
                    onClick={() => navigate('course/' + c.id)}
                  >
                    <div className={'course-art tone-' + (i % 3)}>
                      <Illustration variant={c.id} />
                      <span className="course-category">{c.category}</span>
                    </div>
                    <div className="course-card-body">
                      <span className="course-level">{c.difficulty}</span>
                      <h3>{c.title}</h3>
                      <p>
                        {count} {lang === 'en' ? 'lessons' : lang === 'ru' ? 'уроков' : 'ta dars'}
                        <span>
                          {finished}/{count}
                        </span>
                      </p>
                      <ProgressBar value={count ? (finished / count) * 100 : 0} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="activity-card panel">
            <div className="section-heading">
              <h2>{t(lang, 'activity')}</h2>
              <span className="tiny-tag">XP</span>
            </div>
            {u && d.activity?.some((x) => x.xp > 0) ? (
              <div style={{ width: '100%', height: 170 }}>
                <ResponsiveContainer>
                  <BarChart data={d.activity}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#8b8b9d' }}
                    />
                    <Tooltip />
                    <Bar dataKey="xp" fill="#8b5cf6" radius={[7, 7, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">
                <div>
                  {[20, 35, 26, 48, 30, 64, 42].map((h, i) => (
                    <i key={i} style={{ height: h }} />
                  ))}
                </div>
                <span>{t(lang, 'empty')}</span>
              </div>
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="profile-summary panel">
            <div className="profile-avatar">
              {name
                .split(' ')
                .map((x) => x[0])
                .slice(0, 2)
                .join('')}
              <span>✦</span>
            </div>
            <h3>{name}</h3>
            <p>{u?.classId || legacy?.group || t(lang, 'progress')}</p>
            <div className="level-ring">
              <svg viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="var(--soft-violet)"
                  strokeWidth="9"
                  fill="none"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="#8b5cf6"
                  strokeWidth="9"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="339.3"
                  initial={{ strokeDashoffset: 339.3 }}
                  animate={{ strokeDashoffset: 339.3 * (1 - pct / 100) }}
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div>
                <Trophy size={27} />
                <b>{levelLabel(lang, level.name)}</b>
              </div>
            </div>
            <small>{t(lang, 'level')}</small>
            <p className="level-note">
              {next
                ? `${xp} / ${next.xp} XP`
                : lang === 'uz'
                  ? 'Eng yuqori daraja'
                  : 'Highest level'}
            </p>
            <div className="profile-divider" />
            <div className="streak-row">
              {Array.from({ length: 7 }, (_, i) =>
                weekdayLabel(lang, Date.now() - (6 - i) * 86400000),
              ).map((day, i) => (
                <div key={i}>
                  <span className={d.activity?.[i]?.xp ? 'active' : ''}>
                    {d.activity?.[i]?.xp ? <Check size={13} /> : ''}
                  </span>
                  <small>{day}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="challenge-card">
            <span className="challenge-icon">
              <Target size={22} />
            </span>
            <div className="section-heading">
              <h3>{t(lang, 'daily')}</h3>
              <span>+{d.settings.rewards.challenge} XP</span>
            </div>
            <p>
              {lang === 'uz'
                ? 'Bugun bitta testdan muvaffaqiyatli o‘ting.'
                : lang === 'en'
                  ? 'Pass one quiz today and keep your momentum.'
                  : 'Успешно пройдите один тест сегодня.'}
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const r = await call<{ points: number }>('challenge', {});
                  toast(
                    r.points
                      ? `+${r.points} XP`
                      : lang === 'uz'
                        ? 'Mukofot avval berilgan'
                        : 'Reward already claimed',
                  );
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              {lang === 'uz'
                ? 'Mukofotni olish'
                : lang === 'en'
                  ? 'Claim reward'
                  : 'Получить награду'}
              <ChevronRight size={14} />
            </Button>
          </section>
          <section className="panel badge-preview">
            <div className="section-heading">
              <h3>{t(lang, 'badges')}</h3>
              <button aria-label={t(lang, 'badges')} onClick={() => navigate('badges')}>
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="badge-icons">
              {[Trophy, Star, Medal].map((Icon, i) => (
                <div className={d.earned?.length && i < d.earned.length ? 'earned' : ''} key={i}>
                  <Icon size={25} />
                </div>
              ))}
            </div>
            <p>
              {d.earned?.length || 0} / {d.badges.length}{' '}
              {lang === 'en' ? 'unlocked' : lang === 'ru' ? 'открыто' : 'ochilgan'}
            </p>
          </section>
          <div className="study-tip">
            <span>✦</span>
            <p>
              {lang === 'uz'
                ? 'Katta natijalar kichik, muntazam qadamdan boshlanadi.'
                : lang === 'en'
                  ? 'Great progress starts with small, consistent steps.'
                  : 'Большой прогресс начинается с маленьких, регулярных шагов.'}
            </p>
          </div>
        </aside>
      </div>
      {celebrate && !reduce && (
        <div className="level-celebration" role="status">
          ✦ {level.name} ✦
        </div>
      )}
    </>
  );
}
export function CourseList({ search = '', courseId }: { search?: string; courseId?: string }) {
  const { data, lang, call, toast, setLogin } = useApp(),
    d = data!,
    [moduleId, setModule] = useState('');
  const course = courseId ? d.courses.find((x) => x.id === courseId) : null,
    mods = d.modules.filter((m) => !courseId || m.courseId === courseId),
    list = d.lessons.filter(
      (l) =>
        (!courseId || l.courseId === courseId) &&
        (!moduleId || l.moduleId === moduleId) &&
        l.title.toLowerCase().includes(search.toLowerCase()),
    );
  async function open(l: Lesson) {
    if (d.mode === 'legacy') {
      navigate('lesson/' + l.id);
      return;
    }
    if (!d.user) {
      if (d.mode === 'demo') navigate('login');
      else setLogin(true);
      return;
    }
    try {
      await call('enroll', { courseId: l.courseId });
      navigate('lesson/' + l.id);
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LEARN SOMETHING NEW</span>
          <h1>{course?.title || t(lang, 'courses')}</h1>
          <p>{course?.description || t(lang, 'explore')}</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/legacy/tadbirkorlik-asoslari.html">
            {lang === 'uz'
              ? 'Asl taqdimotlar'
              : lang === 'en'
                ? 'Original presentations'
                : 'Исходные презентации'}
            <ArrowUpRight size={15} />
          </a>
        </Button>
      </div>
      <div className="filter-row">
        <Button variant={!moduleId ? 'default' : 'outline'} size="sm" onClick={() => setModule('')}>
          {t(lang, 'all')}
        </Button>
        {mods.map((m) => (
          <Button
            size="sm"
            variant={moduleId === m.id ? 'default' : 'outline'}
            key={m.id}
            onClick={() => setModule(m.id)}
          >
            {m.title}
          </Button>
        ))}
      </div>
      <div className="lesson-grid">
        {list.map((l, i) => {
          const p = d.progress?.find((x) => x.lessonId === l.id);
          return (
            <button key={l.id} className="lesson-card panel" onClick={() => open(l)}>
              <div className={'mini-cover tone-' + (i % 3)}>
                <BookOpen size={30} />
                <span>{String(i + 1).padStart(2, '0')}</span>
                {p?.completed && <Check className="completed-check" />}
              </div>
              <span className="course-level">{mods.find((m) => m.id === l.moduleId)?.title}</span>
              <h3>{l.title}</h3>
              <p>
                {l.slideCount} {lang === 'en' ? 'slides' : lang === 'ru' ? 'слайдов' : 'slayd'} · +
                {d.settings.rewards.lesson} XP
              </p>
              <ProgressBar value={p ? (p.seen.length / l.slideCount) * 100 : 0} />
              <span className="lesson-link">
                {p ? t(lang, 'continue') : t(lang, 'begin')}
                <ChevronRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {!list.length && <div className="empty-state">{t(lang, 'empty')}</div>}
    </>
  );
}
export function Badges() {
  const { data, lang } = useApp();
  const icons = {
    book: BookOpen,
    trophy: Trophy,
    star: Star,
    flame: Flame,
    compass: Compass,
    graduation: GraduationCap,
    medal: Medal,
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVERY STEP COUNTS</span>
          <h1>{t(lang, 'badges')}</h1>
          <p>
            {lang === 'uz'
              ? 'Bu darajalar platformadagi yutuqlar bo‘lib, rasmiy akademik unvon emas.'
              : lang === 'en'
                ? 'Platform achievements celebrate your progress. They are not academic qualifications.'
                : 'Это достижения платформы, а не официальные академические звания.'}
          </p>
        </div>
      </div>
      <div className="badge-grid">
        {data!.badges.map((b) => {
          const earned = data?.earned?.includes(b.id),
            Icon = icons[b.icon as keyof typeof icons] || Medal;
          return (
            <div className={'badge-card panel ' + (earned ? 'earned' : 'locked')} key={b.id}>
              <div className="badge-medallion">
                <Icon size={40} />
              </div>
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              <span>{earned ? <Check size={15} /> : <Lock size={15} />}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
