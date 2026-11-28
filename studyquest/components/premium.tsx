'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BadgeCheck,
  ChevronRight,
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
import { CLOSED_TEXT, isClosed } from '@/lib/student-limits';
import { LOOKS, lookOf } from '@/lib/premium-look';
import { PREMIUM_CHANGED, PremiumSubscribe } from './premium-subscribe';
import { ImagePick } from './image-pick';

/* 💎 Obuna (premium): holatini o'qish, «obuna bo'lish» oynasi va kichik belgi. Talaba o'zi obuna bo'ladi
   (components/premium-subscribe.tsx): karta → «To'lov qildim» → vaqt yoki chek → obuna administrator tasdiqlagach ochiladi;
   administrator «💎 Obuna»da tekshiradi (lib/server/premium.ts). */

export type PremiumData = {
  state: PremiumState;
  info: PremiumInfo;
  now: number;
  /** 🏅 obunachi o'zi yuklagan belgi rasmi (yo'q bo'lsa — asl TerDU belgisi) */
  mark?: string;
};

/** Obuna tugash sanasi — yili bilan («26.11.2027»), Toshkent vaqti: 1 yillik obunada yil muhim. */
const untilDate = (t: number) =>
  new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(t);

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
        // kutilmagan javob (holatsiz) — sahifa buzilmasin
        if (!v || typeof v !== 'object' || !v.state) return setPremium(null);
        setPremium(v);
        if (data?.user?.id) setMyMark(data.user.id, v.mark || null);
      }
    } catch {}
  }, [signedIn, request, data?.user?.id]);
  useEffect(() => {
    void load();
    // boshqa joyda obuna bo'linsa (obuna oynasi) — hamma joyda yangilanadi
    const again = () => void load();
    window.addEventListener(PREMIUM_CHANGED, again);
    return () => window.removeEventListener(PREMIUM_CHANGED, again);
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
  const [mine, setMine] = useState(false);
  const role = data?.user?.role;
  if (!data?.user || role === 'admin' || role === 'teacher' || !premium) return null;
  // 🎚 «Obuna bo'lish» yopilgan talabaga obuna taklifi ko'rsatilmaydi (faol obuna bo'lsa — ko'rinadi)
  if (!premium.state.active && isClosed(data.user, 'premium')) return null;
  // 💎 obunachi: chap menyuda «Premium faol» va imkoniyatlari qayerda (bosh sahifada ko'rsatilmaydi)
  if (premium.state.active) {
    if (className.includes('is-home')) return null;
    const until = premium.state.until;
    return (
      <>
        <section
          className={'premium-side is-active ' + className}
          aria-label={L('Premium obuna', 'Premium subscription', 'Подписка Premium')}
          onClick={() => setMine(true)}
        >
          <div className="premium-side-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/premium-belgi.webp" alt="" width={48} height={48} />
            <div>
              <b>{L('Premium faol', 'Premium is on', 'Premium активен')}</b>
              {until > 0 && (
                <small>
                  {L(
                    untilDate(until) + ' gacha',
                    'until ' + untilDate(until),
                    'до ' + untilDate(until),
                  )}
                </small>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="premium-side-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMine(true);
            }}
          >
            {L('Imkoniyatlarim', 'My Premium perks', 'Мои возможности')}
          </Button>
        </section>
        {mine && (
          <PremiumMine
            until={until}
            onClose={() => setMine(false)}
            onExtend={() => {
              setMine(false);
              setOffer(true);
            }}
          />
        )}
        {offer && <PremiumOffer info={premium.info} onClose={() => setOffer(false)} />}
      </>
    );
  }
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
        {signedIn && isClosed(data?.user, 'premium') ? (
          <p className="premium-offer-how" role="status">
            🔒 {L(CLOSED_TEXT.uz, CLOSED_TEXT.en, CLOSED_TEXT.ru)}
          </p>
        ) : signedIn && !play ? (
          <div className="premium-plans">
            <PremiumSubscribe />
          </div>
        ) : signedIn ? (
          <p className="premium-offer-how">
            {L(
              'Obuna saytda (www.tadbirkorlik-asoslari.uz) ochiladi. Ochilgach, shu hisob bilan ilovada ham ishlaydi.',
              'Premium is bought on the website (www.tadbirkorlik-asoslari.uz). Then it works in the app with this account too.',
              'Подписка оформляется на сайте (www.tadbirkorlik-asoslari.uz). Затем работает и в приложении с этим аккаунтом.',
            )}
          </p>
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

/** 💎 Obunachining imkoniyatlari: har biri qayerda ochilishi bilan (chap menyudagi «Imkoniyatlarim»). */
function PremiumMine({
  until,
  onClose,
  onExtend,
}: {
  until: number;
  onClose: () => void;
  onExtend: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className="panel premium-offer premium-mine"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-mine-h"
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="premium-mine-badge"
          src="/premium-belgi.webp"
          alt=""
          width={64}
          height={64}
        />
        <h2 id="premium-mine-h">
          {L('Premium imkoniyatlaringiz', 'Your Premium perks', 'Ваши возможности Premium')}
        </h2>
        {until > 0 && (
          <p className="muted">
            {L(
              'Obunangiz ' + untilDate(until) + ' gacha amal qiladi.',
              'Your Premium is active until ' + untilDate(until) + '.',
              'Подписка действует до ' + untilDate(until) + '.',
            )}
          </p>
        )}
        <PremiumPerks links onGo={onClose} />
        <div className="premium-offer-actions">
          <Button variant="outline" onClick={onExtend}>
            💎 {L('Obunani uzaytirish', 'Extend Premium', 'Продлить подписку')}
          </Button>
          <Button onClick={onClose}>{L('Yopish', 'Close', 'Закрыть')}</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/** 💎 Obuna bo'lganlarga nimalar ochiladi (taklif oynasi, profil, chap menyu). links — obunachiga: har biri qayerda. */
export function PremiumPerks({
  compact = false,
  links = false,
  onGo,
}: {
  compact?: boolean;
  links?: boolean;
  onGo?: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const items: [LucideIcon, string, string, string, string][] = [
    [
      Palette,
      L('Profil bezagi (12 xil)', 'Profile style (12 kinds)', 'Оформление профиля (12 видов)'),
      L(
        'Profil bezagi — 12 xildan tanlaysiz, reytingda ismingiz ajralib turadi',
        'A profile style — pick one of 12, your name stands out in the leaderboard',
        'Оформление профиля — 12 вариантов, ваше имя выделяется в рейтинге',
      ),
      '#profile',
      L('Profil → 💎 Premium', 'Profile → 💎 Premium', 'Профиль → 💎 Premium'),
    ],
    [
      BadgeCheck,
      L('Ism yonida Premium belgisi', 'Premium badge by your name', 'Значок Premium у имени'),
      L(
        'Ismingiz yonida Premium belgisi — ustiga bosib o‘z rasmingizni qo‘yasiz',
        'A Premium badge by your name — tap it to put your own picture',
        'Значок Premium у имени — нажмите, чтобы поставить свою картинку',
      ),
      '#profile',
      L('Profildagi belgini bosing', 'Tap the badge in Profile', 'Нажмите значок в профиле'),
    ],
    [
      UserRound,
      L('Avatar — top-10 siz ham', 'An avatar without top 10', 'Аватар без топ-10'),
      L(
        'Avatar — top-10 ga kirmasangiz ham (obuna davomida)',
        'An avatar — even outside the top 10 (while subscribed)',
        'Аватар — даже вне топ-10 (пока действует подписка)',
      ),
      '#home',
      L('Bosh sahifa → «Avatar qo‘yish»', 'Home → “Set avatar”', 'Главная → «Аватар»'),
    ],
    [
      LibraryBig,
      L('Kutubxonaning 💎 manbalari', '💎 library items', '💎 материалы библиотеки'),
      L(
        'Kutubxonadagi 💎 belgili kitob, qo‘llanma va namunalar',
        'Books, guides and templates marked 💎 in the library',
        'Книги, пособия и шаблоны со значком 💎 в библиотеке',
      ),
      '#library',
      L('Kutubxona', 'Library', 'Библиотека'),
    ],
    [
      Clapperboard,
      L('Videolarni yuklab olish', 'Video downloads', 'Скачивание видео'),
      L(
        'Ruxsatingiz bor darslarning videolarini yuklab olib, internetsiz ko‘rish',
        'Download videos from lessons you can access and watch offline',
        'Скачивайте видео доступных вам уроков для просмотра без сети',
      ),
      '#courses',
      L('Mavzudagi video → «Yuklab olish»', 'Topic video → “Download”', 'Видео темы → «Скачать»'),
    ],
  ];
  // links — obunachiga: har bir imkoniyat qayerda ochilishi (bosilsa o'sha bo'limga o'tadi)
  if (links)
    return (
      <ul className="premium-perks is-links">
        {items.map(([Icon, short, full, href, where]) => (
          <li key={short}>
            <a href={href} onClick={() => onGo?.()}>
              <Icon size={18} aria-hidden="true" />
              <span>
                <b>{full}</b>
                <small>{where}</small>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    );
  // compact — chap menyudagi karta uchun qisqa ro'yxat
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
