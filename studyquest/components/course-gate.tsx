'use client';
import { useEffect, useState } from 'react';
import { Crown, GraduationCap, Hand, Lock } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { PremiumOffer, usePremium } from './premium';
import { dueText, tr } from '@/lib/points';

/* 🔑 Kursga kirish oynasi: talaba bo'lmagan foydalanuvchi (email/Google, mustaqil o'quvchi) kurs darslarini faqat
   💎 obuna bilan yoki administrator ruxsati bilan ochadi (server: lib/server/course-access.ts). Bu yerda —
   «Obuna bo'lish», «Ruxsat so'rash» (administrator «Sayt boshqaruvi → 🔑 Kursga ruxsat»da ko'radi) va
   «TerDU talabasiman» (talaba bo'limi orqali qayta kirish). */

/** Kirgan foydalanuvchi uchun kurs yopiqmi (obuna ham, ruxsat ham yo'q). */
export function useCourseLocked() {
  const { data } = useApp();
  return !!data?.user && data.course?.ok === false;
}

export function CourseGate({ compact }: { compact?: boolean }) {
  return useCourseLocked() ? <CourseGateCard compact={compact} /> : null;
}

function CourseGateCard({ compact }: { compact?: boolean }) {
  const { data, lang, request, toast, logout } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { premium } = usePremium();
  const [pending, setPending] = useState<number | null>(data?.course?.pending || null),
    [note, setNote] = useState(''),
    [asking, setAsking] = useState(false),
    [offer, setOffer] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => setPending(data?.course?.pending || null), [data?.course?.pending]);
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
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      if (v.ok) {
        toast('✅ ' + L('Kurs ochiq!', 'The course is open!', 'Курс открыт!'));
        location.reload();
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
  async function asStudent() {
    try {
      localStorage.setItem('sq-auth-kind', 'student');
    } catch {}
    await logout();
    navigate('login');
  }
  return (
    <section
      className={'panel course-gate' + (compact ? ' is-compact' : '')}
      aria-labelledby="course-gate-h"
    >
      <span className="course-gate-lock" aria-hidden="true">
        <Lock size={26} />
      </span>
      <div className="course-gate-body">
        <h2 id="course-gate-h">
          {L(
            'Kurs darslari obunachilar uchun',
            'Course lessons are for subscribers',
            'Уроки курса — для подписчиков',
          )}
        </h2>
        <p>
          {L(
            'Siz talaba bo‘limidan emas, oddiy foydalanuvchi sifatida kirgansiz. Darslarni ochish uchun 💎 obuna bo‘ling yoki administratordan ruxsat so‘rang.',
            'You signed in as a regular user, not through the student section. Get 💎 Premium or ask the administrator for access to open the lessons.',
            'Вы вошли как обычный пользователь, а не через раздел студента. Оформите 💎 подписку или попросите доступ у администратора.',
          )}
        </p>
        {pending ? (
          <div className="course-gate-pending" role="status">
            <span>
              ⏳{' '}
              {L(
                `Ruxsat so‘ralgan (${dueText(pending, lang, Date.now()).date}). Administrator ko‘rib chiqmoqda.`,
                `Access requested (${dueText(pending, lang, Date.now()).date}). The administrator is reviewing it.`,
                `Доступ запрошен (${dueText(pending, lang, Date.now()).date}). Администратор рассматривает запрос.`,
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
                'Izoh (ixtiyoriy): kimsiz, qaysi guruh yoki tashkilotdan',
                'Note (optional): who you are, your group or organisation',
                'Комментарий (необязательно): кто вы, группа или организация',
              )}
              <input
                className="input"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={L(
                  'Masalan: Iqtisodiyot fakulteti, 2-kurs',
                  'E.g. Economics faculty, 2nd year',
                  'Например: экономический факультет, 2 курс',
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
          <div className="course-gate-actions">
            <Button onClick={() => setOffer(true)}>
              <Crown size={16} /> {L('Obuna bo‘lish', 'Get Premium', 'Оформить подписку')}
            </Button>
            <Button variant="outline" onClick={() => setAsking(true)}>
              <Hand size={16} /> {L('Ruxsat so‘rash', 'Request access', 'Запросить доступ')}
            </Button>
          </div>
        )}
        <button type="button" className="course-gate-student" onClick={() => void asStudent()}>
          <GraduationCap size={15} aria-hidden="true" />
          {L(
            'TerDU talabasimisiz? Talaba bo‘limi orqali kiring',
            'Studying at TerSU? Sign in through the student section',
            'Студент ТерГУ? Войдите через раздел студента',
          )}
        </button>
      </div>
      {offer && <PremiumOffer info={premium?.info} onClose={() => setOffer(false)} />}
    </section>
  );
}
