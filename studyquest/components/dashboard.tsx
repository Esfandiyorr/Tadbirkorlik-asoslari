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
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  GraduationCap,
  LibraryBig,
  Lightbulb,
  Timer,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { TopicArt, CourseArt } from './topic-art';
import { PushInvite } from './push-toggle';
import { SiteVisual } from './site-content';
import { visualPath } from '@/lib/site-visuals';
import { useAcademicBoard } from './avatars';
import { HomeBanner } from './home-banner';
import { PremiumSideCard, SubscriberMark } from './premium';
import { Leaderboard } from './leaderboard';
import { CourseGate, PaidCourseGate } from './course-gate';
import { CourseLessons } from './course-lessons';
import { ExamPrep } from './exam';
import { AccessChip, PointsRing, PointsBreakdown } from './points-ui';
import { t } from '@/lib/i18n';
import { isPlayApp } from '@/lib/play-app';
import { accessOf, courseTotals, dueText, durationText, num, topicPoints, tr } from '@/lib/points';
import type { Course, Data, Lang, Lesson, Progress } from '@/lib/types';

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
    // ⏳ tayyorlanayotgan dars — reja sahifasi; 📚 katalogdagi qo'shimcha fan bazada yo'q — «enroll» shart emas
    if (l.draft || d.courses.find((c) => c.id === l.courseId)?.extra)
      return navigate('lesson/' + l.id);
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

const sortedLessons = (d: Data, courseId = d.courses?.find((c) => !c.extra)?.id) =>
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
  return <LearnerHome key={data?.user?.id || legacy?.id} />;
}

/** Bosh sahifadagi bo'lim kartalari: Kurslar, O'yinlar, Kitoblar, Pullik xizmatlar, Chat — nomi, bitta ikonka va
    amal. Administrator «Sayt rasmlari»da ikonka o'rniga rasm qo'yishi mumkin (SiteVisual). */
function QuickLinks({ chat }: { chat: boolean }) {
  const { lang, data } = useApp();
  // 💼 Play Market ilovasida pullik xizmatlar ko'rsatilmaydi (lib/play-app.ts)
  const [play, setPlay] = useState(false);
  useEffect(() => setPlay(isPlayApp()), []);
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const n = data?.courses.length || 0;
  const main = data?.courses[0]?.id;
  const topics = data && main ? sortedLessons(data, main).length : 0;
  // telefonda faqat asosiylari (Mavzular, Kurslar, Pullik xizmatlar); qolganlari — «extra» (☰ menyuda bor)
  const items: {
    id: string;
    icon: LucideIcon;
    emoji: string;
    name: string;
    hint: string;
    go: string;
    href?: string;
    extra?: boolean;
  }[] = [
    ...(main
      ? [
          {
            id: 'topics',
            href: 'course/' + main,
            icon: ListChecks,
            emoji: '📝',
            name: L('Mavzular', 'Topics', 'Темы'),
            hint: L(`${topics} ta mavzu`, `${topics} topics`, `Тем: ${topics}`),
            go: L('O‘qish', 'Study', 'Учиться'),
          },
        ]
      : []),
    {
      id: 'courses',
      icon: BookOpen,
      emoji: '📚',
      name: L('Kurslar', 'Courses', 'Курсы'),
      hint: L(`${n} ta kurs`, `${n} courses`, `Курсов: ${n}`),
      go: L('Davom etish', 'Continue', 'Продолжить'),
    },
    {
      id: 'arena',
      icon: Gamepad2,
      emoji: '🎮',
      name: L('O‘yinlar', 'Games', 'Игры'),
      hint: L('Jonli test va bellashuv', 'Live quiz and duels', 'Живой тест и дуэли'),
      go: L('O‘ynash', 'Play', 'Играть'),
      extra: true,
    },
    {
      id: 'library',
      icon: LibraryBig,
      emoji: '📖',
      name: L('Kitoblar', 'Books', 'Книги'),
      hint: L('Qo‘llanma va namunalar', 'Guides and templates', 'Пособия и шаблоны'),
      go: L('Ochish', 'Open', 'Открыть'),
      extra: true,
    },
    ...(!play && data?.servicesShown
      ? [
          {
            id: 'services',
            icon: BriefcaseBusiness,
            emoji: '💼',
            name: L('Pullik xizmatlar', 'Paid services', 'Платные услуги'),
            hint: L(
              'Taqdimot, dizayn, tarjima',
              'Slides, design, translation',
              'Слайды, дизайн, перевод',
            ),
            go: L('Buyurtma berish', 'Order', 'Заказать'),
          },
        ]
      : []),
    ...(chat
      ? [
          {
            id: 'chat',
            icon: MessageSquare,
            emoji: '💬',
            name: L('Chat', 'Chat', 'Чат'),
            hint: L('Guruhdoshlar bilan', 'With classmates', 'С одногруппниками'),
            go: L('Yozish', 'Write', 'Написать'),
            extra: true,
          },
        ]
      : []),
  ];
  return (
    <nav className="quick-links home-sections" aria-label={L('Bo‘limlar', 'Sections', 'Разделы')}>
      {items.map((x) => (
        <a
          key={x.id}
          href={'#' + (x.href || x.id)}
          className={'quick-link home-section is-' + x.id + (x.extra ? ' is-extra' : '')}
        >
          <SiteVisual className="hs-icon" imageKey={visualPath('home', x.id)} icon={x.emoji}>
            <x.icon size={22} strokeWidth={2} />
          </SiteVisual>
          <b>{x.name}</b>
          <small>{x.hint}</small>
          <span className="hs-go">
            {x.go} <ChevronRight size={15} aria-hidden="true" />
          </span>
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
  const avatarHome = u?.role === 'student' || u?.role === 'admin',
    board = useAcademicBoard(avatarHome);
  const avatar = avatarHome && !board.loading ? board.avatars.me : null;
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
  const chat = staff || university;
  return (
    <>
      <HomeBanner
        name={hello + ', ' + name.split(' ')[0]}
        board={board}
        avatarSpot={avatarHome}
        premium={!!avatar?.premium}
        lessons={lessons}
        open={open}
      />
      <CourseGate compact />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          {lesson && (
            <motion.section
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="home-course"
            >
              <TopicArt id={lesson.id} compact />
              <div className="hc-body">
                <span className="hc-kicker">
                  <BookOpen size={14} aria-hidden="true" />
                  {tr(lang, 'Joriy mavzu', 'Current topic', 'Текущая тема')}
                </span>
                <h2>
                  {lesson.order + 1}-{tr(lang, 'mavzu', 'topic', 'тема')}: {lesson.title}
                </h2>
                <div className="hc-meta">
                  <AccessChip access={access} lang={lang} showCountdown={false} />
                  {access?.state === 'score' && access.due && (
                    <span className="hc-due">
                      <Clock3 size={14} aria-hidden="true" /> {dueText(access.due, lang).date}{' '}
                      {tr(lang, 'gacha', '', 'до')}
                    </span>
                  )}
                </div>
              </div>
              <div className="hc-side">
                {hasAcademic ? (
                  <div className="hc-points">
                    <PointsRing
                      value={pts.total}
                      size={58}
                      label={tr(lang, 'Mavzu bali', 'Topic points', 'Баллы темы')}
                    />
                    <b>
                      {pts.remaining > 0
                        ? tr(
                            lang,
                            `Yana ${num(pts.remaining)} ball`,
                            `${num(pts.remaining)} points left`,
                            `Ещё ${num(pts.remaining)} балла`,
                          )
                        : tr(lang, '100 ball', '100 points', '100 баллов')}
                    </b>
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
          <QuickLinks chat={chat} />
          {/* 💎 telefonda obuna taklifi shu yerda (kompyuterda — chap menyuda) */}
          <PremiumSideCard className="is-home" />
          <PushInvite />
          <section className="stats-grid">
            {hasAcademic && university ? (
              <div className="stat-card">
                <SiteVisual
                  className="stat-emoji"
                  imageKey={visualPath('home', 'points')}
                  icon="🏅"
                >
                  <Award size={22} />
                </SiteVisual>
                <div>
                  <small>{tr(lang, 'Umumiy ball', 'Total points', 'Общий балл')}</small>
                  <strong>{num(u?.academicPoints ?? totals.points)}</strong>
                </div>
              </div>
            ) : null}
            <div className="stat-card">
              <SiteVisual className="stat-emoji" imageKey={visualPath('home', 'reading')} icon="📖">
                <BookOpenCheck size={22} />
              </SiteVisual>
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
                <SiteVisual className="stat-emoji" imageKey={visualPath('home', 'time')} icon="⏱️">
                  <Timer size={22} />
                </SiteVisual>
                <div>
                  <small>{tr(lang, 'O‘qish vaqti', 'Reading time', 'Время чтения')}</small>
                  <strong className="stat-text">{durationText(totals.seconds, lang)}</strong>
                </div>
              </div>
            )}
            {!staff && (
              <div className="stat-card">
                <SiteVisual
                  className="stat-emoji"
                  imageKey={visualPath('home', 'scoring')}
                  icon="🎯"
                >
                  <Target size={22} />
                </SiteVisual>
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
                  <Target size={19} aria-hidden="true" />
                  {tr(lang, 'Ball beradigan mavzular', 'Topics earning points', 'Темы с баллами')}
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
                              <Clock3 size={13} aria-hidden="true" /> {due.date}{' '}
                              {tr(lang, 'gacha', '', 'до')} · {due.left}
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
                  <span>
                    <BookOpen size={26} aria-hidden="true" />
                  </span>
                  <p>
                    {tr(
                      lang,
                      'Hozircha ball beriladigan mavzu yo‘q.',
                      'No topic is earning points right now.',
                      'Сейчас нет тем с баллами.',
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
              <h2>
                <GraduationCap size={19} aria-hidden="true" />
                {tr(lang, 'Mening kurslarim', 'My courses', 'Мои курсы')}
              </h2>
              <button onClick={() => navigate('courses')}>
                {tr(lang, 'Barcha mavzular', 'All topics', 'Все темы')}
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="course-grid">
              {d.courses.map((c) => {
                const topics = sortedLessons(d, c.id),
                  scoped = courseTotals(d, c.id),
                  done = topics.filter((l) => u?.readingHistory?.[l.id]?.status === 'read').length;
                return (
                  <button
                    className="course-card"
                    key={c.id}
                    onClick={() => navigate('course/' + c.id)}
                  >
                    <CourseArt title={c.title} kind={c.illustration} />
                    <div className="course-card-body">
                      <span className="course-level">
                        {c.closed || c.paid ? <CourseChip course={c} /> : 'TerDU · ' + c.difficulty}
                      </span>
                      <h3>{c.title}</h3>
                      <p>
                        {topics.length} {tr(lang, 'ta mavzu', 'topics', 'тем')}
                        <span>
                          {hasAcademic && university && !c.extra
                            ? `${num(scoped.points)} / ${scoped.max} ${tr(lang, 'ball', 'pts', 'баллов')}`
                            : `${done}/${topics.length}`}
                        </span>
                      </p>
                      <ProgressBar
                        value={
                          hasAcademic && university && !c.extra
                            ? (scoped.points / Math.max(1, scoped.max)) * 100
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
            <h3>
              {name}
              {avatar?.premium && <SubscriberMark />}
            </h3>
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
            <span>
              <Lightbulb size={20} aria-hidden="true" />
            </span>
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
            <img src="/unistay-logo.svg" alt="" width="26" height="26" />
            {tr(
              lang,
              'Unistay · talabalar platformasi',
              'Unistay · student platform',
              'Unistay · платформа для студентов',
            )}
          </span>
          <h1>
            Unistay
            <span>
              {tr(
                lang,
                'talabalar uchun interaktiv platforma',
                'an interactive platform for students',
                'интерактивная платформа для студентов',
              )}
            </span>
          </h1>
          <p>
            {tr(
              lang,
              '«Tadbirkorlik asoslari» va boshqa kurslar: ma’ruzalar — ko‘rgazmali taqdimotlar, bilim — testlar, jonli viktorina, o‘yinlar va reyting bilan mustahkamlanadi. Fan o‘qituvchisi — Isfandiyor Sayfiddinov.',
              '“Fundamentals of Entrepreneurship” and other courses: lectures come as visual presentations; knowledge is reinforced with tests, a live quiz, games and a leaderboard. Course teacher: Isfandiyor Sayfiddinov.',
              '«Основы предпринимательства» и другие курсы: лекции — наглядные презентации, знания закрепляются тестами, живой викториной, играми и рейтингом. Преподаватель — Исфандиёр Сайфиддинов.',
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
        {features.map(([e, h, p], index) => (
          <div className="guest-feature panel" key={h}>
            <SiteVisual imageKey={visualPath('home', 'guest-' + (index + 1))} icon={e} />
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
/** 🔒 Yopiq fan belgisi: fan hali tayyorlanmoqda — faqat o'qituvchi va administrator ko'radi. */
/** Qo'shimcha fan belgisi: 🔒 hammaga yopiq yoki 💳 pullik (ruxsat bo'lsa — ✅ sizga ochiq). */
function CourseChip({ course }: { course: Course }) {
  const { data, lang } = useApp();
  if (course.closed) return <ClosedCourseChip lang={lang} />;
  const open = data?.user?.role === 'admin' || data?.paid?.[course.id]?.ok;
  return open ? (
    <span className="course-paid-chip is-open">
      <Check size={12} />
      {tr(lang, 'Sizga ochiq', 'Open to you', 'Вам открыт')}
    </span>
  ) : (
    <span className="course-paid-chip">
      💳 {tr(lang, 'Pullik kurs', 'Paid course', 'Платный курс')}
    </span>
  );
}
function ClosedCourseChip({ lang }: { lang: Lang }) {
  return (
    <span className="course-closed-chip">
      <Lock size={12} />
      {tr(lang, 'Hammaga yopiq', 'Closed to everyone', 'Закрыт для всех')}
    </span>
  );
}
export function CourseList({
  courseId,
  sub,
}: {
  search?: string;
  courseId?: string;
  /** kurs ichidagi bo'lim: (bo'sh) — mavzular, 'ranking' — reyting, 'exam' — yakuniy testga tayyorgarlik */
  sub?: string;
}) {
  const { data, lang } = useApp(),
    d = data!,
    u = d.user,
    open = useOpenLesson();
  const course = courseId ? d.courses.find((x) => x.id === courseId) : null,
    mods = d.modules
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    courseLessons = sortedLessons(d, courseId),
    totals = courseTotals(d, courseId),
    hasAcademic = !!u?.readingHistory,
    university = u?.learnerType !== 'independent',
    ranking = sub === 'ranking',
    exam = sub === 'exam' && !course?.extra;
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
              scoped = courseTotals(d, c.id),
              done = topics.filter((l) => u?.readingHistory?.[l.id]?.status === 'read').length;
            return (
              <button key={c.id} className="course-card" onClick={() => navigate('course/' + c.id)}>
                <CourseArt title={c.title} kind={c.illustration} />
                <div className="course-card-body">
                  <span className="course-level">
                    {c.closed || c.paid ? <CourseChip course={c} /> : 'TerDU · ' + c.category}
                  </span>
                  <h3>{c.title}</h3>
                  <p className="course-desc">{c.description}</p>
                  <p>
                    <span>
                      {topics.length} {tr(lang, 'ta mavzu', 'topics', 'тем')}
                    </span>
                    <span>
                      {hasAcademic && university && !c.extra
                        ? `${num(scoped.points)} / ${scoped.max} ${tr(lang, 'ball', 'pts', 'баллов')}`
                        : `${done}/${topics.length}`}
                    </span>
                  </p>
                  <ProgressBar
                    value={
                      hasAcademic && university && !c.extra
                        ? (scoped.points / Math.max(1, scoped.max)) * 100
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
        <CourseArt title={course.title} kind={course.illustration} />
        <div className="course-banner-body">
          <span className="eyebrow">
            {tr(lang, 'FAN MAVZULARI', 'COURSE TOPICS', 'ТЕМЫ КУРСА')}
          </span>
          <h1>{course.title}</h1>
          {course.paid && d.user?.role === 'admin' && (
            <p className="course-paid-note" role="note">
              💳{' '}
              {tr(
                lang,
                'Pullik kurs: hamma ko‘radi, lekin darslarga faqat siz ruxsat bergan qatnashchilar kiradi. Ruxsatlar — «Sayt boshqaruvi → 🔑 Kursga ruxsat» bo‘limida (kursni tanlang).',
                'Paid course: everyone sees it, but only participants you approve can open the lessons. Manage access in “Site manager → 🔑 Course access” (choose the course).',
                'Платный курс: его видят все, но уроки открыты только одобренным вами участникам. Доступ — в «Управление сайтом → 🔑 Доступ к курсу» (выберите курс).',
              )}
            </p>
          )}
          {course.closed && (
            <p className="course-closed-note" role="note">
              <ClosedCourseChip lang={lang} />
              {tr(
                lang,
                'Bu fan hali tayyorlanmoqda: talabalar uni ko‘rmaydi va ocha olmaydi. Mavzular faqat o‘qituvchi va administratorga ko‘rinadi.',
                'This course is still being prepared: students cannot see or open it. Its topics are visible only to the teacher and the administrator.',
                'Курс ещё готовится: студенты его не видят и не могут открыть. Темы видны только преподавателю и администратору.',
              )}
            </p>
          )}
          <p>
            {courseLessons.length} {tr(lang, 'ta mavzu', 'topics', 'тем')} · {course.description}
          </p>
          {course.extra && (
            <div className="course-build" role="status">
              <span className="course-build-ready">
                ✅ {courseLessons.filter((l) => !l.draft).length}{' '}
                {tr(lang, 'ta dars tayyor', 'lessons ready', 'занятий готово')}
              </span>
              {courseLessons.some((l) => l.draft) && (
                <span className="course-build-wait">
                  ⏳ {courseLessons.filter((l) => l.draft).length}{' '}
                  {tr(lang, 'tasi tayyorlanmoqda', 'in preparation', 'готовится')}
                </span>
              )}
              {course.entry && <small>🎓 {course.entry}</small>}
            </div>
          )}
          {hasAcademic && university && !course.extra && (
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
          <div className="legend" hidden={course.extra}>
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
          aria-selected={!ranking && !exam}
          className={!ranking && !exam ? 'on' : ''}
          onClick={() => navigate('course/' + course.id)}
        >
          <BookOpen size={17} />
          {tr(lang, 'Mavzular', 'Topics', 'Темы')}
        </button>
        {!course.extra && (
          // 🏆 reyting — asosiy fanniki; qo'shimcha fanda (restoran kursi) hozircha ball va reyting yo'q
          <button
            role="tab"
            aria-selected={ranking}
            className={ranking ? 'on' : ''}
            onClick={() => navigate('course/' + course.id + '/ranking')}
          >
            <Trophy size={17} />
            {t(lang, 'ranking')}
          </button>
        )}
        {!course.extra && (
          // 🎯 yakuniy testga tayyorgarlik (pullik xizmat) — asosiy fanning 15 mavzusi bo'yicha
          <button
            role="tab"
            aria-selected={exam}
            className={exam ? 'on' : ''}
            onClick={() => navigate('course/' + course.id + '/exam')}
          >
            <Target size={17} />
            {tr(lang, 'Yakuniy test', 'Final exam', 'Итоговый тест')}
          </button>
        )}
      </div>
      {exam ? (
        <ExamPrep courseId={course.id} />
      ) : ranking ? (
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
        <>
          {course.paid ? <PaidCourseGate courseId={course.id} /> : !course.extra && <CourseGate />}
          <CourseLessons
            key={course.id}
            data={d}
            course={course}
            modules={mods}
            lessons={courseLessons}
            open={open}
          />
        </>
      )}
    </>
  );
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
