'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { Receipts } from '../receipt';
import { servicesAct } from '../service-files';
import { PREMIUM_TERMS, formatSum, termText } from '@/lib/services';
import { TERM_CHOICES, planName } from '@/lib/premium-plans';
import { useAdminView, useL } from './common';
import type { PremiumAdminView } from '@/lib/server/premium';

type Student = { id: string; name: string; classId?: string };
type Grant = PremiumAdminView['grants'][number];

const date = (t: number, time = false) =>
  new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(t);

/** 🧾 Chek rasmi (faqat administrator) — bosilganda katta oynada. */
function ReceiptButton({ uid, id }: { uid: string; id: string }) {
  const L = useL();
  const { request, toast } = useApp();
  const [url, setUrl] = useState('');
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  useEffect(() => {
    if (!url) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setUrl('');
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [url]);
  const open = async () => {
    try {
      const r = await request('/api/premium?receipt=' + encodeURIComponent(uid) + '/' + id);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Chek topilmadi.');
      setUrl(URL.createObjectURL(await r.blob()));
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <button type="button" className="pa-chip is-link" onClick={() => void open()}>
        🧾 {L('Chekni ko‘rish', 'View receipt', 'Посмотреть чек')}
      </button>
      {url &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && setUrl('')}
          >
            <section className="panel pa-receipt" role="dialog" aria-modal="true">
              <button
                type="button"
                className="av-close"
                aria-label={L('Yopish', 'Close', 'Закрыть')}
                onClick={() => setUrl('')}
              >
                <X size={20} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={L('To‘lov cheki', 'Payment receipt', 'Чек оплаты')} />
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

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
    [days, setDays] = useState(30),
    [find, setFind] = useState(''),
    [terms, setTerms] = useState<Record<string, number>>({});
  const [card, setCard] = useState<{
    card: string;
    holder: string;
    how: string;
  } | null>(null);
  useEffect(() => {
    if (data && !card)
      setCard({
        card: data.info.card,
        holder: data.info.holder,
        how: data.info.how,
      });
  }, [data, card]);
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
        .map((x) => ({ id: x.uid, name: x.name, classId: x.email || '' }));
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

  const run = (input: Record<string, unknown>, key: string, done: string) =>
    act(input, key, done).catch(() => {});
  const remove = (uid: string, name: string) => {
    if (
      !window.confirm(
        L(
          name +
            ' obunadan chiqarilsinmi?\n\nObuna darhol yopiladi va u o‘zi qayta obuna bo‘la olmaydi (faqat siz ochasiz).',
          'Remove ' +
            name +
            ' from Premium?\n\nIt closes at once and they cannot subscribe again by themselves.',
          'Убрать ' +
            name +
            ' из подписки?\n\nПодписка закроется сразу, сам подписаться снова не сможет.',
        ),
      )
    )
      return;
    void run(
      { op: 'remove', uid },
      'rm' + uid,
      '✖ ' + name + ': ' + L('obunadan chiqarildi', 'removed', 'удалён из подписки'),
    );
  };
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
  const saveCard = (e: FormEvent) => {
    e.preventDefault();
    if (!card) return;
    void run(
      {
        op: 'info',
        card: card.card,
        holder: card.holder,
        how: card.how,
      },
      'info',
      L('Saqlandi', 'Saved', 'Сохранено'),
    );
  };
  /** 🧾 eski tartib: «Pullik xizmatlar» buyurtmasi orqali kelgan chekni qabul qilish yoki qilmaslik */
  const decide = async (
    o: { uk: string; id: string },
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
  const list = data.grants.filter((g) =>
    (g.name + ' ' + g.group).toLowerCase().includes(find.trim().toLowerCase()),
  );

  return (
    <div className="bo-live pa">
      <div className="pa-stats">
        <div className="pa-stat">
          <Crown size={18} />
          <b>{data.active}</b>
          <span>{L('faol obunachi', 'active', 'активных')}</span>
        </div>
        <div className={'pa-stat' + (data.fresh.length ? ' is-new' : '')}>
          <span aria-hidden="true">🆕</span>
          <b>{data.fresh.length}</b>
          <span>{L('tekshirilmagan to‘lov', 'to check', 'на проверке')}</span>
        </div>
        <div className="pa-stat">
          <span aria-hidden="true">💳</span>
          <b>{data.paid > 0 ? formatSum(data.paid) : '0'}</b>
          <span>{L('jami to‘langan', 'paid in total', 'всего оплачено')}</span>
        </div>
      </div>
      <ol className="pa-how">
        <li>
          {L(
            'Talaba «Obuna bo‘lish»ni bosadi, 1 oy yoki 1 yilni tanlaydi va kartaga istalgan summani to‘laydi (narx ixtiyoriy).',
            'A student taps “Subscribe”, picks 1 month or 1 year and pays any amount to the card.',
            'Студент нажимает «Подписаться», выбирает 1 месяц или 1 год и оплачивает любую сумму.',
          )}
        </li>
        <li>
          {L(
            '«To‘lov qildim» → summa va to‘lov vaqti yoki chek → «Yuborish». To‘lov tekshiruvga yuboriladi.',
            '“I have paid” → amount and payment time or receipt → “Send”. The payment is submitted for review.',
            '«Я оплатил» → сумма и время или чек → «Отправить». Оплата отправляется на проверку.',
          )}
        </li>
        <li>
          {L(
            '«To‘lov keldi»ni bossangiz, obuna faollashadi yoki uzayadi. To‘lov topilmasa, «Rad etish»ni bosing.',
            '“Payment received” starts or extends Premium. If the payment is missing, choose “Reject payment”.',
            '«Оплата пришла» активирует или продлевает подписку. Если оплаты нет, нажмите «Отклонить оплату».',
          )}
        </li>
      </ol>

      <section className="bo-card pa-fresh">
        <h3>
          🆕{' '}
          {L(
            'Tasdiqlash kutilayotgan to‘lovlar',
            'Payments awaiting approval',
            'Оплаты, ожидающие подтверждения',
          )}{' '}
          ({data.fresh.length})
        </h3>
        {data.fresh.length ? (
          <ul className="pa-list">
            {data.fresh.map((c) => (
              <li key={c.uid + c.id}>
                <div className="pa-who">
                  <b>{c.name}</b>
                  {c.group && <small>{c.group}</small>}
                  <span className="pa-chips">
                    <em className="pa-chip is-plan">
                      💎 {planName(c.days, lang) || termText(c.days, lang)} · 💳{' '}
                      {formatSum(c.amount)}
                    </em>
                    {c.paidAt && (
                      <em className="pa-chip">
                        🕒 {L('To‘lov vaqti', 'Paid at', 'Оплата')}: {date(c.paidAt, true)}
                      </em>
                    )}
                    {c.receipt && <ReceiptButton uid={c.uid} id={c.id} />}
                    <em className="pa-chip is-muted">
                      {L('Yuborgan', 'Sent', 'Отправлено')}: {date(c.at, true)}
                    </em>
                  </span>
                </div>
                <span className="pa-btns">
                  <Button
                    size="sm"
                    disabled={!!busy}
                    onClick={() =>
                      void run(
                        { op: 'verify', uid: c.uid, id: c.id },
                        'ok' + c.id,
                        '✅ ' +
                          c.name +
                          ': ' +
                          L('to‘lov tasdiqlandi', 'payment confirmed', 'оплата подтверждена'),
                      )
                    }
                  >
                    ✅ {L('To‘lov keldi', 'Payment received', 'Оплата пришла')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="pa-danger"
                    disabled={!!busy}
                    onClick={() =>
                      void run(
                        { op: 'reject', uid: c.uid, id: c.id },
                        'reject' + c.id,
                        L('To‘lov rad etildi.', 'Payment rejected.', 'Оплата отклонена.'),
                      )
                    }
                  >
                    ✖ {L('Rad etish', 'Reject payment', 'Отклонить оплату')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            {L(
              'Tekshiruvda to‘lov yo‘q.',
              'No payments awaiting review.',
              'Нет оплат, ожидающих проверки.',
            )}
          </p>
        )}
      </section>

      {data.pending.length > 0 && (
        <section className="bo-card pm-admin-pending">
          <h3>
            🧾{' '}
            {L(
              'Eski tartibda yuborilgan cheklar',
              'Receipts sent the old way',
              'Чеки по старой схеме',
            )}{' '}
            ({data.pending.length})
          </h3>
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
                  {PREMIUM_TERMS.map((d) => (
                    <Button
                      key={d}
                      size="sm"
                      disabled={!!doing}
                      onClick={() =>
                        void decide(
                          o,
                          { op: 'confirm', days: d },
                          '💎 ' +
                            o.name +
                            ': ' +
                            L('obuna ochildi', 'Premium is on', 'подписка открыта'),
                        )
                      }
                    >
                      ✅ {termText(d, lang)}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!doing}
                    onClick={() =>
                      void decide(
                        o,
                        { op: 'reject' },
                        '✖ ' + L('Chek qabul qilinmadi', 'Receipt rejected', 'Чек отклонён'),
                      )
                    }
                  >
                    ✖ {L('Qabul qilmaslik', 'Reject', 'Не принимать')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bo-card">
        <div className="pa-head">
          <h3>
            👥 {L('Obunachilar', 'Subscribers', 'Подписчики')} ({data.grants.length})
          </h3>
          <input
            className="input pa-find"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={L(
              'Ism yoki guruh bo‘yicha qidirish',
              'Search by name or group',
              'Поиск по имени или группе',
            )}
            aria-label={L('Obunachini qidirish', 'Search subscribers', 'Поиск подписчика')}
          />
        </div>
        <ul className="pa-list pa-subs">
          {list.map((g: Grant) => {
            const on = g.until > data.now;
            const pickTerm = terms[g.uid] ?? (TERM_CHOICES.includes(g.term as never) ? g.term : 0);
            return (
              <li key={g.uid} className={on ? '' : 'is-off'}>
                <div className="pa-who">
                  <b>{g.name}</b>
                  {g.group && <small>{g.group}</small>}
                  <span className="pa-chips">
                    <em className={'pa-chip ' + (on ? 'is-on' : 'is-off')}>
                      {on
                        ? '✅ ' +
                          L('Faol', 'Active', 'Активна') +
                          ' · ' +
                          date(g.until) +
                          L(' gacha', '', '')
                        : '⌛ ' +
                          L('Muddati tugagan', 'Expired', 'Истекла') +
                          ' · ' +
                          date(g.until)}
                    </em>
                    <em className="pa-chip">
                      📅 {L('Boshlangan', 'Started', 'Начало')}: {date(g.since)} ·{' '}
                      {termText(g.term, lang)}
                    </em>
                    <em className={'pa-chip' + (g.paid > 0 ? ' is-sum' : '')}>
                      💳{' '}
                      {g.paid > 0
                        ? formatSum(g.paid)
                        : L('qo‘lda berilgan', 'given by hand', 'выдано вручную')}
                    </em>
                    {g.claim?.status === 'new' && (
                      <em className="pa-chip is-new">
                        🆕 {L('to‘lovi tekshirilmagan', 'not checked', 'не проверено')}
                      </em>
                    )}
                  </span>
                </div>
                <span className="pa-btns">
                  <label className="pa-term">
                    <span>{L('Muddat', 'Period', 'Срок')}</span>
                    <select
                      className="input"
                      value={pickTerm}
                      onChange={(e) => setTerms({ ...terms, [g.uid]: +e.target.value })}
                      aria-label={
                        L('Obuna muddati', 'Subscription period', 'Срок подписки') + ': ' + g.name
                      }
                    >
                      {!pickTerm && <option value={0}>{termText(g.term, lang)}</option>}
                      {TERM_CHOICES.map((d) => (
                        <option key={d} value={d}>
                          {termText(d, lang)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    size="sm"
                    disabled={!!busy || !pickTerm || pickTerm === g.term}
                    onClick={() =>
                      void run(
                        { op: 'term', uid: g.uid, days: pickTerm },
                        'tm' + g.uid,
                        '💎 ' +
                          g.name +
                          ': ' +
                          termText(pickTerm, lang) +
                          L('lik obuna', ' Premium', ' подписка'),
                      )
                    }
                  >
                    {L('Saqlash', 'Save', 'Сохранить')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="pa-danger"
                    disabled={!!busy}
                    onClick={() => remove(g.uid, g.name)}
                    aria-label={L('Chiqarib tashlash', 'Remove', 'Убрать') + ': ' + g.name}
                  >
                    ✖
                  </Button>
                </span>
              </li>
            );
          })}
          {!list.length && (
            <li className="muted">
              {L('Obunachi topilmadi.', 'No subscribers found.', 'Подписчики не найдены.')}
            </li>
          )}
        </ul>
        <p className="bo-hint">
          {L(
            'Muddat obuna boshlangan kundan hisoblanadi: masalan, 1 oylik obunani «1 yil» qilib saqlasangiz, u boshlangan kunidan 1 yilgacha amal qiladi.',
            'The period counts from the start date: e.g. switching a 1-month subscription to “1 year” makes it last a year from its start.',
            'Срок считается от даты начала: например, 1 месяц → «1 год» — подписка действует год с начала.',
          )}
        </p>
      </section>

      <div className="bo-grid">
        <form className="bo-form" onSubmit={saveCard}>
          <h3>💳 {L('Karta (narx ixtiyoriy)', 'Card (any amount)', 'Карта (любая сумма)')}</h3>
          {card && (
            <>
              <label>
                {L('Karta raqami', 'Card number', 'Номер карты')}
                <input
                  className="input"
                  inputMode="numeric"
                  value={card.card}
                  maxLength={40}
                  onChange={(e) => setCard({ ...card, card: e.target.value })}
                  placeholder="8600 0000 0000 0000"
                />
              </label>
              <label>
                {L('Karta egasi', 'Card holder', 'Владелец карты')}
                <input
                  className="input"
                  value={card.holder}
                  maxLength={80}
                  onChange={(e) => setCard({ ...card, holder: e.target.value })}
                />
              </label>
              <label>
                {L(
                  'Qo‘shimcha izoh (ixtiyoriy)',
                  'Extra note (optional)',
                  'Примечание (необязательно)',
                )}
                <textarea
                  className="input"
                  rows={2}
                  maxLength={600}
                  value={card.how}
                  onChange={(e) => setCard({ ...card, how: e.target.value })}
                  placeholder={L(
                    'Masalan: Click yoki Payme orqali',
                    'E.g. via Click or Payme',
                    'Например: через Click или Payme',
                  )}
                />
              </label>
              <div className="bo-actions">
                <Button type="submit" disabled={!!busy}>
                  {L('Saqlash', 'Save', 'Сохранить')}
                </Button>
              </div>
            </>
          )}
        </form>
        <form className="bo-form" onSubmit={(e) => void grant(e)}>
          <h3>➕ {L('Qo‘lda obuna berish', 'Give Premium by hand', 'Выдать подписку вручную')}</h3>
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
              {[7, ...TERM_CHOICES].map((d) => (
                <option key={d} value={d}>
                  {termText(d, lang)}
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
              'Obunasi bo‘lsa, yangi muddat ustiga qo‘shiladi. Yopilgan bo‘lsa, blok ham olinadi.',
              'If they already have Premium, the period is added. A block is lifted too.',
              'Если подписка есть, срок прибавляется. Блокировка снимается.',
            )}
          </p>
        </form>
      </div>

      {data.blocked.length > 0 && (
        <section className="bo-card">
          <h3>
            ⛔ {L('Obunadan chiqarilganlar', 'Removed from Premium', 'Удалённые из подписки')} (
            {data.blocked.length})
          </h3>
          <p className="muted">
            {L(
              'Ular o‘zi qayta obuna bo‘la olmaydi. Blokdan chiqarsangiz, yana o‘zi obuna bo‘la oladi.',
              'They cannot subscribe by themselves. Unblock to let them subscribe again.',
              'Сами подписаться не могут. Разблокируйте, чтобы разрешить.',
            )}
          </p>
          <ul className="pa-list">
            {data.blocked.map((b) => (
              <li key={b.key}>
                <div className="pa-who">
                  <b>{b.name}</b>
                  <small>
                    {date(b.at)}
                    {b.by && ' · ' + b.by}
                  </small>
                </div>
                <span className="pa-btns">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() =>
                      void run(
                        { op: 'unblock', key: b.key },
                        'ub' + b.key,
                        L('Blokdan chiqarildi', 'Unblocked', 'Разблокирован'),
                      )
                    }
                  >
                    {L('Blokdan chiqarish', 'Unblock', 'Разблокировать')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
