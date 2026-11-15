'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';

/* 🚩 Sun'iy intellekt yaratgan natija ustidan shikoyat (Google Play «AI-generated content» qoidasi: foydalanuvchi
   ilovadan chiqmasdan nojo'ya yoki zararli natijani ishlab chiquvchiga bildira olishi shart). Shikoyat «Adminga xabar»
   suhbatiga 🚩 belgisi bilan tushadi — matnida taqdimot nomi, slayd raqami va slayd mazmuni bo'ladi, administrator
   nima yozilganini o'sha yerda ko'radi. */
const REASONS: [string, string, string, string][] = [
  [
    'harm',
    'Haqoratli yoki zararli mazmun',
    'Offensive or harmful content',
    'Оскорбительное или вредное содержание',
  ],
  [
    'adult',
    'Nojo‘ya (18+) yoki zo‘ravonlik',
    'Sexual or violent content',
    'Непристойное (18+) или насилие',
  ],
  ['false', 'Noto‘g‘ri yoki aldovchi ma’lumot', 'False or misleading facts', 'Ложные сведения'],
  ['other', 'Boshqa sabab', 'Another reason', 'Другая причина'],
];

/** `subject` — nima ustidan shikoyat (masalan taqdimot nomi va slayd matni); administratorga xabar ichida boradi. */
export function AiReport({ subject, onClose }: { subject: string; onClose: () => void }) {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [why, setWhy] = useState('harm'),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const reason = REASONS.find((r) => r[0] === why)!;
      const head =
        '🚩 SHIKOYAT (sun’iy intellekt natijasi)\nSabab: ' +
        reason[1] +
        (note.trim() ? '\nIzoh: ' + note.trim() : '') +
        '\n\n';
      const text = (head + subject).slice(0, 1500);
      const r = await request('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', input: { text, cat: 'report' } }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Xatolik');
      toast(
        '🚩 ' +
          L(
            'Shikoyat yuborildi — administrator ko‘rib chiqadi. Rahmat!',
            'Report sent — the administrator will review it. Thank you!',
            'Жалоба отправлена — администратор её рассмотрит. Спасибо!',
          ),
      );
      onClose();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="chat-report ai-report" onSubmit={(e) => void send(e)}>
      <h2>
        <Flag size={18} />{' '}
        {L(
          'Sun’iy intellekt natijasi ustidan shikoyat',
          'Report this AI result',
          'Пожаловаться на результат ИИ',
        )}
      </h2>
      <label>
        {L('Sabab', 'Reason', 'Причина')}
        <select className="input" value={why} onChange={(e) => setWhy(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r[0]} value={r[0]}>
              {L(r[1], r[2], r[3])}
            </option>
          ))}
        </select>
      </label>
      <label>
        {L('Izoh (ixtiyoriy)', 'Details (optional)', 'Подробности (необязательно)')}
        <textarea
          className="input"
          rows={2}
          maxLength={400}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={L(
            'Nima noto‘g‘ri yoki nojo‘ya ekanini qisqa yozing',
            'Briefly say what is wrong or inappropriate',
            'Коротко опишите, что не так',
          )}
        />
      </label>
      <div className="chat-report-actions">
        <Button type="submit" disabled={busy}>
          {busy ? L('Yuborilmoqda…', 'Sending…', 'Отправка…') : L('Yuborish', 'Send', 'Отправить')}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          {L('Bekor', 'Cancel', 'Отмена')}
        </Button>
      </div>
      <small className="muted">
        {L(
          'Shikoyatda taqdimot nomi va shu slayd matni administratorga boradi. Odatda 24 soat ichida ko‘rib chiqiladi.',
          'The presentation title and this slide’s text go to the administrator. Usually reviewed within 24 hours.',
          'Администратор получит название презентации и текст этого слайда. Обычно рассматривается в течение 24 часов.',
        )}
      </small>
    </form>
  );
}
