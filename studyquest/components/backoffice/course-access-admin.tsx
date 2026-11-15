'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, KeyRound, Save, Trash2, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dueText } from '@/lib/points';
import { useAdminView, useL } from './common';
import type { CourseAccessAdminView } from '@/lib/server/course-access';
import { MAIN_COURSE_ID } from '@/lib/course-access';

/* 🔑 Sayt boshqaruvi → Kursga ruxsat. TerDU talabalari (talaba bo'limi, ustoz tasdiqlagan) kursga avvalgidek kiradi.
   Talaba bo'lmaganlar (email/Google, mustaqil o'quvchi) — faqat 💎 obuna yoki shu yerdagi ruxsat bilan. Bu yerda:
   «Ruxsat so'rash» so'rovlari, email bo'yicha ruxsat berish (o'zingiz dars o'tadigan, lekin email bilan
   ro'yxatdan o'tganlar uchun ham), ruxsatlar ro'yxati va umumiy sozlama (vaqtincha hammaga ochish). */
export function CourseAccessAdmin() {
  const L = useL();
  const { data } = useApp();
  // asosiy fan va pullik fanlar (restoran kursi …): har biri bo'yicha kim qatnasha oladi — alohida
  const courses = (data?.courses || []).filter((c) => c.id === MAIN_COURSE_ID || c.paid);
  const [course, setCourse] = useState(courses[0]?.id || '');
  const current = courses.find((c) => c.id === course) || courses[0];
  return (
    <>
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
        <PaidCourseAccess key={current.id} course={current.id} />
      ) : (
        <MainCourseAccess />
      )}
    </>
  );
}

function MainCourseAccess() {
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

/** 💳 Pullik kurs: narx va to'lov yo'riqnomasi, qatnashish so'rovlari, email yoki reyting bo'yicha ruxsat, ruxsatlar. */
function PaidCourseAccess({ course }: { course: string }) {
  const L = useL();
  const { lang, request } = useApp();
  const { data, error, busy, act } = useAdminView<CourseAccessAdminView>(
    'courseAccessAdmin&course=' + encodeURIComponent(course),
    'courseAccessAdmin',
  );
  const [email, setEmail] = useState(''),
    [shop, setShop] = useState({ price: '', how: '' }),
    [students, setStudents] = useState<{ id: string; name: string; classId?: string }[]>([]),
    [q, setQ] = useState('');
  const saved = data?.shop;
  useEffect(() => {
    if (saved) setShop({ price: saved.price, how: saved.how });
  }, [saved]);
  useEffect(() => {
    let live = true;
    request('/api/platform?view=academic')
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((v) => live && setStudents(v.leaderboard || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [request]);
  const found = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    return students
      .filter((s) => (s.name + ' ' + (s.classId || '')).toLowerCase().includes(n))
      .slice(0, 8);
  }, [q, students]);
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const now = Date.now();
  const has = new Set(data.grants.map((g) => g.uid));
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
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  disabled={!!busy}
                  aria-label={L('Ruxsat berish', 'Grant access', 'Разрешить') + ': ' + r.name}
                  onClick={() =>
                    void act({ op: 'approve', uid: r.uid, course }, 'ap' + r.uid, done).catch(
                      () => {},
                    )
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
                      { op: 'reject', uid: r.uid, course },
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
          <label>
            {L(
              'Yoki TerDU talabasini toping',
              'Or find a TerSU student',
              'Или найдите студента ТерГУ',
            )}
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L('Ism yoki guruh', 'Name or group', 'Имя или группа')}
            />
          </label>
          {!!found.length && (
            <ul className="bo-pick">
              {found.map((st) => (
                <li key={st.id}>
                  <button
                    type="button"
                    disabled={!!busy || has.has(st.id)}
                    onClick={() =>
                      void act(
                        { op: 'grantUser', uid: st.id, name: st.name, course },
                        'gu' + st.id,
                        done,
                      )
                        .then(() => setQ(''))
                        .catch(() => {})
                    }
                  >
                    <b>{st.name}</b>
                    <small>
                      {(st.classId || '') +
                        (has.has(st.id)
                          ? ' · ' + L('ruxsati bor', 'has access', 'есть доступ')
                          : '')}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="bo-hint">
            {data.email
              ? L(
                  'Qatnashchi avval saytda ro‘yxatdan o‘tsin, keyin emailini yozing. TerDU talabalarini ism yoki guruh bo‘yicha toping.',
                  'The participant registers on the site first, then enter their email. Find TerSU students by name or group.',
                  'Участник сначала регистрируется на сайте, затем введите его email. Студентов ТерГУ ищите по имени или группе.',
                )
              : L(
                  'Demo rejimida email bo‘yicha qidirib bo‘lmaydi — so‘rovlar yoki talabalar ro‘yxatidan foydalaning.',
                  'Email lookup is unavailable in demo mode — use requests or the student list.',
                  'В демо-режиме поиск по email недоступен — используйте запросы или список студентов.',
                )}
          </p>
        </form>
        <form
          className="bo-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void act(
              { op: 'shop', course, price: shop.price.trim(), how: shop.how.trim() },
              'shop',
              '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'),
            ).catch(() => {});
          }}
        >
          <h3>🏷 {L('Narx va to‘lov yo‘riqnomasi', 'Price and how to pay', 'Цена и оплата')}</h3>
          <label>
            {L(
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
                'Masalan: Click yoki Payme orqali … kartaga o‘tkazing, so‘ng «Qatnashish uchun so‘rov» tugmasini bosib chek raqamini yozing.',
                'E.g. pay by Click or Payme to card …, then press “Request to join” and add the receipt number.',
                'Например: переведите через Click или Payme на карту …, затем нажмите «Запрос на участие» и укажите номер чека.',
              )}
            />
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!!busy}>
              <Save size={15} /> {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
          </div>
        </form>
      </div>

      <div className="bo-card">
        <h3>
          ✅ {L('Qatnasha oladiganlar', 'Participants', 'Участники')} ({data.grants.length})
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
                      { op: 'revoke', uid: g.uid, course },
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
                'Hozircha hech kimga ruxsat berilmagan — darslarni faqat siz ochasiz.',
                'Nobody has access yet — only you can open the lessons.',
                'Пока ни у кого нет доступа — уроки открываете только вы.',
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
