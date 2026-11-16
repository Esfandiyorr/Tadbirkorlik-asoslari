'use client';
import { useEffect, useState } from 'react';
import { CreditCard, Crown, GraduationCap, Hand, Lock } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { PremiumOffer, usePremium } from './premium';
import { dueText, tr } from '@/lib/points';
import { isPlayApp } from '@/lib/play-app';

/* 🔑 Kursga kirish oynasi (server: lib/server/course-access.ts). Ro'yxatdan o'tishda «Talabamisiz?» so'ralmaydi —
   kursni boshlaganda shu oynada so'raladi:
   • «Ha, talabaman» → guruhini yozib kursga yoziladi (o'qituvchi/administrator «Sayt boshqaruvi → 🔑 Kursga ruxsat»da
     tasdiqlaydi; administrator «talabalarga darhol ochish»ni yoqqan bo'lsa — kurs shu zahoti ochiladi);
   • «Yo'q» → 💎 obuna yoki «Ruxsat so'rash».
   Avvalgi talaba hisobi (ism + kod) borlar uchun — talaba bo'limi orqali kirish havolasi. */

/** Kirgan foydalanuvchi uchun kurs yopiqmi (obuna ham, ruxsat ham yo'q). */
export function useCourseLocked() {
  const { data } = useApp();
  return !!data?.user && data.course?.ok === false;
}

export function CourseGate({ compact }: { compact?: boolean }) {
  return useCourseLocked() ? <CourseGateCard compact={compact} /> : null;
}

function CourseGateCard({ compact }: { compact?: boolean }) {
  const { data, lang, request, toast, logout, refresh } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { premium } = usePremium();
  const [pending, setPending] = useState<number | null>(data?.course?.pending || null),
    [group, setGroup] = useState(data?.course?.group || ''),
    // 🎓 «Talabamisiz?»: ask — savol, student — guruh bilan yozilish, other — obuna yoki ruxsat so'rash
    [step, setStep] = useState<'ask' | 'student' | 'other'>('ask'),
    [note, setNote] = useState(''),
    [asking, setAsking] = useState(false),
    [offer, setOffer] = useState(false),
    [busy, setBusy] = useState(false);
  const [pendingGroup, setPendingGroup] = useState(data?.course?.group || '');
  useEffect(() => setPending(data?.course?.pending || null), [data?.course?.pending]);
  useEffect(() => setPendingGroup(data?.course?.group || ''), [data?.course?.group]);
  async function act(op: 'request' | 'cancel', input: Record<string, string> = {}) {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'courseRequest', input: { op, ...input } }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      if (v.ok) {
        toast('✅ ' + L('Kurs ochiq!', 'The course is open!', 'Курс открыт!'));
        await refresh();
        return;
      }
      setPending(v.pending || null);
      setPendingGroup(v.group || '');
      setAsking(false);
      setNote('');
      await refresh();
      toast(
        op === 'cancel'
          ? L('So‘rov bekor qilindi.', 'Request cancelled.', 'Запрос отменён.')
          : input.group
            ? '🎓 ' +
              L(
                'Kursga yozildingiz! O‘qituvchi tasdiqlashi bilan darslar ochiladi.',
                'You are enrolled! Lessons open as soon as the teacher approves.',
                'Вы записаны на курс! Уроки откроются после подтверждения преподавателем.',
              )
            : '🙋 ' +
              L(
                'So‘rov yuborildi. Administrator ruxsat berishi bilan darslar ochiladi.',
                'Request sent. Lessons open as soon as the administrator approves.',
                'Запрос отправлен. Уроки откроются, как только администратор разрешит.',
              ),
      );
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
  const groupOk = /^[\p{L}\p{N}][\p{L}\p{N} ._/-]{1,39}$/u.test(group.trim());
  const heading = pending
    ? pendingGroup
      ? L('Kursga yozildingiz', 'You are enrolled', 'Вы записаны на курс')
      : L('So‘rov yuborilgan', 'Request sent', 'Запрос отправлен')
    : step === 'ask'
      ? L('Kursni boshlaymizmi? 🚀', 'Ready to start the course? 🚀', 'Начнём курс? 🚀')
      : step === 'student'
        ? L('Guruhingiz bilan yoziling', 'Enrol with your group', 'Запишитесь со своей группой')
        : L(
            'Kurs darslari obunachilar uchun',
            'Course lessons are for subscribers',
            'Уроки курса — для подписчиков',
          );
  return (
    <section
      className={'panel course-gate' + (compact ? ' is-compact' : '')}
      aria-labelledby="course-gate-h"
    >
      <span className="course-gate-lock" aria-hidden="true">
        {step !== 'other' && !pending ? <GraduationCap size={26} /> : <Lock size={26} />}
      </span>
      <div className="course-gate-body">
        <h2 id="course-gate-h">{heading}</h2>
        {pending ? (
          <div className="course-gate-pending" role="status">
            <span>
              ⏳{' '}
              {pendingGroup
                ? L(
                    `🎓 Guruh: ${pendingGroup} · ${dueText(pending, lang, Date.now()).date}. O‘qituvchi tasdiqlashi bilan darslar ochiladi.`,
                    `🎓 Group: ${pendingGroup} · ${dueText(pending, lang, Date.now()).date}. Lessons open once the teacher approves.`,
                    `🎓 Группа: ${pendingGroup} · ${dueText(pending, lang, Date.now()).date}. Уроки откроются после подтверждения преподавателем.`,
                  )
                : L(
                    `Ruxsat so‘ralgan (${dueText(pending, lang, Date.now()).date}). Administrator ko‘rib chiqmoqda.`,
                    `Access requested (${dueText(pending, lang, Date.now()).date}). The administrator is reviewing it.`,
                    `Доступ запрошен (${dueText(pending, lang, Date.now()).date}). Администратор рассматривает запрос.`,
                  )}
            </span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act('cancel')}>
              {L('Bekor qilish', 'Cancel', 'Отменить')}
            </Button>
          </div>
        ) : step === 'ask' ? (
          <div className="course-gate-kind" role="group" aria-labelledby="course-gate-q">
            <p id="course-gate-q" className="course-gate-q">
              {L('Talabamisiz?', 'Are you a student?', 'Вы студент?')}
            </p>
            <button type="button" className="auth-kind-card" onClick={() => setStep('student')}>
              <span className="auth-kind-ico" aria-hidden="true">
                🎓
              </span>
              <span className="auth-kind-text">
                <b>{L('Ha, talabaman', 'Yes, I am a student', 'Да, я студент')}</b>
                <small>
                  {L(
                    'Guruhingizni yozasiz va kursga yozilasiz — o‘qituvchi tasdiqlashi bilan darslar, ballar va reyting ochiladi.',
                    'Enter your group and enrol — lessons, points and ranking open once the teacher approves.',
                    'Укажите группу и запишитесь — уроки, баллы и рейтинг откроются после подтверждения преподавателем.',
                  )}
                </small>
              </span>
            </button>
            <button type="button" className="auth-kind-card" onClick={() => setStep('other')}>
              <span className="auth-kind-ico" aria-hidden="true">
                🌍
              </span>
              <span className="auth-kind-text">
                <b>{L('Yo‘q, talaba emasman', 'No, I am not a student', 'Нет, я не студент')}</b>
                <small>
                  {L(
                    'Darslar 💎 obuna bilan yoki administrator ruxsati bilan ochiladi.',
                    'Lessons open with 💎 Premium or with the administrator’s permission.',
                    'Уроки открываются с 💎 подпиской или по разрешению администратора.',
                  )}
                </small>
              </span>
            </button>
          </div>
        ) : step === 'student' ? (
          <form
            className="course-gate-ask"
            onSubmit={(e) => {
              e.preventDefault();
              if (groupOk) void act('request', { group: group.trim() });
            }}
          >
            <label>
              {L('Guruhingiz', 'Your group', 'Ваша группа')}
              <input
                className="input"
                maxLength={40}
                value={group}
                autoFocus
                onChange={(e) => setGroup(e.target.value)}
                placeholder={L('Masalan: AP-223', 'E.g. AP-223', 'Например: AP-223')}
              />
            </label>
            <div className="course-gate-actions">
              <Button type="submit" disabled={busy || !groupOk}>
                <GraduationCap size={16} /> {L('Kursga yozilish', 'Enrol', 'Записаться')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('ask')}>
                {L('Orqaga', 'Back', 'Назад')}
              </Button>
            </div>
          </form>
        ) : asking ? (
          <form
            className="course-gate-ask"
            onSubmit={(e) => {
              e.preventDefault();
              void act('request', note.trim() ? { note: note.trim() } : {});
            }}
          >
            <label>
              {L(
                'Izoh (ixtiyoriy): kimsiz, qaysi tashkilotdan',
                'Note (optional): who you are, your organisation',
                'Комментарий (необязательно): кто вы, организация',
              )}
              <input
                className="input"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={L(
                  'Masalan: o‘qituvchiman, kursni ko‘rib chiqmoqchiman',
                  'E.g. I am a teacher and want to review the course',
                  'Например: я преподаватель, хочу посмотреть курс',
                )}
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
                'Darslarni ochish uchun 💎 obuna bo‘ling yoki administratordan ruxsat so‘rang.',
                'Get 💎 Premium or ask the administrator for access to open the lessons.',
                'Оформите 💎 подписку или попросите доступ у администратора.',
              )}
            </p>
            <div className="course-gate-actions">
              <Button onClick={() => setOffer(true)}>
                <Crown size={16} /> {L('Obuna bo‘lish', 'Get Premium', 'Оформить подписку')}
              </Button>
              <Button variant="outline" onClick={() => setAsking(true)}>
                <Hand size={16} /> {L('Ruxsat so‘rash', 'Request access', 'Запросить доступ')}
              </Button>
              <Button variant="ghost" onClick={() => setStep('ask')}>
                {L('Orqaga', 'Back', 'Назад')}
              </Button>
            </div>
          </>
        )}
        <button type="button" className="course-gate-student" onClick={() => void asStudent()}>
          <GraduationCap size={15} aria-hidden="true" />
          {L(
            'Avvalgi talaba hisobingiz (ism va kod) bormi? Talaba bo‘limi orqali kiring',
            'Have an earlier student account (name and code)? Sign in through the student section',
            'Есть прежний аккаунт студента (имя и код)? Войдите через раздел студента',
          )}
        </button>
      </div>
      {offer && <PremiumOffer info={premium?.info} onClose={() => setOffer(false)} />}
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
