import { expect, it } from 'vitest';
import { cutout } from '../lib/avatar-cutout';

/* 🎭 Avatar rasmining oq fonini olib tashlash (yangi avatar asl 10 tasidek shaffof bo'lsin). */
function image(
  w: number,
  h: number,
  paint: (x: number, y: number) => [number, number, number, number],
) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(paint(x, y), (y * w + x) * 4);
  return { data, width: w, height: h };
}
const alpha = (px: ReturnType<typeof image>, x: number, y: number) =>
  px.data[(y * px.width + x) * 4 + 3];
const inCircle = (x: number, y: number, cx: number, cy: number, r: number) =>
  (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

it('removes a white background but keeps white parts inside the character', () => {
  // oq fon (JPEG kabi biroz «shovqin» bilan), o'rtada qizil doira, doira ichida oq «ko'z»
  const px = image(200, 160, (x, y) => {
    if (inCircle(x, y, 100, 80, 50))
      return inCircle(x, y, 100, 70, 10) ? [255, 255, 255, 255] : [220, 30, 40, 255];
    const n = (x * 7 + y * 13) % 6;
    return [250 + (n % 5), 251, 249 + n, 255];
  });
  const r = cutout(px);
  expect(r).toMatchObject({ removed: true, reason: 'removed' });
  expect(alpha(px, 0, 0)).toBe(0);
  expect(alpha(px, 199, 159)).toBe(0);
  expect(alpha(px, 20, 80)).toBe(0);
  expect(alpha(px, 100, 110)).toBe(255); // qahramon
  expect(alpha(px, 100, 70)).toBe(255); // ichidagi oq ko'z tegilmagan
  // qahramon chetigacha kesilgan (2% zaxira bilan)
  expect(r.box.x).toBeGreaterThanOrEqual(46);
  expect(r.box.x).toBeLessThanOrEqual(50);
  expect(r.box.w).toBeGreaterThanOrEqual(100);
  expect(r.box.w).toBeLessThanOrEqual(106);
  // chetdagi yarim shaffof piksellarda oq «hoshiya» qolmaydi
  for (let i = 0; i < px.data.length; i += 4)
    if (px.data[i + 3] > 0 && px.data[i + 3] < 255) expect(px.data[i + 1]).toBeLessThan(200);
});

it('also works on another plain colour and leaves busy or transparent pictures alone', () => {
  const green = image(120, 120, (x, y) =>
    inCircle(x, y, 60, 60, 30) ? [30, 60, 200, 255] : [40, 200, 90, 255],
  );
  expect(cutout(green).reason).toBe('removed');
  expect(alpha(green, 2, 2)).toBe(0);
  expect(alpha(green, 60, 60)).toBe(255);

  // surat: chetlari har xil rangda — o'zgartirilmaydi
  const photo = image(120, 120, (x, y) => [
    (x * 37) % 256,
    (y * 53) % 256,
    ((x + y) * 29) % 256,
    255,
  ]);
  const before = photo.data.slice();
  expect(cutout(photo)).toMatchObject({ removed: false, reason: 'busy' });
  expect(photo.data).toEqual(before);

  // allaqachon shaffof (asl avatarlar kabi) — faqat chetlari kesiladi
  const clear = image(100, 100, (x, y) =>
    inCircle(x, y, 50, 60, 20) ? [200, 150, 30, 255] : [0, 0, 0, 0],
  );
  const r = cutout(clear);
  expect(r.reason).toBe('transparent');
  expect(r.box.w).toBeLessThan(50);
});
