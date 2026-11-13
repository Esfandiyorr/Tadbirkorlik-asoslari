'use client';
import { useEffect, useMemo } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useApp } from './provider';
import { shrink } from './site-content';
import { tr } from '@/lib/points';

/* 🖼 Rasm biriktirish (e'lon, bildirishnoma, kutubxona muqovasi): rasm tanlanadi, brauzerda kichraytiriladi (eng uzun
   tomoni `max` px — odatda 1200; kichik kartochkada ko'rinadigan muqova uchun 600, shunda bazada ~4 baravar kam joy
   oladi), kichik ko'rinishi va «olib tashlash» tugmasi chiqadi. Yuklash — chaqiruvchining ishi. */
export function ImagePick({
  value,
  onChange,
  hint,
  max = 1200,
}: {
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  hint?: string;
  /** eng uzun tomoni (px) */
  max?: number;
}) {
  const { lang, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const url = useMemo(() => (value ? URL.createObjectURL(value) : ''), [value]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return (
    <div className="image-pick">
      {url ? (
        <div className="image-pick-thumb">
          <img src={url} alt={L('Tanlangan rasm', 'Chosen picture', 'Выбранная картинка')} />
          <button
            type="button"
            className="image-pick-x"
            onClick={() => onChange(null)}
            aria-label={L('Rasmni olib tashlash', 'Remove picture', 'Убрать картинку')}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      <label className="promo-file">
        <ImagePlus size={16} aria-hidden="true" />
        <span>
          {value
            ? L('Boshqa rasm tanlash', 'Choose another picture', 'Выбрать другую')
            : L('🖼 Rasm biriktirish', '🖼 Attach a picture', '🖼 Прикрепить картинку')}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          aria-label={L('Rasm', 'Picture', 'Картинка')}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              onChange(await shrink(f, max));
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        />
      </label>
      {hint && <small className="image-pick-hint">{hint}</small>}
    </div>
  );
}
