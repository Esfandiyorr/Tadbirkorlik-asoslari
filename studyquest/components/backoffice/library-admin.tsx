'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { ImagePick } from '../image-pick';
import { tr } from '@/lib/points';
import { useL } from './common';
import { LIBRARY_KIND, LIBRARY_KINDS, type LibraryItem, type LibraryKind } from '@/lib/library';

/* 📚 Sayt boshqaruvi → Kutubxona: manba qo'shish (nom, muallif, izoh, havola, muqova, 💎) va o'chirish. */
const EMPTY = { kind: 'book' as LibraryKind, h: '', a: '', t: '', link: '', pro: false };

export function LibraryAdmin() {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [items, setItems] = useState<LibraryItem[] | null>(null),
    [error, setError] = useState(''),
    [f, setF] = useState(EMPTY),
    [cover, setCover] = useState<Blob | null>(null),
    [busy, setBusy] = useState('');
  useEffect(() => {
    let live = true;
    request('/api/platform?view=library')
      .then(async (r) => {
        const v = await r.json();
        if (!r.ok) throw new Error(v.error);
        if (live) setItems(v.items || []);
      })
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [request]);
  const linkOk = /^https:\/\/\S+$/.test(f.link.trim());
  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy('add');
    try {
      const body = new FormData();
      body.set(
        'input',
        JSON.stringify({
          op: 'add',
          kind: f.kind,
          h: f.h.trim(),
          link: f.link.trim(),
          ...(f.a.trim() ? { a: f.a.trim() } : {}),
          ...(f.t.trim() ? { t: f.t.trim() } : {}),
          ...(f.pro ? { pro: true } : {}),
        }),
      );
      if (cover) body.set('file', cover, 'muqova.' + (cover.type.split('/')[1] || 'png'));
      const r = await request('/api/site/library', { method: 'POST', body }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      setItems(v.items || []);
      setF({ ...EMPTY, kind: f.kind });
      setCover(null);
      toast('📚 ' + L('Manba qo‘shildi', 'Resource added', 'Материал добавлен'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function remove(x: LibraryItem) {
    if (!window.confirm(L(`«${x.h}» o‘chirilsinmi?`, `Delete “${x.h}”?`, `Удалить «${x.h}»?`)))
      return;
    setBusy('rm' + x.id);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'library', input: { op: 'remove', id: x.id } }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || 'Xatolik');
      setItems(v.items || []);
      toast(L('O‘chirildi', 'Deleted', 'Удалено'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy('');
    }
  }
  if (error) return <p className="error-state">{error}</p>;
  if (!items) return <div className="skeleton h-64" />;
  return (
    <div className="bo-live">
      <form className="bo-form" onSubmit={(e) => void add(e)}>
        <h3>➕ {L('Yangi manba', 'New resource', 'Новый материал')}</h3>
        <div className="bo-row">
          <label>
            {L('Turi', 'Kind', 'Тип')}
            <select
              className="input"
              value={f.kind}
              onChange={(e) => setF({ ...f, kind: e.target.value as LibraryKind })}
            >
              {LIBRARY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {LIBRARY_KIND[k].icon} {tr(lang, ...LIBRARY_KIND[k].name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {L('Muallif yoki manba', 'Author or source', 'Автор или источник')}
            <input
              className="input"
              maxLength={100}
              value={f.a}
              onChange={(e) => setF({ ...f, a: e.target.value })}
              placeholder={L(
                'Masalan: Robert Kiyosaki',
                'E.g. Robert Kiyosaki',
                'Например: Роберт Кийосаки',
              )}
            />
          </label>
        </div>
        <label>
          {L('Nomi', 'Title', 'Название')}
          <input
            className="input"
            required
            minLength={2}
            maxLength={120}
            value={f.h}
            onChange={(e) => setF({ ...f, h: e.target.value })}
            placeholder={L(
              'Masalan: «Boy ota, kambag‘al ota»',
              'E.g. “Rich Dad Poor Dad”',
              'Например: «Богатый папа, бедный папа»',
            )}
          />
        </label>
        <label>
          {L(
            'Qisqa izoh (ixtiyoriy)',
            'Short description (optional)',
            'Краткое описание (необязательно)',
          )}
          <textarea
            className="input"
            rows={2}
            maxLength={600}
            value={f.t}
            onChange={(e) => setF({ ...f, t: e.target.value })}
            placeholder={L(
              'Nima haqida va kimga foydali',
              'What it is about and who it helps',
              'О чём и кому полезно',
            )}
          />
        </label>
        <label>
          {L('Havola', 'Link', 'Ссылка')}
          <input
            className="input"
            required
            maxLength={500}
            value={f.link}
            onChange={(e) => setF({ ...f, link: e.target.value })}
            placeholder="https://…"
            inputMode="url"
          />
        </label>
        {f.link.trim() && !linkOk && (
          <p className="bo-hint bo-bad">
            {L(
              'Havola https:// bilan boshlansin.',
              'The link must start with https://',
              'Ссылка должна начинаться с https://',
            )}
          </p>
        )}
        <ImagePick
          value={cover}
          onChange={setCover}
          hint={L(
            'Muqova rasmi (ixtiyoriy). Bo‘lmasa — rangli belgi chiqadi.',
            'Cover picture (optional). Without it a coloured icon is shown.',
            'Обложка (необязательно). Без неё показывается цветной значок.',
          )}
        />
        <label className="bo-check">
          <input
            type="checkbox"
            checked={f.pro}
            onChange={(e) => setF({ ...f, pro: e.target.checked })}
          />
          <span>
            💎{' '}
            {L(
              'Faqat obunachilar uchun (boshqalar nomini ko‘radi, lekin ocholmaydi)',
              'Premium only (others see the title but cannot open it)',
              'Только для подписчиков (остальные видят название, но не могут открыть)',
            )}
          </span>
        </label>
        <div className="bo-actions">
          <Button type="submit" disabled={busy === 'add' || f.h.trim().length < 2 || !linkOk}>
            <Plus size={15} />{' '}
            {L('Kutubxonaga qo‘shish', 'Add to the library', 'Добавить в библиотеку')}
          </Button>
        </div>
        <p className="bo-hint">
          {L(
            'Faylning o‘zi saytga yuklanmaydi — havola beriladi: Google Drive, Telegram kanal posti, lex.uz, YouTube va boshqalar. Faqat tarqatishga ruxsati bor (ochiq yoki o‘zingizniki) materiallarni joylang.',
            'The file itself is not uploaded — you give a link: Google Drive, a Telegram post, lex.uz, YouTube and so on. Post only materials you are allowed to share.',
            'Сам файл не загружается — указывается ссылка: Google Drive, пост в Telegram, lex.uz, YouTube и т. д. Размещайте только материалы, которыми можно делиться.',
          )}
        </p>
      </form>
      <ul className="bo-list bo-lib-list">
        {items.map((x) => (
          <li key={x.id}>
            {x.img ? (
              <img className="news-admin-img" src={x.img} alt="" loading="lazy" />
            ) : (
              <span className="bo-lib-icon" aria-hidden="true">
                {(LIBRARY_KIND[x.kind] || LIBRARY_KIND.other).icon}
              </span>
            )}
            <div>
              <b>
                {x.pro ? '💎 ' : ''}
                {x.h}
              </b>
              <small>
                {tr(lang, ...(LIBRARY_KIND[x.kind] || LIBRARY_KIND.other).name)}
                {x.a ? ' · ' + x.a : ''}
              </small>
              {x.link && <code>{x.link}</code>}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!!busy}
              aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + x.h}
              onClick={() => void remove(x)}
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
        {!items.length && (
          <li className="muted">
            {L('Kutubxona hozircha bo‘sh.', 'The library is empty.', 'Библиотека пока пуста.')}
          </li>
        )}
      </ul>
    </div>
  );
}
