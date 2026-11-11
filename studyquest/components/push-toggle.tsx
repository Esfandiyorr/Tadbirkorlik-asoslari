'use client';
import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, X } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';

/* 🔔 Bildirishnomalarni yoqish (lib/server/push.ts). Ilova o'rnatilgan bo'lsa ham, sayt oddiy brauzerda ochilgan
   bo'lsa ham ishlaydi (Android, kompyuter). iPhone/iPad'da Apple faqat bosh ekranga qo'shilgan ilovaga ruxsat beradi —
   shuning uchun Safari'da avval «Ulashish → Bosh ekranga qo'shish» deyiladi.
   Holatlar: unsupported · ios (bosh ekranga qo'shish kerak) · denied (brauzerda bloklangan) · off · on. */

type State = 'loading' | 'unsupported' | 'ios' | 'denied' | 'off' | 'on';

const ub64 = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const supported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

async function registration() {
  const reg =
    (await navigator.serviceWorker.getRegistration('/')) ||
    (await navigator.serviceWorker.register('/sw-studyquest.js'));
  return navigator.serviceWorker.ready.then(() => reg);
}

/** Bildirishnoma holati va amallari (bir nechta joyda ishlatiladi). */
export function usePush() {
  const { request, data } = useApp();
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const signedIn = !!data?.user;
  const check = useCallback(async () => {
    if (!supported()) return setState(isIos() && !standalone() ? 'ios' : 'unsupported');
    if (Notification.permission === 'denied') return setState('denied');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
    } catch {
      setState('off');
    }
  }, []);
  useEffect(() => {
    void check();
  }, [check]);
  const post = useCallback(
    async (body: unknown) => {
      const r = await request('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const v = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      return v;
    },
    [request],
  );
  /** Yoqish: ruxsat so'raladi, brauzer obunasi serverga yoziladi. */
  const enable = useCallback(async () => {
    setBusy(true);
    try {
      if (!supported()) throw new Error('unsupported');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'denied' : 'off');
        return false;
      }
      const { pub } = await (await fetch('/api/push?view=key')).json();
      const reg = await registration();
      let sub = await reg.pushManager.getSubscription();
      const key = sub?.options?.applicationServerKey;
      // kalit almashgan (masalan, eski obuna) — qayta obuna
      if (
        sub &&
        key &&
        btoa(String.fromCharCode(...new Uint8Array(key))) !==
          btoa(String.fromCharCode(...ub64(pub)))
      ) {
        await sub.unsubscribe();
        sub = null;
      }
      sub ||= await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: ub64(pub),
      });
      await post({ op: 'subscribe', sub: sub.toJSON(), app: standalone() });
      setState('on');
      return true;
    } finally {
      setBusy(false);
    }
  }, [post]);
  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await post({ op: 'unsubscribe', endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }, [post]);
  const test = useCallback(() => post({ op: 'test' }), [post]);
  // obuna bor, lekin server unutgan bo'lsa (yoki boshqa hisobga kirilgan bo'lsa) — kuniga bir marta qayta yoziladi
  useEffect(() => {
    if (state !== 'on' || !signedIn) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem('sq-push-sync') || 0);
    } catch {}
    if (Date.now() - last < 86400000) return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      await post({ op: 'subscribe', sub: sub.toJSON(), app: standalone() });
      try {
        localStorage.setItem('sq-push-sync', String(Date.now()));
      } catch {}
    })().catch(() => {});
  }, [state, signedIn, post]);
  return { state, busy, enable, disable, test, signedIn };
}

/** «🔔 Bildirishnomalar» bloki — yuqori paneldagi qo'ng'iroqcha menyusida va profil sahifasida. */
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const { lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { state, busy, enable, disable, test, signedIn } = usePush();
  if (!signedIn || state === 'loading') return null;
  const on = async () => {
    try {
      if (await enable())
        toast(
          '🔔 ' + L('Bildirishnomalar yoqildi', 'Notifications are on', 'Уведомления включены'),
        );
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className={'push-box is-' + state + (compact ? ' is-compact' : '')}>
      <div className="push-box-head">
        {state === 'on' ? (
          <BellRing size={18} />
        ) : state === 'off' ? (
          <Bell size={18} />
        ) : (
          <BellOff size={18} />
        )}
        <b>
          {state === 'on'
            ? L('Bildirishnomalar yoqilgan', 'Notifications are on', 'Уведомления включены')
            : L('Telefonga bildirishnoma', 'Phone notifications', 'Уведомления на телефон')}
        </b>
      </div>
      <p>
        {state === 'on'
          ? L(
              'Jonli test oldidan, mavzu ochilganda va yangi e’lonlarda shu qurilmaga xabar keladi.',
              'This device is notified before a live quiz, when a topic opens and about new announcements.',
              'Это устройство получит сообщение перед живым тестом, при открытии темы и о новых объявлениях.',
            )
          : state === 'ios'
            ? L(
                'iPhone’da: Safari’da «Ulashish» → «Bosh ekranga qo‘shish», so‘ng ilovani bosh ekrandan ochib, shu yerda yoqing.',
                'On iPhone: in Safari tap “Share” → “Add to Home Screen”, then open the app from the home screen and turn it on here.',
                'На iPhone: в Safari «Поделиться» → «На экран „Домой“», затем откройте приложение с экрана и включите здесь.',
              )
            : state === 'denied'
              ? L(
                  'Brauzer bu saytga bildirishnomani bloklagan. Manzil satridagi 🔒 belgisi → «Bildirishnomalar» → «Ruxsat berish».',
                  'The browser blocked notifications for this site. Tap 🔒 in the address bar → “Notifications” → “Allow”.',
                  'Браузер запретил уведомления. Нажмите 🔒 в адресной строке → «Уведомления» → «Разрешить».',
                )
              : state === 'unsupported'
                ? L(
                    'Bu brauzer bildirishnomani qo‘llab-quvvatlamaydi. Chrome yoki ilovani o‘rnatib ko‘ring.',
                    'This browser does not support notifications. Try Chrome or install the app.',
                    'Этот браузер не поддерживает уведомления. Попробуйте Chrome или установите приложение.',
                  )
                : L(
                    'Jonli test boshlanishi va yangi e’lonlar haqida darhol xabar oling — ilova yopiq bo‘lsa ham.',
                    'Get told right away when a live quiz starts and about new announcements — even when the app is closed.',
                    'Узнавайте сразу о начале живого теста и новых объявлениях — даже когда приложение закрыто.',
                  )}
      </p>
      <div className="push-box-actions">
        {state === 'off' && (
          <Button size="sm" onClick={on} disabled={busy}>
            <Bell size={15} /> {L('Yoqish', 'Turn on', 'Включить')}
          </Button>
        )}
        {state === 'on' && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                test()
                  .then(() =>
                    toast(
                      '📲 ' +
                        L(
                          'Sinov xabari yuborildi',
                          'A test notification was sent',
                          'Тестовое уведомление отправлено',
                        ),
                    ),
                  )
                  .catch((e) => toast((e as Error).message))
              }
            >
              🧪 {L('Sinab ko‘rish', 'Test', 'Проверить')}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void disable()}>
              {L('O‘chirish', 'Turn off', 'Выключить')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Bosh sahifada bir martalik taklif: bildirishnoma hali yoqilmagan talabaga (yopilsa — 14 kun chiqmaydi). */
export function PushInvite() {
  const { lang, toast, data } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const { state, busy, enable, signedIn } = usePush();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(Date.now() < Number(localStorage.getItem('sq-push-later') || 0));
    } catch {
      setHidden(false);
    }
  }, []);
  const student = data?.user?.role === 'student' && data.user.learnerType !== 'independent';
  if (!signedIn || !student || hidden || (state !== 'off' && state !== 'ios')) return null;
  const later = () => {
    try {
      localStorage.setItem('sq-push-later', String(Date.now() + 14 * 86400000));
    } catch {}
    setHidden(true);
  };
  return (
    <section
      className="push-invite panel"
      role="region"
      aria-label={L('Bildirishnomalar', 'Notifications', 'Уведомления')}
    >
      <span className="push-invite-ic" aria-hidden="true">
        🔔
      </span>
      <div>
        <b>
          {L(
            'Jonli testni o‘tkazib yubormang',
            'Don’t miss the live quiz',
            'Не пропустите живой тест',
          )}
        </b>
        <p>
          {state === 'ios'
            ? L(
                'iPhone’da bildirishnoma olish uchun: Safari → «Ulashish» → «Bosh ekranga qo‘shish», keyin ilovani bosh ekrandan oching.',
                'To get notifications on iPhone: Safari → “Share” → “Add to Home Screen”, then open the app from the home screen.',
                'Чтобы получать уведомления на iPhone: Safari → «Поделиться» → «На экран „Домой“», затем откройте приложение.',
              )
            : L(
                'Boshlanishidan 15 daqiqa oldin telefoningizga xabar keladi — sayt yopiq bo‘lsa ham.',
                'Your phone is notified 15 minutes before it starts — even when the site is closed.',
                'За 15 минут до начала придёт уведомление — даже если сайт закрыт.',
              )}
        </p>
      </div>
      <div className="push-invite-actions">
        {state === 'off' && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              enable()
                .then((ok) => ok && toast('🔔 ' + L('Yoqildi', 'Turned on', 'Включено')))
                .catch((e) => toast((e as Error).message))
            }
          >
            <Bell size={15} /> {L('Yoqish', 'Turn on', 'Включить')}
          </Button>
        )}
        <button
          type="button"
          className="push-invite-x"
          onClick={later}
          aria-label={L('Keyinroq', 'Later', 'Позже')}
          title={L('Keyinroq', 'Later', 'Позже')}
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
