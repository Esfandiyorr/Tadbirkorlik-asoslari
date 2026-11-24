/* 💎 Obunachi profilining bezagi: reytingda (va profilda) ismi va avatari boshqalardan ajralib turadi. Obunachi
   12 xildan birini tanlaydi (Profil → 💎 Premium); tanlamasa — «Oltin toj». Saqlanadi: site/premiumLook/<foydalanuvchi>.
   Ko'rinishi — app/platform.css (dastlabki 5 tasi) va app/unistay-ui.css (qolganlari) «.pm-<id>». */
export type Tri = [string, string, string];
export const LOOKS = [
  {
    id: 'oltin',
    icon: '👑',
    name: ['Oltin toj', 'Golden crown', 'Золотая корона'] as Tri,
    text: ['Oltin hoshiya va toj', 'A gold frame and a crown', 'Золотая рамка и корона'] as Tri,
  },
  {
    id: 'kamalak',
    icon: '🌈',
    name: ['Kamalak', 'Rainbow', 'Радуга'] as Tri,
    text: [
      'Ism kamalak ranglarida jilolanadi',
      'Your name shimmers in rainbow colours',
      'Имя переливается цветами радуги',
    ] as Tri,
  },
  {
    id: 'nur',
    icon: '✨',
    name: ['Binafsha nur', 'Violet glow', 'Фиолетовое сияние'] as Tri,
    text: [
      'Qator atrofida yumshoq nur',
      'A soft glow around your row',
      'Мягкое свечение вокруг строки',
    ] as Tri,
  },
  {
    id: 'olmos',
    icon: '💎',
    name: ['Olmos', 'Diamond', 'Бриллиант'] as Tri,
    text: ['Muzdek ko‘k yaltiroq', 'An icy blue sparkle', 'Ледяной голубой блеск'] as Tri,
  },
  {
    id: 'olov',
    icon: '🔥',
    name: ['Olovli', 'Fire', 'Огонь'] as Tri,
    text: ['Olovrang hoshiya va ism', 'A fiery frame and name', 'Огненная рамка и имя'] as Tri,
  },
  {
    id: 'zumrad',
    icon: '🍀',
    name: ['Zumrad', 'Emerald', 'Изумруд'] as Tri,
    text: [
      'TerDU yashili va oltin chiziq',
      'TerDU green with a gold stripe',
      'Зелёный TerDU и золотая полоса',
    ] as Tri,
  },
  {
    id: 'gul',
    icon: '🌸',
    name: ['Sakura', 'Sakura', 'Сакура'] as Tri,
    text: [
      'Pushti gulbarglar va nafis ism',
      'Pink petals and a graceful name',
      'Розовые лепестки и изящное имя',
    ] as Tri,
  },
  {
    id: 'okean',
    icon: '🌊',
    name: ['Okean', 'Ocean', 'Океан'] as Tri,
    text: [
      'Ko‘k-firuza to‘lqin ranglari',
      'Teal and blue ocean waves',
      'Бирюзово-синие волны',
    ] as Tri,
  },
  {
    id: 'tun',
    icon: '🌌',
    name: ['Yulduzli tun', 'Starry night', 'Звёздная ночь'] as Tri,
    text: [
      'To‘q osmon va miltillovchi yulduzlar',
      'A dark sky with twinkling stars',
      'Тёмное небо и мерцающие звёзды',
    ] as Tri,
  },
  {
    id: 'neon',
    icon: '⚡',
    name: ['Neon', 'Neon', 'Неон'] as Tri,
    text: ['Yonib turgan neon hoshiya', 'A glowing neon frame', 'Светящаяся неоновая рамка'] as Tri,
  },
  {
    id: 'shafaq',
    icon: '🌅',
    name: ['Shafaq', 'Sunset', 'Закат'] as Tri,
    text: [
      'Qizg‘ish-binafsha shafaq rangida',
      'In warm sunset colours',
      'В тёплых красках заката',
    ] as Tri,
  },
  {
    id: 'qor',
    icon: '❄️',
    name: ['Qorli', 'Snowy', 'Снежный'] as Tri,
    text: ['Oppoq qor parchalari', 'Soft white snowflakes', 'Мягкие белые снежинки'] as Tri,
  },
] as const;
export type LookId = (typeof LOOKS)[number]['id'];
export const DEFAULT_LOOK: LookId = 'oltin';
export const isLook = (id: unknown): id is LookId => LOOKS.some((l) => l.id === id);
export const lookOf = (id: unknown) => LOOKS.find((l) => l.id === id) || LOOKS[0];
