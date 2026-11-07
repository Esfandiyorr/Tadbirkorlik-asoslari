'use client';
import { cutout, type CutoutResult } from '@/lib/avatar-cutout';

/* 🎭 Avatar rasmini yuklashdan oldin brauzerda tayyorlash: oq (bir xil rangli) fonni olib tashlash, qahramonni
   chetigacha kesish va asl avatarlardek eng uzun tomoni 480 px qilish (WEBP, shaffof; bo'lmasa — PNG). */

export type PrepReason = CutoutResult['reason'] | 'off';

export async function prepareAvatar(
  src: Blob,
  clean = true,
): Promise<{ blob: Blob; reason: PrepReason }> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(src.type))
    throw new Error('PNG, JPEG, WEBP yoki GIF rasm tanlang.');
  const bitmap = await createImageBitmap(src);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const W = Math.max(1, Math.round(bitmap.width * scale)),
    H = Math.max(1, Math.round(bitmap.height * scale));
  const work = document.createElement('canvas');
  work.width = W;
  work.height = H;
  const ctx = work.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, W, H);
  bitmap.close?.();
  let box = { x: 0, y: 0, w: W, h: H },
    reason: PrepReason = 'off';
  if (clean) {
    const img = ctx.getImageData(0, 0, W, H);
    const r = cutout({ data: img.data, width: W, height: H });
    reason = r.reason;
    if (r.removed) {
      ctx.putImageData(img, 0, 0);
      box = r.box;
    }
  }
  const k = Math.min(1, 480 / Math.max(box.w, box.h));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(box.w * k));
  out.height = Math.max(1, Math.round(box.h * k));
  const o = out.getContext('2d')!;
  o.imageSmoothingQuality = 'high';
  o.drawImage(work, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);
  const toBlob = (type: string) => new Promise<Blob | null>((ok) => out.toBlob(ok, type, 0.9));
  let blob = await toBlob('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/png');
  if (!blob) throw new Error('Rasmni tayyorlab bo‘lmadi.');
  if (blob.size > 3 * 1024 * 1024) throw new Error('Rasm juda katta — kichikroq rasm tanlang.');
  return { blob, reason };
}
