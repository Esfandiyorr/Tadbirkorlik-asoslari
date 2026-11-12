'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { dueText, tr } from '@/lib/points';
import type { PremiumInfo, PremiumState } from '@/lib/library';

/* 💎 Obuna (premium): holatini o'qish, «obuna bo'lish» oynasi va kichik belgi. Obunani hozircha administrator beradi
   (lib/server/premium.ts) — oynada narx va to'lov yo'riqnomasi ko'rsatiladi. */

export type PremiumData = { state: PremiumState; info: PremiumInfo; now: number };

/** Kirgan foydalanuvchining obuna holati (mehmonda — null). */
export function usePremium() {
  const { data, request } = useApp();
  const signedIn = !!data?.user;
  const [premium, setPremium] = useState<PremiumData | null>(null);
  const load = useCallback(async () => {
    if (!signedIn) return setPremium(null);
    try {
      const r = await request('/api/platform?view=premium');
      if (r.ok) setPremium(await r.json());
    } catch {}
  }, [signedIn, request]);
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
        <ul>
          <li>
            🎞{' '}
            {L(
              'Sun’iy intellekt istalgan mavzuda tayyor taqdimot tuzib beradi — PowerPoint faylini yuklab olasiz',
              'AI builds a ready presentation on any topic — download it as a PowerPoint file',
              'ИИ готовит презентацию на любую тему — скачивайте файл PowerPoint',
            )}
          </li>
          <li>
            📚{' '}
            {L(
              'Kutubxonadagi 💎 belgili kitob, qo‘llanma va namunalar',
              'Books, guides and templates marked 💎 in the library',
              'Книги, пособия и шаблоны со значком 💎 в библиотеке',
            )}
          </li>
          <li>
            🚀{' '}
            {L(
              'Yangi pullik imkoniyatlar qo‘shilganda — birinchilardan bo‘lib',
              'First access to new premium features',
              'Первый доступ к новым платным возможностям',
            )}
          </li>
        </ul>
        {info?.price && (
          <p className="premium-offer-price">
            <b>{info.price}</b>
          </p>
        )}
        <p className="premium-offer-how">
          {info?.how ||
            L(
              'Obuna bo‘lish uchun administratorga yozing — u to‘lov usulini aytadi va obunani yoqib beradi.',
              'To subscribe, write to the administrator — they will explain how to pay and turn Premium on.',
              'Чтобы оформить подписку, напишите администратору — он объяснит оплату и включит подписку.',
            )}
        </p>
        <div className="premium-offer-actions">
          <Button
            onClick={() => {
              onClose();
              navigate(signedIn ? 'chat/admin' : 'login');
            }}
          >
            {signedIn
              ? L('Administratorga yozish', 'Write to the administrator', 'Написать администратору')
              : L('Kirish', 'Sign in', 'Войти')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {L('Keyinroq', 'Later', 'Позже')}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
