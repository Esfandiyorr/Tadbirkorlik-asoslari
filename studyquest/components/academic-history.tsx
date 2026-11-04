'use client';
import { ChevronRight } from 'lucide-react';
import { useApp } from './provider';
import { TopicArt } from './topic-art';
import { AccessChip, PointsBreakdown, PointsRing } from './points-ui';
import { accessOf, durationText, num, topicPoints, tr } from '@/lib/points';

/** Profil: har bir mavzu bo'yicha 100 ballik natija (30 slayd + 20 vaqt + 50 test), baho va amaliy baho. */
export function AcademicHistory() {
  const { data, lang } = useApp(),
    user = data?.user;
  if (!user?.readingHistory) return null;
  const university = user.learnerType !== 'independent';
  const all = data!.lessons
    .filter((l) => l.courseId === 'tad-asoslari')
    .sort((a, b) => a.order - b.order);
  // Hali ochilmagan va boshlanmagan mavzular alohida kartochka bo'lib cho'zilmasin — bitta qatorda sanaladi.
  const isClosed = (id: string) =>
    accessOf(data!, id)?.state === 'locked' &&
    (!user.readingHistory![id] || user.readingHistory![id].status === 'new');
  const lessons = all.filter((l) => !isClosed(l.id)),
    closed = all.filter((l) => isClosed(l.id));
  return (
    <section className="academic-history">
      <div className="section-heading">
        <div>
          <h2>📊 {tr(lang, 'Mavzular bo‘yicha ballar', 'Points by topic', 'Баллы по темам')}</h2>
          <p className="muted">
            {tr(
              lang,
              'Har mavzu 100 ball: 30 — slaydlarni to‘liq ochish, 20 — 1 soat o‘qish, 50 — yakuniy test.',
              'Each topic is worth 100: 30 for opening all slides, 20 for one hour of reading, 50 for the final test.',
              'Каждая тема — 100 баллов: 30 за все слайды, 20 за час чтения, 50 за итоговый тест.',
            )}
          </p>
        </div>
      </div>
      <div className="academic-topic-grid">
        {lessons.map((lesson) => {
          const history = user.readingHistory![lesson.id],
            access = accessOf(data!, lesson.id),
            pts = topicPoints(history),
            manual = user.manualMarks?.[lesson.id];
          return (
            <article
              className={'academic-topic-card panel' + (pts.total >= 99.95 ? ' is-full' : '')}
              key={lesson.id}
            >
              <header>
                <TopicArt id={lesson.id} compact />
                <div>
                  <small>
                    {lesson.order + 1}-{tr(lang, 'mavzu', 'topic', 'тема')}
                    {history?.seconds ? ' · ⏱️ ' + durationText(history.seconds, lang) : ''}
                  </small>
                  <h3>{lesson.title}</h3>
                </div>
              </header>
              <div className="academic-topic-chips">
                <AccessChip access={access} lang={lang} />
                {university && history?.grade ? (
                  <span className={'grade-chip g' + history.grade}>
                    {tr(lang, 'Baho', 'Grade', 'Оценка')}: <b>{history.grade}</b>
                  </span>
                ) : null}
                {university && manual ? (
                  <span className="grade-chip manual">
                    {tr(lang, 'Amaliy', 'Practical', 'Практика')}: <b>{manual}</b>
                  </span>
                ) : null}
              </div>
              <div className="lesson-points">
                <PointsRing value={pts.total} size={62} />
                <PointsBreakdown history={history} lang={lang} />
              </div>
              <a className="academic-topic-link" href={'#lesson/' + lesson.id}>
                {pts.total >= 99.95
                  ? tr(
                      lang,
                      '🎉 To‘liq 100 ball — takrorlash',
                      '🎉 Full 100 — review',
                      '🎉 100 баллов — повторить',
                    )
                  : history && history.status !== 'new'
                    ? tr(
                        lang,
                        `Davom etish · yana ${num(pts.remaining)} ball`,
                        `Continue · ${num(pts.remaining)} more points`,
                        `Продолжить · ещё ${num(pts.remaining)} баллов`,
                      )
                    : tr(lang, 'Boshlash', 'Start', 'Начать')}
                <ChevronRight size={16} />
              </a>
            </article>
          );
        })}
      </div>
      {closed.length > 0 && (
        <p className="academic-closed">
          🔒{' '}
          {tr(
            lang,
            `Hali ochilmagan mavzular: ${closed.map((l) => l.order + 1).join(', ')}. O‘qituvchi ochganda shu yerda paydo bo‘ladi.`,
            `Not open yet: topics ${closed.map((l) => l.order + 1).join(', ')}. They appear here once the teacher opens them.`,
            `Ещё закрыты темы: ${closed.map((l) => l.order + 1).join(', ')}. Они появятся, когда преподаватель их откроет.`,
          )}
        </p>
      )}
    </section>
  );
}
