'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';
import {
  closedFeatures,
  FEATURE_INFO,
  FEATURES,
  groupLimitKey,
  READ_ONLY,
  userLimitKey,
  type Feature,
  type FeatureRule,
} from '@/lib/student-limits';
import type { HubStudent, StudentsHubView } from '@/lib/server/students-hub';
import { RemindersAdmin } from './backoffice/reminders-admin';

/* 👥 «Talabalar bilan ishlash» — guruh yoki bitta talaba bilan ishlashning yagona joyi:
   🎚 bo'limlarni ochish/yopish · 📝 amaliy baho (1–5 → reytingga ×2, ya'ni 10 ballgacha) va 🔁 testga ikkinchi urinish ·
   💎 obuna (kimda bor/yo'q, berish, muddat, bekor qilish) · 🔑 kursga ruxsat · 🎭 avatar ruxsati ·
   holat, guruh, parolni tiklash va hisobni o'chirish. Boshqa bo'limlarda bu amallar takrorlanmaydi. */

type Mode = 'group' | 'student';
type GroupTab = 'limits' | 'marks' | 'premium' | 'notes' | 'list';
const TERMS = [30, 90, 180, 365];
const INDEPENDENT = '__independent__';

export function StudentsHub() {
  const { data, lang, request, call, toast } = useApp();
  const L = useCallback((uz: string, en: string, ru: string) => tr(lang, uz, en, ru), [lang]);
  const [view, setView] = useState<StudentsHubView | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [mode, setMode] = useState<Mode>('group'),
    [group, setGroup] = useState(''),
    [tab, setTab] = useState<GroupTab>('limits'),
    [selectedId, setSelectedId] = useState(''),
    [query, setQuery] = useState(''),
    [resetUser, setResetUser] = useState<HubStudent | null>(null),
    [deleteUser, setDeleteUser] = useState<HubStudent | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=studentsHub'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load, data?.studentPasswordSetup?.completed]);
  /** Amal: mavjud server funksiyasi chaqiriladi, keyin ro'yxat yangilanadi. */
  const run = useCallback(
    async (action: string, input: unknown, key: string, done?: string) => {
      setBusy(key);
      try {
        await call(action, input);
        if (done) toast(done);
        await load();
        return true;
      } catch (e) {
        toast((e as Error).message);
        return false;
      } finally {
        setBusy('');
      }
    },
    [call, load, toast],
  );
  const students = useMemo(() => view?.students || [], [view]);
  const groups = useMemo(() => {
    const count = new Map<string, number>();
    for (const s of students)
      if (s.classId && !s.other) count.set(s.classId, (count.get(s.classId) || 0) + 1);
    for (const r of Object.values(view?.limits.g || {}))
      if (r.group && !count.has(r.group)) count.set(r.group, 0);
    return [...count.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [students, view]);
  useEffect(() => {
    if (!group && groups.length) setGroup(groups[0][0]);
  }, [group, groups]);
  const selected = students.find((s) => s.id === selectedId) || null;
  const open = (s: HubStudent) => {
    setSelectedId(s.id);
    setMode('student');
  };
  if (error)
    return (
      <section className="panel editor students-hub">
        <p role="alert" className="error-state">
          {error}
        </p>
        <Button variant="outline" onClick={load}>
          {L('Qayta urinish', 'Try again', 'Повторить')}
        </Button>
      </section>
    );
  if (!view) return <div className="skeleton h-64" />;
  const members =
    group === INDEPENDENT
      ? students.filter((s) => !s.other && s.learnerType === 'independent')
      : students.filter((s) => !s.other && s.classId === group);
  const ctx: Ctx = { view, L, lang, busy, run, open };
  return (
    <section className="panel editor students-hub" aria-labelledby="hub-title">
      <div className="section-heading">
        <div>
          <h2 id="hub-title">
            👥 {L('Talabalar bilan ishlash', 'Working with students', 'Работа со студентами')}
          </h2>
          <p className="muted">
            {L(
              'Guruh yoki bitta talabani tanlang: bo‘limlarni ochish va yopish, baho qo‘yish, obuna, kursga ruxsat va hisob — hammasi shu yerda.',
              'Pick a group or one student: open and close sections, grades, Premium, course access and the account — all here.',
              'Выберите группу или одного студента: открытие и закрытие разделов, оценки, подписка, доступ к курсам и аккаунт — всё здесь.',
            )}
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      <div className="hub-mode" role="group" aria-label={L('Kim bilan', 'Who', 'С кем')}>
        <Button
          variant={mode === 'group' ? 'default' : 'outline'}
          aria-pressed={mode === 'group'}
          onClick={() => setMode('group')}
        >
          👥 {L('Guruh bilan', 'With a group', 'С группой')}
        </Button>
        <Button
          variant={mode === 'student' ? 'default' : 'outline'}
          aria-pressed={mode === 'student'}
          onClick={() => setMode('student')}
        >
          👤 {L('Talaba bilan', 'With a student', 'Со студентом')}
        </Button>
      </div>
      {mode === 'group' ? (
        <>
          <label className="hub-pick">
            {L('Guruh', 'Group', 'Группа')}
            <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups.map(([g, n]) => (
                <option key={g} value={g}>
                  {g} · {n} {L('talaba', 'students', 'студ.')}
                </option>
              ))}
              {students.some((s) => !s.other && s.learnerType === 'independent') && (
                <option value={INDEPENDENT}>
                  {L('Mustaqil o‘quvchilar', 'Independent learners', 'Самостоятельные слушатели')}
                </option>
              )}
            </select>
          </label>
          {!groups.length && !students.length ? (
            <p className="muted">
              {data?.mode === 'demo'
                ? L(
                    'Demo muhit jonli talabalar bazasiga ulanmaydi.',
                    'The demo does not connect to the live student database.',
                    'Демо не подключается к реальной базе студентов.',
                  )
                : L('Talabalar topilmadi.', 'No students found.', 'Студенты не найдены.')}
            </p>
          ) : (
            <>
              <div className="hub-tabs" role="tablist">
                {(
                  [
                    ['limits', '🎚 ' + L('Bo‘limlar', 'Sections', 'Разделы')],
                    ['marks', '📝 ' + L('Baholar', 'Grades', 'Оценки')],
                    ...(view.admin
                      ? ([
                          ['premium', '💎 ' + L('Obuna', 'Premium', 'Подписка')],
                          ['notes', '🔔 ' + L('Eslatma', 'Reminder', 'Напоминание')],
                        ] as const)
                      : []),
                    ['list', '👤 ' + L('Talabalar', 'Students', 'Студенты')],
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
              {group === INDEPENDENT && tab === 'limits' ? (
                <p className="muted">
                  {L(
                    'Mustaqil o‘quvchilarning guruhi yo‘q — bo‘limlarni har biriga «Talaba bilan» orqali alohida yoping.',
                    'Independent learners have no group — close sections for each one under “With a student”.',
                    'У самостоятельных слушателей нет группы — закрывайте разделы каждому через «Со студентом».',
                  )}
                </p>
              ) : tab === 'limits' ? (
                <GroupLimits key={group} ctx={ctx} group={group} members={members} />
              ) : tab === 'marks' ? (
                <GroupMarks ctx={ctx} members={members} />
              ) : tab === 'premium' && view.admin ? (
                <GroupPremium ctx={ctx} members={members} />
              ) : tab === 'notes' && view.admin && group !== INDEPENDENT ? (
                <RemindersAdmin key={group} fixed={{ group }} />
              ) : (
                <StudentTable ctx={ctx} rows={members} />
              )}
            </>
          )}
        </>
      ) : selected ? (
        <StudentCard
          key={selected.id}
          ctx={ctx}
          s={selected}
          back={() => setSelectedId('')}
          resetPassword={() => setResetUser(selected)}
          remove={() => setDeleteUser(selected)}
        />
      ) : (
        <StudentSearch ctx={ctx} query={query} setQuery={setQuery} />
      )}
      {resetUser && (
        <ResetPassword
          ctx={ctx}
          u={resetUser}
          close={() => setResetUser(null)}
          done={() => {
            setResetUser(null);
            void load();
          }}
        />
      )}
      {deleteUser && (
        <DeleteStudent
          ctx={ctx}
          u={deleteUser}
          close={() => setDeleteUser(null)}
          done={() => {
            setDeleteUser(null);
            setSelectedId('');
            void load();
          }}
        />
      )}
    </section>
  );
}

type Ctx = {
  view: StudentsHubView;
  L: (uz: string, en: string, ru: string) => string;
  lang: 'uz' | 'en' | 'ru';
  busy: string;
  run: (action: string, input: unknown, key: string, done?: string) => Promise<boolean>;
  open: (s: HubStudent) => void;
};

const featureName = (f: Feature, lang: Ctx['lang']) =>
  FEATURE_INFO[f].icon + ' ' + tr(lang, FEATURE_INFO[f].uz, FEATURE_INFO[f].en, FEATURE_INFO[f].ru);
const statusOf = (s: HubStudent) =>
  s.other
    ? 'other'
    : s.legacyStatus === 'ok' || s.legacyStatus === 'blocked'
      ? s.legacyStatus
      : 'pending';
const premiumOf = (ctx: Ctx, s: HubStudent) => {
  const p = ctx.view.premium?.[s.id];
  return p && p.until > ctx.view.now ? p : null;
};
const blockedOf = (ctx: Ctx, s: HubStudent) =>
  !!ctx.view.premiumBlocked?.includes(userLimitKey(s.id));
const dateOf = (t: number, lang: Ctx['lang']) => dueText(t, lang, Date.now()).date;

/* ---------- 🎚 Bo'limlar ---------- */
function GroupLimits({ ctx, group, members }: { ctx: Ctx; group: string; members: HubStudent[] }) {
  const { L, lang, view, busy, run } = ctx;
  const saved = view.limits.g?.[groupLimitKey(group)]?.f || {};
  const [draft, setDraft] = useState<FeatureRule>(saved);
  const own = members.filter((s) => view.limits.u?.[userLimitKey(s.id)]).length;
  const isOpen = (f: Feature) => draft[f] !== false && !(f === 'tests' && draft.lessons === false);
  const changed = FEATURES.some((f) => (saved[f] !== false) !== (draft[f] !== false));
  const save = () =>
    run(
      'studentLimits',
      { op: 'set', scope: 'g', key: group, group, f: draft },
      'limits-g',
      L('Guruh bo‘limlari saqlandi', 'Group sections saved', 'Разделы группы сохранены'),
    );
  return (
    <div className="hub-block">
      <p className="muted">
        {L(
          `«${group}» guruhidagi barcha talabalar uchun. Yopilgan bo‘lim menyuda ko‘rinmaydi va server ham ochmaydi.`,
          `For every student in “${group}”. A closed section disappears from the menu and the server refuses it.`,
          `Для всех студентов группы «${group}». Закрытый раздел исчезает из меню, сервер его не открывает.`,
        )}
        {own > 0 &&
          ' ' +
            L(
              `${own} ta talabaning o‘z sozlamasi bor — u guruhnikidan ustun.`,
              `${own} students have their own setting, which wins over the group.`,
              `У ${own} студентов своя настройка — она важнее групповой.`,
            )}
      </p>
      <div className="hub-presets">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDraft(Object.fromEntries(Object.entries(READ_ONLY)) as FeatureRule)}
        >
          📖 {L('Faqat taqdimotlarni o‘qish', 'Reading only', 'Только чтение')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDraft({})}>
          🟢 {L('Hammasini ochish', 'Open everything', 'Открыть всё')}
        </Button>
      </div>
      <ul className="hub-features">
        {FEATURES.map((f) => (
          <li key={f}>
            <label>
              <input
                type="checkbox"
                role="switch"
                checked={isOpen(f)}
                disabled={f === 'tests' && draft.lessons === false}
                onChange={(e) => setDraft({ ...draft, [f]: e.target.checked ? true : false })}
              />
              <span>{featureName(f, lang)}</span>
              <em className={isOpen(f) ? 'is-open' : 'is-closed'}>
                {isOpen(f) ? L('Ochiq', 'Open', 'Открыт') : L('Yopiq', 'Closed', 'Закрыт')}
              </em>
            </label>
            {f === 'tests' && (
              <small>
                {L(
                  'Yopilsa, taqdimot 📖 o‘qish rejimida ochiladi: test ishlanadi, lekin ball berilmaydi.',
                  'When closed, presentations open in 📖 reading mode: tests can be tried, but give no points.',
                  'Если закрыт, презентации открываются в режиме 📖 чтения: тесты без баллов.',
                )}
              </small>
            )}
          </li>
        ))}
      </ul>
      <Button disabled={!changed || busy === 'limits-g'} onClick={save}>
        {L('Saqlash', 'Save', 'Сохранить')}
      </Button>
    </div>
  );
}

function StudentLimits({ ctx, s }: { ctx: Ctx; s: HubStudent }) {
  const { L, lang, view, busy, run } = ctx;
  const groupF = (s.classId && view.limits.g?.[groupLimitKey(s.classId)]?.f) || {};
  const saved = view.limits.u?.[userLimitKey(s.id)]?.f || {};
  const [draft, setDraft] = useState<FeatureRule>(saved);
  const closed = closedFeatures(
    { g: view.limits.g, u: { [userLimitKey(s.id)]: { f: draft, at: 0, by: '' } } },
    s.id,
    s.classId,
  );
  const value = (f: Feature) => (draft[f] === true ? 'on' : draft[f] === false ? 'off' : '');
  const save = () =>
    run(
      'studentLimits',
      { op: 'set', scope: 'u', key: s.id, name: s.name, group: s.classId || '', f: draft },
      'limits-u',
      L('Talaba bo‘limlari saqlandi', 'Student sections saved', 'Разделы студента сохранены'),
    );
  return (
    <div className="hub-block">
      <p className="muted">
        {L(
          '«Guruh bo‘yicha» — guruh sozlamasi amal qiladi. «Ochiq» yoki «Yopiq» — faqat shu talabaga, guruhnikidan ustun.',
          '“As the group” follows the group setting. “Open” or “Closed” applies to this student only and wins over the group.',
          '«Как в группе» — действует настройка группы. «Открыт» или «Закрыт» — только для этого студента, важнее групповой.',
        )}
      </p>
      <div className="hub-presets">
        <Button size="sm" variant="outline" onClick={() => setDraft({ ...READ_ONLY })}>
          📖 {L('Faqat taqdimotlarni o‘qish', 'Reading only', 'Только чтение')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDraft(Object.fromEntries(FEATURES.map((f) => [f, true])))}
        >
          🟢 {L('Hammasini ochish', 'Open everything', 'Открыть всё')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDraft({})}>
          👥 {L('Guruh bo‘yicha', 'As the group', 'Как в группе')}
        </Button>
      </div>
      <ul className="hub-features">
        {FEATURES.map((f) => (
          <li key={f}>
            <label>
              <span>{featureName(f, lang)}</span>
              <select
                className="input"
                aria-label={featureName(f, lang)}
                value={value(f)}
                onChange={(e) =>
                  setDraft(() => {
                    const next = { ...draft };
                    if (e.target.value === 'on') next[f] = true;
                    else if (e.target.value === 'off') next[f] = false;
                    else delete next[f];
                    return next;
                  })
                }
              >
                <option value="">
                  {L('Guruh bo‘yicha', 'As the group', 'Как в группе')} (
                  {groupF[f] === false
                    ? L('yopiq', 'closed', 'закрыт')
                    : L('ochiq', 'open', 'открыт')}
                  )
                </option>
                <option value="on">{L('Ochiq', 'Open', 'Открыт')}</option>
                <option value="off">{L('Yopiq', 'Closed', 'Закрыт')}</option>
              </select>
              <em className={closed.includes(f) ? 'is-closed' : 'is-open'}>
                {closed.includes(f) ? L('Yopiq', 'Closed', 'Закрыт') : L('Ochiq', 'Open', 'Открыт')}
              </em>
            </label>
          </li>
        ))}
      </ul>
      <Button disabled={busy === 'limits-u'} onClick={save}>
        {L('Saqlash', 'Save', 'Сохранить')}
      </Button>
    </div>
  );
}

/* ---------- 📝 Baholar ---------- */
function useTopics() {
  const { data } = useApp();
  return useMemo(
    () =>
      (data?.lessons || [])
        .filter((l) => l.courseId === 'tad-asoslari')
        .sort((a, b) => a.order - b.order),
    [data?.lessons],
  );
}
function MarkSelect({
  ctx,
  s,
  topic,
}: {
  ctx: Ctx;
  s: HubStudent;
  topic: { id: string; order: number };
}) {
  const { L, run, busy } = ctx;
  const key = 'mark' + s.id + topic.id;
  return (
    <select
      className="input"
      aria-label={
        s.name +
        ' · ' +
        L(
          topic.order + 1 + '-mavzu amaliy baho',
          'Topic ' + (topic.order + 1) + ' practical grade',
          'Тема ' + (topic.order + 1) + ': практическая оценка',
        )
      }
      disabled={busy === key || !s.legacyId}
      value={s.manualMarks?.[topic.id] || 0}
      onChange={(e) =>
        void run(
          'legacyStudent',
          { id: s.legacyId, topic: topic.id, mark: Number(e.target.value) },
          key,
          L('Saqlandi', 'Saved', 'Сохранено'),
        )
      }
    >
      <option value={0}>—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n} (+{n * 2})
        </option>
      ))}
    </select>
  );
}
function ReopenButton({
  ctx,
  s,
  topic,
}: {
  ctx: Ctx;
  s: HubStudent;
  topic: { id: string; order: number };
}) {
  const { L, lang, run } = ctx;
  if (s.learnerType === 'independent' || !s.legacyId) return null;
  const at = s.reopened?.[topic.id];
  const n = topic.order + 1;
  return (
    <button
      type="button"
      className={'roster-reopen' + (at ? ' is-on' : '')}
      aria-label={
        s.name +
        ' · ' +
        L(
          n + '-mavzu testiga ikkinchi urinish',
          'Second attempt at the topic ' + n + ' test',
          'Вторая попытка по тесту темы ' + n,
        )
      }
      title={
        at
          ? L('Berilgan: ', 'Given: ', 'Выдано: ') + dateOf(at, lang)
          : L('Testga ikkinchi urinish berish', 'Give a second test attempt', 'Дать вторую попытку')
      }
      onClick={() => {
        if (
          !confirm(
            L(
              `${s.name}: ${n}-mavzu testiga ikkinchi urinish berilsinmi?\n(2 ta yangi ball beriladigan urinish)`,
              `${s.name}: give a second attempt at the topic ${n} test?\n(2 new scored attempts)`,
              `${s.name}: дать вторую попытку по тесту темы ${n}?\n(2 новые попытки с баллами)`,
            ),
          )
        )
          return;
        void run(
          'legacyStudent',
          { id: s.legacyId, reopen: topic.id },
          'reopen' + s.id + topic.id,
          '🔁 ' +
            L(
              'Ikkinchi urinish berildi — talaba sahifasini yangilasin',
              'Second attempt given — the student should reload the page',
              'Вторая попытка выдана — студенту нужно обновить страницу',
            ),
        );
      }}
    >
      🔁
    </button>
  );
}
function GroupMarks({ ctx, members }: { ctx: Ctx; members: HubStudent[] }) {
  const { L } = ctx;
  const topics = useTopics();
  const [topicId, setTopicId] = useState('');
  const topic = topics.find((t) => t.id === topicId) || topics[0];
  if (!topic) return null;
  return (
    <div className="hub-block">
      <p className="muted">
        {L(
          'Kunlik mavzu bo‘yicha amaliy baho: 1–5 baho reytingga ×2 qo‘shiladi (5 baho = 10 ball). 🔁 — testga ikkinchi urinish (2 ta yangi ball beriladigan urinish).',
          'Practical grade for the day’s topic: a 1–5 grade adds ×2 to the ranking (5 = 10 points). 🔁 gives a second test attempt (2 new scored attempts).',
          'Практическая оценка по теме дня: оценка 1–5 добавляет ×2 к рейтингу (5 = 10 баллов). 🔁 — вторая попытка теста (2 новые попытки с баллами).',
        )}
      </p>
      <label className="hub-pick">
        {L('Mavzu', 'Topic', 'Тема')}
        <select className="input" value={topic.id} onChange={(e) => setTopicId(e.target.value)}>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.order + 1}. {t.title}
            </option>
          ))}
        </select>
      </label>
      <div className="academic-table hub-table">
        <table>
          <thead>
            <tr>
              <th>{L('Talaba', 'Student', 'Студент')}</th>
              <th>{L('Avtomatik baho', 'Automatic grade', 'Авто-оценка')}</th>
              <th>{L('Amaliy baho', 'Practical grade', 'Практическая оценка')}</th>
              <th>{L('Ball (jami)', 'Points (total)', 'Баллы (всего)')}</th>
              <th>🔁</th>
            </tr>
          </thead>
          <tbody>
            {members.map((s) => (
              <tr key={s.id}>
                <td>
                  <button type="button" className="hub-link" onClick={() => ctx.open(s)}>
                    {s.name}
                  </button>
                </td>
                <td>{s.academicTopics?.[topic.id]?.b || '—'}</td>
                <td>
                  <MarkSelect ctx={ctx} s={s} topic={topic} />
                </td>
                <td>
                  <b>{s.academicPoints || 0}</b>
                </td>
                <td>
                  <ReopenButton ctx={ctx} s={s} topic={topic} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 💎 Obuna ---------- */
function PremiumActions({ ctx, s, compact }: { ctx: Ctx; s: HubStudent; compact?: boolean }) {
  const { L, lang, busy, run } = ctx;
  const p = premiumOf(ctx, s);
  const blocked = blockedOf(ctx, s);
  const [days, setDays] = useState(30);
  const termText = (d: number) =>
    d % 365 === 0
      ? d / 365 + ' ' + L('yil', 'year', 'год')
      : d % 30 === 0
        ? d / 30 + ' ' + L('oy', 'month', 'мес.')
        : d + ' ' + L('kun', 'days', 'дн.');
  const grant = () =>
    run(
      'premiumAdmin',
      { op: 'grant', uid: s.id, name: s.name, group: s.classId || '', days },
      'pg' + s.id,
      '💎 ' + L('Obuna berildi', 'Premium granted', 'Подписка выдана'),
    );
  const cancel = (block: boolean) => {
    if (
      !confirm(
        block
          ? L(
              s.name +
                ' obunadan chiqarilsinmi?\n\nObuna darhol yopiladi va u o‘zi qayta obuna bo‘la olmaydi (faqat siz ochasiz).',
              'Remove ' +
                s.name +
                ' from Premium?\n\nIt closes at once and they cannot subscribe again by themselves.',
              'Убрать ' +
                s.name +
                ' из подписки?\n\nПодписка закроется сразу, сам подписаться снова не сможет.',
            )
          : L(
              s.name + ' obunasi bekor qilinsinmi?',
              'Cancel the Premium of ' + s.name + '?',
              'Отменить подписку ' + s.name + '?',
            ),
      )
    )
      return;
    void run(
      'premiumAdmin',
      block ? { op: 'remove', uid: s.id } : { op: 'revoke', uid: s.id },
      'pr' + s.id,
      '✖ ' + s.name + ': ' + L('obuna yopildi', 'Premium closed', 'подписка закрыта'),
    );
  };
  return (
    <div className={'hub-premium' + (compact ? ' is-compact' : '')}>
      <span className={p ? 'is-open' : 'is-closed'}>
        {p
          ? '💎 ' +
            dateOf(p.until, lang) +
            L(' gacha', '', '') +
            (!compact
              ? ' · ' +
                L('boshlangan: ', 'since ', 'с ') +
                dateOf(p.since, lang) +
                (p.paid
                  ? ' · ' +
                    L('to‘lagan: ', 'paid: ', 'оплачено: ') +
                    p.paid.toLocaleString('ru-RU') +
                    L(' so‘m', ' UZS', ' сум')
                  : '')
              : '')
          : blocked
            ? '🚫 ' + L('chiqarilgan', 'removed', 'удалён')
            : L('Obuna yo‘q', 'No Premium', 'Нет подписки')}
      </span>
      <select
        className="input"
        aria-label={s.name + ' · ' + L('obuna muddati', 'Premium term', 'срок подписки')}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
      >
        {TERMS.map((d) => (
          <option key={d} value={d}>
            {termText(d)}
          </option>
        ))}
      </select>
      <Button size="sm" disabled={busy === 'pg' + s.id} onClick={() => void grant()}>
        {p ? L('Uzaytirish', 'Extend', 'Продлить') : L('Obuna berish', 'Give Premium', 'Выдать')}
      </Button>
      {p && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === 'pt' + s.id}
            title={L(
              'Muddat obuna boshlangan kundan hisoblanadi: masalan, 1 oylik obunani «1 yil» qilsangiz, boshlangan kunidan 1 yil amal qiladi.',
              'The term counts from the start date: e.g. 1 month → “1 year” lasts a year from the start.',
              'Срок считается от даты начала: например, 1 месяц → «1 год» действует год с начала.',
            )}
            onClick={() =>
              void run(
                'premiumAdmin',
                { op: 'term', uid: s.id, days },
                'pt' + s.id,
                '💎 ' + L('Muddat o‘zgardi', 'Term changed', 'Срок изменён'),
              )
            }
          >
            {L('Muddatni shunday qilish', 'Set this term', 'Сделать такой срок')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === 'pr' + s.id}
            onClick={() => cancel(false)}
          >
            {L('Bekor qilish', 'Cancel', 'Отменить')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === 'pr' + s.id}
            title={L(
              'To‘lov topilmadi — obuna yopiladi va o‘zi qayta obuna bo‘la olmaydi',
              'Payment not found — Premium closes and they cannot subscribe again by themselves',
              'Оплата не найдена — подписка закрывается, сам подписаться снова не сможет',
            )}
            onClick={() => cancel(true)}
          >
            🚫 {L('Chiqarib tashlash', 'Remove', 'Исключить')}
          </Button>
        </>
      )}
      {blocked && !p && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy === 'pu' + s.id}
          onClick={() =>
            void run(
              'premiumAdmin',
              { op: 'unblock', key: userLimitKey(s.id) },
              'pu' + s.id,
              L('Qayta obuna bo‘la oladi', 'May subscribe again', 'Может снова подписаться'),
            )
          }
        >
          {L('Blokdan chiqarish', 'Unblock', 'Разблокировать')}
        </Button>
      )}
    </div>
  );
}
function GroupPremium({ ctx, members }: { ctx: Ctx; members: HubStudent[] }) {
  const { L } = ctx;
  const subs = members.filter((s) => premiumOf(ctx, s)).length;
  return (
    <div className="hub-block">
      <p className="muted">
        {L(
          `${members.length} ta talabadan ${subs} tasida obuna bor. Bu yerda obuna berasiz, uzaytirasiz yoki bekor qilasiz. To‘lov cheklari — «To‘lovlar» bo‘limida.`,
          `${subs} of ${members.length} students have Premium. Give, extend or cancel it here. Payment receipts are under “Payments”.`,
          `Подписка у ${subs} из ${members.length} студентов. Здесь можно выдать, продлить или отменить. Чеки — в разделе «Платежи».`,
        )}
      </p>
      <div className="academic-table hub-table">
        <table>
          <thead>
            <tr>
              <th>{L('Talaba', 'Student', 'Студент')}</th>
              <th>{L('Obuna', 'Premium', 'Подписка')}</th>
            </tr>
          </thead>
          <tbody>
            {[...members]
              .sort((a, b) => Number(!!premiumOf(ctx, b)) - Number(!!premiumOf(ctx, a)))
              .map((s) => (
                <tr key={s.id}>
                  <td>
                    <button type="button" className="hub-link" onClick={() => ctx.open(s)}>
                      {s.name}
                    </button>
                  </td>
                  <td>
                    <PremiumActions ctx={ctx} s={s} compact />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- 👤 Talabalar ro'yxati va qidiruv ---------- */
function StatusSelect({ ctx, s }: { ctx: Ctx; s: HubStudent }) {
  const { L, run, busy } = ctx;
  const st = statusOf(s);
  if (st === 'other')
    return <span className="muted">{L('Boshqa hisob', 'Other account', 'Другой аккаунт')}</span>;
  return (
    <select
      className="input"
      aria-label={L('Holat', 'Status', 'Статус') + ' ' + s.name}
      value={st}
      disabled={busy === 'st' + s.id}
      onChange={(e) =>
        void run(
          'legacyStudent',
          { id: s.legacyId, status: e.target.value },
          'st' + s.id,
          L('Saqlandi', 'Saved', 'Сохранено'),
        )
      }
    >
      {st === 'pending' && (
        <option value="pending" disabled>
          {L('Tasdiq kutilmoqda', 'Awaiting approval', 'Ожидает подтверждения')}
        </option>
      )}
      <option value="ok">{L('Faol', 'Active', 'Активен')}</option>
      <option value="blocked">{L('Bloklangan', 'Blocked', 'Заблокирован')}</option>
    </select>
  );
}
function StudentTable({ ctx, rows }: { ctx: Ctx; rows: HubStudent[] }) {
  const { L, view } = ctx;
  return (
    <div className="academic-table hub-table">
      <table>
        <thead>
          <tr>
            <th>{L('Talaba', 'Student', 'Студент')}</th>
            <th>{L('Guruh', 'Group', 'Группа')}</th>
            <th>{L('Ball', 'Points', 'Баллы')}</th>
            <th>{L('Holat', 'Status', 'Статус')}</th>
            {view.admin && <th>💎</th>}
            <th>🎚</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const closed = closedFeatures(view.limits, s.id, s.classId);
            return (
              <tr key={s.id}>
                <td>
                  <button type="button" className="hub-link" onClick={() => ctx.open(s)}>
                    {s.name}
                  </button>
                  {s.email && <small>{s.email}</small>}
                </td>
                <td>
                  {s.learnerType === 'independent'
                    ? L('Mustaqil', 'Independent', 'Самост.')
                    : s.classId || '—'}
                </td>
                <td>{s.other ? '—' : s.academicPoints || 0}</td>
                <td>
                  <StatusSelect ctx={ctx} s={s} />
                </td>
                {view.admin && <td>{premiumOf(ctx, s) ? '💎' : '—'}</td>}
                <td>
                  {closed.length
                    ? closed.map((f) => FEATURE_INFO[f].icon).join(' ') +
                      ' ' +
                      L('yopiq', 'closed', 'закрыто')
                    : L('hammasi ochiq', 'all open', 'всё открыто')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function StudentSearch({
  ctx,
  query,
  setQuery,
}: {
  ctx: Ctx;
  query: string;
  setQuery: (v: string) => void;
}) {
  const { L, view } = ctx;
  const q = query.trim().toLocaleLowerCase();
  const rows = view.students
    .filter((s) =>
      (s.name + ' ' + (s.classId || '') + ' ' + (s.email || '')).toLocaleLowerCase().includes(q),
    )
    .slice(0, 40);
  return (
    <div className="hub-block">
      <input
        className="input"
        autoFocus
        aria-label={L('Talabani qidirish', 'Search students', 'Поиск студентов')}
        placeholder={L(
          'Ism, familiya, guruh yoki email',
          'Name, surname, group or email',
          'Имя, фамилия, группа или email',
        )}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="muted">
        {L(
          `${view.students.length} ta hisob. Talabani bosing — uning hamma sozlamasi ochiladi.`,
          `${view.students.length} accounts. Click a student to open all of their settings.`,
          `${view.students.length} аккаунтов. Нажмите на студента, чтобы открыть все его настройки.`,
        )}
      </p>
      <StudentTable ctx={ctx} rows={rows} />
    </div>
  );
}

/* ---------- 👤 Bitta talaba ---------- */
function StudentCard({
  ctx,
  s,
  back,
  resetPassword,
  remove,
}: {
  ctx: Ctx;
  s: HubStudent;
  back: () => void;
  resetPassword: () => void;
  remove: () => void;
}) {
  const { L, lang, view, run, busy } = ctx;
  const topics = useTopics();
  const allowed = !!view.avatarAllow?.includes(s.id);
  const legacy = !!s.legacyId && !s.other;
  return (
    <div className="hub-student">
      <Button variant="outline" size="sm" onClick={back}>
        ← {L('Talabalar ro‘yxati', 'Student list', 'Список студентов')}
      </Button>
      <header className="hub-student-head">
        <h3>{s.name}</h3>
        <p>
          {s.learnerType === 'independent'
            ? L('Mustaqil o‘quvchi', 'Independent learner', 'Самостоятельный слушатель')
            : s.classId || '—'}
          {legacy && ' · ' + (s.academicPoints || 0) + ' ' + L('ball', 'points', 'баллов')}
          {s.email && ' · ' + s.email}
          {!!s.legacyRegisteredAt &&
            ' · ' +
              L('ro‘yxatdan o‘tgan', 'registered', 'зарегистрирован') +
              ' ' +
              dateOf(s.legacyRegisteredAt, lang)}
        </p>
      </header>
      <section className="hub-card">
        <h4>🪪 {L('Hisob', 'Account', 'Аккаунт')}</h4>
        <div className="hub-row">
          <label>
            {L('Holat', 'Status', 'Статус')}
            <StatusSelect ctx={ctx} s={s} />
          </label>
          {legacy && (
            <label>
              {L('Guruh', 'Group', 'Группа')}
              <input
                className="input"
                aria-label={L('Guruh', 'Group', 'Группа') + ' ' + s.name}
                defaultValue={s.classId}
                disabled={s.learnerType === 'independent' || busy === 'gr' + s.id}
                onBlur={(e) => {
                  if (e.target.value.trim() !== (s.classId || ''))
                    void run(
                      'legacyStudent',
                      { id: s.legacyId, group: e.target.value.trim() },
                      'gr' + s.id,
                      L('Saqlandi', 'Saved', 'Сохранено'),
                    );
                }}
              />
            </label>
          )}
        </div>
        {view.admin && legacy && (
          <div className="hub-row">
            <Button variant="outline" size="sm" onClick={resetPassword}>
              {L('Parolni tiklash', 'Reset password', 'Сбросить пароль')}
            </Button>
            <Button variant="outline" size="sm" onClick={remove}>
              {L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}
            </Button>
          </div>
        )}
      </section>
      <section className="hub-card">
        <h4>🎚 {L('Bo‘limlar', 'Sections', 'Разделы')}</h4>
        <StudentLimits ctx={ctx} s={s} />
      </section>
      {legacy && s.learnerType !== 'independent' && (
        <section className="hub-card">
          <h4>📝 {L('Baholar', 'Grades', 'Оценки')}</h4>
          <p className="muted">
            {L(
              'Amaliy baho 1–5 reytingga ×2 qo‘shiladi (5 baho = 10 ball). 🔁 — testga ikkinchi urinish.',
              'A 1–5 practical grade adds ×2 to the ranking (5 = 10 points). 🔁 gives a second test attempt.',
              'Практическая оценка 1–5 добавляет ×2 к рейтингу (5 = 10 баллов). 🔁 — вторая попытка теста.',
            )}
          </p>
          <div className="academic-topic-grid">
            {topics.map((l) => {
              const h = s.readingHistory?.[l.id];
              return (
                <article className="academic-topic-card" key={l.id}>
                  <h3>
                    {l.order + 1}. {l.title}
                  </h3>
                  <p>
                    {h?.status === 'read'
                      ? L('O‘qib chiqilgan', 'Read', 'Прочитано')
                      : h?.status === 'started'
                        ? L('Boshlangan', 'In progress', 'Начато')
                        : L('Boshlanmagan', 'Not started', 'Не начато')}
                  </p>
                  <div>
                    <span>{L('O‘qilgan slaydlar', 'Slides read', 'Прочитано слайдов')}</span>
                    <b>
                      {h?.seenSlides || 0} / {l.slideCount}
                    </b>
                  </div>
                  <div>
                    <span>{L('Ball', 'Points', 'Баллы')}</span>
                    <b>{h?.score ?? 0}</b>
                  </div>
                  <div>
                    <span>{L('Avtomatik baho', 'Automatic grade', 'Авто-оценка')}</span>
                    <b>{s.academicTopics?.[l.id]?.b || h?.grade || '—'}</b>
                  </div>
                  <div>
                    <span>{L('Amaliy baho', 'Practical grade', 'Практическая оценка')}</span>
                    <MarkSelect ctx={ctx} s={s} topic={l} />
                  </div>
                  <div className="roster-reopen-row">
                    {s.reopened?.[l.id] && (
                      <small>
                        🔁 {L('berilgan:', 'given:', 'выдано:')} {dateOf(s.reopened[l.id], lang)}
                      </small>
                    )}
                    <ReopenButton ctx={ctx} s={s} topic={l} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {view.admin && (
        <section className="hub-card">
          <h4>💎 {L('Obuna', 'Premium', 'Подписка')}</h4>
          <PremiumActions ctx={ctx} s={s} />
        </section>
      )}
      {view.admin && (
        <section className="hub-card">
          <h4>🔔 {L('Eslatma', 'Reminder', 'Напоминание')}</h4>
          <p className="muted">
            {L(
              'Faqat shu talabaning bosh sahifasidagi «Eslatmalar»da chiqadi.',
              'Shown only in this student’s home page “Reminders”.',
              'Показывается только в «Напоминаниях» на главной этого студента.',
            )}
          </p>
          <RemindersAdmin fixed={{ user: { id: s.id, name: s.name } }} />
        </section>
      )}
      {view.admin && !!view.courses?.length && (
        <section className="hub-card">
          <h4>🔑 {L('Kursga ruxsat', 'Course access', 'Доступ к курсам')}</h4>
          <ul className="hub-courses">
            {view.courses.map((c) => {
              const viaGroup = !c.paid && s.learnerType === 'university' && !!s.classId && !s.other;
              const granted = c.grants.includes(s.id);
              return (
                <li key={c.id}>
                  <span>{c.title}</span>
                  <em className={viaGroup || granted ? 'is-open' : 'is-closed'}>
                    {viaGroup
                      ? L('Ochiq (guruh orqali)', 'Open (via group)', 'Открыт (через группу)')
                      : granted
                        ? L('Ruxsat berilgan', 'Granted', 'Доступ выдан')
                        : L('Ruxsat yo‘q', 'No access', 'Нет доступа')}
                  </em>
                  {!viaGroup && (
                    <Button
                      size="sm"
                      variant={granted ? 'outline' : 'default'}
                      disabled={busy === 'c' + c.id + s.id}
                      onClick={() =>
                        void run(
                          'courseAccessAdmin',
                          granted
                            ? { op: 'revoke', uid: s.id, course: c.id }
                            : { op: 'grantUser', uid: s.id, name: s.name, course: c.id },
                          'c' + c.id + s.id,
                          granted
                            ? L('Ruxsat olib tashlandi', 'Access removed', 'Доступ снят')
                            : L('Ruxsat berildi', 'Access granted', 'Доступ выдан'),
                        )
                      }
                    >
                      {granted
                        ? L('Ruxsatni olish', 'Remove access', 'Снять доступ')
                        : L('Ruxsat berish', 'Grant access', 'Выдать доступ')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {view.admin && (
        <section className="hub-card">
          <h4>🎭 {L('Avatar', 'Avatar', 'Аватар')}</h4>
          <label className="hub-check">
            <input
              type="checkbox"
              checked={allowed}
              disabled={busy === 'av' + s.id}
              onChange={(e) =>
                void run(
                  'avatarAdmin',
                  { op: 'allow', student: s.id, allow: e.target.checked },
                  'av' + s.id,
                  e.target.checked
                    ? L(
                        'Avatar tanlashga ruxsat berildi',
                        'May choose an avatar',
                        'Может выбрать аватар',
                      )
                    : L('Avatar ruxsati olindi', 'Avatar permission removed', 'Разрешение снято'),
                )
              }
            />{' '}
            {L(
              'Avatar tanlashga ruxsat (reytingdagi o‘rni va obunadan qat’i nazar)',
              'May choose an avatar (regardless of rank or Premium)',
              'Может выбрать аватар (независимо от места и подписки)',
            )}
          </label>
        </section>
      )}
    </div>
  );
}

/* ---------- 🔐 Parol va o'chirish ---------- */
function ResetPassword({
  ctx,
  u,
  close,
  done,
}: {
  ctx: Ctx;
  u: HubStudent;
  close: () => void;
  done: () => void;
}) {
  const { L } = ctx;
  const { call, toast } = useApp();
  const [password, setPassword] = useState('1111'),
    [show, setShow] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="modal-backdrop">
      <form
        className="panel roster-reset"
        role="dialog"
        aria-modal="true"
        aria-label={L(
          'Talaba parolini tiklash',
          'Reset the student’s password',
          'Сброс пароля студента',
        )}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await call('legacyResetPassword', { id: u.legacyId, password });
            toast(
              L(
                'Parol yangilandi. Talaba ism-familiyasi va yangi paroli bilan kiradi. Ballari saqlandi.',
                'Password updated. The student signs in with their name and the new password. Points are kept.',
                'Пароль обновлён. Студент входит по имени и новому паролю. Баллы сохранены.',
              ),
            );
            done();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{L('Parolni tiklash', 'Reset password', 'Сбросить пароль')}</h2>
        <p>
          <strong>{u.name}</strong> · {u.classId || '—'}
        </p>
        <p className="muted">
          {L(
            'Ballar va bajarilgan ishlar saqlanadi. 1111 bilan kirishni yoqish shaxsiy kodni saqlaydi. Asosiy parolni almashtirish uchun kamida 8 belgili boshqa parol kiriting.',
            'Points and completed work are kept. Enabling sign-in with 1111 keeps the personal code. To replace the main password, enter another one with at least 8 characters.',
            'Баллы и работы сохраняются. Вход с кодом 1111 сохраняет личный код. Чтобы заменить основной пароль, введите другой — не короче 8 символов.',
          )}
        </p>
        <label>
          {L('Yangi parol', 'New password', 'Новый пароль')}
          <input
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={4}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />{' '}
          {L('Parolni ko‘rsatish', 'Show password', 'Показать пароль')}
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="roster-pagination">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>
            {L('Bekor qilish', 'Cancel', 'Отмена')}
          </Button>
          <Button type="submit" disabled={busy}>
            {L('Yangi parolni saqlash', 'Save new password', 'Сохранить пароль')}
          </Button>
        </div>
      </form>
    </div>
  );
}
function DeleteStudent({
  ctx,
  u,
  close,
  done,
}: {
  ctx: Ctx;
  u: HubStudent;
  close: () => void;
  done: () => void;
}) {
  const { L } = ctx;
  const { call, toast } = useApp();
  const [confirmation, setConfirmation] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="modal-backdrop">
      <form
        className="panel roster-reset"
        role="dialog"
        aria-modal="true"
        aria-label={L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await call('legacyDeleteStudent', { id: u.legacyId, confirmation });
            toast(
              L(
                'Talaba ro‘yxatdan o‘chirildi.',
                'The student was removed from the list.',
                'Студент удалён из списка.',
              ),
            );
            done();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}</h2>
        <p>
          <strong>{u.name}</strong> · {u.classId || '—'}
        </p>
        <p>
          {L(
            'Hisob ro‘yxatdan olib tashlanadi va unga kirish yopiladi. O‘quv natijalarining arxiv nusxasi saqlanadi.',
            'The account is removed from the list and can no longer sign in. An archive copy of the results is kept.',
            'Аккаунт удаляется из списка, вход закрывается. Архивная копия результатов сохраняется.',
          )}
        </p>
        <label>
          {L(
            'Tasdiqlash uchun ism-familiya',
            'Type the full name to confirm',
            'Для подтверждения введите имя и фамилию',
          )}
          <input
            className="input"
            required
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="roster-pagination">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>
            {L('Bekor qilish', 'Cancel', 'Отмена')}
          </Button>
          <Button type="submit" disabled={busy || confirmation.trim() !== u.name.trim()}>
            {L('Hisobni o‘chirish', 'Delete account', 'Удалить аккаунт')}
          </Button>
        </div>
      </form>
    </div>
  );
}
