'use client';
import { useState, useRef, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { BookOpen, GraduationCap, Shield, ArrowRight, X, Mail } from 'lucide-react';
import { firebaseAuth, isNetworkError, networkMessage } from '@/lib/firebase-client';
import { useApp } from './provider';
import { Button } from './ui/button';
import { t, roleLabel } from '@/lib/i18n';
import { NativeSurface } from './native-surface';
export function AuthPanel({ onClose }: { onClose?: () => void }) {
  const { data, lang, refresh, toast, setLogin, demoLogin, useEmailMode } = useApp(),
    [register, setRegister] = useState(false),
    // 🎓 «Talabamisiz?» — birinchi qadam: TerDU talabasi → talaba bo'limi; boshqalar → email yoki Google
    [kind, setKind] = useState<'student' | 'other' | null>(null),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [googleError, setGoogleError] = useState(''),
    [design, pickDesign] = useLoginDesign();
  useEffect(() => {
    window.scrollTo(0, 0);
    try {
      const k = localStorage.getItem('sq-auth-kind');
      if (k === 'student' || k === 'other') setKind(k);
    } catch {}
  }, []);
  const choose = (k: 'student' | 'other' | null, fresh = true) => {
    setKind(k);
    // yangi tanlovda ro'yxatdan o'tish oynasi ochiladi (savol ro'yxatdan o'tish uchun); keyingi safar — kirish
    if (k === 'other') setRegister(fresh);
    try {
      if (k) localStorage.setItem('sq-auth-kind', k);
      else localStorage.removeItem('sq-auth-kind');
    } catch {}
  };
  const student = kind === 'student';
  async function googleLogin() {
    if (busy) return;
    setBusy(true);
    setGoogleError('');
    try {
      const a = firebaseAuth();
      if (!a)
        throw new Error(
          L(
            'Google orqali kirish hali sozlanmagan.',
            'Google sign-in is not set up yet.',
            'Вход через Google ещё не настроен.',
          ),
        );
      useEmailMode();
      // Keep the popup directly in the click handler, before any network waits.
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(a, provider);
      await refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') return;
      setGoogleError(
        isNetworkError(e)
          ? networkMessage(lang)
          : code === 'auth/popup-blocked'
            ? L(
                'Brauzer Google oynasini blokladi. Manzil qatoridagi belgi orqali pop-up oynalariga ruxsat bering va yana Google tugmasini bosing.',
                'The browser blocked the Google window. Allow pop-ups using the icon in the address bar and press the Google button again.',
                'Браузер заблокировал окно Google. Разрешите всплывающие окна через значок в адресной строке и снова нажмите кнопку Google.',
              )
            : code === 'auth/unauthorized-domain'
              ? L(
                  'Firebase Authentication → Settings → Authorized domains bo‘limiga ' +
                    location.hostname +
                    ' domenini qo‘shish kerak.',
                  'Add ' +
                    location.hostname +
                    ' under Firebase Authentication → Settings → Authorized domains.',
                  'Добавьте домен ' +
                    location.hostname +
                    ' в Firebase Authentication → Settings → Authorized domains.',
                )
              : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(reset = false) {
    setBusy(true);
    if (!reset) useEmailMode();
    try {
      const a = firebaseAuth();
      if (!a)
        throw new Error(
          lang === 'uz'
            ? 'Email orqali kirish hali yoqilmagan. Mavjud hisobingizdan foydalaning.'
            : lang === 'ru'
              ? 'Вход по email пока не включён. Используйте существующий аккаунт.'
              : 'Email login is not enabled yet. Use your existing account.',
        );
      if (reset) {
        await sendPasswordResetEmail(a, email);
        toast(
          lang === 'uz'
            ? 'Parolni tiklash xabari yuborildi.'
            : lang === 'ru'
              ? 'Письмо для сброса пароля отправлено.'
              : 'Password reset email sent.',
        );
        return;
      }
      if (register) {
        if (password.length < 8 || name.trim().length < 2)
          throw new Error(
            lang === 'uz'
              ? 'Ism va kamida 8 belgili parol kiriting.'
              : lang === 'ru'
                ? 'Введите имя и пароль не короче 8 символов.'
                : 'Enter your name and a password of at least 8 characters.',
          );
        const u = await createUserWithEmailAndPassword(a, email, password);
        await updateProfile(u.user, { displayName: name.trim() });
        // Auth listeners can create the initial profile before displayName is updated.
        const token = await u.user.getIdToken(true);
        const profile = await fetch('/api/platform', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'profile',
            input: { name: name.trim(), leaderboardVisible: true },
          }),
        });
        if (!profile.ok) throw new Error((await profile.json()).error);
      } else await signInWithEmailAndPassword(a, email, password);
      await refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      toast(
        isNetworkError(e)
          ? networkMessage(lang)
          : code
            ? lang === 'uz'
              ? 'Kirish bajarilmadi. Email, parol va kirish usulini tekshiring.'
              : lang === 'en'
                ? 'Sign-in failed. Check your email, password and enabled sign-in method.'
                : 'Вход не выполнен. Проверьте email, пароль и способ входа.'
            : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (data?.adminOnly)
    return (
      <main className="maintenance-page">
        <section className="panel maintenance-card">
          <Shield size={36} aria-hidden="true" />
          <h1>Tadbirkorlik asoslari</h1>
          <h2>Platforma vaqtincha yopiq</h2>
          <p>Texnik ishlar olib borilmoqda. Hozir faqat administrator kirishi mumkin.</p>
          {googleError && <p role="alert">{googleError}</p>}
          <Button disabled={busy} onClick={googleLogin}>
            Google orqali administrator kirishi
          </Button>
        </section>
      </main>
    );
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  const close = () => (onClose ? onClose() : (location.hash = 'courses'));
  const googleButton = (
    <Button variant="outline" className="auth-google" disabled={busy} onClick={googleLogin}>
      <GoogleMark />
      Google
    </Button>
  );
  const form = (
    <div className="auth-form">
      <div className="auth-form-head">
        <img src="/terdu-logo.png" alt="TerDU" width="56" height="56" />
        <div>
          <h2>{L('Xush kelibsiz!', 'Welcome!', 'Добро пожаловать!')}</h2>
          <p className="muted">
            {L(
              'Tadbirkorlik asoslari · TerDU',
              'Fundamentals of Entrepreneurship · TerDU',
              'Основы предпринимательства · ТерГУ',
            )}
          </p>
        </div>
      </div>
      {googleError && (
        <p role="alert" className="auth-error">
          {googleError}
        </p>
      )}
      {data?.mode === 'demo' ? (
        <>
          <p className="demo-explainer">{t(lang, 'demo')}</p>
          {[
            ['student', BookOpen],
            ['teacher', GraduationCap],
            ['admin', Shield],
          ].map(([role, Icon]) => {
            const I = Icon as typeof BookOpen;
            return (
              <Button
                variant="outline"
                className="w-full auth-role"
                key={String(role)}
                onClick={() => demoLogin(role as string).catch((e) => toast(e.message))}
              >
                <I size={18} />
                {roleLabel(lang, role as string)}
                <ArrowRight size={16} />
              </Button>
            );
          })}
        </>
      ) : !kind ? (
        <div className="auth-kind" role="group" aria-labelledby="auth-kind-h">
          <h3 id="auth-kind-h">{L('Talabamisiz?', 'Are you a student?', 'Вы студент?')}</h3>
          <p className="muted">
            {L(
              'Sizga mos bo‘limni tanlang',
              'Choose the option that fits you',
              'Выберите подходящий вариант',
            )}
          </p>
          <button type="button" className="auth-kind-card" onClick={() => choose('student')}>
            <span className="auth-kind-ico" aria-hidden="true">
              🎓
            </span>
            <span className="auth-kind-text">
              <b>{L('Ha, TerDU talabasiman', 'Yes, I study at TerSU', 'Да, я студент ТерГУ')}</b>
              <small>
                {L(
                  'Talaba bo‘limi: guruhingiz bilan kirasiz yoki ro‘yxatdan o‘tasiz. Ustozingiz tasdiqlagach darslar, ballar va reyting ochiladi.',
                  'Student section: sign in or register with your group. Once your teacher approves, lessons, points and ranking open.',
                  'Раздел студента: войдите или зарегистрируйтесь со своей группой. После подтверждения преподавателем откроются уроки, баллы и рейтинг.',
                )}
              </small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="auth-kind-card" onClick={() => choose('other')}>
            <span className="auth-kind-ico" aria-hidden="true">
              🌍
            </span>
            <span className="auth-kind-text">
              <b>{L('Yo‘q, talaba emasman', 'No, I am not a student', 'Нет, я не студент')}</b>
              <small>
                {L(
                  'Email yoki Google bilan tez ro‘yxatdan o‘tasiz. Kurs darslari 💎 obunachilarga yoki administrator ruxsat berganlarga ochiladi.',
                  'Register quickly with email or Google. Course lessons open for 💎 subscribers or with the administrator’s permission.',
                  'Быстрая регистрация через email или Google. Уроки курса открыты 💎 подписчикам или по разрешению администратора.',
                )}
              </small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      ) : student ? (
        <>
          <button type="button" className="auth-kind-back" onClick={() => choose(null)}>
            ← 🎓 {L('Talaba bo‘limi', 'Student section', 'Раздел студента')}
            <span>{L('o‘zgartirish', 'change', 'изменить')}</span>
          </button>
          <NativeSurface
            id="student-login"
            className="native-login"
            title={L('Talaba hisobiga kirish', 'Student sign-in', 'Вход для студента')}
            src="/legacy/index.html?studyquest=login&sqEmbed=login"
          />
          <div className="auth-hints">
            <p>
              🔑{' '}
              {L(
                'Kod — avvalgi PIN kodingiz yoki o‘zingiz qo‘ygan parol (boshlang‘ich kod — 1111).',
                'Code — your old PIN or your own password (the starting code is 1111).',
                'Код — прежний PIN или ваш пароль (начальный код — 1111).',
              )}
            </p>
            <p>
              ❓ <b>{L('Parolni unutdingizmi?', 'Forgot your password?', 'Забыли пароль?')}</b>{' '}
              {L(
                'O‘qituvchingiz yangisini o‘rnatib beradi.',
                'Your teacher can set a new one.',
                'Преподаватель установит новый.',
              )}
            </p>
          </div>
          <button
            type="button"
            className="auth-link auth-kind-switch"
            onClick={() => choose('other')}
          >
            <Mail size={15} aria-hidden="true" />
            {L(
              'Talaba emasmisiz? Email yoki Google bilan kiring',
              'Not a student? Use email or Google',
              'Не студент? Войдите через email или Google',
            )}
          </button>
        </>
      ) : (
        <>
          <button type="button" className="auth-kind-back" onClick={() => choose(null)}>
            ← 🌍 {L('Talaba emasman', 'Not a student', 'Не студент')}
            <span>{L('o‘zgartirish', 'change', 'изменить')}</span>
          </button>
          <p className="auth-kind-note">
            {L(
              'ℹ️ Ro‘yxatdan o‘tgach saytdan foydalanasiz. Kurs darslari 💎 obunachilarga yoki administrator ruxsat berganlarga ochiladi — kirgach «Ruxsat so‘rash» tugmasini bosing.',
              'ℹ️ After registering you can use the site. Course lessons open for 💎 subscribers or with the administrator’s permission — press “Request access” after signing in.',
              'ℹ️ После регистрации сайт доступен. Уроки курса открыты 💎 подписчикам или по разрешению администратора — после входа нажмите «Запросить доступ».',
            )}
          </p>
          <div
            className="auth-tabs"
            role="group"
            aria-label={L('Kirish usuli', 'Access', 'Способ входа')}
          >
            <button
              className={!register ? 'on' : ''}
              aria-pressed={!register}
              onClick={() => setRegister(false)}
            >
              {t(lang, 'login')}
            </button>
            <button
              className={register ? 'on' : ''}
              aria-pressed={register}
              onClick={() => setRegister(true)}
            >
              {L('Ro‘yxatdan o‘tish', 'Register', 'Регистрация')}
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {register && (
              <label>
                {L('Ism va familiya', 'Full name', 'Имя и фамилия')}
                <input
                  required
                  className="input"
                  autoComplete="name"
                  placeholder={L(
                    'Masalan: Aziz Karimov',
                    'e.g. Aziz Karimov',
                    'Например: Азиз Каримов',
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label>
              Email
              <input
                required
                className="input"
                type="email"
                autoComplete="email"
                placeholder="ism@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {L('Parol', 'Password', 'Пароль')}
              <input
                required
                className="input"
                type="password"
                minLength={8}
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={L('Kamida 8 belgi', 'At least 8 characters', 'Не менее 8 символов')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {!register && (
              <button
                type="button"
                className="auth-link"
                disabled={busy || !email}
                onClick={() => submit(true)}
              >
                {L('Parolni unutdingizmi?', 'Forgot password?', 'Забыли пароль?')}
              </button>
            )}
            <Button className="w-full" disabled={busy} type="submit">
              {register
                ? L('Hisob yaratish', 'Create account', 'Создать аккаунт')
                : t(lang, 'login')}
            </Button>
          </form>
          <div className="auth-or">
            <span>{L('yoki', 'or', 'или')}</span>
          </div>
          <div className="auth-alt">
            {googleButton}
            <Button variant="ghost" className="auth-email" onClick={() => choose('student')}>
              <BookOpen size={18} />
              {L('Talaba hisobi', 'Student account', 'Аккаунт студента')}
            </Button>
          </div>
        </>
      )}
      <a className="auth-back" href="#courses" onClick={onClose}>
        {L(
          'Kirmasdan mavzularni ko‘rish',
          'Browse topics without signing in',
          'Смотреть темы без входа',
        )}{' '}
        →
      </a>
      <p className="auth-legal">
        {L(
          'Kirish yoki ro‘yxatdan o‘tish orqali',
          'By signing in or registering you accept the',
          'Входя или регистрируясь, вы принимаете',
        )}{' '}
        <a href={'/privacy?lang=' + lang} target="_blank" rel="noopener">
          {L('Maxfiylik siyosati', 'Privacy Policy', 'Политику конфиденциальности')}
        </a>
        {L('ga rozilik bildirasiz.', '.', '.')}
      </p>
    </div>
  );
  return (
    <main
      className={'auth-page design-' + design}
      onClickCapture={(event) => {
        const tab =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('.native-login [data-m]')
            : null;
        if (tab) {
          setRegister(tab.dataset.m === 'reg');
          window.scrollTo(0, 0);
        }
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="auth-close"
        aria-label={L('Yopish', 'Close', 'Закрыть')}
        onClick={close}
      >
        <X size={20} />
      </Button>
      <div className="auth-shell">
        <div className="auth-story">
          {design === 'rocket' ? (
            <div className="auth-rocket-title">
              <h1>Tadbirkorlik asoslari</h1>
              <p>
                {L('TerDU o‘quv platformasi', 'TerDU learning platform', 'Учебная платформа ТерГУ')}
              </p>
            </div>
          ) : (
            <>
              <span className="hero-tag">
                <img src="/terdu-logo.png" alt="" width="22" height="22" />
                Tadbirkorlik asoslari
              </span>
              <h1>
                {L('Bilimdan biznes sari.', 'From learning to building.', 'От знаний — к бизнесу.')}
              </h1>
              <AuthVideo />
              <p>
                {L(
                  '15 ta mavzu, testlar, o‘yinlar va reyting — barchasi bitta platformada.',
                  '15 topics, tests, games and a leaderboard — all in one place.',
                  '15 тем, тесты, игры и рейтинг — всё на одной платформе.',
                )}
              </p>
            </>
          )}
        </div>
        {form}
      </div>
      <div className="auth-design-switch" role="group" aria-label={L('Dizayn', 'Design', 'Дизайн')}>
        {(
          [
            ['rocket', '🚀', L('Biznes start', 'Business start', 'Бизнес-старт')],
            ['workspace', '💻', L('Raqamli ta’lim', 'Digital learning', 'Цифровое обучение')],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            key={id}
            className={design === id ? 'on' : ''}
            aria-pressed={design === id}
            title={label}
            onClick={() => pickDesign(id)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}

/* Kirish oynasi dizayni: o'qituvchi tanlagani (meta/design) yoki shu brauzerda tanlangani. */
type LoginDesign = 'rocket' | 'workspace';
function useLoginDesign() {
  const [design, setDesign] = useState<LoginDesign>('rocket');
  useEffect(() => {
    let saved = '';
    try {
      saved = localStorage.getItem('sq-login-design') || '';
    } catch {}
    if (saved === 'rocket' || saved === 'workspace') {
      setDesign(saved);
      return;
    }
    let alive = true;
    fetch('/api/platform?view=loginDesign')
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (alive && (v?.login === 'rocket' || v?.login === 'workspace')) setDesign(v.login);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const pick = (d: LoginDesign) => {
    setDesign(d);
    try {
      localStorage.setItem('sq-login-design', d);
    } catch {}
  };
  return [design, pick] as const;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AuthVideo() {
  const { lang } = useApp();
  const video = useRef<HTMLVideoElement>(null),
    [playing, setPlaying] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (media.matches || document.hidden) {
        video.current?.pause();
        setPlaying(false);
      } else {
        setLoaded(true);
        setPlaying(true);
      }
    };
    sync();
    media.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    if (playing) video.current?.play().catch(() => setPlaying(false));
    else video.current?.pause();
  }, [loaded, playing]);
  return (
    <div className="auth-video">
      <video
        ref={video}
        muted
        playsInline
        loop
        preload="none"
        poster="/legacy/fayllar/auth-workspace-poster.webp"
      >
        {loaded && (
          <>
            <source src="/legacy/fayllar/auth-workspace.webm" type="video/webm" />
            <source src="/legacy/fayllar/auth-workspace.mp4" type="video/mp4" />
          </>
        )}
      </video>
      <button
        type="button"
        aria-label={
          playing
            ? lang === 'uz'
              ? 'Animatsiyani to‘xtatish'
              : lang === 'ru'
                ? 'Остановить анимацию'
                : 'Pause animation'
            : lang === 'uz'
              ? 'Animatsiyani boshlash'
              : lang === 'ru'
                ? 'Запустить анимацию'
                : 'Play animation'
        }
        onClick={() => {
          setLoaded(true);
          setPlaying(!playing);
        }}
      >
        {playing ? 'Ⅱ' : '▶'}
      </button>
    </div>
  );
}
