'use client';
import { FILE_TYPES, type OrderFile } from '@/lib/services';

/* 💼 Buyurtma fayllari brauzerda: Vercel bitta so'rovda 4,5 MB dan ortiq qabul qilmaydi va bermaydi — fayl 2,5 MB lik
   bo'laklarga bo'linib yuklanadi (begin → bo'laklar → finish) va yuklab olishda bo'laklar qayta bitta faylga yig'iladi. */
type Req = (url: string, init?: RequestInit) => Promise<Response>;

async function json<T>(r: Response): Promise<T> {
  const v = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((v as { error?: string }).error || 'Xatolik');
  return v as T;
}
/** POST {scope, input} → javob. */
export async function servicesAct<T>(request: Req, scope: 'me' | 'admin', input: unknown) {
  return json<T>(
    await request('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, input }),
    }),
  );
}

/** Faylni buyurtmaga yuklash. o — «<foydalanuvchi>/<buyurtma>»; ids — begin/finish uchun buyurtma kaliti. */
export async function sendOrderFile(
  request: Req,
  scope: 'me' | 'admin',
  o: string,
  ids: Record<string, string>,
  file: File,
  onProgress?: (x: number) => void,
) {
  const begun = await servicesAct<{ fid: string; chunk: number; chunks: number }>(request, scope, {
    op: 'begin',
    ...ids,
    name: file.name,
    size: file.size,
  });
  try {
    for (let n = 0; n < begun.chunks; n++) {
      const form = new FormData();
      form.append('scope', scope);
      form.append('o', o);
      form.append('fid', begun.fid);
      form.append('n', String(n));
      form.append('file', file.slice(n * begun.chunk, (n + 1) * begun.chunk), 'part');
      await json(await request('/api/services', { method: 'POST', body: form }));
      onProgress?.((n + 1) / begun.chunks);
    }
  } catch (e) {
    // chala qolgan yuklashni olib tashlash (aks holda bir kundan keyin o'zi tozalanadi)
    await servicesAct(request, scope, { op: 'unfile', ...ids, fid: begun.fid }).catch(() => {});
    throw e;
  }
  return servicesAct<unknown>(request, scope, { op: 'finish', ...ids, fid: begun.fid });
}

/** Faylni bo'laklab yuklab olib, qurilmaga saqlaydi. */
export async function saveOrderFile(
  request: Req,
  o: string,
  f: OrderFile,
  onProgress?: (x: number) => void,
) {
  const parts: ArrayBuffer[] = [];
  for (let n = 0; n < f.chunks; n++) {
    const q = new URLSearchParams({ o, f: f.id, n: String(n) });
    const r = await request('/api/services/file?' + q.toString());
    if (!r.ok) await json(r);
    parts.push(await r.arrayBuffer());
    onProgress?.((n + 1) / f.chunks);
  }
  const url = URL.createObjectURL(new Blob(parts, { type: FILE_TYPES[f.ext].mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
