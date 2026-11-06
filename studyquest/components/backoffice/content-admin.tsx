'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, RotateCcw, Save, Search } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { publishSiteContent, startEditMode, type SiteContent } from '../site-content';
import { useL } from './common';

/* ✏️ Sayt boshqaruvi → Matnlar va rasmlar: tahrirlash rejimini yoqish, o'zgartirilgan yozuv va rasmlar ro'yxati,
   qo'lda almashtirish (bosib bo'lmaydigan yozuvlar uchun) va asl holiga qaytarish. */

type View = {
  texts: { o: string; n: string; at: number; by?: string }[];
  images: { o: string; url: string; at: number; by?: string; size: number }[];
};
const when = (ms: number) =>
  new Date(ms).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  });

export function ContentAdmin() {
  const { request, toast } = useApp();
  const L = useL();
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [edit, setEdit] = useState<{ o: string; n: string } | null>(null),
    [manual, setManual] = useState({ o: '', n: '' }),
    [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=siteContent'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  async function send(input: unknown, key: string, done: string) {
    setBusy(key);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'siteText', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      publishSiteContent(v as SiteContent);
      toast(done);
      await load();
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  const restore = (o: string) =>
    send({ op: 'remove', o }, 'rm' + o, L('Asl holiga qaytarildi', 'Restored', 'Восстановлено'));
  const addManual = async (e: FormEvent) => {
    e.preventDefault();
    if (
      await send(
        { op: 'set', o: manual.o, n: manual.n },
        'manual',
        L('Matn saqlandi ✅', 'Text saved ✅', 'Текст сохранён ✅'),
      )
    )
      setManual({ o: '', n: '' });
  };
  const q = query.trim().toLocaleLowerCase();
  const texts = (view?.texts || []).filter(
    (x) => !q || (x.o + ' ' + x.n).toLocaleLowerCase().includes(q),
  );
  return (
    <div className="bo-content">
      <div className="bo-card bo-steps">
        <h3>{L('Qanday o‘zgartiraman?', 'How do I change things?', 'Как изменить?')}</h3>
        <ol>
          <li>
            {L(
              '«Tahrirlashni boshlash» tugmasini bosing — pastda tahrirlash paneli chiqadi.',
              'Press “Start editing” — an editing bar appears at the bottom.',
              'Нажмите «Начать правку» — внизу появится панель правки.',
            )}
          </li>
          <li>
            {L(
              'Kerakli sahifaga o‘ting (paneldagi «Sahifalar bo‘ylab yurish» tugmasi bilan).',
              'Go to the page you need (use “Browse pages” on the bar).',
              'Перейдите на нужную страницу (кнопка «Перейти по страницам»).',
            )}
          </li>
          <li>
            {L(
              'O‘zgartirmoqchi bo‘lgan yozuv yoki rasm ustiga bosing, yangisini yozing yoki tanlang va «Saqlash»ni bosing.',
              'Click the text or picture, type or choose the new one and press “Save”.',
              'Нажмите на текст или картинку, введите или выберите новый вариант и нажмите «Сохранить».',
            )}
          </li>
          <li>
            {L(
              'Ish tugagach «Tayyor»ni bosing. Talabalar o‘zgarishni bir daqiqa ichida ko‘radi.',
              'Press “Done” when finished. Students see the change within a minute.',
              'Нажмите «Готово». Студенты увидят изменения в течение минуты.',
            )}
          </li>
        </ol>
        <Button className="bo-start" onClick={startEditMode}>
          <Pencil size={16} />
          {L('Tahrirlashni boshlash', 'Start editing', 'Начать правку')}
        </Button>
        <p className="bo-hint">
          {L(
            'Bir xil yozuv saytning hamma joyida birdan o‘zgaradi. Har bir til alohida: o‘zbekcha yozuvni o‘zgartirsangiz, inglizcha va ruscha ko‘rinishi o‘zgarmaydi. Talabaning ismi, ball kabi o‘zgaruvchan yozuvlarni bu yo‘l bilan o‘zgartirib bo‘lmaydi.',
            'The same text changes everywhere on the site at once. Each language is separate. Changing values such as student names or points is not possible this way.',
            'Одинаковый текст меняется сразу на всём сайте. Каждый язык — отдельно. Изменяемые значения (имена, баллы) так поменять нельзя.',
          )}
        </p>
      </div>
      {error && <p className="error-state">{error}</p>}
      {!view && !error && <div className="skeleton h-64" />}
      {view && (
        <>
          <div className="bo-card">
            <h3>
              {L('O‘zgartirilgan matnlar', 'Changed texts', 'Изменённые тексты')} (
              {view.texts.length})
            </h3>
            {view.texts.length > 5 && (
              <label className="bo-search">
                <Search size={15} aria-hidden="true" />
                <input
                  aria-label={L('Matn qidirish', 'Search texts', 'Поиск текста')}
                  placeholder={L('Qidirish…', 'Search…', 'Поиск…')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            )}
            {texts.length ? (
              <ul className="bo-list bo-texts">
                {texts.map((x) => (
                  <li key={x.o}>
                    {edit?.o === x.o ? (
                      <form
                        className="bo-inline"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (
                            await send(
                              { op: 'set', o: x.o, n: edit.n },
                              'set' + x.o,
                              L('Matn saqlandi ✅', 'Text saved ✅', 'Текст сохранён ✅'),
                            )
                          )
                            setEdit(null);
                        }}
                      >
                        <s>{x.o}</s>
                        <textarea
                          aria-label={L('Yangi matn', 'New text', 'Новый текст')}
                          rows={2}
                          value={edit.n}
                          onChange={(e) => setEdit({ o: x.o, n: e.target.value })}
                        />
                        <span className="bo-actions">
                          <Button size="sm" type="submit" disabled={busy === 'set' + x.o}>
                            <Save size={14} />
                            {L('Saqlash', 'Save', 'Сохранить')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => setEdit(null)}
                          >
                            {L('Bekor qilish', 'Cancel', 'Отмена')}
                          </Button>
                        </span>
                      </form>
                    ) : (
                      <>
                        <span>
                          <s>{x.o}</s>
                          <b>{x.n}</b>
                          <small>
                            {when(x.at)}
                            {x.by ? ' · ' + x.by : ''}
                          </small>
                        </span>
                        <span className="bo-row-btns">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEdit({ o: x.o, n: x.n })}
                          >
                            ✏️ {L('Tahrirlash', 'Edit', 'Изменить')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === 'rm' + x.o}
                            onClick={() => void restore(x.o)}
                          >
                            <RotateCcw size={14} />
                            {L('Asl holiga', 'Restore', 'Вернуть')}
                          </Button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {view.texts.length
                  ? L('Hech narsa topilmadi.', 'Nothing found.', 'Ничего не найдено.')
                  : L(
                      'Hali hech qaysi matn o‘zgartirilmagan.',
                      'No texts have been changed yet.',
                      'Тексты пока не менялись.',
                    )}
              </p>
            )}
            <details className="bo-manual">
              <summary>
                {L(
                  'Bosib bo‘lmaydigan yozuvni almashtirish (masalan, qisqa ogohlantirish xabarlari)',
                  'Replace a text you cannot click (e.g. short pop-up messages)',
                  'Заменить текст, на который нельзя нажать (например, всплывающие сообщения)',
                )}
              </summary>
              <form onSubmit={addManual}>
                <label>
                  {L(
                    'Saytdagi asl yozuv (aynan o‘zi)',
                    'The exact original text',
                    'Точный исходный текст',
                  )}
                  <textarea
                    rows={2}
                    required
                    value={manual.o}
                    onChange={(e) => setManual({ ...manual, o: e.target.value })}
                  />
                </label>
                <label>
                  {L('Yangi yozuv', 'New text', 'Новый текст')}
                  <textarea
                    rows={2}
                    required
                    value={manual.n}
                    onChange={(e) => setManual({ ...manual, n: e.target.value })}
                  />
                </label>
                <Button type="submit" size="sm" disabled={busy === 'manual'}>
                  <Plus size={14} />
                  {L('Almashtirish', 'Replace', 'Заменить')}
                </Button>
              </form>
            </details>
          </div>
          <div className="bo-card">
            <h3>
              {L('Almashtirilgan rasmlar', 'Replaced pictures', 'Заменённые картинки')} (
              {view.images.length})
            </h3>
            {view.images.length ? (
              <ul className="bo-list bo-images">
                {view.images.map((x) => (
                  <li key={x.o}>
                    <span className="bo-image-pair">
                      <img src={x.o} alt="" data-se-ui />
                      <span aria-hidden="true">→</span>
                      <img src={x.url} alt="" data-se-ui />
                    </span>
                    <span>
                      <b>{x.o}</b>
                      <small>
                        {when(x.at)}
                        {x.by ? ' · ' + x.by : ''} · {Math.round(x.size / 1024)} KB
                      </small>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === 'img' + x.o}
                      onClick={() =>
                        void send(
                          { op: 'removeImage', o: x.o },
                          'img' + x.o,
                          L(
                            'Asl rasm qaytarildi',
                            'Original picture restored',
                            'Исходная картинка возвращена',
                          ),
                        )
                      }
                    >
                      <RotateCcw size={14} />
                      {L('Asl holiga', 'Restore', 'Вернуть')}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {L(
                  'Hali hech qaysi rasm almashtirilmagan. Tahrirlash rejimida rasm ustiga bosing — masalan, menyudagi logotipga.',
                  'No pictures replaced yet. In edit mode, click a picture — for example, the logo in the menu.',
                  'Картинки пока не заменялись. В режиме правки нажмите на картинку — например, на логотип в меню.',
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
