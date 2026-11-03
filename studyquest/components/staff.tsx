'use client';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Plus,
  Upload,
  Download,
  Check,
  Save,
  Shield,
  BookOpen,
  Users,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { AcademicRoster } from './academic-roster';
import { NativeSurface } from './native-surface';
import { t } from '@/lib/i18n';
import type { Data, Lesson, Question, Quiz, Progress, Attempt, Settings } from '@/lib/types';
const blankQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: 'choice',
  prompt: '',
  options: ['', '', ''],
  answer: '',
  explanation: '',
});
export function Staff({ admin = false }: { admin?: boolean }) {
  const { data, lang, call, toast, request, refresh } = useApp(),
    d = data as Data & { allProgress?: Progress[]; allAttempts?: Attempt[] },
    [tab, setTab] = useState('overview'),
    [selected, setSelected] = useState(d.courses[0]?.id || ''),
    [busy, setBusy] = useState(false);
  const [course, setCourse] = useState({
      id: '',
      title: '',
      description: '',
      published: false,
      difficulty: 'Boshlang‘ich',
      category: 'Biznes',
    }),
    [moduleTitle, setModuleTitle] = useState(''),
    [lesson, setLesson] = useState({
      id: '',
      title: '',
      moduleId: d.modules[0]?.id || '',
      minSeconds: 60,
      published: false,
      slides: [{ title: '', body: '' }],
      materialId: '',
    }),
    [quiz, setQuiz] = useState({
      id: '',
      lessonId: d.lessons[0]?.id || '',
      title: '',
      passingScore: 70,
      attempts: 3,
      timeLimit: 300,
      randomize: true,
      feedback: true,
      questions: [blankQuestion()],
    }),
    [studentId, setStudentId] = useState(''),
    [badgeId, setBadge] = useState('teacher'),
    [subjectTitle, setSubjectTitle] = useState(''),
    [classTitle, setClassTitle] = useState(''),
    [classId, setClassId] = useState(''),
    [uploaded, setUploaded] = useState(''),
    [config, setConfig] = useState<Settings>(d.settings);
  useEffect(() => {
    if (!selected && d.courses[0]) setSelected(d.courses[0].id);
    if (!quiz.lessonId && d.lessons[0]) setQuiz((q) => ({ ...q, lessonId: d.lessons[0].id }));
  }, [d.courses, d.lessons, selected, quiz.lessonId]);
  const allowed = admin
    ? d.user?.role === 'admin'
    : d.user?.role === 'teacher' || d.user?.role === 'admin';
  if (!allowed)
    return (
      <div className="error-state">
        <Shield />
        {lang === 'uz'
          ? 'Bu bo‘limga ruxsat yo‘q.'
          : lang === 'en'
            ? 'You do not have access to this area.'
            : 'Нет доступа к этому разделу.'}
      </div>
    );
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  async function run(action: string, input: unknown) {
    setBusy(true);
    try {
      const r = await call<any>(action, input);
      toast(L('Saqlandi', 'Saved', 'Сохранено'));
      return r;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const progress = (d.allProgress || []).filter((x) => x.courseId === selected),
    attempts = (d.allAttempts || []).filter((x) => x.courseId === selected && x.submittedAt),
    users = d.users || [],
    analytics = d.courses.map((c) => ({
      title: c.title.slice(0, 23),
      completed: (d.allProgress || []).filter((p) => p.courseId === c.id && p.completed).length,
    }));
  function exportReport() {
    const safe = (v: unknown) => {
      const s = String(v ?? '');
      return '"' + (/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"';
    };
    const rows = [
      ['Name', 'Class', 'Lessons completed', 'Average quiz %'],
      ...users
        .filter((u) => u.role === 'student')
        .map((u) => {
          const mine = attempts.filter((x) => x.userId === u.id);
          return [
            u.name,
            u.classId,
            progress.filter((x) => x.userId === u.id && x.completed).length,
            mine.length
              ? Math.round(mine.reduce((s, x) => s + (x.score || 0), 0) / mine.length)
              : '',
          ];
        }),
    ];
    const url = URL.createObjectURL(
      new Blob(['\ufeff' + rows.map((row) => row.map(safe).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tadbirkorlik-asoslari-natijalar.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{admin ? 'PLATFORM CONTROL' : 'TEACH. INSPIRE. SUPPORT.'}</span>
          <h1>{t(lang, admin ? 'adminPanel' : 'teacherPanel')}</h1>
          <p>
            {L(
              'Kurslar va o‘quv jarayonini bir joydan boshqaring.',
              'Manage courses and learning in one place.',
              'Управляйте курсами и обучением в одном месте.',
            )}
          </p>
        </div>
        <Button variant="outline" onClick={exportReport}>
          <Download size={16} />
          CSV
        </Button>
      </div>
      <div className="filter-row">
        {[
          ['overview', L('Tahlil', 'Analytics', 'Аналитика')],
          ['courses', t(lang, 'courses')],
          ['lessons', L('Darslar', 'Lessons', 'Уроки')],
          ['quiz', L('Testlar', 'Quizzes', 'Тесты')],
          ['students', L('O‘quvchilar', 'Learners', 'Ученики')],
          ['academic', L('Talabalar va baholar', 'Academic records', 'Студенты и оценки')],
          ['legacy', L('Kursni boshqarish', 'Course controls', 'Управление предметом')],
          ...(admin ? [['settings', t(lang, 'settings')]] : []),
        ].map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? 'default' : 'outline'}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === 'academic' && <AcademicRoster />}
      {tab === 'legacy' && (
        <section className="panel">
          <NativeSurface
            className="native-workspace"
            title="Fan bo‘yicha barcha boshqaruvlar"
            src="/legacy/index.html?sqEmbed=teacher"
          />
        </section>
      )}
      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <BookOpen />
              <div>
                <small>{t(lang, 'courses')}</small>
                <strong>{d.courses.length}</strong>
              </div>
            </div>
            <div className="stat-card">
              <Users />
              <div>
                <small>{L('O‘quvchilar', 'Learners', 'Ученики')}</small>
                <strong>{users.filter((x) => x.role === 'student').length}</strong>
              </div>
            </div>
            <div className="stat-card">
              <Check />
              <div>
                <small>{L('Yakunlangan darslar', 'Completed lessons', 'Пройдено уроков')}</small>
                <strong>{d.allProgress?.filter((x) => x.completed).length || 0}</strong>
              </div>
            </div>
          </div>
          <section className="panel analytics-panel">
            <h2>{t(lang, 'progress')}</h2>
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={analytics}>
                  <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          {admin && (
            <Button onClick={() => run('importCatalog', {})}>
              {L(
                'Mavjud darslar katalogini ulash',
                'Link the existing lesson catalog',
                'Подключить каталог существующих уроков',
              )}
            </Button>
          )}
        </>
      )}
      {tab === 'courses' && (
        <div className="editor-grid">
          <section className="panel editor">
            <h2>
              {L('Kurs yaratish / tahrirlash', 'Create / edit course', 'Создать / изменить курс')}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('saveCourse', { ...course, id: course.id || undefined });
              }}
            >
              <label>
                {L('Nomi', 'Title', 'Название')}
                <input
                  required
                  className="input"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                />
              </label>
              <label>
                {L('Tavsif', 'Description', 'Описание')}
                <textarea
                  className="input"
                  value={course.description}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                />
              </label>
              <label>
                {L('Kategoriya', 'Category', 'Категория')}
                <input
                  required
                  className="input"
                  value={course.category}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                />
              </label>
              <label>
                {L('Daraja', 'Difficulty', 'Сложность')}
                <select
                  className="input"
                  value={course.difficulty}
                  onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}
                >
                  {['Boshlang‘ich', 'O‘rta', 'Yuqori'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={course.published}
                  onChange={(e) => setCourse({ ...course, published: e.target.checked })}
                />
                {L('O‘quvchilar uchun ochiq', 'Published for learners', 'Опубликован для учеников')}
              </label>
              <Button disabled={busy}>
                <Save size={16} />
                {t(lang, 'save')}
              </Button>
            </form>
          </section>
          <section className="panel editor">
            <h2>{L('Fanlar', 'Subjects', 'Предметы')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('saveSubject', { title: subjectTitle });
                setSubjectTitle('');
              }}
            >
              <div className="inline-fields">
                <input
                  required
                  className="input"
                  aria-label="Subject title"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                />
                <Button disabled={busy} aria-label="Create subject">
                  <Plus size={15} />
                </Button>
              </div>
            </form>
            <p className="muted">{d.subjects?.map((s) => s.title).join(' · ')}</p>
            <h2>{t(lang, 'courses')}</h2>
            {d.courses.map((c) => (
              <div className="manage-row" key={c.id}>
                <div>
                  <b>{c.title}</b>
                  <small>
                    {c.published
                      ? L('Ochiq', 'Published', 'Опубликован')
                      : L('Qoralama', 'Draft', 'Черновик')}
                  </small>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCourse({
                      id: c.id,
                      title: c.title,
                      description: c.description,
                      published: c.published,
                      difficulty: c.difficulty,
                      category: c.category,
                    })
                  }
                >
                  {L('Tahrirlash', 'Edit', 'Изменить')}
                </Button>
              </div>
            ))}
          </section>
        </div>
      )}
      {tab === 'lessons' && (
        <div className="editor-grid">
          <section className="panel editor">
            <h2>{L('Yangi dars', 'New lesson', 'Новый урок')}</h2>
            <label>
              {t(lang, 'courses')}
              <select
                className="input"
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setLesson({
                    ...lesson,
                    moduleId: d.modules.find((m) => m.courseId === e.target.value)?.id || '',
                  });
                }}
              >
                {d.courses.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('saveModule', {
                  courseId: selected,
                  title: moduleTitle,
                  order: d.modules.filter((m) => m.courseId === selected).length,
                });
                setModuleTitle('');
              }}
            >
              <label>
                {L('Yangi modul', 'New module', 'Новый модуль')}
                <div className="inline-fields">
                  <input
                    className="input"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                  />
                  <Button size="icon" aria-label="Add module" disabled={busy}>
                    <Plus size={16} />
                  </Button>
                </div>
              </label>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('saveLesson', {
                  ...lesson,
                  id: lesson.id || undefined,
                  courseId: selected,
                  order: d.lessons.length,
                  materialId: lesson.materialId || undefined,
                });
              }}
            >
              <label>
                {L('Modul', 'Module', 'Модуль')}
                <select
                  required
                  className="input"
                  value={lesson.moduleId}
                  onChange={(e) => setLesson({ ...lesson, moduleId: e.target.value })}
                >
                  <option value="">—</option>
                  {d.modules
                    .filter((m) => m.courseId === selected)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {L('Dars nomi', 'Lesson title', 'Название урока')}
                <input
                  required
                  className="input"
                  value={lesson.title}
                  onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                />
              </label>
              {lesson.slides.map((slide, i) => (
                <div className="slide-editor" key={i}>
                  <span className="eyebrow">
                    {t(lang, 'lesson')} {i + 1}
                  </span>
                  <input
                    className="input"
                    required
                    placeholder={L('Slayd sarlavhasi', 'Slide title', 'Заголовок слайда')}
                    value={slide.title}
                    onChange={(e) =>
                      setLesson({
                        ...lesson,
                        slides: lesson.slides.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <textarea
                    className="input"
                    placeholder={L('Izoh va tushuntirish', 'Explanatory text', 'Пояснение')}
                    value={slide.body}
                    onChange={(e) =>
                      setLesson({
                        ...lesson,
                        slides: lesson.slides.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setLesson({ ...lesson, slides: [...lesson.slides, { title: '', body: '' }] })
                }
              >
                <Plus size={16} />
                {L('Slayd qo‘shish', 'Add slide', 'Добавить слайд')}
              </Button>
              <label>
                {L(
                  'Minimal o‘qish vaqti (soniya)',
                  'Minimum reading time (seconds)',
                  'Минимальное время чтения (сек.)',
                )}
                <input
                  className="input"
                  type="number"
                  min={30}
                  max={7200}
                  value={lesson.minSeconds}
                  onChange={(e) => setLesson({ ...lesson, minSeconds: Number(e.target.value) })}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={lesson.published}
                  onChange={(e) => setLesson({ ...lesson, published: e.target.checked })}
                />
                {L('Ochiq', 'Published', 'Опубликован')}
              </label>
              <Button disabled={busy}>{t(lang, 'save')}</Button>
            </form>
          </section>
          <section className="panel editor">
            <h2>{L('O‘quv materiallari', 'Learning materials', 'Учебные материалы')}</h2>
            <label className="upload-box">
              <Upload size={28} />
              <b>PDF · PNG · JPEG</b>
              <small>{L('4 MB gacha', 'Up to 4 MB', 'До 4 МБ')}</small>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  form.append('file', file);
                  form.append('courseId', selected);
                  try {
                    const r = await request('/api/upload', { method: 'POST', body: form }),
                      v = await r.json();
                    if (!r.ok) throw new Error(v.error);
                    setUploaded(v.name);
                    setLesson({ ...lesson, materialId: v.id });
                    toast(L('Yuklandi', 'Uploaded', 'Загружено'));
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              />
            </label>
            {uploaded && <p className="success-text">✓ {uploaded}</p>}
            <h3>{L('Darslar', 'Lessons', 'Уроки')}</h3>
            {d.lessons
              .filter((l) => l.courseId === selected)
              .map((l) => (
                <div className="manage-row" key={l.id}>
                  <div>
                    <b>{l.title}</b>
                    <small>
                      {l.legacyFile
                        ? L(
                            'Asl taqdimot saqlanadi',
                            'Original presentation preserved',
                            'Исходная презентация сохранена',
                          )
                        : l.slides.length + ' slides'}
                    </small>
                  </div>
                  {!l.legacyFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLesson({
                          id: l.id,
                          title: l.title,
                          moduleId: l.moduleId,
                          minSeconds: l.minSeconds,
                          published: l.published,
                          slides: l.slides,
                          materialId: l.materialId || '',
                        })
                      }
                    >
                      {L('Tahrirlash', 'Edit', 'Изменить')}
                    </Button>
                  )}
                </div>
              ))}
          </section>
        </div>
      )}
      {tab === 'quiz' && (
        <section className="panel editor">
          <h2>{L('Test yaratish', 'Create a quiz', 'Создать тест')}</h2>
          <label>
            {L('Mavjud testni tahrirlash', 'Edit an existing quiz', 'Изменить существующий тест')}
            <select
              className="input"
              value={quiz.id}
              onChange={async (e) => {
                if (!e.target.value) {
                  setQuiz({ ...quiz, id: '' });
                  return;
                }
                try {
                  const q = await call<any>('getQuizForEdit', { quizId: e.target.value });
                  setQuiz({ ...q, feedback: q.feedback !== false });
                } catch (err) {
                  toast((err as Error).message);
                }
              }}
            >
              <option value="">+</option>
              {d.quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run('saveQuiz', { ...quiz, id: quiz.id || undefined });
            }}
          >
            <div className="form-grid">
              <label>
                {t(lang, 'lesson')}
                <select
                  className="input"
                  value={quiz.lessonId}
                  onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })}
                >
                  {d.lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {L('Test nomi', 'Quiz title', 'Название теста')}
                <input
                  required
                  className="input"
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                />
              </label>
              <label>
                {L('O‘tish bali (%)', 'Passing score (%)', 'Проходной балл (%)')}
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={quiz.passingScore}
                  onChange={(e) => setQuiz({ ...quiz, passingScore: Number(e.target.value) })}
                />
              </label>
              <label>
                {L('Urinishlar', 'Attempts', 'Попытки')}
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10}
                  value={quiz.attempts}
                  onChange={(e) => setQuiz({ ...quiz, attempts: Number(e.target.value) })}
                />
              </label>
              <label>
                {L('Vaqt (soniya)', 'Time (seconds)', 'Время (сек.)')}
                <input
                  className="input"
                  type="number"
                  min={30}
                  max={7200}
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={quiz.randomize}
                onChange={(e) => setQuiz({ ...quiz, randomize: e.target.checked })}
              />
              {L('Savollarni aralashtirish', 'Randomize questions', 'Перемешивать вопросы')}
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={quiz.feedback}
                onChange={(e) => setQuiz({ ...quiz, feedback: e.target.checked })}
              />
              {L(
                'Topshirgandan so‘ng izohlarni ko‘rsatish',
                'Show explanations after submission',
                'Показать пояснения после сдачи',
              )}
            </label>
            {quiz.questions.map((q, i) => (
              <div className="question-editor" key={q.id}>
                <div className="section-heading">
                  <b>{i + 1}</b>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={quiz.questions.length === 1}
                    onClick={() =>
                      setQuiz({ ...quiz, questions: quiz.questions.filter((x) => x.id !== q.id) })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <label>
                  {L('Savol turi', 'Question type', 'Тип вопроса')}
                  <select
                    className="input"
                    value={q.type}
                    onChange={(e) =>
                      updateQuestion(i, {
                        type: e.target.value as Question['type'],
                        answer: e.target.value === 'boolean' ? true : '',
                        accepted: [],
                        pairs: [],
                      })
                    }
                  >
                    {[
                      ['choice', 'Multiple choice'],
                      ['boolean', 'True / false'],
                      ['matching', 'Matching'],
                      ['short', 'Short answer'],
                    ].map(([v, n]) => (
                      <option value={v} key={v}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {L('Savol', 'Question', 'Вопрос')}
                  <input
                    required
                    className="input"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                  />
                </label>
                {(q.type === 'choice' || q.type === 'matching') && (
                  <label>
                    {L(
                      'Variantlar (har qatorda bittadan)',
                      'Options (one per line)',
                      'Варианты (по одному в строке)',
                    )}
                    <textarea
                      className="input"
                      value={q.options?.join('\n') || ''}
                      onChange={(e) => updateQuestion(i, { options: e.target.value.split('\n') })}
                    />
                  </label>
                )}
                {q.type === 'choice' && (
                  <label>
                    {L('To‘g‘ri javob', 'Correct answer', 'Правильный ответ')}
                    <select
                      required
                      className="input"
                      value={String(q.answer || '')}
                      onChange={(e) => updateQuestion(i, { answer: e.target.value })}
                    >
                      <option value="">—</option>
                      {q.options?.map((x, j) => (
                        <option key={j}>{x}</option>
                      ))}
                    </select>
                  </label>
                )}
                {q.type === 'boolean' && (
                  <select
                    className="input"
                    value={String(q.answer)}
                    onChange={(e) => updateQuestion(i, { answer: e.target.value === 'true' })}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                )}
                {q.type === 'short' && (
                  <label>
                    {L(
                      'Qabul qilinadigan javoblar (har qatorda bittadan)',
                      'Accepted answers (one per line)',
                      'Допустимые ответы (по одному в строке)',
                    )}
                    <textarea
                      className="input"
                      value={q.accepted?.join('\n') || ''}
                      onChange={(e) => updateQuestion(i, { accepted: e.target.value.split('\n') })}
                    />
                  </label>
                )}
                {q.type === 'matching' && (
                  <>
                    <label>
                      {L(
                        'Atamalar (har qatorda bittadan)',
                        'Terms (one per line)',
                        'Термины (по одному в строке)',
                      )}
                      <textarea
                        className="input"
                        value={q.pairs?.join('\n') || ''}
                        onChange={(e) => updateQuestion(i, { pairs: e.target.value.split('\n') })}
                      />
                    </label>
                    {q.pairs?.map((pair) => (
                      <label key={pair}>
                        {pair}
                        <select
                          className="input"
                          value={(q.answer as Record<string, string>)?.[pair] || ''}
                          onChange={(e) =>
                            updateQuestion(i, {
                              answer: {
                                ...(typeof q.answer === 'object' ? (q.answer as object) : {}),
                                [pair]: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="">—</option>
                          {q.options?.map((x, j) => (
                            <option key={j}>{x}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </>
                )}
                <label>
                  {L('Javob izohi', 'Answer explanation', 'Пояснение')}
                  <textarea
                    className="input"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                  />
                </label>
              </div>
            ))}
            <div className="inline-fields">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setQuiz({ ...quiz, questions: [...quiz.questions, blankQuestion()] })
                }
              >
                <Plus size={16} />
                {L('Savol qo‘shish', 'Add question', 'Добавить вопрос')}
              </Button>
              <Button disabled={busy}>{t(lang, 'save')}</Button>
            </div>
          </form>
        </section>
      )}
      {tab === 'students' && (
        <>
          <section className="panel editor">
            <h2>{L('Guruhlar', 'Classes', 'Классы')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run('saveClass', { id: classId || undefined, title: classTitle });
              }}
            >
              <div className="inline-fields">
                <input
                  required
                  className="input"
                  placeholder="AP-223"
                  aria-label="Class ID"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                />
                <input
                  required
                  className="input"
                  aria-label="Class title"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                />
                <Button disabled={busy}>
                  <Plus size={15} />
                </Button>
              </div>
            </form>
            <div className="inline-fields">
              <input
                className="input"
                aria-label="Learner ID for class"
                placeholder={L('Talaba ID', 'Student ID', 'ID студента')}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <select
                className="input"
                aria-label="Assign class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">—</option>
                {d.classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Button
                disabled={!studentId || !classId || busy}
                onClick={() => run('assignClass', { userId: studentId, classId })}
              >
                {L('Biriktirish', 'Assign', 'Назначить')}
              </Button>
            </div>
          </section>
          <section className="panel editor">
            <h2>{L('Kursga qo‘shish', 'Enroll a learner', 'Записать ученика')}</h2>
            <div className="inline-fields">
              <select
                className="input"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {d.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder={L('O‘quvchi ID', 'Learner ID', 'ID ученика')}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <Button
                disabled={!studentId || busy}
                onClick={() => run('enroll', { courseId: selected, userId: studentId })}
              >
                <Plus size={16} />
              </Button>
            </div>
          </section>
          <section className="panel editor">
            <h2>{L('O‘quvchilar', 'Learners', 'Ученики')}</h2>
            <label>
              {L('Tasdiqlanadigan yutuq', 'Achievement to approve', 'Подтверждаемое достижение')}
              <select className="input" value={badgeId} onChange={(e) => setBadge(e.target.value)}>
                {d.badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{L('Ism', 'Name', 'Имя')}</th>
                    <th>{L('Darslar', 'Lessons', 'Уроки')}</th>
                    <th>Quiz %</th>
                    <th>{L('Amal', 'Action', 'Действие')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                        <small>{u.id}</small>
                      </td>
                      <td>{progress.filter((p) => p.userId === u.id && p.completed).length}</td>
                      <td>
                        {attempts
                          .filter((x) => x.userId === u.id)
                          .map((x) => x.score + '%')
                          .join(', ') || '—'}
                      </td>
                      <td>
                        {admin ? (
                          <select
                            className="input"
                            aria-label={'Role ' + u.name}
                            disabled={u.id === d.user?.id}
                            value={u.role}
                            onChange={(e) => run('role', { userId: u.id, role: e.target.value })}
                          >
                            {['student', 'teacher', 'admin'].map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        ) : u.role === 'student' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              run('awardBadge', { userId: u.id, badgeId, courseId: selected })
                            }
                          >
                            {L('Yutuq berish', 'Award badge', 'Выдать награду')}
                          </Button>
                        ) : (
                          u.role
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {tab === 'settings' && admin && (
        <section className="panel editor">
          <h2>XP · {t(lang, 'settings')}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run('settings', config);
            }}
          >
            <div className="form-grid">
              {Object.entries(config.rewards).map(([key, value]) => (
                <label key={key}>
                  {key}
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={key === 'course' ? 10000 : 1000}
                    value={value}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rewards: { ...config.rewards, [key]: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <h3>{L('Platforma darajalari', 'Platform levels', 'Уровни платформы')}</h3>
            {config.levels.map((level, i) => (
              <div className="inline-fields" key={i}>
                <input
                  className="input"
                  aria-label="Level name"
                  value={level.name}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      levels: config.levels.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  aria-label="Level XP"
                  value={level.xp}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      levels: config.levels.map((x, j) =>
                        j === i ? { ...x, xp: Number(e.target.value) } : x,
                      ),
                    })
                  }
                />
              </div>
            ))}
            <Button disabled={busy}>{t(lang, 'save')}</Button>
          </form>
        </section>
      )}
    </>
  );
}
