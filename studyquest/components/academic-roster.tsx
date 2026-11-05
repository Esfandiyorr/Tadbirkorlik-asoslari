'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import type { User } from '@/lib/types';
export function AcademicRoster() {
  const { data, lang, request, call, toast } = useApp(),
    L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz),
    independent = L('Mustaqil o‘quvchi', 'Independent learner', 'Самостоятельный слушатель'),
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
      toast(L('Saqlandi', 'Saved', 'Сохранено'));
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
            {L(
              'Asl bazadagi hisoblar, guruhlar va natijalar jonli ko‘rsatiladi. Talabalar qayta ro‘yxatdan o‘tmaydi.',
              'Accounts, groups and results from the original database, shown live. Students do not register again.',
              'Аккаунты, группы и результаты из исходной базы в реальном времени. Студентам не нужно регистрироваться заново.',
            )}
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      {data?.user?.role === 'admin' && (
        <Button
          variant="outline"
          disabled={data.limited}
          onClick={async () => {
            try {
              const r = await call<{ students: number }>('syncLegacy', {});
              toast(
                L(
                  r.students + ' ta hisob ulandi.',
                  r.students + ' accounts linked.',
                  'Подключено аккаунтов: ' + r.students,
                ),
              );
              await load();
            } catch (e) {
              toast((e as Error).message);
            }
          }}
        >
          {L(
            'Mavjud talabalarni ulash',
            'Link existing students',
            'Подключить существующих студентов',
          )}
        </Button>
      )}
      <p className="muted">
        {L(
          `${users.length} ta hisob · ${filtered.length} ta natija`,
          `${users.length} accounts · ${filtered.length} results`,
          `${users.length} аккаунтов · ${filtered.length} результатов`,
        )}
      </p>
      {data?.user?.role === 'admin' && (
        <p className="credential-setup">
          {L(
            'Avvalgi shaxsiy kodlar saqlanadi. 1111 qo‘shimcha kirish kodi. Kodlar qayta ommaviy almashtirilmaydi.',
            'Previous personal codes are kept. 1111 is an extra sign-in code. Codes are never reset in bulk.',
            'Прежние личные коды сохраняются. 1111 — дополнительный код входа. Коды массово не меняются.',
          )}
        </p>
      )}
      <input
        className="input"
        aria-label={L('Talabani qidirish', 'Search students', 'Поиск студентов')}
        placeholder={L(
          'Ism, familiya, guruh yoki email',
          'Name, surname, group or email',
          'Имя, фамилия, группа или email',
        )}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="input"
        aria-label={L('Akademik guruh', 'Academic class', 'Учебная группа')}
        value={group}
        onChange={(e) => setGroup(e.target.value)}
      >
        <option value="">{L('Barcha guruhlar', 'All groups', 'Все группы')}</option>
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
            ? L(
                'Demo muhit jonli talabalar bazasiga ulanmaydi.',
                'The demo does not connect to the live student database.',
                'Демо не подключается к реальной базе студентов.',
              )
            : L('Talabalar topilmadi.', 'No students found.', 'Студенты не найдены.')}
        </p>
      ) : (
        <div className="academic-table">
          <table>
            <thead>
              <tr>
                <th>{L('Talaba', 'Student', 'Студент')}</th>
                <th>{L('Hisobni boshqarish', 'Account', 'Управление')}</th>
                <th>{L('Guruh', 'Group', 'Группа')}</th>
                <th>{L('Ball', 'Points', 'Баллы')}</th>
                <th>{L('Holat', 'Status', 'Статус')}</th>
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
                    <small>{u.learnerType === 'independent' ? independent : ''}</small>
                  </td>
                  <td>
                    <Button variant="outline" onClick={() => setSelectedId(u.id)}>
                      {L('Natijalar', 'Results', 'Результаты')}
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
                        {L('Parolni tiklash', 'Reset password', 'Сбросить пароль')}
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
                        {L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}
                      </Button>
                    )}
                  </td>
                  <td>
                    <input
                      aria-label={L('Guruh', 'Group', 'Группа') + ' ' + u.name}
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
                      aria-label={L('Holat', 'Status', 'Статус') + ' ' + u.name}
                      value={u.legacyStatus}
                      onChange={(e) => save({ id: u.legacyId, status: e.target.value })}
                    >
                      <option value="pending">{L('Kutilmoqda', 'Pending', 'Ожидает')}</option>
                      <option value="ok">{L('Tasdiqlangan', 'Approved', 'Подтверждён')}</option>
                      <option value="blocked">{L('Bloklangan', 'Blocked', 'Заблокирован')}</option>
                    </select>
                  </td>
                  {topics.map((l) => (
                    <td key={l.id}>
                      <span title={L('Avtomatik baho', 'Automatic grade', 'Автоматическая оценка')}>
                        {u.academicTopics?.[l.id]?.b || '—'}
                      </span>
                      <select
                        aria-label={
                          u.name +
                          ' · ' +
                          L(
                            l.order + 1 + '-mavzu amaliy baho',
                            'Topic ' + (l.order + 1) + ' practical grade',
                            'Тема ' + (l.order + 1) + ': практическая оценка',
                          )
                        }
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
            {L('Oldingi', 'Previous', 'Назад')}
          </Button>
          <span>
            {currentPage + 1} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage + 1 >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {L('Keyingi', 'Next', 'Далее')}
          </Button>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop">
          <section
            className="panel roster-detail"
            role="dialog"
            aria-modal="true"
            aria-label={L('Talaba natijalari', 'Student results', 'Результаты студента')}
          >
            <Button variant="outline" onClick={() => setSelectedId('')}>
              {L('Yopish', 'Close', 'Закрыть')}
            </Button>
            <h2>{selected.name}</h2>
            <p>
              {selected.classId || independent} · {selected.academicPoints || 0}{' '}
              {L('ball', 'points', 'баллов')}
            </p>
            {selected.email && <p>{selected.email}</p>}
            {!!selected.legacyRegisteredAt && (
              <p>
                {L('Ro‘yxatdan o‘tgan', 'Registered', 'Зарегистрирован')}:{' '}
                {new Date(selected.legacyRegisteredAt).toLocaleDateString(
                  lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : 'uz-UZ',
                )}
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
                      <span>{L('Vaqt', 'Time', 'Время')}</span>
                      <b>
                        {Math.floor((h?.seconds || 0) / 60)} {L('daq', 'min', 'мин')}
                      </b>
                    </div>
                    <div>
                      <span>{L('To‘g‘ri javoblar', 'Correct answers', 'Верные ответы')}</span>
                      <b>{h?.correctAnswers || 0}</b>
                    </div>
                    {selected.learnerType === 'university' && (
                      <>
                        <div>
                          <span>{L('Ball', 'Points', 'Баллы')}</span>
                          <b>{h?.score ?? 0}</b>
                        </div>
                        <div>
                          <span>{L('Baho', 'Grade', 'Оценка')}</span>
                          <b>{h?.grade || '—'}</b>
                        </div>
                        <div>
                          <span>{L('Amaliy baho', 'Practical grade', 'Практическая оценка')}</span>
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
            aria-label={L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}
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
                toast(
                  L(
                    'Talaba ro‘yxatdan o‘chirildi.',
                    'The student was removed from the list.',
                    'Студент удалён из списка.',
                  ),
                );
                await load();
              } catch (error) {
                setDeleteError((error as Error).message);
              } finally {
                setDeleteBusy(false);
              }
            }}
          >
            <h2>{L('Talabani o‘chirish', 'Remove student', 'Удалить студента')}</h2>
            <p>
              <strong>{deleteUser.name}</strong> · {deleteUser.classId || independent}
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
                {L('Bekor qilish', 'Cancel', 'Отмена')}
              </Button>
              <Button
                type="submit"
                disabled={deleteBusy || deleteConfirmation.trim() !== deleteUser.name.trim()}
              >
                {L('Hisobni o‘chirish', 'Delete account', 'Удалить аккаунт')}
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
            aria-label={L(
              'Talaba parolini tiklash',
              'Reset the student’s password',
              'Сброс пароля студента',
            )}
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
                  L(
                    'Parol yangilandi. Talaba ism-familiyasi va yangi paroli bilan kiradi. Ballari saqlandi.',
                    'Password updated. The student signs in with their name and the new password. Points are kept.',
                    'Пароль обновлён. Студент входит по имени и новому паролю. Баллы сохранены.',
                  ),
                );
              } catch (error) {
                setResetError((error as Error).message);
              } finally {
                setResetBusy(false);
              }
            }}
          >
            <h2>{L('Parolni tiklash', 'Reset password', 'Сбросить пароль')}</h2>
            <p>
              <strong>{resetUser.name}</strong> · {resetUser.classId || independent}
            </p>
            <p>
              {L(
                'Ballar va bajarilgan ishlar saqlanadi. Talaba keyingi kirishda yangi paroldan foydalanadi.',
                'Points and completed work are kept. The student uses the new password next time.',
                'Баллы и выполненные работы сохраняются. При следующем входе студент использует новый пароль.',
              )}
            </p>
            <p className="muted">
              {L(
                '1111 bilan kirishni yoqish shaxsiy kodni saqlaydi. Asosiy parolni almashtirish uchun kamida 8 belgili boshqa parol kiriting.',
                'Enabling sign-in with 1111 keeps the personal code. To replace the main password, enter another one with at least 8 characters.',
                'Вход с кодом 1111 сохраняет личный код. Чтобы заменить основной пароль, введите другой — не короче 8 символов.',
              )}
            </p>
            <label>
              {L('Yangi parol', 'New password', 'Новый пароль')}
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
              {L('Parolni ko‘rsatish', 'Show password', 'Показать пароль')}
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
                {L('Bekor qilish', 'Cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={resetBusy}>
                {L('Yangi parolni saqlash', 'Save new password', 'Сохранить пароль')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
