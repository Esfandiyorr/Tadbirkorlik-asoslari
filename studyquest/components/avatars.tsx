'use client';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Crown,
  CreditCard,
  Lock,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { AVATAR_TOP, BUILTIN_AVATARS, type AvatarItem, type AvatarShop } from '@/lib/avatars';
import { dueText, tr } from '@/lib/points';
import { isPlayApp } from '@/lib/play-app';
import { PremiumOffer, usePremium } from './premium';
import type { Lang } from '@/lib/types';

/* 🎭 Avatarlar: kutubxona (tanlash oynasi), bosh sahifadagi avatar kartochkasi va umumiy reyting ma'lumoti. */

export type BoardEntry = {
  id: string;
  name: string;
  classId: string;
  academicPoints?: number;
  today?: number;
  /** shu hafta (dushanbadan, Toshkent) to'plangan ball */
  week?: number;
  avatar?: string;
  /** 💎 obunachi profil bezagi (lib/premium-look.ts) */
  pm?: string;
};
export type AvatarMe = {
  place: number;
  top: boolean;
  allowed: boolean;
  can: boolean;
  avatar: string | null;
  /** 💎 obuna orqali */
  premium?: boolean;
  /** 💳 sotib olingan muddat tugash vaqti */
  pass?: number | null;
  via?: 'top' | 'allow' | 'premium' | 'pass' | null;
  /** huquq tugagani uchun bo'shatilgan avatar (bir marta ko'rsatiladi) */
  lost?: { a: string; at: number } | null;
  /** «to'lov qildim» so'rovi yuborilgan vaqt */
  order?: number | null;
  canBuy?: boolean;
};
type AvatarState = {
  owners: Record<string, string>;
  me: AvatarMe | null;
  catalog?: AvatarItem[];
  shop?: AvatarShop;
};
type BoardResponse = { leaderboard?: BoardEntry[]; avatars?: AvatarState; error?: string };

/* Kutubxona ro'yxati (asl qahramonlar + administrator yuklaganlari) serverdan reyting bilan birga keladi.
   Kelguncha — asl 10 tasi. */
let catalog = new Map<string, AvatarItem>(BUILTIN_AVATARS.map((a) => [a.id, a]));
let catalogList: AvatarItem[] = BUILTIN_AVATARS;
export function setAvatarCatalog(list?: AvatarItem[]) {
  if (!list?.length) return;
  catalogList = list;
  catalog = new Map(list.map((a) => [a.id, a]));
}
export const avatarList = () => catalogList;

/** Umumiy reyting va avatarlar holati (reyting sahifasi va bosh sahifa uchun). */
export function useAcademicBoard(enabled = true) {
  const { request } = useApp();
  const [rows, setRows] = useState<BoardEntry[]>([]),
    [avatars, setAvatars] = useState<AvatarState>({ owners: {}, me: null }),
    [loading, setLoading] = useState(enabled),
    [error, setError] = useState('');
  const apply = useCallback((v: BoardResponse) => {
    setAvatarCatalog(v.avatars?.catalog);
    setRows(v.leaderboard || []);
    setAvatars(v.avatars || { owners: {}, me: null });
  }, []);
  const load = useCallback(async () => {
    const r = await request('/api/platform?view=academic'),
      v = (await r.json()) as BoardResponse;
    if (!r.ok) throw new Error(v.error);
    apply(v);
    setError('');
  }, [request, apply]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setLoading(true);
    load()
      .catch((e) => live && setError((e as Error).message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [load, enabled]);
  return { rows, avatars, loading, error, apply, load };
}
export type AcademicBoard = ReturnType<typeof useAcademicBoard>;

/** Avatar rasmi yoki rangsiz soya (avatar hali yo'q). */
export function AvatarFigure({ id, className = '' }: { id?: string | null; className?: string }) {
  const item = id ? catalog.get(id) : undefined;
  if (item)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={'av-figure ' + className} src={item.src} alt="" draggable={false} />
    );
  return (
    <svg className={'av-figure av-empty ' + className} viewBox="0 0 64 80" aria-hidden="true">
      <circle cx="32" cy="21" r="14" />
      <path d="M5 80c0-21 11.5-33 27-33s27 12 27 33z" />
    </svg>
  );
}

export const avatarName = (id: string, lang: Lang) => {
  const item = catalog.get(id);
  return item ? tr(lang, ...item.name) : '';
};

/** Talaba holatiga qarab izoh: nega tanlay oladi yoki ololmaydi. */
function eligibility(me: AvatarMe | null, lang: Lang) {
  if (!me) return '';
  if (me.can && (me.via === 'premium' || me.via === 'pass'))
    return me.via === 'premium'
      ? tr(
          lang,
          '💎 Obunangiz bor — avatar tanlashingiz mumkin! Obuna tugasa, avatar bo‘shatiladi.',
          '💎 You have Premium — pick your avatar! When Premium ends, the avatar is freed.',
          '💎 У вас подписка — выберите аватар! Когда подписка закончится, аватар освободится.',
        )
      : tr(
          lang,
          `💳 Avatar huquqingiz ${dueText(me.pass || 0, lang, Date.now()).date} gacha. Muddat tugasa, avatar bo‘shatiladi.`,
          `💳 Your avatar pass lasts until ${dueText(me.pass || 0, lang, Date.now()).date}. Then the avatar is freed.`,
          `💳 Право на аватар до ${dueText(me.pass || 0, lang, Date.now()).date}. Потом аватар освободится.`,
        );
  if (me.can)
    return me.top
      ? tr(
          lang,
          `Siz umumiy reytingda ${me.place}-o‘rindasiz — avatar tanlashingiz mumkin! 🎉`,
          `You are #${me.place} in the overall ranking — pick your avatar! 🎉`,
          `Вы на ${me.place}-м месте общего рейтинга — выберите аватар! 🎉`,
        )
      : tr(
          lang,
          'Administrator sizga avatar tanlashga ruxsat bergan. 🎉',
          'The administrator has allowed you to choose an avatar. 🎉',
          'Администратор разрешил вам выбрать аватар. 🎉',
        );
  return tr(
    lang,
    `Avatar umumiy reytingning 1–${AVATAR_TOP}-o‘rinlaridagi talabalarga beriladi.` +
      (me.place ? ` Siz hozir ${me.place}-o‘rindasiz.` : ''),
    `Avatars go to students in places 1–${AVATAR_TOP} of the overall ranking.` +
      (me.place ? ` You are #${me.place} now.` : ''),
    `Аватары получают студенты на 1–${AVATAR_TOP}-м местах общего рейтинга.` +
      (me.place ? ` Сейчас вы на ${me.place}-м месте.` : ''),
  );
}

/** 📜 Avatar qo'yish shartlari — avatar bosilganda (qo'yishdan oldin) ko'rsatiladi. */
function AvatarRules({ lang }: { lang: Lang }) {
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  return (
    <ul className="av-rules">
      <li>
        🏆{' '}
        {L(
          `Umumiy reytingning 1–${AVATAR_TOP}-o‘rinlaridagi talabalar avatarni bepul qo‘yadi.`,
          `Students in places 1–${AVATAR_TOP} of the overall ranking set an avatar for free.`,
          `Студенты на 1–${AVATAR_TOP}-м местах общего рейтинга ставят аватар бесплатно.`,
        )}
      </li>
      <li>
        💎{' '}
        {L(
          'Obuna davomida (yoki avatar huquqi sotib olingan muddatda) ham qo‘yish mumkin; administrator alohida ruxsat ham berishi mumkin.',
          'You can also set one while subscribed (or during a bought avatar pass); the administrator may allow it too.',
          'Также можно по подписке (или на оплаченный срок); администратор может разрешить отдельно.',
        )}
      </li>
      <li>
        👤{' '}
        {L(
          'Bitta avatar faqat bitta talabada bo‘ladi — siz qo‘ygan avatar boshqalarga «band» bo‘lib ko‘rinadi.',
          'Each avatar belongs to one student only — yours shows as “taken” to others.',
          'Один аватар — у одного студента: ваш будет «занят» для других.',
        )}
      </li>
      <li>
        📉{' '}
        {L(
          `Top-${AVATAR_TOP} dan tushsangiz yoki obuna/muddat tugasa, avatar avtomatik bo‘shatiladi.`,
          `If you leave the top ${AVATAR_TOP} or Premium/your pass ends, the avatar is freed automatically.`,
          `Если вы выйдете из топ-${AVATAR_TOP} или закончится подписка/срок, аватар освободится.`,
        )}
      </li>
      <li>
        🔁{' '}
        {L(
          'Avatarni istalgan vaqtda almashtirish yoki olib tashlash mumkin.',
          'You can change or remove your avatar at any time.',
          'Аватар можно сменить или убрать в любой момент.',
        )}
      </li>
    </ul>
  );
}

/** Avatarlar kutubxonasi: rasmlar ro'yxati; avatar bosilsa — qo'yish shartlari va (sharti bo'lsa) «Qo'yish»,
    bo'lmasa — avatar olish yo'llari. Olib tashlash va yangi avatar taklif qilish ham shu yerda. */
export function AvatarPicker({ board, onClose }: { board: AcademicBoard; onClose: () => void }) {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const me = board.avatars.me,
    owners = board.avatars.owners,
    names = Object.fromEntries(board.rows.map((r) => [r.id, r.name]));
  const [busy, setBusy] = useState(''),
    [idea, setIdea] = useState({ hero: '', link: '', note: '' }),
    [sent, setSent] = useState(false),
    // tanlangan (bosilgan) avatar: uning shartlari ko'rsatiladi
    [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (sel) setSel(null);
      else onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, sel]);
  async function choose(id: string | null) {
    setBusy(id || 'none');
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'avatarPick', input: { avatar: id } }),
        }),
        v = (await r.json()) as BoardResponse;
      if (!r.ok) throw new Error(v.error);
      board.apply(v);
      toast(
        id
          ? '🎭 ' +
              L(
                `${avatarName(id, lang)} — endi sizning avataringiz!`,
                `${avatarName(id, lang)} is your avatar now!`,
                `${avatarName(id, lang)} — теперь ваш аватар!`,
              )
          : L('Avatar olib tashlandi', 'Avatar removed', 'Аватар убран'),
      );
      if (id) onClose();
    } catch (e) {
      toast((e as Error).message);
      void board.load().catch(() => {});
    } finally {
      setBusy('');
    }
  }
  async function suggest(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      L('Avatar taklifi', 'Avatar suggestion', 'Предложение аватара') + ': ' + idea.hero.trim(),
      idea.link.trim() && L('Rasm', 'Picture', 'Картинка') + ': ' + idea.link.trim(),
      idea.note.trim() && L('Izoh', 'Note', 'Комментарий') + ': ' + idea.note.trim(),
    ]
      .filter(Boolean)
      .join('\n');
    setBusy('idea');
    try {
      const r = await request('/api/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', input: { cat: 'avatar', text } }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setSent(true);
      setIdea({ hero: '', link: '', note: '' });
      toast(
        '📨 ' +
          L(
            'Taklifingiz administratorga yuborildi',
            'Your suggestion was sent to the administrator',
            'Предложение отправлено администратору',
          ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  // Portal: ota blokdagi animatsiya (transform) «fixed» oynani o'z ichiga qamab qo'ymasin.
  return createPortal(
    <div
      className="modal-backdrop av-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="panel av-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="av-picker-h"
      >
        <header className="av-picker-head">
          <div>
            <h2 id="av-picker-h">
              🎭 {L('Avatarlar kutubxonasi', 'Avatar library', 'Библиотека аватаров')}
            </h2>
            {!sel && <p className={me?.can ? 'ok' : ''}>{eligibility(me, lang)}</p>}
          </div>
          <button
            type="button"
            className="av-close"
            aria-label={L('Yopish', 'Close', 'Закрыть')}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {me?.lost && (
          <p className="av-lost" role="status">
            📉{' '}
            {L(
              `Avatar olish huquqingiz tugadi (top-${AVATAR_TOP} dan tushdingiz yoki obuna/sotib olingan muddat tugadi), shuning uchun «${avatarName(me.lost.a, lang)}» avatari bo‘shatildi.`,
              `Your avatar right ended (you left the top ${AVATAR_TOP} or Premium/your pass expired), so “${avatarName(me.lost.a, lang)}” was freed.`,
              `Право на аватар закончилось (вы вышли из топ-${AVATAR_TOP} или закончилась подписка/оплаченный срок), поэтому «${avatarName(me.lost.a, lang)}» освобождён.`,
            )}
          </p>
        )}
        {sel ? (
          // 📜 bosilgan avatar: katta rasmi, qo'yish shartlari va «Qo'yish» (yoki avatar olish yo'llari)
          <div className="av-detail" role="region" aria-label={avatarName(sel, lang)}>
            <span className="av-stage av-detail-stage">
              <AvatarFigure id={sel} />
            </span>
            <div className="av-detail-body">
              <h3>{avatarName(sel, lang)}</h3>
              <b className="av-detail-h">
                📜 {L('Avatar qo‘yish shartlari', 'Avatar rules', 'Условия аватара')}
              </b>
              <AvatarRules lang={lang} />
              {me ? (
                <p className={'av-detail-status' + (me.can ? ' ok' : '')}>
                  {eligibility(me, lang)}
                </p>
              ) : (
                <p className="av-detail-status">
                  {L(
                    'Avatar qo‘yish uchun hisobingizga kiring.',
                    'Sign in to set an avatar.',
                    'Войдите, чтобы поставить аватар.',
                  )}
                </p>
              )}
              {me && !me.can && <AvatarWays board={board} />}
              <div className="av-detail-actions">
                {me?.can && (
                  <Button disabled={!!busy} onClick={() => void choose(sel)}>
                    <Sparkles size={16} />{' '}
                    {busy === sel
                      ? '…'
                      : L('Shu avatarni qo‘yish', 'Set this avatar', 'Поставить этот аватар')}
                  </Button>
                )}
                <Button variant="outline" disabled={!!busy} onClick={() => setSel(null)}>
                  ← {L('Boshqa avatarlar', 'Other avatars', 'Другие аватары')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ul className="av-grid">
            {(board.avatars.catalog || avatarList()).map(({ id }) => {
              const owner = owners[id],
                mine = me?.avatar === id,
                taken = !!owner && !mine;
              const state = mine ? 'mine' : taken ? 'taken' : me?.can ? 'free' : 'locked';
              return (
                <li key={id} className={'av-card is-' + state}>
                  <button
                    type="button"
                    // bo'sh avatar bosilsa — qo'yish shartlari ochiladi (tanlash huquqi bo'lmasa ham)
                    disabled={mine || taken || !!busy}
                    onClick={() => setSel(id)}
                    aria-label={
                      avatarName(id, lang) +
                      ' — ' +
                      (mine
                        ? L('sizning avataringiz', 'your avatar', 'ваш аватар')
                        : taken
                          ? L('band', 'taken', 'занят')
                          : me?.can
                            ? L('tanlash', 'choose', 'выбрать')
                            : L('qo‘yish shartlari', 'how to get it', 'как получить'))
                    }
                  >
                    <span className="av-stage">
                      <AvatarFigure id={id} />
                    </span>
                    <b>{avatarName(id, lang)}</b>
                    <small>
                      {mine ? (
                        <>
                          <Check size={13} /> {L('Sizniki', 'Yours', 'Ваш')}
                        </>
                      ) : taken ? (
                        <>
                          <Lock size={12} /> {L('Band', 'Taken', 'Занят')}
                          {names[owner] ? ' · ' + names[owner] : ''}
                        </>
                      ) : me?.can ? (
                        <>
                          <Sparkles size={13} /> {L('Tanlash', 'Choose', 'Выбрать')}
                        </>
                      ) : (
                        <>
                          <Lock size={12} /> {L('Shartlari', 'How to get', 'Условия')}
                        </>
                      )}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {me?.avatar && !sel && (
          <div className="av-remove">
            <Button variant="outline" disabled={!!busy} onClick={() => void choose(null)}>
              {L('Avatarni olib tashlash', 'Remove my avatar', 'Убрать аватар')}
            </Button>
          </div>
        )}
        <form className="av-idea" onSubmit={(e) => void suggest(e)}>
          <h3>
            💡 {L('Yangi avatar taklif qiling', 'Suggest a new avatar', 'Предложите новый аватар')}
          </h3>
          <p>
            {L(
              'Qaysi qahramon kutubxonada bo‘lishini xohlaysiz? Taklifingiz administratorga boradi.',
              'Which character would you like in the library? Your idea goes to the administrator.',
              'Какого героя добавить в библиотеку? Предложение получит администратор.',
            )}
          </p>
          <input
            className="input"
            required
            minLength={2}
            maxLength={80}
            value={idea.hero}
            onChange={(e) => setIdea({ ...idea, hero: e.target.value })}
            aria-label={L('Qahramon nomi', 'Character name', 'Имя героя')}
            placeholder={L(
              'Qahramon va multfilm/o‘yin nomi',
              'Character and cartoon/game',
              'Герой и мультфильм/игра',
            )}
          />
          <input
            className="input"
            type="url"
            maxLength={500}
            value={idea.link}
            onChange={(e) => setIdea({ ...idea, link: e.target.value })}
            aria-label={L('Rasm havolasi', 'Picture link', 'Ссылка на картинку')}
            placeholder={L(
              'Rasm havolasi (ixtiyoriy)',
              'Picture link (optional)',
              'Ссылка на картинку (необязательно)',
            )}
          />
          <textarea
            className="input"
            maxLength={600}
            rows={2}
            value={idea.note}
            onChange={(e) => setIdea({ ...idea, note: e.target.value })}
            aria-label={L('Izoh', 'Note', 'Комментарий')}
            placeholder={L('Izoh (ixtiyoriy)', 'Note (optional)', 'Комментарий (необязательно)')}
          />
          <Button type="submit" disabled={busy === 'idea' || idea.hero.trim().length < 2}>
            <Send size={15} /> {L('Taklif yuborish', 'Send suggestion', 'Отправить')}
          </Button>
          {sent && (
            <small className="av-sent">
              ✅{' '}
              {L(
                'Yuborildi. Javobni «Talabalar chati → Adminga xabar» bo‘limida ko‘rasiz.',
                'Sent. You will see the reply in “Chat → Message the admin”.',
                'Отправлено. Ответ появится в «Чат → Сообщение администратору».',
              )}
            </small>
          )}
        </form>
        <p className="av-notice">
          {L(
            'Qahramonlar tasvirlari ularning mualliflik huquqi egalariga tegishli; saytda faqat o‘quv maqsadida ishlatiladi.',
            'Character images belong to their copyright holders and are used here for education only.',
            'Изображения героев принадлежат правообладателям и используются только в учебных целях.',
          )}
        </p>
      </section>
    </div>,
    document.body,
  );
}

/** 🎁 Avatar olish yo'llari: 🏆 top-10 (bepul), 💎 obuna, 💳 sotib olish (to'lovni hozircha administrator tasdiqlaydi;
   Click ulanganda — avtomatik). Play Market ilovasida narx va to'lov yo'riqnomasi ko'rsatilmaydi (Google qoidasi). */
function AvatarWays({ board }: { board: AcademicBoard }) {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const me = board.avatars.me!,
    shop = board.avatars.shop;
  const { premium } = usePremium();
  const [offer, setOffer] = useState(false),
    [buy, setBuy] = useState(false),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [play, setPlay] = useState(false);
  useEffect(() => setPlay(isPlayApp()), []);
  async function order(op: 'order' | 'cancel') {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'avatarOrder',
            input: { op, ...(op === 'order' && note.trim() ? { note: note.trim() } : {}) },
          }),
        }),
        v = (await r.json()) as BoardResponse;
      if (!r.ok) throw new Error(v.error);
      board.apply(v);
      setNote('');
      setBuy(false);
      toast(
        op === 'order'
          ? '📨 ' +
              L(
                'So‘rov yuborildi. Administrator to‘lovni tekshirib avatarni ochadi.',
                'Request sent. The administrator will check the payment and unlock the avatar.',
                'Запрос отправлен. Администратор проверит оплату и откроет аватар.',
              )
          : L('So‘rov bekor qilindi.', 'Request cancelled.', 'Запрос отменён.'),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const buyable = !!me.canBuy && !play;
  return (
    <div className="av-ways">
      <h3>🎁 {L('Avatar olish yo‘llari', 'Ways to get an avatar', 'Как получить аватар')}</h3>
      <div className="av-way">
        <span className="av-way-ico" aria-hidden="true">
          <Trophy size={18} />
        </span>
        <div>
          <b>
            {L(
              `Umumiy reytingda top-${AVATAR_TOP} ga chiqing`,
              `Reach the overall top ${AVATAR_TOP}`,
              `Войдите в топ-${AVATAR_TOP} общего рейтинга`,
            )}
          </b>
          <small>
            {L('Bepul', 'Free', 'Бесплатно')}
            {me.place
              ? ' · ' +
                L(
                  `hozir ${me.place}-o‘rindasiz`,
                  `you are #${me.place} now`,
                  `сейчас ${me.place}-е место`,
                )
              : ''}
          </small>
        </div>
      </div>
      <div className="av-way">
        <span className="av-way-ico" aria-hidden="true">
          <Crown size={18} />
        </span>
        <div>
          <b>{L('💎 Obuna bo‘ling', '💎 Get Premium', '💎 Оформите подписку')}</b>
          <small>
            {L(
              'Obuna davomida avatar sizda turadi (taqdimot, kutubxona va boshqalar ham ochiladi)',
              'You keep an avatar while subscribed (plus presentations, the library and more)',
              'Аватар ваш, пока действует подписка (а ещё презентации, библиотека и другое)',
            )}
          </small>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOffer(true)}>
          {L('Obuna', 'Premium', 'Подписка')}
        </Button>
      </div>
      {buyable && (
        <div className="av-way">
          <span className="av-way-ico" aria-hidden="true">
            <CreditCard size={18} />
          </span>
          <div>
            <b>{L('💳 Avatarni sotib oling', '💳 Buy an avatar', '💳 Купите аватар')}</b>
            <small>
              {(shop?.price ? shop.price + ' · ' : '') +
                L(
                  `${shop?.days || 30} kunga`,
                  `for ${shop?.days || 30} days`,
                  `на ${shop?.days || 30} дней`,
                )}
            </small>
          </div>
          {!me.order && !buy && (
            <Button size="sm" onClick={() => setBuy(true)}>
              {L('Sotib olish', 'Buy', 'Купить')}
            </Button>
          )}
        </div>
      )}
      {buyable && me.order ? (
        <div className="av-buy is-pending" role="status">
          <span>
            ⏳{' '}
            {L(
              `So‘rovingiz yuborilgan (${dueText(me.order, lang, Date.now()).date}). Administrator to‘lovni tekshirib avatarni ochadi.`,
              `Request sent (${dueText(me.order, lang, Date.now()).date}). The administrator will check the payment and unlock the avatar.`,
              `Запрос отправлен (${dueText(me.order, lang, Date.now()).date}). Администратор проверит оплату и откроет аватар.`,
            )}
          </span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void order('cancel')}>
            {L('Bekor qilish', 'Cancel', 'Отменить')}
          </Button>
        </div>
      ) : buyable && buy ? (
        <form
          className="av-buy"
          onSubmit={(e) => {
            e.preventDefault();
            void order('order');
          }}
        >
          <p>
            {shop?.how ||
              L(
                'To‘lov usulini bilish uchun «Talabalar chati → Adminga xabar» orqali administratorga yozing. To‘lagach, shu yerdan so‘rov yuboring.',
                'Write to the administrator in “Chat → Message the admin” to learn how to pay. After paying, send the request here.',
                'Напишите администратору в «Чат → Сообщение администратору», чтобы узнать способ оплаты. После оплаты отправьте запрос здесь.',
              )}
          </p>
          <label>
            {L(
              'Izoh (ixtiyoriy): chek raqami, to‘lov vaqti',
              'Note (optional): receipt number, payment time',
              'Комментарий (необязательно): номер чека, время оплаты',
            )}
            <input
              className="input"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="av-buy-actions">
            <Button type="submit" disabled={busy}>
              ✅{' '}
              {L(
                'To‘lov qildim — so‘rov yuborish',
                'I paid — send request',
                'Я оплатил — отправить',
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setBuy(false)}>
              {L('Orqaga', 'Back', 'Назад')}
            </Button>
          </div>
        </form>
      ) : null}
      {offer && <PremiumOffer info={premium?.info} onClose={() => setOffer(false)} />}
    </div>
  );
}

/** Bosh sahifadagi avatar kartochkasi (mavzu rasmi o'rnida). Bosilsa — kutubxona ochiladi.
   Avatar tanlangan bo'lsa — faqat qahramonning o'zi (yozuvsiz, kattaroq); almashtirish uchun ustiga bosiladi. */
export function HeroAvatar({ board }: { board: AcademicBoard }) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [open, setOpen] = useState(false);
  const me = board.avatars.me,
    id = me?.avatar;
  return (
    <>
      <button
        type="button"
        className={'hero-avatar' + (id ? ' has' : '')}
        onClick={() => setOpen(true)}
        aria-label={
          id
            ? L('Avatarim', 'My avatar', 'Мой аватар') +
              ': ' +
              avatarName(id, lang) +
              ' — ' +
              L('almashtirish', 'change', 'сменить')
            : L('Avatar qo‘yish', 'Set an avatar', 'Поставить аватар')
        }
      >
        {id ? (
          <>
            <span className="hero-avatar-stage">
              <AvatarFigure id={id} />
            </span>
            <span className="hero-avatar-swap" aria-hidden="true">
              <RefreshCw size={15} />
            </span>
          </>
        ) : (
          <>
            {/* avatar hali yo'q — joy bo'sh turadi; bosilsa avatarlar rasmlari ochiladi */}
            <span className="hero-avatar-stage hero-avatar-empty" aria-hidden="true">
              <Plus size={34} strokeWidth={2.4} />
            </span>
            <span className="hero-avatar-label">
              <b>{L('Avatar qo‘yish', 'Set an avatar', 'Поставить аватар')}</b>
              <small>
                {me?.can
                  ? me.via === 'premium'
                    ? L('💎 Obunangiz bor!', '💎 You have Premium!', '💎 У вас подписка!')
                    : me.via === 'pass'
                      ? L(
                          '💳 Avatar huquqingiz bor!',
                          '💳 You have an avatar pass!',
                          '💳 У вас есть право на аватар!',
                        )
                      : me.via === 'allow'
                        ? L(
                            'Administrator ruxsat bergan 🎉',
                            'Allowed by the administrator 🎉',
                            'Разрешено администратором 🎉',
                          )
                        : L('Siz top-10 dasiz! 🎉', 'You are in the top 10! 🎉', 'Вы в топ-10! 🎉')
                  : me?.lost
                    ? L('📉 Avatar bo‘shatildi', '📉 Avatar freed', '📉 Аватар освобождён')
                    : L(
                        'Rasmlar va shartlarni ko‘rish',
                        'See the pictures and rules',
                        'Картинки и условия',
                      ) +
                      (me?.place
                        ? ' · ' +
                          L(`hozir ${me.place}-o‘rin`, `now #${me.place}`, `сейчас ${me.place}-е`)
                        : '')}
              </small>
            </span>
          </>
        )}
      </button>
      {open && <AvatarPicker board={board} onClose={() => setOpen(false)} />}
    </>
  );
}
