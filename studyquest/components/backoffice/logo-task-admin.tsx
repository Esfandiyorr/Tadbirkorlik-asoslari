'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, RotateCcw, Save, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { ScoreBadge, when } from '../logo-task';
import { LOGO_CRITERIA, LOGO_MAX_SCORE, type LogoTaskRow } from '@/lib/logo-task';
import { tr } from '@/lib/points';

/* 🎨 Logotip topshirig'i — yuklaganlar ro'yxati: har bir talaba nima yuklagani (rasm, ta'rif, berilgan biznes) va
   o'qituvchi bahosi (0–25 ball — 8-mavzu 100 balining logotip qismi, reytingga qo'shiladi). O'qituvchi bahoni
   qo'yadi, o'zgartiradi yoki olib tashlaydi, kerak bo'lsa qayta yuborishga ruxsat beradi va CSV yuklab oladi. */

type View = { rows: LogoTaskRow[]; open: boolean };
type Filter = 'sent' | 'todo' | 'graded' | 'none';

export function LogoTaskAdmin() {
  const { request, toast, data: app, lang } = useApp();
  const L = useL();
  const [data, setData] = useState<View | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [group, setGroup] = useState(''),
    [filter, setFilter] = useState<Filter>('sent'),
    [query, setQuery] = useState(''),
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
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  const rows = useMemo(() => data?.rows || [], [data]);
  const groups = useMemo(
    () => [...new Set(rows.map((r) => r.group).filter(Boolean))].sort(),
    [rows],
  );
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const inGroup = rows.filter((r) => !group || r.group === group);
  const sent = inGroup.filter((r) => r.img),
    todo = inGroup.filter((r) => r.status === 'sent'),
    graded = inGroup.filter((r) => r.final),
    none = inGroup.filter((r) => !r.img);
  const list = { sent, todo, graded, none }[filter].filter(
    (r) =>
      !query.trim() ||
      (r.name + ' ' + r.brief.name + ' ' + r.brief.kind)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const marks = graded.map((r) => r.final!.score);
  const avg = marks.length ? (marks.reduce((s, n) => s + n, 0) / marks.length).toFixed(1) : '—';
  function csv() {
    const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [
      ['Guruh', 'Talaba', 'Biznes', 'Faoliyat', 'Yuborilgan', `Baho (0–${LOGO_MAX_SCORE})`, 'Izoh'],
      ...inGroup.map((r) => [
        r.group,
        r.name,
        r.brief.name,
        r.brief.kind,
        r.sentAt ? when(r.sentAt) : 'yubormagan',
        r.final?.score ?? '',
        r.final?.note ?? '',
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
  const tabs: [Filter, string, number][] = [
    ['sent', L('Yuklaganlar', 'Submitted', 'Загрузили'), sent.length],
    ['todo', L('Baho kutayotganlar', 'Awaiting a mark', 'Ждут оценки'), todo.length],
    ['graded', L('Baholanganlar', 'Graded', 'Оценённые'), graded.length],
    ['none', L('Hali yubormaganlar', 'Not sent yet', 'Ещё не отправили'), none.length],
  ];
  return (
    <div className="logo-admin">
      <p className="bo-hint">
        🎯{' '}
        {L(
          `Logotip — 8-mavzu 100 balining ${LOGO_MAX_SCORE} bali (slaydlar 30 + vaqt 20 + test 25 + logotip 25). Qo‘ygan balingiz talabaning mavzu baliga va reytingiga darhol qo‘shiladi.`,
          `The logo is ${LOGO_MAX_SCORE} of topic 8’s 100 points (slides 30 + time 20 + test 25 + logo 25). Your mark is added to the student’s topic points and ranking at once.`,
          `Логотип — ${LOGO_MAX_SCORE} из 100 баллов темы 8 (слайды 30 + время 20 + тест 25 + логотип 25). Оценка сразу добавляется к баллам и рейтингу.`,
        )}
      </p>
      <details className="logo-admin-guide">
        <summary>
          📋 {L('Baholash yo‘riqnomasi', 'Grading guide', 'Критерии оценки')} ({LOGO_MAX_SCORE}{' '}
          {L('ball', 'points', 'баллов')})
        </summary>
        <ol>
          {LOGO_CRITERIA.map((c) => (
            <li key={c.en}>
              <b>{c.max}</b> — {tr(lang, c.uz, c.en, c.ru)}
            </li>
          ))}
        </ol>
      </details>
      <div className="logo-admin-stats">
        <span>
          📤 {L('Yuklagan', 'Submitted', 'Загрузили')}: <b>{sent.length}</b>
        </span>
        <span>
          ⏳ {L('Baho kutmoqda', 'Awaiting', 'Ждут')}: <b>{todo.length}</b>
        </span>
        <span>
          ✅ {L('Baholangan', 'Graded', 'Оценено')}: <b>{graded.length}</b>
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
        <Button variant="outline" disabled={!inGroup.length} onClick={csv}>
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
      <div className="bo-subtabs" role="tablist">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={filter === id ? 'is-on' : ''}
            onClick={() => setFilter(id)}
          >
            {label} <em>{n}</em>
          </button>
        ))}
      </div>
      {!list.length && (
        <p className="bo-hint">
          {filter === 'none'
            ? L(
                'Topshiriqni ochgan hamma talaba ishini yuborgan.',
                'Everyone who opened the assignment has sent their work.',
                'Все, кто открыл задание, отправили работу.',
              )
            : L(
                'Hali bu ro‘yxatda hech kim yo‘q. Talaba 8-mavzudagi «🎨 Topshiriq» orqali logotip yuklaganda shu yerda chiqadi.',
                'Nobody here yet. Students appear here after uploading a logo via “🎨 Assignment” in topic 8.',
                'Пока никого нет. Студенты появятся здесь после загрузки логотипа в теме 8.',
              )}
        </p>
      )}
      <ul className="logo-admin-list">
        {list.map((r) => {
          const m = mark[r.uid] || {
            score: r.final ? String(r.final.score) : '',
            note: r.final?.note || '',
          };
          const score = Number(m.score);
          const valid =
            m.score.trim() !== '' &&
            Number.isInteger(score) &&
            score >= 0 &&
            score <= LOGO_MAX_SCORE;
          const set = (patch: Partial<typeof m>) =>
            setMark({ ...mark, [r.uid]: { ...m, ...patch } });
          return (
            <li key={r.uid} className={'logo-admin-card is-' + r.status}>
              {r.img ? (
                <a
                  className="logo-admin-img"
                  href={r.img}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={L('To‘liq o‘lchamda ochish', 'Open full size', 'Открыть полностью')}
                >
                  <img
                    src={r.img}
                    alt={L('Logotip: ', 'Logo: ', 'Логотип: ') + r.name}
                    loading="lazy"
                  />
                </a>
              ) : (
                <span className="logo-admin-img is-empty" aria-hidden="true">
                  {r.brief.icon}
                </span>
              )}
              <div className="logo-admin-main">
                <div className="logo-admin-top">
                  <b>{r.name}</b>
                  <small>{r.group || '—'}</small>
                  {r.final && !r.resent && <ScoreBadge score={r.final.score} />}
                  {r.resent && (
                    <em className="logo-admin-tag">
                      🔁 {L('yangi variant', 'new version', 'новый вариант')}
                      {r.final &&
                        ' · ' +
                          L('avvalgi baho', 'previous mark', 'прежняя оценка') +
                          ' ' +
                          r.final.score}
                    </em>
                  )}
                  {r.status === 'sent' && !r.resent && (
                    <em className="logo-admin-tag">
                      ⏳ {L('baho kutmoqda', 'awaiting a mark', 'ждёт оценки')}
                    </em>
                  )}
                </div>
                <p className="logo-admin-biz">
                  {r.brief.icon} «{r.brief.name}» — {r.brief.kind} · 👥 {r.brief.aud} · 🎭{' '}
                  {r.brief.character.uz} · 📍 {r.brief.use}
                </p>
                {r.desc ? (
                  <details className="logo-admin-desc">
                    <summary>
                      {r.sentAt && <small>{when(r.sentAt)} · </small>}
                      {r.desc.length > 160 ? r.desc.slice(0, 160) + '…' : r.desc}
                    </summary>
                    {r.desc.length > 160 && <p>{r.desc}</p>}
                  </details>
                ) : (
                  <p className="bo-hint">
                    {L('Hali ish yubormagan.', 'Nothing sent yet.', 'Ещё ничего не отправил.')}
                  </p>
                )}
                {r.img && (
                  <form
                    className="logo-admin-mark"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!valid) return;
                      void act(
                        {
                          op: 'grade',
                          uid: r.uid,
                          score,
                          ...(m.note.trim() ? { note: m.note.trim() } : {}),
                        },
                        'grade' + r.uid,
                        L(
                          `${r.name}: ${score}/${LOGO_MAX_SCORE} ✅`,
                          `${r.name}: ${score}/${LOGO_MAX_SCORE} ✅`,
                          `${r.name}: ${score}/${LOGO_MAX_SCORE} ✅`,
                        ),
                      ).then((ok) => {
                        if (!ok) return;
                        const rest = { ...mark };
                        delete rest[r.uid];
                        setMark(rest);
                      });
                    }}
                  >
                    <label>
                      <span>
                        {L('Baho', 'Mark', 'Оценка')} (0–{LOGO_MAX_SCORE})
                      </span>
                      <input
                        className="input"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={LOGO_MAX_SCORE}
                        step={1}
                        value={m.score}
                        onChange={(e) => set({ score: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>{L('Izoh (ixtiyoriy)', 'Note (optional)', 'Комментарий')}</span>
                      <input
                        className="input"
                        maxLength={600}
                        value={m.note}
                        onChange={(e) => set({ note: e.target.value })}
                      />
                    </label>
                    <Button type="submit" size="sm" disabled={!!busy || !valid}>
                      <Save size={15} />
                      {r.final && !r.resent
                        ? L('Yangilash', 'Update', 'Обновить')
                        : L('Baholash', 'Grade', 'Оценить')}
                    </Button>
                  </form>
                )}
                {r.final && (
                  <div className="bo-actions">
                    {!r.again && !r.resent && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() =>
                          void act(
                            { op: 'again', uid: r.uid },
                            'again' + r.uid,
                            L(
                              'Talaba yangi variant yubora oladi',
                              'The student may send a new version',
                              'Студент может отправить новый вариант',
                            ),
                          )
                        }
                      >
                        <RotateCcw size={15} />
                        {L(
                          'Qayta yuborishga ruxsat',
                          'Allow a new version',
                          'Разрешить новый вариант',
                        )}
                      </Button>
                    )}
                    {r.again && (
                      <span className="bo-hint">
                        🔁{' '}
                        {L(
                          'Qayta yuborishga ruxsat berilgan',
                          'A new version is allowed',
                          'Новый вариант разрешён',
                        )}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!!busy}
                      onClick={() =>
                        confirm(
                          L(
                            `${r.name} bahosi olib tashlansinmi? Mavzu bali ham kamayadi.`,
                            `Remove ${r.name}’s mark? Their topic points go down too.`,
                            `Убрать оценку ${r.name}? Баллы темы тоже уменьшатся.`,
                          ),
                        ) && void act({ op: 'clearGrade', uid: r.uid }, 'clear' + r.uid)
                      }
                    >
                      <X size={15} />
                      {L('Bahoni olib tashlash', 'Remove mark', 'Убрать оценку')}
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
