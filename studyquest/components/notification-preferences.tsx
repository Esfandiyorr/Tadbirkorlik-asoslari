'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';
import type { PushPreferences } from '@/lib/server/push';

export function NotificationPreferences() {
  const { data, request, lang } = useApp(),
    L = (a: string, b: string, c: string) => tr(lang, a, b, c);
  const [value, setValue] = useState<PushPreferences | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || !data?.user) return;
    let active = true;
    request('/api/push?view=preferences')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw Error(v.error);
        if (active) setValue(v);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [open, data?.user?.id, request]);
  if (!data?.user) return null;
  return (
    <details
      className="notification-preferences panel"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {L('Qaysi bildirishnomalarni olaman?', 'Notification categories', 'Категории уведомлений')}
      </summary>
      <p>
        {L(
          'Tanlovingiz shu hisobning barcha qurilmalarida amal qiladi. Xabar olish uchun qurilmada bildirishnomalarni ham yoqing.',
          'Applies to all devices on this account. Enable notifications on the device to receive them.',
          'Выбор действует на всех устройствах аккаунта. Для получения включите уведомления на устройстве.',
        )}
      </p>
      {value && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await request('/api/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ op: 'preferences', preferences: value }),
                }),
                v = await r.json();
              if (!r.ok) throw Error(v.error);
              setValue(v);
              setMessage(L('Tanlov saqlandi.', 'Preferences saved.', 'Выбор сохранён.'));
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {(
            [
              [
                'topics',
                L(
                  'Mavzular ochilishi va muddatlar',
                  'Topic access and deadlines',
                  'Открытие тем и сроки',
                ),
              ],
              [
                'announcements',
                L(
                  'E’lonlar va guruh yangiliklari',
                  'Announcements and group news',
                  'Объявления и новости группы',
                ),
              ],
              [
                'live',
                L(
                  'Jonli test e’loni va eslatmasi',
                  'Live quiz announcements and reminders',
                  'Анонсы и напоминания о тесте',
                ),
              ],
              ['videos', L('Yangi dars videolari', 'New lesson videos', 'Новые видео уроков')],
            ] as [keyof PushPreferences, string][]
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={value[key]}
                onChange={(e) => setValue({ ...value, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
          <Button type="submit" disabled={busy}>
            {L('Tanlovni saqlash', 'Save preferences', 'Сохранить выбор')}
          </Button>
        </form>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
