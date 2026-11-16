'use client';
import { useState } from 'react';
import { useApp } from './provider';
import { tr } from '@/lib/points';
import type { StaffActivity as Row } from '@/lib/server/staff-activity';
export function StaffActivity() {
  const { lang, request } = useApp(),
    L = (a: string, b: string, c: string) => tr(lang, a, b, c),
    [rows, setRows] = useState<Row[] | null>(null),
    [error, setError] = useState('');
  const load = async () => {
    try {
      const r = await request('/api/staff-activity'),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      setRows(v.rows);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const labels: Record<string, string> = {
    'topic:open': L('Mavzu hammaga ochildi', 'Topic opened for all', 'Тема открыта всем'),
    'topic:lock': L('Mavzu hammaga yopildi', 'Topic closed for all', 'Тема закрыта всем'),
    'topic:read': L(
      'Mavzu o‘qish rejimiga o‘tdi',
      'Topic set to reading mode',
      'Тема в режиме чтения',
    ),
    'course:approve': L(
      'Kurs so‘rovi tasdiqlandi',
      'Course request approved',
      'Доступ к курсу одобрен',
    ),
    'course:reject': L('Kurs so‘rovi rad etildi', 'Course request rejected', 'Запрос отклонён'),
    'course:revoke': L('Kurs ruxsati olindi', 'Course access removed', 'Доступ отозван'),
    'course:grant': L('Kurs ruxsati berildi', 'Course access granted', 'Доступ выдан'),
    'course:grantUser': L('Kurs ruxsati berildi', 'Course access granted', 'Доступ выдан'),
    'course:gate': L(
      'Kursga kirish tartibi yangilandi',
      'Course entry policy updated',
      'Правила доступа обновлены',
    ),
    'course:students': L(
      'Talabalar uchun kirish yangilandi',
      'Student entry updated',
      'Вход студентов обновлён',
    ),
    'course:shop': L(
      'Kurs to‘lov ma’lumoti yangilandi',
      'Course payment details updated',
      'Оплата курса обновлена',
    ),
  };
  return (
    <details
      className="staff-activity"
      onToggle={(e) => {
        if (e.currentTarget.open) void load();
      }}
    >
      <summary>
        {L(
          'So‘nggi boshqaruv amallari',
          'Recent management actions',
          'Последние действия управления',
        )}
      </summary>
      <p>
        {L(
          'Yangi mavzu va kurs ruxsati o‘zgarishlari: oxirgi 50 ta amal.',
          'New topic and course access changes: the last 50 actions.',
          'Новые изменения доступа к темам и курсам: последние 50 действий.',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      {rows?.length === 0 && (
        <p>{L('Hozircha amal yo‘q.', 'No actions yet.', 'Действий пока нет.')}</p>
      )}
      <ul>
        {rows?.map((r) => (
          <li key={r.id}>
            <time>
              {new Date(r.at).toLocaleString(
                lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : 'uz-UZ',
                { timeZone: 'Asia/Tashkent' },
              )}
            </time>{' '}
            · {labels[r.action] || r.action}
            <br />
            <span>
              {r.target} · {r.by}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
