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
    [group, setGroup] = useState(''),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [selectedId, setSelectedId] = useState(''),
    [resetUser, setResetUser] = useState<User | null>(null),
    [password, setPassword] = useState(''),
    [resetError, setResetError] = useState(''),
    [resetBusy, setResetBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [deleteUser, setDeleteUser] = useState<User | null>(null),
    [deleteConfirmation, setDeleteConfirmation] = useState(''),
    [deleteBusy, setDeleteBusy] = useState(false),
    [deleteError, setDeleteError] = useState('');
  const selected = users.find((u) => u.id === selectedId);
  const filtered = users.filter(
    (u) =>
      (!group || u.classId === group) &&
      (u.name + ' ' + u.classId + ' ' + (u.email || ''))
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 30));
  const currentPage = Math.min(page, pages - 1);
  useEffect(() => {
    setPage(0);
  }, [query, group]);
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
  }, [request, data?.studentPasswordSetup?.completed]);
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
              ? 'Asl bazadagi hisoblar, guruhlar va natijalar jonli ko‘rsatiladi. Talabalar qayta ro‘yxatdan o‘tmaydi.'
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
          disabled={data.limited}
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
      <p className="muted">
        {users.length} ta hisob · {filtered.length} ta natija
      </p>
      {data?.user?.role === 'admin' && (
        <p className="credential-setup">
          Avvalgi shaxsiy kodlar saqlanadi. 1111 qo‘shimcha kirish kodi. Kodlar qayta ommaviy
          almashtirilmaydi.
        </p>
      )}
      <input
        className="input"
        aria-label="Talabani qidirish"
        placeholder="Ism, familiya, guruh yoki email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
                <th>Hisobni boshqarish</th>
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
              {filtered.slice(currentPage * 30, (currentPage + 1) * 30).map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.name}</b>
                    <small>{u.learnerType === 'independent' ? 'Mustaqil o‘quvchi' : ''}</small>
                  </td>
                  <td>
                    <Button variant="outline" onClick={() => setSelectedId(u.id)}>
                      Natijalar
                    </Button>
                    {data?.user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetUser(u);
                          setPassword('1111');
                          setResetError('');
                          setShowPassword(false);
                        }}
                      >
                        Parolni tiklash
                      </Button>
                    )}
                    {data?.user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteUser(u);
                          setDeleteConfirmation('');
                          setDeleteError('');
                        }}
                      >
                        Talabani o‘chirish
                      </Button>
                    )}
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
      {filtered.length > 30 && (
        <div className="roster-pagination">
          <Button
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Oldingi
          </Button>
          <span>
            {currentPage + 1} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage + 1 >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop">
          <section
            className="panel roster-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Talaba natijalari"
          >
            <Button variant="outline" onClick={() => setSelectedId('')}>
              Yopish
            </Button>
            <h2>{selected.name}</h2>
            <p>
              {selected.classId || 'Mustaqil o‘quvchi'} · {selected.academicPoints || 0} ball
            </p>
            {selected.email && <p>{selected.email}</p>}
            {!!selected.legacyRegisteredAt && (
              <p>
                Ro‘yxatdan o‘tgan:{' '}
                {new Date(selected.legacyRegisteredAt).toLocaleDateString('uz-UZ')}
              </p>
            )}
            <div className="academic-topic-grid">
              {topics.map((l) => {
                const h = selected.readingHistory?.[l.id];
                return (
                  <article className="academic-topic-card" key={l.id}>
                    <h3>
                      {l.order + 1}. {l.title}
                    </h3>
                    <p>
                      {h?.status === 'read'
                        ? 'O‘qib chiqilgan'
                        : h?.status === 'started'
                          ? 'Boshlangan'
                          : 'Boshlanmagan'}
                    </p>
                    <div>
                      <span>O‘qilgan slaydlar</span>
                      <b>
                        {h?.seenSlides || 0} / {l.slideCount}
                      </b>
                    </div>
                    <div>
                      <span>Vaqt</span>
                      <b>{Math.floor((h?.seconds || 0) / 60)} daq</b>
                    </div>
                    <div>
                      <span>To‘g‘ri javoblar</span>
                      <b>{h?.correctAnswers || 0}</b>
                    </div>
                    {selected.learnerType === 'university' && (
                      <>
                        <div>
                          <span>Ball</span>
                          <b>{h?.score ?? 0}</b>
                        </div>
                        <div>
                          <span>Baho</span>
                          <b>{h?.grade || '—'}</b>
                        </div>
                        <div>
                          <span>Amaliy baho</span>
                          <b>{selected.manualMarks?.[l.id] || '—'}</b>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {deleteUser && (
        <div className="modal-backdrop">
          <form
            className="panel roster-reset"
            role="dialog"
            aria-modal="true"
            aria-label="Talabani o‘chirish"
            onSubmit={async (event) => {
              event.preventDefault();
              if (deleteBusy) return;
              setDeleteBusy(true);
              setDeleteError('');
              try {
                await call('legacyDeleteStudent', {
                  id: deleteUser.legacyId,
                  confirmation: deleteConfirmation,
                });
                setDeleteUser(null);
                setDeleteConfirmation('');
                toast('Talaba ro‘yxatdan o‘chirildi.');
                await load();
              } catch (error) {
                setDeleteError((error as Error).message);
              } finally {
                setDeleteBusy(false);
              }
            }}
          >
            <h2>Talabani o‘chirish</h2>
            <p>
              <strong>{deleteUser.name}</strong> · {deleteUser.classId || 'Mustaqil o‘quvchi'}
            </p>
            <p>
              Hisob ro‘yxatdan olib tashlanadi va unga kirish yopiladi. O‘quv natijalarining arxiv
              nusxasi saqlanadi.
            </p>
            <label>
              Tasdiqlash uchun ism-familiya
              <input
                className="input"
                required
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>
            {deleteError && <p role="alert">{deleteError}</p>}
            <div className="roster-pagination">
              <Button
                type="button"
                variant="outline"
                disabled={deleteBusy}
                onClick={() => setDeleteUser(null)}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={deleteBusy || deleteConfirmation.trim() !== deleteUser.name.trim()}
              >
                Hisobni o‘chirish
              </Button>
            </div>
          </form>
        </div>
      )}
      {resetUser && (
        <div className="modal-backdrop">
          <form
            className="panel roster-reset"
            role="dialog"
            aria-modal="true"
            aria-label="Talaba parolini tiklash"
            onSubmit={async (e) => {
              e.preventDefault();
              if (resetBusy) return;
              setResetBusy(true);
              setResetError('');
              try {
                await call('legacyResetPassword', { id: resetUser.legacyId, password });
                setPassword('');
                setResetUser(null);
                toast(
                  'Parol yangilandi. Talaba ism-familiyasi va yangi paroli bilan kiradi. Ballari saqlandi.',
                );
              } catch (error) {
                setResetError((error as Error).message);
              } finally {
                setResetBusy(false);
              }
            }}
          >
            <h2>Parolni tiklash</h2>
            <p>
              <strong>{resetUser.name}</strong> · {resetUser.classId || 'Mustaqil o‘quvchi'}
            </p>
            <p>
              Ballar va bajarilgan ishlar saqlanadi. Talaba keyingi kirishda yangi paroldan
              foydalanadi.
            </p>
            <p className="muted">
              1111 bilan kirishni yoqish shaxsiy kodni saqlaydi. Asosiy parolni almashtirish uchun
              kamida 8 belgili boshqa parol kiriting.
            </p>
            <label>
              Yangi parol
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={4}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />{' '}
              Parolni ko‘rsatish
            </label>
            {resetError && <p role="alert">{resetError}</p>}
            <div className="roster-pagination">
              <Button
                type="button"
                variant="outline"
                disabled={resetBusy}
                onClick={() => {
                  setPassword('');
                  setResetUser(null);
                }}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={resetBusy}>
                Yangi parolni saqlash
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
