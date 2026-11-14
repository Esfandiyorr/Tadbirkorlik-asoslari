'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, CreditCard, Save, Search, ShieldCheck, Trash2, Unlock, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { AvatarFigure, avatarName, setAvatarCatalog } from './avatars';
import { AVATAR_TOP, type AvatarItem, type AvatarOrder, type AvatarShop } from '@/lib/avatars';
import { dueText, tr } from '@/lib/points';

type Person = { id: string; name: string; classId: string; place: number };
type Via = 'top' | 'allow' | 'premium' | 'pass' | null;
type View = {
  catalog?: AvatarItem[];
  avatars: { id: string; owner: (Person & { active: boolean; via?: Via; at: number }) | null }[];
  allowed: (Person & { top: boolean })[];
  passes?: (Person & { until: number; active: boolean })[];
  orders?: (AvatarOrder & { place: number })[];
  shop?: AvatarShop;
  students: (Person & { allowed: boolean })[];
  now?: number;
};

/* Administrator → «🎭 Avatarlar»: kimda qaysi avatar, ruxsat berilgan talabalar, ruxsat berish/olish va bo'shatish. */
export function AvatarAdmin() {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [busy, setBusy] = useState(''),
    [shop, setShop] = useState<AvatarShop>({ on: true, price: '', days: 30, how: '' }),
    [days, setDays] = useState(30);
  const savedShop = view?.shop;
  useEffect(() => {
    if (savedShop) {
      setShop(savedShop);
      setDays(savedShop.days);
    }
  }, [savedShop]);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=avatarAdmin'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setAvatarCatalog(v.catalog);
      setView(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(input: Record<string, unknown>, key: string, done: string) {
    setBusy(key);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'avatarAdmin', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setAvatarCatalog(v.catalog);
      setView(v);
      toast(done);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const allow = (p: Person, on: boolean) =>
    act(
      { op: 'allow', student: p.id, allow: on },
      'allow' + p.id,
      on
        ? L(
            `✅ ${p.name}ga avatar ruxsati berildi`,
            `✅ ${p.name} may now choose an avatar`,
            `✅ ${p.name}: аватар разрешён`,
          )
        : L(
            `${p.name}dan avatar ruxsati olindi`,
            `Avatar permission removed for ${p.name}`,
            `${p.name}: разрешение снято`,
          ),
    );
  const q = query.trim().toLocaleLowerCase();
  const found = q
    ? (view?.students || [])
        .filter((s) => (s.name + ' ' + s.classId).toLocaleLowerCase().includes(q))
        .slice(0, 8)
    : [];
  return (
    <section className="panel avatar-admin">
      <div className="section-heading">
        <div>
          <h2>🎭 {L('Avatarlar', 'Avatars', 'Аватары')}</h2>
          <p className="muted">
            {L(
              `Avatarni umumiy reytingning 1–${AVATAR_TOP}-o‘rinlaridagi talabalar, siz ruxsat berganlar, 💎 obunachilar va avatarni 💳 sotib olganlar tanlaydi. Bitta avatar faqat bitta talabada bo‘ladi. Huquq tugasa (top-${AVATAR_TOP} dan tushdi, obuna yoki sotib olingan muddat tugadi) — avatar avtomatik bo‘shatiladi va talabaga xabar chiqadi.`,
              `Students in places 1–${AVATAR_TOP}, students you allow, 💎 subscribers and those who 💳 bought one can choose an avatar. Each avatar belongs to one student. When the right ends (left the top ${AVATAR_TOP}, Premium or the bought period ended) the avatar is freed automatically and the student is told.`,
              `Аватар выбирают студенты с 1–${AVATAR_TOP}-го места, те, кому вы разрешили, 💎 подписчики и 💳 купившие. Один аватар — у одного студента. Когда право заканчивается (выпал из топ-${AVATAR_TOP}, закончилась подписка или оплаченный срок), аватар освобождается автоматически, студент получает сообщение.`,
            )}
          </p>
        </div>
      </div>
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton h-64" />}
      {view && (
        <>
          <ul className="avatar-admin-grid">
            {view.avatars.map((a) => (
              <li key={a.id} className={a.owner?.active ? 'is-taken' : ''}>
                <span className="av-stage">
                  <AvatarFigure id={a.id} />
                </span>
                <b>{avatarName(a.id, lang)}</b>
                {a.owner ? (
                  <>
                    <small>
                      {a.owner.name}
                      {a.owner.classId ? ' · ' + a.owner.classId : ''}
                    </small>
                    <small className={a.owner.active ? 'ok' : 'off'}>
                      {(a.owner.place
                        ? L(
                            `${a.owner.place}-o‘rin`,
                            `#${a.owner.place}`,
                            `${a.owner.place}-е место`,
                          ) + ' · '
                        : '') +
                        (a.owner.via === 'premium'
                          ? L('💎 obuna', '💎 Premium', '💎 подписка')
                          : a.owner.via === 'pass'
                            ? L('💳 sotib olgan', '💳 bought', '💳 куплен')
                            : a.owner.via === 'allow'
                              ? L('ruxsat bilan', 'by permission', 'по разрешению')
                              : a.owner.via === 'top'
                                ? L('top-10', 'top 10', 'топ-10')
                                : L('huquqi tugagan', 'right ended', 'право закончилось'))}
                    </small>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() =>
                        void act(
                          { op: 'release', avatar: a.id },
                          'release' + a.id,
                          L('Avatar bo‘shatildi', 'Avatar freed', 'Аватар освобождён'),
                        )
                      }
                    >
                      <Unlock size={14} /> {L('Bo‘shatish', 'Free', 'Освободить')}
                    </Button>
                  </>
                ) : (
                  <small className="free">{L('Bo‘sh', 'Free', 'Свободен')}</small>
                )}
              </li>
            ))}
          </ul>
          <div className="avatar-admin-shop">
            <h3>
              <CreditCard size={18} />{' '}
              {L(
                'Avatarni sotib olish so‘rovlari',
                'Avatar purchase requests',
                'Запросы на покупку аватара',
              )}{' '}
              <span className="muted">({view.orders?.length || 0})</span>
            </h3>
            {view.orders?.length ? (
              <ul>
                {view.orders.map((o) => (
                  <li key={o.uid}>
                    <span>
                      <b>{o.name}</b>
                      <small>
                        {[
                          o.group,
                          o.place ? L(`${o.place}-o‘rin`, `#${o.place}`, `${o.place}-е`) : '',
                          dueText(o.at, lang, view.now || Date.now()).date,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                      {o.note && <small>💬 {o.note}</small>}
                    </span>
                    <span className="avatar-admin-btns">
                      <Button
                        size="sm"
                        disabled={!!busy}
                        aria-label={
                          L('To‘lov tasdiqlandi', 'Payment confirmed', 'Оплата подтверждена') +
                          ': ' +
                          o.name
                        }
                        onClick={() =>
                          void act(
                            { op: 'grantPass', student: o.uid, days },
                            'gp' + o.uid,
                            L(
                              `✅ ${o.name}: avatar ${days} kunga ochildi`,
                              `✅ ${o.name}: avatar unlocked for ${days} days`,
                              `✅ ${o.name}: аватар открыт на ${days} дн.`,
                            ),
                          )
                        }
                      >
                        <Check size={14} /> {L('To‘lov tasdiqlandi', 'Paid', 'Оплачено')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        aria-label={L('Rad etish', 'Decline', 'Отклонить') + ': ' + o.name}
                        onClick={() =>
                          void act(
                            { op: 'rejectOrder', student: o.uid },
                            'ro' + o.uid,
                            L('So‘rov rad etildi', 'Request declined', 'Запрос отклонён'),
                          )
                        }
                      >
                        <X size={14} />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {L('Yangi so‘rov yo‘q.', 'No new requests.', 'Новых запросов нет.')}
              </p>
            )}
            <p className="muted avatar-admin-hint">
              {L(
                `Talaba to‘lab «To‘lov qildim» tugmasini bosadi — shu yerda chiqadi. To‘lovni tekshirib «To‘lov tasdiqlandi»ni bosing: avatar huquqi ${days} kunga beriladi (muddat tugasa, avatar o‘zi bo‘shaydi). Click ulanganda bu avtomatik bo‘ladi.`,
                `A student pays and presses “I paid” — the request appears here. Check the payment and press “Paid”: the avatar right is given for ${days} days (then the avatar is freed). With Click connected this becomes automatic.`,
                `Студент оплачивает и нажимает «Я оплатил» — запрос появляется здесь. Проверьте оплату и нажмите «Оплачено»: право на аватар выдаётся на ${days} дн. (потом аватар освободится). После подключения Click это будет автоматически.`,
              )}
            </p>
            {!!view.passes?.length && (
              <>
                <h4>
                  💳 {L('Sotib olganlar', 'Bought', 'Купившие')}{' '}
                  <span className="muted">({view.passes.length})</span>
                </h4>
                <ul>
                  {view.passes.map((p) => (
                    <li key={p.id}>
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {(p.classId ? p.classId + ' · ' : '') +
                            (p.active
                              ? L('gacha: ', 'until ', 'до ') +
                                dueText(p.until, lang, view.now || Date.now()).date
                              : L('muddati tugagan', 'expired', 'срок истёк'))}
                        </small>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        aria-label={
                          L('Muddatni olib tashlash', 'Remove', 'Отменить') + ': ' + p.name
                        }
                        onClick={() =>
                          void act(
                            { op: 'revokePass', student: p.id },
                            'rp' + p.id,
                            L('Muddat olib tashlandi', 'Pass removed', 'Срок отменён'),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <form
              className="avatar-admin-shopform"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void act(
                  { op: 'shop', ...shop, days, price: shop.price.trim(), how: shop.how.trim() },
                  'shop',
                  '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'),
                );
              }}
            >
              <h4>🏷 {L('Narx va muddat', 'Price and period', 'Цена и срок')}</h4>
              <label className="avatar-admin-check">
                <input
                  type="checkbox"
                  checked={shop.on}
                  onChange={(e) => setShop({ ...shop, on: e.target.checked })}
                />
                {L(
                  'Avatar sotuvi yoqilgan (talabaga «Sotib olish» tugmasi chiqadi)',
                  'Avatar sales on (students see “Buy”)',
                  'Продажа аватаров включена (студенты видят «Купить»)',
                )}
              </label>
              <label>
                {L(
                  'Narx (talabaga ko‘rinadi)',
                  'Price (shown to students)',
                  'Цена (видна студентам)',
                )}
                <input
                  className="input"
                  maxLength={80}
                  value={shop.price}
                  onChange={(e) => setShop({ ...shop, price: e.target.value })}
                  placeholder={L(
                    'Masalan: 10 000 so‘m',
                    'E.g. 10 000 so‘m',
                    'Например: 10 000 сум',
                  )}
                />
              </label>
              <label>
                {L('Muddat', 'Period', 'Срок')}
                <select className="input" value={days} onChange={(e) => setDays(+e.target.value)}>
                  {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                    <option key={d} value={d}>
                      {d} {L('kun', 'days', 'дней')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L('Qanday to‘lanadi', 'How to pay', 'Как оплатить')}
                <textarea
                  className="input"
                  rows={3}
                  maxLength={600}
                  value={shop.how}
                  onChange={(e) => setShop({ ...shop, how: e.target.value })}
                  placeholder={L(
                    'Masalan: Click yoki Payme orqali … kartaga o‘tkazing va «To‘lov qildim» tugmasini bosing.',
                    'E.g. pay by Click or Payme to card … and press “I paid”.',
                    'Например: переведите через Click или Payme на карту … и нажмите «Я оплатил».',
                  )}
                />
              </label>
              <Button type="submit" disabled={!!busy}>
                <Save size={15} /> {L('Saqlash', 'Save', 'Сохранить')}
              </Button>
            </form>
          </div>
          <div className="avatar-admin-allow">
            <h3>
              <ShieldCheck size={18} />{' '}
              {L('Ruxsat berilgan talabalar', 'Students with permission', 'Студенты с разрешением')}{' '}
              <span className="muted">({view.allowed.length})</span>
            </h3>
            {view.allowed.length ? (
              <ul>
                {view.allowed.map((p) => (
                  <li key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.classId}
                        {p.place
                          ? ' · ' + L(`${p.place}-o‘rin`, `#${p.place}`, `${p.place}-е`)
                          : ''}
                      </small>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => void allow(p, false)}
                    >
                      {L('Ruxsatni olish', 'Remove', 'Снять')}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {L(
                  'Hozircha hech kimga alohida ruxsat berilmagan.',
                  'No extra permissions yet.',
                  'Отдельных разрешений пока нет.',
                )}
              </p>
            )}
            <label className="avatar-admin-search">
              <Search size={16} />
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L(
                  'Talabani qidiring: ism yoki guruh',
                  'Find a student: name or group',
                  'Найти студента: имя или группа',
                )}
                aria-label={L('Talabani qidirish', 'Find a student', 'Найти студента')}
              />
            </label>
            {!!found.length && (
              <ul>
                {found.map((p) => (
                  <li key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.classId} · {L(`${p.place}-o‘rin`, `#${p.place}`, `${p.place}-е`)}
                      </small>
                    </span>
                    {p.place <= AVATAR_TOP ? (
                      <small className="ok">
                        {L(
                          'top-10 — ruxsat shart emas',
                          'top 10 — no permission needed',
                          'топ-10 — разрешение не нужно',
                        )}
                      </small>
                    ) : p.allowed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => void allow(p, false)}
                      >
                        {L('Ruxsatni olish', 'Remove', 'Снять')}
                      </Button>
                    ) : (
                      <Button size="sm" disabled={!!busy} onClick={() => void allow(p, true)}>
                        {L('Ruxsat berish', 'Allow', 'Разрешить')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {q && !found.length && (
              <p className="muted">{L('Topilmadi.', 'Nothing found.', 'Не найдено.')}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
