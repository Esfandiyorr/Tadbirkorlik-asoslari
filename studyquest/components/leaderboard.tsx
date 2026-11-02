'use client';
import { useEffect, useState } from 'react';
import { Trophy, Medal, ArrowUpRight } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { t } from '@/lib/i18n';
type Entry = { id: string; name: string; xp: number; classId: string };
export function Leaderboard() {
  const { data, lang, request } = useApp(),
    [period, setPeriod] = useState('all'),
    [subject, setSubject] = useState(''),
    [rows, setRows] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    request('/api/platform?view=leaderboard&period=' + period + '&course=' + subject)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (live) {
          setRows(d.leaderboard || []);
          setError('');
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [request, period, subject]);
  const podium = [rows[1], rows[0], rows[2]];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GROW TOGETHER</span>
          <h1>{t(lang, 'ranking')}</h1>
          <p>
            {data?.user?.classId ||
              (lang === 'uz'
                ? 'Universitet talabalari'
                : lang === 'ru'
                  ? 'Студенты университета'
                  : 'University students')}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/legacy/tadbirkorlik-asoslari.html">
            {lang === 'uz'
              ? 'Akademik reyting'
              : lang === 'ru'
                ? 'Академический рейтинг'
                : 'Academic ranking'}
            <ArrowUpRight size={15} />
          </a>
        </Button>
      </div>
      <div className="leaderboard-filters">
        <div className="filter-row">
          {['all', 'week', 'month'].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {t(lang, p as 'all' | 'week' | 'month')}
            </Button>
          ))}
        </div>
        <select
          aria-label="Subject"
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">{t(lang, 'courses')}</option>
          {data?.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <div className="error-state">{error}</div>
      ) : loading ? (
        <div className="skeleton h-64" />
      ) : !rows.some((x) => x.xp > 0) ? (
        <div className="empty-state">
          <Trophy size={42} />
          <h3>
            {lang === 'uz'
              ? 'Birinchi natija sizniki bo‘lishi mumkin.'
              : lang === 'en'
                ? 'The first achievement could be yours.'
                : 'Первое достижение может стать вашим.'}
          </h3>
          <p>{t(lang, 'empty')}</p>
        </div>
      ) : (
        <div className="leaderboard-panel panel">
          <div className="podium">
            {podium.map(
              (r, i) =>
                r && (
                  <div key={r.id} className={'podium-place place-' + [2, 1, 3][i]}>
                    <span className="podium-avatar">
                      {r.name
                        .split(' ')
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <h3>{r.name}</h3>
                    <small>{r.xp} XP</small>
                    <div>
                      <span>{[2, 1, 3][i]}</span>
                      <Medal size={25} />
                    </div>
                  </div>
                ),
            )}
          </div>
          <div className="ranking-list">
            {rows.map((r, i) => (
              <div className={r.id === data?.user?.id ? 'me' : ''} key={r.id}>
                <span>{i + 1}</span>
                <div className="rank-avatar">{r.name[0]}</div>
                <div>
                  <b>{r.name}</b>
                  <small>{r.classId}</small>
                </div>
                <strong>
                  {r.xp.toLocaleString()} <small>XP</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
