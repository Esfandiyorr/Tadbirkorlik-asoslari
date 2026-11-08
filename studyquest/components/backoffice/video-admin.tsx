'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAdminView, useL } from './common';
import { parseYouTube, ytEmbed, ytThumb, type TopicVideo } from '@/lib/youtube';

/* 📺 Sayt boshqaruvi → Mavzu videolari: mavzuga YouTube havolasini qo'yish. Talabalar videoni dars sahifasidagi
   «📺 Video» tugmasi orqali (8-mavzuda — alohida slaydda ham) sayt ichidagi pleyerda ko'radi. */

type View = { topics: { id: string; title: string; videos: TopicVideo[] }[] };

export function VideoAdmin() {
  const L = useL();
  const { data, error, busy, act } = useAdminView<View>('videos', 'videos');
  const [current, setCurrent] = useState('m8'),
    [url, setUrl] = useState(''),
    [title, setTitle] = useState('');
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const topic = data.topics.find((t) => t.id === current) || data.topics[0];
  const preview = url.trim() ? parseYouTube(url) : null;
  async function add() {
    if (!preview) return;
    try {
      await act(
        {
          op: 'add',
          t: topic.id,
          url: url.trim(),
          ...(title.trim() ? { title: title.trim() } : {}),
        },
        'add',
        L(
          'Video qo‘shildi ✅ Talabalar uni bir daqiqa ichida ko‘radi.',
          'Video added ✅ Students will see it within a minute.',
          'Видео добавлено ✅ Студенты увидят его в течение минуты.',
        ),
      );
      setUrl('');
      setTitle('');
    } catch {}
  }
  return (
    <div className="bo-quiz">
      <ul className="bo-topics">
        {data.topics.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={'bo-topic' + (t.id === topic.id ? ' is-on' : '')}
              aria-pressed={t.id === topic.id}
              onClick={() => setCurrent(t.id)}
            >
              <b>{t.title}</b>
              <small>
                {t.videos.length
                  ? '📺 ' +
                    L(
                      `${t.videos.length} ta video`,
                      `${t.videos.length} video(s)`,
                      `видео: ${t.videos.length}`,
                    )
                  : L('video yo‘q', 'no video', 'нет видео')}
              </small>
            </button>
          </li>
        ))}
      </ul>
      <div className="bo-card video-admin">
        <h3>{topic.title}</h3>
        {topic.videos.length ? (
          <ul className="video-admin-list">
            {topic.videos.map((v) => (
              <li key={v.key}>
                <img src={ytThumb(v.id)} alt="" loading="lazy" />
                <span>
                  <b>{v.t || L('Nomsiz video', 'Untitled video', 'Видео без названия')}</b>
                  <small>
                    youtu.be/{v.id}
                    {v.s ? ' · ' + L(`${v.s}-soniyadan`, `from ${v.s}s`, `с ${v.s} с`) : ''}
                  </small>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busy}
                  aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + (v.t || v.id)}
                  onClick={() =>
                    confirm(L('Video o‘chirilsinmi?', 'Delete this video?', 'Удалить видео?')) &&
                    void act({ op: 'remove', t: topic.id, key: v.key }, 'rm' + v.key).catch(
                      () => {},
                    )
                  }
                >
                  <Trash2 size={15} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bo-hint">
            {L(
              'Bu mavzuda hali video yo‘q. Quyida YouTube havolasini qo‘ying.',
              'No video in this topic yet. Paste a YouTube link below.',
              'В этой теме пока нет видео. Вставьте ссылку YouTube ниже.',
            )}
          </p>
        )}
        <form
          className="bo-form"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <h3>➕ {L('Yangi video', 'New video', 'Новое видео')}</h3>
          <input
            className="input"
            required
            maxLength={300}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label={L('YouTube havolasi', 'YouTube link', 'Ссылка YouTube')}
            placeholder="https://www.youtube.com/watch?v=…  ·  https://youtu.be/…"
          />
          <input
            className="input"
            maxLength={90}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label={L('Video nomi', 'Video title', 'Название видео')}
            placeholder={L(
              'Nomi (ixtiyoriy), masalan: «Reklama psixologiyasi — 12 daqiqada»',
              'Title (optional), e.g. “Advertising psychology in 12 minutes”',
              'Название (необязательно)',
            )}
          />
          {url.trim() && !preview && (
            <p className="bo-hint bo-bad">
              {L(
                'Bu YouTube havolasiga o‘xshamaydi. Videoni YouTube’da oching va manzil satridagi havolani (yoki «Ulashish» tugmasidagi havolani) nusxalang.',
                'This does not look like a YouTube link. Open the video on YouTube and copy the address (or the link from “Share”).',
                'Это не похоже на ссылку YouTube. Скопируйте адрес видео или ссылку из «Поделиться».',
              )}
            </p>
          )}
          {preview && (
            <div className="video-admin-preview">
              <iframe
                src={ytEmbed(preview.id, preview.s)}
                title={L('Oldindan ko‘rish', 'Preview', 'Предпросмотр')}
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )}
          <div className="bo-actions">
            <Button type="submit" disabled={!preview || !!busy}>
              <Plus size={16} />
              {L('Mavzuga qo‘shish', 'Add to the topic', 'Добавить в тему')}
            </Button>
          </div>
          <p className="bo-hint">
            {L(
              'Talabalar videoni dars oynasi tepasidagi «📺 Video» tugmasi orqali ko‘radi; 8-mavzuda u «📺 Video dars» slaydida ham chiqadi. Video YouTube’da «Ochiq» yoki «Havola orqali» bo‘lishi va joylashtirishga (embed) ruxsat berilgan bo‘lishi kerak.',
              'Students open the video with the “📺 Video” button above the lesson; in topic 8 it also appears on the “📺 Video lesson” slide. The video must be Public or Unlisted on YouTube and allow embedding.',
              'Студенты открывают видео кнопкой «📺 Видео» над уроком; в теме 8 оно также на слайде «📺 Видеоурок». Видео должно быть открытым или доступным по ссылке и разрешать встраивание.',
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
