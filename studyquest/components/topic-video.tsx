'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MonitorPlay, X } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './provider';
import { tr } from '@/lib/points';
import { ytEmbed, ytWatch, type TopicVideo } from '@/lib/youtube';

/* 📺 Mavzu videolari dars sahifasida: administrator mavzuga YouTube video qo'ysa, o'quvchi oynasi tepasida «Video»
   tugmasi chiqadi va video sayt ichidagi pleyerda (youtube-nocookie.com) ochiladi. 8-mavzuda video alohida slaydda
   ham turadi. Ro'yxat ochiq va CDN keshida (/api/site/video). */

export function useTopicVideos(id: string) {
  const [videos, setVideos] = useState<TopicVideo[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/site/video?t=' + encodeURIComponent(id))
      .then((r) => (r.ok ? r.json() : { videos: [] }))
      .then((v: { videos?: TopicVideo[] }) => alive && setVideos(v.videos || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return videos;
}

export function TopicVideoButton({ id }: { id: string }) {
  const { lang } = useApp();
  const videos = useTopicVideos(id);
  const [open, setOpen] = useState(false),
    [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  if (!videos.length) return null;
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
                  src={ytEmbed(v.id, v.s)}
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
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
