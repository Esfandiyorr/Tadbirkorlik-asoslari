'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, ImageUp, Plus, RotateCcw, Save, Trash2, Wand2 } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { prepareAvatar, type PrepReason } from '../avatar-prep';
import { setAvatarCatalog } from '../avatars';
import type { AvatarItem } from '@/lib/avatars';
import { useL } from './common';

/* 🎭 Sayt boshqaruvi → Avatarlar → Kutubxona: yangi avatar qo'shish (rasm + nom), nomini va rasmini almashtirish,
   yashirish/ko'rsatish, o'zingiz qo'shganini o'chirish. Kim qaysi avatarni olgani — pastdagi bo'limda.
   Yuklanayotgan rasmning oq (bir xil rangli) foni avtomatik olib tashlanadi va qahramon asl avatarlardek kesiladi;
   avval yuklangan rasmni «🪄 Fonni tozalash» bilan shu holga keltirish mumkin. */

type Draft = { id: string; uz: string; en: string; ru: string; from: string };

export function AvatarLibraryAdmin({ onChange }: { onChange?: () => void }) {
  const { request, lang, toast } = useApp();
  const L = useL();
  const [list, setList] = useState<AvatarItem[] | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(''),
    [edit, setEdit] = useState<Draft | null>(null),
    [form, setForm] = useState({ uz: '', en: '', ru: '', from: '' }),
    [file, setFile] = useState<{
      blob: Blob;
      url: string;
      src: File;
      reason: PrepReason;
    } | null>(null),
    [clean, setClean] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/platform?view=avatarAdmin'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setList(v.catalog);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  const done = (catalog: AvatarItem[], message: string) => {
    setList(catalog);
    setAvatarCatalog(catalog);
    toast(message);
    onChange?.();
  };
  async function act(input: Record<string, unknown>, key: string, message: string) {
    setBusy(key);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'avatarLibrary', input }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      done(v.catalog, message);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  async function upload(fields: Record<string, string>, blob: Blob, key: string, message: string) {
    setBusy(key);
    try {
      const body = new FormData();
      for (const [k, v] of Object.entries(fields)) body.append(k, v);
      body.append('file', blob, 'avatar');
      const r = await request('/api/site/avatar', { method: 'POST', body }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || 'Xatolik');
      done(v.catalog, message);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  const pick = async (f: File | Blob | undefined, removeBg = clean) => {
    if (!f) return null;
    try {
      return await prepareAvatar(f, removeBg);
    } catch (e) {
      toast((e as Error).message);
      return null;
    }
  };
  const status = (reason: PrepReason) =>
    reason === 'removed'
      ? L(
          '✅ Fon olib tashlandi — qahramon asl avatarlardek kesildi.',
          '✅ Background removed — the character is cut out like the original avatars.',
          '✅ Фон удалён — герой вырезан как исходные аватары.',
        )
      : reason === 'transparent'
        ? L(
            '✅ Rasm foni allaqachon shaffof — chetlari kesildi.',
            '✅ The background is already transparent — edges trimmed.',
            '✅ Фон уже прозрачный — края обрезаны.',
          )
        : reason === 'off'
          ? L(
              'Fon olib tashlanmadi (sozlama o‘chiq).',
              'Background kept (option off).',
              'Фон сохранён (опция выключена).',
            )
          : L(
              '⚠️ Fon bir xil rangli emas — rasm o‘zgarishsiz qoldi. Oq yoki bir xil rangli fonli rasm yoki shaffof PNG tanlang.',
              '⚠️ The background is not a single colour — the picture is unchanged. Choose one on a plain background or a transparent PNG.',
              '⚠️ Фон не однотонный — картинка не изменена. Выберите картинку на однотонном фоне или прозрачный PNG.',
            );
  const choose = async (f: File | undefined, removeBg = clean) => {
    if (!f) return;
    const r = await pick(f, removeBg);
    if (r) setFile({ blob: r.blob, url: URL.createObjectURL(r.blob), src: f, reason: r.reason });
  };
  /** Avval yuklangan avatar rasmining oq fonini tozalash (rasm brauzerda qayta ishlanib, o'rniga yuklanadi). */
  async function cleanUp(a: AvatarItem) {
    setBusy('clean' + a.id);
    try {
      const res = await fetch(a.src);
      if (!res.ok) throw new Error('Rasm ochilmadi');
      const r = await prepareAvatar(await res.blob(), true);
      if (r.reason !== 'removed') {
        toast(status(r.reason));
        return;
      }
      setBusy('');
      await upload(
        { id: a.id },
        r.blob,
        'img' + a.id,
        L('Fon tozalandi ✅', 'Background cleaned ✅', 'Фон очищен ✅'),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!file)
      return toast(
        L('Avatar rasmini tanlang.', 'Choose the avatar picture.', 'Выберите картинку аватара.'),
      );
    if (
      await upload(
        { name: form.uz, en: form.en, ru: form.ru, from: form.from },
        file.blob,
        'add',
        L('Yangi avatar qo‘shildi ✅', 'New avatar added ✅', 'Новый аватар добавлен ✅'),
      )
    ) {
      setForm({ uz: '', en: '', ru: '', from: '' });
      setFile(null);
    }
  }
  return (
    <section className="panel bo-avatars">
      <h2>🖼 {L('Avatarlar kutubxonasi', 'Avatar library', 'Библиотека аватаров')}</h2>
      <p className="muted">
        {L(
          'Bu yerda kutubxonadagi qahramonlarni boshqarasiz. Yashirilgan avatar talabalarga ko‘rinmaydi va undan foydalanayotgan talabadan ham olinadi.',
          'Manage the characters in the library here. A hidden avatar is not shown to students and is taken from whoever uses it.',
          'Здесь вы управляете героями библиотеки. Скрытый аватар не виден студентам и снимается с того, кто его использует.',
        )}
      </p>
      <form className="bo-form bo-avatar-new" onSubmit={(e) => void add(e)}>
        <h3>➕ {L('Yangi avatar qo‘shish', 'Add a new avatar', 'Добавить новый аватар')}</h3>
        <div className="bo-avatar-new-row">
          <label className="bo-avatar-drop">
            {file ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.url} alt="" />
            ) : (
              <span>
                <ImageUp size={22} />
                {L('Rasm tanlash', 'Choose a picture', 'Выбрать картинку')}
              </span>
            )}
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg,image/gif"
              aria-label={L('Avatar rasmi', 'Avatar picture', 'Картинка аватара')}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                await choose(f);
              }}
            />
          </label>
          <div className="bo-row">
            <label>
              {L('Nomi (o‘zbekcha)', 'Name (Uzbek)', 'Имя (узбекский)')}
              <input
                required
                maxLength={40}
                value={form.uz}
                onChange={(e) => setForm({ ...form, uz: e.target.value })}
              />
            </label>
            <label>
              {L('Inglizcha (ixtiyoriy)', 'English (optional)', 'Английский (необяз.)')}
              <input
                maxLength={40}
                value={form.en}
                onChange={(e) => setForm({ ...form, en: e.target.value })}
              />
            </label>
            <label>
              {L('Ruscha (ixtiyoriy)', 'Russian (optional)', 'Русский (необяз.)')}
              <input
                maxLength={40}
                value={form.ru}
                onChange={(e) => setForm({ ...form, ru: e.target.value })}
              />
            </label>
            <label>
              {L(
                'Qaysi multfilm yoki o‘yindan (ixtiyoriy)',
                'From which film or game (optional)',
                'Из какого мультфильма/игры (необяз.)',
              )}
              <input
                maxLength={80}
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </label>
          </div>
        </div>
        <label className="bo-check">
          <input
            type="checkbox"
            checked={clean}
            onChange={(e) => {
              setClean(e.target.checked);
              if (file) void choose(file.src, e.target.checked);
            }}
          />
          🪄{' '}
          {L(
            'Oq (bir xil rangli) fonni avtomatik olib tashlash — qahramon asl avatarlardek kesiladi',
            'Remove a white (plain) background automatically — the character is cut out like the original avatars',
            'Автоматически убирать белый (однотонный) фон — герой вырезается как исходные аватары',
          )}
        </label>
        {file && (
          <p
            className={
              'bo-hint' + (file.reason === 'busy' || file.reason === 'failed' ? ' bo-bad' : '')
            }
          >
            {status(file.reason)}
          </p>
        )}
        <p className="bo-hint">
          {L(
            'Oq yoki bir xil rangli fondagi rasm ham bo‘ladi: fon olib tashlanadi, qahramon chetigacha kesiladi va 480 px gacha kichraytiriladi. Murakkab fonli suratlar uchun foni yo‘q (shaffof) PNG yuklang.',
            'A picture on a white or plain background works too: the background is removed, the character is trimmed and shrunk to 480 px. For photos with a busy background upload a transparent PNG.',
            'Подойдёт и картинка на белом или однотонном фоне: фон убирается, герой обрезается и уменьшается до 480 px. Для фото со сложным фоном загрузите прозрачный PNG.',
          )}
        </p>
        <Button type="submit" disabled={busy === 'add'}>
          <Plus size={16} />
          {L('Kutubxonaga qo‘shish', 'Add to the library', 'Добавить в библиотеку')}
        </Button>
      </form>
      {error && <p className="error-state">{error}</p>}
      {!list && !error && <div className="skeleton h-64" />}
      {list && (
        <p className="bo-hint">
          {L(
            'Har bir avatar ostidagi tugmalar: ✏️ — nomini o‘zgartirish, 🖼 — rasmini almashtirish, 🪄 — yuklangan rasmning oq fonini tozalash, 🙈 — yashirish (yoki qayta ko‘rsatish), ↩️ — asl rasmini qaytarish, 🗑 — o‘zingiz qo‘shganini o‘chirish.',
            'Buttons under each avatar: ✏️ rename, 🖼 replace the picture, 🪄 clean the white background of an uploaded picture, 🙈 hide (or show again), ↩️ restore the original picture, 🗑 delete one you added.',
            'Кнопки под аватаром: ✏️ — переименовать, 🖼 — заменить картинку, 🪄 — очистить белый фон загруженной картинки, 🙈 — скрыть (или показать), ↩️ — вернуть исходную картинку, 🗑 — удалить добавленный вами.',
          )}
        </p>
      )}
      {list && (
        <ul className="bo-avatar-grid">
          {list.map((a) => (
            <li key={a.id} className={a.off ? 'is-off' : ''}>
              <span className="av-stage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.src} alt="" />
              </span>
              {edit?.id === a.id ? (
                <form
                  className="bo-avatar-edit"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      await act(
                        {
                          op: 'rename',
                          id: a.id,
                          name: [edit.uz, edit.en, edit.ru],
                          from: edit.from,
                        },
                        'rename' + a.id,
                        L('Saqlandi ✅', 'Saved ✅', 'Сохранено ✅'),
                      )
                    )
                      setEdit(null);
                  }}
                >
                  <input
                    aria-label={L('Nomi (o‘zbekcha)', 'Name (Uzbek)', 'Имя (узбекский)')}
                    required
                    maxLength={40}
                    value={edit.uz}
                    onChange={(e) => setEdit({ ...edit, uz: e.target.value })}
                  />
                  <input
                    aria-label="English"
                    placeholder="English"
                    maxLength={40}
                    value={edit.en}
                    onChange={(e) => setEdit({ ...edit, en: e.target.value })}
                  />
                  <input
                    aria-label="Русский"
                    placeholder="Русский"
                    maxLength={40}
                    value={edit.ru}
                    onChange={(e) => setEdit({ ...edit, ru: e.target.value })}
                  />
                  <input
                    aria-label={L('Manbasi', 'Source', 'Источник')}
                    placeholder={L('Manbasi', 'Source', 'Источник')}
                    maxLength={80}
                    value={edit.from}
                    onChange={(e) => setEdit({ ...edit, from: e.target.value })}
                  />
                  <span className="bo-actions">
                    <Button size="sm" type="submit" disabled={busy === 'rename' + a.id}>
                      <Save size={14} />
                      {L('Saqlash', 'Save', 'Сохранить')}
                    </Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => setEdit(null)}>
                      {L('Bekor', 'Cancel', 'Отмена')}
                    </Button>
                  </span>
                </form>
              ) : (
                <>
                  <b>{a.name[lang === 'en' ? 1 : lang === 'ru' ? 2 : 0]}</b>
                  {a.from && <small>{a.from}</small>}
                  <small className="bo-avatar-tags">
                    {a.off && <em>{L('yashirilgan', 'hidden', 'скрыт')}</em>}
                    {a.custom && <em>{L('siz qo‘shgan', 'added by you', 'добавлен вами')}</em>}
                  </small>
                  <span className="bo-avatar-btns">
                    <Button
                      size="sm"
                      variant="ghost"
                      title={L('Nomini o‘zgartirish', 'Rename', 'Переименовать')}
                      aria-label={
                        L('Nomini o‘zgartirish', 'Rename', 'Переименовать') + ': ' + a.name[0]
                      }
                      onClick={() =>
                        setEdit({
                          id: a.id,
                          uz: a.name[0],
                          en: a.name[1],
                          ru: a.name[2],
                          from: a.from,
                        })
                      }
                    >
                      ✏️
                    </Button>
                    <label
                      className="bo-icon-btn"
                      title={L('Rasmini almashtirish', 'Replace the picture', 'Заменить картинку')}
                    >
                      <ImageUp size={15} />
                      <input
                        type="file"
                        accept="image/png,image/webp,image/jpeg,image/gif"
                        aria-label={
                          L('Rasmini almashtirish', 'Replace the picture', 'Заменить картинку') +
                          ': ' +
                          a.name[0]
                        }
                        onChange={async (e) => {
                          const r = await pick(e.target.files?.[0]);
                          e.target.value = '';
                          if (r && (r.reason === 'busy' || r.reason === 'failed'))
                            toast(status(r.reason));
                          if (r)
                            await upload(
                              { id: a.id },
                              r.blob,
                              'img' + a.id,
                              L(
                                'Rasm almashtirildi ✅',
                                'Picture replaced ✅',
                                'Картинка заменена ✅',
                              ),
                            );
                        }}
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === 'hide' + a.id}
                      aria-label={
                        (a.off
                          ? L('Ko‘rsatish', 'Show', 'Показать')
                          : L('Yashirish', 'Hide', 'Скрыть')) +
                        ': ' +
                        a.name[0]
                      }
                      title={
                        a.off
                          ? L('Ko‘rsatish', 'Show', 'Показать')
                          : L('Yashirish', 'Hide', 'Скрыть')
                      }
                      onClick={() =>
                        void act(
                          { op: 'hide', id: a.id, off: !a.off },
                          'hide' + a.id,
                          a.off
                            ? L('Avatar yana ko‘rinadi', 'Avatar shown again', 'Аватар снова виден')
                            : L('Avatar yashirildi', 'Avatar hidden', 'Аватар скрыт'),
                        )
                      }
                    >
                      {a.off ? <Eye size={15} /> : <EyeOff size={15} />}
                    </Button>
                    {!a.src.startsWith('/avatars/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === 'clean' + a.id || busy === 'img' + a.id}
                        aria-label={
                          L('Fonni tozalash', 'Clean the background', 'Очистить фон') +
                          ': ' +
                          a.name[0]
                        }
                        title={L(
                          'Fonni tozalash (oq fonni olib tashlash)',
                          'Clean the background (remove white)',
                          'Очистить фон (убрать белый)',
                        )}
                        onClick={() => void cleanUp(a)}
                      >
                        <Wand2 size={15} />
                      </Button>
                    )}
                    {!a.custom && !a.src.startsWith('/avatars/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={
                          L(
                            'Asl rasmini qaytarish',
                            'Restore the original picture',
                            'Вернуть исходную картинку',
                          ) +
                          ': ' +
                          a.name[0]
                        }
                        title={L(
                          'Asl rasmini qaytarish',
                          'Restore the original picture',
                          'Вернуть исходную картинку',
                        )}
                        onClick={() =>
                          void act(
                            { op: 'resetImage', id: a.id },
                            'reset' + a.id,
                            L(
                              'Asl rasm qaytarildi',
                              'Original picture restored',
                              'Исходная картинка возвращена',
                            ),
                          )
                        }
                      >
                        <RotateCcw size={15} />
                      </Button>
                    )}
                    {a.custom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={L('O‘chirish', 'Delete', 'Удалить') + ': ' + a.name[0]}
                        title={L('O‘chirish', 'Delete', 'Удалить')}
                        onClick={() =>
                          confirm(
                            L(
                              `«${a.name[0]}» avatari o‘chirilsinmi?`,
                              `Delete the avatar “${a.name[0]}”?`,
                              `Удалить аватар «${a.name[0]}»?`,
                            ),
                          ) &&
                          void act(
                            { op: 'delete', id: a.id },
                            'del' + a.id,
                            L('Avatar o‘chirildi', 'Avatar deleted', 'Аватар удалён'),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
