'use client';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CalendarPlus,
  Download,
  FileUp,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dayLabel, download, useAdminView, useL } from './common';
import {
  LIVE_SECTIONS,
  QSEC_CHOICES,
  khDay,
  khHM,
  parseBulk,
  sectionKey,
  startOf,
} from '@/lib/live-quiz';
import type { LiveAdminView } from '@/lib/server/live-admin';
import type { Lang } from '@/lib/types';

type Q = LiveAdminView['bank'][number];
type Draft = { id?: string; t: string; ok: string; wrong: [string, string, string]; tp: string };
const blank = (tp = ''): Draft => ({ t: '', ok: '', wrong: ['', '', ''], tp });
const sectionName = (tp: string, lang: Lang) => {
  const s = LIVE_SECTIONS.find((x) => x.id === tp);
  return s ? s[lang] : tp.toUpperCase();
};

/* ⚡ Sayt boshqaruvi → Jonli test: kunlik avtomatik o'yin, yaqin o'yinlar, o'yin tuzish, savollar banki, natijalar. */
export function LiveAdmin() {
  const { lang } = useApp();
  const L = useL();
  const { data, error, busy, act } = useAdminView<LiveAdminView>('liveAdmin', 'liveAdmin');
  const [tab, setTab] = useState<'plan' | 'create' | 'bank' | 'results'>('plan');
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const next = data.games.find((g) => g.type === 'quiz');
  return (
    <div className="bo-live">
      <div className="bo-status">
        <span className={'bo-pill ' + (data.cfg.on ? 'on' : 'off')}>
          {data.cfg.on
            ? L('✅ Yoqilgan', '✅ On', '✅ Включено')
            : L('⏸ O‘chiq', '⏸ Off', '⏸ Выключено')}
        </span>
        <span>
          {data.cfg.on
            ? L(
                `Har kuni soat ${data.cfg.time} da, ${data.cfg.nq} ta savol, har savolga ${data.cfg.qsec} soniya.`,
                `Every day at ${data.cfg.time}, ${data.cfg.nq} questions, ${data.cfg.qsec} s each.`,
                `Каждый день в ${data.cfg.time}, ${data.cfg.nq} вопросов, по ${data.cfg.qsec} с.`,
              )
            : L(
                'Avtomatik kunlik o‘yin o‘chiq. O‘yinni qo‘lda tuzishingiz mumkin.',
                'The automatic daily game is off. You can still create a game yourself.',
                'Ежедневная игра выключена. Игру можно создать вручную.',
              )}
        </span>
        {next && (
          <b>
            {L('Keyingi o‘yin:', 'Next game:', 'Следующая игра:')}{' '}
            {dayLabel(next.d, lang, data.now)} {khHM(next.start)}
          </b>
        )}
      </div>
      {data.msg && <p className="bo-warn">⚠️ {data.msg}</p>}
      <div className="bo-subtabs" role="tablist">
        {(
          [
            ['plan', L('📅 Jadval va sozlama', '📅 Schedule & settings', '📅 Расписание')],
            ['create', L('🎯 O‘yin tuzish', '🎯 Create a game', '🎯 Создать игру')],
            [
              'bank',
              L(
                `📚 Savollar banki (${data.bank.length})`,
                `📚 Question bank (${data.bank.length})`,
                `📚 Банк вопросов (${data.bank.length})`,
              ),
            ],
            ['results', L('🏁 Natijalar', '🏁 Results', '🏁 Результаты')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'plan' && <Plan data={data} busy={busy} act={act} />}
      {tab === 'create' && <Create data={data} busy={busy} act={act} done={() => setTab('plan')} />}
      {tab === 'bank' && <Bank data={data} busy={busy} act={act} />}
      {tab === 'results' && <Results data={data} />}
    </div>
  );
}

type Act = (input: unknown, key: string, done?: string, quiet?: boolean) => Promise<LiveAdminView>;
type Props = { data: LiveAdminView; busy: string; act: Act };

function Plan({ data, busy, act }: Props) {
  const { lang } = useApp();
  const L = useL();
  const [cfg, setCfg] = useState(data.cfg);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of data.bank) c[sectionKey(q.tp)] = (c[sectionKey(q.tp)] || 0) + 1;
    return c;
  }, [data.bank]);
  const off = new Set(cfg.off);
  const pool = data.bank.filter((q) => !off.has(sectionKey(q.tp))).length;
  const save = (e: FormEvent) => {
    e.preventDefault();
    void act(
      { op: 'settings', on: cfg.on, time: cfg.time, nq: cfg.nq, qsec: cfg.qsec, off: cfg.off },
      'settings',
      L('Sozlama saqlandi ✅', 'Settings saved ✅', 'Настройки сохранены ✅'),
    ).catch(() => {});
  };
  const stop = (g: LiveAdminView['games'][number]) => {
    const msg =
      g.state === 'live'
        ? L(
            'O‘yin hozir ketmoqda. To‘xtatilsinmi? O‘yinchilarga «O‘yin to‘xtatildi» chiqadi, hech kimga ball berilmaydi.',
            'The game is on now. Stop it? Players will see “The game was stopped”; no points are given.',
            'Игра идёт. Остановить? Игроки увидят «Игра остановлена», баллы не начисляются.',
          )
        : g.state === 'lobby'
          ? L(
              'Lobbi ochiq. O‘yin to‘xtatilsinmi?',
              'The lobby is open. Stop the game?',
              'Лобби открыто. Остановить игру?',
            )
          : L('Bu o‘yin bekor qilinsinmi?', 'Cancel this game?', 'Отменить эту игру?');
    if (
      !confirm(
        msg +
          '\n\n' +
          L(
            'Shu kunga avtomatik o‘yin qayta tuzilmaydi. Xohlasangiz, «O‘yin tuzish» bilan yangisini tuzasiz.',
            'No automatic game will be scheduled for that day again. You can create a new one with “Create a game”.',
            'Автоматическая игра на этот день не будет создана снова. Новую можно создать во вкладке «Создать игру».',
          ),
      )
    )
      return;
    void act(
      { op: 'cancel', d: g.d },
      'cancel' + g.d,
      L('O‘yin to‘xtatildi ⛔', 'Game stopped ⛔', 'Игра остановлена ⛔'),
    ).catch(() => {});
  };
  // ⏰ yaqin o'yinning vaqtini o'zgartirish: qaysi o'yin ochiq va qanday vaqt tanlangan
  const [moving, setMoving] = useState<{ d: string; time: string } | null>(null);
  const move = (e: FormEvent) => {
    e.preventDefault();
    if (!moving) return;
    void act(
      { op: 'move', d: moving.d, time: moving.time },
      'move' + moving.d,
      L(
        `O‘yin ${moving.time} ga ko‘chirildi ⏰`,
        `The game was moved to ${moving.time} ⏰`,
        `Игра перенесена на ${moving.time} ⏰`,
      ),
    )
      .then(() => setMoving(null))
      .catch(() => {});
  };
  return (
    <div className="bo-grid">
      <form className="bo-card" onSubmit={save}>
        <h3>{L('Kunlik avtomatik o‘yin', 'Automatic daily game', 'Ежедневная игра')}</h3>
        <label className="bo-check">
          <input
            type="checkbox"
            checked={cfg.on}
            onChange={(e) => setCfg({ ...cfg, on: e.target.checked })}
          />
          {L(
            'Har kuni o‘zi tuzilsin (14 kun oldinga)',
            'Schedule a game every day (14 days ahead)',
            'Создавать игру каждый день (на 14 дней вперёд)',
          )}
        </label>
        <div className="bo-row">
          <label>
            {L('Vaqti', 'Time', 'Время')}
            <input
              type="time"
              value={cfg.time}
              onChange={(e) => setCfg({ ...cfg, time: e.target.value || '20:00' })}
            />
          </label>
          <label>
            {L('Savollar soni', 'Questions', 'Вопросов')}
            <select value={cfg.nq} onChange={(e) => setCfg({ ...cfg, nq: +e.target.value })}>
              {Array.from({ length: 16 }, (_, i) => i + 5).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L('Har savolga (soniya)', 'Per question (s)', 'На вопрос (с)')}
            <select value={cfg.qsec} onChange={(e) => setCfg({ ...cfg, qsec: +e.target.value })}>
              {QSEC_CHOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="bo-sections">
          <legend>
            {L(
              'Kunlik o‘yinga qaysi bo‘limlardagi savollar kirsin:',
              'Sections used in the daily game:',
              'Разделы для ежедневной игры:',
            )}
          </legend>
          {LIVE_SECTIONS.filter((s) => counts[sectionKey(s.id)]).map((s) => {
            const k = sectionKey(s.id);
            return (
              <label key={k} className="bo-check">
                <input
                  type="checkbox"
                  checked={!off.has(k)}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      off: e.target.checked ? cfg.off.filter((x) => x !== k) : [...cfg.off, k],
                    })
                  }
                />
                {s[lang]} ({counts[k]})
              </label>
            );
          })}
          {!data.bank.length && (
            <p className="muted">
              {L(
                'Bankda hali savol yo‘q — «Savollar banki» bo‘limida qo‘shing.',
                'The bank is empty — add questions in “Question bank”.',
                'Банк пуст — добавьте вопросы во вкладке «Банк вопросов».',
              )}
            </p>
          )}
        </fieldset>
        {cfg.on && pool < cfg.nq && (
          <p className="bo-hint bo-bad">
            {pool < 4
              ? L(
                  `Tanlangan bo‘limlarda ${pool} ta savol bor — o‘yin tuzilishi uchun kamida 4 ta kerak.`,
                  `The selected sections have ${pool} questions — at least 4 are needed.`,
                  `В выбранных разделах ${pool} вопросов — нужно не менее 4.`,
                )
              : L(
                  `Tanlangan bo‘limlarda ${pool} ta savol bor — har o‘yinda ${pool} ta savol chiqadi.`,
                  `The selected sections have ${pool} questions — each game will use ${pool}.`,
                  `В выбранных разделах ${pool} вопросов — в каждой игре будет ${pool}.`,
                )}
          </p>
        )}
        <p className="bo-hint">
          {L(
            `Lobbi ${data.cfg.lobby} daqiqa oldin ochiladi · kamida ${data.cfg.min} ishtirokchi · sovrin 5-4-3 ball (20 kishidan ko‘p bo‘lsa 5-4-3-2-1) — umumiy reytingga qo‘shiladi.`,
            `The lobby opens ${data.cfg.lobby} minutes early · at least ${data.cfg.min} players · prizes 5-4-3 points (5-4-3-2-1 with more than 20) — added to the overall rating.`,
            `Лобби открывается за ${data.cfg.lobby} мин · минимум ${data.cfg.min} игроков · призы 5-4-3 балла (при 20+ — 5-4-3-2-1) — в общий рейтинг.`,
          )}
        </p>
        <Button type="submit" disabled={busy === 'settings'}>
          <Save size={16} />
          {L('Saqlash', 'Save', 'Сохранить')}
        </Button>
      </form>
      <div className="bo-card">
        <h3>{L('Yaqin o‘yinlar', 'Upcoming games', 'Ближайшие игры')}</h3>
        {data.games.length ? (
          <ul className="bo-list">
            {data.games.slice(0, 8).map((g) => (
              <li key={g.d}>
                <span>
                  <b>
                    {g.type === 'yz'
                      ? L('⌨️ Yozuv poygasi', '⌨️ Typing race', '⌨️ Гонка набора')
                      : g.own
                        ? L('🎯 Siz tuzgan o‘yin', '🎯 Your game', '🎯 Ваша игра')
                        : L('🤖 Avtomatik o‘yin', '🤖 Automatic game', '🤖 Автоматическая игра')}
                    {' · '}
                    {dayLabel(khDay(g.start), lang, data.now)} {khHM(g.start)}
                  </b>
                  <small>
                    {g.state === 'live'
                      ? L('🎮 hozir ketmoqda', '🎮 on now', '🎮 идёт сейчас')
                      : g.state === 'lobby'
                        ? L('🔔 lobbi ochiq', '🔔 lobby open', '🔔 лобби открыто')
                        : L('⏳ kutilmoqda', '⏳ waiting', '⏳ ожидание')}
                    {g.type === 'quiz' &&
                      ' · ' +
                        L(
                          `${g.nq} ta savol, ${g.qsec} soniyadan`,
                          `${g.nq} questions, ${g.qsec} s each`,
                          `${g.nq} вопросов по ${g.qsec} с`,
                        )}
                    {g.note && ' · ' + g.note}
                  </small>
                </span>
                <span className="bo-live-actions">
                  {g.type === 'quiz' &&
                    g.state === 'wait' &&
                    /^\d{4}-\d\d-\d\d$/.test(g.d) &&
                    (moving?.d === g.d ? (
                      <form className="bo-live-move" onSubmit={move}>
                        <input
                          type="time"
                          required
                          aria-label={L('Yangi vaqt', 'New time', 'Новое время')}
                          value={moving.time}
                          onChange={(e) => setMoving({ d: g.d, time: e.target.value })}
                        />
                        <Button size="sm" type="submit" disabled={busy === 'move' + g.d}>
                          {L('Ko‘chirish', 'Move', 'Перенести')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => setMoving(null)}
                        >
                          {L('Bekor', 'Cancel', 'Отмена')}
                        </Button>
                      </form>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        title={L(
                          'Shu kungi o‘yinni boshqa soatga ko‘chirish (savollar o‘zgarmaydi)',
                          'Move this game to another time the same day (questions stay)',
                          'Перенести игру на другое время в тот же день (вопросы те же)',
                        )}
                        onClick={() => setMoving({ d: g.d, time: khHM(g.start) })}
                      >
                        ⏰ {L('Vaqtini o‘zgartirish', 'Change time', 'Изменить время')}
                      </Button>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === 'cancel' + g.d}
                    onClick={() => stop(g)}
                  >
                    {g.state === 'wait'
                      ? L('Bekor qilish', 'Cancel', 'Отменить')
                      : L('⛔ To‘xtatish', '⛔ Stop', '⛔ Стоп')}
                  </Button>
                </span>
              </li>
            ))}
            {data.games.length > 8 && (
              <li className="muted">
                {L(
                  `+ yana ${data.games.length - 8} ta o‘yin jadvalda`,
                  `+ ${data.games.length - 8} more scheduled`,
                  `+ ещё ${data.games.length - 8} в расписании`,
                )}
              </li>
            )}
          </ul>
        ) : (
          <p className="muted">
            {L('Rejalashtirilgan o‘yin yo‘q.', 'No games scheduled.', 'Нет запланированных игр.')}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={busy === 'rebuild'}
          onClick={() =>
            void act(
              { op: 'rebuild' },
              'rebuild',
              L('Jadval yangilandi', 'Schedule updated', 'Расписание обновлено'),
            ).catch(() => {})
          }
        >
          <RefreshCw size={14} />
          {L('Jadvalni qayta tuzish', 'Rebuild the schedule', 'Пересоздать расписание')}
        </Button>
        <RaceSwitch data={data} busy={busy} act={act} />
      </div>
    </div>
  );
}

function RaceSwitch({ data, busy, act }: Props) {
  const L = useL();
  const on = data.cfg.race;
  return (
    <div className="bo-race">
      <b>
        ⌨️{' '}
        {L(
          'Yozuv marafoni (arenada mashq):',
          'Typing marathon (arena practice):',
          'Марафон набора (арена):',
        )}{' '}
        {on ? L('✅ ochiq', '✅ open', '✅ открыт') : L('🔒 yopiq', '🔒 closed', '🔒 закрыт')}
      </b>
      <Button
        size="sm"
        variant={on ? 'outline' : 'secondary'}
        disabled={busy === 'race'}
        onClick={() =>
          confirm(
            on
              ? L('Yozuv marafoni yopilsinmi?', 'Close the typing marathon?', 'Закрыть марафон?')
              : L(
                  'Yozuv marafoni talabalarga ochilsinmi?',
                  'Open the typing marathon for students?',
                  'Открыть марафон студентам?',
                ),
          ) &&
          void act(
            { op: 'race', on: !on },
            'race',
            on
              ? L('Yopildi 🔒', 'Closed 🔒', 'Закрыт 🔒')
              : L('Ochildi ✅', 'Opened ✅', 'Открыт ✅'),
          ).catch(() => {})
        }
      >
        {on
          ? L('Yopish', 'Close', 'Закрыть')
          : L('Talabalarga ochish', 'Open for students', 'Открыть')}
      </Button>
      <small className="muted">
        {L(
          'Jonli yozuv poygasini tuzish hozircha «Kursni boshqarish → 🔑 O‘qituvchi → ⚡ Jonli test» bo‘limida.',
          'Live typing races are still set up in “Course controls → 🔑 Teacher → ⚡ Live quiz”.',
          'Живые гонки набора пока создаются в «Управление предметом → 🔑 Преподаватель → ⚡ Живой тест».',
        )}
      </small>
    </div>
  );
}

/** Kun, vaqt va savollarni o'zi tanlaydigan o'yin (asl «🎯 O'yin tuzish»). */
function Create({ data, busy, act, done }: Props & { done: () => void }) {
  const { lang } = useApp();
  const L = useL();
  const [form, setForm] = useState(() => {
    // Standart: bugun — sozlamadagi vaqt (lobbisi bilan) o'tmagan bo'lsa o'sha vaqt, aks holda 15 daqiqadan keyin.
    const now = data.now;
    let d = khDay(now),
      tm = data.cfg.time;
    if (startOf(d, tm) - data.cfg.lobby * 60000 <= now + 120000) {
      const r = Math.ceil((now + 15 * 60000 + 18000000) / 300000) * 300000 - 18000000;
      d = khDay(r);
      tm = khHM(r);
    }
    return { d, tm, qsec: data.cfg.qsec, note: '' };
  });
  const [order, setOrder] = useState<string[]>([]),
    [filter, setFilter] = useState('*'),
    [search, setSearch] = useState('');
  const picked = new Set(order);
  const pool = data.bank.filter(
    (x) =>
      (filter === '*' || x.tp === filter) &&
      (!search.trim() || x.t.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );
  const tick = (id: string, on: boolean) =>
    setOrder((o) => (on ? (o.includes(id) ? o : [...o, id]) : o.filter((x) => x !== id)));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (order.length < 4)
      return alert(
        L(
          'Kamida 4 ta savol tanlang.',
          'Select at least 4 questions.',
          'Выберите не менее 4 вопросов.',
        ),
      );
    if (
      !confirm(
        L(
          `O‘yin: ${dayLabel(form.d, lang, data.now)} ${form.tm} · ${order.length} ta savol · ${form.qsec} soniyadan. Tuzilsinmi?`,
          `Game: ${dayLabel(form.d, lang, data.now)} ${form.tm} · ${order.length} questions · ${form.qsec} s each. Create it?`,
          `Игра: ${dayLabel(form.d, lang, data.now)} ${form.tm} · ${order.length} вопросов · по ${form.qsec} с. Создать?`,
        ),
      )
    )
      return;
    void act(
      { op: 'create', date: form.d, time: form.tm, qsec: form.qsec, note: form.note, ids: order },
      'create',
      L('O‘yin tuzildi ✅', 'Game created ✅', 'Игра создана ✅'),
    )
      .then(() => {
        setOrder([]);
        done();
      })
      .catch(() => {});
  };
  return (
    <form className="bo-card" onSubmit={submit}>
      <h3>
        {L(
          'O‘yin tuzish — kuni, vaqti va savollarini o‘zingiz tanlaysiz',
          'Create a game — you choose the day, time and questions',
          'Создать игру — день, время и вопросы',
        )}
      </h3>
      <div className="bo-row">
        <label>
          {L('Sana', 'Date', 'Дата')}
          <input
            type="date"
            value={form.d}
            onChange={(e) => setForm({ ...form, d: e.target.value || form.d })}
          />
        </label>
        <label>
          {L('Vaqti', 'Time', 'Время')}
          <input
            type="time"
            value={form.tm}
            onChange={(e) => setForm({ ...form, tm: e.target.value || form.tm })}
          />
        </label>
        <label>
          {L('Har savolga (soniya)', 'Per question (s)', 'На вопрос (с)')}
          <select value={form.qsec} onChange={(e) => setForm({ ...form, qsec: +e.target.value })}>
            {QSEC_CHOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {L(
          'Talabalarga eslatma (ixtiyoriy)',
          'Note to students (optional)',
          'Заметка для студентов (необязательно)',
        )}
        <input
          maxLength={140}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </label>
      <div className="bo-row bo-filter">
        <label>
          {L('Bo‘lim', 'Section', 'Раздел')}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="*">{L('Barcha bo‘limlar', 'All sections', 'Все разделы')}</option>
            {LIVE_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s[lang]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {L('Qidirish', 'Search', 'Поиск')}
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => pool.forEach((x) => tick(x.id, true))}
        >
          <ListChecks size={14} />
          {L('Ko‘rinayotganlarni belgilash', 'Tick the shown ones', 'Отметить показанные')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setOrder(
              [...pool]
                .map((x) => ({ x, r: Math.random() }))
                .sort((a, b) => a.x.u - b.x.u || a.r - b.r)
                .slice(0, 15)
                .map((v) => v.x.id),
            )
          }
        >
          🎲 {L('Tasodifiy 15 ta', 'Random 15', 'Случайные 15')}
        </Button>
      </div>
      <p className="bo-hint">
        {L('Tanlangan:', 'Selected:', 'Выбрано:')} <b>{order.length}</b>{' '}
        {L(
          'ta (tavsiya — 10–15). Savollar belgilangan tartibda chiqadi, javoblar aralashtiriladi. Shu kunning avtomatik o‘yini bo‘lsa, uning o‘rniga o‘tadi.',
          '(10–15 recommended). Questions go in the order ticked; answers are shuffled. It replaces that day’s automatic game.',
          '(рекомендуется 10–15). Вопросы идут в порядке отметки, ответы перемешиваются. Заменяет автоматическую игру этого дня.',
        )}
      </p>
      <ul className="bo-qlist">
        {pool.map((x) => (
          <li key={x.id}>
            <label>
              <input
                type="checkbox"
                checked={picked.has(x.id)}
                onChange={(e) => tick(x.id, e.target.checked)}
              />
              <span>
                <b>{x.t}</b>
                <small>
                  ✅ {x.o[x.c]} · {sectionName(x.tp, lang)} ·{' '}
                  {L('ishlatilgan', 'used', 'использован')}: {x.u}
                </small>
              </span>
              {picked.has(x.id) && <em>{order.indexOf(x.id) + 1}</em>}
            </label>
          </li>
        ))}
        {!pool.length && (
          <li className="muted">
            {L('Savol topilmadi.', 'No questions found.', 'Вопросы не найдены.')}
          </li>
        )}
      </ul>
      <div className="bo-actions">
        <Button type="submit" disabled={busy === 'create'}>
          <CalendarPlus size={16} />
          {L('O‘yinni tuzish', 'Create the game', 'Создать игру')}
        </Button>
        {!!order.length && (
          <Button type="button" variant="ghost" onClick={() => setOrder([])}>
            {L('Belgilarni tozalash', 'Clear ticks', 'Снять отметки')}
          </Button>
        )}
      </div>
    </form>
  );
}

function Bank({ data, busy, act }: Props) {
  const { lang, toast } = useApp();
  const L = useL();
  const [filter, setFilter] = useState('*'),
    [search, setSearch] = useState(''),
    [draft, setDraft] = useState<Draft | null>(null),
    [bulk, setBulk] = useState<{ text: string; tp: string } | null>(null),
    [sel, setSel] = useState<Set<string>>(new Set());
  const file = useRef<HTMLInputElement>(null);
  const list = data.bank.filter(
    (x) =>
      (filter === '*' || x.tp === filter) &&
      (!search.trim() || x.t.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );
  const edit = (x: Q) =>
    setDraft({
      id: x.id,
      t: x.t,
      ok: x.o[x.c] || '',
      wrong: x.o
        .filter((_, i) => i !== x.c)
        .concat(['', '', ''])
        .slice(0, 3) as Draft['wrong'],
      tp: x.tp,
    });
  const lens = draft ? [draft.ok, ...draft.wrong].map((v) => v.trim().length) : [];
  const uneven =
    lens.length > 0 && Math.max(...lens) > 0 && Math.min(...lens) / Math.max(...lens) < 0.7;
  const saveDraft = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    void act(
      {
        op: 'save',
        ...(draft.id ? { id: draft.id } : {}),
        t: draft.t.trim(),
        o: [draft.ok, ...draft.wrong].map((v) => v.trim()),
        c: 0,
        tp: draft.tp,
      },
      'save',
      L('Saqlandi ✅', 'Saved ✅', 'Сохранено ✅'),
    )
      .then(() => setDraft(null))
      .catch(() => {});
  };
  /** Ko'p savolni bo'laklab yuborish (bitta so'rov 100 tadan). */
  async function importMany(qs: { t: string; o: string[]; c: number; tp?: string }[]) {
    const before = data.bank.length;
    let after = before;
    for (let i = 0; i < qs.length; i += 100) {
      try {
        const v = await act(
          { op: 'import', questions: qs.slice(i, i + 100) },
          'import',
          undefined,
          true,
        );
        after = v.bank.length;
      } catch (e) {
        if (!/allaqachon|bankda bor/i.test((e as Error).message)) {
          toast((e as Error).message);
          return false;
        }
      }
    }
    const added = after - before,
      skipped = qs.length - added;
    toast(
      added
        ? L(`Qo‘shildi: ${added}`, `Added: ${added}`, `Добавлено: ${added}`) +
            (skipped
              ? L(
                  ` · bankda bor edi: ${skipped}`,
                  ` · already there: ${skipped}`,
                  ` · уже были: ${skipped}`,
                )
              : '')
        : L(
            'Hammasi bankda bor edi',
            'All of them were already in the bank',
            'Все уже были в банке',
          ),
    );
    return true;
  }
  const parsed = bulk ? parseBulk(bulk.text) : null;
  const readFile = (f: File) => {
    const rd = new FileReader();
    rd.onload = () => {
      let arr: unknown[] | null = null;
      try {
        const j = JSON.parse(String(rd.result));
        arr = Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : null;
      } catch {}
      if (!arr?.length) return toast(L('Fayl noto‘g‘ri', 'Invalid file', 'Неверный файл'));
      const qs = arr
        .map(
          (x) =>
            x as { t?: string; q?: string; o?: unknown[]; a?: unknown[]; c?: number; tp?: string },
        )
        .map((x) => ({
          t: String(x.t || x.q || '').trim(),
          o: (x.o || x.a || []).map((v) => String(v ?? '').trim()),
          c: +(x.c ?? 0) || 0,
          tp: LIVE_SECTIONS.some((s) => s.id === x.tp) ? String(x.tp || '') : '',
        }))
        .filter(
          (x) => x.t.length >= 8 && x.o.length === 4 && x.o.every(Boolean) && x.c >= 0 && x.c <= 3,
        );
      if (!qs.length)
        return toast(
          L(
            'Faylda yaroqli savol topilmadi',
            'No valid questions in the file',
            'В файле нет подходящих вопросов',
          ),
        );
      void importMany(qs);
    };
    rd.readAsText(f);
  };
  return (
    <div className="bo-card">
      <div className="bo-actions">
        <Button
          size="sm"
          onClick={() => {
            setBulk(null);
            setDraft(blank(filter === '*' ? '' : filter));
          }}
        >
          <Plus size={14} />
          {L('Savol qo‘shish', 'Add a question', 'Добавить вопрос')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDraft(null);
            setBulk({ text: '', tp: filter === '*' ? '' : filter });
          }}
        >
          📝 {L('Ko‘p savol qo‘shish', 'Add many', 'Добавить много')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => file.current?.click()}>
          <FileUp size={14} />
          {L('Fayldan yuklash', 'Import a file', 'Загрузить файл')}
        </Button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) readFile(f);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            download(
              'jonli-test-savollar-' + khDay(Date.now()) + '.json',
              JSON.stringify(
                { v: 1, questions: data.bank.map((x) => ({ t: x.t, o: x.o, c: x.c, tp: x.tp })) },
                null,
                1,
              ),
            )
          }
        >
          <Download size={14} />
          {L('Yuklab olish', 'Export', 'Скачать')}
        </Button>
      </div>
      {draft && (
        <form className="bo-form" onSubmit={saveDraft}>
          <h3>
            {draft.id
              ? L('Savolni tahrirlash', 'Edit the question', 'Изменить вопрос')
              : L('Yangi savol', 'New question', 'Новый вопрос')}
          </h3>
          <label>
            {L('Savol', 'Question', 'Вопрос')}
            <textarea
              rows={2}
              required
              minLength={8}
              maxLength={200}
              value={draft.t}
              onChange={(e) => setDraft({ ...draft, t: e.target.value })}
            />
          </label>
          <label className="bo-ok">
            ✅ {L('To‘g‘ri javob', 'Correct answer', 'Правильный ответ')}
            <input
              required
              maxLength={120}
              value={draft.ok}
              onChange={(e) => setDraft({ ...draft, ok: e.target.value })}
            />
            <small>
              {lens[0]} {L('belgi', 'chars', 'симв.')}
            </small>
          </label>
          {draft.wrong.map((w, i) => (
            <label key={i}>
              {L(`Noto‘g‘ri javob ${i + 1}`, `Wrong answer ${i + 1}`, `Неверный ответ ${i + 1}`)}
              <input
                required
                maxLength={120}
                value={w}
                onChange={(e) => {
                  const wrong = [...draft.wrong] as Draft['wrong'];
                  wrong[i] = e.target.value;
                  setDraft({ ...draft, wrong });
                }}
              />
              <small>
                {lens[i + 1]} {L('belgi', 'chars', 'симв.')}
              </small>
            </label>
          ))}
          <label>
            {L('Bo‘lim', 'Section', 'Раздел')}
            <select value={draft.tp} onChange={(e) => setDraft({ ...draft, tp: e.target.value })}>
              {LIVE_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s[lang]}
                </option>
              ))}
            </select>
          </label>
          <p className={'bo-hint' + (uneven ? ' bo-bad' : '')}>
            {L(
              'Javoblar uzunligi bir-biriga yaqin va hammasi ishonarli bo‘lsin — aks holda to‘g‘ri javob ko‘zga tashlanib qoladi. O‘yinda javoblar aralashtiriladi.',
              'Keep the answers about the same length and all of them plausible. The order is shuffled in the game.',
              'Ответы должны быть примерно одной длины и правдоподобны. В игре порядок перемешивается.',
            )}
          </p>
          <div className="bo-actions">
            <Button type="submit" disabled={busy === 'save'}>
              <Save size={16} />
              {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              {L('Bekor qilish', 'Cancel', 'Отмена')}
            </Button>
          </div>
        </form>
      )}
      {bulk && (
        <div className="bo-form">
          <h3>
            {L(
              'Bir nechta savolni birdan qo‘shish',
              'Add several questions at once',
              'Добавить несколько вопросов',
            )}
          </h3>
          <p className="bo-hint">
            {L(
              'Har savol: 1-qator — savol, keyingi 4 qator — javoblar. To‘g‘ri javob oxiriga * qo‘ying. Savollar orasida bitta bo‘sh qator.',
              'Each question: line 1 — the question, the next 4 lines — answers. Put * after the correct answer. One empty line between questions.',
              'Каждый вопрос: 1-я строка — вопрос, следующие 4 — ответы. После правильного ответа поставьте *. Между вопросами — пустая строка.',
            )}
          </p>
          <textarea
            aria-label={L('Savollar matni', 'Questions text', 'Текст вопросов')}
            rows={9}
            value={bulk.text}
            placeholder={
              'Ruchka va daftar 11 000 so‘m. Ruchka 10 000 so‘m qimmat. Daftar necha so‘m?\n500 *\n1 000\n1 500\n100\n\nKeyingi savol…'
            }
            onChange={(e) => setBulk({ ...bulk, text: e.target.value })}
          />
          <label>
            {L('Bo‘lim', 'Section', 'Раздел')}
            <select value={bulk.tp} onChange={(e) => setBulk({ ...bulk, tp: e.target.value })}>
              {LIVE_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s[lang]}
                </option>
              ))}
            </select>
          </label>
          <p className="bo-hint" role="status">
            {L('Tayyor:', 'Ready:', 'Готово:')} <b>{parsed?.qs.length || 0}</b>
            {!!parsed?.bad &&
              L(
                ` · ⚠️ tushunilmadi: ${parsed.bad}`,
                ` · ⚠️ not understood: ${parsed.bad}`,
                ` · ⚠️ не распознано: ${parsed.bad}`,
              )}
          </p>
          <div className="bo-actions">
            <Button
              disabled={busy === 'import' || !parsed?.qs.length}
              onClick={() =>
                void importMany(parsed!.qs.map((q) => ({ ...q, tp: bulk.tp }))).then(
                  (ok) => ok && setBulk(null),
                )
              }
            >
              <Plus size={16} />
              {L('Bankka qo‘shish', 'Add to the bank', 'Добавить в банк')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setBulk(null)}>
              {L('Yopish', 'Close', 'Закрыть')}
            </Button>
          </div>
        </div>
      )}
      <div className="bo-row bo-filter">
        <label>
          {L('Bo‘lim', 'Section', 'Раздел')}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="*">
              {L('Barchasi', 'All', 'Все')} ({data.bank.length})
            </option>
            {LIVE_SECTIONS.map((s) => {
              const n = data.bank.filter((x) => x.tp === s.id).length;
              return n ? (
                <option key={s.id} value={s.id}>
                  {s[lang]} ({n})
                </option>
              ) : null;
            })}
          </select>
        </label>
        <label>
          {L('Qidirish', 'Search', 'Поиск')}
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {!!sel.size && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy === 'delete'}
            onClick={() =>
              confirm(
                L(
                  `Belgilangan ${sel.size} ta savol o‘chirilsinmi?`,
                  `Delete ${sel.size} ticked questions?`,
                  `Удалить ${sel.size} отмеченных вопросов?`,
                ),
              ) &&
              void act(
                { op: 'delete', ids: [...sel] },
                'delete',
                L('O‘chirildi', 'Deleted', 'Удалено'),
              )
                .then(() => setSel(new Set()))
                .catch(() => {})
            }
          >
            <Trash2 size={14} />
            {L(
              `Belgilanganlarni o‘chirish (${sel.size})`,
              `Delete ticked (${sel.size})`,
              `Удалить отмеченные (${sel.size})`,
            )}
          </Button>
        )}
      </div>
      <ul className="bo-qlist">
        {list.slice(0, 400).map((x) => (
          <li key={x.id}>
            <label>
              <input
                type="checkbox"
                aria-label={L('Belgilash', 'Tick', 'Отметить')}
                checked={sel.has(x.id)}
                onChange={(e) =>
                  setSel((s) => {
                    const n = new Set(s);
                    if (e.target.checked) n.add(x.id);
                    else n.delete(x.id);
                    return n;
                  })
                }
              />
              <span>
                <b>{x.t}</b>
                <small>
                  ✅ {x.o[x.c]} · {sectionName(x.tp, lang)} ·{' '}
                  {L('ishlatilgan', 'used', 'использован')}: {x.u}
                </small>
              </span>
            </label>
            <span className="bo-row-btns">
              <Button
                size="sm"
                variant="ghost"
                aria-label={L('Tahrirlash', 'Edit', 'Изменить')}
                onClick={() => {
                  setBulk(null);
                  edit(x);
                }}
              >
                ✏️
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={L('O‘chirish', 'Delete', 'Удалить')}
                onClick={() =>
                  confirm(L('Savol o‘chirilsinmi?', 'Delete the question?', 'Удалить вопрос?')) &&
                  void act(
                    { op: 'delete', ids: [x.id] },
                    'delete',
                    L('O‘chirildi', 'Deleted', 'Удалено'),
                  ).catch(() => {})
                }
              >
                🗑
              </Button>
            </span>
          </li>
        ))}
        {!list.length && (
          <li className="muted">
            {L('Savol topilmadi.', 'No questions found.', 'Вопросы не найдены.')}
          </li>
        )}
        {list.length > 400 && (
          <li className="muted">
            {L(
              'Ko‘proq ko‘rish uchun qidiruvdan foydalaning.',
              'Use search to see more.',
              'Используйте поиск, чтобы увидеть больше.',
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

function Results({ data }: { data: LiveAdminView }) {
  const { lang } = useApp();
  const L = useL();
  if (!data.results.length)
    return (
      <div className="bo-card">
        <p className="muted">
          {L('Hali yakunlangan o‘yin yo‘q.', 'No finished games yet.', 'Завершённых игр пока нет.')}
        </p>
      </div>
    );
  return (
    <div className="bo-card table-scroll">
      <table>
        <thead>
          <tr>
            <th>{L('Sana', 'Date', 'Дата')}</th>
            <th>{L('O‘yin', 'Game', 'Игра')}</th>
            <th>👥</th>
            <th>{L('G‘oliblar', 'Winners', 'Победители')}</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((r) => (
            <tr key={r.key}>
              <td>
                {dayLabel(r.d, lang, data.now)} {r.start ? khHM(r.start) : ''}
              </td>
              <td>
                {r.type === 'yz'
                  ? L('⌨️ Yozuv poygasi', '⌨️ Typing race', '⌨️ Гонка')
                  : L('⚡ Jonli test', '⚡ Live quiz', '⚡ Живой тест')}
              </td>
              <td>{r.n}</td>
              <td>
                {r.valid
                  ? r.top
                      .map(
                        (x, i) => ['🥇', '🥈', '🥉'][i] + ' ' + x.n + (x.g ? ' (' + x.g + ')' : ''),
                      )
                      .join(' · ') || '—'
                  : L(
                      'o‘tmadi: kam ishtirokchi',
                      'not held: too few players',
                      'не состоялась: мало игроков',
                    )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
