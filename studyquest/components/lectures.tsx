'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './provider';
import { tr } from '@/lib/points';
import { LECTURE_TYPES, fileSize, type Lecture } from '@/lib/lectures';

/* 📄 Ma'ruzalar dars sahifasida: administrator mavzuga fayl yuklagan bo'lsa, o'quvchi oynasi tepasida «Ma'ruza»
   tugmasi chiqadi. Fayl bo'laklarga bo'lib saqlanadi — yuklab olishda brauzer ularni bitta faylga yig'adi. */

/** Faylni bo'laklab yuklab olib, kompyuter/telefonga saqlaydi. onProgress — 0..1. */
export async function downloadLecture(f: Lecture, onProgress?: (p: number) => void) {
  const parts: ArrayBuffer[] = [];
  for (let n = 0; n < f.chunks; n++) {
    const r = await fetch('/api/site/lecture/' + f.id + '/' + n + '?v=' + f.at);
    if (!r.ok) throw new Error('Faylni yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.');
    parts.push(await r.arrayBuffer());
    onProgress?.((n + 1) / f.chunks);
  }
  const url = URL.createObjectURL(new Blob(parts, { type: LECTURE_TYPES[f.ext].mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const when = (ms: number) => {
  const d = new Date(ms + 5 * 3600000),
    p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
};

/** Bitta fayl qatori: belgi, nom, turi va hajmi, «Yuklab olish» tugmasi (jarayon foizi bilan). */
export function LectureRow({ f, children }: { f: Lecture; children?: React.ReactNode }) {
  const { lang, toast } = useApp();
  const [p, setP] = useState<number | null>(null);
  const t = LECTURE_TYPES[f.ext];
  return (
    <li className="lecture-row">
      <span className="lecture-icon" aria-hidden="true">
        {t.icon}
      </span>
      <span className="lecture-name">
        <b>{f.title}</b>
        <small>
          {t.label} · {fileSize(f.size)} · {when(f.at)}
        </small>
      </span>
      <Button
        size="sm"
        disabled={p !== null}
        aria-label={tr(lang, 'Yuklab olish', 'Download', 'Скачать') + ': ' + f.title}
        onClick={async () => {
          setP(0);
          try {
            await downloadLecture(f, setP);
          } catch (e) {
            toast((e as Error).message);
          } finally {
            setP(null);
          }
        }}
      >
        {p !== null ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
        {p !== null ? Math.round(p * 100) + '%' : tr(lang, 'Yuklab olish', 'Download', 'Скачать')}
      </Button>
      {children}
    </li>
  );
}

export function useTopicLectures(id: string) {
  const [files, setFiles] = useState<Lecture[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/site/lectures?t=' + encodeURIComponent(id))
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((v: { files?: Lecture[] }) => alive && setFiles(v.files || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  return files;
}

export function TopicLectureButton({ id }: { id: string }) {
  const { lang } = useApp();
  const files = useTopicLectures(id);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  if (!files.length) return null;
  const label = tr(lang, 'Ma’ruza', 'Lecture', 'Лекция');
  return (
    <>
      <Button
        variant="outline"
        className="reader-video-button"
        aria-label={label + (files.length > 1 ? ' (' + files.length + ')' : '')}
        onClick={() => setOpen(true)}
      >
        <FileText size={17} />
        <span>{label}</span>
        {files.length > 1 && <em>{files.length}</em>}
      </Button>
      {open &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setOpen(false)}>
            <div
              className="panel lecture-modal"
              role="dialog"
              aria-modal="true"
              aria-label={tr(lang, 'Ma’ruza fayllari', 'Lecture files', 'Файлы лекции')}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="topic-video-head">
                <h2>📄 {tr(lang, 'Ma’ruza fayllari', 'Lecture files', 'Файлы лекции')}</h2>
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
              <ul className="lecture-list">
                {files.map((f) => (
                  <LectureRow key={f.id} f={f} />
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
