'use client';
import { useState, type FormEvent } from 'react';
import { Check, KeyRound, Trash2, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dueText } from '@/lib/points';
import { useAdminView, useL } from './common';
import type { CourseAccessAdminView } from '@/lib/server/course-access';

/* 🔑 Sayt boshqaruvi → Kursga ruxsat. TerDU talabalari (talaba bo'limi, ustoz tasdiqlagan) kursga avvalgidek kiradi.
   Talaba bo'lmaganlar (email/Google, mustaqil o'quvchi) — faqat 💎 obuna yoki shu yerdagi ruxsat bilan. Bu yerda:
   «Ruxsat so'rash» so'rovlari, email bo'yicha ruxsat berish (o'zingiz dars o'tadigan, lekin email bilan
   ro'yxatdan o'tganlar uchun ham), ruxsatlar ro'yxati va umumiy sozlama (vaqtincha hammaga ochish). */
export function CourseAccessAdmin() {
  const L = useL();
  const { lang } = useApp();
  const { data, error, busy, act } = useAdminView<CourseAccessAdminView>(
    'courseAccessAdmin',
    'courseAccessAdmin',
  );
  const [email, setEmail] = useState('');
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const now = Date.now();
  const grant = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await act(
        { op: 'grant', email: email.trim() },
        'grant',
        '✅ ' + L('Ruxsat berildi', 'Access granted', 'Доступ выдан'),
      );
      setEmail('');
    } catch {}
  };
  return (
    <div className="bo-live bo-course-access">
      <div className="bo-status">
        <span className={'bo-pill ' + (data.gate.off ? 'off' : 'on')}>
          <KeyRound size={13} />{' '}
          {data.gate.off
            ? L('Hammaga ochiq', 'Open to all', 'Открыт всем')
            : L('Yoqilgan', 'On', 'Включено')}
        </span>
        <span>
          {data.gate.off
            ? L(
                'Kurs hozir hamma ro‘yxatdan o‘tganlarga ochiq (obuna va ruxsat tekshirilmayapti).',
                'The course is currently open to everyone who registers (no Premium or permission check).',
                'Курс сейчас открыт всем зарегистрированным (подписка и разрешение не проверяются).',
              )
            : L(
                'TerDU talabalari kursga avvalgidek kiradi. Talaba bo‘lmaganlar — faqat 💎 obuna yoki shu yerdagi ruxsat bilan.',
                'TerSU students enter the course as before. Everyone else — only with 💎 Premium or permission given here.',
                'Студенты ТерГУ входят как раньше. Остальные — только с 💎 подпиской или разрешением отсюда.',
              )}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() =>
            void act(
              { op: 'gate', off: !data.gate.off },
              'gate',
              data.gate.off
                ? '🔒 ' +
                    L(
                      'Kurs yana faqat obuna/ruxsat bilan',
                      'Course gated again',
                      'Курс снова по подписке/разрешению',
                    )
                : '🟢 ' +
                    L('Kurs hammaga ochildi', 'Course opened to everyone', 'Курс открыт всем'),
            ).catch(() => {})
          }
        >
          {data.gate.off
            ? L(
                '🔒 Faqat obuna/ruxsat bilan',
                '🔒 Premium/permission only',
                '🔒 Только подписка/разрешение',
              )
            : L(
                '🟢 Vaqtincha hammaga ochish',
                '🟢 Open to everyone for now',
                '🟢 Временно открыть всем',
              )}
        </Button>
      </div>

      <div className="bo-card">
        <h3>
          🙋 {L('Ruxsat so‘raganlar', 'Access requests', 'Запросы доступа')} ({data.requests.length}
          )
        </h3>
        <ul className="bo-list bo-app-requests">
          {data.requests.map((r) => (
            <li key={r.uid}>
              <div>
                <b>{r.name}</b>
                <small>
                  {[r.email, dueText(r.at, lang, now).date].filter(Boolean).join(' · ')}
                </small>
                {r.note && <small className="bo-note">💬 {r.note}</small>}
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  disabled={!!busy}
                  aria-label={L('Ruxsat berish', 'Grant access', 'Разрешить') + ': ' + r.name}
                  onClick={() =>
                    void act(
                      { op: 'approve', uid: r.uid },
                      'ap' + r.uid,
                      '✅ ' + L('Ruxsat berildi', 'Access granted', 'Доступ выдан'),
                    ).catch(() => {})
                  }
                >
                  <Check size={14} /> {L('Ruxsat', 'Allow', 'Разрешить')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!busy}
                  aria-label={L('Rad etish', 'Decline', 'Отклонить') + ': ' + r.name}
                  onClick={() =>
                    void act(
                      { op: 'reject', uid: r.uid },
                      'rj' + r.uid,
                      L('So‘rov rad etildi', 'Request declined', 'Запрос отклонён'),
                    ).catch(() => {})
                  }
                >
                  <X size={14} />
                </Button>
              </span>
            </li>
          ))}
          {!data.requests.length && (
            <li className="muted">
              {L('Yangi so‘rov yo‘q.', 'No new requests.', 'Новых запросов нет.')}
            </li>
          )}
        </ul>
        <p className="bo-hint">
          {L(
            'Pul to‘laganlarga «💎 Obuna» bo‘limida obuna bering — ular ham shu ro‘yxatdan topiladi. Bepul ruxsat esa muddatsiz: bekor qilmaguningizcha amal qiladi.',
            'Give paying users Premium in the “💎 Premium” section — they can be found there too. Free access has no end date: it lasts until you remove it.',
            'Оплатившим выдайте подписку в разделе «💎 Подписка» — их можно найти и там. Бесплатный доступ бессрочный — действует, пока вы его не отмените.',
          )}
        </p>
      </div>

      <div className="bo-grid">
        <form className="bo-form" onSubmit={(e) => void grant(e)}>
          <h3>
            ➕ {L('Email bo‘yicha ruxsat berish', 'Grant access by email', 'Доступ по email')}
          </h3>
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="talaba@gmail.com"
              disabled={!data.email}
            />
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!data.email || !email.trim() || !!busy}>
              <Check size={15} /> {L('Ruxsat berish', 'Grant access', 'Выдать доступ')}
            </Button>
          </div>
          <p className="bo-hint">
            {data.email
              ? L(
                  'O‘zingiz dars o‘tadigan, lekin email yoki Google bilan ro‘yxatdan o‘tgan talabalar uchun: avval ular saytda ro‘yxatdan o‘tsin, keyin emailini shu yerga yozing.',
                  'For your own students who registered with email or Google: let them register on the site first, then enter their email here.',
                  'Для ваших студентов, зарегистрировавшихся через email или Google: пусть сначала зарегистрируются, затем введите их email здесь.',
                )
              : L(
                  'Demo rejimida email bo‘yicha qidirib bo‘lmaydi — so‘rovlar ro‘yxatidan foydalaning.',
                  'Email lookup is unavailable in demo mode — use the request list.',
                  'В демо-режиме поиск по email недоступен — используйте список запросов.',
                )}
          </p>
        </form>
        <div className="bo-form bo-course-explain">
          <h3>🎓 {L('Kim qanday kiradi', 'Who gets in and how', 'Кто и как входит')}</h3>
          <ul>
            <li>
              {L(
                '🎓 TerDU talabasi — «Ha, TerDU talabasiman» bo‘limida guruhi bilan ro‘yxatdan o‘tadi, siz «Talabalar va baholar»da tasdiqlaysiz: darslar, ballar va reyting ochiladi (obunasiz).',
                '🎓 TerSU student — registers with their group under “Yes, I study at TerSU”; you approve in “Students and grades”: lessons, points and ranking open (no Premium needed).',
                '🎓 Студент ТерГУ — регистрируется с группой в разделе «Да, я студент ТерГУ», вы подтверждаете в «Студенты и оценки»: открываются уроки, баллы и рейтинг (без подписки).',
              )}
            </li>
            <li>
              {L(
                '🌍 Boshqalar — email yoki Google bilan ro‘yxatdan o‘tadi; sayt ochiq, kurs darslari — 💎 obuna yoki ruxsat bilan.',
                '🌍 Everyone else — registers with email or Google; the site is open, course lessons need 💎 Premium or permission.',
                '🌍 Остальные — регистрация через email или Google; сайт открыт, уроки курса — по 💎 подписке или разрешению.',
              )}
            </li>
          </ul>
        </div>
      </div>

      <div className="bo-card">
        <h3>
          ✅ {L('Ruxsat berilganlar', 'Access granted', 'С доступом')} ({data.grants.length})
        </h3>
        <ul className="bo-list bo-app-requests">
          {data.grants.map((g) => (
            <li key={g.uid}>
              <div>
                <b>{g.name}</b>
                <small>
                  {[g.email, L('berilgan: ', 'since ', 'с ') + dueText(g.at, lang, now).date]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!busy}
                  aria-label={
                    L('Ruxsatni olish', 'Remove access', 'Отозвать доступ') + ': ' + g.name
                  }
                  onClick={() =>
                    void act(
                      { op: 'revoke', uid: g.uid },
                      'rv' + g.uid,
                      L('Ruxsat olib tashlandi', 'Access removed', 'Доступ отозван'),
                    ).catch(() => {})
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </span>
            </li>
          ))}
          {!data.grants.length && (
            <li className="muted">
              {L(
                'Hozircha hech kimga ruxsat berilmagan.',
                'Nobody has access yet.',
                'Пока никому не выдан доступ.',
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
