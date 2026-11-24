'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Crown } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { Receipts } from '../receipt';
import { servicesAct } from '../service-files';
import { PREMIUM_TERMS, formatSum, termText } from '@/lib/services';
import { useAdminView, useL } from './common';
import type { PremiumAdminView } from '@/lib/server/premium';

/* 💎 Sayt boshqaruvi → Obuna: 🧾 chek yuborganlar (1 oy yoki 1 yilga qabul qilish, qabul qilmaslik), 👥 obunachilar —
   qancha muddatga va qancha to'lagani (har bir ochilish tarixi bilan), obunani bekor qilish va qo'lda obuna berish. */
type Student = { id: string; name: string; classId?: string };

export function PremiumAdmin() {
  const L = useL();
  const { lang, request, toast } = useApp();
  const { data, error, busy, act, load } = useAdminView<PremiumAdminView>(
    'premiumAdmin',
    'premiumAdmin',
  );
  const [doing, setDoing] = useState('');
  const [students, setStudents] = useState<Student[]>([]),
    [q, setQ] = useState(''),
    [pick, setPick] = useState<Student | null>(null),
    [days, setDays] = useState(30);
  useEffect(() => {
    let live = true;
    // TerDU talabalari (reyting) + talaba bo'lmaganlar: kursga ruxsat so'raganlar va ruxsat berilganlar (email bilan)
    type Row = { uid: string; name: string; email?: string };
    type Lists = { leaderboard?: Student[]; requests?: Row[]; grants?: Row[] };
    const json = (url: string): Promise<Lists> =>
      request(url)
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    void Promise.all([
      json('/api/platform?view=academic'),
      json('/api/platform?view=courseAccessAdmin'),
    ]).then(([board, access]) => {
      if (!live) return;
      const seen = new Set<string>();
      const others = [...(access.requests || []), ...(access.grants || [])]
        .filter((x) => !seen.has(x.uid) && !!seen.add(x.uid))
        .map((x) => ({
          id: x.uid,
          name: x.name,
          classId: x.email || '',
        }));
      setStudents([...(board.leaderboard || []), ...others]);
    });
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
  /** 🧾 chekni qabul qilish (muddat bilan) yoki qabul qilmaslik — «Pullik xizmatlar» buyurtmasi orqali */
  const decide = async (
    o: { uk: string; id: string; name: string },
    input: Record<string, unknown>,
    done: string,
  ) => {
    setDoing(o.id);
    try {
      await servicesAct(request, 'admin', { ...input, uk: o.uk, id: o.id });
      await load();
      toast(done);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setDoing('');
    }
  };
  // sana yili bilan (1 yillik obunada «24.11.2027»), Toshkent vaqti
  const date = (t: number) =>
    new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(t);
  const grant = async (e: FormEvent) => {
    e.preventDefault();
    if (!pick) return;
    try {
      await act(
        { op: 'grant', uid: pick.id, name: pick.name, group: pick.classId || '', days },
        'grant',
        '💎 ' + L('Obuna berildi', 'Premium granted', 'Подписка выдана'),
      );
      setPick(null);
      setQ('');
    } catch {}
  };
  return (
    <div className="bo-live">
      <div className="bo-status">
        <span className={'bo-pill ' + (data.active ? 'on' : 'off')}>
          <Crown size={13} /> {data.active}
        </span>
        <span>
          {L(
            'ta foydalanuvchida obuna amalda',
            'users have Premium now',
            'пользователей с активной подпиской',
          )}
          {data.paid > 0 &&
            ' · ' +
              L('jami to‘langan', 'paid in total', 'всего оплачено') +
              ': ' +
              formatSum(data.paid)}
          {data.pending.length > 0 &&
            ' · 🧾 ' +
              data.pending.length +
              ' ' +
              L('ta chek kutmoqda', 'receipts waiting', 'чеков ждут')}
        </span>
      </div>

      <div className="bo-card pm-admin-pending">
        <h3>
          🧾 {L('Chek yuborganlar — qabul qiling', 'Receipts to check', 'Присланные чеки')} (
          {data.pending.length})
        </h3>
        {data.pending.length ? (
          <ul className="bo-list pm-admin-list">
            {data.pending.map((o) => (
              <li key={o.uk + o.id}>
                <div className="pm-admin-who">
                  <b>{o.name}</b>
                  <small>
                    {[o.group, o.email, date(o.paidAt || o.at)].filter(Boolean).join(' · ')}
                  </small>
                  <span className="pm-admin-chips">
                    <em className="is-sum">💳 {formatSum(o.budget)}</em>
                    {o.paidNote && <em>💬 {o.paidNote}</em>}
                  </span>
                  <Receipts o={o.uk + '/' + o.id} files={o.files.filter((f) => f.side === 'pay')} />
                </div>
                <span className="pm-admin-btns">
                  {PREMIUM_TERMS.map((days) => (
                    <Button
                      key={days}
                      size="sm"
                      disabled={!!doing}
                      onClick={() =>
                        void decide(
                          o,
                          { op: 'confirm', days },
                          '💎 ' +
                            o.name +
                            ': ' +
                            L('obuna ochildi', 'Premium is on', 'подписка открыта') +
                            ' (' +
                            termText(days, lang) +
                            ')',
                        )
                      }
                    >
                      ✅ {termText(days, lang)}
                      {L('ga qabul qilish', ' — accept', ' — принять')}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!doing}
                    onClick={() => {
                      const why = window.prompt(
                        L(
                          o.name +
                            'ning cheki qabul qilinmasinmi? Sababini yozing (ixtiyoriy) — foydalanuvchiga boradi.',
                          'Reject ' +
                            o.name +
                            '’s receipt? Write a reason (optional) — the user gets it.',
                          'Не принимать чек ' + o.name + '? Укажите причину (необязательно).',
                        ),
                        '',
                      );
                      if (why === null) return;
                      void decide(
                        o,
                        {
                          op: 'reject',
                          ...(why.trim() ? { reason: why.trim().slice(0, 300) } : {}),
                        },
                        '✖ ' + L('Chek qabul qilinmadi', 'Receipt rejected', 'Чек отклонён'),
                      );
                    }}
                  >
                    ✖ {L('Qabul qilmaslik', 'Reject', 'Не принимать')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            {L(
              'Hozircha yangi chek yo‘q. Foydalanuvchi istalgan summani to‘lab chek yuborsa, shu yerda chiqadi — 1 oy yoki 1 yilga qabul qilasiz, obuna o‘zi yoqiladi.',
              'No new receipts. When a user pays any amount and sends a receipt it appears here — accept it for 1 month or 1 year and Premium turns on by itself.',
              'Новых чеков нет. Когда пользователь оплатит любую сумму и пришлёт чек, он появится здесь — примите на 1 месяц или 1 год, подписка включится сама.',
            )}
          </p>
        )}
      </div>
      <div className="bo-grid">
        <form className="bo-form" onSubmit={(e) => void grant(e)}>
          <h3>
            💎 {L('Talabaga obuna berish', 'Give Premium to a student', 'Выдать подписку студенту')}
          </h3>
          <label>
            {L('Talabani toping', 'Find the student', 'Найдите студента')}
            <input
              className="input"
              value={pick ? pick.name : q}
              onChange={(e) => {
                setPick(null);
                setQ(e.target.value);
              }}
              placeholder={L(
                'Ism, guruh yoki email',
                'Name, group or email',
                'Имя, группа или email',
              )}
            />
          </label>
          {!pick && !!found.length && (
            <ul className="bo-pick">
              {found.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setPick(s)}>
                    <b>{s.name}</b>
                    {s.classId && <small>{s.classId}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label>
            {L('Muddat', 'Period', 'Срок')}
            <select className="input" value={days} onChange={(e) => setDays(+e.target.value)}>
              {[7, 30, 90, 180, 365].map((d) => (
                <option key={d} value={d}>
                  {d} {L('kun', 'days', 'дней')}
                </option>
              ))}
            </select>
          </label>
          <div className="bo-actions">
            <Button type="submit" disabled={!pick || !!busy}>
              <Crown size={15} /> {L('Obuna berish', 'Give Premium', 'Выдать подписку')}
            </Button>
          </div>
          <p className="bo-hint">
            {L(
              'Talabada obuna bo‘lsa, yangi muddat uning ustiga qo‘shiladi.',
              'If the student already has Premium, the new period is added on top.',
              'Если подписка уже есть, новый срок прибавляется к текущему.',
            )}
          </p>
        </form>
        <div className="bo-form">
          <h3>💳 {L('To‘lov qanday', 'How payment works', 'Как проходит оплата')}</h3>
          <p className="muted">
            {L(
              'Narx belgilanmagan: foydalanuvchi istalgan summani kartaga to‘lab (karta raqami — «Pullik xizmatlar → ⚙️ To‘lov yo‘riqnomasi»), chek skrinshotini yuboradi. Chek yuqorida chiqadi — 1 oy yoki 1 yilga qabul qilasiz (muddat mavjudiga qo‘shiladi) yoki qabul qilmaysiz. Soxta chekni «Pullik xizmatlar» yozishmasida bloklash mumkin.',
              'No fixed price: the user pays any amount to the card (number under “Paid services → ⚙️ Payment instructions”) and sends a receipt screenshot. It appears above — accept it for 1 month or 1 year (added to the current period) or reject it. A fake receipt can be blocked in the “Paid services” chat.',
              'Цена не задана: пользователь оплачивает любую сумму на карту («Платные услуги → ⚙️ Инструкция по оплате») и присылает скриншот чека. Он появится выше — примите на 1 месяц или 1 год (срок прибавляется) или отклоните. Поддельный чек можно заблокировать в переписке «Платные услуги».',
            )}
          </p>
        </div>
      </div>
      <div className="bo-card">
        <h3>
          👥 {L('Obunachilar', 'Subscribers', 'Подписчики')} ({data.grants.length})
        </h3>
        <ul className="bo-list pm-admin-list pm-admin-subs">
          {data.grants.map((g) => {
            const on = g.until > data.now;
            return (
              <li key={g.uid} className={on ? '' : 'is-off'}>
                <div className="pm-admin-who">
                  <b>{g.name}</b>
                  {g.group && <small>{g.group}</small>}
                  <span className="pm-admin-chips">
                    <em className={on ? 'is-on' : 'is-off'}>
                      {on
                        ? '📅 ' + date(g.until) + L(' gacha', ' — until', ' — до')
                        : '⌛ ' + L('muddati tugagan', 'expired', 'срок истёк')}
                    </em>
                    {g.days > 0 && (
                      <em>
                        ⏳ {L('Muddat', 'Period', 'Срок')}:{' '}
                        {g.hist.map((t) => termText(t.days, lang)).join(' + ')}
                      </em>
                    )}
                    <em className={g.paid > 0 ? 'is-sum' : ''}>
                      💳 {L('To‘lagan', 'Paid', 'Оплатил')}:{' '}
                      {g.paid > 0
                        ? formatSum(g.paid)
                        : L('qo‘lda berilgan', 'given by hand', 'выдано вручную')}
                    </em>
                  </span>
                  {g.hist.length > 0 && (
                    <details className="pm-admin-hist">
                      <summary>
                        {L('Tarix', 'History', 'История')} ({g.hist.length})
                      </summary>
                      <ol>
                        {g.hist.map((t, i) => (
                          <li key={i}>
                            {date(t.at)} · {termText(t.days, lang)} ·{' '}
                            {t.amount ? formatSum(t.amount) : L('qo‘lda', 'by hand', 'вручную')}
                            {t.by && <small> · {t.by}</small>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
                <span className="pm-admin-btns">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!busy}
                    aria-label={
                      L('Obunani bekor qilish', 'Remove Premium', 'Отменить подписку') +
                      ': ' +
                      g.name
                    }
                    onClick={() => {
                      if (
                        !window.confirm(
                          L(
                            g.name + 'ning obunasi bekor qilinsinmi? Obuna darhol yopiladi.',
                            'Remove ' + g.name + '’s Premium? It closes at once.',
                            'Отменить подписку ' + g.name + '? Она закроется сразу.',
                          ),
                        )
                      )
                        return;
                      void act(
                        { op: 'revoke', uid: g.uid },
                        'rv' + g.uid,
                        L('Obuna bekor qilindi', 'Premium removed', 'Подписка отменена'),
                      ).catch(() => {});
                    }}
                  >
                    ✖ {L('Bekor qilish', 'Remove', 'Отменить')}
                  </Button>
                </span>
              </li>
            );
          })}
          {!data.grants.length && (
            <li className="muted">
              {L('Hozircha obunachi yo‘q.', 'No subscribers yet.', 'Подписчиков пока нет.')}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
