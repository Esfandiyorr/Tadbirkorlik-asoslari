import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { lessons } from '../lib/seed';

/* 🎬 Asosiy fan mavzusining animatsion videosi (config.json «video») dars oynasidagi «Video» tugmasiga yetib boradi. */
it('topic 10 has its animated film with subtitles and a cover', () => {
  const m10 = lessons.find((l) => l.id === 'm10')!;
  expect(m10.legacyVideo).toBe('fayllar/video/M10.mp4');
  expect(m10.slideCount).toBe(21);
  for (const ext of ['mp4', 'vtt', 'jpg'])
    expect(fs.existsSync(path.resolve(__dirname, '../../fayllar/video/M10.' + ext)), ext).toBe(
      true,
    );
  // «📥 PDF»: 21 slaydning PDF nusxasi
  expect(m10.legacyPdf).toBe('fayllar/M10-mavzu.pdf');
  const pdf = fs.readFileSync(path.resolve(__dirname, '../../fayllar/M10-mavzu.pdf'));
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  // videosi yo'q mavzularda tugma eski holicha (faqat boshqaruvdagi YouTube havolalari)
  expect(lessons.find((l) => l.id === 'm11')!.legacyVideo).toBeUndefined();
});
