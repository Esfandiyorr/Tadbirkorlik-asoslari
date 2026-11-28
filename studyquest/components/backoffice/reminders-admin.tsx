'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useAdminView, useL } from './common';
import {
  REMINDER_TEXT_MAX,
  forEveryone,
  type Reminder,
  type Reminders,
  type ReminderUser,
} from '@/lib/reminders';

/* 🔔 Bosh sahifadagi «Eslatmalar»da nima chiqishini boshqarish: o'z qisqa eslatmalaringiz (matn, havola, muddat)
   — hammaga, tanlangan guruhlarga yoki tanlangan talabalarga — va avtomatik eslatmalar (bugungi mavzular,
   jonli o'yin). «Sayt boshqaruvi → 📢 E'lonlar»da to'liq, «👥 Talabalar bilan ishlash»da esa shu guruh yoki
   talaba uchun (fixed) ishlatiladi — bitta komponent, bitta server funksiyasi. */
const tashkentInput = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 16);
const fromTashkent = (v: string) => (v ? Date.parse(v + ':00Z') - 18000000 : 0);
type Targets = {
  groups: { name: string; n: number }[];
  students: { id: string; name: string; group: string }[];
};
type Audience = 'all' | 'groups' | 'users';
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function RemindersAdmin({
  fixed,
}: {
  /** «Talabalar bilan ishlash»dan: eslatma faqat shu guruh yoki talabaga (ro'yxat ham faqat ularniki) */
  fixed?: { group?: string; user?: ReminderUser };
}) {
  const L = useL();
  const { request } = useApp();
  const { data, error, busy, act } = useAdminView<Reminders>('reminders', 'reminders');
  const [form, setForm] = useState({ t: '', link: '', until: '' }),
    [audience, setAudience] = useState<Audience>('all'),
    [groups, setGroups] = useState<string[]>([]),
    [users, setUsers] = useState<ReminderUser[]>([]),
    [q, setQ] = useState(''),
    [targets, setTargets] = useState<Targets | null>(null);
  // guruh va talabalar ro'yxati — kimga yuborishni tanlaganda bir marta yuklanadi
  useEffect(() => {
    if (fixed || audience === 'all' || targets) return;
    let live = true;
    request('/api/platform?view=reminderTargets')
      .then((r) => (r.ok ? r.json() : { groups: [], students: [] }))
      .then((v) => live && setTargets(v))
      .catch(() => live && setTargets({ groups: [], students: [] }));
    return () => {
      live = false;
    };
  }, [fixed, audience, targets, request]);
  const found = useMemo(() => {
    const n = q.trim().toLocaleLowerCase();
    if (n.length < 2 || !targets) return [];
    return targets.students
      .filter(
        (s) =>
          !users.some((u) => u.id === s.id) &&
          (s.name + ' ' + s.group).toLocaleLowerCase().includes(n),
      )
      .slice(0, 8);
  }, [q, targets, users]);
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-32" />;
  const items = fixed
    ? data.items.filter(
        (r) =>
          (fixed.group && r.groups?.some((g) => same(g, fixed.group!))) ||
          (fixed.user && r.users?.some((u) => u.id === fixed.user!.id)),
      )
    : data.items;
  const whom = (r: Reminder) =>
    forEveryone(r)
      ? L('Hammaga', 'Everyone', 'Всем')
      : [
          r.groups?.length ? '👥 ' + r.groups.join(', ') : '',
          r.users?.length ? '👤 ' + r.users.map((u) => u.name).join(', ') : '',
        ]
          .filter(Boolean)
          .join(' · ');
  const target = fixed
    ? fixed.group
      ? { groups: [fixed.group] }
      : { users: [fixed.user!] }
    : audience === 'groups'
      ? { groups }
      : audience === 'users'
        ? { users }
        : {};
  const ready =
    form.t.trim().length >= 2 &&
    (!!fixed ||
      audience === 'all' ||
      (audience === 'groups' && groups.length > 0) ||
      (audience === 'users' && users.length > 0));
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    try {
      await act(
        {
          op: 'add',
          t: form.t.trim(),
          ...(form.link.trim() ? { link: form.link.trim() } : {}),
          ...(form.until ? { until: fromTashkent(form.until) } : {}),
          ...target,
        },
        'add',
        L('Eslatma qo‘shildi', 'Reminder added', 'Напоминание добавлено'),
      );
      setForm({ t: '', link: '', until: '' });
    } catch {}
  };
  const auto = (k: 'topics' | 'live', on: boolean) =>
    void act({ op: 'auto', [k]: on }, 'auto-' + k, L('Saqlandi', 'Saved', 'Сохранено')).catch(
      () => {},
    );
  return (
    <section className={'bo-card reminders-admin' + (fixed ? ' is-fixed' : '')}>
      {!fixed && (
        <>
          <h3>
            🔔 {L('Bosh sahifadagi eslatmalar', 'Home page reminders', 'Напоминания на главной')}
          </h3>
          <p className="bo-hint">
            {L(
              'Bosh sahifadagi binafsha bannerda «Eslatmalar» bir nechta soniyada almashib turadi. Eslatmani hammaga, tanlangan guruhlarga yoki tanlangan talabalarga yozasiz — boshqalar uni ko‘rmaydi.',
              'The “Reminders” on the purple home banner change every few seconds. Write a reminder for everyone, chosen groups or chosen students — nobody else sees it.',
              '«Напоминания» на фиолетовом баннере главной меняются каждые несколько секунд. Пишите всем, выбранным группам или студентам — другие их не увидят.',
            )}
          </p>
          <div className="reminders-auto">
            <label>
              <input
                type="checkbox"
                checked={data.auto.topics}
                disabled={!!busy}
                onChange={(e) => auto('topics', e.target.checked)}
              />{' '}
              📝{' '}
              {L(
                'Bugun muddati tugaydigan, ball beriladigan mavzular (avtomatik)',
                'Topics whose points end today (automatic)',
                'Темы, баллы по которым заканчиваются сегодня (авто)',
              )}
            </label>
            <label>
              <input
                type="checkbox"
                checked={data.auto.live}
                disabled={!!busy}
                onChange={(e) => auto('live', e.target.checked)}
              />{' '}
              ⚡{' '}
              {L(
                'Bugungi jonli test, poyga yoki yozuv marafoni (avtomatik)',
                'Today’s live quiz, race or typing race (automatic)',
                'Сегодняшний живой тест, гонка или марафон (авто)',
              )}
            </label>
          </div>
        </>
      )}
      <ul className="bo-list reminders-list">
        {items.map((r) => (
          <li key={r.id}>
            <div>
              <b>{r.t}</b>
              <small>
                {[
                  whom(r),
                  r.link ? '🔗 ' + r.link : '',
                  r.until
                    ? L('⏳ gacha: ', '⏳ until: ', '⏳ до: ') +
                      tashkentInput(r.until).replace('T', ' ')
                    : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!!busy}
              aria-label={
                L('Eslatmani o‘chirish', 'Delete reminder', 'Удалить напоминание') + ': ' + r.t
              }
              onClick={() =>
                void act(
                  { op: 'remove', id: r.id },
                  'rm' + r.id,
                  L('Eslatma o‘chirildi', 'Reminder deleted', 'Напоминание удалено'),
                ).catch(() => {})
              }
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
        {!items.length && (
          <li className="muted">
            {fixed
              ? L(
                  'Bu yerga atalgan eslatma yo‘q.',
                  'No reminders addressed here.',
                  'Адресных напоминаний нет.',
                )
              : L(
                  'Hozircha o‘zingiz yozgan eslatma yo‘q.',
                  'No reminders of your own yet.',
                  'Своих напоминаний пока нет.',
                )}
          </li>
        )}
      </ul>
      <form className="bo-form" onSubmit={(e) => void add(e)}>
        <h4>
          ➕{' '}
          {fixed?.group
            ? L(
                `«${fixed.group}» guruhiga eslatma`,
                `Reminder for “${fixed.group}”`,
                `Напоминание группе «${fixed.group}»`,
              )
            : fixed?.user
              ? L(
                  `${fixed.user.name}ga eslatma`,
                  `Reminder for ${fixed.user.name}`,
                  `Напоминание: ${fixed.user.name}`,
                )
              : L('Yangi eslatma', 'New reminder', 'Новое напоминание')}
        </h4>
        <label>
          {L('Qisqa matn', 'Short text', 'Короткий текст')} ({form.t.length}/{REMINDER_TEXT_MAX})
          <input
            className="input"
            required
            minLength={2}
            maxLength={REMINDER_TEXT_MAX}
            value={form.t}
            onChange={(e) => setForm({ ...form, t: e.target.value })}
            placeholder={L(
              'Masalan: Ertaga 9:00 da amaliy mashg‘ulot',
              'E.g. Practical class tomorrow at 9:00',
              'Например: Завтра в 9:00 практическое занятие',
            )}
          />
        </label>
        {!fixed && (
          <fieldset className="reminders-audience">
            <legend>{L('Kimga', 'To whom', 'Кому')}</legend>
            {(
              [
                ['all', L('Hammaga', 'Everyone', 'Всем')],
                ['groups', '👥 ' + L('Guruhlarga', 'Groups', 'Группам')],
                ['users', '👤 ' + L('Talabalarga', 'Students', 'Студентам')],
              ] as const
            ).map(([id, label]) => (
              <label key={id}>
                <input
                  type="radio"
                  name="rem-audience"
                  checked={audience === id}
                  onChange={() => setAudience(id)}
                />{' '}
                {label}
              </label>
            ))}
          </fieldset>
        )}
        {!fixed && audience === 'groups' && (
          <div
            className="reminders-pick"
            role="group"
            aria-label={L('Guruhlar', 'Groups', 'Группы')}
          >
            {!targets ? (
              <span className="muted">{L('Yuklanmoqda…', 'Loading…', 'Загрузка…')}</span>
            ) : targets.groups.length ? (
              targets.groups.map((g) => (
                <label key={g.name} className={groups.includes(g.name) ? 'is-on' : ''}>
                  <input
                    type="checkbox"
                    checked={groups.includes(g.name)}
                    onChange={(e) =>
                      setGroups((cur) =>
                        e.target.checked ? [...cur, g.name] : cur.filter((x) => x !== g.name),
                      )
                    }
                  />{' '}
                  {g.name} <small>({g.n})</small>
                </label>
              ))
            ) : (
              <span className="muted">
                {L('Guruhlar topilmadi.', 'No groups found.', 'Группы не найдены.')}
              </span>
            )}
          </div>
        )}
        {!fixed && audience === 'users' && (
          <div className="reminders-users">
            {!!users.length && (
              <ul className="reminders-chips">
                {users.map((u) => (
                  <li key={u.id}>
                    {u.name}
                    <button
                      type="button"
                      aria-label={L('Olib tashlash', 'Remove', 'Убрать') + ': ' + u.name}
                      onClick={() => setUsers((cur) => cur.filter((x) => x.id !== u.id))}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label>
              {L('Talabani qidiring', 'Find a student', 'Найдите студента')}
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={L('Ism yoki guruh', 'Name or group', 'Имя или группа')}
              />
            </label>
            {!!found.length && (
              <ul className="bo-pick">
                {found.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsers((cur) => [...cur, { id: s.id, name: s.name }]);
                        setQ('');
                      }}
                    >
                      <b>{s.name}</b>
                      <small>{s.group || '—'}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="bo-row">
          <label>
            {L('Havola (ixtiyoriy)', 'Link (optional)', 'Ссылка (необязательно)')}
            <input
              className="input"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="#courses · /poyga · https://…"
            />
          </label>
          <label>
            {L('Qachongacha (ixtiyoriy)', 'Until (optional)', 'До (необязательно)')}
            <input
              className="input"
              type="datetime-local"
              value={form.until}
              onChange={(e) => setForm({ ...form, until: e.target.value })}
            />
          </label>
        </div>
        <div className="bo-actions">
          <Button type="submit" disabled={!!busy || !ready}>
            {L('Eslatma qo‘shish', 'Add reminder', 'Добавить напоминание')}
          </Button>
        </div>
      </form>
    </section>
  );
}
