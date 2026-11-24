'use client';
import { useCallback, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { EXAM_PER_TOPIC, FINAL, parseQuestions, type ExamAdminView } from '@/lib/exam';

/* 🎯 Sayt boshqaruvi → Yakuniy test savollari: mavzuni tanlab savollarni matn sifatida qo'yish (Word'dan nusxa) yoki
   .txt faylni yuklash. Ikki format: HEMIS («++++», «====», to'g'ri javob oldida «#») yoki raqamli («1. Savol»,
   «A) …», to'g'ri javob oldida/oxirida «*» yoki «Javob: B»). Saqlashdan oldin nechta savol o'qilgani ko'rinadi. */
const SAMPLE = `1. Tadbirkorlik faoliyatining asosiy maqsadi nima?
A) Davlat byudjetini to‘ldirish
*B) Foyda olish
C) Ish vaqtini qisqartirish
D) Soliqdan ozod bo‘lish

2. Biznes-reja kim uchun tuziladi?
A) Faqat bank uchun
B) Faqat davlat uchun
C) Faqat raqobatchilar uchun
D) Tadbirkor, investor va bank uchun
Javob: D`;

async function post<T>(request: (u: string, i?: RequestInit) => Promise<Response>, input: unknown) {
  const r = await request('/api/exam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: 'admin', input }),
  });
  const v = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((v as { error?: string }).error || 'Xatolik');
  return v as T;
}

export function ExamAdmin() {
  const L = useL();
  const { request, toast } = useApp();
  const [view, setView] = useState<ExamAdminView | null>(null);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/exam?admin=1'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      setTopic((t) => t || v.topics[0]?.id || '');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <p className="error-state">{error}</p>;
  if (!view) return <div className="skeleton" style={{ height: 220 }} />;
  const cur = view.topics.find((t) => t.id === topic) || view.topics[0];
  const parsed = text.trim() ? parseQuestions(text) : null;
  async function save() {
    if (!cur || !parsed?.items.length) return;
    if (
      replace &&
      cur.count &&
      !window.confirm(
        L(
          `${cur.n}-mavzudagi ${cur.count} ta savol o‘chirilib, yangilari qo‘yilsinmi?`,
          `Replace the ${cur.count} questions of topic ${cur.n}?`,
          `Заменить ${cur.count} вопросов темы ${cur.n}?`,
        ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await post<{ admin: ExamAdminView; added: number; updated: number }>(request, {
        op: 'import',
        topic: cur.id,
        text,
        replace,
      });
      setView(r.admin);
      setText('');
      toast(
        L(
          `✅ Saqlandi: ${r.added} ta yangi${r.updated ? `, ${r.updated} ta yangilandi` : ''}.`,
          `✅ Saved: ${r.added} new${r.updated ? `, ${r.updated} updated` : ''}.`,
          `✅ Сохранено: ${r.added} новых${r.updated ? `, ${r.updated} обновлено` : ''}.`,
        ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function act(input: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await post<{ admin: ExamAdminView }>(request, input);
      setView(r.admin);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="exa">
      <ul className="mk-tiles is-admin">
        <li className="is-violet">
          <small>{L('Yuklangan savollar', 'Questions uploaded', 'Загружено вопросов')}</small>
          <b>
            {view.total}/{view.topics.length * EXAM_PER_TOPIC}
          </b>
        </li>
        <li className="is-blue">
          <small>{L('Bo‘limi ochiq', 'Have access', 'С доступом')}</small>
          <b>{view.buyers}</b>
        </li>
        <li className="is-green">
          <small>{L('Berilgan sertifikatlar', 'Certificates', 'Сертификатов')}</small>
          <b>{view.certs}</b>
        </li>
        <li className="is-amber">
          <small>{L('Yakuniy sinov', 'Final exam', 'Итоговый тест')}</small>
          <b>
            {FINAL.perTopic}×15 · {FINAL.minutes}′ · {FINAL.pass} %
          </b>
        </li>
      </ul>
      <p className="muted exa-note">
        {L(
          'Bo‘lim «Pullik xizmatlar»da sotiladi (narxi — «To‘lov yo‘riqnomasi» bo‘limida). To‘lovni tasdiqlaganingizda talabaga o‘zi ochiladi. Savollar yuklanmaguncha talabalar «Testlar tez orada yuklanadi» yozuvini ko‘radi.',
          'The section is sold in “Paid services” (price under “Payment instructions”). Confirming the payment opens it automatically. Until questions are uploaded, students see “Questions are coming soon”.',
          'Раздел продаётся в «Платных услугах» (цена — в «Инструкции по оплате»). После подтверждения оплаты он откроется сам. Пока вопросов нет, студенты видят «Вопросы скоро появятся».',
        )}
      </p>
      <div className="exa-topics" role="tablist" aria-label={L('Mavzular', 'Topics', 'Темы')}>
        {view.topics.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === cur?.id}
            className={
              (t.id === cur?.id ? 'on ' : '') +
              (t.count >= EXAM_PER_TOPIC ? 'is-full' : t.count ? 'is-part' : '')
            }
            onClick={() => {
              setTopic(t.id);
              setShowList(false);
            }}
            title={t.title}
          >
            {t.n} <em>{t.count}</em>
          </button>
        ))}
      </div>
      {cur && (
        <section className="panel exa-topic">
          <h3>
            {cur.n}. {cur.title}{' '}
            <small className="muted">
              · {cur.count}/{EXAM_PER_TOPIC}
            </small>
          </h3>
          <label className="exa-text">
            {L(
              'Savollarni shu yerga qo‘ying (Word’dan nusxa olish mumkin)',
              'Paste the questions here (you can copy from Word)',
              'Вставьте вопросы сюда (можно скопировать из Word)',
            )}
            <textarea
              className="input"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SAMPLE}
            />
          </label>
          <div className="exa-row">
            <label className="svc-attach-btn is-small">
              <Upload size={15} />
              {L('.txt fayldan', 'From a .txt file', 'Из файла .txt')}
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) setText(await f.text());
                }}
              />
            </label>
            <label className="exa-check">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              {L(
                'Mavzudagi eski savollarni almashtirish',
                'Replace the topic’s existing questions',
                'Заменить имеющиеся вопросы темы',
              )}
            </label>
          </div>
          {parsed && (
            <div
              className={'exa-parse' + (parsed.errors.length ? ' has-errors' : '')}
              role="status"
            >
              <b>
                {L(
                  `O‘qildi: ${parsed.items.length} ta savol`,
                  `Read: ${parsed.items.length} questions`,
                  `Прочитано: ${parsed.items.length} вопросов`,
                )}
              </b>
              {!!parsed.errors.length && (
                <ul>
                  {parsed.errors.slice(0, 8).map((e, i) => (
                    <li key={i}>⚠️ {e}</li>
                  ))}
                </ul>
              )}
              {!!parsed.items.length && (
                <p className="muted">
                  1) {parsed.items[0].q} — ✅ {parsed.items[0].o[parsed.items[0].c]}
                </p>
              )}
            </div>
          )}
          <div className="exa-row">
            <Button disabled={busy || !parsed?.items.length} onClick={() => void save()}>
              💾 {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
            {!!cur.count && (
              <Button variant="outline" onClick={() => setShowList(!showList)}>
                📋{' '}
                {showList
                  ? L('Yashirish', 'Hide', 'Скрыть')
                  : L('Savollarni ko‘rish', 'View questions', 'Показать вопросы')}
              </Button>
            )}
            {!!cur.count && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      L(
                        `${cur.n}-mavzuning barcha savollari o‘chirilsinmi?`,
                        `Delete all questions of topic ${cur.n}?`,
                        `Удалить все вопросы темы ${cur.n}?`,
                      ),
                    )
                  )
                    void act({ op: 'clear', topic: cur.id });
                }}
              >
                🗑 {L('Mavzuni tozalash', 'Clear the topic', 'Очистить тему')}
              </Button>
            )}
          </div>
          <details className="exa-help">
            <summary>
              ❓ {L('Qaysi formatda yozish kerak?', 'Which format?', 'Какой формат?')}
            </summary>
            <p>
              {L(
                '1) Raqamli: savol «1.» bilan boshlanadi, javoblar «A)», «B)» … bilan; to‘g‘ri javob oldiga yoki oxiriga «*» qo‘ying yoki savol ostiga «Javob: B» deb yozing.',
                '1) Numbered: a question starts with “1.”, options with “A)”, “B)” …; put “*” before or after the correct option, or write “Javob: B” under the question.',
                '1) Нумерованный: вопрос начинается с «1.», ответы с «A)», «B)» …; поставьте «*» у правильного ответа или напишите «Javob: B».',
              )}
            </p>
            <pre>{SAMPLE}</pre>
            <p>
              {L(
                '2) HEMIS: savollar orasida «++++», javoblar orasida «====», to‘g‘ri javob oldida «#».',
                '2) HEMIS: “++++” between questions, “====” between options, “#” before the correct one.',
                '2) HEMIS: «++++» между вопросами, «====» между ответами, «#» перед правильным.',
              )}
            </p>
            <pre>
              {
                '++++\nTadbirkorlik faoliyatining asosiy maqsadi nima?\n====\n#Foyda olish\n====\nDavlat byudjetini to‘ldirish\n====\nIsh vaqtini qisqartirish'
              }
            </pre>
          </details>
          {showList && (
            <ol className="exa-list">
              {cur.items.map((q) => (
                <li key={q.id}>
                  <p>{q.q}</p>
                  <ul>
                    {q.o.map((o, i) => (
                      <li key={i} className={i === q.c ? 'is-right' : ''}>
                        {'ABCDEF'[i]}) {o}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="exa-del"
                    disabled={busy}
                    onClick={() => void act({ op: 'remove', topic: cur.id, id: q.id })}
                    aria-label={L('O‘chirish', 'Delete', 'Удалить')}
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
