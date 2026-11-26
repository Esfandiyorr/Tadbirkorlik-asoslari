'use client';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Medal,
  MessageSquare,
  Shield,
  X,
} from 'lucide-react';
import catalog from '@/lib/catalog.generated.json';
import { firebaseAuth, isNetworkError, networkMessage } from '@/lib/firebase-client';
import { roleLabel } from '@/lib/i18n';
import { tr } from '@/lib/points';
import type { Lang } from '@/lib/types';
import { useApp } from './provider';
import { Button } from './ui/button';
import { AccountHelpForm } from './account-help';

/* 🔑 Kirish sahifasi — oddiy, bitta ustunli dizayn (sarlavha, ikki maydon, «Kirish», ostida «Ro‘yxatdan o‘tish»,
   uning tagida «Mehmon»). Ranglar — saytning avvalgi binafsha ranglari.
   • Talaba «Ism familiya» (yoki «Familiya Ism») va o‘zi qo‘ygan parol yoki 1111 bilan kiradi. Tekshiruvni avvalgi
     talaba tizimi qiladi (yashirin oyna — /legacy/index.html, scripts/legacy-credentials.mjs): parollar, egalik va
     1111 qoidasi o‘zgarmaydi, bu sahifa faqat maydonlarni to‘ldirib «Kirish»ni bosadi.
   • «Ro‘yxatdan o‘tish» → ism-familiya yoki Google. Ism-familiya bilan bo‘lsa «Talabamisiz?» so‘raladi: talaba
     guruhini tanlaydi yoki yozadi. Administrator yoki o‘qituvchi hisobni tasdiqlaydi. Mustaqil o‘quvchilar
     va Google orqali kirganlar asosiy kursni ochish uchun ruxsat so‘raydi.
   • Maydonga email yozilsa — avvalgi email hisobiga kiradi (email + parol). */

type Step = 'login' | 'register' | 'student' | 'group' | 'pending' | 'guest' | 'help';
type Choice = { value: string; label: string };
type Outcome =
  | { ok: true; status: string; learnerType: string; group: string }
  | { choose: Choice[]; split: number }
  | { error: 'wrong' | 'blocked' | 'network' | 'exists' | 'service' };
type LegacyStudent = { status?: string; learnerType?: string; group?: string };
type LegacyWindow = Window & {
  RT?: { auth: (mode: string) => void; student: () => LegacyStudent | null };
  SQ_REG?: { learnerType: string; group: string };
};

const LEGACY_LOGIN = '/legacy/index.html?studyquest=login&sqEmbed=login';
const GROUPS: string[] = (catalog as { groups?: string[] }).groups || [];
/** Talaba bo'lmaganlar ham oddiy hisob bilan ball to'playdi va reytingda qatnashadi — shu guruh nomi bilan. */
const groupOk = (g: string) => /^[\p{L}\p{N}][\p{L}\p{N} ._/-]{1,39}$/u.test(g.trim());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthPanel({ onClose }: { onClose?: () => void }) {
  const {
    data,
    lang,
    setLang,
    refresh,
    demoLogin,
    toast,
    useEmailMode,
    error: appError,
    errorSeq,
    retrySession,
  } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const demo = data?.mode === 'demo';
  const legacy = useLegacyAuth();
  const [step, go] = useState<Step>('login'),
    [full, setFull] = useState(''),
    [password, setPassword] = useState(''),
    [first, setFirst] = useState(''),
    [last, setLast] = useState(''),
    [pick, setPick] = useState(''),
    [typed, setTyped] = useState(''),
    [choices, setChoices] = useState<{ list: Choice[]; split: number } | null>(null),
    [choice, setChoice] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [pending, setPending] = useState<{ name: string; group: string; fresh: boolean } | null>(null);
  const entering = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** kirish boshlangandagi xato hisoblagichi: undan keyin server rad etsa — sababi darhol ko'rsatiladi */
  const enterSeq = useRef<number | null>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    setError('');
  }, [step]);
  useEffect(
    () => () => {
      if (entering.current) clearTimeout(entering.current);
    },
    [],
  );
  const close = () => (onClose ? onClose() : (location.hash = 'courses'));
  const problem = (kind: Exclude<Outcome, { ok: true } | { choose: Choice[] }>['error']) =>
    ({
      wrong: L(
        'Ism familiya yoki parol noto‘g‘ri.',
        'The name or the password is incorrect.',
        'Неверные имя и фамилия или пароль.',
      ),
      blocked: L(
        'Hisobingiz bloklangan. O‘qituvchiga murojaat qiling.',
        'Your account is blocked. Contact your teacher.',
        'Ваш аккаунт заблокирован. Обратитесь к преподавателю.',
      ),
      network: networkMessage(lang),
      exists: L(
        'Bu ism-familiya bilan hisob bor. «Kirish» orqali kiring.',
        'An account with this name already exists. Please log in.',
        'Аккаунт с таким именем уже есть. Войдите.',
      ),
      service: L(
        'Kirish xizmati yuklanmadi. Internetni tekshirib, qayta urining.',
        'The sign-in service did not load. Check the internet and try again.',
        'Служба входа не загрузилась. Проверьте интернет и повторите.',
      ),
    })[kind];
  // server seansni qabul qilmadi (hisob, seans yoki platforma yopiq) — 25 soniya kutmasdan aniq sababi
  useEffect(() => {
    if (enterSeq.current === null || errorSeq <= enterSeq.current) return;
    enterSeq.current = null;
    if (entering.current) clearTimeout(entering.current);
    setBusy('');
    setError(
      L('Kirish tasdiqlanmadi', 'Sign-in was not confirmed', 'Вход не подтверждён') +
        (appError ? ': ' + appError : '.'),
    );
  }, [errorSeq, appError, L]);
  /** Hisob tasdiqlangan — provider sessiyani qabul qilgach sahifa o‘zi yopiladi. */
  function enter() {
    setBusy(L('Kirilmoqda…', 'Signing in…', 'Входим…'));
    enterSeq.current = errorSeq;
    if (entering.current) clearTimeout(entering.current);
    entering.current = setTimeout(() => {
      enterSeq.current = null;
      setBusy('');
      setError(
        L(
          'Kirish tasdiqlanmadi. Sahifani yangilab, qayta urining.',
          'Sign-in was not confirmed. Reload the page and try again.',
          'Вход не подтверждён. Обновите страницу и повторите.',
        ),
      );
    }, 25000);
  }
  function settle(r: Outcome, name: string, fresh: boolean, group = '') {
    if ('choose' in r) {
      setChoices({ list: r.choose, split: r.split });
      setChoice('');
      setError(
        L(
          'Bir xil ism-familiyali talabalar bor. Guruhingizni tanlab, yana «Kirish»ni bosing.',
          'There are students with the same name. Choose your group and press “Log in” again.',
          'Есть студенты с таким же именем. Выберите группу и снова нажмите «Войти».',
        ),
      );
      return;
    }
    if ('error' in r) {
      setError(problem(r.error));
      return;
    }
    if (r.status === 'ok' || r.learnerType === 'independent') {
      if (fresh)
        toast(
          L(
            '🔑 Parolingiz: 1111. Profil bo‘limida o‘zingizga yangi parol qo‘ying.',
            '🔑 Your password is 1111. Set your own password in Profile.',
            '🔑 Ваш пароль: 1111. Задайте свой пароль в профиле.',
          ),
        );
      return enter();
    }
    if (r.status === 'blocked') return setError(problem('blocked'));
    setPending({ name, group: r.group || group, fresh });
    go('pending');
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    // qayta urinish: talaba tizimi yuboradigan seans yana qabul qilinsin (sahifani yangilash shart emas)
    retrySession();
    const text = full.trim().replace(/\s+/g, ' ');
    if (text.includes('@')) return emailLogin(text);
    const parts = text.split(' ');
    if (parts.length < 2 || parts.some((p) => p.length < 2))
      return setError(
        L(
          'Ism va familiyangizni to‘liq yozing.',
          'Enter your first name and surname.',
          'Введите имя и фамилию полностью.',
        ),
      );
    if (!password)
      return setError(L('Parolni kiriting.', 'Enter your password.', 'Введите пароль.'));
    if (choices && !choice)
      return setError(L('Guruhingizni tanlang.', 'Choose your group.', 'Выберите группу.'));
    if (demo)
      return setError(
        L(
          'Demo rejimida pastdagi rol tugmalaridan foydalaning.',
          'In demo mode use the role buttons below.',
          'В демо-режиме используйте кнопки ролей ниже.',
        ),
      );
    setBusy(L('Tekshirilmoqda…', 'Checking…', 'Проверяем…'));
    try {
      const r = await legacy.login(
        parts,
        password,
        choices && choice ? { split: choices.split, id: choice } : undefined,
      );
      if (!('choose' in r)) setChoices(null);
      setBusy('');
      settle(r, text, false);
    } catch {
      setBusy('');
      setError(problem('service'));
    }
  }
  async function emailLogin(email: string) {
    const a = firebaseAuth();
    if (!a) return setError(problem('service'));
    setBusy(L('Tekshirilmoqda…', 'Checking…', 'Проверяем…'));
    try {
      useEmailMode();
      await signInWithEmailAndPassword(a, email, password);
      await refresh();
    } catch (e) {
      setError(isNetworkError(e) ? networkMessage(lang) : problem('wrong'));
    } finally {
      setBusy('');
    }
  }
  async function googleLogin() {
    if (busy) return;
    setError('');
    const a = firebaseAuth();
    if (!a) return setError(problem('service'));
    setBusy(L('Google oynasi ochilmoqda…', 'Opening Google…', 'Открываем Google…'));
    try {
      useEmailMode();
      // Oyna tugma bosilgan zahoti ochilishi kerak (brauzer pop-up'ni bloklamasin).
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(a, provider);
      await refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user')
        setError(
          isNetworkError(e)
            ? networkMessage(lang)
            : code === 'auth/popup-blocked'
              ? L(
                  'Brauzer Google oynasini blokladi. Manzil qatoridagi belgi orqali pop-up oynalariga ruxsat bering va qayta bosing.',
                  'The browser blocked the Google window. Allow pop-ups in the address bar and press again.',
                  'Браузер заблокировал окно Google. Разрешите всплывающие окна и нажмите снова.',
                )
              : code === 'auth/unauthorized-domain'
                ? L(
                    'Firebase Authentication → Settings → Authorized domains bo‘limiga ' +
                      location.hostname +
                      ' domenini qo‘shish kerak.',
                    'Add ' +
                      location.hostname +
                      ' to Firebase Authentication → Authorized domains.',
                    'Добавьте ' +
                      location.hostname +
                      ' в Firebase Authentication → Authorized domains.',
                  )
                : (e as Error).message,
        );
    } finally {
      setBusy('');
    }
  }
  async function register(learnerType: 'university' | 'independent', group: string) {
    if (busy) return;
    setError('');
    if (demo)
      return setError(
        L(
          'Demo rejimida ro‘yxatdan o‘tish o‘chirilgan.',
          'Registration is off in demo mode.',
          'В демо-режиме регистрация отключена.',
        ),
      );
    setBusy(L('Hisob yaratilmoqda…', 'Creating the account…', 'Создаём аккаунт…'));
    try {
      const r = await legacy.register(first.trim(), last.trim(), learnerType, group.trim());
      setBusy('');
      settle(r, first.trim() + ' ' + last.trim(), true, group.trim());
    } catch {
      setBusy('');
      setError(problem('service'));
    }
  }

  if (data?.adminOnly)
    return (
      <main className="maintenance-page">
        <section className="panel maintenance-card">
          <Shield size={36} aria-hidden="true" />
          <h1>Unistay</h1>
          <h2>Platforma vaqtincha yopiq</h2>
          <p>Texnik ishlar olib borilmoqda. Hozir faqat administrator kirishi mumkin.</p>
          {error && <p role="alert">{error}</p>}
          <Button disabled={!!busy} onClick={googleLogin}>
            Google orqali administrator kirishi
          </Button>
        </section>
      </main>
    );

  const alert = error ? (
    <p role="alert" className="la-error">
      {error}
    </p>
  ) : null;
  const back = (to: Step, label = L('Orqaga', 'Back', 'Назад')) => (
    <button type="button" className="la-back" onClick={() => go(to)}>
      <ArrowLeft size={16} aria-hidden="true" /> {label}
    </button>
  );
  const group = typed.trim() || pick;
  let body: ReactNode;
  if (step === 'login')
    body = (
      <>
        <form className="la-form" onSubmit={login} noValidate>
          <div className="la-fields">
            <label className="la-sr" htmlFor="la-full">
              {L('Ism familiya', 'Full name', 'Имя фамилия')}
            </label>
            <input
              id="la-full"
              className="la-input"
              autoComplete="name"
              autoCapitalize="words"
              placeholder={L('Ism familiya', 'Full name', 'Имя фамилия')}
              value={full}
              onChange={(e) => {
                setFull(e.target.value);
                setChoices(null);
              }}
            />
            <label className="la-sr" htmlFor="la-password">
              {L('Parol', 'Password', 'Пароль')}
            </label>
            <input
              id="la-password"
              className="la-input"
              type="password"
              autoComplete="current-password"
              placeholder={L('Parol', 'Password', 'Пароль')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {choices && (
            <>
              <label className="la-sr" htmlFor="la-choice">
                {L('Guruhingiz', 'Your group', 'Ваша группа')}
              </label>
              <select
                id="la-choice"
                className="la-input la-select"
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="">{L('— guruhingiz —', '— your group —', '— ваша группа —')}</option>
                {choices.list.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </>
          )}
          {alert}
          <button type="submit" className="la-submit" disabled={!!busy}>
            {busy || L('Kirish', 'Log in', 'Войти')}
          </button>
        </form>
        {/* Google bilan kirish — asosiy oynada ham (o'qituvchilar, administrator va Google hisobi borlar uchun) */}
        <div className="la-or la-or-dark">
          <span>{L('yoki', 'or', 'или')}</span>
        </div>
        <button
          type="button"
          className="la-google la-google-main"
          disabled={!!busy}
          onClick={googleLogin}
        >
          <GoogleMark />
          {L('Google orqali kirish', 'Continue with Google', 'Войти через Google')}
        </button>
        <button type="button" className="la-link" onClick={() => go('register')}>
          {L('Ro‘yxatdan o‘tish', 'Sign up', 'Регистрация')}
        </button>
        <button type="button" className="la-link la-guest" onClick={() => go('guest')}>
          {L('Mehmon', 'Guest', 'Гость')}
        </button>
        {demo && (
          <div className="la-demo" role="group" aria-label="Demo">
            {(
              [
                ['student', BookOpen],
                ['teacher', GraduationCap],
                ['admin', Shield],
              ] as const
            ).map(([role, Icon]) => (
              <button
                key={role}
                type="button"
                className="auth-role"
                onClick={() => demoLogin(role).catch((e) => toast(e.message))}
              >
                <Icon size={16} aria-hidden="true" /> {roleLabel(lang, role)}
              </button>
            ))}
          </div>
        )}
      </>
    );
  else if (step === 'register')
    body = (
      <section className="la-card" aria-labelledby="la-h">
        {back('login', L('Kirish', 'Log in', 'Войти'))}
        <h2 id="la-h">{L('Ro‘yxatdan o‘tish', 'Sign up', 'Регистрация')}</h2>
        <form
          className="la-card-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (first.trim().length < 2 || last.trim().length < 2)
              return setError(
                L(
                  'Ism va familiyani yozing.',
                  'Enter your name and surname.',
                  'Введите имя и фамилию.',
                ),
              );
            go('student');
          }}
          noValidate
        >
          <label>
            {L('Ism', 'First name', 'Имя')}
            <input
              className="la-input"
              autoComplete="given-name"
              autoCapitalize="words"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
          </label>
          <label>
            {L('Familiya', 'Surname', 'Фамилия')}
            <input
              className="la-input"
              autoComplete="family-name"
              autoCapitalize="words"
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
          </label>
          {alert}
          <button type="submit" className="la-submit">
            {L('Davom etish', 'Continue', 'Продолжить')}
          </button>
        </form>
        <div className="la-or">
          <span>{L('yoki', 'or', 'или')}</span>
        </div>
        <button type="button" className="la-google" disabled={!!busy} onClick={googleLogin}>
          <GoogleMark />
          {busy || L('Google orqali kirish', 'Continue with Google', 'Войти через Google')}
        </button>
        <p className="auth-legal">
          {L(
            'Ro‘yxatdan o‘tish orqali',
            'By signing up you accept the',
            'Регистрируясь, вы принимаете',
          )}{' '}
          <a href={'/privacy?lang=' + lang} target="_blank" rel="noopener">
            {L('Maxfiylik siyosati', 'Privacy Policy', 'Политику конфиденциальности')}
          </a>
          {L('ga rozilik bildirasiz.', '.', '.')}
        </p>
      </section>
    );
  else if (step === 'student')
    body = (
      <section className="la-card" aria-labelledby="la-h">
        {back('register')}
        <h2 id="la-h">{L('Talabamisiz?', 'Are you a student?', 'Вы студент?')}</h2>
        <p className="la-muted">
          {first.trim()} {last.trim()}
        </p>
        <div className="la-answers">
          <button type="button" className="la-answer" onClick={() => go('group')}>
            <span aria-hidden="true">🎓</span>
            <b>{L('Ha, talabaman', 'Yes, I am a student', 'Да, я студент')}</b>
            <small>
              {L(
                'Guruhingizni ko‘rsatasiz. Hisob tasdiqlangach, kursga kirasiz.',
                'Enter your group. You can access the course once your account is approved.',
                'Укажите группу. Курс откроется после подтверждения аккаунта.',
              )}
            </small>
          </button>
          <button
            type="button"
            className="la-answer"
            disabled={!!busy}
            onClick={() => register('independent', '')}
          >
            <span aria-hidden="true">🌍</span>
            <b>{L('Yo‘q, talaba emasman', 'No, I am not a student', 'Нет, я не студент')}</b>
            <small>
              {busy ||
                L(
                  'Mustaqil hisob ochasiz. Kursga kirish uchun administratordan ruxsat so‘raysiz.',
                  'Create an independent account and ask the administrator for course access.',
                  'Создайте самостоятельный аккаунт и запросите доступ у администратора.',
                )}
            </small>
          </button>
        </div>
        {alert}
      </section>
    );
  else if (step === 'group')
    body = (
      <section className="la-card" aria-labelledby="la-h">
        {back('student')}
        <h2 id="la-h">{L('Guruhingiz', 'Your group', 'Ваша группа')}</h2>
        <form
          className="la-card-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!groupOk(group))
              return setError(
                L(
                  'Guruhni ro‘yxatdan tanlang yoki yozing (masalan: YES-123).',
                  'Choose your group from the list or type it (e.g. YES-123).',
                  'Выберите группу из списка или введите её (например, YES-123).',
                ),
              );
            void register('university', group);
          }}
          noValidate
        >
          <label>
            {L('Ro‘yxatdan tanlang', 'Choose from the list', 'Выберите из списка')}
            <select
              className="la-input la-select"
              value={pick}
              onChange={(e) => {
                setPick(e.target.value);
                setTyped('');
              }}
            >
              <option value="">{L('— tanlang —', '— choose —', '— выберите —')}</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L('yoki o‘zingiz yozing', 'or type it yourself', 'или введите сами')}
            <input
              className="la-input"
              maxLength={40}
              autoCapitalize="characters"
              placeholder={L('Masalan: Yes-123', 'E.g. Yes-123', 'Например: Yes-123')}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                if (e.target.value) setPick('');
              }}
            />
          </label>
          {alert}
          <button type="submit" className="la-submit" disabled={!!busy}>
            {busy || L('Ro‘yxatdan o‘tish', 'Sign up', 'Зарегистрироваться')}
          </button>
        </form>
      </section>
    );
  else if (step === 'pending' && pending)
    body = (
      <section className="la-card la-pending" aria-labelledby="la-h" role="status">
        <span className="la-big" aria-hidden="true">
          ⏳
        </span>
        <h2 id="la-h">
          {pending.fresh
            ? L('Ro‘yxatdan o‘tdingiz!', 'You are signed up!', 'Вы зарегистрированы!')
            : L(
                'Hisob hali faollashmadi',
                'The account is not active yet',
                'Аккаунт ещё не активен',
              )}
        </h2>
        <p>
          <b>{pending.name}</b>
          {pending.group ? ' · ' + pending.group : ''}
        </p>
        <p className="la-muted">
          {L(
            'Hisobingiz tasdiqlanishi kutilmoqda. O‘qituvchi yoki administrator tasdiqlagach, qayta kiring.',
            'Your account is awaiting approval. Sign in again once your teacher or administrator approves it.',
            'Аккаунт ожидает подтверждения. Войдите снова, когда преподаватель или администратор подтвердит его.',
          )}
        </p>
        {pending.fresh && (
          <p className="la-note">
            🔑{' '}
            {L(
              'Ism familiyangiz va 1111 paroli bilan kirasiz. Keyin o‘zingiz yangi parol qo‘yasiz.',
              'Log in with your name and the password 1111. Later you set your own password.',
              'Входите с именем и паролем 1111. Потом вы зададите свой пароль.',
            )}
          </p>
        )}
        {back('login', L('Kirish sahifasi', 'Login page', 'Страница входа'))}
      </section>
    );
  else if (step === 'guest') body = <GuestInfo L={L} onBack={() => go('login')} onBrowse={close} />;
  else
    body = (
      <section className="la-card" aria-labelledby="la-h">
        {back('login', L('Kirish', 'Log in', 'Войти'))}
        <h2 id="la-h">{L('Kirishda yordam', 'Help with signing in', 'Помощь со входом')}</h2>
        <ul className="la-tips">
          <li>
            {L(
              'Ism va familiyani istalgan tartibda yozing: «Ali Valiyev» yoki «Valiyev Ali».',
              'Type your name in any order: “Ali Valiyev” or “Valiyev Ali”.',
              'Имя и фамилию можно писать в любом порядке: «Али Валиев» или «Валиев Али».',
            )}
          </li>
          <li>
            {L(
              'Parol — o‘zingiz qo‘ygan parol yoki boshlang‘ich 1111.',
              'Password — your own password or the starting 1111.',
              'Пароль — ваш собственный или начальный 1111.',
            )}
          </li>
          <li>
            {L(
              'Parolni unutgan bo‘lsangiz, o‘qituvchingiz yangisini o‘rnatib beradi.',
              'If you forgot the password, your teacher can set a new one.',
              'Если вы забыли пароль, преподаватель установит новый.',
            )}
          </li>
        </ul>
        <AccountHelpForm />
        <p className="auth-legal">
          <a href={'/privacy?lang=' + lang} target="_blank" rel="noopener">
            {L('Maxfiylik siyosati', 'Privacy Policy', 'Политика конфиденциальности')}
          </a>
        </p>
      </section>
    );

  return (
    <main className={'la-page la-step-' + step}>
      <header className="la-top">
        {onClose ? (
          <button
            type="button"
            className="la-close"
            aria-label={L('Yopish', 'Close', 'Закрыть')}
            onClick={close}
          >
            <X size={20} />
          </button>
        ) : (
          <span />
        )}
        <div className="la-langs" role="group" aria-label={L('Til', 'Language', 'Язык')}>
          {(
            [
              ['uz', 'UZ', 'O‘zbekcha'],
              ['en', 'ENG', 'English'],
              ['ru', 'RUS', 'Русский'],
            ] as const
          ).map(([id, short, name]) => (
            <button
              key={id}
              type="button"
              lang={id}
              aria-label={name}
              aria-pressed={lang === id}
              className={lang === id ? 'on' : ''}
              onClick={() => setLang(id as Lang)}
            >
              {short}
            </button>
          ))}
        </div>
      </header>
      <div className="la-column">
        <h1 className="la-brand">
          <span className="la-www">www.</span>tadbirkorlik-asoslari
          <span className="la-uz">.uz</span>
        </h1>
        {body}
      </div>
      {step === 'login' && (
        <footer className="la-foot">
          <button
            type="button"
            className="la-help"
            aria-label={L('Kirishda yordam', 'Help with signing in', 'Помощь со входом')}
            onClick={() => go('help')}
          >
            <CircleHelp size={22} aria-hidden="true" />
          </button>
        </footer>
      )}
      {!demo && legacy.frame}
    </main>
  );
}

/* 👀 Mehmon: sayt tuzilishi, sayt haqida va kurslar — hisobsiz ko‘rish mumkin. */
function GuestInfo({
  L,
  onBack,
  onBrowse,
}: {
  L: (uz: string, en: string, ru: string) => string;
  onBack: () => void;
  onBrowse: () => void;
}) {
  const sections = [
    [
      LayoutDashboard,
      L('Bosh sahifa', 'Home', 'Главная'),
      L(
        'Davom etayotgan dars, ballar, e’lonlar va eslatmalar.',
        'Your current lesson, points, news and reminders.',
        'Текущий урок, баллы, объявления и напоминания.',
      ),
    ],
    [
      BookOpen,
      L('Kurslar', 'Courses', 'Курсы'),
      L(
        'Fanlar va mavzular: slaydlar, video, testlar va topshiriqlar.',
        'Courses and topics: slides, video, tests and assignments.',
        'Курсы и темы: слайды, видео, тесты и задания.',
      ),
    ],
    [
      Gamepad2,
      L('O‘yin maydoni', 'Game arena', 'Игровая арена'),
      L(
        'Jonli test, «Biznes» o‘yini va boshqa bellashuvlar.',
        'Live quiz, the “Business” game and other contests.',
        'Живой тест, игра «Бизнес» и другие состязания.',
      ),
    ],
    [
      LibraryBig,
      L('Kutubxona', 'Library', 'Библиотека'),
      L(
        'Kitoblar, qo‘llanmalar, qonunlar va namunalar.',
        'Books, guides, laws and templates.',
        'Книги, пособия, законы и образцы.',
      ),
    ],
    [
      Medal,
      L('Yutuqlar va reyting', 'Achievements and ranking', 'Достижения и рейтинг'),
      L(
        'Nishonlar, guruh va umumiy reyting.',
        'Badges, group and overall ranking.',
        'Значки, рейтинг группы и общий рейтинг.',
      ),
    ],
    [
      MessageSquare,
      L('Talabalar chati', 'Class chat', 'Чат студентов'),
      L(
        'Kursdoshlar va o‘qituvchi bilan yozishma (hisob bilan).',
        'Messages with classmates and the teacher (with an account).',
        'Переписка с однокурсниками и преподавателем (с аккаунтом).',
      ),
    ],
  ] as const;
  const courses = (
    catalog.courses as {
      id: string;
      title: string;
      desc?: string;
      icon?: string;
      closed?: boolean;
      paid?: boolean;
    }[]
  )
    .filter((c) => !c.closed)
    .map((c) => ({
      ...c,
      topics:
        c.id === catalog.courses[0]?.id
          ? catalog.topics.length
          : catalog.more.find((m) => m.id === c.id)?.topics.length || 0,
    }));
  return (
    <section className="la-card la-guestinfo" aria-labelledby="la-h">
      <button type="button" className="la-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> {L('Kirish', 'Log in', 'Войти')}
      </button>
      <h2 id="la-h">{L('Sayt haqida', 'About the site', 'О сайте')}</h2>
      <p>
        {L(
          'www.tadbirkorlik-asoslari.uz — talabalar uchun onlayn o‘quv platformasi (Unistay). Fanlarni slaydma-slayd o‘rganasiz, testlarda bilimingizni sinaysiz, kursdoshlar bilan jonli viktorinada bellashasiz va ball to‘playsiz.',
          'www.tadbirkorlik-asoslari.uz is an online learning platform for students (Unistay). Study courses slide by slide, test yourself, compete with classmates in a live quiz and earn points.',
          'www.tadbirkorlik-asoslari.uz — онлайн-платформа для студентов (Unistay). Изучайте курсы по слайдам, проверяйте себя тестами, соревнуйтесь с однокурсниками в живой викторине и набирайте баллы.',
        )}
      </p>
      <h3>{L('Sayt tuzilishi', 'How the site is organised', 'Структура сайта')}</h3>
      <ul className="la-sections">
        {sections.map(([Icon, title, text]) => (
          <li key={title}>
            <span className="la-ico" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span>
              <b>{title}</b>
              <small>{text}</small>
            </span>
          </li>
        ))}
      </ul>
      <h3>{L('Kurslar', 'Courses', 'Курсы')}</h3>
      <ul className="la-courses">
        {courses.map((c) => (
          <li key={c.id}>
            <span className="la-cico" aria-hidden="true">
              {c.icon || '📘'}
            </span>
            <span>
              <b>{c.title}</b>
              {c.desc && <small>{c.desc}</small>}
              <em>
                {c.topics} {L('ta mavzu', 'topics', 'тем')}
                {c.paid ? ' · ' + L('pullik', 'paid', 'платный') : ''}
              </em>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="la-submit" onClick={onBrowse}>
        {L(
          'Saytni mehmon sifatida ko‘rish',
          'Browse the site as a guest',
          'Смотреть сайт как гость',
        )}
      </button>
    </section>
  );
}

/* Avvalgi talaba tizimi yashirin oynada ishlaydi: shu sahifa uning maydonlarini to‘ldiradi va tugmasini bosadi.
   Muvaffaqiyatli kirgach oyna sessiyani o‘zi yuboradi (scripts/legacy-bridge.js → provider.tsx). */
function useLegacyAuth() {
  const frame = useRef<HTMLIFrameElement>(null);
  const win = () => {
    try {
      return (frame.current?.contentWindow as LegacyWindow | null) || null;
    } catch {
      return null;
    }
  };
  async function open(mode: 'log' | 'reg', button: string) {
    for (let i = 0; i < 250; i++) {
      const w = win();
      if (w?.RT?.auth && w.document.readyState !== 'loading') {
        if (!w.document.getElementById(button)) w.RT.auth(mode);
        if (w.document.getElementById(button)) return w;
      }
      await sleep(100);
    }
    throw new Error('service');
  }
  const fill = (w: LegacyWindow, id: string, value: string) => {
    const input = w.document.getElementById(id) as HTMLInputElement | null;
    if (input) input.value = value;
  };
  const classify = (text: string): Outcome => ({
    error: /blok|block/i.test(text)
      ? 'blocked'
      : /mavjud|exists/i.test(text)
        ? 'exists'
        : /server|internet|ulan|connect/i.test(text)
          ? 'network'
          : 'wrong',
  });
  const done = (w: LegacyWindow): Outcome => {
    const s = w.RT?.student() || {};
    return {
      ok: true,
      status: s.status || 'pending',
      learnerType: s.learnerType || 'university',
      group: s.group || '',
    };
  };
  /** Tugmani bosib natijani kutadi: oyna yopildi — kirdi; xato matni — rad etildi; guruh tanlovi — bir xil ismlar. */
  async function press(
    w: LegacyWindow,
    button: string,
    errorBox: string,
  ): Promise<'done' | { choose: Choice[] } | { text: string }> {
    const d = w.document,
      b = d.getElementById(button) as HTMLButtonElement,
      box = d.getElementById(errorBox);
    if (box) {
      box.style.display = 'none';
      box.textContent = '';
    }
    b.click();
    for (let i = 0; i < 900; i++) {
      await sleep(100);
      if (!b.isConnected) return 'done' as const;
      if (b.disabled) continue;
      await sleep(80);
      if (!b.isConnected) return 'done' as const;
      const pick = d.getElementById('sqNameChoice') as HTMLSelectElement | null;
      if (pick && button === 'lgGo')
        return {
          choose: Array.from(pick.options)
            .filter((o) => o.value)
            .map((o) => ({ value: o.value, label: o.textContent || o.value })),
        };
      const text = d.getElementById(errorBox)?.textContent || '';
      if (text) return { text };
    }
    return { text: 'internet' };
  }
  async function login(
    parts: string[],
    password: string,
    chosen?: { split: number; id: string },
  ): Promise<Outcome> {
    // «Ism Familiya» va «Familiya Ism» ikkalasini ham asl tizim topadi; uch so‘zli ismlar uchun bo‘linish nuqtalari sinanadi.
    const splits = parts
      .slice(1)
      .map((_, k) => [parts.slice(0, k + 1).join(' '), parts.slice(k + 1).join(' ')]);
    let last: Outcome = { error: 'wrong' };
    for (let k = chosen ? chosen.split : 0; k < splits.length; k++) {
      const w = await open('log', 'lgGo');
      fill(w, 'lgN', splits[k][0]);
      fill(w, 'lgS', splits[k][1]);
      fill(w, 'lgB', password);
      if (chosen) {
        const pick = w.document.getElementById('sqNameChoice') as HTMLSelectElement | null;
        if (pick) pick.value = chosen.id;
      }
      const r = await press(w, 'lgGo', 'lgErr');
      if (r === 'done') return done(w);
      if ('choose' in r) return { choose: r.choose, split: k };
      last = classify(r.text);
      if (chosen || ('error' in last && last.error !== 'wrong')) return last;
    }
    return last;
  }
  async function register(
    first: string,
    last: string,
    learnerType: 'university' | 'independent',
    group: string,
  ): Promise<Outcome> {
    const w = await open('reg', 'rtGo');
    w.SQ_REG = { learnerType, group: learnerType === 'independent' ? '' : group };
    fill(w, 'rtN', first);
    fill(w, 'rtS', last);
    const r = await press(w, 'rtGo', 'rtErr');
    if (r === 'done') return done(w);
    return classify('text' in r ? r.text : '');
  }
  return {
    login,
    register,
    frame: (
      <iframe
        id="student-login"
        ref={frame}
        className="la-legacy"
        src={LEGACY_LOGIN}
        title="Talaba hisobi"
        aria-hidden="true"
        tabIndex={-1}
      />
    ),
  };
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
