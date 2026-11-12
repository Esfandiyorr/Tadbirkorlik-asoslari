'use client';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowLeft,
  BookOpen,
  Play,
  Trophy,
  ChevronRight,
  Check,
  Lock,
  LogIn,
  UserPlus,
  Clock3,
  Target,
  Gamepad2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { TopicArt, CourseArt } from './topic-art';
import { PushInvite } from './push-toggle';
import { HeroAvatar, useAcademicBoard } from './avatars';
import { NewsBox, NewsChip } from './announcements';
import { PromoBox } from './promo';
import { Leaderboard } from './leaderboard';
import { AccessChip, PointsRing, PointsBreakdown } from './points-ui';
import { t, dateLabel } from '@/lib/i18n';
import {
  accessOf,
  courseTotals,
  dueText,
  durationText,
  num,
  pointHints,
  topicPoints,
  tr,
} from '@/lib/points';
import type { Data, Lesson, Progress } from '@/lib/types';

const seenCount = (p: Progress) => Math.max(p.seen.length, p.legacySeen || 0);
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

/** Darsni ochish: yopiq mavzuga kiritmaydi, mehmonni kirishga yuboradi. */
function useOpenLesson() {
  const { data, call, toast, setLogin, lang } = useApp();
  return async (l: Lesson) => {
    const d = data!;
    const access = accessOf(d, l.id);
    if (access?.state === 'locked') {
      toast(
        tr(
          lang,
          '🔒 Bu mavzu hali ochilmagan — o‘qituvchi darsda ochadi.',
          '🔒 This topic is not open yet — the teacher opens it in class.',
          '🔒 Эта тема ещё закрыта — преподаватель откроет её на занятии.',
        ),
      );
      return;
    }
    if (d.mode === 'legacy' || d.limited) return navigate('lesson/' + l.id);
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
  };
}

const sortedLessons = (d: Data, courseId?: string) =>
  d.lessons
    .filter((l) => !courseId || l.courseId === courseId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, undefined, { numeric: true }));

/** Joriy mavzu: avval ball beriladigan va tugallanmagan, keyin boshlangan, keyin birinchi o'qilmagan. */
export function currentLesson(d: Data) {
  const h = d.user?.readingHistory || {},
    list = sortedLessons(d),
    open = (l: Lesson) => accessOf(d, l.id)?.state !== 'locked';
  return (
    list.find((l) => accessOf(d, l.id)?.state === 'score' && topicPoints(h[l.id]).total < 100) ||
    list.find((l) => h[l.id]?.status === 'started' && open(l)) ||
    [...(d.progress || [])]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => list.find((l) => l.id === p.lessonId && !p.completed))
      .find(Boolean) ||
    list.find((l) => h[l.id]?.status !== 'read' && open(l)) ||
    list[0]
  );
}

/* ============================== BOSH SAHIFA ============================== */
export function Dashboard() {
  const { data, legacy } = useApp();
  if (!data?.user && !legacy) return <GuestHome />;
  return <LearnerHome />;
}

/** Bosh sahifadagi tezkor o'tishlar: asosiy bo'limlar bitta bosishda. */
function QuickLinks() {
  const { lang } = useApp();
  const items: [string, string, [string, string, string], [string, string, string]][] = [
    [
      'courses',
      '📚',
      ['Mavzular', 'Topics', 'Темы'],
      ['Fanni ketma-ket o‘rganish', 'Study the course step by step', 'Изучать курс по порядку'],
    ],
    [
      'slides',
      '🎞',
      ['Taqdimot', 'Presentation', 'Презентация'],
      ['Sun’iy intellekt tuzib beradi', 'Built for you by AI', 'Подготовит ИИ'],
    ],
    [
      'library',
      '📖',
      ['Kutubxona', 'Library', 'Библиотека'],
      ['Kitob, qo‘llanma va namunalar', 'Books, guides and templates', 'Книги, пособия и шаблоны'],
    ],
    [
      'arena',
      '🎮',
      ['O‘yin maydoni', 'Game arena', 'Игровая арена'],
      ['Jonli test va bellashuvlar', 'Live quiz and contests', 'Живой тест и соревнования'],
    ],
  ];
  return (
    <nav
      className="quick-links"
      aria-label={tr(lang, 'Tezkor o‘tish', 'Quick links', 'Быстрые ссылки')}
    >
      {items.map(([id, icon, name, hint]) => (
        <a key={id} href={'#' + id} className={'quick-link is-' + id}>
          <span aria-hidden="true">{icon}</span>
          <b>{tr(lang, ...name)}</b>
          <small>{tr(lang, ...hint)}</small>
        </a>
      ))}
    </nav>
  );
}

function LearnerHome() {
  const { data, lang, legacy } = useApp(),
    reduce = useReducedMotion(),
    open = useOpenLesson();
  const d = data!,
    u = d.user,
    staff = u?.role === 'teacher' || u?.role === 'admin',
    hasAcademic = !!u?.readingHistory,
    university = u?.learnerType !== 'independent';
  const name = u?.name || legacy?.name || tr(lang, 'Bilim izlovchi', 'Learner', 'Ученик');
  const lesson = currentLesson(d),
    history = u?.readingHistory?.[lesson?.id || ''],
    access = lesson ? accessOf(d, lesson.id) : undefined,
    pts = topicPoints(history),
    totals = courseTotals(d),
    lessons = sortedLessons(d);
  const active = lessons.filter((l) => accessOf(d, l.id)?.state === 'score');
  // Talabada mavzu rasmi o'rnida avatar (top-10 yoki administrator ruxsati bilan tanlanadi).
  const avatarHome = !staff && university && hasAcademic && u?.role === 'student',
    board = useAcademicBoard(avatarHome);
  const progressFor = (l: Lesson) => {
    const p = d.progress?.find((x) => x.lessonId === l.id);
    return (
      Math.max(p ? seenCount(p) : 0, u?.readingHistory?.[l.id]?.seenSlides || 0) / l.slideCount
    );
  };
  const hour = new Date(Date.now() + 18000000).getUTCHours();
  const hello =
    hour < 11
      ? tr(lang, 'Xayrli tong', 'Good morning', 'Доброе утро')
      : hour < 18
        ? tr(lang, 'Xayrli kun', 'Good afternoon', 'Добрый день')
        : tr(lang, 'Xayrli kech', 'Good evening', 'Добрый вечер');
  return (
    <>
      <div className="page-heading home-heading">
        <div>
          <span className="eyebrow">
            📅 {dateLabel(lang)} ·{' '}
            {tr(
              lang,
              'Tadbirkorlik asoslari',
              'Fundamentals of Entrepreneurship',
              'Основы предпринимательства',
            )}
          </span>
          <h1>
            {hello}, {name.split(' ')[0]} <span className="wave">👋</span>
          </h1>
          <p>
            {tr(
              lang,
              'Har kuni kichik qadam — katta natija sari. Bugun nimadan boshlaymiz?',
              'Small steps every day lead to big results. Where shall we start today?',
              'Маленькие шаги каждый день ведут к большим результатам. С чего начнём?',
            )}
          </p>
        </div>
      </div>
      {/* Telefonda yon menyu yashirin: ikkala e'lon oynasi — joriy mavzu yonidagi ✉️ tugmada (mavzu bo'lmasa —
          oynalar). Yangi e'lon saytga kirganda katta oynada chiqadi. */}
      {!lesson && (
        <>
          <NewsBox className="home-news" />
          <PromoBox className="home-promo" />
        </>
      )}
      <PushInvite />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          {lesson && (
            <motion.section
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="welcome-hero continue-hero"
            >
              {avatarHome ? (
                <HeroAvatar board={board} />
              ) : (
                <TopicArt id={lesson.id} number={lesson.order + 1} />
              )}
              <div className="continue-hero-body">
                <div className="hero-tag-row">
                  <span className="hero-tag">
                    <Sparkles size={14} />
                    {history?.status === 'started'
                      ? tr(lang, 'Davom eting', 'Keep going', 'Продолжайте')
                      : tr(lang, 'Joriy mavzu', 'Current topic', 'Текущая тема')}
                  </span>
                  <NewsChip className="home-news-chip" />
                </div>
                <h2>
                  {lesson.order + 1}-{tr(lang, 'mavzu', 'topic', 'тема')}: {lesson.title}
                </h2>
                <div className="continue-hero-meta">
                  <AccessChip access={access} lang={lang} />
                  {access?.state === 'score' && access.due && (
                    <span className="hero-due">
                      <Clock3 size={14} /> {dueText(access.due, lang).date}{' '}
                      {tr(lang, 'gacha', '', 'до')}
                    </span>
                  )}
                </div>
                {hasAcademic ? (
                  <div className="continue-hero-points">
                    <PointsRing
                      value={pts.total}
                      size={76}
                      label={tr(lang, 'Mavzu bali', 'Topic points', 'Баллы темы')}
                    />
                    <div>
                      <b>
                        {pts.remaining > 0
                          ? tr(
                              lang,
                              `Yana ${num(pts.remaining)} ball olishingiz mumkin`,
                              `${num(pts.remaining)} more points available`,
                              `Можно получить ещё ${num(pts.remaining)} баллов`,
                            )
                          : tr(
                              lang,
                              'To‘liq 100 ball! 🎉',
                              'Full 100 points! 🎉',
                              'Полные 100 баллов! 🎉',
                            )}
                      </b>
                      <ul>
                        {pointHints(history, lang)
                          .slice(0, 2)
                          .map((h) => (
                            <li key={h.key}>
                              {h.text} <em>+{num(h.points)}</em>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ProgressBar value={progressFor(lesson) * 100} />
                )}
                <Button className="hero-button" onClick={() => open(lesson)}>
                  <Play size={17} fill="currentColor" />
                  {history?.status === 'started'
                    ? tr(lang, 'Davom ettirish', 'Continue', 'Продолжить')
                    : tr(lang, 'Boshlash', 'Start', 'Начать')}
                </Button>
              </div>
            </motion.section>
          )}
          <QuickLinks />
          <section className="stats-grid">
            {hasAcademic && university ? (
              <div className="stat-card">
                <span className="stat-emoji">🏅</span>
                <div>
                  <small>{tr(lang, 'Umumiy ball', 'Total points', 'Общий балл')}</small>
                  <strong>{num(u?.academicPoints ?? totals.points)}</strong>
                </div>
              </div>
            ) : null}
            <div className="stat-card">
              <span className="stat-emoji">📖</span>
              <div>
                <small>{tr(lang, 'O‘qilgan mavzular', 'Topics read', 'Прочитано тем')}</small>
                <strong>
                  {hasAcademic ? totals.read : (d.progress || []).filter((p) => p.completed).length}
                  <em> / {lessons.length}</em>
                </strong>
              </div>
            </div>
            {hasAcademic && (
              <div className="stat-card">
                <span className="stat-emoji">⏱️</span>
                <div>
                  <small>{tr(lang, 'O‘qish vaqti', 'Reading time', 'Время чтения')}</small>
                  <strong className="stat-text">{durationText(totals.seconds, lang)}</strong>
                </div>
              </div>
            )}
            {!staff && (
              <div className="stat-card">
                <span className="stat-emoji">🎯</span>
                <div>
                  <small>
                    {tr(lang, 'Ball beriladigan', 'Earning points now', 'Сейчас с баллами')}
                  </small>
                  <strong>
                    {active.length}
                    <em> {tr(lang, 'mavzu', 'topics', 'тем')}</em>
                  </strong>
                </div>
              </div>
            )}
          </section>
          {!staff && (
            <section>
              <div className="section-heading">
                <h2>
                  🎯{' '}
                  {tr(
                    lang,
                    'Bu hafta ball beradigan mavzular',
                    'Topics earning points this week',
                    'Темы с баллами на этой неделе',
                  )}
                </h2>
              </div>
              {active.length ? (
                <div className="due-list">
                  {active.map((l) => {
                    const h = u?.readingHistory?.[l.id],
                      p = topicPoints(h),
                      a = accessOf(d, l.id),
                      due = a?.due ? dueText(a.due, lang) : null;
                    return (
                      <button key={l.id} className="due-item panel" onClick={() => open(l)}>
                        <TopicArt id={l.id} compact />
                        <span className="due-item-body">
                          <b>
                            {l.order + 1}. {l.title}
                          </b>
                          {due && (
                            <small className={due.urgent ? 'urgent' : ''}>
                              ⏳ {due.date} {tr(lang, 'gacha', '', 'до')} · {due.left}
                            </small>
                          )}
                        </span>
                        <PointsRing value={p.total} size={52} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="soft-empty panel">
                  <span>📚</span>
                  <p>
                    {tr(
                      lang,
                      'Hozircha ball beriladigan mavzu yo‘q. O‘qituvchi yangi mavzuni ochganda shu yerda chiqadi. Bu orada o‘qilgan mavzularni takrorlang yoki o‘yinlarda bilimingizni sinang.',
                      'No topic is earning points right now. When the teacher opens a new one it appears here. Meanwhile, revise topics or test yourself in the games.',
                      'Сейчас нет тем с баллами. Когда преподаватель откроет новую, она появится здесь. А пока повторите темы или проверьте себя в играх.',
                    )}
                  </p>
                  <div className="row-actions">
                    <Button variant="outline" onClick={() => navigate('courses')}>
                      <BookOpen size={16} /> {t(lang, 'courses')}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('arena')}>
                      <Gamepad2 size={16} /> {tr(lang, 'O‘yinlar', 'Games', 'Игры')}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}
          <section>
            <div className="section-heading">
              <h2>📚 {tr(lang, 'Mening fanim', 'My course', 'Мой курс')}</h2>
              <button onClick={() => navigate('courses')}>
                {tr(lang, 'Barcha mavzular', 'All topics', 'Все темы')}
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="course-grid">
              {d.courses.map((c) => {
                const topics = sortedLessons(d, c.id),
                  done = topics.filter((l) => u?.readingHistory?.[l.id]?.status === 'read').length;
                return (
                  <button
                    className="course-card"
                    key={c.id}
                    onClick={() => navigate('course/' + c.id)}
                  >
                    <CourseArt title={c.title} />
                    <div className="course-card-body">
                      <span className="course-level">TerDU · {c.difficulty}</span>
                      <h3>{c.title}</h3>
                      <p>
                        {topics.length} {tr(lang, 'ta mavzu', 'topics', 'тем')}
                        <span>
                          {hasAcademic && university
                            ? `${num(totals.points)} / ${totals.max} ${tr(lang, 'ball', 'pts', 'баллов')}`
                            : `${done}/${topics.length}`}
                        </span>
                      </p>
                      <ProgressBar
                        value={
                          hasAcademic && university
                            ? (totals.points / Math.max(1, totals.max)) * 100
                            : (done / Math.max(1, topics.length)) * 100
                        }
                      />
                    </div>
                  </button>
                );
              })}
            </div>
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
            </div>
            <h3>{name}</h3>
            <p>
              {staff
                ? u?.role === 'admin'
                  ? tr(lang, 'Administrator', 'Administrator', 'Администратор')
                  : tr(lang, 'O‘qituvchi', 'Teacher', 'Преподаватель')
                : university
                  ? u?.classId || legacy?.group || tr(lang, 'Talaba', 'Student', 'Студент')
                  : tr(lang, 'Mustaqil o‘quvchi', 'Independent learner', 'Самостоятельный ученик')}
            </p>
            {hasAcademic && (
              <>
                <PointsRing
                  value={(totals.points / Math.max(1, totals.max)) * 100}
                  size={128}
                  unit="%"
                  label={tr(lang, 'Kurs o‘zlashtirilishi', 'Course progress', 'Прогресс курса')}
                />
                <small className="ring-caption">
                  {tr(
                    lang,
                    'Fan bo‘yicha o‘zlashtirish, %',
                    'Course mastery, %',
                    'Освоение курса, %',
                  )}
                </small>
              </>
            )}
            <div className="profile-quick">
              <button onClick={() => navigate('ranking')}>
                <Trophy size={18} />
                {t(lang, 'ranking')}
              </button>
              <button onClick={() => navigate('badges')}>
                <Target size={18} />
                {t(lang, 'badges')}
              </button>
              {(staff || university) && (
                <button onClick={() => navigate('chat')}>
                  <MessageSquare size={18} />
                  {tr(lang, 'Chat', 'Chat', 'Чат')}
                </button>
              )}
            </div>
          </section>
          <AchievementsPreview />
          <div className="study-tip">
            <span>💡</span>
            <p>
              {tr(
                lang,
                'Har mavzu — 100 ball: 30 ball slaydlar, 20 ball 1 soat o‘qish, 50 ball yakuniy test.',
                'Each topic is worth 100 points: 30 for slides, 20 for one hour of reading, 50 for the final test.',
                'Каждая тема — 100 баллов: 30 за слайды, 20 за час чтения, 50 за итоговый тест.',
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ============================== MEHMON SAHIFASI ============================== */
function GuestHome() {
  const { data, lang, setLogin } = useApp(),
    d = data!,
    lessons = sortedLessons(d);
  const login = () => (d.mode === 'demo' ? navigate('login') : setLogin(true));
  const features: [string, string, string][] = [
    [
      '📑',
      tr(lang, '15 ta interaktiv mavzu', '15 interactive topics', '15 интерактивных тем'),
      tr(
        lang,
        'Telefon, planshet va kompyuterda qulay o‘qiladi',
        'Comfortable on phone, tablet and computer',
        'Удобно на телефоне, планшете и компьютере',
      ),
    ],
    [
      '🧪',
      tr(lang, 'Testlar va amaliy topshiriqlar', 'Tests and practical tasks', 'Тесты и практика'),
      tr(
        lang,
        'Krossvord, masalalar va yakuniy testlar',
        'Crosswords, problems and final tests',
        'Кроссворды, задачи и итоговые тесты',
      ),
    ],
    [
      '🏆',
      tr(lang, 'Ball va reyting', 'Points and ranking', 'Баллы и рейтинг'),
      tr(
        lang,
        'Har mavzu 100 ball: slayd, vaqt va test',
        'Each topic is 100 points: slides, time and test',
        'Каждая тема — 100 баллов: слайды, время и тест',
      ),
    ],
    [
      '🎮',
      tr(lang, 'O‘yin arenasi', 'Game arena', 'Игровая арена'),
      tr(
        lang,
        'Shashka, shaxmat, puzzle, sudoku va boshqalar',
        'Draughts, chess, puzzles, sudoku and more',
        'Шашки, шахматы, пазлы, судоку и другое',
      ),
    ],
  ];
  return (
    <div className="guest-home">
      <section className="guest-hero">
        <div className="guest-hero-text">
          <span className="guest-badge">
            <img src="/terdu-logo.png" alt="" width="26" height="26" />
            {tr(
              lang,
              'Termiz davlat universiteti',
              'Termez State University',
              'Термезский государственный университет',
            )}
          </span>
          <h1>
            {tr(
              lang,
              'Tadbirkorlik asoslari',
              'Fundamentals of Entrepreneurship',
              'Основы предпринимательства',
            )}
            <span>
              {tr(
                lang,
                'interaktiv o‘quv platformasi',
                'interactive learning platform',
                'интерактивная учебная платформа',
              )}
            </span>
          </h1>
          <p>
            {tr(
              lang,
              'Ma’ruzalar — ko‘rgazmali taqdimotlar, bilim — testlar, o‘yinlar va reyting bilan mustahkamlanadi. Fan o‘qituvchisi — Isfandiyor Sayfiddinov.',
              'Lectures come as visual presentations; knowledge is reinforced with tests, games and a leaderboard. Course teacher: Isfandiyor Sayfiddinov.',
              'Лекции — наглядные презентации, знания закрепляются тестами, играми и рейтингом. Преподаватель — Исфандиёр Сайфиддинов.',
            )}
          </p>
          <div className="guest-actions">
            <Button size="lg" onClick={login}>
              <LogIn size={18} />
              {tr(lang, 'Kirish', 'Log in', 'Войти')}
            </Button>
            <Button size="lg" variant="outline" onClick={login}>
              <UserPlus size={18} />
              {tr(lang, 'Ro‘yxatdan o‘tish', 'Register', 'Регистрация')}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('courses')}>
              <BookOpen size={18} />
              {tr(lang, 'Mavzularni ko‘rish', 'Browse topics', 'Смотреть темы')}
            </Button>
          </div>
        </div>
        <CourseArt
          title={tr(lang, 'Tadbirkorlik asoslari', 'Entrepreneurship', 'Предпринимательство')}
        />
      </section>
      <section className="guest-features">
        {features.map(([e, h, p]) => (
          <div className="guest-feature panel" key={h}>
            <span>{e}</span>
            <b>{h}</b>
            <p>{p}</p>
          </div>
        ))}
      </section>
      <section className="guest-steps panel">
        <h2>🚀 {tr(lang, 'Qanday boshlanadi?', 'How to start', 'Как начать?')}</h2>
        <ol>
          <li>
            {tr(
              lang,
              'Mavzularni oching va o‘qing — ro‘yxatdan o‘tish shart emas.',
              'Open the topics and read — no registration needed.',
              'Открывайте темы и читайте — регистрация не нужна.',
            )}
          </li>
          <li>
            {tr(
              lang,
              'Test ishlash va ball to‘plash uchun hisobingizga kiring yoki ro‘yxatdan o‘ting.',
              'Log in or register to take tests and earn points.',
              'Чтобы проходить тесты и набирать баллы, войдите или зарегистрируйтесь.',
            )}
          </li>
          <li>
            {tr(
              lang,
              'Talaba hisobini o‘qituvchi tasdiqlaydi; mustaqil o‘quvchi guruhsiz o‘qiydi.',
              'The teacher approves student accounts; independent learners study without a group.',
              'Аккаунт студента подтверждает преподаватель; самостоятельные ученики учатся без группы.',
            )}
          </li>
        </ol>
      </section>
      <section>
        <div className="section-heading">
          <h2>📚 {tr(lang, 'Fan mavzulari', 'Course topics', 'Темы курса')}</h2>
          <button onClick={() => navigate('courses')}>
            {tr(lang, 'Hammasi', 'All', 'Все')}
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="guest-topics">
          {lessons.slice(0, 6).map((l) => (
            <button
              key={l.id}
              className="guest-topic panel"
              onClick={() => navigate('course/' + l.courseId)}
            >
              <TopicArt id={l.id} compact />
              <span>
                <small>
                  {l.order + 1}-{tr(lang, 'mavzu', 'topic', 'тема')}
                </small>
                <b>{l.title}</b>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================== KURSLAR VA MAVZULAR ============================== */
export function CourseList({
  courseId,
  sub,
}: {
  search?: string;
  courseId?: string;
  /** kurs ichidagi bo'lim: (bo'sh) — mavzular, 'ranking' — reyting */
  sub?: string;
}) {
  const { data, lang } = useApp(),
    d = data!,
    u = d.user,
    open = useOpenLesson(),
    [moduleId, setModule] = useState('');
  const course = courseId ? d.courses.find((x) => x.id === courseId) : null,
    mods = d.modules
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    courseLessons = sortedLessons(d, courseId),
    list = courseLessons.filter((l) => !moduleId || l.moduleId === moduleId),
    totals = courseTotals(d),
    hasAcademic = !!u?.readingHistory,
    university = u?.learnerType !== 'independent',
    ranking = sub === 'ranking';
  if (!courseId) {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              {tr(lang, 'FANNI TANLANG', 'CHOOSE A COURSE', 'ВЫБЕРИТЕ КУРС')}
            </span>
            <h1>{t(lang, 'courses')}</h1>
            <p>
              {tr(
                lang,
                'Fanni oching va uning mavzularini ketma-ket o‘rganing.',
                'Open a course to study its topics in order.',
                'Откройте курс и изучайте его темы по порядку.',
              )}
            </p>
          </div>
        </div>
        <div className="course-grid">
          {d.courses.map((c) => {
            const topics = sortedLessons(d, c.id),
              done = topics.filter((l) => u?.readingHistory?.[l.id]?.status === 'read').length;
            return (
              <button key={c.id} className="course-card" onClick={() => navigate('course/' + c.id)}>
                <CourseArt title={c.title} />
                <div className="course-card-body">
                  <span className="course-level">TerDU · {c.category}</span>
                  <h3>{c.title}</h3>
                  <p className="course-desc">{c.description}</p>
                  <p>
                    <span>
                      {topics.length} {tr(lang, 'ta mavzu', 'topics', 'тем')}
                    </span>
                    <span>
                      {hasAcademic && university
                        ? `${num(totals.points)} / ${totals.max} ${tr(lang, 'ball', 'pts', 'баллов')}`
                        : `${done}/${topics.length}`}
                    </span>
                  </p>
                  <ProgressBar
                    value={
                      hasAcademic && university
                        ? (totals.points / Math.max(1, totals.max)) * 100
                        : (done / Math.max(1, topics.length)) * 100
                    }
                  />
                  <span className="lesson-link">
                    {tr(lang, 'Fanni ochish', 'Open course', 'Открыть курс')}
                    <ChevronRight size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {!d.courses.length && <div className="empty-state">{t(lang, 'empty')}</div>}
      </>
    );
  }
  if (!course)
    return (
      <div className="empty-state">
        <p>{tr(lang, 'Kurs topilmadi', 'Course not found', 'Курс не найден')}</p>
        <Button onClick={() => navigate('courses')}>{t(lang, 'courses')}</Button>
      </div>
    );
  return (
    <>
      <Button variant="ghost" className="back-link" onClick={() => navigate('courses')}>
        <ArrowLeft size={16} />
        {t(lang, 'courses')}
      </Button>
      <section className="course-banner">
        <CourseArt title={course.title} />
        <div className="course-banner-body">
          <span className="eyebrow">
            {tr(lang, 'FAN MAVZULARI', 'COURSE TOPICS', 'ТЕМЫ КУРСА')}
          </span>
          <h1>{course.title}</h1>
          <p>
            {courseLessons.length} {tr(lang, 'ta mavzu', 'topics', 'тем')} · {course.description}
          </p>
          {hasAcademic && university && (
            <div className="course-banner-total">
              <PointsRing
                value={(totals.points / Math.max(1, totals.max)) * 100}
                size={64}
                unit="%"
              />
              <span>
                <b>
                  {num(totals.points)} / {totals.max}
                </b>
                {tr(lang, 'mavzular bo‘yicha jami ball', 'points across topics', 'баллов по темам')}
              </span>
            </div>
          )}
          <div className="legend">
            <span className="access-chip score">
              <span className="live-dot" />
              {tr(
                lang,
                'Ball beriladi (yakshanba 23:59 gacha)',
                'Earning points (until Sunday 23:59)',
                'Начисляются баллы (до вс 23:59)',
              )}
            </span>
            <span className="access-chip read">
              <BookOpen size={13} />
              {tr(
                lang,
                'O‘qish rejimi — ball berilmaydi',
                'Reading mode — no points',
                'Режим чтения — без баллов',
              )}
            </span>
            <span className="access-chip locked">
              <Lock size={13} />
              {tr(lang, 'Hali yopiq', 'Not open yet', 'Пока закрыта')}
            </span>
          </div>
        </div>
      </section>
      <div className="course-tabs" role="tablist" aria-label={course.title}>
        <button
          role="tab"
          aria-selected={!ranking}
          className={!ranking ? 'on' : ''}
          onClick={() => navigate('course/' + course.id)}
        >
          <BookOpen size={17} />
          {tr(lang, 'Mavzular', 'Topics', 'Темы')}
        </button>
        <button
          role="tab"
          aria-selected={ranking}
          className={ranking ? 'on' : ''}
          onClick={() => navigate('course/' + course.id + '/ranking')}
        >
          <Trophy size={17} />
          {t(lang, 'ranking')}
        </button>
      </div>
      {ranking ? (
        u ? (
          <Leaderboard embedded />
        ) : (
          <div className="soft-empty panel">
            <span>🏆</span>
            <p>
              {tr(
                lang,
                'Reytingni ko‘rish uchun hisobingizga kiring.',
                'Sign in to see the leaderboard.',
                'Войдите, чтобы увидеть рейтинг.',
              )}
            </p>
            <Button onClick={() => navigate('login')}>{t(lang, 'login')}</Button>
          </div>
        )
      ) : (
        courseTopics()
      )}
    </>
  );
  /** Mavzular ro'yxati (komponent emas — oddiy funksiya: har chizishda qayta o'rnatilmasin). */
  function courseTopics() {
    return (
      <>
        <div className="filter-row">
          <Button
            variant={!moduleId ? 'default' : 'outline'}
            size="sm"
            onClick={() => setModule('')}
          >
            {tr(lang, 'Hammasi', 'All', 'Все')}
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
          {list.map((l) => {
            const p = d.progress?.find((x) => x.lessonId === l.id),
              history = u?.readingHistory?.[l.id],
              access = accessOf(d, l.id),
              locked = access?.state === 'locked',
              number = courseLessons.findIndex((topic) => topic.id === l.id) + 1,
              pts = topicPoints(history),
              seen = Math.max(p ? seenCount(p) : 0, history?.seenSlides || 0);
            return (
              <button
                key={l.id}
                className={
                  'lesson-card panel' +
                  (locked ? ' is-locked' : '') +
                  (access?.state === 'score' ? ' is-live' : '')
                }
                onClick={() => open(l)}
                aria-disabled={locked}
              >
                <div className="mini-cover">
                  <TopicArt id={l.id} number={number} />
                  {(p?.completed || history?.status === 'read') && (
                    <Check className="completed-check" />
                  )}
                  {locked && (
                    <span className="lock-veil">
                      <Lock size={26} />
                    </span>
                  )}
                </div>
                <div className="lesson-card-top">
                  <span className="course-level">
                    {mods.find((m) => m.id === l.moduleId)?.title}
                  </span>
                  <AccessChip access={access} lang={lang} />
                </div>
                <h3>
                  {number}. {l.title}
                </h3>
                {hasAcademic ? (
                  <div className="lesson-points">
                    <PointsRing value={pts.total} size={58} />
                    <PointsBreakdown history={history} lang={lang} />
                  </div>
                ) : (
                  <>
                    <p>
                      {seen}/{l.slideCount} {tr(lang, 'slayd', 'slides', 'слайдов')}
                    </p>
                    <ProgressBar value={(seen / l.slideCount) * 100} />
                  </>
                )}
                <span className="lesson-link">
                  {locked
                    ? tr(lang, 'Hali ochilmagan', 'Not open yet', 'Ещё не открыта')
                    : access?.state === 'score' && access.due
                      ? `⏳ ${dueText(access.due, lang).date} ${tr(lang, 'gacha', '', 'до')}`
                      : history && history.status !== 'new'
                        ? tr(lang, 'Davom etish', 'Continue', 'Продолжить')
                        : tr(lang, 'Boshlash', 'Start', 'Начать')}
                  {!locked && <ChevronRight size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        {!list.length && <div className="empty-state">{t(lang, 'empty')}</div>}
      </>
    );
  }
}

/* ============================== YUTUQLAR ============================== */
type Achievement = {
  id: string;
  emoji: string;
  name: [string, string, string];
  desc: [string, string, string];
  value: number;
  goal: number;
};
/** Yutuqlar o'qish natijalaridan avtomatik hisoblanadi (asl bazadagi ball, slayd, vaqt, test). */
export function achievementsOf(d: Data): Achievement[] {
  const c = courseTotals(d),
    u = d.user,
    total = u?.academicPoints ?? c.points,
    manual = Object.keys(u?.manualMarks || {}).length,
    earned = new Set(d.earned || []);
  return [
    {
      id: 'start',
      emoji: '🌱',
      name: ['Birinchi qadam', 'First step', 'Первый шаг'],
      desc: ['Birinchi mavzuni boshlang', 'Start your first topic', 'Начните первую тему'],
      value: c.started,
      goal: 1,
    },
    {
      id: 'reader',
      emoji: '📖',
      name: ['Kitobxon', 'Bookworm', 'Книголюб'],
      desc: [
        'Bitta mavzuning barcha slaydlarini o‘qing',
        'Read every slide of one topic',
        'Прочитайте все слайды одной темы',
      ],
      value: c.read,
      goal: 1,
    },
    {
      id: 'hour',
      emoji: '⏱️',
      name: ['Bir soatlik seans', 'One-hour session', 'Часовая сессия'],
      desc: [
        'Bitta mavzuni 1 soat o‘qing (20/20)',
        'Read one topic for an hour (20/20)',
        'Читайте одну тему час (20/20)',
      ],
      value: c.fullTime,
      goal: 1,
    },
    {
      id: 'test',
      emoji: '🧠',
      name: ['Test ustasi', 'Test master', 'Мастер тестов'],
      desc: ['Bitta testdan 50/50 oling', 'Score 50/50 on one test', 'Получите 50/50 за тест'],
      value: c.fullTest,
      goal: 1,
    },
    {
      id: 'hundred',
      emoji: '💯',
      name: ['Yuz ball', 'Hundred points', 'Сто баллов'],
      desc: [
        'Bitta mavzudan to‘liq 100 ball',
        'Earn the full 100 on a topic',
        'Получите 100 баллов за тему',
      ],
      value: c.perfect,
      goal: 1,
    },
    {
      id: 'three',
      emoji: '🔥',
      name: ['Uchlik', 'Hat-trick', 'Хет-трик'],
      desc: ['3 ta mavzuni to‘liq o‘qing', 'Fully read 3 topics', 'Полностью прочитайте 3 темы'],
      value: c.read,
      goal: 3,
    },
    {
      id: 'grade5',
      emoji: '⭐',
      name: ['A’lochi', 'Top marks', 'Отличник'],
      desc: ['3 ta mavzudan «5» baho oling', 'Get a 5 in 3 topics', 'Получите «5» по 3 темам'],
      value: c.grade5,
      goal: 3,
    },
    {
      id: 'half',
      emoji: '🚀',
      name: ['Yarim yo‘l', 'Halfway', 'Полпути'],
      desc: ['8 ta mavzuni boshlang', 'Start 8 topics', 'Начните 8 тем'],
      value: c.started,
      goal: 8,
    },
    {
      id: 'p300',
      emoji: '🥉',
      name: ['300 ball', '300 points', '300 баллов'],
      desc: ['Umumiy ball 300 dan oshsin', 'Reach 300 points in total', 'Наберите 300 баллов'],
      value: total,
      goal: 300,
    },
    {
      id: 'p700',
      emoji: '🥈',
      name: ['700 ball', '700 points', '700 баллов'],
      desc: ['Umumiy ball 700 dan oshsin', 'Reach 700 points in total', 'Наберите 700 баллов'],
      value: total,
      goal: 700,
    },
    {
      id: 'p1200',
      emoji: '🥇',
      name: ['1200 ball', '1200 points', '1200 баллов'],
      desc: ['Umumiy ball 1200 dan oshsin', 'Reach 1200 points in total', 'Наберите 1200 баллов'],
      value: total,
      goal: 1200,
    },
    {
      id: 'practice',
      emoji: '🧑‍🏫',
      name: ['Amaliyotchi', 'Practitioner', 'Практик'],
      desc: [
        'Amaliy mashg‘ulotdan baho oling',
        'Get a practical-class mark',
        'Получите оценку за практику',
      ],
      value: manual,
      goal: 1,
    },
    {
      id: 'graduate',
      emoji: '🎓',
      name: ['Fan bitiruvchisi', 'Course graduate', 'Выпускник курса'],
      desc: ['Barcha mavzularni to‘liq o‘qing', 'Fully read every topic', 'Прочитайте все темы'],
      value: c.read,
      goal: c.lessons || 15,
    },
    {
      id: 'top',
      emoji: '👑',
      name: ['Guruh yetakchisi', 'Group leader', 'Лидер группы'],
      desc: [
        'O‘qituvchi tomonidan tasdiqlanadi',
        'Approved by the teacher',
        'Подтверждается преподавателем',
      ],
      value: earned.has('top') ? 1 : 0,
      goal: 1,
    },
    {
      id: 'teacher',
      emoji: '🏅',
      name: ['Ustoz e’tirofi', 'Teacher’s praise', 'Признание преподавателя'],
      desc: [
        'O‘qituvchi alohida taqdirlagan',
        'A special award from the teacher',
        'Особая награда преподавателя',
      ],
      value: earned.has('teacher') ? 1 : 0,
      goal: 1,
    },
  ];
}
function AchievementsPreview() {
  const { data, lang } = useApp(),
    list = achievementsOf(data!),
    done = list.filter((a) => a.value >= a.goal),
    next = list.filter((a) => a.value < a.goal).sort((a, b) => b.value / b.goal - a.value / a.goal);
  const L = (x: [string, string, string]) => (lang === 'en' ? x[1] : lang === 'ru' ? x[2] : x[0]);
  return (
    <section className="panel badge-preview">
      <div className="section-heading">
        <h3>🏆 {t(lang, 'badges')}</h3>
        <button aria-label={t(lang, 'badges')} onClick={() => navigate('badges')}>
          {done.length}/{list.length}
          <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="badge-icons">
        {[...done.slice(-3), ...next].slice(0, 4).map((a) => (
          <div className={a.value >= a.goal ? 'earned' : ''} key={a.id} title={L(a.name)}>
            <span>{a.emoji}</span>
          </div>
        ))}
      </div>
      {next[0] && (
        <p>
          {tr(lang, 'Keyingisi', 'Next', 'Следующее')}: <b>{L(next[0].name)}</b> — {L(next[0].desc)}
        </p>
      )}
    </section>
  );
}
export function Badges() {
  const { data, lang } = useApp(),
    list = achievementsOf(data!);
  const L = (x: [string, string, string]) => (lang === 'en' ? x[1] : lang === 'ru' ? x[2] : x[0]);
  const done = list.filter((a) => a.value >= a.goal).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {tr(lang, 'HAR BIR QADAM MUHIM', 'EVERY STEP COUNTS', 'КАЖДЫЙ ШАГ ВАЖЕН')}
          </span>
          <h1>🏆 {t(lang, 'badges')}</h1>
          <p>
            {tr(
              lang,
              `${list.length} ta yutuqdan ${done} tasi olingan. Yutuqlar o‘qish natijalaringizdan avtomatik hisoblanadi; ular rasmiy akademik unvon emas.`,
              `${done} of ${list.length} achievements unlocked. They are calculated from your study results and are not academic qualifications.`,
              `Получено ${done} из ${list.length}. Достижения считаются по вашим учебным результатам и не являются академическими званиями.`,
            )}
          </p>
        </div>
      </div>
      {!data?.user && (
        <div className="soft-empty panel">
          <span>🔐</span>
          <p>
            {tr(
              lang,
              'Yutuqlarni ko‘rish uchun hisobingizga kiring.',
              'Log in to see your achievements.',
              'Войдите, чтобы увидеть достижения.',
            )}
          </p>
        </div>
      )}
      <div className="badge-grid">
        {list.map((a) => {
          const earned = a.value >= a.goal,
            pct = Math.min(100, (a.value / a.goal) * 100);
          return (
            <div className={'badge-card panel ' + (earned ? 'earned' : 'locked')} key={a.id}>
              <div className="badge-medallion">
                <span className="badge-emoji">{a.emoji}</span>
              </div>
              <h3>{L(a.name)}</h3>
              <p>{L(a.desc)}</p>
              {earned ? (
                <span className="badge-state done">
                  <Check size={15} /> {tr(lang, 'Olingan', 'Unlocked', 'Получено')}
                </span>
              ) : (
                <div className="badge-progress">
                  <ProgressBar value={pct} />
                  <small>
                    {num(Math.min(a.value, a.goal))} / {a.goal}
                  </small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
