'use client';
import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { useNews } from './announcements';
import { shrink } from './site-content';
import { dueText, tr } from '@/lib/points';
import { FRESH_MS, PROMO_KIND, PROMO_KINDS, type PromoItem, type PromoKind } from '@/lib/promo';
import type { Lang } from '@/lib/types';

/* 🛍 2-e'lon oynasi — yon menyu pastida (telefonda bosh sahifada): mahsulotlar, kurslar va grant dasturlari
   reklamasi. Har 6 soniyada almashadi. Ma'lumot e'lonlar bilan bitta so'rovda keladi (useNews → promo).
   Administrator «Sayt boshqaruvi → 🛍 2-e'lon oynasi»da qo'shadi va o'chiradi. */

const ROTATE_MS = 6000;
const external = (link: string) =>
  link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};

export function PromoSlide({ item, lang, now }: { item: PromoItem; lang: Lang; now: number }) {
  const k = PROMO_KIND[item.kind] || PROMO_KIND.other;
  return (
    <div className={'promo-slide is-' + item.kind + (item.img ? ' has-img' : '')}>
      {item.img && <img className="promo-img" src={item.img} alt="" loading="lazy" />}
      <span className="promo-kind">
        <span aria-hidden="true">{k.icon}</span> {tr(lang, ...k.name)}
        {now - item.at < FRESH_MS && <em>{tr(lang, 'YANGI', 'NEW', 'НОВОЕ')}</em>}
      </span>
      <b>{item.h}</b>
      {item.t && <p>{item.t}</p>}
      {item.link && (
        <a className="promo-cta" href={item.link} {...external(item.link)}>
          {item.cta || tr(lang, 'Batafsil', 'Learn more', 'Подробнее')} →
        </a>
      )}
    </div>
  );
}

/** Yon menyudagi (yoki telefonda bosh sahifadagi) 2-e'lon oynasi. E'lon bo'lmasa — faqat administratorga ko'rinadi. */
export function PromoBox({ className = '' }: { className?: string }) {
  const { lang, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now } = useNews();
  const items = d?.promo || [];
  const admin = data?.user?.role === 'admin';
  const [index, setIndex] = useState(0),
    [hover, setHover] = useState(false),
    [paused, setPaused] = useState(false);
  const count = items.length,
    current = count ? index % count : 0;
  useEffect(() => {
    if (count < 2 || hover || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [count, hover, paused]);
  if (!count && !admin) return null;
  return (
    <section
      className={'promo-box ' + className}
      aria-roledescription="carousel"
      aria-label={L('Takliflar va imkoniyatlar', 'Offers and opportunities', 'Предложения')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="promo-stage" key={count ? items[current].id : 'empty'}>
        {count ? (
          <PromoSlide item={items[current]} lang={lang} now={now()} />
        ) : (
          <div className="promo-slide promo-empty">
            <span className="promo-kind">🛍️ {L('2-E’LON OYNASI', 'SECOND BOX', '2-Е ОКНО')}</span>
            <p>
              {L(
                'Bu yerda mahsulotlar, kurslar va grant dasturlari reklamasi chiqadi. Hozircha bo‘sh — talabalar bu oynani ko‘rmaydi.',
                'Ads for products, courses and grant programmes appear here. Empty for now — students do not see this box.',
                'Здесь будет реклама товаров, курсов и грантов. Пока пусто — студенты это окно не видят.',
              )}
            </p>
          </div>
        )}
      </div>
      {(count > 1 || admin) && (
        <div className="promo-foot">
          {count > 1 && (
            <>
              <div
                className="promo-dots"
                role="tablist"
                aria-label={L('Takliflar', 'Offers', 'Предложения')}
              >
                {items.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={i + 1 + ' / ' + count}
                    className={i === current ? 'on' : ''}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="promo-btn"
                aria-label={
                  paused
                    ? L('Davom ettirish', 'Play', 'Продолжить')
                    : L('To‘xtatish', 'Pause', 'Пауза')
                }
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </>
          )}
          {admin && (
            <button
              type="button"
              className="promo-btn"
              onClick={() => {
                // Boshqaruv → 🛠 Sayt boshqaruvi → 🛍 2-e'lon oynasi.
                try {
                  sessionStorage.setItem('sq-staff-tab', 'site');
                  sessionStorage.setItem('sq-bo-section', 'promo');
                } catch {}
                location.hash = 'admin';
              }}
              aria-label={L('Reklama qo‘shish', 'Add an offer', 'Добавить предложение')}
              title={L('Reklama qo‘shish', 'Add an offer', 'Добавить предложение')}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

type Form = { kind: PromoKind; h: string; t: string; link: string; cta: string; until: string };
const EMPTY: Form = { kind: 'course', h: '', t: '', link: '', cta: '', until: '' };

/** Administrator → «🛍 2-e'lon oynasi»: reklama e'lonini (rasm bilan) qo'shish va o'chirish. */
export function PromoAdmin() {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { data: d, now, setPromo } = useNews();
  const [form, setForm] = useState<Form>(EMPTY),
    [image, setImage] = useState<Blob | null>(null),
    [busy, setBusy] = useState('');
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  async function post(input: Record<string, unknown>) {
    const r = await request('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promo', input }),
      }),
      v = await r.json();
    if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
    setPromo(v.promo || []);
    return v as { id?: string; promo: PromoItem[] };
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy('add');
    try {
      // «Ko'rinadi» — shu kun oxirigacha (Toshkent vaqti).
      const until = form.until ? Date.parse(form.until + 'T23:59:59+05:00') : undefined;
      const v = await post({
        op: 'add',
        kind: form.kind,
        h: form.h.trim(),
        ...(form.t.trim() ? { t: form.t.trim() } : {}),
        ...(form.link.trim() ? { link: form.link.trim() } : {}),
        ...(form.cta.trim() ? { cta: form.cta.trim() } : {}),
        ...(until ? { until } : {}),
      });
      if (image && v.id) {
        const body = new FormData();
        body.set('id', v.id);
        body.set('file', image, 'promo.' + (image.type.split('/')[1] || 'png'));
        const r = await request('/api/site/promo', { method: 'POST', body }),
          x = await r.json();
        if (!r.ok) throw new Error(x.error || 'Rasm yuklanmadi');
        setPromo(x.promo || []);
      }
      toast('🛍️ ' + L('E’lon joylandi', 'Posted', 'Опубликовано'));
      setForm({ ...EMPTY, kind: form.kind });
      setImage(null);
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function remove(id: string) {
    setBusy('rm' + id);
    try {
      await post({ op: 'remove', id });
      toast(L('E’lon o‘chirildi', 'Deleted', 'Удалено'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy('');
    }
  }
  const n = now();
  const draft: PromoItem = {
    id: 'draft',
    kind: form.kind,
    h: form.h.trim() || L('Sarlavha', 'Title', 'Заголовок'),
    at: n,
    ...(form.t.trim() ? { t: form.t.trim() } : {}),
    ...(form.link.trim() ? { link: '#' } : {}),
    ...(form.cta.trim() ? { cta: form.cta.trim() } : {}),
    ...(preview ? { img: preview } : {}),
  };
  const list = d?.promo || [];
  return (
    <section className="panel promo-manage">
      <p className="muted">
        {L(
          'Bu oyna yon menyuning pastida (telefonda — bosh sahifada) chiqadi va har 6 soniyada almashadi. Bir vaqtda 10 tagacha e’lon ko‘rinadi; muddati o‘tgani o‘zi yo‘qoladi. E’lon bo‘lmasa, talabalar oynani ko‘rmaydi.',
          'This box appears at the bottom of the side menu (on phones — on the home page) and changes every 6 seconds. Up to 10 offers are shown; expired ones disappear by themselves. With no offers, students do not see the box.',
          'Окно внизу бокового меню (на телефоне — на главной), меняется каждые 6 секунд. Показывается до 10 предложений; просроченные исчезают сами.',
        )}
      </p>
      <div className="promo-admin-grid">
        <form className="promo-admin-form" onSubmit={(e) => void add(e)}>
          <div
            className="promo-kinds"
            role="radiogroup"
            aria-label={L('E’lon turi', 'Kind', 'Тип')}
          >
            {PROMO_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={form.kind === k}
                className={form.kind === k ? 'on' : ''}
                onClick={() => set({ kind: k })}
              >
                {PROMO_KIND[k].icon} {tr(lang, ...PROMO_KIND[k].name)}
              </button>
            ))}
          </div>
          <input
            className="input"
            required
            minLength={2}
            maxLength={70}
            value={form.h}
            onChange={(e) => set({ h: e.target.value })}
            aria-label={L('Sarlavha', 'Title', 'Заголовок')}
            placeholder={L(
              'Sarlavha, masalan: «Yoshlar grant dasturi — 50 mln so‘mgacha»',
              'Title, e.g. “Youth grant — up to 50 mln so‘m”',
              'Заголовок, например: «Молодёжный грант — до 50 млн сум»',
            )}
          />
          <textarea
            className="input"
            maxLength={240}
            rows={3}
            value={form.t}
            onChange={(e) => set({ t: e.target.value })}
            aria-label={L('Qisqa matn', 'Short text', 'Короткий текст')}
            placeholder={L(
              'Qisqa matn: kimlar uchun, muddati, afzalligi (240 belgigacha, ixtiyoriy)',
              'Short text: who it is for, deadline, benefit (up to 240 characters, optional)',
              'Короткий текст (до 240 символов, необязательно)',
            )}
          />
          <div className="promo-admin-row">
            <input
              className="input"
              maxLength={300}
              value={form.link}
              onChange={(e) => set({ link: e.target.value })}
              aria-label={L('Havola', 'Link', 'Ссылка')}
              placeholder={L(
                'Havola: https://… yoki #courses (ixtiyoriy)',
                'Link: https://… or #courses (optional)',
                'Ссылка: https://… или #courses',
              )}
            />
            <input
              className="input"
              maxLength={24}
              value={form.cta}
              onChange={(e) => set({ cta: e.target.value })}
              aria-label={L('Tugma yozuvi', 'Button text', 'Текст кнопки')}
              placeholder={L(
                'Tugma: «Ariza topshirish» (ixtiyoriy)',
                'Button: “Apply” (optional)',
                'Кнопка: «Подать заявку»',
              )}
            />
          </div>
          <div className="promo-admin-row">
            <label className="promo-file">
              <ImagePlus size={16} aria-hidden="true" />
              <span>
                {image
                  ? L('Rasm tanlandi', 'Picture chosen', 'Картинка выбрана')
                  : L('Rasm (ixtiyoriy)', 'Picture (optional)', 'Картинка')}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                aria-label={L('Rasm', 'Picture', 'Картинка')}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  try {
                    setImage(await shrink(f, 1200));
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              />
            </label>
            {image && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setImage(null)}
                aria-label={L('Rasmni olib tashlash', 'Remove picture', 'Убрать картинку')}
              >
                <X size={14} />
              </Button>
            )}
            <label className="promo-until">
              <span>{L('Ko‘rinadi:', 'Visible until:', 'Показывать до:')}</span>
              <input
                className="input"
                type="date"
                value={form.until}
                onChange={(e) => set({ until: e.target.value })}
                aria-label={L('Qaysi kungacha ko‘rinadi', 'Visible until', 'Показывать до')}
              />
            </label>
          </div>
          <Button type="submit" disabled={busy === 'add' || form.h.trim().length < 2}>
            <Plus size={15} /> {L('E’lonni joylash', 'Post', 'Опубликовать')}
          </Button>
        </form>
        <div className="promo-preview">
          <small className="muted">{L('Ko‘rinishi:', 'Preview:', 'Предпросмотр:')}</small>
          <div className="promo-box">
            <div className="promo-stage">
              <PromoSlide item={draft} lang={lang} now={n} />
            </div>
          </div>
        </div>
      </div>
      <ul className="promo-admin-list">
        {list.map((x) => (
          <li key={x.id}>
            {x.img ? (
              <img src={x.img} alt="" />
            ) : (
              <span className="promo-thumb" aria-hidden="true">
                {PROMO_KIND[x.kind].icon}
              </span>
            )}
            <span>
              <b>{x.h}</b>
              {x.t && <span>{x.t}</span>}
              <small>
                {tr(lang, ...PROMO_KIND[x.kind].name)} · {dueText(x.at, lang, n).date}
                {x.until ? ' → ' + dueText(x.until, lang, n).date : ''}
                {x.link ? ' · ' + x.link : ''}
              </small>
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!!busy}
              aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + x.h}
              onClick={() => void remove(x.id)}
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
        {!list.length && (
          <li className="muted">
            {L('Hozircha e’lon yo‘q.', 'No offers yet.', 'Пока нет предложений.')}
          </li>
        )}
      </ul>
    </section>
  );
}
