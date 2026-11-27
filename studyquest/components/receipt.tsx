'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, ReceiptText, X } from 'lucide-react';
import { useApp } from './provider';
import { ImagePick } from './image-pick';
import { loadOrderFile, saveOrderFile, sendOrderFile } from './service-files';
import { Button } from './ui/button';
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
  accept,
}: {
  value: Blob | null;
  onChange: (b: Blob | null) => void;
  accept?: string;
}) {
  const { lang } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  return (
    <div className="receipt-pick">
      <ImagePick
        value={value}
        max={1600}
        accept={accept}
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

/** Admin ro‘yxatida chek faqat tugma bosilganda yuklanadi. */
export function ReceiptPreviewButton(source: { src: string } | { order: string; file: OrderFile }) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!url) return;
    dialog.current?.showModal();
    return () => URL.revokeObjectURL(url);
  }, [url]);
  const pdf = 'file' in source && source.file.ext === 'pdf';
  const label = pdf
    ? L('Chekni yuklab olish', 'Download receipt', 'Скачать чек')
    : L('Chekni ko‘rish', 'View receipt', 'Посмотреть чек');

  async function open() {
    setBusy(true);
    try {
      let blob: Blob;
      if ('src' in source) {
        const r = await request(source.src);
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error ||
              L('Chek topilmadi.', 'Receipt unavailable.', 'Чек недоступен.'),
          );
        blob = await r.blob();
      } else if (pdf) {
        await saveOrderFile(request, source.order, source.file);
        return;
      } else {
        blob = await loadOrderFile(request, source.order, source.file);
      }
      if (mounted.current) setUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const title = L('To‘lov cheki', 'Payment receipt', 'Чек об оплате');
  return (
    <>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void open()}>
        {pdf ? <Download size={15} /> : <ReceiptText size={15} />}
        {busy ? L('Yuklanmoqda…', 'Loading…', 'Загрузка…') : label}
      </Button>
      {url && (
        <dialog
          className="panel pa-receipt receipt-preview"
          aria-label={title}
          ref={dialog}
          onClose={() => setUrl('')}
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
        >
          <button
            type="button"
            className="av-close"
            aria-label={L('Yopish', 'Close', 'Закрыть')}
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
          <img src={url} alt={title} />
        </dialog>
      )}
    </>
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
