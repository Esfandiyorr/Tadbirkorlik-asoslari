/* 📺 YouTube havolalari: administrator istalgan ko'rinishdagi havolani qo'yadi (watch?v=, youtu.be/, shorts/, embed/,
   live/), saytda esa faqat 11 belgili video ID saqlanadi va youtube-nocookie.com pleyerida ochiladi. */

export const YT_ID = /^[A-Za-z0-9_-]{11}$/;
export type TopicVideo = { key: string; id: string; t?: string; s?: number; at: number };

/** «1h2m3s», «90», «90s», «1:30» → soniya; tushunarsiz bo'lsa 0. */
function seconds(v: string | null) {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Number(v);
  if (/^\d+(?::\d{1,2}){1,2}$/.test(v))
    return v
      .split(':')
      .map(Number)
      .reduce((s, n) => s * 60 + n, 0);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(v);
  return m && v ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

/** YouTube havolasi yoki ID → {id, s} (s — boshlanish soniyasi); boshqa sayt yoki noto'g'ri havola — null. */
export function parseYouTube(input: string): { id: string; s: number } | null {
  const raw = input.trim();
  if (YT_ID.test(raw)) return { id: raw, s: 0 };
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^(?:www\.|m\.|music\.)/, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.split('/')[1] || '';
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = u.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1] || '';
  } else return null;
  if (!YT_ID.test(id)) return null;
  const s = Math.min(86400, seconds(u.searchParams.get('t') || u.searchParams.get('start')));
  return { id, s };
}

export const ytEmbed = (id: string, s = 0) =>
  'https://www.youtube-nocookie.com/embed/' + id + '?rel=0' + (s > 0 ? '&start=' + s : '');
export const ytThumb = (id: string) => 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg';
export const ytWatch = (id: string, s = 0) =>
  'https://www.youtube.com/watch?v=' + id + (s > 0 ? '&t=' + s + 's' : '');
