'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Gamepad2,
  Trophy,
  Medal,
  User,
  GraduationCap,
  Shield,
  Search,
  Bell,
  Menu,
  MessageSquare,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  LogOut,
  Download,
  ChevronRight,
  LogIn,
} from 'lucide-react';
import { Provider, useApp } from './provider';
import {
  Dashboard,
  CourseList,
  Badges,
  SidebarCurrent,
  achievementsOf,
  navigate,
} from './dashboard';
import { courseTotals, durationText, num, tr } from '@/lib/points';
import { LessonView, QuizView } from './lesson';
import { AuthPanel } from './auth-panel';
import { Leaderboard } from './leaderboard';
import { Games } from './games';
import { Staff } from './staff';
import { InstallApp } from './install-app';
import { NativeSurface } from './native-surface';
import { ChatPage } from './chat-page';
import { AcademicHistory } from './academic-history';
import { ChangePassword } from './change-password';
import { Button } from './ui/button';
import { t, roleLabel, type Key } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
export function StudyQuest() {
  const {
      data,
      lang,
      setLang,
      dark,
      setDark,
      loading,
      error,
      refresh,
      message,
      toast,
      setLogin,
      login,
      logout,
      demoLogin,
      legacy,
    } = useApp(),
    [view, setView] = useState('home'),
    [menu, setMenu] = useState(false),
    [notifications, setNotifications] = useState(false),
    [install, setInstall] = useState<any>(null);
  useEffect(() => {
    const update = () => {
      setView(location.hash.slice(1) || 'home');
      setMenu(false);
      window.scrollTo(0, 0);
    };
    update();
    window.addEventListener('hashchange', update);
    const installEvent = (e: Event) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener('beforeinstallprompt', installEvent);
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw-studyquest.js').catch(() => {});
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('beforeinstallprompt', installEvent);
    };
  }, []);
  if (loading && !data)
    return (
      <div className="app-loading">
        <img
          className="brand-logo loading-logo"
          src="/terdu-logo.png"
          alt="TerDU"
          width="72"
          height="72"
        />
        <p>Tadbirkorlik asoslari</p>
        <div className="loading-line" />
      </div>
    );
  if (data?.adminOnly) return <AuthPanel />;
  if (login)
    return (
      <AuthPanel
        onClose={() => {
          setLogin(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  if (!data && view.split('/')[0] === 'login') return <AuthPanel />;
  if (!data)
    return (
      <div className="error-page">
        <h1>Tadbirkorlik asoslari</h1>
        <p>{error}</p>
        <Button onClick={refresh}>
          {lang === 'uz' ? 'Qayta urinish' : lang === 'ru' ? 'Повторить' : 'Try again'}
        </Button>
        <a href="#login">{t(lang, 'login')}</a>
      </div>
    );
  const user = data.user,
    role = user?.role,
    mainView = view.split('/')[0],
    id = view.split('/')[1];
  const nav: { id: string; key: Key; icon: typeof BookOpen }[] = [
    { id: 'home', key: 'home', icon: LayoutDashboard },
    { id: 'courses', key: 'courses', icon: BookOpen },
    { id: 'arena', key: 'arena', icon: Gamepad2 },
    { id: 'ranking', key: 'ranking', icon: Trophy },
    { id: 'badges', key: 'badges', icon: Medal },
    ...(user ? [{ id: 'chat', key: 'chat' as Key, icon: MessageSquare }] : []),
  ];
  const signedIn = !!user || !!legacy;
  let content;
  if (view === 'login') content = <AuthPanel />;
  else if (mainView === 'lesson')
    content =
      user || data.mode === 'legacy' ? (
        <LessonView key={id + (user?.id || legacy?.id || '')} id={id} />
      ) : (
        <AuthPanel />
      );
  else if (mainView === 'quiz')
    content = user ? <QuizView key={id + user.id} id={id} /> : <AuthPanel />;
  else if (mainView === 'course' || mainView === 'courses')
    content = <CourseList courseId={mainView === 'course' ? id : undefined} />;
  else if (mainView === 'chat') content = user ? <ChatPage sub={id || ''} /> : <AuthPanel />;
  else if (view === 'badges') content = <Badges />;
  else if (view === 'ranking') content = user ? <Leaderboard /> : <AuthPanel />;
  else if (mainView === 'arena') content = <Games sub={view.split('/').slice(1).join('/')} />;
  else if (view === 'teacher')
    content = role === 'teacher' || role === 'admin' ? <Staff /> : <AuthPanel />;
  else if (view === 'admin') content = role === 'admin' ? <Staff admin /> : <AuthPanel />;
  else if (view === 'app')
    content = <InstallApp prompt={install} onInstalled={() => setInstall(null)} />;
  else if (view === 'profile')
    content = signedIn ? <Profile key={user?.id || legacy?.id} /> : <AuthPanel />;
  else content = <Dashboard />;
  if (content.type === AuthPanel) return content;
  if (mainView === 'lesson' && (user || data.mode === 'legacy'))
    return <main className="focus-learning">{content}</main>;
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label={
            lang === 'uz' ? 'Menyuni yopish' : lang === 'ru' ? 'Закрыть меню' : 'Close menu'
          }
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={'sidebar ' + (menu ? 'open' : '')}>
        <a className="sq-brand" href="#home">
          <img className="brand-logo" src="/terdu-logo.png" alt="TerDU" width="46" height="46" />
          <div>
            <b>Tadbirkorlik asoslari</b>
            <small>TERDU</small>
          </div>
        </a>
        <span className="nav-label">
          {lang === 'uz' ? 'BILIM OLISH' : lang === 'ru' ? 'ОБУЧЕНИЕ' : 'YOUR WORKSPACE'}
        </span>
        <nav>
          {nav.map((n) => (
            <a key={n.id} href={'#' + n.id} className={mainView === n.id ? 'active' : ''}>
              <n.icon size={19} />
              {t(lang, n.key)}
              {n.id === 'badges' && !!data.earned?.length && (
                <span className="nav-badge">{data.earned.length}</span>
              )}
            </a>
          ))}
          {(role === 'teacher' || role === 'admin') && (
            <a className={view === 'teacher' ? 'active' : ''} href="#teacher">
              <GraduationCap size={19} />
              {t(lang, 'teacher')}
            </a>
          )}
          {role === 'admin' && (
            <a className={view === 'admin' ? 'active' : ''} href="#admin">
              <Shield size={19} />
              {t(lang, 'admin')}
            </a>
          )}
        </nav>
        <div className="sidebar-bottom">
          <SidebarCurrent />
          <div className="sidebar-settings">
            <div className="lang-seg" role="group" aria-label="Til / Language">
              {(['uz', 'en', 'ru'] as Lang[]).map((l) => (
                <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label={t(lang, 'theme')}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
          </div>
          <a className="original-link" href="#app">
            <img src="/legacy/logo_tersu.png" alt="" width="27" height="27" />
            <span>
              TerDU ·{' '}
              {lang === 'uz' ? 'Telefon ilovasi' : lang === 'ru' ? 'Приложение' : 'Install app'}
            </span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-header">
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={lang === 'uz' ? 'Menyu' : lang === 'ru' ? 'Меню' : 'Menu'}
            onClick={() => setMenu(true)}
          >
            <Menu size={22} />
          </Button>
          <SearchBox />
          <div className="header-actions">
            <select
              aria-label={lang === 'uz' ? 'Til' : lang === 'ru' ? 'Язык' : 'Language'}
              className="language-switch"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="uz">UZ</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
            <Button
              variant="ghost"
              size="icon"
              className="theme-toggle"
              aria-label={t(lang, 'theme')}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
            <div className="notification-wrap">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t(lang, 'notifications')}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {!!data.notifications?.length && <i className="notification-dot" />}
              </Button>
              {notifications && (
                <div className="notification-menu panel">
                  <h3>{t(lang, 'notifications')}</h3>
                  {data.notifications?.length ? (
                    data.notifications.map((n: any) => <p key={n.id}>{n.title || n.message}</p>)
                  ) : (
                    <p>{t(lang, 'empty')}</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="header-profile"
              onClick={() => navigate(signedIn ? 'profile' : 'login')}
              aria-label={t(lang, signedIn ? 'profile' : 'login')}
            >
              <span>{(user?.name || legacy?.name || 'T')[0]}</span>
              <div>
                <b>{user?.name?.split(' ')[0] || legacy?.name || t(lang, 'login')}</b>
                <small>{roleLabel(lang, role, user?.learnerType) || 'Tadbirkorlik asoslari'}</small>
              </div>
            </button>
          </div>
        </header>
        {data.mode === 'demo' && (
          <div className="demo-banner">
            <span>{t(lang, 'demo')}</span>
            <select
              aria-label={lang === 'uz' ? 'Demo rol' : lang === 'ru' ? 'Демо-роль' : 'Demo role'}
              value={role || ''}
              onChange={(e) => demoLogin(e.target.value).catch((e) => toast(e.message))}
            >
              <option value="">{t(lang, 'login')}</option>
              <option value="student">{roleLabel(lang, 'student')}</option>
              <option value="teacher">{roleLabel(lang, 'teacher')}</option>
              <option value="admin">{roleLabel(lang, 'admin')}</option>
            </select>
          </div>
        )}
        {data.limited && (
          <div role="status" className="inline-error">
            {data.serviceMessage}
          </div>
        )}
        {error && (
          <div role="alert" className="inline-error">
            {error}
            <button onClick={refresh}>↻</button>
          </div>
        )}
        <main className="app-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Tadbirkorlik asoslari · TerDU</span>
          <span>{t(lang, 'tagline')}</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label={t(lang, 'menu')}>
        {[
          { id: 'home', label: t(lang, 'navHome'), icon: LayoutDashboard },
          { id: 'courses', label: t(lang, 'courses'), icon: BookOpen },
          { id: 'arena', label: t(lang, 'navArena'), icon: Gamepad2 },
          { id: 'ranking', label: t(lang, 'ranking'), icon: Trophy },
          { id: 'badges', label: t(lang, 'navBadges'), icon: Medal },
          ...(nav.some((n) => n.id === 'chat')
            ? [{ id: 'chat', label: t(lang, 'navChat'), icon: MessageSquare }]
            : signedIn
              ? [{ id: 'profile', label: t(lang, 'profile'), icon: User }]
              : [{ id: 'login', label: t(lang, 'login'), icon: LogIn }]),
        ].map((n) => (
          <a
            key={n.id}
            href={'#' + n.id}
            className={
              mainView === n.id || (n.id === 'courses' && mainView === 'course') ? 'active' : ''
            }
            aria-current={mainView === n.id ? 'page' : undefined}
          >
            <n.icon size={22} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
function Profile() {
  const { data, lang, call, toast, legacy, setLogin, logout } = useApp(),
    u = data?.user,
    [name, setName] = useState(u?.name || legacy?.name || ''),
    [visible, setVisible] = useState(u?.leaderboardVisible !== false),
    [advanced, setAdvanced] = useState(false);
  const totals = courseTotals(data!),
    awards = achievementsOf(data!),
    earned = awards.filter((a) => a.value >= a.goal).length,
    group = u?.learnerType === 'independent' ? '' : u?.classId || legacy?.group || '',
    shown = u?.name || legacy?.name || name,
    initials = shown
      .split(' ')
      .map((x) => x[0])
      .slice(0, 2)
      .join('');
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {tr(lang, 'SHAXSIY SAHIFA', 'YOUR SPACE', 'ЛИЧНЫЙ КАБИНЕТ')}
          </span>
          <h1>{t(lang, 'profile')}</h1>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut size={16} />
          {t(lang, 'logout')}
        </Button>
      </div>
      <section className="profile-hero">
        <div className="profile-hero-id">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2>{shown}</h2>
            <p>
              {roleLabel(lang, u?.role || 'student', u?.learnerType)}
              {group ? ' · ' + group : ''}
            </p>
            <small>ID: {u?.id || legacy?.id}</small>
          </div>
        </div>
        {u?.readingHistory && (
          <div className="profile-hero-stats">
            <div>
              <span>🏅</span>
              <b>{num(u.academicPoints ?? totals.points)}</b>
              <small>{tr(lang, 'Umumiy ball', 'Total points', 'Общий балл')}</small>
            </div>
            <div>
              <span>📖</span>
              <b>
                {totals.read}/{totals.lessons}
              </b>
              <small>{tr(lang, 'O‘qilgan mavzular', 'Topics read', 'Прочитано тем')}</small>
            </div>
            <div>
              <span>⏱️</span>
              <b>{durationText(totals.seconds, lang)}</b>
              <small>{tr(lang, 'O‘qish vaqti', 'Reading time', 'Время чтения')}</small>
            </div>
            <button onClick={() => navigate('badges')}>
              <span>🏆</span>
              <b>
                {earned}/{awards.length}
              </b>
              <small>{t(lang, 'badges')}</small>
            </button>
          </div>
        )}
      </section>
      <div className="profile-layout">
        <div className="profile-main">
          <AcademicHistory />
          {!u?.readingHistory && (
            <div className="soft-empty panel">
              <span>📚</span>
              <p>
                {tr(
                  lang,
                  'Mavzularni o‘qishni boshlang — har bir mavzu bo‘yicha ballaringiz shu yerda ko‘rinadi.',
                  'Start reading topics — your points for each topic will appear here.',
                  'Начните читать темы — здесь появятся баллы по каждой теме.',
                )}
              </p>
            </div>
          )}
        </div>
        <aside className="profile-side">
          <section className="panel profile-card">
            <h2>⚙️ {tr(lang, 'Shaxsiy ma’lumotlar', 'Personal details', 'Личные данные')}</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await call('profile', { name, leaderboardVisible: visible });
                  toast(tr(lang, 'Saqlandi', 'Saved', 'Сохранено'));
                } catch (err) {
                  toast((err as Error).message);
                }
              }}
            >
              <label>
                {tr(lang, 'Ism va familiya', 'Full name', 'Имя и фамилия')}
                <input
                  required
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />
                {tr(
                  lang,
                  'Platforma reytingida ko‘rinish',
                  'Show me on the leaderboard',
                  'Показывать меня в рейтинге',
                )}
              </label>
              <p className="muted">
                {tr(
                  lang,
                  'Umumiy akademik reytingda ism-familiya, guruh va ball ko‘rinadi.',
                  'The academic leaderboard shows your name, group and points.',
                  'В академическом рейтинге видны имя, группа и баллы.',
                )}
              </p>
              <Button disabled={!u}>{t(lang, 'save')}</Button>
            </form>
          </section>
          <ChangePassword />
          <section className="panel profile-card">
            <h2>👥 {tr(lang, 'Hisob va guruh', 'Account and group', 'Аккаунт и группа')}</h2>
            <p className="muted">
              {u?.learnerType === 'independent'
                ? tr(
                    lang,
                    'Mustaqil ta’lim · universitet guruhi talab qilinmaydi.',
                    'Independent learning · no university group required.',
                    'Самостоятельное обучение · группа не требуется.',
                  )
                : tr(
                    lang,
                    'Guruhni almashtirish yoki hisob ma’lumotlarini ko‘rish.',
                    'Change your group or view account details.',
                    'Смена группы и данные аккаунта.',
                  )}
            </p>
            <Button
              variant="outline"
              onClick={() => (legacy ? setAdvanced(!advanced) : setLogin(true))}
            >
              {tr(lang, 'Hisob ma’lumotlari', 'Account details', 'Данные аккаунта')}
              <ArrowUpRight size={16} />
            </Button>
          </section>
        </aside>
      </div>
      {advanced && (
        <section className="panel">
          <NativeSurface
            className="native-workspace"
            title={tr(lang, 'Hisob va guruh', 'Account and group', 'Аккаунт и группа')}
            src="/legacy/index.html?sqEmbed=account"
          />
        </section>
      )}
    </>
  );
}

/* Qidiruv: natijalar shu yerning o'zida, ochiladigan ro'yxatda (sahifa almashmaydi).
   ↑/↓ bilan tanlash, Enter — ochish, Esc — yopish. Mavzu raqami bilan ham topiladi («6» yoki «6-mavzu»). */
function SearchBox() {
  const { data, lang, call, toast, setLogin } = useApp(),
    [q, setQ] = useState(''),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const norm = (v: string) =>
    v
      .toLocaleLowerCase()
      .replace(/[ʻʼ‘’`´]/g, "'")
      .trim();
  const query = norm(q);
  const courseTitle = (id: string) => data?.courses.find((c) => c.id === id)?.title || '';
  const results =
    !query || !data
      ? []
      : [
          ...data.courses
            .filter((c) => norm(c.title).includes(query))
            .map((c) => ({
              kind: 'course' as const,
              id: c.id,
              title: c.title,
              sub: t(lang, 'courses'),
            })),
          ...data.lessons
            .slice()
            .sort((a, b) => a.order - b.order)
            .filter((l) => {
              const n = String(l.order + 1);
              return (
                norm(l.title).includes(query) ||
                query === n ||
                norm(n + '-mavzu').startsWith(query) ||
                norm(n + ' mavzu').startsWith(query)
              );
            })
            .map((l) => ({
              kind: 'lesson' as const,
              id: l.id,
              title: l.title,
              sub:
                (lang === 'en'
                  ? 'Topic ' + (l.order + 1)
                  : lang === 'ru'
                    ? 'Тема ' + (l.order + 1)
                    : l.order + 1 + '-mavzu') +
                ' · ' +
                courseTitle(l.courseId),
            })),
        ].slice(0, 8);
  async function go(r: (typeof results)[number] | undefined) {
    if (!r || !data) return;
    setQ('');
    setOpen(false);
    if (r.kind === 'course') return navigate('course/' + r.id);
    const l = data.lessons.find((x) => x.id === r.id)!;
    if (data.mode === 'legacy' || data.limited) return navigate('lesson/' + l.id);
    if (!data.user) {
      if (data.mode === 'demo') navigate('login');
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
    <div className="search-wrap">
      <label className="search-box">
        <Search size={18} />
        <input
          value={q}
          type="search"
          role="combobox"
          aria-expanded={open && !!query}
          aria-controls="search-results"
          aria-label={t(lang, 'search')}
          placeholder={t(lang, 'search')}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(results.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              void go(results[active]);
            } else if (e.key === 'Escape') {
              setQ('');
              setOpen(false);
            }
          }}
        />
        {q && (
          <button
            type="button"
            className="search-clear"
            aria-label={lang === 'uz' ? 'Tozalash' : lang === 'ru' ? 'Очистить' : 'Clear'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQ('')}
          >
            <X size={16} />
          </button>
        )}
      </label>
      {open && !!query && (
        <div className="search-results panel" id="search-results" role="listbox">
          {results.length ? (
            results.map((r, i) => (
              <button
                key={r.kind + r.id}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => void go(r)}
              >
                <span className={'search-result-icon ' + r.kind}>
                  {r.kind === 'course' ? <GraduationCap size={17} /> : <BookOpen size={17} />}
                </span>
                <span>
                  <b>{r.title}</b>
                  <small>{r.sub}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <p className="search-empty">
              {lang === 'uz'
                ? 'Hech narsa topilmadi. Mavzu nomi yoki raqamini yozib ko‘ring.'
                : lang === 'ru'
                  ? 'Ничего не найдено. Введите название или номер темы.'
                  : 'Nothing found. Try a topic title or number.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
