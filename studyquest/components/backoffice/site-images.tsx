'use client';

import { useState } from 'react';
import { visualPath } from '@/lib/site-visuals';
import { PRODUCTS, SERVICE_KINDS, type Tri } from '@/lib/services';
import { LIBRARY_KIND } from '@/lib/library';
import { tr } from '@/lib/points';
import { arenaVisuals } from '../games';
import { topicThemes } from '../topic-art';
import { openSiteImageEditor, useSiteContent } from '../site-content';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';

type Visual = { key: string; label: string; icon?: string };

export type ImageSection = 'avatars' | 'news' | 'promo' | 'library' | 'push' | 'video';

const home: [string, string, Tri][] = [
  ['courses', '📚', ['Kurslar', 'Courses', 'Курсы']],
  ['services', '💼', ['Pullik xizmatlar', 'Paid services', 'Платные услуги']],
  ['library', '📖', ['Kutubxona', 'Library', 'Библиотека']],
  ['arena', '🎮', ['O‘yin maydoni', 'Game arena', 'Игровая арена']],
  ['points', '🏅', ['Umumiy ball', 'Total points', 'Общий балл']],
  ['reading', '📖', ['O‘qilgan mavzular', 'Topics read', 'Прочитанные темы']],
  ['time', '⏱️', ['O‘qish vaqti', 'Reading time', 'Время чтения']],
  ['scoring', '🎯', ['Ball beriladigan mavzular', 'Scored topics', 'Темы с баллами']],
  ['guest-1', '📑', ['Mehmon · Mavzular', 'Guest · Topics', 'Гость · Темы']],
  ['guest-2', '🧪', ['Mehmon · Testlar', 'Guest · Tests', 'Гость · Тесты']],
  ['guest-3', '🏆', ['Mehmon · Reyting', 'Guest · Ranking', 'Гость · Рейтинг']],
  ['guest-4', '🎮', ['Mehmon · O‘yinlar', 'Guest · Games', 'Гость · Игры']],
];

export function SiteImages({ openSection }: { openSection: (section: ImageSection) => void }) {
  const { data, lang } = useApp();
  const L = useL();
  const [selected, setSelected] = useState('');
  const content = useSiteContent();
  const groups: { name: string; items: Visual[] }[] = [
    {
      name: L('Xizmatlar katalogi', 'Service catalog', 'Каталог услуг'),
      items: [
        ...SERVICE_KINDS.map((kind) => ({
          key: visualPath('services', kind.id),
          label: tr(lang, ...kind.name),
          icon: kind.art,
        })),
        {
          key: visualPath('services', 'yakuniy-test'),
          label: tr(lang, ...PRODUCTS['yakuniy-test'].name),
          icon: '🎯',
        },
      ],
    },
    {
      name: L('Sayt logotiplari', 'Site logos', 'Логотипы сайта'),
      items: [
        {
          key: '/unistay-wordmark.svg',
          label: L('Menyu · Yorug‘ rejim', 'Menu · Light mode', 'Меню · Светлая тема'),
        },
        {
          key: '/unistay-wordmark-dark.svg',
          label: L('Menyu · Tungi rejim', 'Menu · Dark mode', 'Меню · Тёмная тема'),
        },
        {
          key: '/unistay-logo.svg',
          label: L('Unistay belgisi', 'Unistay logo', 'Логотип Unistay'),
        },
        {
          key: '/unistay-logo.png',
          label: L('Unistay logotipi (PNG)', 'Unistay logo (PNG)', 'Логотип Unistay (PNG)'),
        },
        { key: '/terdu-logo.png', label: L('TerDU logotipi', 'TerDU logo', 'Логотип ТермГУ') },
        { key: '/icon-192.png', label: L('Ilova rasmi', 'App picture', 'Картинка приложения') },
      ],
    },
    {
      name: L('Bosh sahifa stikerlari', 'Home page stickers', 'Стикеры главной страницы'),
      items: home.map(([id, icon, label]) => ({
        key: visualPath('home', id),
        label: tr(lang, ...label),
        icon,
      })),
    },
    {
      name: L('Kurslar va mavzular', 'Courses and topics', 'Курсы и темы'),
      items: [
        ...(
          [
            [
              'business',
              L('Tadbirkorlik asoslari', 'Entrepreneurship', 'Предпринимательство'),
              ['🚀', '💡', '📈', '💼'],
            ],
            [
              'restaurant',
              L('Restoran kursi', 'Restaurant course', 'Ресторанный курс'),
              ['🤵', '🥗', '☕', '🧾'],
            ],
          ] satisfies [string, string, string[]][]
        ).flatMap(([id, name, icons]) =>
          icons.map((icon, index) => ({
            key: visualPath('courses', id + '-' + (index + 1)),
            label: name + ' · ' + (index + 1),
            icon,
          })),
        ),
        {
          key: visualPath('courses', 'restaurant-logo'),
          label: L(
            'Restoran kursi belgisi',
            'Restaurant course mark',
            'Эмблема ресторанного курса',
          ),
          icon: '🍽️',
        },
        ...Object.entries(topicThemes).flatMap(([id, theme]) => {
          const title =
            id.toUpperCase() +
            ' · ' +
            (data?.lessons.find((lesson) => lesson.id === id)?.title || id);
          return [
            {
              key: visualPath('topics', id + '-icon'),
              label: title + ' · ' + L('Asosiy belgi', 'Main icon', 'Главный значок'),
              icon: theme.emoji[0],
            },
            ...theme.emoji.map((icon, index) => ({
              key: visualPath('topics', id + '-' + (index + 1)),
              label: title + ' · ' + (index + 1),
              icon,
            })),
          ];
        }),
      ],
    },
    {
      name: L('O‘yin maydoni', 'Game arena', 'Игровая арена'),
      items: [
        ...arenaVisuals.map(({ key, label, icon }) => ({ key, label: tr(lang, ...label), icon })),
        {
          key: visualPath('arena', 'quiz'),
          label: L('Test kartalari', 'Quiz cards', 'Карточки тестов'),
          icon: '📝',
        },
      ],
    },
    {
      name: L('Kutubxona stikerlari', 'Library stickers', 'Стикеры библиотеки'),
      items: Object.entries(LIBRARY_KIND).map(([id, kind]) => ({
        key: visualPath('library', id),
        label: tr(lang, ...kind.name),
        icon: kind.icon,
      })),
    },
  ];
  const current = groups.flatMap((group) => group.items).find((item) => item.key === selected);
  const src = current && (content.images[current.key] || (!current.icon ? current.key : ''));
  const sections: [ImageSection, string][] = [
    ['avatars', L('Avatar rasmlari', 'Avatar pictures', 'Изображения аватаров')],
    ['news', L('E’lon rasmlari', 'Announcement pictures', 'Изображения объявлений')],
    ['promo', L('Reklama rasmlari', 'Offer pictures', 'Изображения предложений')],
    ['library', L('Kitob muqovalari', 'Library covers', 'Обложки библиотеки')],
    ['push', L('Bildirishnoma rasmlari', 'Notification pictures', 'Изображения уведомлений')],
    ['video', L('Mavzu videolari', 'Topic videos', 'Видео тем')],
  ];

  return (
    <section className="bo-card bo-visuals" aria-labelledby="site-visuals-title">
      <h3 id="site-visuals-title">
        {L('Rasmlar va stikerlar', 'Pictures and stickers', 'Картинки и стикеры')}
      </h3>
      <div className="bo-visual-picker">
        {current && (
          <span className="bo-visual-preview">
            {src ? <img src={src} alt="" /> : <span aria-hidden="true">{current.icon}</span>}
          </span>
        )}
        <select
          className="input"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          aria-label={L(
            'Rasm yoki stiker tanlang',
            'Choose a picture or sticker',
            'Выберите картинку или стикер',
          )}
        >
          <option value="">
            {L(
              'Rasm yoki stiker tanlang',
              'Choose a picture or sticker',
              'Выберите картинку или стикер',
            )}
          </option>
          {groups.map((group) => (
            <optgroup key={group.name} label={group.name}>
              {group.items.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!current}
          onClick={() =>
            current &&
            openSiteImageEditor(current.key, {
              shown: current.icon ? undefined : current.key,
              icon: current.icon,
              label: current.label,
            })
          }
        >
          {L('Rasmni almashtirish', 'Change picture', 'Заменить картинку')}
        </Button>
      </div>
      <div className="bo-visual-links">
        {sections.map(([section, label]) => (
          <Button key={section} size="sm" variant="outline" onClick={() => openSection(section)}>
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
