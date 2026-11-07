/* 🎭 Yangi avatar rasmining fonini olib tashlash — asl 10 ta avatardek: fon shaffof, qahramon chetigacha kesilgan,
   eng uzun tomoni 480 px. Oq (yoki boshqa bir xil rangli) fon rasm chetidan boshlab «suv quyib» topiladi; qahramon
   ichidagi oq joylar (ko'z, tish) tegilmaydi, chunki ular chetga tutashmagan. Chetdagi yarim shaffof piksellardan fon
   rangi ajratib olinadi — oq hoshiya qolmaydi. Fon bir xil bo'lmasa (masalan, surat), rasm o'zgartirilmaydi. */

export type Pixels = { data: Uint8ClampedArray; width: number; height: number };
export type CutoutResult = {
  /** fon olib tashlandimi (yoki rasmning o'zi allaqachon shaffof edimi) */
  removed: boolean;
  /** 'removed' — fon olindi, 'transparent' — fon allaqachon shaffof, 'busy' — fon bir xil emas, 'failed' — qahramon topilmadi */
  reason: 'removed' | 'transparent' | 'busy' | 'failed';
  /** qahramon joylashgan qism (kichik zaxira bilan) */
  box: { x: number; y: number; w: number; h: number };
};

const NEAR = 40; // fon rangiga shu masofagacha — fon
const FAR = 96; // shu masofadan uzoq — to'liq qahramon (oralig'i — yumshoq chet)

/** Rasm piksellarida fonni shaffof qiladi (joyida o'zgartiradi) va qahramon chegarasini qaytaradi. */
export function cutout(px: Pixels): CutoutResult {
  const { data, width: w, height: h } = px;
  const n = w * h;
  const full = { x: 0, y: 0, w, h };
  if (!w || !h) return { removed: false, reason: 'failed', box: full };
  // 1) chet piksellari: allaqachon shaffofmi, bo'lmasa — eng ko'p uchraydigan rang
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  let clear = 0;
  const buckets = new Map<number, { c: number; r: number; g: number; b: number }>();
  for (const i of border) {
    const o = i * 4;
    if (data[o + 3] < 16) {
      clear++;
      continue;
    }
    const key = ((data[o] >> 4) << 8) | ((data[o + 1] >> 4) << 4) | (data[o + 2] >> 4);
    const v = buckets.get(key) || { c: 0, r: 0, g: 0, b: 0 };
    v.c++;
    v.r += data[o];
    v.g += data[o + 1];
    v.b += data[o + 2];
    buckets.set(key, v);
  }
  if (clear > border.length * 0.4) return { removed: true, reason: 'transparent', box: bounds(px) };
  let top = { c: 0, r: 0, g: 0, b: 0 };
  for (const v of buckets.values()) if (v.c > top.c) top = v;
  if (top.c < border.length * 0.45) return { removed: false, reason: 'busy', box: full };
  const bg = [top.r / top.c, top.g / top.c, top.b / top.c];
  const dist = (o: number) =>
    Math.sqrt((data[o] - bg[0]) ** 2 + (data[o + 1] - bg[1]) ** 2 + (data[o + 2] - bg[2]) ** 2);
  // 2) chetdan boshlab fon rangidagi tutash piksellar (4 tomonga)
  const isBg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0,
    tail = 0;
  const seed = (i: number) => {
    if (isBg[i]) return;
    const o = i * 4;
    if (data[o + 3] < 16 || dist(o) <= NEAR) {
      isBg[i] = 1;
      queue[tail++] = i;
    }
  };
  for (const i of border) seed(i);
  while (head < tail) {
    const i = queue[head++],
      x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }
  if (tail > n * 0.97) return { removed: false, reason: 'failed', box: full };
  // 3) fon — shaffof; fonga tegib turgan chet piksellari — yarim shaffof, fon rangi ajratib olinadi
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (isBg[i]) {
      data[o + 3] = 0;
      continue;
    }
    const x = i % w;
    const edge =
      (x > 0 && isBg[i - 1]) ||
      (x < w - 1 && isBg[i + 1]) ||
      (i >= w && isBg[i - w]) ||
      (i < n - w && isBg[i + w]);
    if (!edge) continue;
    const a = Math.min(1, Math.max(0, (dist(o) - NEAR * 0.5) / (FAR - NEAR * 0.5)));
    if (a >= 1) continue;
    if (a <= 0.05) {
      data[o + 3] = 0;
      continue;
    }
    for (let k = 0; k < 3; k++)
      data[o + k] = Math.min(255, Math.max(0, (data[o + k] - bg[k] * (1 - a)) / a));
    data[o + 3] = Math.round(data[o + 3] * a);
  }
  const box = bounds(px);
  if (box.w * box.h < n * 0.02) return { removed: false, reason: 'failed', box: full };
  return { removed: true, reason: 'removed', box };
}

/** Ko'rinadigan (shaffof bo'lmagan) qism chegarasi, atrofida 2% zaxira bilan. */
export function bounds(px: Pixels) {
  const { data, width: w, height: h } = px;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return { x: 0, y: 0, w, h };
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
  const x = Math.max(0, x0 - pad),
    y = Math.max(0, y0 - pad);
  return { x, y, w: Math.min(w, x1 + pad + 1) - x, h: Math.min(h, y1 + pad + 1) - y };
}
