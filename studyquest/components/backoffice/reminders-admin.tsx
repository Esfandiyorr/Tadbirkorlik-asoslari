'use client';
import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAdminView, useL } from './common';
import { REMINDER_TEXT_MAX, type Reminders } from '@/lib/reminders';

/* 🔔 «Sayt boshqaruvi → 📢 E'lonlar» ichida: bosh sahifadagi «Eslatmalar»da nima chiqishini boshqarish —
   o'z qisqa eslatmalaringiz (matn, havola, muddat, guruh) va avtomatik eslatmalar (bugungi mavzular, jonli o'yin). */
const tashkentInput = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 16);
const fromTashkent = (v: string) => (v ? Date.parse(v + ':00Z') - 18000000 : 0);

export function RemindersAdmin() {
  const L = useL();
  const { data, error, busy, act } = useAdminView<Reminders>('reminders', 'reminders');
  const [form, setForm] = useState({ t: '', link: '', until: '', group: '' });
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-32" />;
  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await act(
        {
          op: 'add',
          t: form.t.trim(),
          ...(form.link.trim() ? { link: form.link.trim() } : {}),
          ...(form.until ? { until: fromTashkent(form.until) } : {}),
          ...(form.group.trim() ? { group: form.group.trim() } : {}),
        },
        'add',
        L('Eslatma qo‘shildi', 'Reminder added', 'Напоминание добавлено'),
      );
      setForm({ t: '', link: '', until: '', group: '' });
    } catch {}
  };
  const auto = (k: 'topics' | 'live', on: boolean) =>
    void act({ op: 'auto', [k]: on }, 'auto-' + k, L('Saqlandi', 'Saved', 'Сохранено')).catch(
      () => {},
    );
  return (
    <section className="bo-card reminders-admin" aria-labelledby="rem-h">
      <h3 id="rem-h">
        🔔 {L('Bosh sahifadagi eslatmalar', 'Home page reminders', 'Напоминания на главной')}
      </h3>
      <p className="bo-hint">
        {L(
          'Bosh sahifadagi binafsha bannerda «Eslatmalar» bir nechta soniyada almashib turadi. Bu yerda nima chiqishini tanlaysiz.',
          'The “Reminders” on the purple home banner change every few seconds. Choose what appears there.',
          '«Напоминания» на фиолетовом баннере главной меняются каждые несколько секунд. Здесь вы выбираете, что там показывать.',
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
      <ul className="bo-list reminders-list">
        {data.items.map((r) => (
          <li key={r.id}>
            <div>
              <b>{r.t}</b>
              <small>
                {[
                  r.group ? '👥 ' + r.group : L('Hammaga', 'Everyone', 'Всем'),
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
        {!data.items.length && (
          <li className="muted">
            {L(
              'Hozircha o‘zingiz yozgan eslatma yo‘q.',
              'No reminders of your own yet.',
              'Своих напоминаний пока нет.',
            )}
          </li>
        )}
      </ul>
      <form className="bo-form" onSubmit={(e) => void add(e)}>
        <h4>➕ {L('Yangi eslatma', 'New reminder', 'Новое напоминание')}</h4>
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
          <label>
            {L(
              'Faqat guruhga (ixtiyoriy)',
              'Only for a group (optional)',
              'Только группе (необязательно)',
            )}
            <input
              className="input"
              maxLength={60}
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              placeholder="AP-223"
            />
          </label>
        </div>
        <div className="bo-actions">
          <Button type="submit" disabled={!!busy || form.t.trim().length < 2}>
            {L('Eslatma qo‘shish', 'Add reminder', 'Добавить напоминание')}
          </Button>
        </div>
      </form>
    </section>
  );
}
