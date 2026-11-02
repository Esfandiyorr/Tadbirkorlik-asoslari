'use client';
import { useEffect, useState } from 'react';
import { Trophy, Medal, ArrowUpRight } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { t } from '@/lib/i18n';
type Entry = { id: string; name: string; xp?: number; academicPoints?: number; classId: string };
export function Leaderboard() {
  const { data, lang, request } = useApp(),
    [period, setPeriod] = useState('all'),
    [subject, setSubject] = useState(''),
    [rows, setRows] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [kind, setKind] = useState(
      data?.user?.role === 'student' && data.user.learnerType === 'independent' ? 'xp' : 'academic',
    ),
    [group, setGroup] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    request(
      kind === 'academic'
        ? '/api/platform?view=academic'
        : '/api/platform?view=leaderboard&period=' + period + '&course=' + subject,
    )
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
  }, [request, period, subject, kind]);
  const visible = rows.filter((r) => kind !== 'academic' || !group || r.classId === group),
    podium = [visible[1], visible[0], visible[2]],
    score = (r: Entry) => (kind === 'academic' ? r.academicPoints || 0 : r.xp || 0),
    unit =
      kind === 'academic' ? (lang === 'uz' ? 'ball' : lang === 'en' ? 'points' : 'баллов') : 'XP';
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
      </div>
      <div className="filter-row">
        {!(data?.user?.role === 'student' && data.user.learnerType === 'independent') && (
          <Button
            variant={kind === 'academic' ? 'default' : 'outline'}
            onClick={() => setKind('academic')}
          >
            {lang === 'uz'
              ? 'Akademik ballar'
              : lang === 'en'
                ? 'Academic points'
                : 'Академические баллы'}
          </Button>
        )}
        <Button variant={kind === 'xp' ? 'default' : 'outline'} onClick={() => setKind('xp')}>
          XP
        </Button>
        {kind === 'academic' && (
          <select
            className="input"
            aria-label="Class"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">{lang === 'uz' ? 'Barcha guruhlar' : 'All classes'}</option>
            {Array.from(new Set(rows.map((r) => r.classId)))
              .sort()
              .map((g) => (
                <option key={g}>{g}</option>
              ))}
          </select>
        )}
      </div>
      {kind === 'xp' && (
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
      )}
      {error ? (
        <div className="error-state">{error}</div>
      ) : loading ? (
        <div className="skeleton h-64" />
      ) : !visible.length ? (
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
                    <small>
                      {score(r)} {unit}
                    </small>
                    <div>
                      <span>{[2, 1, 3][i]}</span>
                      <Medal size={25} />
                    </div>
                  </div>
                ),
            )}
          </div>
          <div className="ranking-list">
            {visible.map((r, i) => (
              <div className={r.id === data?.user?.id ? 'me' : ''} key={r.id}>
                <span>{i + 1}</span>
                <div className="rank-avatar">{r.name[0]}</div>
                <div>
                  <b>{r.name}</b>
                  <small>{r.classId}</small>
                </div>
                <strong>
                  {score(r).toLocaleString()} <small>{unit}</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
