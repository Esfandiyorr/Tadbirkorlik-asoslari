'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { LectureRow } from '../lectures';
import {
  LECTURES_PER_TOPIC,
  LECTURE_ACCEPT,
  LECTURE_MAX,
  fileSize,
  lectureExt,
  type Lecture,
} from '@/lib/lectures';

/* 📄 Sayt boshqaruvi → Ma'ruzalar: har bir mavzuga ma'ruza fayllarini (PDF, Word, PowerPoint, 30 MB gacha) yuklash,
   nomini o'zgartirish va o'chirish. Fayl 2,5 MB lik bo'laklarga bo'linib yuklanadi (Vercel cheklovi). */

type View = { topics: { id: string; title: string; files: Lecture[] }[]; used: number };

export function LectureAdmin() {
  const { request, toast } = useApp();
  const L = useL();
  const [data, setData] = useState<View | null>(null),
    [error, setError] = useState(''),
    [current, setCurrent] = useState('m8'),
    [file, setFile] = useState<File | null>(null),
    [title, setTitle] = useState(''),
    [progress, setProgress] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/lectures'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setData(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function json(input: unknown) {
    const r = await request('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
      v = await r.json();
    if (!r.ok) throw new Error(v.error || 'Xatolik');
    return v;
  }
  async function upload() {
    if (!file || !data) return;
    setBusy(true);
    setProgress(0);
    try {
      const begun = (await json({
        op: 'begin',
        t: current,
        name: file.name,
        size: file.size,
        ...(title.trim() ? { title: title.trim() } : {}),
      })) as { id: string; chunk: number; chunks: number };
      for (let n = 0; n < begun.chunks; n++) {
        const form = new FormData();
        form.append('id', begun.id);
        form.append('n', String(n));
        form.append('file', file.slice(n * begun.chunk, (n + 1) * begun.chunk), 'part');
        const r = await request('/api/lectures', { method: 'POST', body: form }),
          v = await r.json();
        if (!r.ok) throw new Error(v.error || 'Xatolik');
        setProgress((n + 1) / begun.chunks);
      }
      setData(await json({ op: 'finish', id: begun.id }));
      setFile(null);
      setTitle('');
      if (picker.current) picker.current.value = '';
      toast(
        L(
          'Ma’ruza yuklandi ✅ Talabalar uni dars oynasidagi «📄 Ma’ruza» tugmasidan oladi.',
          'Lecture uploaded ✅ Students get it from the “📄 Lecture” button in the lesson.',
          'Лекция загружена ✅ Студенты скачают её кнопкой «📄 Лекция».',
        ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const topic = data.topics.find((t) => t.id === current) || data.topics[0];
  const bad = file
    ? !lectureExt(file.name)
      ? L(
          'Faqat PDF, Word (.docx, .doc) yoki PowerPoint (.pptx, .ppt) fayl yuklanadi.',
          'Only PDF, Word (.docx, .doc) or PowerPoint (.pptx, .ppt) files.',
          'Только PDF, Word или PowerPoint.',
        )
      : file.size > LECTURE_MAX
        ? L('Fayl 30 MB dan oshmasin.', 'The file must be under 30 MB.', 'Файл до 30 МБ.')
        : ''
    : '';
  const full = topic.files.length >= LECTURES_PER_TOPIC;
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
                {t.files.length
                  ? '📄 ' +
                    L(
                      `${t.files.length} ta fayl`,
                      `${t.files.length} file(s)`,
                      `файлов: ${t.files.length}`,
                    )
                  : L('fayl yo‘q', 'no files', 'нет файлов')}
              </small>
            </button>
          </li>
        ))}
      </ul>
      <div className="bo-card lecture-admin">
        <h3>{topic.title}</h3>
        {topic.files.length ? (
          <ul className="lecture-list">
            {topic.files.map((f) => (
              <LectureRow key={f.id} f={f}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  aria-label={L('Nomini o‘zgartirish', 'Rename', 'Переименовать') + ': ' + f.title}
                  onClick={async () => {
                    const next = prompt(
                      L('Yangi nom:', 'New title:', 'Новое название:'),
                      f.title,
                    )?.trim();
                    if (!next || next === f.title) return;
                    try {
                      setData(await json({ op: 'rename', id: f.id, title: next.slice(0, 120) }));
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + f.title}
                  onClick={async () => {
                    if (
                      !confirm(
                        L(
                          `«${f.title}» o‘chirilsinmi?`,
                          `Delete “${f.title}”?`,
                          `Удалить «${f.title}»?`,
                        ),
                      )
                    )
                      return;
                    try {
                      setData(await json({ op: 'remove', id: f.id }));
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </LectureRow>
            ))}
          </ul>
        ) : (
          <p className="bo-hint">
            {L(
              'Bu mavzuga hali ma’ruza yuklanmagan.',
              'No lecture files for this topic yet.',
              'К этой теме ещё не загружены лекции.',
            )}
          </p>
        )}
        <form
          className="bo-form"
          onSubmit={(e) => {
            e.preventDefault();
            void upload();
          }}
        >
          <h3>⬆️ {L('Ma’ruza yuklash', 'Upload a lecture', 'Загрузить лекцию')}</h3>
          <label className="lecture-file">
            <Upload size={16} aria-hidden="true" />
            <span>
              {file
                ? file.name + ' · ' + fileSize(file.size)
                : L(
                    'Faylni tanlang: PDF, Word yoki PowerPoint (30 MB gacha)',
                    'Choose a file: PDF, Word or PowerPoint (up to 30 MB)',
                    'Выберите файл: PDF, Word или PowerPoint (до 30 МБ)',
                  )}
            </span>
            <input
              ref={picker}
              type="file"
              accept={LECTURE_ACCEPT}
              disabled={busy}
              aria-label={L('Ma’ruza fayli', 'Lecture file', 'Файл лекции')}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <input
            className="input"
            maxLength={120}
            value={title}
            disabled={busy}
            onChange={(e) => setTitle(e.target.value)}
            aria-label={L('Fayl nomi', 'Title', 'Название')}
            placeholder={L(
              'Nomi (ixtiyoriy), masalan: «8-mavzu ma’ruza matni»',
              'Title (optional), e.g. “Topic 8 lecture notes”',
              'Название (необязательно)',
            )}
          />
          {bad && <p className="bo-hint bo-bad">{bad}</p>}
          {full && (
            <p className="bo-hint bo-bad">
              {L(
                `Bitta mavzuga ${LECTURES_PER_TOPIC} tagacha fayl yuklanadi — avval eskisini o‘chiring.`,
                `Up to ${LECTURES_PER_TOPIC} files per topic — delete an old one first.`,
                `Не более ${LECTURES_PER_TOPIC} файлов на тему.`,
              )}
            </p>
          )}
          {progress !== null && (
            <div
              className="lecture-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: progress * 100 + '%' }} />
              <span>{Math.round(progress * 100)}%</span>
            </div>
          )}
          <div className="bo-actions">
            <Button type="submit" disabled={!file || !!bad || full || busy}>
              <Upload size={16} />
              {busy
                ? L('Yuklanmoqda…', 'Uploading…', 'Загрузка…')
                : L('Mavzuga yuklash', 'Upload to the topic', 'Загрузить в тему')}
            </Button>
          </div>
          <p className="bo-hint">
            {L(
              `Talabalar faylni dars oynasi tepasidagi «📄 Ma’ruza» tugmasi orqali yuklab oladi. Bitta mavzuga ${LECTURES_PER_TOPIC} tagacha fayl. Hamma ma’ruzalar hajmi: ${fileSize(data.used || 0)}.`,
              `Students download it with the “📄 Lecture” button above the lesson. Up to ${LECTURES_PER_TOPIC} files per topic. All lectures: ${fileSize(data.used || 0)}.`,
              `Студенты скачивают файл кнопкой «📄 Лекция». До ${LECTURES_PER_TOPIC} файлов на тему. Всего: ${fileSize(data.used || 0)}.`,
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
