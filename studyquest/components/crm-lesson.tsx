'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Expand } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProgressBar } from './dashboard';
import slides from '@/lib/crm-slides.json';
import { crmCount, crmTitle } from '@/lib/crm';
export function CrmLesson() {
  const { request, data, refresh } = useApp();
  const [index, setIndex] = useState(0),
    [seen, setSeen] = useState<number[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [original, setOriginal] = useState(false);
  useEffect(() => {
    let live = true;
    request('/api/crm-progress')
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw Error(p.error);
        if (live) {
          setIndex(p.last);
          setSeen(p.seen);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
      void refresh();
    };
  }, [request]);
  useEffect(() => {
    if (!loaded || data?.user?.role !== 'student') return;
    let timer: ReturnType<typeof setTimeout>;
    const save = async () => {
      if (document.hidden || !document.hasFocus()) return;
      try {
        const r = await request('/api/crm-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index }),
        });
        const v = await r.json();
        if (!r.ok) throw Error(v.error);
        setSeen((old) => (old.includes(index) ? old : [...old, index]));
      } catch (e) {
        setError((e as Error).message);
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (!document.hidden && document.hasFocus()) timer = setTimeout(save, 5000);
    };
    schedule();
    window.addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', schedule);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [index, loaded, request, data?.user?.role]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        !loaded ||
        (event.target instanceof Element && event.target.closest('input,textarea,select'))
      )
        return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex((n) =>
          Math.max(0, Math.min(crmCount - 1, n + (event.key === 'ArrowRight' ? 1 : -1))),
        );
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [loaded]);
  const slide = slides[index];
  return (
    <section className="focus-reader" aria-label={crmTitle}>
      <header className="reader-toolbar">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kursga qaytish"
          onClick={() => (location.hash = 'course/tad-asoslari')}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1>{crmTitle}</h1>
        <div className="reader-navigation">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous slide"
            disabled={index === 0 || !loaded}
            onClick={() => setIndex(index - 1)}
          >
            <ArrowLeft size={18} />
          </Button>
          <span>
            {index + 1} / {crmCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next slide"
            disabled={index === crmCount - 1 || !loaded}
            onClick={() => setIndex(index + 1)}
          >
            <ArrowRight size={18} />
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setOriginal(!original)}>
          {original ? 'O‘qish ko‘rinishi' : 'Asl slayd'}
        </Button>
        <Button asChild variant="ghost" size="icon">
          <a href="/crm/CRM-taqdimot.pdf" download aria-label="PDF yuklash">
            <Download size={18} />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="To‘liq ekran"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
        >
          <Expand size={18} />
        </Button>
      </header>
      <ProgressBar value={(seen.length / crmCount) * 100} />
      {error && (
        <p role="alert" className="crm-notice">
          {error}
        </p>
      )}
      {!loaded ? (
        error ? (
          <Button onClick={() => location.reload()}>Qayta urinish</Button>
        ) : (
          <div className="skeleton reader-loading" />
        )
      ) : (
        <div className="presentation-viewer reader-viewer native-viewer">
          <div className="native-surface lesson-color-m7 crm-reader">
            <article
              className="native-document"
              key={index}
              data-native-content
              data-native-index={index}
            >
              <div className="inner">
                <span className="kicker">7-mavzu · CRM · {index + 1} / 22</span>
                {original ? (
                  <img src={`/crm/${index + 1}.webp`} alt={slide.title} />
                ) : (
                  <>
                    <h2>{slide.title}</h2>
                    <div className="crm-blocks">
                      {slide.blocks.map((text, i) => (
                        <p key={i}>{text}</p>
                      ))}
                    </div>
                    {slide.links
                      .filter((link) => link.startsWith('https://'))
                      .map((link) => (
                        <p key={link}>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            Manba: {link}
                          </a>
                        </p>
                      ))}
                  </>
                )}
                <p className="native-reading-note">
                  {seen.length} / 22 slayd o‘qildi. Avvalgi ball va baholaringiz saqlangan.
                </p>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
