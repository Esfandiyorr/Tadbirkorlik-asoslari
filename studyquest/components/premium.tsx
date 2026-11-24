'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Clapperboard,
  Crown,
  LibraryBig,
  Palette,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';
import type { PremiumInfo, PremiumState } from '@/lib/library';
import { isPlayApp } from '@/lib/play-app';
import { LOOKS, lookOf } from '@/lib/premium-look';
import { ProductBuy } from './product-buy';
import { ImagePick } from './image-pick';

/* 💎 Obuna (premium): holatini o'qish, «obuna bo'lish» oynasi va kichik belgi. Obunani hozircha administrator beradi
   (lib/server/premium.ts) — oynada narx va to'lov yo'riqnomasi ko'rsatiladi. */

export type PremiumData = {
  state: PremiumState;
  info: PremiumInfo;
  now: number;
  /** 🏅 obunachi o'zi yuklagan belgi rasmi (yo'q bo'lsa — asl TerDU belgisi) */
  mark?: string;
};

/* 🏅 Ism yonidagi Premium belgisi: hamma joyda bitta holat (bosh sahifa, profil) — bir marta o'qiladi. */
const MARK_DEFAULT = '/premium-belgi.webp';
let myMark: { uid: string; src: string | null } | null = null;
let markLoading = false;
const markListeners = new Set<() => void>();
function setMyMark(uid: string, src: string | null) {
  myMark = { uid, src };
  markListeners.forEach((f) => f());
}
function useMyMark() {
  const { data, request } = useApp();
  const uid = data?.user?.id || '';
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    markListeners.add(rerender);
    if (uid && myMark?.uid !== uid && !markLoading) {
      markLoading = true;
      request('/api/platform?view=premium')
        .then((r) => (r.ok ? (r.json() as Promise<PremiumData>) : null))
        .then((v) => setMyMark(uid, v?.mark || null))
        .catch(() => {})
        .finally(() => (markLoading = false));
    }
    return () => void markListeners.delete(rerender);
  }, [uid, request]);
  return myMark?.uid === uid ? myMark.src : null;
}

/** Kirgan foydalanuvchining obuna holati (mehmonda — null). */
export function usePremium() {
  const { data, request } = useApp();
  const signedIn = !!data?.user;
  const [premium, setPremium] = useState<PremiumData | null>(null);
  const load = useCallback(async () => {
    if (!signedIn) return setPremium(null);
    try {
      const r = await request('/api/platform?view=premium');
      if (r.ok) {
        const v = (await r.json()) as PremiumData;
        setPremium(v);
        if (data?.user?.id) setMyMark(data.user.id, v.mark || null);
      }
    } catch {}
  }, [signedIn, request, data?.user?.id]);
  useEffect(() => {
    void load();
  }, [load]);
  return { premium, reload: load };
}

export function PremiumBadge({ state }: { state: PremiumState | null | undefined }) {
  const { lang } = useApp();
  if (!state?.active) return null;
  return (
    <span className="premium-badge">
      <Crown size={14} />
      {state.staff
        ? tr(lang, 'Hammasi ochiq', 'Full access', 'Полный доступ')
        : tr(lang, 'Obuna', 'Premium', 'Подписка') +
          (state.until ? ' · ' + dueText(state.until, lang, Date.now()).date : '')}
    </span>
  );
}

/** 🏅 Faol obunachining belgisi — ismdan keyin. Bosilsa: o'z rasmini (telefondan) qo'yish yoki asl belgiga qaytish. */
export function SubscriberMark({ editable = true }: { editable?: boolean }) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const label = L('Faol Premium obuna', 'Active Premium subscription', 'Активная подписка');
  const mark = useMyMark();
  const [open, setOpen] = useState(false);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mark || MARK_DEFAULT} alt={label} width={256} height={256} draggable={false} />
  );
  if (!editable)
    return (
      <span className="subscriber-mark" title={label}>
        {img}
      </span>
    );
  return (
    <>
      <button
        type="button"
        className="subscriber-mark is-editable"
        title={L('Belgini almashtirish', 'Change the badge', 'Сменить значок')}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {img}
      </button>
      {open && <MarkEditor current={mark} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Belgini almashtirish oynasi: telefondan rasm (256 px gacha kichraytiriladi) yoki asl TerDU belgisi. */
function MarkEditor({ current, onClose }: { current: string | null; onClose: () => void }) {
  const { lang, call, toast, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [pick, setPick] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  async function save(img: string | null) {
    setBusy(true);
    try {
      const v = (await call('premiumMark', { img })) as PremiumData;
      if (data?.user?.id) setMyMark(data.user.id, v.mark || null);
      toast(
        img
          ? L('🏅 Belgingiz saqlandi', '🏅 Your badge is saved', '🏅 Значок сохранён')
          : L('Asl belgi qaytarildi', 'The original badge is back', 'Возвращён исходный значок'),
      );
      onClose();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    if (!pick) return;
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = () =>
        reject(new Error(L('Rasm o‘qilmadi', 'Could not read', 'Не удалось прочитать')));
      r.readAsDataURL(pick);
    });
    await save(base64);
  }
  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className="panel mark-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-editor-h"
      >
        <button
          ref={closeRef}
          type="button"
          className="av-close"
          aria-label={L('Yopish', 'Close', 'Закрыть')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 id="mark-editor-h">
          {L('Premium belgingiz', 'Your Premium badge', 'Ваш значок Premium')}
        </h2>
        <p className="muted">
          {L(
            'Ismingizdan keyin turadigan belgi. Telefoningizdan istalgan rasmni yuklab qo‘yishingiz mumkin — uni faqat o‘zingiz ko‘rasiz.',
            'The badge after your name. Upload any picture from your phone — only you see it.',
            'Значок после вашего имени. Загрузите любую картинку с телефона — её видите только вы.',
          )}
        </p>
        <div className="mark-editor-now">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current || MARK_DEFAULT} alt="" />
          <small>
            {current
              ? L('Sizning belgingiz', 'Your badge', 'Ваш значок')
              : L('Asl belgi', 'Original badge', 'Исходный значок')}
          </small>
        </div>
        <ImagePick
          value={pick}
          onChange={setPick}
          max={256}
          label={L('📷 Telefondan rasm tanlash', '📷 Choose a picture', '📷 Выбрать картинку')}
          hint={L(
            'Kvadrat rasm (masalan, logotip yoki stiker) yaxshi ko‘rinadi.',
            'A square picture (a logo or a sticker) looks best.',
            'Лучше всего — квадратная картинка (логотип или стикер).',
          )}
        />
        <div className="mark-editor-actions">
          <Button disabled={!pick || busy} onClick={() => void upload()}>
            {L('Saqlash', 'Save', 'Сохранить')}
          </Button>
          {current && (
            <Button variant="outline" disabled={busy} onClick={() => void save(null)}>
              {L('Asl belgiga qaytarish', 'Back to the original', 'Вернуть исходный')}
            </Button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

/** 💎 Obuna bo'lmaganlarga doimiy karta: «Obuna bo'ling va quyidagi xizmatlardan foydalaning» — imkoniyatlar ro'yxati,
    bosilsa obuna oynasi ochiladi. Kompyuterda chap menyuning pastida, telefonda bosh sahifada (className bilan). */
export function PremiumSideCard({ className = '' }: { className?: string }) {
  const { lang, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { premium } = usePremium();
  const [offer, setOffer] = useState(false);
  const role = data?.user?.role;
  if (!data?.user || role === 'admin' || role === 'teacher' || !premium || premium.state.active)
    return null;
  return (
    <>
      <section
        className={'premium-side ' + className}
        aria-label={L('Premium obuna', 'Premium subscription', 'Подписка Premium')}
        onClick={() => setOffer(true)}
      >
        <div className="premium-side-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/premium-belgi.webp" alt="" width={56} height={56} />
          <div>
            <b>{L('Obuna bo‘ling', 'Get Premium', 'Оформите подписку')}</b>
            <small>
              {L(
                'va quyidagi xizmatlardan foydalaning:',
                'and enjoy these extras:',
                'и пользуйтесь дополнительно:',
              )}
            </small>
          </div>
        </div>
        <PremiumPerks compact />
        <Button
          size="sm"
          className="premium-side-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOffer(true);
          }}
        >
          {L('Obuna bo‘lish', 'Subscribe', 'Подписаться')}
        </Button>
      </section>
      {offer && <PremiumOffer info={premium.info} onClose={() => setOffer(false)} />}
    </>
  );
}

/** «💎 Obuna bo'lish» oynasi: nimalar ochiladi, narx va qanday to'lash. */
export function PremiumOffer({
  info,
  onClose,
}: {
  info: PremiumInfo | null | undefined;
  onClose: () => void;
}) {
  const { lang, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const signedIn = !!data?.user;
  // Play Market ilovasida narx va to'lov yo'riqnomasi ko'rsatilmaydi (Google qoidasi) — lib/play-app.ts
  const [play, setPlay] = useState(false);
  useEffect(() => setPlay(isPlayApp()), []);
  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className="panel premium-offer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-h"
      >
        <button
          ref={closeRef}
          type="button"
          className="av-close"
          aria-label={L('Yopish', 'Close', 'Закрыть')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="premium-offer-crown" aria-hidden="true">
          💎
        </span>
        <h2 id="premium-h">
          {L('Obuna bilan ko‘proq imkoniyat', 'More with Premium', 'Больше с подпиской')}
        </h2>
        <PremiumPerks />
        {signedIn ? (
          <div className="premium-plans">
            <ProductBuy product="premium" />
            <small className="muted">
              {L(
                'Narx belgilanmagan: istalgan summani to‘laysiz. Administrator chekni qabul qilib, obunani muddati bilan (1 oy yoki 1 yil) o‘zi ochadi.',
                'No fixed price: pay any amount. The administrator accepts the receipt and turns Premium on for a period (1 month or 1 year).',
                'Цена не фиксирована: оплатите любую сумму. Администратор примет чек и включит подписку на срок (1 месяц или 1 год).',
              )}
            </small>
          </div>
        ) : (
          play && (
            <p className="premium-offer-how">
              {L(
                'Bu imkoniyatlar obunachilar uchun. Obunangiz bo‘lsa, shu hisob bilan kirganingizda hammasi o‘zi ochiladi.',
                'These features are for subscribers. If you have Premium, everything opens once you sign in with that account.',
                'Эти возможности доступны подписчикам. Если у вас есть подписка, всё откроется после входа в этот аккаунт.',
              )}
            </p>
          )
        )}
        <div className="premium-offer-actions">
          {!signedIn && (
            <Button
              onClick={() => {
                onClose();
                location.hash = 'login';
              }}
            >
              {L('Kirish', 'Sign in', 'Войти')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {L('Yopish', 'Close', 'Закрыть')}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/** 💎 Profil sahifasidagi Premium kartasi: obunachi — bezagini tanlaydi (5 xil); obunasi yo'q — taklif. */
export function PremiumCard({
  name,
  premium,
  reload,
}: { name: string } & ReturnType<typeof usePremium>) {
  const { lang, call, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [offer, setOffer] = useState(false);
  const [busy, setBusy] = useState('');
  if (!premium || premium.state.staff) return null;
  const st = premium.state;
  return (
    <section className="panel profile-card premium-card" aria-labelledby="premium-card-h">
      <h2 id="premium-card-h">
        💎 Premium{' '}
        {st.active && st.until ? (
          <small className="muted">
            ·{' '}
            {L(
              dueText(st.until, lang, Date.now()).date + ' gacha',
              'until ' + dueText(st.until, lang, Date.now()).date,
              'до ' + dueText(st.until, lang, Date.now()).date,
            )}
          </small>
        ) : null}
      </h2>
      {st.active ? (
        <>
          <p className="muted">
            {L(
              'Profil bezagini tanlang — reytingda ismingiz shunday ko‘rinadi.',
              'Pick your profile style — this is how your name looks in the leaderboard.',
              'Выберите оформление — так ваше имя выглядит в рейтинге.',
            )}
          </p>
          <ul className="pm-looks ranking-list rk-list" role="radiogroup">
            {LOOKS.map((l) => {
              const on = lookOf(st.look).id === l.id;
              return (
                <li key={l.id} className={'rk-row pm pm-' + l.id + (on ? ' is-on' : '')}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy(l.id);
                      try {
                        await call('premiumLook', { look: l.id });
                        await reload();
                        toast(L('💎 Bezak saqlandi', '💎 Style saved', '💎 Оформление сохранено'));
                      } catch (e) {
                        toast((e as Error).message);
                      } finally {
                        setBusy('');
                      }
                    }}
                  >
                    <span className="rk-who">
                      <b>
                        <span className="rk-name">{name}</span>
                        <span className="pm-chip">{l.icon}</span>
                      </b>
                      <small>
                        {tr(lang, ...l.name)} — {tr(lang, ...l.text)}
                      </small>
                    </span>
                    <span className="pm-look-check" aria-hidden="true">
                      {on ? '✓' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <p>
            {L(
              'Obuna bo‘lganlarga quyidagilar ochiladi:',
              'Premium opens the following:',
              'С подпиской открывается:',
            )}
          </p>
          <PremiumPerks />
          <Button onClick={() => setOffer(true)}>
            💎 {L('Obuna bo‘lish', 'Get Premium', 'Оформить подписку')}
          </Button>
        </>
      )}
      {offer && <PremiumOffer info={premium.info} onClose={() => setOffer(false)} />}
    </section>
  );
}

/** 💎 Obuna bo'lganlarga nimalar ochiladi (taklif oynasi, profil va e'lonlar qutisida). */
export function PremiumPerks({ compact = false }: { compact?: boolean }) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const items: [LucideIcon, string, string][] = [
    [
      Palette,
      L('Profil bezagi (5 xil)', 'Profile style (5 kinds)', 'Оформление профиля (5 видов)'),
      L(
        'Profil bezagi — 5 xildan tanlaysiz, reytingda ismingiz ajralib turadi',
        'A profile style — pick one of 5, your name stands out in the leaderboard',
        'Оформление профиля — 5 вариантов, ваше имя выделяется в рейтинге',
      ),
    ],
    [
      UserRound,
      L('Avatar — top-10 siz ham', 'An avatar without top 10', 'Аватар без топ-10'),
      L(
        'Avatar — top-10 ga kirmasangiz ham (obuna davomida)',
        'An avatar — even outside the top 10 (while subscribed)',
        'Аватар — даже вне топ-10 (пока действует подписка)',
      ),
    ],
    [
      LibraryBig,
      L('Kutubxonaning 💎 manbalari', '💎 library items', '💎 материалы библиотеки'),
      L(
        'Kutubxonadagi 💎 belgili kitob, qo‘llanma va namunalar',
        'Books, guides and templates marked 💎 in the library',
        'Книги, пособия и шаблоны со значком 💎 в библиотеке',
      ),
    ],
    [
      BookOpen,
      L(
        'Kurs darslari (talaba bo‘lmasangiz ham)',
        'Course lessons for non-students',
        'Уроки курса для не-студентов',
      ),
      L(
        '«Tadbirkorlik asoslari» kursining barcha ochiq darslari (talaba bo‘lmaganlar uchun)',
        'All open lessons of the “Fundamentals of Entrepreneurship” course (for non-students)',
        'Все открытые уроки курса «Основы предпринимательства» (для не-студентов)',
      ),
    ],
    [
      Clapperboard,
      L('Videolarni yuklab olish', 'Video downloads', 'Скачивание видео'),
      L(
        'Video darslarni yuklab olib, internetsiz ko‘rish',
        'Download video lessons to watch offline',
        'Скачивание видеоуроков для просмотра без сети',
      ),
    ],
  ];
  // compact — e'lonlar qutisi uchun qisqa ro'yxat
  return (
    <ul className={'premium-perks' + (compact ? ' is-compact' : '')}>
      {items.map(([Icon, short, full]) => (
        <li key={short}>
          <Icon size={compact ? 13 : 16} aria-hidden="true" /> {compact ? short : full}
        </li>
      ))}
    </ul>
  );
}
