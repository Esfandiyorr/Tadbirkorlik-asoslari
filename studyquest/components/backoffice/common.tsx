'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../provider';
import { tr } from '@/lib/points';
import { khDay } from '@/lib/live-quiz';
import type { Lang } from '@/lib/types';

/* «Sayt boshqaruvi» bo'limlari uchun umumiy yordamchilar: administrator so'rovlari, sanalar, ogohlantirishlar. */

export function useL() {
  const { lang } = useApp();
  return useCallback((uz: string, en: string, ru: string) => tr(lang, uz, en, ru), [lang]);
}

/** GET /api/platform?view=<view> va POST {action, input} — javobda doim yangi holat qaytadi. */
export function useAdminView<T>(view: string, action: string) {
  const { request, toast } = useApp();
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('');
  const alive = useRef(true);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=' + view),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      if (alive.current) {
        setData(v);
        setError('');
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    }
  }, [request, view]);
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);
  /** Amal: muvaffaqiyatli bo'lsa yangi holat o'rnatiladi va (berilgan bo'lsa) xabar chiqadi. */
  const act = useCallback(
    async (input: unknown, key: string, done?: string, quiet = false) => {
      setBusy(key);
      try {
        const r = await request('/api/platform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, input }),
          }),
          v = await r.json();
        if (!r.ok) throw new Error(v.error || 'Xatolik');
        if (alive.current) setData(v);
        if (done) toast(done);
        return v as T;
      } catch (e) {
        if (!quiet) toast((e as Error).message);
        throw e;
      } finally {
        if (alive.current) setBusy('');
      }
    },
    [request, action, toast],
  );
  return { data, setData, error, busy, load, act };
}

const WEEK: Record<Lang, string[]> = {
  uz: ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
};
/** "2026-11-07" → «bugun» / «ertaga» / «07.11 (shanba)» (Toshkent vaqti bo'yicha). */
export function dayLabel(d: string, lang: Lang, now = Date.now()) {
  if (d === khDay(now)) return tr(lang, 'bugun', 'today', 'сегодня');
  if (d === khDay(now + 86400000)) return tr(lang, 'ertaga', 'tomorrow', 'завтра');
  if (d === khDay(now - 86400000)) return tr(lang, 'kecha', 'yesterday', 'вчера');
  const wd = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))).getUTCDay();
  return d.slice(8, 10) + '.' + d.slice(5, 7) + ' (' + WEEK[lang][wd] + ')';
}

export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
