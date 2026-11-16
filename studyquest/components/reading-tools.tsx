'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import DOMPurify from 'dompurify';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';
import type { Lesson } from '@/lib/types';

type Section = { index: number; title: string; html: string };
type Note = { text: string; bookmarks: number[]; version: number; updatedAt: number };
const initial: Note = { text: '', bookmarks: [], version: 0, updatedAt: 0 };
const escapeHTML = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
function sectionsOf(doc: Document): Section[] {
  return Array.from(doc.querySelectorAll<HTMLElement>('.slide')).map((slide, index) => {
    const clone = slide.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(
        'script,style,link,meta,iframe,video,audio,button,input,textarea,select,#testWrap,#result,.scorebar,.qbox',
      )
      .forEach((e) => e.remove());
    clone.querySelectorAll('*').forEach((e) => {
      for (const name of e.getAttributeNames())
        if (name !== 'href' && name !== 'src' && name !== 'alt') e.removeAttribute(name);
      if (e.tagName === 'IMG') e.remove();
    });
    return {
      index,
      title: slide.dataset.title || String(index + 1),
      html: DOMPurify.sanitize(clone.innerHTML, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['form', 'svg'],
      }),
    };
  });
}
export function ReadingTools({
  lesson,
  engine,
  index,
  go,
  contentLanguage,
  onMode,
}: {
  lesson: Lesson;
  engine: RefObject<HTMLIFrameElement | null>;
  index: number;
  go: (n: number) => void;
  contentLanguage: string;
  onMode: (mode: boolean) => void;
}) {
  const { lang, data, request } = useApp(),
    L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru),
    [panel, setPanel] = useState(false),
    [article, setArticle] = useState(false),
    [sections, setSections] = useState<Section[]>([]),
    [size, setSize] = useState(18),
    [leading, setLeading] = useState(1.8),
    [note, setNote] = useState<Note>(initial),
    [loaded, setLoaded] = useState(false),
    [message, setMessage] = useState(''),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false);
  const user = data?.user?.id,
    storageKey = user ? 'unistay-note:' + user + ':' + lesson.id : '',
    draft = useRef(note),
    pending = useRef(false),
    saving = useRef(false),
    mounted = useRef(true);
  draft.current = note;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem('unistay-reader-style') || 'null');
      if (value) {
        setSize(Math.max(16, Math.min(26, value.size || 18)));
        setLeading(Math.max(1.5, Math.min(2.2, value.leading || 1.8)));
      }
    } catch {}
  }, []);
  const persistDraft = (value: Note) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      setMessage(
        L(
          'Qurilmada joy yetarli emas. Hisobga saqlang.',
          'Device storage is full. Save to your account.',
          'На устройстве нет места. Сохраните в аккаунт.',
        ),
      );
    }
  };
  const persistStyle = (s: number, l: number) => {
    try {
      localStorage.setItem('unistay-reader-style', JSON.stringify({ size: s, leading: l }));
    } catch {}
  };
  const collect = useCallback(() => {
    const doc = engine.current?.contentDocument;
    const sections = doc ? sectionsOf(doc) : [];
    return sections.length
      ? sections
      : lesson.slides.map((s, index) => ({
          index,
          title: s.title,
          html:
            '<h2>' +
            escapeHTML(s.title) +
            '</h2>' +
            DOMPurify.sanitize(s.body, {
              USE_PROFILES: { html: true },
              FORBID_TAGS: ['form', 'iframe', 'script', 'style', 'video', 'audio'],
            }),
        }));
  }, [engine, lesson.slides]);
  const load = useCallback(async () => {
    if (!user || loaded) return;
    let saved: Note | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch {}
    try {
      const r = await request('/api/learning?lesson=' + lesson.id),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      if (!mounted.current) return;
      if (saved) {
        setNote(saved);
        setDirty(true);
        pending.current = true;
        setMessage(
          L(
            'Bu qurilmadagi qoralama tiklandi. Hisobga saqlashingiz mumkin.',
            'Local draft restored. You can save it to your account.',
            'Черновик восстановлен. Можно сохранить в аккаунт.',
          ),
        );
      } else setNote(v);
    } catch {
      if (!mounted.current) return;
      setNote(saved || initial);
      setMessage(
        L(
          'Hisobdagi nusxa olinmadi. Qoralama bu qurilmada saqlanadi; qayta urinishingiz mumkin.',
          'Account copy unavailable. The draft stays on this device; you can retry.',
          'Копия из аккаунта недоступна. Черновик сохраняется на устройстве.',
        ),
      );
    }
    if (mounted.current) setLoaded(true);
  }, [user, loaded, storageKey, lesson.id, request, lang]);
  const save = useCallback(async () => {
    if (!user || saving.current) return;
    persistDraft(draft.current);
    pending.current = true;
    if (!navigator.onLine) {
      setMessage(
        L(
          'Internet yo‘q. Qoralama qurilmada saqlandi, ulanish qaytganda yuboriladi.',
          'Offline. Draft saved on this device; it will sync when online.',
          'Нет сети. Черновик сохранён и будет отправлен после подключения.',
        ),
      );
      return;
    }
    saving.current = true;
    setBusy(true);
    const outgoing = draft.current;
    try {
      const r = await request('/api/learning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            text: outgoing.text,
            bookmarks: outgoing.bookmarks,
            version: outgoing.version,
          }),
        }),
        value = await r.json();
      if (!r.ok) throw Error(value.error);
      if (!mounted.current) return;
      if (
        draft.current.text === outgoing.text &&
        JSON.stringify(draft.current.bookmarks) === JSON.stringify(outgoing.bookmarks)
      ) {
        setNote(value);
        setDirty(false);
        pending.current = false;
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        setMessage(L('Hisobingizga saqlandi.', 'Saved to your account.', 'Сохранено в аккаунт.'));
      } else {
        const newer = { ...draft.current, version: value.version };
        setNote(newer);
        persistDraft(newer);
      }
    } catch (e) {
      if (mounted.current) setMessage((e as Error).message);
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [user, storageKey, lesson.id, request, lang]);
  useEffect(() => {
    const sync = () => {
      if (pending.current) void save();
    };
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [save]);
  useEffect(() => {
    if (panel && !loaded) void load();
  }, [panel, loaded, load]);
  useEffect(() => {
    if (!article) return;
    setSections([]);
    const timer = setInterval(() => {
      const value = collect();
      if (value.length) {
        setSections(value);
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [article, contentLanguage, collect]);
  useEffect(() => {
    if (article && sections.length)
      document.getElementById('reading-section-' + index)?.scrollIntoView({ block: 'start' });
  }, [article, sections, index]);
  const toggleArticle = () => {
    const value = !article;
    setArticle(value);
    onMode(value);
  };
  const change = (value: Note) => {
    setNote(value);
    setDirty(true);
    pending.current = true;
    persistDraft(value);
  };
  const download = () => {
    const items = collect();
    if (!items.length) {
      setMessage(
        L('Matn yuklanishini kuting.', 'Wait for the text to load.', 'Дождитесь загрузки текста.'),
      );
      return;
    }
    const html =
      '<!doctype html><html lang="' +
      contentLanguage +
      '"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
      escapeHTML(lesson.title) +
      '</title><style>body{max-width:760px;margin:30px auto;padding:20px;font:18px/1.8 system-ui;color:#202030}section{border-bottom:1px solid #ddd;padding:20px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px}a{color:#6530bb}</style><p>Unistay · ' +
      L(
        'Internetsiz o‘qish uchun matn. Test, video va ball uchun saytga qayting.',
        'Offline reading text. Return to the site for quizzes, video and points.',
        'Текст для чтения без сети. Тесты, видео и баллы доступны на сайте.',
      ) +
      '</p>' +
      items.map((s) => '<section>' + s.html + '</section>').join('') +
      '</html>';
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })),
      a = document.createElement('a');
    a.href = url;
    a.download = 'Unistay-' + lesson.id + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="reading-tools-bar">
        <Button variant="outline" aria-expanded={panel} onClick={() => setPanel(!panel)}>
          Aa · {L('O‘qish va qaydlar', 'Reading & notes', 'Чтение и заметки')}
        </Button>
        <Button
          variant={article ? 'secondary' : 'outline'}
          aria-pressed={article}
          onClick={toggleArticle}
        >
          {article
            ? L('Slaydlarga qaytish', 'Back to slides', 'К слайдам')
            : L('Uzluksiz matn', 'Continuous text', 'Сплошной текст')}
        </Button>
        <Button variant="ghost" onClick={download}>
          {L('Internetsiz o‘qish', 'Read offline', 'Читать без сети')} ↓
        </Button>
      </div>
      {panel && (
        <aside
          className="reading-preferences panel"
          aria-label={L('O‘qish sozlamalari', 'Reading settings', 'Настройки чтения')}
        >
          <label htmlFor="reading-size">{L('Matn o‘lchami', 'Text size', 'Размер текста')}</label>
          <input
            id="reading-size"
            type="range"
            min="16"
            max="26"
            value={size}
            onChange={(e) => {
              const n = Number(e.target.value);
              setSize(n);
              persistStyle(n, leading);
            }}
          />
          <label htmlFor="reading-leading">
            {L('Satr oralig‘i', 'Line spacing', 'Межстрочный интервал')}
          </label>
          <select
            id="reading-leading"
            value={leading}
            onChange={(e) => {
              const n = Number(e.target.value);
              setLeading(n);
              persistStyle(size, n);
            }}
          >
            <option value="1.5">1,5</option>
            <option value="1.8">1,8</option>
            <option value="2.2">2,2</option>
          </select>
          <p>
            {L(
              'Sozlamalar uzluksiz matn rejimiga qo‘llanadi.',
              'Settings apply to continuous text.',
              'Настройки применяются к сплошному тексту.',
            )}
          </p>
          {user ? (
            <>
              <label htmlFor="reading-notes">
                {L('Shaxsiy qaydlar', 'Private notes', 'Личные заметки')}
              </label>
              <textarea
                id="reading-notes"
                maxLength={8000}
                rows={5}
                disabled={!loaded}
                value={note.text}
                onChange={(e) => change({ ...note, text: e.target.value })}
              />
              <div className="reading-note-actions">
                <Button disabled={!loaded || busy || !dirty} onClick={save}>
                  {busy
                    ? L('Saqlanmoqda…', 'Saving…', 'Сохранение…')
                    : L('Hisobga saqlash', 'Save to account', 'Сохранить в аккаунт')}
                </Button>
                <Button
                  variant="outline"
                  disabled={!loaded}
                  onClick={() =>
                    change({
                      ...note,
                      bookmarks: note.bookmarks.includes(index)
                        ? note.bookmarks.filter((x) => x !== index)
                        : [...note.bookmarks, index],
                    })
                  }
                >
                  {note.bookmarks.includes(index) ? '★ ' : '☆ '}
                  {L('Joriy slayd', 'Current slide', 'Текущий слайд')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      dirty &&
                      !confirm(
                        L(
                          'Qoralama qurilmada qoladi. Hisobdagi nusxani ko‘rasizmi?',
                          'Keep the local draft and open the account copy?',
                          'Оставить черновик на устройстве и открыть копию из аккаунта?',
                        ),
                      )
                    )
                      return;
                    try {
                      const r = await request('/api/learning?lesson=' + lesson.id);
                      const v = await r.json();
                      if (!r.ok) throw Error(v.error);
                      setNote(v);
                      setDirty(false);
                      pending.current = false;
                      setMessage(
                        L(
                          'Hisobdagi nusxa ochildi. Oldingi qoralama qurilmada saqlanmoqda.',
                          'Account copy opened. The previous local draft is kept.',
                          'Открыта копия из аккаунта. Черновик остался на устройстве.',
                        ),
                      );
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                >
                  {L('Hisobdagi nusxa', 'Account copy', 'Копия из аккаунта')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy || !loaded}
                  onClick={() => {
                    try {
                      const local = JSON.parse(
                        localStorage.getItem(storageKey) || 'null',
                      ) as Note | null;
                      if (local) {
                        change({ ...local, version: note.version });
                        setMessage(
                          L(
                            'Qurilmadagi qoralama ochildi. Saqlashdan oldin hisobdagi nusxa bilan solishtiring.',
                            'Local draft opened. Compare with the account copy before saving.',
                            'Черновик открыт. Перед сохранением сравните с копией аккаунта.',
                          ),
                        );
                      } else
                        setMessage(
                          L(
                            'Qurilmada qoralama yo‘q.',
                            'No local draft.',
                            'На устройстве нет черновика.',
                          ),
                        );
                    } catch {
                      setMessage(
                        L(
                          'Qoralama o‘qilmadi.',
                          'Could not read the draft.',
                          'Не удалось открыть черновик.',
                        ),
                      );
                    }
                  }}
                >
                  {L('Qurilmadagi qoralama', 'Local draft', 'Черновик на устройстве')}
                </Button>
              </div>
              <div className="reading-bookmarks">
                {note.bookmarks.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      if (article) {
                        document.getElementById('reading-section-' + n)?.scrollIntoView();
                      } else go(n);
                    }}
                  >
                    ★ {n + 1}
                  </button>
                ))}
              </div>
              <p role="status">
                {message ||
                  (dirty
                    ? L(
                        'Qoralama shu qurilmada saqlanmoqda.',
                        'Draft saved on this device.',
                        'Черновик сохраняется на устройстве.',
                      )
                    : '')}
              </p>
            </>
          ) : (
            <p>
              {L(
                'Shaxsiy qaydlar uchun hisobingizga kiring.',
                'Sign in for private notes.',
                'Войдите для личных заметок.',
              )}
            </p>
          )}
        </aside>
      )}
      {article && (
        <article
          className="continuous-reading panel"
          lang={contentLanguage}
          style={{ fontSize: size, lineHeight: leading }}
        >
          <p className="reading-article-note">
            {L(
              'Bu rejimda matn o‘qiladi. Test va topshiriqlar uchun slaydlarga qayting.',
              'Read the text here. Return to slides for quizzes and exercises.',
              'Здесь доступен текст. Для тестов и заданий вернитесь к слайдам.',
            )}
          </p>
          {sections.map((s) => (
            <section id={'reading-section-' + s.index} key={s.index}>
              <a
                href={'#reading-section-' + s.index}
                onClick={(e) => {
                  e.preventDefault();
                  go(s.index);
                  e.currentTarget.closest('section')?.scrollIntoView();
                }}
              >
                {s.index + 1}. {s.title}
              </a>
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))}
        </article>
      )}
    </>
  );
}
