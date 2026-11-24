'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clapperboard, Download, MonitorPlay, X } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './provider';
import { tr } from '@/lib/points';
import { ytEmbed, ytWatch, type TopicVideo } from '@/lib/youtube';

/* 📺 Mavzu videolari dars sahifasida: administrator mavzuga YouTube video qo'ysa, o'quvchi oynasi tepasida «Video»
   tugmasi chiqadi va video sayt ichidagi pleyerda (youtube-nocookie.com) ochiladi. 8-mavzuda video alohida slaydda
   ham turadi. Pullik kurs ro'yxati autentifikatsiya va kurs ruxsati bilan olinadi. */

export function useTopicVideos(id: string) {
  const { data, request } = useApp();
  const owner = data?.user?.id || 'guest',
    key = id + ':' + owner;
  const [result, setResult] = useState<{ key: string; videos: TopicVideo[] } | null>(null);
  useEffect(() => {
    let alive = true;
    request('/api/site/video?t=' + encodeURIComponent(id))
      .then((r) => (r.ok ? r.json() : { videos: [] }))
      .then((v: { videos?: TopicVideo[] }) => alive && setResult({ key, videos: v.videos || [] }))
      .catch(() => {
        if (alive) setResult({ key, videos: [] });
      });
    return () => {
      alive = false;
    };
  }, [id, key, request]);
  return { videos: result?.key === key ? result.videos : [], loading: result?.key !== key };
}

export function TopicVideoButton({
  id,
  localVideo,
  title,
  download = false,
}: {
  id: string;
  localVideo?: string;
  title?: string;
  download?: boolean;
}) {
  const { lang, data } = useApp();
  const { videos, loading } = useTopicVideos(id);
  const [open, setOpen] = useState(false),
    [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  if (!videos.length)
    return !loading && localVideo ? (
      <LessonFilmButton video={localVideo} title={title || id} download={download} />
    ) : null;
  const v = videos[Math.min(current, videos.length - 1)];
  const label = tr(lang, 'Video', 'Video', 'Видео');
  return (
    <>
      <Button
        variant="outline"
        className="reader-video-button"
        aria-label={label + (videos.length > 1 ? ' (' + videos.length + ')' : '')}
        onClick={() => setOpen(true)}
      >
        <MonitorPlay size={17} />
        <span>{label}</span>
        {videos.length > 1 && <em>{videos.length}</em>}
      </Button>
      {open &&
        createPortal(
          <div className="modal-backdrop topic-video-backdrop" onClick={() => setOpen(false)}>
            <div
              className="panel topic-video"
              role="dialog"
              aria-modal="true"
              aria-label={'📺 ' + (v.t || label)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="topic-video-head">
                <h2>📺 {v.t || tr(lang, 'Mavzu videosi', 'Topic video', 'Видео по теме')}</h2>
                <button
                  type="button"
                  className="av-close"
                  aria-label={tr(lang, 'Yopish', 'Close', 'Закрыть')}
                  autoFocus
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="topic-video-frame">
                <iframe
                  key={v.key}
                  src={
                    ytEmbed(v.id, v.s) +
                    (data?.lessons.find((l) => l.id === id)?.courseId === 'restoran'
                      ? '&cc_load_policy=1&cc_lang_pref=uz'
                      : '')
                  }
                  title={v.t || 'YouTube video'}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              {videos.length > 1 && (
                <div
                  className="topic-video-list"
                  role="tablist"
                  aria-label={tr(lang, 'Videolar', 'Videos', 'Видео')}
                >
                  {videos.map((x, i) => (
                    <button
                      type="button"
                      role="tab"
                      key={x.key}
                      aria-selected={x.key === v.key}
                      className={x.key === v.key ? 'is-on' : ''}
                      onClick={() => setCurrent(i)}
                    >
                      ▶️ {x.t || tr(lang, 'Video', 'Video', 'Видео') + ' ' + (i + 1)}
                    </button>
                  ))}
                </div>
              )}
              <a
                className="topic-video-yt"
                href={ytWatch(v.id, v.s)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tr(lang, 'YouTube’da ochish ↗', 'Open on YouTube ↗', 'Открыть на YouTube ↗')}
              </a>
              <p className="bo-hint">
                {tr(
                  lang,
                  'Video ochilmasa, YouTube’da oching yoki dars matnidan davom eting.',
                  'If the video does not load, open it on YouTube or continue with the lesson text.',
                  'Если видео не загружается, откройте его на YouTube или продолжайте читать урок.',
                )}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* 🎬 Mavzuning animatsion videosi: MP4, .vtt subtitr va .jpg muqova sayt ichida turadi. */
export const filmFiles = (video: string) => {
  const base = '/legacy/' + video.replace(/\.mp4$/i, '');
  return { mp4: base + '.mp4', vtt: base + '.vtt', poster: base + '.jpg' };
};
export function LessonFilmButton({
  video,
  title,
  download = false,
}: {
  video: string;
  title: string;
  /** o'qituvchi va administratorga — faylni yuklab olish havolasi */
  download?: boolean;
}) {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  const f = filmFiles(video),
    label = tr(lang, 'Animatsion video', 'Animated video', 'Анимационное видео');
  return (
    <>
      <Button
        variant="outline"
        className="reader-video-button"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        <Clapperboard size={17} />
        <span>{tr(lang, 'Video', 'Video', 'Видео')}</span>
      </Button>
      {open &&
        createPortal(
          <div className="modal-backdrop topic-video-backdrop" onClick={() => setOpen(false)}>
            <div
              className="panel topic-video"
              role="dialog"
              aria-modal="true"
              aria-label={'🎬 ' + title}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="topic-video-head">
                <h2>🎬 {title}</h2>
                <button
                  type="button"
                  className="av-close"
                  aria-label={tr(lang, 'Yopish', 'Close', 'Закрыть')}
                  autoFocus
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="topic-video-frame">
                <video controls autoPlay playsInline poster={f.poster} src={f.mp4}>
                  <track kind="subtitles" srcLang="uz" label="O‘zbekcha" src={f.vtt} default />
                </video>
              </div>
              <p className="topic-film-note">
                {tr(
                  lang,
                  'Subtitr ko‘rinmasa, pleyerdagi «CC» tugmasini bosing.',
                  'If subtitles are hidden, press “CC” in the player.',
                  'Если субтитры скрыты, нажмите «CC» в плеере.',
                )}
              </p>
              {download && (
                <p className="topic-film-files">
                  <a href={f.mp4} download>
                    <Download size={15} /> MP4
                  </a>
                  <a href={f.vtt} download>
                    <Download size={15} />{' '}
                    {tr(lang, 'Subtitr (.vtt)', 'Subtitles (.vtt)', 'Субтитры (.vtt)')}
                  </a>
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
