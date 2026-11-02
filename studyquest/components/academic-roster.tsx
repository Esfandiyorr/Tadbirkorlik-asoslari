'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import type { User } from '@/lib/types';
export function AcademicRoster() {
  const { data, lang, request, call, toast } = useApp(),
    [users, setUsers] = useState<User[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [group, setGroup] = useState('');
  async function load() {
    setLoading(true);
    try {
      const r = await request('/api/platform?view=roster'),
        body = await r.json();
      if (!r.ok) throw Error(body.error);
      setUsers(body.users || []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [request]);
  async function save(input: unknown) {
    try {
      await call('legacyStudent', input);
      toast(lang === 'uz' ? 'Saqlandi' : 'Saved');
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  }
  const topics = data!.lessons
      .filter((l) => l.courseId === 'tad-asoslari')
      .sort((a, b) => a.order - b.order),
    groups = Array.from(new Set(users.map((u) => u.classId).filter(Boolean))).sort();
  return (
    <section className="panel editor">
      <div className="section-heading">
        <div>
          <h2>
            {lang === 'uz'
              ? 'Talabalar va akademik baholar'
              : lang === 'en'
                ? 'Students and academic grades'
                : 'Студенты и академические оценки'}
          </h2>
          <p className="muted">
            {lang === 'uz'
              ? 'Mavjud hisoblar, guruhlar va ballar shu yerda ko‘rinadi.'
              : 'Existing accounts, classes and academic scores.'}
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          {lang === 'uz' ? 'Yangilash' : 'Refresh'}
        </Button>
      </div>
      {data?.user?.role === 'admin' && (
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const r = await call<{ students: number }>('syncLegacy', {});
              toast(r.students + ' ta hisob ulandi.');
              await load();
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          {lang === 'uz' ? 'Mavjud talabalarni ulash' : 'Link existing students'}
        </Button>
      )}
      <select
        className="input"
        aria-label="Academic class"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
      >
        <option value="">{lang === 'uz' ? 'Barcha guruhlar' : 'All classes'}</option>
        {groups.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="error-state">
          {error}
        </p>
      ) : loading ? (
        <div className="skeleton h-64" />
      ) : !users.length ? (
        <p className="muted">
          {data?.mode === 'demo'
            ? 'Demo muhit jonli talabalar bazasiga ulanmaydi.'
            : 'Talabalar topilmadi.'}
        </p>
      ) : (
        <div className="academic-table">
          <table>
            <thead>
              <tr>
                <th>{lang === 'uz' ? 'Talaba' : 'Student'}</th>
                <th>{lang === 'uz' ? 'Guruh' : 'Class'}</th>
                <th>{lang === 'uz' ? 'Ball' : 'Points'}</th>
                <th>{lang === 'uz' ? 'Holat' : 'Status'}</th>
                {topics.map((l) => (
                  <th key={l.id} title={l.title}>
                    {l.order + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => !group || u.classId === group)
                .map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.name}</b>
                      <small>{u.learnerType === 'independent' ? 'Mustaqil o‘quvchi' : ''}</small>
                    </td>
                    <td>
                      <input
                        aria-label={'Guruh ' + u.name}
                        defaultValue={u.classId}
                        disabled={u.learnerType === 'independent'}
                        onBlur={(e) => {
                          if (e.target.value !== u.classId)
                            void save({ id: u.legacyId, group: e.target.value });
                        }}
                      />
                    </td>
                    <td>
                      <b>{u.academicPoints || 0}</b>
                    </td>
                    <td>
                      <select
                        aria-label={'Status ' + u.name}
                        value={u.legacyStatus}
                        onChange={(e) => save({ id: u.legacyId, status: e.target.value })}
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="ok">Tasdiqlangan</option>
                        <option value="blocked">Bloklangan</option>
                      </select>
                    </td>
                    {topics.map((l) => (
                      <td key={l.id}>
                        <span title="Avtomatik baho">{u.academicTopics?.[l.id]?.b || '—'}</span>
                        <select
                          aria-label={u.name + ' ' + (l.order + 1) + '-mavzu amaliy baho'}
                          value={u.manualMarks?.[l.id] || 0}
                          onChange={(e) =>
                            save({ id: u.legacyId, topic: l.id, mark: Number(e.target.value) })
                          }
                        >
                          <option value={0}>—</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
