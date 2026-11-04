'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Expand } from 'lucide-react';
import { ReaderHeading, ReaderControls, useReaderGestures } from './reader-controls';
import { useApp } from './provider';
import { Button } from './ui/button';
import { ProgressBar } from './dashboard';
import slides from '@/lib/crm-slides.json';
import { crmCount, crmTitle } from '@/lib/crm';
export function CrmLesson() {
  const { request, data, refresh } = useApp();
  const scrollArea = useRef<HTMLDivElement>(null);
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
    scrollArea.current?.scrollTo({ top: 0 });
  }, [index]);
  const gestures = useReaderGestures(index, crmCount, loaded, setIndex);
  const slide = slides[index];
  const courseId = data?.lessons.find((l) => l.id === 'm7')?.courseId;
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
        <ReaderHeading
          title={crmTitle}
          topic={7}
          total={data?.lessons.filter((l) => l.courseId === courseId).length || 15}
        />
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
        <div
          {...gestures}
          className="presentation-viewer reader-viewer native-viewer colorful-reader"
        >
          <div ref={scrollArea} className="native-surface crm-reader crm-bright">
            <article
              className="native-document reader-slide-enter"
              key={index}
              data-native-content
              data-native-index={index}
            >
              <div className="inner">
                {original ? (
                  <img src={`/crm/${index + 1}.webp`} alt={slide.title} />
                ) : (
                  <>
                    <div className={'crm-slide-heading' + (index === 0 ? ' crm-cover' : '')}>
                      <img
                        className="crm-terdu-logo"
                        src="/legacy/logo_tersu.png"
                        alt="Termiz davlat universiteti — TerDU"
                        width={512}
                        height={512}
                      />
                      <div>
                        <span className="kicker">7-mavzu · Ma’ruza · CRM</span>
                        {index === 0 && <p className="crm-cover-title">{crmTitle}</p>}
                        <h2>{slide.title}</h2>
                        <div className="crm-slide-meta">
                          <span>📚 Tadbirkorlik asoslari</span>
                          <span>🎓 Termiz davlat universiteti</span>
                          <span>
                            📑 {index + 1} / {crmCount} slayd
                          </span>
                        </div>
                      </div>
                    </div>
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
      <ReaderControls index={index} count={crmCount} ready={loaded} go={setIndex} />
    </section>
  );
}
