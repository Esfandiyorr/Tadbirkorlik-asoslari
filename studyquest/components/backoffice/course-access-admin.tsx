'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Check, KeyRound, Save, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dueText } from '@/lib/points';
import { useAdminView, useL } from './common';
import type { CourseAccessAdminView } from '@/lib/server/course-access';
import { courseReceiptUrl, MAIN_COURSE_ID } from '@/lib/course-access';
import { ReceiptPreviewButton } from '../receipt';

export function CourseAccessAdmin({ openTab }: { openTab?: (tab: string) => void }) {
  const L = useL();
  const { data } = useApp();
  // asosiy fan va pullik fanlar (restoran kursi …): har biri bo'yicha kim qatnasha oladi — alohida
  const courses = (data?.courses || []).filter((c) => c.id === MAIN_COURSE_ID || c.paid);
  const [course, setCourse] = useState(courses[0]?.id || '');
  const current = courses.find((c) => c.id === course) || courses[0];
  return (
    <>
      <div className="bo-actions">
        <Button size="sm" variant="outline" asChild>
          <a href="#admin/payments">
            {L('To‘lovlar bo‘limini ochish', 'Open payments', 'Открыть платежи')}
          </a>
        </Button>
      </div>
      {courses.length > 1 && (
        <div className="bo-course-tabs" role="tablist" aria-label={L('Kurs', 'Course', 'Курс')}>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === current?.id}
              className={c.id === current?.id ? 'on' : ''}
              onClick={() => setCourse(c.id)}
            >
              {c.paid ? '💳 ' : '📘 '}
              {c.title}
            </button>
          ))}
        </div>
      )}
      {current?.paid ? (
        <PaidCourseAccess key={current.id} course={current.id} openTab={openTab} />
      ) : (
        <MainCourseAccess openTab={openTab} />
      )}
    </>
  );
}

type OpenTab = { openTab?: (tab: string) => void };
/** Kimga ruxsat berilgani va ruxsatni olish — «Talabalar bilan ishlash» bo'limida (bitta funksiya — bitta joyda). */
function GrantsSummary({ count, openTab }: { count: number } & OpenTab) {
  const L = useL();
  return (
    <div className="bo-card">
      <h3>
        ✅ {L('Ruxsat berilganlar', 'Access granted', 'С доступом')} ({count})
      </h3>
      <p className="bo-hint">
        {L(
          'Har bir talaba va foydalanuvchining kursga ruxsatini «👥 Talabalar bilan ishlash» bo‘limida ko‘rasiz, berasiz yoki olib tashlaysiz.',
          'See, grant or remove each person’s course access under “👥 Working with students”.',
          'Доступ каждого к курсу смотрите, выдавайте и снимайте в «👥 Работе со студентами».',
        )}
      </p>
      {openTab && (
        <div className="bo-actions">
          <Button size="sm" variant="outline" onClick={() => openTab('academic')}>
            👥 {L('Talabalar bilan ishlash', 'Working with students', 'Работа со студентами')}
          </Button>
        </div>
      )}
    </div>
  );
}

function MainCourseAccess({ openTab }: OpenTab) {
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
        <span className="bo-pill on">
          <KeyRound size={13} /> {L('Kirish cheklangan', 'Access restricted', 'Доступ ограничен')}
        </span>
        <span>
          {L(
            'Guruhi biriktirilgan talabalar kursga bevosita kiradi. Boshqa foydalanuvchilarning so‘rovlarini shu yerda tasdiqlang.',
            'Students with an assigned group can enter directly. Approve requests from other users here.',
            'Студенты с назначенной группой входят сразу. Здесь можно одобрять запросы других пользователей.',
          )}
        </span>
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
                <b>
                  {r.name}
                  {r.group && <em className="bo-group">🎓 {r.group}</em>}
                </b>
                <small>
                  {[r.email, dueText(r.at, lang, now).date].filter(Boolean).join(' · ')}
                </small>
                {r.note && <small className="bo-note">💬 {r.note}</small>}
                {r.payment && (
                  <ReceiptPreviewButton src={courseReceiptUrl(data.course, r.uid, r.payment.id)} />
                )}
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  disabled={!!busy}
                  aria-label={L('Ruxsat berish', 'Grant access', 'Разрешить') + ': ' + r.name}
                  onClick={() =>
                    void act(
                      { op: 'approve', uid: r.uid, paymentId: r.payment?.id ?? null },
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
                      { op: 'reject', uid: r.uid, paymentId: r.payment?.id ?? null },
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
            'To‘lovni tekshirgach, shu ro‘yxatdan kursga ruxsat bering. Ruxsat bekor qilinmaguncha amal qiladi.',
            'Once you verify payment, grant access from this list. Access lasts until you revoke it.',
            'После проверки оплаты выдайте доступ из этого списка. Доступ действует до отмены.',
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
        <CourseShopForm view={data} busy={busy} act={act} />
      </div>

      <GrantsSummary count={data.grants.length} openTab={openTab} />
    </div>
  );
}

function CourseShopForm({
  view,
  busy,
  act,
}: {
  view: CourseAccessAdminView;
  busy: string;
  act: (input: unknown, key: string, done: string) => Promise<CourseAccessAdminView>;
}) {
  const L = useL();
  const price = view.shop?.price ?? '';
  const how = view.shop?.how ?? '';
  const [shop, setShop] = useState({ price, how });
  useEffect(() => setShop({ price, how }), [price, how]);
  return (
    <form
      className="bo-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void act(
          { op: 'shop', course: view.course, price: shop.price.trim(), how: shop.how.trim() },
          'shop',
          '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'),
        ).catch(() => {});
      }}
    >
      <h3>🏷 {L('Narx va to‘lov yo‘riqnomasi', 'Price and how to pay', 'Цена и оплата')}</h3>
      <label>
        {view.course === MAIN_COURSE_ID
          ? L(
              'Kurs narxi (boshqa foydalanuvchilar uchun)',
              'Price for other users',
              'Цена для остальных пользователей',
            )
          : L(
              'Kurs narxi (hammaga ko‘rinadi)',
              'Course price (shown to everyone)',
              'Цена курса (видна всем)',
            )}
        <input
          className="input"
          maxLength={80}
          value={shop.price}
          onChange={(e) => setShop({ ...shop, price: e.target.value })}
          placeholder={L('Masalan: 450 000 so‘m', 'E.g. 450 000 so‘m', 'Например: 450 000 сум')}
        />
      </label>
      <label>
        {L('Qanday to‘lanadi', 'How to pay', 'Как оплатить')}
        <textarea
          className="input"
          rows={4}
          maxLength={600}
          value={shop.how}
          onChange={(e) => setShop({ ...shop, how: e.target.value })}
          placeholder={L(
            'Masalan: Click yoki Payme orqali … kartaga o‘tkazing, so‘ng kurs sahifasida chekni yuklang.',
            'E.g. pay by Click or Payme to card …, then upload the receipt on the course page.',
            'Например: переведите через Click или Payme на карту …, затем загрузите чек на странице курса.',
          )}
        />
      </label>
      <div className="bo-actions">
        <Button type="submit" disabled={!!busy}>
          <Save size={15} /> {L('Saqlash', 'Save', 'Сохранить')}
        </Button>
      </div>
    </form>
  );
}

/** 💳 Pullik kurs: narx va to'lov yo'riqnomasi, qatnashish so'rovlari, email yoki reyting bo'yicha ruxsat, ruxsatlar. */
function PaidCourseAccess({ course, openTab }: { course: string } & OpenTab) {
  const L = useL();
  const { lang } = useApp();
  const { data, error, busy, act } = useAdminView<CourseAccessAdminView>(
    'courseAccessAdmin&course=' + encodeURIComponent(course),
    'courseAccessAdmin',
  );
  const [email, setEmail] = useState('');
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const now = Date.now();
  const done = '✅ ' + L('Ruxsat berildi', 'Access granted', 'Доступ выдан');
  return (
    <div className="bo-live bo-course-access is-paid">
      <div className="bo-status">
        <span className="bo-pill on">💳 {L('Pullik kurs', 'Paid course', 'Платный курс')}</span>
        <span>
          {L(
            'Kurs hammaga ko‘rinadi, lekin darslarni faqat siz (administrator) va shu yerda ruxsat berilgan qatnashchilar ochadi. Qolganlarga «💳 Kurs pullik» oynasi chiqadi.',
            'Everyone sees the course, but only you (the administrator) and participants approved here can open the lessons. Everyone else sees “💳 Paid course”.',
            'Курс видят все, но уроки открывают только вы (администратор) и одобренные здесь участники. Остальные видят «💳 Платный курс».',
          )}
        </span>
      </div>

      <div className="bo-card">
        <h3>
          🙋 {L('Qatnashish so‘rovlari', 'Requests to join', 'Запросы на участие')} (
          {data.requests.length})
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
                {r.payment && (
                  <ReceiptPreviewButton src={courseReceiptUrl(data.course, r.uid, r.payment.id)} />
                )}
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  disabled={!!busy}
                  aria-label={L('Ruxsat berish', 'Grant access', 'Разрешить') + ': ' + r.name}
                  onClick={() =>
                    void act(
                      { op: 'approve', uid: r.uid, course, paymentId: r.payment?.id ?? null },
                      'ap' + r.uid,
                      done,
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
                      { op: 'reject', uid: r.uid, course, paymentId: r.payment?.id ?? null },
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
      </div>

      <div className="bo-grid">
        <form
          className="bo-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void act({ op: 'grant', email: email.trim(), course }, 'grant', done)
              .then(() => setEmail(''))
              .catch(() => {});
          }}
        >
          <h3>➕ {L('Ruxsat berish', 'Grant access', 'Выдать доступ')}</h3>
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ishchi@gmail.com"
              disabled={!data.email}
            />
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!data.email || !email.trim() || !!busy}>
              <Check size={15} /> {L('Email bo‘yicha', 'By email', 'По email')}
            </Button>
          </div>
          <p className="bo-hint">
            {data.email
              ? L(
                  'Qatnashchi avval saytda ro‘yxatdan o‘tsin, keyin emailini yozing. TerDU talabasiga ruxsat — «Talabalar bilan ishlash» bo‘limida.',
                  'The participant registers on the site first, then enter their email. TerSU students get access under “Working with students”.',
                  'Участник сначала регистрируется на сайте, затем введите его email. Студентам ТерГУ доступ — в «Работе со студентами».',
                )
              : L(
                  'Demo rejimida email bo‘yicha qidirib bo‘lmaydi — so‘rovlardan yoki «Talabalar bilan ishlash» bo‘limidan foydalaning.',
                  'Email lookup is unavailable in demo mode — use requests or the student list.',
                  'В демо-режиме поиск по email недоступен — используйте запросы или список студентов.',
                )}
          </p>
        </form>
        <CourseShopForm view={data} busy={busy} act={act} />
      </div>

      <GrantsSummary count={data.grants.length} openTab={openTab} />
    </div>
  );
}
