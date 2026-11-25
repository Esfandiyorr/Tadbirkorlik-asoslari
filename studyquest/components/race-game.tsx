'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from './provider';
import type { RaceView, Team } from '@/lib/server/race';

/* 🏁 Jamoaviy poyga sahifasi (/poyga). Tepada ikki mashina: har biri o'z jamoasi faol a'zolarining o'rtacha
   bali bilan marraga qarab yuradi. Talaba ismini yozib jamoani tanlaydi, o'qituvchi «Boshlash»ni bosgach
   savollar chiqadi: to'g'ri va tez javob — ko'proq ball. O'qituvchi/administrator boshqaruv tugmalarini ko'radi.
   O'yinchi kaliti (pid) brauzerda saqlanadi: sahifa yangilansa ham o'yin davom etadi. */

type Saved = { gid?: string; pid?: string; name?: string; team?: Team };
type Feedback = {
  qi: number;
  choice: number;
  ok: boolean;
  points: number;
  ms: number;
  right: number;
  explain: string;
};
type Shown = NonNullable<NonNullable<RaceView['me']>['question']>;

const KEY = 'sq-race';
const read = (): Saved => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
};
const write = (s: Saved) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function Car({ color, moving }: { color: string; moving: boolean }) {
  return (
    <svg className={'race-car' + (moving ? ' is-moving' : '')} viewBox="0 0 96 44" aria-hidden>
      <ellipse cx="48" cy="40" rx="40" ry="3.5" fill="rgba(0,0,0,.25)" />
      <path
        d="M6 30c0-5 3-8 8-9l12-2 10-9c3-2.5 6-3.5 10-3.5h16c4 0 7 1.4 9.5 4l7 8.5 9 1.6c3.4.6 5.5 3.4 5.5 6.8V31c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3z"
        fill={color}
      />
      <path d="M30 19.5 39 12c2-1.6 4-2.3 6.6-2.3H52v9.8z" fill="#dbeafe" />
      <path d="M56 9.7h7.5c2.6 0 4.6 1 6.3 2.9l5.6 6.9H56z" fill="#dbeafe" />
      <rect x="8" y="24" width="7" height="3" rx="1.5" fill="#fde68a" />
      <rect x="84" y="24" width="6" height="3" rx="1.5" fill="#fca5a5" />
      <path d="M40 23h10" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round" />
      {[24, 72].map((x) => (
        <g key={x} className="race-wheel" style={{ transformOrigin: `${x}px 33px` }}>
          <circle cx={x} cy="33" r="7.5" fill="#1f2937" />
          <circle cx={x} cy="33" r="3.4" fill="#d1d5db" />
          <path d={`M${x - 3.4} 33h6.8M${x} 29.6v6.8`} stroke="#6b7280" strokeWidth="1.4" />
        </g>
      ))}
    </svg>
  );
}

function Track({ view, myTeam }: { view: RaceView; myTeam?: Team }) {
  const teams = view.teams;
  const running = view.status === 'run';
  return (
    <section className="race-track" aria-label="Poyga yo‘li">
      {(['a', 'b'] as Team[]).map((t) => {
        const s = teams?.[t];
        const p = s?.progress || 0;
        const win = view.status === 'done' && view.winner === t;
        return (
          <div
            key={t}
            className={'race-lane' + (myTeam === t ? ' is-mine' : '') + (win ? ' is-winner' : '')}
            style={{ ['--team' as string]: s?.color || (t === 'a' ? '#16a34a' : '#7c3aed') }}
          >
            <div className="race-lane-label">
              <b>{s?.name || (t === 'a' ? 'Yashil jamoa' : 'Binafsha jamoa')}</b>
              <span>
                {s ? `${s.avg} / ${view.target} ball` : '—'} · {s?.members.length || 0} kishi
                {myTeam === t && <em className="race-here"> · siz shu yerdasiz</em>}
              </span>
            </div>
            <div className="race-road">
              <i className="race-start" />
              <i className="race-finish" />
              <div className="race-car-pos" style={{ left: `calc((100% - 84px) * ${p / 100})` }}>
                <Car color={s?.color || '#999'} moving={running && p < 100} />
                {win && <em className="race-cup">🏆</em>}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function RaceGame() {
  const { data, request } = useApp();
  const role = data?.user?.role;
  const host = role === 'teacher' || role === 'admin';
  const [view, setView] = useState<RaceView | null>(null);
  const [saved, setSaved] = useState<Saved>({});
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  /** javobdan keyin bir lahza eski savol (rangli) ko'rinib turadi */
  const [held, setHeld] = useState<Shown | null>(null);
  const [, tick] = useState(0);
  const offset = useRef(0);
  const savedRef = useRef<Saved>({});
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remember = useCallback((s: Saved) => {
    savedRef.current = s;
    setSaved(s);
    write(s);
  }, []);
  const accept = useCallback(
    (v: RaceView) => {
      offset.current = v.now - Date.now();
      setView(v);
      const s = savedRef.current;
      // o'qituvchi yangi o'yin ochgan bo'lsa eski o'yinchi kaliti endi yaroqsiz (ism va jamoa esda qoladi)
      if (s.pid && v.status !== 'none' && 'id' in v && v.id !== s.gid)
        remember({ name: s.name, team: s.team });
    },
    [remember],
  );
  const load = useCallback(async () => {
    const s = savedRef.current;
    try {
      const r = await fetch('/api/race' + (s.pid ? '?pid=' + s.pid : ''), { cache: 'no-store' });
      const v = await r.json();
      if (r.ok) accept(v);
    } catch {}
  }, [accept]);

  useEffect(() => {
    const s = read();
    savedRef.current = s;
    setSaved(s);
    setName(s.name || '');
  }, []);
  useEffect(() => {
    if (!name && data?.user?.name && !host) setName(data.user.name.slice(0, 30));
  }, [data?.user?.name, host, name]);

  // holatni so'rab turish: poyga ketayotganda tez-tez, kutish va natijada siyrakroq
  const status = view?.status;
  useEffect(() => {
    let stop = false,
      timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await load();
      if (stop) return;
      const hidden = typeof document !== 'undefined' && document.hidden;
      timer = setTimeout(loop, hidden ? 6000 : status === 'run' ? 1500 : 2500);
    };
    loop();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [load, status, saved.pid]);
  useEffect(() => {
    if (status !== 'run') return;
    const t = setInterval(() => tick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, [status]);
  useEffect(() => () => void (holdTimer.current && clearTimeout(holdTimer.current)), []);

  const post = async (body: object, asHost = false) => {
    const init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
    const r = asHost ? await request('/api/race', init) : await fetch('/api/race', init);
    const v = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(v.error || 'Ulanishda xatolik');
    return v;
  };

  const join = async (team: Team) => {
    const n = name.replace(/\s+/g, ' ').trim();
    if (n.length < 2) {
      setErr('Avval ismingizni yozing (kamida 2 harf).');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const s = savedRef.current;
      const v = await post({
        op: 'join',
        name: n,
        team,
        ...(s.pid && view && 'id' in view && s.gid === view.id ? { pid: s.pid } : {}),
      });
      remember({ gid: v.view.id, pid: v.pid, name: n, team });
      accept(v.view);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const answer = async (q: Shown, k: number) => {
    if (busy || feedback) return;
    setBusy(true);
    setErr('');
    try {
      const v = await post({ op: 'answer', pid: savedRef.current.pid, qi: q.qi, k });
      setHeld(q);
      setFeedback({ qi: q.qi, choice: k, ...v.result });
      accept(v.view);
      holdTimer.current = setTimeout(
        () => {
          setFeedback(null);
          setHeld(null);
        },
        v.result.ok ? 1100 : 2600,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik');
      load();
    } finally {
      setBusy(false);
    }
  };

  const hostOp = async (op: 'new' | 'start' | 'stop') => {
    if (
      op === 'new' &&
      view?.status === 'run' &&
      !confirm('Poyga ketyapti. Yangi o‘yin ochilsinmi?')
    )
      return;
    if (op === 'stop' && !confirm('Poyga hozir to‘xtatilsinmi? Oldindagi jamoa g‘olib bo‘ladi.'))
      return;
    setBusy(true);
    setErr('');
    try {
      const v = await post({ op }, true);
      accept(v.view);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now() + offset.current;
  const me = view && 'me' in view ? view.me : undefined;
  const teams = view?.teams;
  const left = view?.status === 'run' && view.ends ? view.ends - now : 0;
  const q = held || me?.question;
  const link = typeof location !== 'undefined' ? location.origin + '/poyga' : '/poyga';

  let body: React.ReactNode;
  if (!view) body = <p className="race-wait">Yuklanmoqda…</p>;
  else if (host) {
    body = (
      <div className="race-card race-host">
        <div className="race-host-head">
          <div>
            <h2>O‘qituvchi boshqaruvi</h2>
            <p>
              Talabalarga havolani bering: <b className="race-link">{link}</b>
            </p>
          </div>
          <button
            className="race-btn ghost"
            onClick={() => navigator.clipboard?.writeText(link).catch(() => {})}
          >
            Havolani nusxalash
          </button>
        </div>
        <div className="race-host-actions">
          <button className="race-btn" disabled={busy} onClick={() => hostOp('new')}>
            Yangi o‘yin
          </button>
          <button
            className="race-btn go"
            disabled={busy || view.status !== 'lobby'}
            onClick={() => hostOp('start')}
          >
            Boshlash
          </button>
          <button
            className="race-btn stop"
            disabled={busy || view.status !== 'run'}
            onClick={() => hostOp('stop')}
          >
            To‘xtatish
          </button>
        </div>
        <p className="race-note">
          {view.status === 'none'
            ? '«Yangi o‘yin»ni bosing — talabalar havola orqali kirib jamoasini tanlaydi.'
            : view.status === 'lobby'
              ? `Kutish xonasi: ${(teams?.a.members.length || 0) + (teams?.b.members.length || 0)} kishi qo‘shildi. Hamma kirgach «Boshlash»ni bosing.`
              : view.status === 'run'
                ? `Poyga ketyapti · ${view.total} ta savol · marra — o‘rtacha ${view.target} ball.`
                : 'Poyga tugadi. Yana o‘ynash uchun «Yangi o‘yin»ni bosing.'}
        </p>
        <Teams view={view} />
      </div>
    );
  } else if (view.status === 'done') {
    body = <Finish view={view} me={me} />;
  } else if (!me) {
    body = (
      <div className="race-card race-join">
        <h2>Poygaga qo‘shiling</h2>
        <p>
          Ismingizni yozing va jamoangizni tanlang. Eng tez va to‘g‘ri javob bergan jamoa yutadi!
        </p>
        <label className="race-field">
          <span>Ismingiz</span>
          <input
            value={name}
            maxLength={30}
            placeholder="Masalan: Ali Valiyev"
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <div className="race-team-pick">
          {(['a', 'b'] as Team[]).map((t) => (
            <button
              key={t}
              className="race-team-btn"
              style={{
                ['--team' as string]: teams?.[t].color || (t === 'a' ? '#16a34a' : '#7c3aed'),
              }}
              disabled={busy}
              onClick={() => join(t)}
            >
              <Car color={teams?.[t].color || (t === 'a' ? '#16a34a' : '#7c3aed')} moving={false} />
              <b>{teams?.[t].name || (t === 'a' ? 'Yashil jamoa' : 'Binafsha jamoa')}</b>
              <span>{teams?.[t].members.length || 0} kishi</span>
            </button>
          ))}
        </div>
        {view.status === 'run' && (
          <p className="race-note">Poyga boshlangan — qo‘shilsangiz darhol savollar chiqadi.</p>
        )}
      </div>
    );
  } else if (view.status === 'lobby' || view.status === 'none') {
    const other: Team = me.t === 'a' ? 'b' : 'a';
    body = (
      <div className="race-card race-lobby">
        <h2>
          Siz <span style={{ color: teams?.[me.t].color }}>{teams?.[me.t].name}</span>dasiz
        </h2>
        <p>O‘qituvchi poygani boshlashini kuting. Savollar shu yerda o‘zi chiqadi.</p>
        <ul className="race-rules">
          <li>Savollar 1–10-mavzulardan, aralash tartibda.</li>
          <li>To‘g‘ri javob — 4 dan 10 gacha ball: qancha tez bo‘lsa, shuncha ko‘p.</li>
          <li>Jamoa mashinasi a’zolarining o‘rtacha bali bilan yuradi.</li>
        </ul>
        <button className="race-btn ghost" disabled={busy} onClick={() => join(other)}>
          {teams?.[other].name}ga o‘tish
        </button>
        <Teams view={view} />
      </div>
    );
  } else if (q) {
    const fb = feedback && feedback.qi === q.qi ? feedback : null;
    body = (
      <div className={'race-card race-question' + (fb ? (fb.ok ? ' is-ok' : ' is-bad') : '')}>
        <div className="race-q-head">
          <span className="race-chip">{q.t}-mavzu</span>
          <span>
            {q.qi + 1} / {view.total}
          </span>
          <span className="race-mine">{me.p} ball</span>
        </div>
        <h2>{q.q}</h2>
        <div className="race-options">
          {q.a.map((a, k) => (
            <button
              key={k}
              className={
                'race-opt' +
                (fb && k === fb.right ? ' is-right' : '') +
                (fb && k === fb.choice && !fb.ok ? ' is-wrong' : '')
              }
              disabled={busy || !!fb}
              onClick={() => answer(q, k)}
            >
              <i>{LETTERS[k]}</i>
              <span>{a}</span>
            </button>
          ))}
        </div>
        {fb && (
          <p className="race-fb" role="status">
            {fb.ok
              ? `To‘g‘ri! +${fb.points} ball · ${(fb.ms / 1000).toFixed(1)} s`
              : `Noto‘g‘ri. ${fb.explain}`}
          </p>
        )}
      </div>
    );
  } else {
    body = (
      <div className="race-card race-lobby">
        <h2>Barakalla! Hamma savollarga javob berdingiz</h2>
        <p>
          Sizning hissangiz: <b>{me.p} ball</b> ({me.r} ta to‘g‘ri). Jamoadoshlaringizni kuting —
          natija shu yerda chiqadi.
        </p>
        <Teams view={view} />
      </div>
    );
  }

  return (
    <div className="race-page">
      <header className="race-top">
        <a href="/" className="race-brand" aria-label="Unistay bosh sahifasi">
          <img src="/unistay-logo.svg" alt="" width={28} height={28} />
          <span>Unistay</span>
        </a>
        <h1>Jamoaviy poyga</h1>
        {view?.status === 'run' ? (
          <span className={'race-timer' + (left < 30000 ? ' is-low' : '')}>⏱ {mmss(left)}</span>
        ) : (
          <span className="race-timer is-idle">
            {view?.status === 'lobby'
              ? 'Kutish xonasi'
              : view?.status === 'done'
                ? 'Tugadi'
                : '1–10-mavzular'}
          </span>
        )}
      </header>
      {view && <Track view={view} myTeam={me?.t} />}
      {err && (
        <p className="race-err" role="alert">
          {err}
        </p>
      )}
      <main className="race-main">{body}</main>
    </div>
  );
}

function Teams({ view }: { view: RaceView }) {
  const teams = view.teams;
  if (!teams) return null;
  return (
    <div className="race-teams">
      {(['a', 'b'] as Team[]).map((t) => (
        <div key={t} className="race-team-list" style={{ ['--team' as string]: teams[t].color }}>
          <h3>
            {teams[t].name} <span>{teams[t].members.length}</span>
          </h3>
          {teams[t].members.length ? (
            <ol>
              {teams[t].members.slice(0, 40).map((m, i) => (
                <li key={i} className={m.me ? 'is-me' : ''}>
                  <span>{m.n}</span>
                  {view.status !== 'lobby' && <b>{m.p}</b>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="race-note race-empty">Hali hech kim yo‘q</p>
          )}
        </div>
      ))}
    </div>
  );
}

function Finish({ view, me }: { view: RaceView; me?: RaceView['me'] }) {
  const teams = view.teams!;
  const w = view.winner;
  return (
    <div className="race-card race-finish-card">
      <div className="race-cupbig" aria-hidden>
        🏆
      </div>
      <h2>
        {w === 'tie' || !w ? (
          'Durang! Ikkala jamoa teng keldi'
        ) : (
          <>
            <span style={{ color: teams[w].color }}>{teams[w].name}</span> yutdi!
          </>
        )}
      </h2>
      {me && (
        <p>
          Sizning natijangiz: <b>{me.p} ball</b> · {me.r} ta to‘g‘ri javob
          {w && w !== 'tie'
            ? me.t === w
              ? ' — jamoangiz g‘olib!'
              : ' — keyingi safar albatta!'
            : ''}
        </p>
      )}
      <div className="race-teams">
        {(['a', 'b'] as Team[]).map((t) => (
          <div key={t} className="race-team-list" style={{ ['--team' as string]: teams[t].color }}>
            <h3>
              {teams[t].name} <span>{teams[t].avg} o‘rtacha</span>
            </h3>
            <ol>
              {teams[t].members.slice(0, 5).map((m, i) => (
                <li key={i} className={m.me ? 'is-me' : ''}>
                  <span>
                    {['🥇', '🥈', '🥉'][i] || i + 1 + '.'} {m.n}
                  </span>
                  <b>{m.p}</b>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="race-note">Yangi poygani o‘qituvchi ochadi — sahifa o‘zi yangilanadi.</p>
    </div>
  );
}
