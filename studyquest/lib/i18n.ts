import type { Lang } from './types';
const words = {
  home: ['Bosh sahifa', 'Home', 'Главная'],
  courses: ['Kurslar', 'Courses', 'Курсы'],
  arena: ['O‘yin maydoni', 'Game arena', 'Игровая арена'],
  ranking: ['Reyting', 'Leaderboard', 'Рейтинг'],
  badges: ['Yutuqlar', 'Achievements', 'Достижения'],
  profile: ['Profil', 'Profile', 'Профиль'],
  teacher: ['O‘qituvchi', 'Teacher', 'Преподаватель'],
  admin: ['Boshqaruv', 'Administration', 'Управление'],
  welcome: ['Xush kelibsiz', 'Welcome back', 'С возвращением'],
  continue: ['O‘qishni davom ettiring', 'Continue learning', 'Продолжить обучение'],
  explore: ['Bilim sari yangi qadam', 'Your next step in learning', 'Ваш следующий шаг в обучении'],
  search: ['Dars yoki kurs qidiring…', 'Search lessons or courses…', 'Поиск урока или курса…'],
  featured: ['Siz uchun kurslar', 'Featured courses', 'Рекомендуемые курсы'],
  daily: ['Kunlik topshiriq', 'Daily challenge', 'Задание дня'],
  activity: ['Haftalik faollik', 'Weekly activity', 'Активность за неделю'],
  streak: ['Kunlik davomiylik', 'Study streak', 'Учебная серия'],
  lesson: ['Dars', 'Lesson', 'Урок'],
  progress: ['O‘qish jarayoni', 'Learning progress', 'Прогресс обучения'],
  login: ['Kirish', 'Log in', 'Войти'],
  logout: ['Chiqish', 'Log out', 'Выйти'],
  save: ['Saqlash', 'Save', 'Сохранить'],
  empty: ['Hali ma’lumot yo‘q', 'No activity yet', 'Данных пока нет'],
  all: ['Hammasi', 'All time', 'За всё время'],
  week: ['Haftalik', 'Weekly', 'За неделю'],
  month: ['Oylik', 'Monthly', 'За месяц'],
  privacy: ['Reytingda ko‘rinish', 'Show me on the leaderboard', 'Показывать меня в рейтинге'],
  theme: ['Tungi rejim', 'Dark mode', 'Тёмная тема'],
  notifications: ['Bildirishnomalar', 'Notifications', 'Уведомления'],
  demo: [
    'Demo muhit · haqiqiy ballar o‘zgarmaydi',
    'Demo environment · live scores stay unchanged',
    'Демо · реальные баллы не изменяются',
  ],
  level: ['Platforma darajasi', 'Platform level', 'Уровень платформы'],
  complete: ['Darsni yakunlash', 'Complete lesson', 'Завершить урок'],
  quiz: ['Bilimingizni tekshiring', 'Check your knowledge', 'Проверьте знания'],
  legacy: ['Mavjud hisob bilan kirish', 'Use existing account', 'Войти в существующий аккаунт'],
  teacherPanel: ['O‘qituvchi paneli', 'Teacher dashboard', 'Панель преподавателя'],
  adminPanel: ['Administrator paneli', 'Admin dashboard', 'Панель администратора'],
  begin: ['Boshlash', 'Start learning', 'Начать обучение'],
  install: ['Ilovani o‘rnatish', 'Install app', 'Установить приложение'],
  settings: ['Sozlamalar', 'Settings', 'Настройки'],
} as const;
export type Key = keyof typeof words;
export const t = (lang: Lang, key: Key) => words[key][lang === 'en' ? 1 : lang === 'ru' ? 2 : 0];
export function dateLabel(lang: Lang, time = Date.now()) {
  const d = new Date(time + 18000000),
    months =
      lang === 'uz'
        ? [
            'yanvar',
            'fevral',
            'mart',
            'aprel',
            'may',
            'iyun',
            'iyul',
            'avgust',
            'sentabr',
            'oktabr',
            'noyabr',
            'dekabr',
          ]
        : lang === 'ru'
          ? [
              'января',
              'февраля',
              'марта',
              'апреля',
              'мая',
              'июня',
              'июля',
              'августа',
              'сентября',
              'октября',
              'ноября',
              'декабря',
            ]
          : [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ];
  return d.getUTCDate() + ' ' + months[d.getUTCMonth()];
}
export function weekdayLabel(lang: Lang, time: number) {
  const n = new Date(time + 18000000).getUTCDay();
  return (
    lang === 'uz'
      ? ['Y', 'D', 'S', 'C', 'P', 'J', 'S']
      : lang === 'ru'
        ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  )[n];
}
export function levelLabel(lang: Lang, name: string) {
  const labels: Record<string, string[]> = {
    Beginner: ['Boshlovchi', 'Beginner', 'Начинающий'],
    Explorer: ['Izlanuvchi', 'Explorer', 'Исследователь'],
    Scholar: ['Bilimdon', 'Scholar', 'Знаток'],
    Expert: ['Mutaxassis', 'Expert', 'Эксперт'],
    Master: ['Usta', 'Master', 'Мастер'],
  };
  return labels[name]?.[lang === 'en' ? 1 : lang === 'ru' ? 2 : 0] || name;
}
