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
} from 'lucide-react';
import { Provider, useApp } from './provider';
import { Dashboard, CourseList, Badges, navigate } from './dashboard';
import { LessonView, QuizView } from './lesson';
import { AuthPanel } from './auth-panel';
import { Leaderboard } from './leaderboard';
import { Games } from './games';
import { Staff } from './staff';
import { InstallApp } from './install-app';
import { NativeSurface } from './native-surface';
import { AcademicHistory } from './academic-history';
import { Button } from './ui/button';
import { t, type Key } from '@/lib/i18n';
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
      logout,
      demoLogin,
      legacy,
    } = useApp(),
    [view, setView] = useState('home'),
    [search, setSearch] = useState(''),
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
        <div className="brand-mark">
          T<span>✦</span>
        </div>
        <p>Tadbirkorlik asoslari</p>
        <div className="loading-line" />
      </div>
    );
  if (data?.adminOnly) return <AuthPanel />;
  if (!data && view.split('/')[0] === 'login') return <AuthPanel />;
  if (!data)
    return (
      <div className="error-page">
        <h1>Tadbirkorlik asoslari</h1>
        <p>{error}</p>
        <Button onClick={refresh}>{lang === 'uz' ? 'Qayta urinish' : 'Try again'}</Button>
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
    ...(user && (role !== 'student' || user.learnerType === 'university')
      ? [{ id: 'chat', key: 'chat' as Key, icon: MessageSquare }]
      : []),
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
    content = <CourseList courseId={mainView === 'course' ? id : undefined} search={search} />;
  else if (view === 'chat')
    content =
      user && (role !== 'student' || user.learnerType === 'university') ? (
        <section className="panel">
          <h1>{t(lang, 'chat')}</h1>
          <NativeSurface
            className="native-workspace"
            title={t(lang, 'chat')}
            src={'/legacy/index.html?sqEmbed=chat' + (data.mode === 'demo' ? '&sqDemo=1' : '')}
          />
        </section>
      ) : (
        <AuthPanel />
      );
  else if (view === 'badges') content = <Badges />;
  else if (view === 'ranking') content = user ? <Leaderboard /> : <AuthPanel />;
  else if (mainView === 'arena') content = <Games live={id === 'live'} />;
  else if (view === 'teacher') content = user ? <Staff /> : <AuthPanel />;
  else if (view === 'admin') content = user ? <Staff admin /> : <AuthPanel />;
  else if (view === 'app')
    content = <InstallApp prompt={install} onInstalled={() => setInstall(null)} />;
  else if (view === 'profile')
    content = signedIn ? <Profile key={user?.id || legacy?.id} /> : <AuthPanel />;
  else content = <Dashboard />;
  if (mainView === 'lesson' && (user || data.mode === 'legacy'))
    return <main className="focus-learning">{content}</main>;
  return (
    <div className="app-shell">
      {menu && (
        <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenu(false)} />
      )}
      <aside className={'sidebar ' + (menu ? 'open' : '')}>
        <a className="sq-brand" href="#home">
          <span className="brand-mark">
            T<span>✦</span>
          </span>
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
          <div className="sidebar-note">
            <span>✦</span>
            <b>
              {lang === 'uz'
                ? 'Kelajagingizga sarmoya.'
                : lang === 'en'
                  ? 'Invest in your future.'
                  : 'Вклад в ваше будущее.'}
            </b>
            <p>
              {lang === 'uz'
                ? 'Har kuni yangi bilim.'
                : lang === 'en'
                  ? 'A little more knowledge, every day.'
                  : 'Новые знания каждый день.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('courses')}>
              {t(lang, 'courses')}
              <ChevronRight size={14} />
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
            aria-label="Menu"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} />
          </Button>
          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              placeholder={t(lang, 'search')}
              onChange={(e) => {
                setSearch(e.target.value);
                if (view !== 'courses') navigate('courses');
              }}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="header-actions">
            <select
              aria-label="Language"
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
                <small>{role || 'Tadbirkorlik asoslari'}</small>
              </div>
            </button>
          </div>
        </header>
        {data.mode === 'demo' && (
          <div className="demo-banner">
            <span>{t(lang, 'demo')}</span>
            <select
              aria-label="Demo role"
              value={role || ''}
              onChange={(e) => demoLogin(e.target.value).catch((e) => toast(e.message))}
            >
              <option value="">{t(lang, 'login')}</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Administrator</option>
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
          <span>Learn with purpose. Grow with confidence.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          ...nav.filter((n) => n.id !== 'badges' && n.id !== 'chat'),
          { id: 'profile', key: 'profile' as Key, icon: User },
        ].map((n) => (
          <a key={n.id} href={'#' + n.id} className={mainView === n.id ? 'active' : ''}>
            <n.icon size={21} />
            <span>{t(lang, n.key)}</span>
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
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SPACE</span>
          <h1>{t(lang, 'profile')}</h1>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut size={16} />
          {t(lang, 'logout')}
        </Button>
      </div>
      <section className="panel editor profile-editor">
        <div className="profile-avatar">{name[0]}</div>
        <p className="muted">{u?.id || legacy?.id}</p>
        {u?.academicPoints !== undefined && (
          <div className="academic-summary">
            <b>{u.academicPoints}</b>
            <span>
              {lang === 'uz'
                ? 'Asl platformadagi akademik ball'
                : lang === 'ru'
                  ? 'Академические баллы исходной платформы'
                  : 'Academic points in the original platform'}
            </span>
          </div>
        )}
        <AcademicHistory />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await call('profile', { name, leaderboardVisible: visible });
              toast(lang === 'uz' ? 'Saqlandi' : 'Saved');
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <label>
            {lang === 'uz' ? 'Ism va familiya' : lang === 'ru' ? 'Имя и фамилия' : 'Full name'}
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
            {t(lang, 'privacy')}
          </label>
          <p className="muted">
            {u?.learnerType === 'independent'
              ? lang === 'uz'
                ? 'Mustaqil ta’lim · universitet guruhi talab qilinmaydi.'
                : lang === 'ru'
                  ? 'Самостоятельное обучение · группа не требуется.'
                  : 'Independent learning · no university group required.'
              : u?.classId || legacy?.group}
          </p>
          <Button disabled={!u}>{t(lang, 'save')}</Button>
        </form>
        <Button
          variant="outline"
          onClick={() => (legacy ? setAdvanced(!advanced) : setLogin(true))}
        >
          {lang === 'uz' ? 'Hisob va guruh ma’lumotlari' : 'Account and class details'}
          <ArrowUpRight size={16} />
        </Button>
      </section>
      {advanced && (
        <section className="panel">
          <NativeSurface
            className="native-workspace"
            title="Hisob va guruh"
            src="/legacy/index.html?sqEmbed=account"
          />
        </section>
      )}
    </>
  );
}
