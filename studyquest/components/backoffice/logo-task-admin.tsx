'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, RefreshCw, Save, Sparkles, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { AiResult, ScoreBadge } from '../logo-task';
import { LOGO_MAX_SCORE, LOGO_MAX_TRIES, type LogoTaskRow } from '@/lib/logo-task';

/* 🎨 Sayt boshqaruvi → Logotip topshirig'i: har talabaga berilgan biznes, yuklangan logotip va ta'rif, sun'iy
   intellekt bahosi; o'qituvchi bahoni tasdiqlaydi yoki o'zgartiradi, qo'shimcha urinish beradi, CSV yuklab oladi. */

type View = { rows: LogoTaskRow[]; open: boolean; aiReady: boolean; graded?: number };

const STATUS: Record<LogoTaskRow['status'], [string, string, string]> = {
  new: ['⚪ yubormagan', '⚪ not sent', '⚪ не отправлено'],
  pending: ['⏳ baholanmoqda', '⏳ grading', '⏳ оценивается'],
  graded: ['🤖 AI baholagan', '🤖 AI-graded', '🤖 оценено ИИ'],
  queued: ['🕓 navbatda', '🕓 queued', '🕓 в очереди'],
  failed: ['⚠️ xato', '⚠️ error', '⚠️ ошибка'],
};

export function LogoTaskAdmin() {
  const { request, toast, data: app } = useApp();
  const L = useL();
  const [data, setData] = useState<View | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [group, setGroup] = useState(''),
    [query, setQuery] = useState(''),
    [openRow, setOpenRow] = useState(''),
    [mark, setMark] = useState<Record<string, { score: string; note: string }>>({});
  const isAdmin = app?.user?.role === 'admin';
  const load = useCallback(async () => {
    try {
      const r = await request('/api/task?view=list'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setData(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(input: unknown, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await request('/api/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'admin', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setData(v);
      if (done) toast(done);
      return v as View;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const rows = useMemo(() => data?.rows || [], [data]);
  const groups = useMemo(
    () => [...new Set(rows.map((r) => r.group).filter(Boolean))].sort(),
    [rows],
  );
  const shown = rows.filter(
    (r) =>
      (!group || r.group === group) &&
      (!query.trim() ||
        (r.name + ' ' + r.brief.name + ' ' + r.brief.kind)
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const sent = rows.filter((r) => r.img).length,
    graded = rows.filter((r) => r.best !== undefined || r.final).length,
    waiting = rows.filter((r) => r.img && (r.status === 'queued' || r.status === 'failed')).length;
  const marks = rows
    .map((r) => r.final?.score ?? r.best)
    .filter((x): x is number => x !== undefined);
  const avg = marks.length ? (marks.reduce((s, n) => s + n, 0) / marks.length).toFixed(1) : '—';
  function csv() {
    const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [
      [
        'Guruh',
        'Talaba',
        'Biznes',
        'Faoliyat',
        'AI (eng yaxshi)',
        'O‘qituvchi',
        'Yakuniy',
        'Urinishlar',
      ],
      ...shown.map((r) => [
        r.group,
        r.name,
        r.brief.name,
        r.brief.kind,
        r.best ?? '',
        r.final?.score ?? '',
        r.final?.score ?? r.best ?? '',
        r.tries.length,
      ]),
    ].map((row) => row.map(esc).join(','));
    const url = URL.createObjectURL(
      new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logotip-topshirigi' + (group ? '-' + group : '') + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="logo-admin">
      {!data.aiReady && (
        <div className="bo-warn" role="note">
          <b>
            🔑{' '}
            {L(
              'Sun’iy intellekt hali ulanmagan',
              'The AI is not connected yet',
              'ИИ ещё не подключён',
            )}
          </b>
          <p>
            {L(
              'Talabalar ishlari saqlanadi va «navbatda» turadi. Ulash uchun: console.anthropic.com da API kalit oling, so‘ng Vercel → loyiha → Settings → Environment Variables ga ANTHROPIC_API_KEY nomi bilan qo‘ying va saytni qayta joylang (Redeploy). Keyin shu yerda «Navbatdagilarni baholash»ni bosing.',
              'Students’ work is saved and queued. To connect: get an API key at console.anthropic.com, add it in Vercel → project → Settings → Environment Variables as ANTHROPIC_API_KEY and redeploy. Then press “Grade the queue” here.',
              'Работы сохраняются и ждут в очереди. Получите ключ API на console.anthropic.com, добавьте его в Vercel → Settings → Environment Variables как ANTHROPIC_API_KEY и сделайте Redeploy.',
            )}
          </p>
        </div>
      )}
      <div className="logo-admin-stats">
        <span>
          👥 {L('Biznes berilgan', 'Assigned', 'Выдано')}: <b>{rows.length}</b>
        </span>
        <span>
          📤 {L('Yuborgan', 'Submitted', 'Отправили')}: <b>{sent}</b>
        </span>
        <span>
          ✅ {L('Baholangan', 'Graded', 'Оценено')}: <b>{graded}</b>
        </span>
        <span>
          📊 {L('O‘rtacha', 'Average', 'Средний')}: <b>{avg}</b>
        </span>
      </div>
      <div className="bo-actions">
        {isAdmin && (
          <label className="bo-check">
            <input
              type="checkbox"
              checked={data.open}
              disabled={!!busy}
              onChange={(e) => void act({ op: 'settings', open: e.target.checked }, 'open')}
            />
            {L('Topshiriq qabul qilinmoqda', 'Accepting submissions', 'Приём работ открыт')}
          </label>
        )}
        {data.aiReady && waiting > 0 && (
          <Button
            variant="outline"
            disabled={!!busy}
            onClick={() =>
              void act(
                { op: 'gradeQueued' },
                'queue',
                L('Navbatdagi ishlar baholandi', 'Queued work graded', 'Очередь оценена'),
              )
            }
          >
            <Sparkles size={16} />
            {L(
              `Navbatdagilarni baholash (${waiting})`,
              `Grade the queue (${waiting})`,
              `Оценить очередь (${waiting})`,
            )}
          </Button>
        )}
        <Button variant="outline" disabled={!shown.length} onClick={csv}>
          <Download size={16} />
          CSV
        </Button>
        <Button variant="ghost" disabled={!!busy} onClick={() => void load()}>
          <RefreshCw size={16} />
          {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      <div className="bo-row bo-filter">
        <select
          className="input"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label={L('Guruh', 'Group', 'Группа')}
        >
          <option value="">{L('Barcha guruhlar', 'All groups', 'Все группы')}</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L('Talaba yoki biznes nomi…', 'Student or business…', 'Студент или бизнес…')}
          aria-label={L('Qidirish', 'Search', 'Поиск')}
        />
      </div>
      {!shown.length && (
        <p className="bo-hint">
          {L(
            'Hali hech kim topshiriqni ochmagan. Talaba 8-mavzudagi «🎨 Topshiriq» tugmasini bosganda unga biznes beriladi.',
            'Nobody has opened the assignment yet. A student gets a business when they press “🎨 Assignment” in topic 8.',
            'Задание ещё никто не открывал. Студент получает бизнес, нажав «🎨 Задание» в теме 8.',
          )}
        </p>
      )}
      <ul className="logo-admin-list">
        {shown.map((r) => {
          const on = openRow === r.uid;
          const m = mark[r.uid] || {
            score: String(r.final?.score ?? r.best ?? ''),
            note: r.final?.note || '',
          };
          const score = Number(m.score);
          const valid =
            m.score !== '' && Number.isInteger(score) && score >= 0 && score <= LOGO_MAX_SCORE;
          return (
            <li key={r.uid} className={on ? 'is-open' : ''}>
              <button
                type="button"
                className="logo-admin-row"
                aria-expanded={on}
                onClick={() => setOpenRow(on ? '' : r.uid)}
              >
                {r.img ? (
                  <img src={r.img} alt="" loading="lazy" />
                ) : (
                  <span className="logo-admin-empty">{r.brief.icon}</span>
                )}
                <span className="logo-admin-who">
                  <b>{r.name}</b>
                  <small>
                    {r.group || '—'} · {r.brief.icon} «{r.brief.name}» — {r.brief.kind}
                  </small>
                </span>
                <span className="logo-admin-state">
                  <small>{L(...STATUS[r.status])}</small>
                  {r.final ? (
                    <ScoreBadge score={r.final.score} />
                  ) : r.best !== undefined ? (
                    <ScoreBadge score={r.best} />
                  ) : null}
                </span>
              </button>
              {on && (
                <div className="logo-admin-body">
                  {r.desc && (
                    <p className="logo-admin-desc">
                      <b>{L('Ta’rif', 'Description', 'Описание')}:</b> {r.desc}
                    </p>
                  )}
                  {r.error && <p className="bo-hint bo-bad">{r.error}</p>}
                  {r.ai && <AiResult ai={r.ai} lang="uz" />}
                  <p className="bo-hint">
                    {L('Urinishlar', 'Attempts', 'Попытки')}:{' '}
                    {r.tries.map((t) => t.score).join(', ') || '—'} · {L('limit', 'limit', 'лимит')}{' '}
                    {LOGO_MAX_TRIES + r.extra}
                    {r.final &&
                      ' · ' + L('baho qo‘ygan', 'marked by', 'оценил') + ': ' + r.final.by}
                  </p>
                  <div className="logo-admin-mark">
                    <label>
                      <span>
                        {L('O‘qituvchi bahosi', 'Teacher’s mark', 'Оценка преподавателя')} (0–
                        {LOGO_MAX_SCORE})
                      </span>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={LOGO_MAX_SCORE}
                        step={1}
                        value={m.score}
                        onChange={(e) =>
                          setMark({ ...mark, [r.uid]: { ...m, score: e.target.value } })
                        }
                      />
                    </label>
                    <label>
                      <span>{L('Izoh (ixtiyoriy)', 'Note (optional)', 'Комментарий')}</span>
                      <input
                        className="input"
                        maxLength={600}
                        value={m.note}
                        onChange={(e) =>
                          setMark({ ...mark, [r.uid]: { ...m, note: e.target.value } })
                        }
                      />
                    </label>
                  </div>
                  <div className="bo-actions">
                    <Button
                      size="sm"
                      disabled={!!busy || !valid}
                      onClick={() =>
                        void act(
                          {
                            op: 'grade',
                            uid: r.uid,
                            score,
                            ...(m.note.trim() ? { note: m.note.trim() } : {}),
                          },
                          'grade' + r.uid,
                          L('Baho saqlandi ✅', 'Mark saved ✅', 'Оценка сохранена ✅'),
                        )
                      }
                    >
                      <Save size={15} />
                      {r.final
                        ? L('Bahoni yangilash', 'Update mark', 'Обновить')
                        : L('Bahoni tasdiqlash', 'Confirm mark', 'Подтвердить')}
                    </Button>
                    {r.final && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => void act({ op: 'clearGrade', uid: r.uid }, 'clear' + r.uid)}
                      >
                        <X size={15} />
                        {L(
                          'O‘qituvchi bahosini olib tashlash',
                          'Remove teacher’s mark',
                          'Убрать оценку',
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() =>
                        void act(
                          { op: 'extra', uid: r.uid },
                          'extra' + r.uid,
                          L('+1 urinish berildi', '+1 attempt given', '+1 попытка'),
                        )
                      }
                    >
                      <Plus size={15} />
                      {L('+1 urinish', '+1 attempt', '+1 попытка')}
                    </Button>
                    {data.aiReady && r.img && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() =>
                          void act(
                            { op: 'regrade', uid: r.uid },
                            'regrade' + r.uid,
                            L('Qayta baholandi', 'Re-graded', 'Переоценено'),
                          )
                        }
                      >
                        <Sparkles size={15} />
                        {busy === 'regrade' + r.uid
                          ? L('Baholanmoqda…', 'Grading…', 'Оценивается…')
                          : L('AI bilan qayta baholash', 'Re-grade with AI', 'Переоценить ИИ')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
