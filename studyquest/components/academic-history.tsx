'use client';
import { ArrowUpRight, BookOpen, Check } from 'lucide-react';
import { useApp } from './provider';
import { ProgressBar } from './dashboard';

export function AcademicHistory() {
  const { data, lang } = useApp(),
    user = data?.user;
  if (!user?.readingHistory) return null;
  const L = (uz: string, en: string, ru: string) => (lang === 'en' ? en : lang === 'ru' ? ru : uz);
  return (
    <section className="academic-history">
      <div className="section-heading">
        <div>
          <h2>
            {L(
              'O‘rganilgan mavzular va natijalar',
              'Your learning history and results',
              'Изученные темы и результаты',
            )}
          </h2>
          <p className="muted">
            {L(
              'Avvalgi ishlaringiz, baholaringiz va o‘qish jarayoningiz shu yerda saqlangan.',
              'Your previous work, grades and reading progress are preserved here.',
              'Здесь сохранены ваши предыдущие работы, оценки и прогресс.',
            )}
          </p>
        </div>
      </div>
      <div className="academic-topic-grid">
        {data!.lessons
          .filter((l) => l.courseId === 'tad-asoslari')
          .sort((a, b) => a.order - b.order)
          .map((lesson) => {
            const history = user.readingHistory![lesson.id];
            if (!history) return null;
            const status =
              history.status === 'read'
                ? L('O‘qib chiqilgan', 'Read', 'Прочитано')
                : history.status === 'started'
                  ? L('Boshlangan', 'In progress', 'Начато')
                  : L('Boshlanmagan', 'Not started', 'Не начато');
            return (
              <article className="academic-topic-card" key={lesson.id}>
                <span className="academic-topic-status">
                  {history.status === 'read' ? <Check size={12} /> : <BookOpen size={12} />}{' '}
                  {status}
                </span>
                <h3>
                  {lesson.order + 1}. {lesson.title}
                </h3>
                <ProgressBar value={(history.seenSlides / history.totalSlides) * 100} />
                <div>
                  <span>{L('O‘qilgan slaydlar', 'Slides read', 'Прочитано слайдов')}</span>
                  <b>
                    {history.seenSlides} / {history.totalSlides}
                  </b>
                </div>
                <div>
                  <span>{L('O‘qish vaqti', 'Reading time', 'Время чтения')}</span>
                  <b>
                    {Math.floor(history.seconds / 60)} {L('daq', 'min', 'мин')}
                  </b>
                </div>
                {user.learnerType === 'university' && (
                  <>
                    <div>
                      <span>{L('To‘g‘ri javoblar', 'Correct answers', 'Верные ответы')}</span>
                      <b>{history.correctAnswers}</b>
                    </div>
                    <div>
                      <span>{L('Akademik ball', 'Academic points', 'Академические баллы')}</span>
                      <b>{history.score ?? '—'}</b>
                    </div>
                    <div>
                      <span>{L('Baho', 'Grade', 'Оценка')}</span>
                      <b>{history.grade || '—'}</b>
                    </div>
                    {!!user.manualMarks?.[lesson.id] && (
                      <div>
                        <span>
                          {L('Amaliy mashg‘ulot bahosi', 'Practical grade', 'Практическая оценка')}
                        </span>
                        <b>{user.manualMarks[lesson.id]}</b>
                      </div>
                    )}
                  </>
                )}
                <a className="academic-topic-link" href={'#lesson/' + lesson.id}>
                  {history.status === 'new'
                    ? L('Boshlash', 'Start', 'Начать')
                    : L('Davom etish', 'Continue', 'Продолжить')}{' '}
                  <ArrowUpRight size={15} />
                </a>
              </article>
            );
          })}
      </div>
    </section>
  );
}
