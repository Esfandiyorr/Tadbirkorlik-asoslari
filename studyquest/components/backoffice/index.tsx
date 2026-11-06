'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { AvatarAdmin } from '../avatar-admin';
import { NewsAdmin } from '../announcements';
import { useL } from './common';
import { LiveAdmin } from './live-admin';
import { TopicQuizAdmin } from './topic-quiz-admin';

/* 🛠 Sayt boshqaruvi (administrator): saytdagi matn, rasm, avatar, test va jonli testni dasturchiga yozmasdan
   o'zgartirish uchun yagona joy. Har bir ish — alohida kartochka; ichida qisqa izoh va oddiy shakllar. */

export type BoSection = 'live' | 'quiz' | 'content' | 'avatars' | 'news';
const KEY = 'sq-bo-section';

export function BackOffice({ openTab }: { openTab: (tab: string) => void }) {
  const L = useL();
  const [section, setSection] = useState<BoSection | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return (sessionStorage.getItem(KEY) as BoSection) || null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (section) sessionStorage.setItem(KEY, section);
      else sessionStorage.removeItem(KEY);
    } catch {}
  }, [section]);
  const cards: {
    id: BoSection | string;
    icon: string;
    title: string;
    text: string;
    tab?: string;
    action?: () => void;
    actionLabel?: string;
  }[] = [
    {
      id: 'quiz',
      icon: '📝',
      title: L('Mavzu testlari', 'Topic tests', 'Тесты по темам'),
      text: L(
        'Mavzular oxiridagi test: savol, javoblar, to‘g‘ri javob va izohni o‘zgartirish yoki savolni boshqasiga almashtirish.',
        'The test at the end of each topic: change questions, answers, the correct answer and explanations, or replace a question.',
        'Тест в конце каждой темы: вопросы, ответы, правильный ответ и пояснения; замена вопроса.',
      ),
    },
    {
      id: 'live',
      icon: '⚡',
      title: L('Jonli test', 'Live quiz', 'Живой тест'),
      text: L(
        'Kunlik jonli test vaqti, savollar banki, o‘yinni qo‘lda tuzish yoki to‘xtatish, natijalar.',
        'Daily live quiz time, the question bank, creating or stopping a game, results.',
        'Время ежедневного теста, банк вопросов, создание и остановка игры, результаты.',
      ),
    },
    {
      id: 'avatars',
      icon: '🎭',
      title: L('Avatarlar', 'Avatars', 'Аватары'),
      text: L(
        'Yangi avatar rasmini yuklash, nomini o‘zgartirish, yashirish; kimga ruxsat berilgani.',
        'Upload new avatar pictures, rename or hide them; who may choose one.',
        'Загрузка новых аватаров, переименование, скрытие; кому разрешено.',
      ),
    },
    {
      id: 'news',
      icon: '📢',
      title: L('E’lonlar', 'Announcements', 'Объявления'),
      text: L(
        'Yon menyudagi e’lonlar oynasi: yangi e’lon joylash yoki o‘chirish.',
        'The announcements box in the side menu: post or remove announcements.',
        'Блок объявлений в боковом меню: добавить или удалить объявление.',
      ),
    },
    {
      id: 'access',
      icon: '🔓',
      title: L('Mavzular holati', 'Topic access', 'Доступ к темам'),
      text: L(
        'Qaysi mavzu ochiq, qaysi biri yopiq yoki faqat ko‘rish uchun.',
        'Which topics are open, closed or view-only.',
        'Какие темы открыты, закрыты или только для просмотра.',
      ),
      tab: 'access',
    },
    {
      id: 'academic',
      icon: '👥',
      title: L('Talabalar va baholar', 'Students and grades', 'Студенты и оценки'),
      text: L(
        'Talabalar ro‘yxati, ballar, parolni tiklash, guruhlar.',
        'Student list, points, password resets, groups.',
        'Список студентов, баллы, сброс пароля, группы.',
      ),
      tab: 'academic',
    },
    {
      id: 'platform',
      icon: '⚙️',
      title: L('Platforma sozlamalari', 'Platform settings', 'Настройки платформы'),
      text: L(
        'Texnik ishlar rejimi, ochiq reyting va kirish qoidalari.',
        'Maintenance mode, the public leaderboard and sign-in rules.',
        'Режим обслуживания, открытый рейтинг и правила входа.',
      ),
      tab: 'platform',
    },
    {
      id: 'legacy',
      icon: '🧰',
      title: L('Qo‘shimcha (eski panel)', 'More (classic panel)', 'Ещё (классическая панель)'),
      text: L(
        'Yozuv poygasi, dizayn kutubxonasi va boshqa eski sozlamalar.',
        'Typing races, the design library and other classic settings.',
        'Гонки набора, библиотека дизайна и другие классические настройки.',
      ),
      tab: 'legacy',
    },
  ];
  const current = cards.find((c) => c.id === section);
  if (section && current) {
    let body: ReactNode = null;
    if (section === 'live') body = <LiveAdmin />;
    else if (section === 'quiz') body = <TopicQuizAdmin />;
    else if (section === 'avatars') body = <AvatarAdmin />;
    else if (section === 'news') body = <NewsAdmin openCourseControls={() => setSection('live')} />;
    return (
      <section className="bo-section" aria-labelledby="bo-title">
        <div className="bo-head">
          <Button variant="outline" size="sm" onClick={() => setSection(null)}>
            <ArrowLeft size={15} />
            {L('Sayt boshqaruvi', 'Site manager', 'Управление сайтом')}
          </Button>
          <h2 id="bo-title">
            {current.icon} {current.title}
          </h2>
        </div>
        <p className="bo-lead">{current.text}</p>
        {body}
      </section>
    );
  }
  return (
    <section className="bo-hub" aria-labelledby="bo-hub-title">
      <div className="bo-hub-head">
        <h2 id="bo-hub-title">🛠 {L('Sayt boshqaruvi', 'Site manager', 'Управление сайтом')}</h2>
        <p>
          {L(
            'Saytdagi hamma narsani shu yerdan o‘zingiz o‘zgartirasiz. Kerakli kartochkani tanlang — har birida qisqa izoh bor. O‘zgarishlar talabalarga bir daqiqa ichida ko‘rinadi.',
            'Change everything on the site yourself from here. Pick a card — each has a short explanation. Students see changes within a minute.',
            'Здесь вы сами меняете всё на сайте. Выберите карточку — в каждой есть подсказка. Студенты увидят изменения в течение минуты.',
          )}
        </p>
      </div>
      <ul className="bo-cards">
        {cards.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="bo-card-btn"
              onClick={() => (c.tab ? openTab(c.tab) : setSection(c.id as BoSection))}
            >
              <span className="bo-card-icon" aria-hidden="true">
                {c.icon}
              </span>
              <b>{c.title}</b>
              <small>{c.text}</small>
            </button>
            {c.action && (
              <Button size="sm" variant="secondary" className="bo-card-action" onClick={c.action}>
                {c.actionLabel}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Boshqa joydan (masalan, yon menyudagi e'lonlar oynasidagi «+») kerakli bo'limni ochish. */
export function openBackOffice(section: BoSection) {
  try {
    sessionStorage.setItem(KEY, section);
    sessionStorage.setItem('sq-staff-tab', 'site');
  } catch {}
}
