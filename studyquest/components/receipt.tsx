'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from './provider';
import { ImagePick } from './image-pick';
import { loadOrderFile, saveOrderFile, sendOrderFile } from './service-files';
import { tr } from '@/lib/points';
import type { OrderFile } from '@/lib/services';

/* 🧾 To'lov cheki: buyurtmachi «To'lov qildim» oldidan chek rasmini (Click/Payme skrinshoti yoki surati) tanlaydi —
   rasm brauzerda kichraytiriladi va buyurtmaning «pay» fayli bo'lib yuklanadi (lib/server/services.ts). Chekni faqat
   buyurtmachining o'zi va administrator ko'radi; administrator to'lovni shu rasmga qarab tasdiqlaydi. */

type Req = (url: string, init?: RequestInit) => Promise<Response>;
const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

/** Tanlangan chek rasmini buyurtmaga yuklaydi (o — «<buyurtmachi>/<buyurtma>»). */
export async function uploadReceipt(request: Req, o: string, id: string, blob: Blob) {
  const ext = EXT[blob.type];
  if (!ext) throw new Error('Chek uchun PNG, JPG yoki WEBP rasm tanlang.');
  const file = new File([blob], 'chek.' + ext, { type: blob.type });
  await sendOrderFile(request, 'me', o, { id }, file, undefined, { side: 'pay' });
}

/** Chek rasmini tanlash (kichik ko'rinishi bilan). */
export function ReceiptPick({
  value,
  onChange,
}: {
  value: Blob | null;
  onChange: (b: Blob | null) => void;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  return (
    <div className="receipt-pick">
      <ImagePick
        value={value}
        max={1600}
        onChange={onChange}
        label={L('📷 Chek rasmini yuklash', '📷 Upload the receipt', '📷 Загрузить чек')}
        hint={L(
          'Click, Payme yoki bank ilovasidagi chekning skrinshoti yoki surati — summa va sana ko‘rinsin.',
          'A screenshot or photo of the receipt from Click, Payme or your bank app — the amount and date must be visible.',
          'Скриншот или фото чека из Click, Payme или банковского приложения — сумма и дата должны быть видны.',
        )}
      />
    </div>
  );
}

/** Yuklangan cheklar: rasm — kichik ko'rinishda (bosilsa — to'liq o'lchamda), PDF — yuklab olish tugmasi. */
export function Receipts({ o, files }: { o: string; files: OrderFile[] }) {
  const { lang } = useApp();
  if (!files.length) return null;
  return (
    <div className="receipts">
      <small className="muted">
        🧾 {tr(lang, 'To‘lov cheki', 'Payment receipt', 'Чек об оплате')}
      </small>
      <ul>
        {files.map((f) => (
          <li key={f.id}>
            <ReceiptItem o={o} f={f} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReceiptItem({ o, f }: { o: string; f: OrderFile }) {
  const { lang, request, toast } = useApp();
  const [url, setUrl] = useState('');
  const image = f.ext !== 'pdf';
  useEffect(() => {
    if (!image) return;
    let live = true,
      made = '';
    loadOrderFile(request, o, f)
      .then((b) => {
        made = URL.createObjectURL(b);
        if (live) setUrl(made);
        else URL.revokeObjectURL(made);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, o, f.id, image]);
  if (!image)
    return (
      <button
        type="button"
        className="receipt-pdf"
        onClick={() => saveOrderFile(request, o, f).catch((e) => toast((e as Error).message))}
      >
        <Download size={14} /> {f.name}
      </button>
    );
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="receipt-thumb">
      <img src={url} alt={tr(lang, 'To‘lov cheki', 'Payment receipt', 'Чек об оплате')} />
    </a>
  ) : (
    <span className="receipt-thumb is-loading" aria-hidden="true" />
  );
}
