'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { AvatarAdmin } from '../avatar-admin';
import { NewsAdmin } from '../announcements';
import { PromoAdmin } from '../promo';
import { useL } from './common';
import { LiveAdmin } from './live-admin';
import { TopicQuizAdmin } from './topic-quiz-admin';
import { ContentAdmin } from './content-admin';
import { AvatarLibraryAdmin } from './avatar-library-admin';
import { VideoAdmin } from './video-admin';
import { LogoTaskAdmin } from './logo-task-admin';
import { PushAdmin } from './push-admin';
import { AppAdmin } from './app-admin';
import { startEditMode } from '../site-content';

/* 🛠 Sayt boshqaruvi (administrator): saytdagi matn, rasm, avatar, test va jonli testni dasturchiga yozmasdan
   o'zgartirish uchun yagona joy. Har bir ish — alohida kartochka; ichida qisqa izoh va oddiy shakllar. */

export type BoSection =
  'live' | 'quiz' | 'content' | 'avatars' | 'news' | 'push' | 'promo' | 'video' | 'logo' | 'app';
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
      id: 'content',
      icon: '✏️',
      title: L('Matnlar va rasmlar', 'Texts and images', 'Тексты и картинки'),
      text: L(
        'Saytdagi istalgan yozuv yoki rasm ustiga bosib o‘zgartirasiz: sarlavhalar, tugmalar, izohlar, logotip.',
        'Click any text or picture on the site to change it: headings, buttons, notes, the logo.',
        'Нажмите на любой текст или картинку на сайте, чтобы изменить: заголовки, кнопки, подписи, логотип.',
      ),
      action: startEditMode,
      actionLabel: L('✏️ Tahrirlashni boshlash', '✏️ Start editing', '✏️ Начать правку'),
    },
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
      id: 'video',
      icon: '📺',
      title: L('Mavzu videolari', 'Topic videos', 'Видео по темам'),
      text: L(
        'Mavzuga YouTube havolasini qo‘ying — talabalar videoni sayt ichidagi pleyerda ko‘radi (8-mavzuda alohida slaydda ham).',
        'Add a YouTube link to a topic — students watch it in the player on the site (in topic 8 also on its own slide).',
        'Добавьте ссылку YouTube к теме — студенты смотрят видео в плеере на сайте (в теме 8 — и на отдельном слайде).',
      ),
    },
    {
      id: 'logo',
      icon: '🎨',
      title: L(
        'Logotip topshirig‘i (8-mavzu)',
        'Logo assignment (topic 8)',
        'Задание «Логотип» (тема 8)',
      ),
      text: L(
        'Yuklaganlar ro‘yxati: har talabaga berilgan biznes, yuklangan logotip va ta’rif; 0–25 ball qo‘yasiz — u 8-mavzu baliga va reytingga qo‘shiladi.',
        'The list of submissions: each student’s business, uploaded logo and description; give 0–25 points — they count towards topic 8 and the ranking.',
        'Список работ: бизнес каждого студента, логотип и описание; 0–25 баллов идут в баллы темы 8 и рейтинг.',
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
      id: 'push',
      icon: '🔔',
      title: L('Bildirishnomalar', 'Notifications', 'Уведомления'),
      text: L(
        'Ilovani o‘rnatgan va saytda bildirishnomani yoqqanlarga telefon xabari yuborish; avtomatik xabarlar — o‘yin e’loni va eslatmasi, mavzu ochilishi, e’lon, video; tarix.',
        'Send phone notifications to app and browser users; automatic messages — game announcement and reminder, opened topics, announcements, videos; history.',
        'Отправка уведомлений пользователям приложения и браузера; управление автоматическими сообщениями о тесте, темах, объявлениях и видео; история.',
      ),
    },
    {
      id: 'promo',
      icon: '🛍️',
      title: L('2-e’lon oynasi (reklama)', 'Second box (offers)', '2-е окно (реклама)'),
      text: L(
        'Yon menyu pastidagi ikkinchi oyna: mahsulotlar, kurslar va grant dasturlari reklamasi — rasm, havola va muddat bilan.',
        'The second box at the bottom of the side menu: ads for products, courses and grant programmes — with a picture, link and end date.',
        'Второе окно внизу бокового меню: реклама товаров, курсов и грантов — с картинкой, ссылкой и сроком.',
      ),
    },
    {
      id: 'app',
      icon: '📱',
      title: L('Ilova (Play Market)', 'App (Play Market)', 'Приложение (Play Market)'),
      text: L(
        'Google Play talablari: maxfiylik siyosati ma’lumotlari, ilova imzosi (SHA-256), hisobni o‘chirish so‘rovlari va Play Console uchun havolalar.',
        'Google Play requirements: privacy policy details, app signature (SHA-256), account deletion requests and links for Play Console.',
        'Требования Google Play: данные для политики конфиденциальности, подпись приложения (SHA-256), запросы на удаление аккаунта и ссылки для Play Console.',
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
    else if (section === 'content') body = <ContentAdmin />;
    else if (section === 'avatars') body = <AvatarsSection />;
    else if (section === 'news') body = <NewsAdmin openCourseControls={() => setSection('live')} />;
    else if (section === 'push') body = <PushAdmin />;
    else if (section === 'app') body = <AppAdmin />;
    else if (section === 'promo') body = <PromoAdmin />;
    else if (section === 'video') body = <VideoAdmin />;
    else if (section === 'logo') body = <LogoTaskAdmin />;
    return (
      <section className="bo-section" aria-labelledby="bo-title" data-se-ui>
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
    <section className="bo-hub" aria-labelledby="bo-hub-title" data-se-ui>
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

/** Avatarlar: kutubxona (qo'shish, nom, rasm, yashirish) va kimda qaysi avatar (ruxsat, bo'shatish). */
function AvatarsSection() {
  const [rev, setRev] = useState(0);
  return (
    <>
      <AvatarLibraryAdmin onChange={() => setRev((r) => r + 1)} />
      <AvatarAdmin key={rev} />
    </>
  );
}
