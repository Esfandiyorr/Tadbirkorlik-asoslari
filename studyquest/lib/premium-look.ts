/* 💎 Obunachi profilining bezagi: reytingda (va profilda) ismi va avatari boshqalardan ajralib turadi. Obunachi
   5 xildan birini tanlaydi (Profil → 💎 Premium); tanlamasa — «Oltin toj». Saqlanadi: site/premiumLook/<foydalanuvchi>.
   Ko'rinishi — app/platform.css «.pm-<id>». */
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
] as const;
export type LookId = (typeof LOOKS)[number]['id'];
export const DEFAULT_LOOK: LookId = 'oltin';
export const isLook = (id: unknown): id is LookId => LOOKS.some((l) => l.id === id);
export const lookOf = (id: unknown) => LOOKS.find((l) => l.id === id) || LOOKS[0];
