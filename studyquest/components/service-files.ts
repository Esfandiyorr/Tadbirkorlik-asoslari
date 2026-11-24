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

/** Bitta faylni yuklash. Bir xil fid bilan yuborilgan takroriy so‘rov qolgan bo‘laklardan davom etadi. */
export async function sendOrderFile(
  request: Req,
  scope: 'me' | 'admin',
  { uk, id }: { uk: string; id: string },
  fid: string,
  file: File,
) {
  const ids = scope === 'admin' ? { uk, id } : { id };
  const { chunk, missing } = await servicesAct<{ chunk: number; missing: number[] }>(
    request,
    scope,
    {
      op: 'begin',
      ...ids,
      fid,
      name: file.name,
      size: file.size,
    },
  );
  for (const n of missing) {
    const form = new FormData();
    form.append('scope', scope);
    form.append('o', uk + '/' + id);
    form.append('fid', fid);
    form.append('n', String(n));
    form.append('file', file.slice(n * chunk, (n + 1) * chunk), 'part');
    await json(await request('/api/services', { method: 'POST', body: form }));
  }
  await servicesAct(request, scope, { op: 'finish', ...ids, fid });
}

/** Faylni bo'laklab yuklab olib, qurilmaga saqlaydi. */
export async function saveOrderFile(request: Req, o: string, f: OrderFile) {
  const parts: ArrayBuffer[] = [];
  for (let n = 0; n < f.chunks; n++) {
    const q = new URLSearchParams({ o, f: f.id, n: String(n) });
    const r = await request('/api/services/file?' + q.toString());
    if (!r.ok) await json(r);
    parts.push(await r.arrayBuffer());
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
