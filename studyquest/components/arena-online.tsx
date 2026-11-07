'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Swords, X } from 'lucide-react';
import catalog from '@/lib/catalog.generated.json';
import { tr } from '@/lib/points';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { Avatar } from './leaderboard';

/* 👥 «Hozir arenada onlayn» — eski arena (arena.html: onBeat, socialHome, inviteSend, invModal) bilan bir xil yozuvlar,
   shuning uchun yangi sahifadagi va eski arenadagi talabalar bir-birini ko'radi va taklif qila oladi:
   arena/on/<id>               = {n,s,g,st,at} — har 15 soniyada yangilanadi (at — server vaqti), 45 soniyadan eskisi oflayn;
   arena/inv/<kimga>/<kimdan>  = {g,code,n,s,gr,at} — juftlik o'yiniga taklif, 60 soniya amal qiladi;
   arena/rooms/<KOD>           = 2 kishilik yopiq xona (meta.duel): qabul qilinsa, o'yin ikkalasida darhol boshlanadi. */

export type ArenaMe = { id: string; name: string; surname: string; group: string };
type Peer = { id: string; n?: string; s?: string; g?: string; st?: string; at?: number };
type Invite = {
  from: string;
  g: string;
  code: string;
  /** 'biz' — «Biznes» o'yini (arena/binv), aks holda eski arena juftlik o'yini */
  kind?: 'biz';
  n?: string;
  s?: string;
  gr?: string;
  at?: number;
};
type Tri = readonly [string, string, string];

/** Ikki kishilik o'yinlar (arena.html DUELG). */
export const DUEL_GAMES: readonly { id: string; ic: string; nm: Tri }[] = [
  { id: 'dama', ic: '🔴', nm: ['Shashka', 'Draughts', 'Шашки'] },
  { id: 'chess', ic: '♟', nm: ['Shaxmat', 'Chess', 'Шахматы'] },
  { id: 'c4', ic: '🟡', nm: ['To‘rttalik', 'Connect Four', 'Четыре в ряд'] },
  { id: 'pzl', ic: '🧩', nm: ['Puzzle duel', 'Puzzle duel', 'Пазл-дуэль'] },
];
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Xona kodi: 4 belgi, arena.html newCode bilan bir xil alifbo. */
export const ROOM_CODE = /^[A-HJ-NP-Z2-9]{4}$/;
export const newCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ABC[b % ABC.length]).join('');
const ONLINE_MS = 45000,
  INVITE_MS = 65000;

/** O'qituvchi/administrator arenada o'z nomi bilan o'ynashi uchun alohida o'yinchi hisobi (arena.html loadMe, sqStaff=1). */
export function staffIdentity(user: { id: string; name: string }): ArenaMe {
  const [name, ...rest] = (user.name || 'O‘qituvchi').trim().split(/\s+/);
  return {
    id: 'tc_' + user.id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60),
    name,
    surname: rest.join(' '),
    group: "O'QITUVCHI",
  };
}
export function staffPlayer(user: { id: string; name: string }) {
  const { id, name, surname } = staffIdentity(user);
  try {
    localStorage.setItem('terdu_staff_player', JSON.stringify({ id, name, surname }));
  } catch {}
}

const DB_URL = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)$/;
/** Arena bazasi: eski arena topgan manzil (terdu_base) yoki loyiha sozlamasidagi manzil. Demo rejimida jonli bazaga yozilmaydi. */
export function arenaBase(demo: boolean) {
  if (typeof window === 'undefined') return '';
  if (demo) return (window as { __sqArenaBase?: string }).__sqArenaBase || '';
  try {
    const saved = localStorage.getItem('terdu_base');
    if (saved && DB_URL.test(saved)) return saved;
  } catch {}
  return String(catalog.databaseURL || '').replace(/\/+$/, '');
}
export const seg = (...parts: string[]) => parts.map(encodeURIComponent).join('/');
export async function rt<T = unknown>(base: string, method: string, path: string, body?: unknown) {
  const r = await fetch(base + '/arena/' + path + '.json', {
    method,
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!r.ok) throw new Error('arena ' + r.status);
  const text = await r.text();
  return (text ? JSON.parse(text) : null) as T | null;
}
const fullName = (n?: string, s?: string) => [n, s].filter(Boolean).join(' ').trim() || '—';

// «Oflayn» yozuvi biroz kechiktiriladi: panel darhol qayta ochilsa (sahifalar orasida o'tish, React qayta
// ulanishi) o'chirish bekor qilinadi — aks holda kech yetgan DELETE yangi «onlayn» yozuvini o'chirib yuborardi.
let pendingBye: ReturnType<typeof setTimeout> | null = null;
export function ArenaOnline({ me }: { me: ArenaMe }) {
  const { lang, data, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const T3 = (x: Tri) => (lang === 'en' ? x[1] : lang === 'ru' ? x[2] : x[0]);
  const base = useMemo(() => arenaBase(data?.mode === 'demo'), [data?.mode]);
  const [peers, setPeers] = useState<Peer[] | null>(null),
    [failed, setFailed] = useState(false),
    [picking, setPicking] = useState(''),
    [sending, setSending] = useState(''),
    [invite, setInvite] = useState<Invite | null>(null);
  const skew = useRef(0),
    shown = useRef(new Set<string>()),
    queue = useRef<Invite[]>([]),
    showing = useRef<Invite | null>(null);
  // Bir vaqtda bitta taklif oynasi; qolganlari navbatda kutadi.
  const show = (x: Invite | null) => {
    showing.current = x;
    setInvite(x);
  };
  const serverNow = () => Date.now() + skew.current;

  // 1) men onlaynman: har 15 soniyada (sahifa ko'rinib turganda), chiqib ketganda — o'chiriladi
  useEffect(() => {
    if (!base) return;
    let live = true;
    const beat = async () => {
      if (document.hidden) return;
      const t0 = Date.now();
      try {
        const v = await rt<{ at?: number }>(base, 'PUT', seg('on', me.id), {
          n: me.name,
          s: me.surname,
          g: me.group,
          st: 'idle',
          at: { '.sv': 'timestamp' },
        });
        if (live && typeof v?.at === 'number')
          skew.current = v.at - Math.round((t0 + Date.now()) / 2);
      } catch {}
    };
    const bye = () => {
      try {
        void fetch(base + '/arena/' + seg('on', me.id) + '.json', {
          method: 'DELETE',
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };
    const visible = () => {
      if (!document.hidden) void beat();
    };
    if (pendingBye) {
      clearTimeout(pendingBye);
      pendingBye = null;
    }
    void beat();
    const timer = setInterval(beat, 15000);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pagehide', bye);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('pagehide', bye);
      pendingBye = setTimeout(() => {
        pendingBye = null;
        bye();
      }, 400);
    };
  }, [base, me.id, me.name, me.surname, me.group]);

  // 2) kim onlayn (har 5 soniyada) va 3) menga kelgan takliflar (har 3 soniyada)
  useEffect(() => {
    if (!base) return;
    let live = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loop = (ms: number, run: () => Promise<void>) => {
      const tick = async () => {
        if (!document.hidden) await run().catch(() => {});
        if (live) timers.push(setTimeout(tick, ms));
      };
      void tick();
    };
    loop(5000, async () => {
      try {
        const v = await rt<Record<string, Peer>>(base, 'GET', 'on');
        if (!live) return;
        const now = serverNow();
        setPeers(
          Object.entries(v || {})
            .map(([id, x]) => ({ ...x, id }))
            .filter((x) => x.id !== me.id && typeof x.at === 'number' && now - x.at < ONLINE_MS),
        );
        setFailed(false);
      } catch (e) {
        if (live) setFailed(true);
        throw e;
      }
    });
    loop(3000, async () => {
      // eski arena takliflari (inv) va «Biznes» takliflari (binv — eski arena ularni ko'rmaydi)
      const [v, w] = await Promise.all([
        rt<Record<string, Omit<Invite, 'from'>>>(base, 'GET', seg('inv', me.id)),
        rt<Record<string, Omit<Invite, 'from'>>>(base, 'GET', seg('binv', me.id)).catch(() => null),
      ]);
      if (!live) return;
      const now = serverNow();
      for (const [sec, list] of [
        ['inv', v],
        ['binv', w],
      ] as const)
        for (const [from, x] of Object.entries(list || {})) {
          if (!x?.code || !ROOM_CODE.test(x.code)) continue;
          if (typeof x.at === 'number' && now - x.at > INVITE_MS) {
            void rt(base, 'DELETE', seg(sec, me.id, from)).catch(() => {});
            continue;
          }
          if (shown.current.has(x.code)) continue;
          shown.current.add(x.code);
          queue.current.push({ ...x, from, ...(sec === 'binv' ? { kind: 'biz' as const } : {}) });
        }
      if (!showing.current && queue.current.length) show(queue.current.shift()!);
    });
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, me.id]);

  /** «Biznes»: xona arena/biz da ochiladi, taklif — arena/binv da (eski arena bu taklifni ko'rmaydi). */
  async function sendBiz(peer: Peer) {
    setPicking('');
    setSending(peer.id);
    try {
      const { createBizRoom } = await import('./biznes');
      const code = await createBizRoom(base, me, 'kofe', {
        id: peer.id,
        name: fullName(peer.n, peer.s),
      });
      await rt(base, 'PUT', seg('binv', peer.id, me.id), {
        g: 'biz',
        code,
        n: me.name,
        s: me.surname,
        gr: me.group,
        at: { '.sv': 'timestamp' },
      });
      toast('📨 ' + L('Taklif yuborildi', 'Invite sent', 'Приглашение отправлено'));
      navigate('arena/biznes/' + code);
    } catch {
      toast(
        L(
          'Taklif yuborilmadi — internetni tekshiring',
          'The invite was not sent — check the connection',
          'Приглашение не отправлено — проверьте интернет',
        ),
      );
    } finally {
      setSending('');
    }
  }
  async function send(peer: Peer, gameId: string) {
    if (gameId === 'biz') return sendBiz(peer);
    const game = DUEL_GAMES.find((g) => g.id === gameId)!;
    setPicking('');
    setSending(peer.id);
    const code = newCode(),
      now = Date.now(),
      toName = fullName(peer.n, peer.s);
    try {
      await rt(base, 'PUT', seg('rooms', code), {
        meta: {
          name: (lang === 'en' ? game.nm[1] : game.nm[0]) + ' · duel',
          host: me.id,
          hostName: (me.name + ' ' + me.surname).trim(),
          games: [game.id],
          limit: 0,
          pub: false,
          max: 2,
          duel: { to: peer.id, toName },
          at: now,
          status: 'lobby',
        },
        players: {
          [me.id]: {
            id: me.id,
            name: me.name,
            surname: me.surname,
            group: me.group,
            ready: 1,
            seen: now,
          },
        },
        state: { ph: 'lobby', r: 0 },
      });
      await rt(base, 'PUT', seg('inv', peer.id, me.id), {
        g: game.id,
        code,
        n: me.name,
        s: me.surname,
        gr: me.group,
        at: { '.sv': 'timestamp' },
      });
      toast('📨 ' + L('Taklif yuborildi', 'Invite sent', 'Приглашение отправлено'));
      navigate('arena/room/' + code);
    } catch {
      toast(
        L(
          'Taklif yuborilmadi — internetni tekshiring',
          'The invite was not sent — check the connection',
          'Приглашение не отправлено — проверьте интернет',
        ),
      );
    } finally {
      setSending('');
    }
  }
  const nextInvite = () => show(queue.current.shift() || null);
  async function answer(x: Invite, yes: boolean) {
    nextInvite();
    const biz = x.kind === 'biz';
    await rt(base, 'DELETE', seg(biz ? 'binv' : 'inv', me.id, x.from)).catch(() => {});
    if (yes) navigate((biz ? 'arena/biznes/' : 'arena/room/') + x.code);
    else
      await rt(
        base,
        'PUT',
        seg(biz ? 'biz' : 'rooms', x.code, 'meta', 'dec'),
        (me.name + ' ' + me.surname).trim(),
      ).catch(() => {});
  }

  if (!base) return null;
  const list = (peers || [])
    .slice()
    .sort(
      (a, b) =>
        Number(a.st === 'busy') - Number(b.st === 'busy') ||
        Number(b.g === me.group) - Number(a.g === me.group) ||
        fullName(a.n, a.s).localeCompare(fullName(b.n, b.s)),
    )
    .slice(0, 60);
  return (
    <section className="panel arena-online" aria-labelledby="arena-online-h">
      <div className="arena-online-head">
        <h2 id="arena-online-h">
          <span className="live-dot" aria-hidden="true" />
          {L('Hozir arenada onlayn', 'Online in the arena now', 'Сейчас на арене')}
          <span className="arena-online-count" aria-label={L('soni', 'count', 'количество')}>
            {peers ? list.length : '…'}
          </span>
        </h2>
        <p>
          {L(
            '«Taklif» ni bosing va o‘yinni tanlang — do‘stingiz qabul qilsa, o‘yin ikkalangizda darhol boshlanadi.',
            'Press “Invite” and pick a game — once your friend accepts, the game starts for both of you at once.',
            'Нажмите «Пригласить» и выберите игру — как только друг примет, игра сразу начнётся у обоих.',
          )}
        </p>
      </div>
      {!peers ? (
        failed ? (
          <p className="arena-online-empty">
            {L(
              'Onlayn ro‘yxatni yuklab bo‘lmadi. Internetni tekshiring — sahifa o‘zi qayta urinadi.',
              'Could not load who is online. Check the connection — the page keeps retrying.',
              'Не удалось загрузить список онлайн. Проверьте интернет — страница повторит попытку.',
            )}
          </p>
        ) : (
          <div className="skeleton h-16" />
        )
      ) : !list.length ? (
        <p className="arena-online-empty">
          {L(
            'Hozircha boshqa hech kim arenada emas. Guruhdoshingizga «O‘yin maydoni» ni ochishni ayting!',
            'Nobody else is in the arena right now. Ask a classmate to open the Arena!',
            'Сейчас на арене больше никого нет. Попросите одногруппника открыть «Арену»!',
          )}
        </p>
      ) : (
        <ul className="arena-online-list">
          {list.map((p) => {
            const busy = p.st === 'busy',
              name = fullName(p.n, p.s),
              teacher = p.id.startsWith('tc_');
            return (
              <li key={p.id} className={busy ? 'busy' : ''}>
                <Avatar e={{ id: p.id, name }} size={42} />
                <div className="arena-online-who">
                  <b>{name}</b>
                  <small>
                    {teacher ? '👩‍🏫 ' + L('O‘qituvchi', 'Teacher', 'Преподаватель') : p.g || ''}
                    {' · '}
                    {busy
                      ? '🎮 ' + L('o‘yinda', 'playing', 'в игре')
                      : '🟢 ' + L('bo‘sh', 'free', 'свободен')}
                  </small>
                </div>
                <Button
                  size="sm"
                  variant={picking === p.id ? 'default' : 'outline'}
                  disabled={busy || !!sending}
                  aria-expanded={picking === p.id}
                  onClick={() => setPicking(picking === p.id ? '' : p.id)}
                >
                  <Swords size={15} />
                  {sending === p.id ? '…' : L('Taklif', 'Invite', 'Пригласить')}
                </Button>
                {picking === p.id && (
                  <div
                    className="arena-pick"
                    role="group"
                    aria-label={L('O‘yinni tanlang', 'Pick a game', 'Выберите игру')}
                  >
                    {[
                      { id: 'biz', ic: '💼', nm: ['Biznes', 'Business', 'Бизнес'] as Tri },
                      ...DUEL_GAMES,
                    ].map((g) => (
                      <button key={g.id} type="button" onClick={() => void send(p, g.id)}>
                        <span aria-hidden="true">{g.ic}</span>
                        {T3(g.nm)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="arena-pick-x"
                      aria-label={L('Yopish', 'Close', 'Закрыть')}
                      onClick={() => setPicking('')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {invite && (
        <InviteDialog
          key={invite.code}
          x={invite}
          gameName={(id) => {
            if (id === 'biz') return '💼 ' + L('Biznes', 'Business', 'Бизнес');
            const g = DUEL_GAMES.find((d) => d.id === id);
            return g ? g.ic + ' ' + T3(g.nm) : '🎮 ' + L('O‘yin', 'Game', 'Игра');
          }}
          onAnswer={(yes) => void answer(invite, yes)}
          onTimeout={nextInvite}
        />
      )}
    </section>
  );
}

function InviteDialog({
  x,
  gameName,
  onAnswer,
  onTimeout,
}: {
  x: Invite;
  gameName: (id: string) => string;
  onAnswer: (yes: boolean) => void;
  onTimeout: () => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [left, setLeft] = useState(60);
  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => {
      const s = Math.max(0, 60 - Math.round((Date.now() - t0) / 1000));
      setLeft(s);
      if (!s) {
        clearInterval(timer);
        onTimeout();
      }
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const name = fullName(x.n, x.s);
  return (
    <div className="arena-invite-backdrop">
      <div
        className="arena-invite"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="arena-invite-h"
        aria-describedby="arena-invite-d"
      >
        <Avatar e={{ id: x.from, name }} size={64} />
        <h3 id="arena-invite-h">{name}</h3>
        {x.gr && <small>{x.gr}</small>}
        <p id="arena-invite-d">
          {L('sizni o‘ynashga taklif qilmoqda:', 'invites you to play:', 'приглашает вас сыграть:')}{' '}
          <b>{gameName(x.g)}</b>
        </p>
        <div className="arena-invite-actions">
          <Button autoFocus onClick={() => onAnswer(true)}>
            ✅ {L('Qabul qilish', 'Accept', 'Принять')}
          </Button>
          <Button variant="outline" onClick={() => onAnswer(false)}>
            ✖ {L('Rad etish', 'Decline', 'Отклонить')}
          </Button>
        </div>
        <small className="arena-invite-timer" aria-live="off">
          ⏳ {left} {L('soniya', 's', 'сек.')}
        </small>
      </div>
    </div>
  );
}
