'use client';
import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, Unlock } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { AvatarFigure, avatarName, setAvatarCatalog } from './avatars';
import { AVATAR_TOP, type AvatarItem } from '@/lib/avatars';
import { tr } from '@/lib/points';

type Person = { id: string; name: string; classId: string; place: number };
type View = {
  catalog?: AvatarItem[];
  avatars: { id: string; owner: (Person & { active: boolean; at: number }) | null }[];
  allowed: (Person & { top: boolean })[];
  students: (Person & { allowed: boolean })[];
};

/* Administrator → «🎭 Avatarlar»: kimda qaysi avatar, ruxsat berilgan talabalar, ruxsat berish/olish va bo'shatish. */
export function AvatarAdmin() {
  const { request, lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=avatarAdmin'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setAvatarCatalog(v.catalog);
      setView(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(input: Record<string, unknown>, key: string, done: string) {
    setBusy(key);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'avatarAdmin', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setAvatarCatalog(v.catalog);
      setView(v);
      toast(done);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const allow = (p: Person, on: boolean) =>
    act(
      { op: 'allow', student: p.id, allow: on },
      'allow' + p.id,
      on
        ? L(
            `✅ ${p.name}ga avatar ruxsati berildi`,
            `✅ ${p.name} may now choose an avatar`,
            `✅ ${p.name}: аватар разрешён`,
          )
        : L(
            `${p.name}dan avatar ruxsati olindi`,
            `Avatar permission removed for ${p.name}`,
            `${p.name}: разрешение снято`,
          ),
    );
  const q = query.trim().toLocaleLowerCase();
  const found = q
    ? (view?.students || [])
        .filter((s) => (s.name + ' ' + s.classId).toLocaleLowerCase().includes(q))
        .slice(0, 8)
    : [];
  return (
    <section className="panel avatar-admin">
      <div className="section-heading">
        <div>
          <h2>🎭 {L('Avatarlar', 'Avatars', 'Аватары')}</h2>
          <p className="muted">
            {L(
              `Avatarni umumiy reytingning 1–${AVATAR_TOP}-o‘rinlaridagi talabalar va siz ruxsat bergan talabalar tanlaydi. Bitta avatar faqat bitta talabada bo‘ladi. Talaba top-${AVATAR_TOP} dan tushsa (ruxsati bo‘lmasa), avatari bo‘shaydi.`,
              `Students in places 1–${AVATAR_TOP} overall and students you allow can choose an avatar. Each avatar belongs to one student. If a student leaves the top ${AVATAR_TOP} without permission, the avatar is freed.`,
              `Аватар выбирают студенты с 1–${AVATAR_TOP}-го места общего рейтинга и те, кому вы разрешили. Один аватар — у одного студента. Если студент выпал из топ-${AVATAR_TOP} без разрешения, аватар освобождается.`,
            )}
          </p>
        </div>
      </div>
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton h-64" />}
      {view && (
        <>
          <ul className="avatar-admin-grid">
            {view.avatars.map((a) => (
              <li key={a.id} className={a.owner?.active ? 'is-taken' : ''}>
                <span className="av-stage">
                  <AvatarFigure id={a.id} />
                </span>
                <b>{avatarName(a.id, lang)}</b>
                {a.owner ? (
                  <>
                    <small>
                      {a.owner.name}
                      {a.owner.classId ? ' · ' + a.owner.classId : ''}
                    </small>
                    <small className={a.owner.active ? 'ok' : 'off'}>
                      {a.owner.active
                        ? a.owner.place
                          ? L(
                              `${a.owner.place}-o‘rin`,
                              `#${a.owner.place}`,
                              `${a.owner.place}-е место`,
                            )
                          : L('ruxsat bilan', 'by permission', 'по разрешению')
                        : L(
                            'nofaol — top-10 dan tushgan',
                            'inactive — left the top 10',
                            'неактивен — вне топ-10',
                          )}
                    </small>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() =>
                        void act(
                          { op: 'release', avatar: a.id },
                          'release' + a.id,
                          L('Avatar bo‘shatildi', 'Avatar freed', 'Аватар освобождён'),
                        )
                      }
                    >
                      <Unlock size={14} /> {L('Bo‘shatish', 'Free', 'Освободить')}
                    </Button>
                  </>
                ) : (
                  <small className="free">{L('Bo‘sh', 'Free', 'Свободен')}</small>
                )}
              </li>
            ))}
          </ul>
          <div className="avatar-admin-allow">
            <h3>
              <ShieldCheck size={18} />{' '}
              {L('Ruxsat berilgan talabalar', 'Students with permission', 'Студенты с разрешением')}{' '}
              <span className="muted">({view.allowed.length})</span>
            </h3>
            {view.allowed.length ? (
              <ul>
                {view.allowed.map((p) => (
                  <li key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.classId}
                        {p.place
                          ? ' · ' + L(`${p.place}-o‘rin`, `#${p.place}`, `${p.place}-е`)
                          : ''}
                      </small>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => void allow(p, false)}
                    >
                      {L('Ruxsatni olish', 'Remove', 'Снять')}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {L(
                  'Hozircha hech kimga alohida ruxsat berilmagan.',
                  'No extra permissions yet.',
                  'Отдельных разрешений пока нет.',
                )}
              </p>
            )}
            <label className="avatar-admin-search">
              <Search size={16} />
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L(
                  'Talabani qidiring: ism yoki guruh',
                  'Find a student: name or group',
                  'Найти студента: имя или группа',
                )}
                aria-label={L('Talabani qidirish', 'Find a student', 'Найти студента')}
              />
            </label>
            {!!found.length && (
              <ul>
                {found.map((p) => (
                  <li key={p.id}>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.classId} · {L(`${p.place}-o‘rin`, `#${p.place}`, `${p.place}-е`)}
                      </small>
                    </span>
                    {p.place <= AVATAR_TOP ? (
                      <small className="ok">
                        {L(
                          'top-10 — ruxsat shart emas',
                          'top 10 — no permission needed',
                          'топ-10 — разрешение не нужно',
                        )}
                      </small>
                    ) : p.allowed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!busy}
                        onClick={() => void allow(p, false)}
                      >
                        {L('Ruxsatni olish', 'Remove', 'Снять')}
                      </Button>
                    ) : (
                      <Button size="sm" disabled={!!busy} onClick={() => void allow(p, true)}>
                        {L('Ruxsat berish', 'Allow', 'Разрешить')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {q && !found.length && (
              <p className="muted">{L('Topilmadi.', 'Nothing found.', 'Не найдено.')}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
