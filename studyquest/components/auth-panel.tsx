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
import { BookOpen, GraduationCap, Shield, ArrowRight, X } from 'lucide-react';
import { firebaseAuth } from '@/lib/firebase-client';
import { useApp } from './provider';
import { Button } from './ui/button';
import { t } from '@/lib/i18n';
import { NativeSurface } from './native-surface';
export function AuthPanel({ onClose }: { onClose?: () => void }) {
  const { data, lang, refresh, toast, setLogin, demoLogin, useEmailMode } = useApp(),
    [register, setRegister] = useState(false),
    [student, setStudent] = useState(true),
    [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [googleError, setGoogleError] = useState('');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  async function googleLogin() {
    if (busy) return;
    setBusy(true);
    setGoogleError('');
    try {
      const a = firebaseAuth();
      if (!a) throw new Error('Google orqali kirish hali sozlanmagan.');
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
        code === 'auth/popup-blocked'
          ? 'Brauzer Google oynasini blokladi. Manzil qatoridagi belgi orqali pop-up oynalariga ruxsat bering va yana Google tugmasini bosing.'
          : code === 'auth/unauthorized-domain'
            ? 'Firebase Authentication → Settings → Authorized domains bo‘limiga ' +
              location.hostname +
              ' domenini qo‘shish kerak.'
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
            : 'Email login is not enabled yet. Use your existing account.',
        );
      if (reset) {
        await sendPasswordResetEmail(a, email);
        toast(lang === 'uz' ? 'Parolni tiklash xabari yuborildi.' : 'Password reset email sent.');
        return;
      }
      if (register) {
        if (password.length < 8 || name.trim().length < 2)
          throw new Error(
            lang === 'uz'
              ? 'Ism va kamida 8 belgili parol kiriting.'
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
        code
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
  return (
    <main
      className="auth-page"
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
        aria-label="Close"
        onClick={() => (onClose ? onClose() : (location.hash = 'courses'))}
      >
        <X size={20} />
      </Button>
      <div className="auth-story">
        <span className="hero-tag">Tadbirkorlik asoslari</span>
        <h1>
          {lang === 'uz'
            ? 'Bilim sizni oldinga boshlaydi.'
            : lang === 'en'
              ? 'Your next chapter starts here.'
              : 'Новая глава начинается здесь.'}
        </h1>
        <AuthVideo />
        <p>
          {lang === 'uz'
            ? 'O‘qing, kashf eting va har kuni yangi natijaga erishing.'
            : lang === 'en'
              ? 'Learn, discover, and make a little more progress every day.'
              : 'Учитесь, открывайте новое и продвигайтесь каждый день.'}
        </p>
      </div>
      <div className="auth-form panel">
        <img src="/legacy/logo_tersu.png" alt="TerDU" width="44" height="44" />
        <h2>
          {register
            ? lang === 'uz'
              ? 'Hisob yaratish'
              : lang === 'ru'
                ? 'Создать аккаунт'
                : 'Create account'
            : t(lang, 'login')}
        </h2>
        <p className="muted">Tadbirkorlik asoslari</p>
        {googleError && <p role="alert">{googleError}</p>}
        {data?.mode === 'demo' ? (
          <>
            <p className="demo-explainer">{t(lang, 'demo')}</p>
            {[
              ['student', BookOpen, 'student'],
              ['teacher', GraduationCap, 'teacher'],
              ['admin', Shield, 'admin'],
            ].map(([role, Icon, label]) => {
              const I = Icon as typeof BookOpen;
              return (
                <Button
                  variant="outline"
                  className="w-full"
                  key={String(role)}
                  onClick={() => demoLogin(role as string).catch((e) => toast(e.message))}
                >
                  <I size={18} />
                  {role === 'student'
                    ? lang === 'uz'
                      ? 'Talaba'
                      : lang === 'ru'
                        ? 'Студент'
                        : 'Student'
                    : t(lang, label as 'teacher' | 'admin')}
                  <ArrowRight size={16} />
                </Button>
              );
            })}
          </>
        ) : student ? (
          <>
            <NativeSurface
              id="student-login"
              className="native-login"
              title="Talaba hisobiga kirish"
              src="/legacy/index.html?studyquest=login&sqEmbed=login"
            />
            <Button variant="outline" disabled={busy} onClick={googleLogin}>
              Google
            </Button>
            <Button variant="ghost" onClick={() => setStudent(false)}>
              Email
            </Button>
          </>
        ) : (
          <>
            <Button className="w-full" onClick={() => setStudent(true)}>
              {t(lang, 'legacy')}
              <ArrowRight size={16} />
            </Button>
            <div className="auth-or">
              {lang === 'uz'
                ? 'yoki email orqali'
                : lang === 'ru'
                  ? 'или по email'
                  : 'or use email'}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              {register && (
                <label>
                  {lang === 'uz'
                    ? 'Ism va familiya'
                    : lang === 'ru'
                      ? 'Имя и фамилия'
                      : 'Full name'}
                  <input
                    required
                    className="input"
                    autoComplete="name"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                {lang === 'uz' ? 'Parol' : lang === 'ru' ? 'Пароль' : 'Password'}
                <input
                  required
                  className="input"
                  type="password"
                  minLength={8}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button className="w-full" disabled={busy} type="submit">
                {register
                  ? lang === 'uz'
                    ? 'Hisob yaratish'
                    : 'Create account'
                  : t(lang, 'login')}
              </Button>
            </form>
            <Button
              variant="ghost"
              onClick={() => {
                setRegister(!register);
                window.scrollTo(0, 0);
              }}
            >
              {register
                ? t(lang, 'login')
                : lang === 'uz'
                  ? 'Ro‘yxatdan o‘tish'
                  : lang === 'ru'
                    ? 'Регистрация'
                    : 'Register'}
            </Button>
            <Button variant="ghost" disabled={busy || !email} onClick={() => submit(true)}>
              {lang === 'uz'
                ? 'Parolni unutdingizmi?'
                : lang === 'ru'
                  ? 'Забыли пароль?'
                  : 'Forgot password?'}
            </Button>
            <Button variant="outline" disabled={busy} onClick={googleLogin}>
              Google
            </Button>
          </>
        )}
        <a className="auth-back" href="#courses" onClick={onClose}>
          {lang === 'uz'
            ? 'Kurslarni ko‘rish'
            : lang === 'ru'
              ? 'Посмотреть курсы'
              : 'View courses'}{' '}
          ↗
        </a>
      </div>
    </main>
  );
}

function AuthVideo() {
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
        aria-label={playing ? 'Pause animation' : 'Play animation'}
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
