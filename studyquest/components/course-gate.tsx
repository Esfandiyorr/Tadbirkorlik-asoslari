'use client';
import { useEffect, useState } from 'react';
import { CreditCard, GraduationCap, Hand, Lock } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { dueText, tr } from '@/lib/points';
import { isPlayApp } from '@/lib/play-app';

export function useCourseLocked() {
  const { data } = useApp();
  return !!data?.user && data.course?.ok === false;
}

export function CourseGate({ compact }: { compact?: boolean }) {
  const { data, lang } = useApp();
  const locked = useCourseLocked();
  if (locked) return <CourseGateCard compact={compact} />;
  if (data?.user || compact) return null;
  return (
    <section className="panel course-gate">
      <span className="course-gate-lock" aria-hidden="true">
        <Lock size={26} />
      </span>
      <div className="course-gate-body">
        <h2>{tr(lang, 'Kursga kirish', 'Course access', 'Доступ к курсу')}</h2>
        <p>
          {tr(
            lang,
            'Darslarni ochish yoki ruxsat so‘rash uchun hisobingizga kiring.',
            'Sign in to open lessons or request access.',
            'Войдите, чтобы открыть уроки или запросить доступ.',
          )}
        </p>
        <Button onClick={() => navigate('login')}>{tr(lang, 'Kirish', 'Sign in', 'Войти')}</Button>
      </div>
    </section>
  );
}

function CourseGateCard({ compact }: { compact?: boolean }) {
  const { data, lang, request, toast, logout, refresh } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = data?.course?.pending;
  async function act(op: 'request' | 'cancel') {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'courseRequest',
          input: { op, ...(op === 'request' && note.trim() ? { note: note.trim() } : {}) },
        }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      setAsking(false);
      setNote('');
      await refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function asStudent() {
    try {
      localStorage.setItem('sq-auth-kind', 'student');
    } catch {}
    await logout();
    navigate('login');
  }
  return (
    <section className={'panel course-gate' + (compact ? ' is-compact' : '')}>
      <span className="course-gate-lock" aria-hidden="true">
        <Lock size={26} />
      </span>
      <div className="course-gate-body">
        <h2>
          {pending
            ? L('So‘rov yuborilgan', 'Request sent', 'Запрос отправлен')
            : L(
                'Kursga kirish uchun ruxsat kerak',
                'Course access requires approval',
                'Для доступа нужно разрешение',
              )}
        </h2>
        {pending ? (
          <div className="course-gate-pending" role="status">
            <span>
              {L(
                'Administrator so‘rovni tasdiqlagach, darslar ochiladi.',
                'Lessons open once the administrator approves your request.',
                'Уроки откроются после одобрения запроса администратором.',
              )}
            </span>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void refresh()}>
              {L('Holatni tekshirish', 'Check status', 'Проверить статус')}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act('cancel')}>
              {L('So‘rovni bekor qilish', 'Cancel request', 'Отменить запрос')}
            </Button>
          </div>
        ) : asking ? (
          <form
            className="course-gate-ask"
            onSubmit={(e) => {
              e.preventDefault();
              void act('request');
            }}
          >
            <label>
              {L(
                'Izoh (ixtiyoriy) — o‘zingiz haqingizda yoki guruhingizni yozing',
                'Optional note — tell us about yourself or enter your group',
                'Комментарий по желанию — расскажите о себе или укажите группу',
              )}
              <input
                className="input"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="course-gate-actions">
              <Button type="submit" disabled={busy}>
                <Hand size={16} /> {L('So‘rov yuborish', 'Send request', 'Отправить запрос')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
                {L('Orqaga', 'Back', 'Назад')}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p>
              {L(
                'Kurs guruhi biriktirilgan talabalar uchun ochiq. Darslarga kirish uchun administratordan ruxsat so‘rang.',
                'The course is open to students with an assigned group. Ask the administrator for permission to access the lessons.',
                'Курс открыт для студентов с назначенной группой. Для доступа к урокам запросите разрешение администратора.',
              )}
            </p>
            <div className="course-gate-actions">
              <Button onClick={() => setAsking(true)}>
                <Hand size={16} /> {L('Ruxsat so‘rash', 'Request access', 'Запросить доступ')}
              </Button>
            </div>
          </>
        )}
        <button type="button" className="course-gate-student" onClick={() => void asStudent()}>
          <GraduationCap size={15} aria-hidden="true" />
          {L(
            'Guruhi biriktirilgan talaba hisobingiz bilan kiring',
            'Sign in with your student account associated with a group',
            'Войдите в свой студенческий аккаунт с назначенной группой',
          )}
        </button>
      </div>
    </section>
  );
}

/* 💳 Pullik kurs (masalan, restoran kursi): kurs hammaga ko'rinadi, darslarini faqat administrator va u ruxsat bergan
   qatnashchilar ochadi. Bu oynada — narx va to'lov yo'riqnomasi (Play Market ilovasida ko'rsatilmaydi), «qatnashish
   uchun so'rov» (administrator «Sayt boshqaruvi → 🔑 Kursga ruxsat»da kurs tanlab ko'radi) va mehmonga «Kirish». */

/** Pullik kurs foydalanuvchi uchun yopiqmi (pullik bo'lmasa yoki ruxsat bo'lsa — false). */
export function usePaidLocked(courseId?: string) {
  const { data } = useApp();
  const c = courseId ? data?.courses.find((x) => x.id === courseId) : undefined;
  if (!c?.paid) return false;
  if (data?.user?.role === 'admin') return false;
  return data?.paid?.[c.id]?.ok !== true;
}

export function PaidCourseGate({ courseId, compact }: { courseId: string; compact?: boolean }) {
  return usePaidLocked(courseId) ? <PaidCourseCard courseId={courseId} compact={compact} /> : null;
}

function PaidCourseCard({ courseId, compact }: { courseId: string; compact?: boolean }) {
  const { data, lang, request, toast, refresh } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const state = data?.paid?.[courseId],
    course = data?.courses.find((c) => c.id === courseId),
    signedIn = !!data?.user;
  const [pending, setPending] = useState<number | null>(state?.pending || null),
    [note, setNote] = useState(''),
    [asking, setAsking] = useState(false),
    [busy, setBusy] = useState(false),
    [play, setPlay] = useState(false);
  useEffect(() => setPending(state?.pending || null), [state?.pending]);
  useEffect(() => setPlay(isPlayApp()), []);
  async function act(op: 'request' | 'cancel') {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'courseRequest',
            input: {
              op,
              course: courseId,
              ...(op === 'request' && note.trim() ? { note: note.trim() } : {}),
            },
          }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      if (v.ok) {
        toast('✅ ' + L('Kurs ochiq!', 'The course is open!', 'Курс открыт!'));
        await refresh();
        return;
      }
      setPending(v.pending || null);
      setAsking(false);
      setNote('');
      toast(
        op === 'request'
          ? '🙋 ' +
              L(
                'So‘rov yuborildi. Administrator ruxsat berishi bilan darslar ochiladi.',
                'Request sent. Lessons open as soon as the administrator approves.',
                'Запрос отправлен. Уроки откроются, как только администратор разрешит.',
              )
          : L('So‘rov bekor qilindi.', 'Request cancelled.', 'Запрос отменён.'),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={'panel course-gate is-paid' + (compact ? ' is-compact' : '')}
      aria-labelledby={'paid-gate-h-' + courseId}
    >
      <span className="course-gate-lock" aria-hidden="true">
        <CreditCard size={26} />
      </span>
      <div className="course-gate-body">
        <h2 id={'paid-gate-h-' + courseId}>
          {L('💳 Bu kurs pullik', '💳 This is a paid course', '💳 Это платный курс')}
        </h2>
        <p>
          {L(
            `«${course?.title || ''}» darslariga faqat administrator ruxsat bergan qatnashchilar kiradi. Qatnashish uchun to‘lov qiling yoki so‘rov yuboring.`,
            `Only participants approved by the administrator can open the lessons of “${course?.title || ''}”. Pay or send a request to join.`,
            `Уроки курса «${course?.title || ''}» открыты только участникам, которых одобрил администратор. Оплатите или отправьте запрос.`,
          )}
        </p>
        {!play && (state?.price || state?.how) && (
          <div className="paid-gate-price">
            {state?.price && <b>{state.price}</b>}
            {state?.how && <p>{state.how}</p>}
          </div>
        )}
        {!signedIn ? (
          <div className="course-gate-actions">
            <Button onClick={() => navigate('login')}>
              {L(
                'Kirish yoki ro‘yxatdan o‘tish',
                'Sign in or register',
                'Войти или зарегистрироваться',
              )}
            </Button>
          </div>
        ) : pending ? (
          <div className="course-gate-pending" role="status">
            <span>
              ⏳{' '}
              {L(
                `So‘rov yuborilgan (${dueText(pending, lang, Date.now()).date}). Administrator ko‘rib chiqmoqda.`,
                `Request sent (${dueText(pending, lang, Date.now()).date}). The administrator is reviewing it.`,
                `Запрос отправлен (${dueText(pending, lang, Date.now()).date}). Администратор рассматривает его.`,
              )}
            </span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act('cancel')}>
              {L('Bekor qilish', 'Cancel', 'Отменить')}
            </Button>
          </div>
        ) : asking ? (
          <form
            className="course-gate-ask"
            onSubmit={(e) => {
              e.preventDefault();
              void act('request');
            }}
          >
            <label>
              {L(
                'Izoh (ixtiyoriy): kimsiz, qayerda ishlaysiz, to‘lov cheki raqami',
                'Note (optional): who you are, where you work, receipt number',
                'Комментарий (необязательно): кто вы, где работаете, номер чека',
              )}
              <input
                className="input"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="course-gate-actions">
              <Button type="submit" disabled={busy}>
                <Hand size={16} /> {L('So‘rov yuborish', 'Send request', 'Отправить запрос')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
                {L('Orqaga', 'Back', 'Назад')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="course-gate-actions">
            <Button onClick={() => setAsking(true)}>
              <Hand size={16} />{' '}
              {L('Qatnashish uchun so‘rov', 'Request to join', 'Запрос на участие')}
            </Button>
            {!play && (
              <Button variant="outline" onClick={() => navigate('chat/admin')}>
                {L(
                  'Administratorga yozish',
                  'Write to the administrator',
                  'Написать администратору',
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
