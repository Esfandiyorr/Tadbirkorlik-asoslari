'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Save } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';

/* 📝 Sayt boshqaruvi → Mavzu testlari: 15 ta taqdimot oxiridagi test savollarini tahrirlash.
   Asl savollar public/legacy/quiz/<mavzu>.json da (qurish paytida taqdimotdan olinadi); administrator saqlagani
   asl bazadagi site/quiz/<mavzu> da va taqdimot uni /api/site/quiz orqali oladi. Savollar soni o'zgarmaydi. */

type Question = { q: string; a?: string[]; c?: number; o?: string[]; e?: string };
type Topic = {
  id: string;
  title: string;
  count: number;
  changed: { v: string; at: number; by?: string } | null;
};
const blankChoice = (): Question => ({ q: '', a: ['', '', '', ''], c: 0, e: '' });
const when = (ms: number) =>
  new Date(ms).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  });

export function TopicQuizAdmin() {
  const { request, toast } = useApp();
  const L = useL();
  const [topics, setTopics] = useState<Topic[] | null>(null),
    [error, setError] = useState(''),
    [current, setCurrent] = useState<string | null>(null),
    [original, setOriginal] = useState<Question[]>([]),
    [draft, setDraft] = useState<Question[] | null>(null),
    [saved, setSaved] = useState(''),
    [busy, setBusy] = useState(false);
  const loadList = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=topicQuizzes'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setTopics(v.topics);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  const dirty = !!draft && JSON.stringify(draft) !== saved;
  async function open(t: Topic) {
    if (
      dirty &&
      !confirm(
        L(
          'Saqlanmagan o‘zgarishlar bor. Ular tashlab yuborilsinmi?',
          'There are unsaved changes. Discard them?',
          'Есть несохранённые изменения. Отменить их?',
        ),
      )
    )
      return;
    setCurrent(t.id);
    setDraft(null);
    try {
      const [orig, mine] = await Promise.all([
        fetch('/legacy/quiz/' + t.id + '.json').then((r) => r.json()),
        request('/api/platform?view=topicQuizzes&t=' + t.id).then((r) => r.json()),
      ]);
      const base = (orig.questions || []) as Question[],
        list = ((mine.saved?.q as Question[]) || base).map((x) => ({ ...x, e: x.e || '' }));
      setOriginal(base);
      setDraft(list);
      setSaved(JSON.stringify(list));
    } catch (e) {
      toast((e as Error).message);
    }
  }
  const patch = (i: number, p: Partial<Question>) =>
    setDraft((d) => d!.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, by: number) =>
    setDraft((d) => {
      const n = [...d!];
      [n[i], n[i + by]] = [n[i + by], n[i]];
      return n;
    });
  async function send(input: unknown, done: string) {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'topicQuiz', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      const list = ((v.questions as Question[]) || original).map((x) => ({ ...x, e: x.e || '' }));
      setDraft(list);
      setSaved(JSON.stringify(list));
      toast(done);
      void loadList();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function save() {
    const bad = draft!.findIndex((x) =>
      x.o
        ? x.q.trim().length < 5 || !x.o.some((v) => v.trim())
        : x.q.trim().length < 5 || x.a!.some((v) => !v.trim()),
    );
    if (bad >= 0)
      return toast(
        L(
          `${bad + 1}-savolni to‘liq to‘ldiring: savol matni va barcha javoblar.`,
          `Complete question ${bad + 1}: the text and all answers.`,
          `Заполните вопрос ${bad + 1}: текст и все ответы.`,
        ),
      );
    void send(
      {
        op: 'save',
        t: current,
        questions: draft!.map((x) => ({
          q: x.q.trim(),
          ...(x.o
            ? { o: x.o.map((v) => v.trim()).filter(Boolean) }
            : { a: x.a!.map((v) => v.trim()), c: x.c || 0 }),
          ...(x.e?.trim() ? { e: x.e.trim() } : {}),
        })),
      },
      L(
        'Test saqlandi ✅ Talabalar bir daqiqa ichida yangi savollarni ko‘radi.',
        'Test saved ✅ Students see the new questions within a minute.',
        'Тест сохранён ✅ Студенты увидят новые вопросы в течение минуты.',
      ),
    );
  }
  if (error) return <p className="error-state">{error}</p>;
  if (!topics) return <div className="skeleton h-64" />;
  const topic = topics.find((t) => t.id === current);
  return (
    <div className="bo-quiz">
      <ul className="bo-topics">
        {topics.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={'bo-topic' + (t.id === current ? ' is-on' : '')}
              disabled={!t.count}
              onClick={() => void open(t)}
            >
              <b>{t.title}</b>
              <small>
                {t.count
                  ? L(`${t.count} ta savol`, `${t.count} questions`, `${t.count} вопросов`) +
                    ' · ' +
                    (t.changed
                      ? L('✏️ o‘zgartirilgan ', '✏️ edited ', '✏️ изменён ') + when(t.changed.at)
                      : L('asl holida', 'original', 'исходный'))
                  : L(
                      'test o‘rniga krossvord yoki masala',
                      'a crossword or tasks instead of a test',
                      'вместо теста — кроссворд или задачи',
                    )}
              </small>
            </button>
          </li>
        ))}
      </ul>
      {topic && !draft && <div className="skeleton h-64" />}
      {topic && draft && (
        <div className="bo-card">
          <div className="bo-quiz-head">
            <h3>{topic.title}</h3>
            <div className="bo-actions">
              <Button disabled={busy || !dirty} onClick={save}>
                <Save size={16} />
                {L('Saqlash', 'Save', 'Сохранить')}
              </Button>
              {topic.changed && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    confirm(
                      L(
                        'Test asl holiga (taqdimotdagi savollarga) qaytarilsinmi?',
                        'Restore the original questions of the presentation?',
                        'Вернуть исходные вопросы презентации?',
                      ),
                    ) &&
                    void send(
                      { op: 'reset', t: topic.id },
                      L(
                        'Asl savollar qaytarildi',
                        'Original questions restored',
                        'Исходные вопросы восстановлены',
                      ),
                    )
                  }
                >
                  <RotateCcw size={15} />
                  {L('Asl holiga qaytarish', 'Restore the original', 'Вернуть исходный')}
                </Button>
              )}
              {dirty && (
                <Button variant="ghost" disabled={busy} onClick={() => setDraft(JSON.parse(saved))}>
                  {L('O‘zgarishlarni bekor qilish', 'Discard changes', 'Отменить изменения')}
                </Button>
              )}
            </div>
          </div>
          <p className="bo-hint">
            {L(
              `Savollar soni o‘zgarmaydi (${topic.count} ta) — test bali shunga bog‘liq. Savolni almashtirish uchun matni va javoblarini yangisiga o‘zgartiring. Matnda <b>qalin</b> va <i>qiya</i> teglarini ishlatish mumkin. Saqlangach talabalar bir daqiqa ichida yangi savollarni ko‘radi; testni boshlab qo‘ygan talaba uni yangidan boshlaydi.`,
              `The number of questions stays the same (${topic.count}) — the test score depends on it. To replace a question, change its text and answers. You may use <b>bold</b> and <i>italic</i> tags. Students see the new questions within a minute; anyone who has started the test starts again.`,
              `Количество вопросов не меняется (${topic.count}) — от него зависит балл. Чтобы заменить вопрос, измените текст и ответы. Можно использовать теги <b> и <i>. Студенты увидят изменения в течение минуты; начатый тест начнётся заново.`,
            )}
          </p>
          {dirty && (
            <p className="bo-warn">
              {L(
                'Saqlanmagan o‘zgarishlar bor.',
                'There are unsaved changes.',
                'Есть несохранённые изменения.',
              )}
            </p>
          )}
          <ol className="bo-questions">
            {draft.map((x, i) => {
              const lens = (x.a || []).map((v) => v.trim().length),
                uneven =
                  !x.o && Math.max(...lens) > 0 && Math.min(...lens) / Math.max(...lens) < 0.7;
              return (
                <li key={i} className="bo-question">
                  <div className="bo-question-head">
                    <b>{i + 1}</b>
                    <div
                      className="bo-seg"
                      role="group"
                      aria-label={L('Savol turi', 'Question type', 'Тип вопроса')}
                    >
                      <button
                        type="button"
                        aria-pressed={!x.o}
                        onClick={() =>
                          !!x.o && patch(i, { o: undefined, a: ['', '', '', ''], c: 0 })
                        }
                      >
                        {L('4 ta variant', '4 options', '4 варианта')}
                      </button>
                      <button
                        type="button"
                        aria-pressed={!!x.o}
                        onClick={() => !x.o && patch(i, { o: [''], a: undefined, c: undefined })}
                      >
                        ✍️ {L('Ochiq javob', 'Typed answer', 'Свой ответ')}
                      </button>
                    </div>
                    <span className="bo-row-btns">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={L('Yuqoriga', 'Move up', 'Выше')}
                        disabled={!i}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={L('Pastga', 'Move down', 'Ниже')}
                        disabled={i === draft.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={14} />
                      </Button>
                      {original[i] &&
                        JSON.stringify(original[i]) !==
                          JSON.stringify({ ...x, e: x.e || undefined }) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title={L(
                              'Shu savolning asl holi',
                              'This question’s original',
                              'Исходный вариант',
                            )}
                            onClick={() =>
                              patch(i, {
                                ...blankChoice(),
                                ...original[i],
                                e: original[i].e || '',
                                ...(original[i].o
                                  ? { a: undefined, c: undefined }
                                  : { o: undefined }),
                              })
                            }
                          >
                            ↩️ {L('Asli', 'Original', 'Исходный')}
                          </Button>
                        )}
                    </span>
                  </div>
                  <label>
                    {L(`${i + 1}-savol matni`, `Question ${i + 1}`, `Вопрос ${i + 1}`)}
                    <textarea
                      rows={2}
                      value={x.q}
                      onChange={(e) => patch(i, { q: e.target.value })}
                    />
                  </label>
                  {x.o ? (
                    <label>
                      {L(
                        'Qabul qilinadigan javoblar (har biri alohida qatorda; katta-kichik harf va tutuq belgisi farq qilmaydi)',
                        'Accepted answers (one per line; case and apostrophes do not matter)',
                        'Принимаемые ответы (по одному в строке; регистр и апостроф не важны)',
                      )}
                      <textarea
                        rows={2}
                        value={x.o.join('\n')}
                        onChange={(e) => patch(i, { o: e.target.value.split('\n') })}
                      />
                    </label>
                  ) : (
                    <fieldset className="bo-answers">
                      <legend>
                        {L(
                          'Javoblar — to‘g‘risini belgilang',
                          'Answers — mark the correct one',
                          'Ответы — отметьте правильный',
                        )}
                      </legend>
                      {x.a!.map((v, k) => (
                        <div key={k} className={'bo-answer' + (x.c === k ? ' is-ok' : '')}>
                          <input
                            type="radio"
                            name={'ok-' + current + '-' + i}
                            checked={x.c === k}
                            aria-label={L(
                              `${k + 1}-javob to‘g‘ri`,
                              `Answer ${k + 1} is correct`,
                              `Ответ ${k + 1} верный`,
                            )}
                            onChange={() => patch(i, { c: k })}
                          />
                          <input
                            aria-label={L(
                              `${i + 1}-savol, ${k + 1}-javob`,
                              `Question ${i + 1}, answer ${k + 1}`,
                              `Вопрос ${i + 1}, ответ ${k + 1}`,
                            )}
                            value={v}
                            onChange={(e) =>
                              patch(i, { a: x.a!.map((w, n) => (n === k ? e.target.value : w)) })
                            }
                          />
                        </div>
                      ))}
                      {uneven && (
                        <p className="bo-hint bo-bad">
                          {L(
                            'Javoblar uzunligi juda farq qiladi — to‘g‘ri javob ko‘zga tashlanib qolishi mumkin.',
                            'The answers differ a lot in length — the correct one may stand out.',
                            'Ответы сильно различаются по длине — правильный может выделяться.',
                          )}
                        </p>
                      )}
                    </fieldset>
                  )}
                  <label>
                    {L(
                      'Izoh (javobdan keyin ko‘rinadi, ixtiyoriy)',
                      'Explanation (shown after answering, optional)',
                      'Пояснение (после ответа, необязательно)',
                    )}
                    <textarea
                      rows={2}
                      value={x.e || ''}
                      onChange={(e) => patch(i, { e: e.target.value })}
                    />
                  </label>
                </li>
              );
            })}
          </ol>
          <div className="bo-actions">
            <Button disabled={busy || !dirty} onClick={save}>
              <Save size={16} />
              {L('Saqlash', 'Save', 'Сохранить')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
