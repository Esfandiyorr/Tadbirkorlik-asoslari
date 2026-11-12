'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Lock, Plus, Search } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { openBackOffice } from './backoffice';
import { PremiumBadge, PremiumOffer } from './premium';
import { tr } from '@/lib/points';
import {
  LIBRARY_KIND,
  LIBRARY_KINDS,
  type LibraryItem,
  type LibraryKind,
  type PremiumInfo,
  type PremiumState,
} from '@/lib/library';

/* 📚 Kutubxona: administrator qo'shgan foydali manbalar — kitob, qo'llanma, maqola, video, qonun va namunalar.
   Qidiruv va tur bo'yicha saralash; manba bosilsa havolasi yangi oynada ochiladi. 💎 belgili manbalar — obunachilarga
   (boshqalarga «Obuna bo'lish» oynasi chiqadi). */
type View = { items: LibraryItem[]; premium: PremiumState | null; info: PremiumInfo | null };
const hue = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
};

export function Library() {
  const { data, lang, request } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(''),
    [q, setQ] = useState(''),
    [kind, setKind] = useState<LibraryKind | ''>(''),
    [offer, setOffer] = useState(false);
  const uid = data?.user?.id;
  useEffect(() => {
    let live = true;
    request('/api/platform?view=library')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        if (live) setView(v);
      })
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [request, uid]);
  const items = view?.items || [];
  const counts = useMemo(() => {
    const c: Partial<Record<LibraryKind, number>> = {};
    for (const x of items) c[x.kind] = (c[x.kind] || 0) + 1;
    return c;
  }, [items]);
  const needle = q.trim().toLowerCase();
  const list = items.filter(
    (x) =>
      (!kind || x.kind === kind) &&
      (!needle || (x.h + ' ' + (x.a || '') + ' ' + (x.t || '')).toLowerCase().includes(needle)),
  );
  const admin = data?.user?.role === 'admin';
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {L('FOYDALI MANBALAR', 'USEFUL RESOURCES', 'ПОЛЕЗНЫЕ МАТЕРИАЛЫ')}
          </span>
          <h1>📚 {L('Kutubxona', 'Library', 'Библиотека')}</h1>
          <p>
            {L(
              'Kitoblar, qo‘llanmalar, maqolalar, videolar, qonunlar va tayyor namunalar — bir joyda.',
              'Books, guides, articles, videos, laws and ready templates — in one place.',
              'Книги, пособия, статьи, видео, законы и готовые шаблоны — в одном месте.',
            )}
          </p>
        </div>
        <div className="page-heading-side">
          <PremiumBadge state={view?.premium} />
          {admin && (
            <Button
              variant="outline"
              onClick={() => {
                openBackOffice('library');
                navigate('admin');
              }}
            >
              <Plus size={16} /> {L('Manba qo‘shish', 'Add a resource', 'Добавить материал')}
            </Button>
          )}
        </div>
      </div>
      <div className="lib-tools">
        <label className="lib-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L(
              'Nomi yoki muallifi bo‘yicha qidirish',
              'Search by title or author',
              'Поиск по названию или автору',
            )}
            aria-label={L('Kutubxonadan qidirish', 'Search the library', 'Поиск в библиотеке')}
          />
        </label>
        <div className="lib-kinds" role="group" aria-label={L('Manba turi', 'Kind', 'Тип')}>
          <button className={!kind ? 'on' : ''} onClick={() => setKind('')}>
            {L('Hammasi', 'All', 'Все')} <em>{items.length}</em>
          </button>
          {LIBRARY_KINDS.filter((k) => counts[k]).map((k) => (
            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {LIBRARY_KIND[k].icon} {tr(lang, ...LIBRARY_KIND[k].name)} <em>{counts[k]}</em>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton h-64" />}
      {view && !items.length && (
        <div className="soft-empty panel">
          <span>📚</span>
          <p>
            {admin
              ? L(
                  'Kutubxona hozircha bo‘sh. «Manba qo‘shish» orqali birinchi kitob yoki qo‘llanmani joylang.',
                  'The library is empty. Use “Add a resource” to post the first book or guide.',
                  'Библиотека пока пуста. Добавьте первую книгу или пособие.',
                )
              : L(
                  'Kutubxona to‘ldirilmoqda — tez orada kitob va qo‘llanmalar shu yerda chiqadi.',
                  'The library is being filled — books and guides will appear here soon.',
                  'Библиотека наполняется — скоро здесь появятся книги и пособия.',
                )}
          </p>
        </div>
      )}
      {view && !!items.length && !list.length && (
        <div className="soft-empty panel">
          <span>🔎</span>
          <p>{L('Hech narsa topilmadi.', 'Nothing found.', 'Ничего не найдено.')}</p>
        </div>
      )}
      <ul className="lib-grid">
        {list.map((x, i) => {
          const k = LIBRARY_KIND[x.kind] || LIBRARY_KIND.other;
          const body = (
            <>
              <span
                className="lib-cover"
                style={
                  x.img
                    ? undefined
                    : {
                        background: `linear-gradient(145deg, hsl(${hue(x.id)} 70% 52%), hsl(${(hue(x.id) + 50) % 360} 72% 36%))`,
                      }
                }
              >
                {x.img ? (
                  <img src={x.img} alt="" loading="lazy" />
                ) : (
                  <i aria-hidden="true">{k.icon}</i>
                )}
                {x.pro && <em className="lib-pro">💎 {L('Obuna', 'Premium', 'Подписка')}</em>}
              </span>
              <span className="lib-body">
                <small>
                  {k.icon} {tr(lang, ...k.name)}
                </small>
                <b>{x.h}</b>
                {x.a && <span className="lib-author">{x.a}</span>}
                {x.t && <span className="lib-text">{x.t}</span>}
                <span className={'lib-open' + (x.locked ? ' is-locked' : '')}>
                  {x.locked ? (
                    <>
                      <Lock size={14} />{' '}
                      {L('Obuna bilan ochiladi', 'Opens with Premium', 'Откроется с подпиской')}
                    </>
                  ) : (
                    <>
                      {L('Ochish', 'Open', 'Открыть')} <ArrowUpRight size={15} />
                    </>
                  )}
                </span>
              </span>
            </>
          );
          return (
            <li key={x.id} style={{ animationDelay: Math.min(i, 12) * 35 + 'ms' }}>
              {x.locked || !x.link ? (
                <button type="button" className="lib-card" onClick={() => setOffer(true)}>
                  {body}
                </button>
              ) : (
                <a className="lib-card" href={x.link} target="_blank" rel="noopener noreferrer">
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {offer && <PremiumOffer info={view?.info} onClose={() => setOffer(false)} />}
    </>
  );
}
