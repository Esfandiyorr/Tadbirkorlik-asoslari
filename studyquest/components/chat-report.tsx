'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';

/* 🚩 Chatdagi nojo'ya xabar yoki foydalanuvchi ustidan shikoyat (Google Play: foydalanuvchilar yozadigan kontent uchun
   ilova ichida shikoyat qilish imkoni bo'lishi shart). Shikoyat «Adminga xabar» suhbatiga 🚩 belgisi bilan tushadi —
   administrator va o'qituvchi «Kelgan xabarlar»da ko'radi, xabarni o'chiradi yoki muallifni chatdan chetlatadi. */
const REASONS: [string, string, string, string][] = [
  ['insult', 'Haqorat yoki so‘kinish', 'Insults or swearing', 'Оскорбления или мат'],
  ['spam', 'Spam yoki reklama', 'Spam or advertising', 'Спам или реклама'],
  [
    'bad',
    'Nojo‘ya rasm, video yoki havola',
    'Inappropriate image, video or link',
    'Неуместное фото, видео или ссылка',
  ],
  ['bully', 'Tahdid yoki kamsitish', 'Threats or bullying', 'Угрозы или травля'],
  ['other', 'Boshqa sabab', 'Another reason', 'Другая причина'],
];

export function ChatReport() {
  const { lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const [open, setOpen] = useState(false),
    [who, setWho] = useState(''),
    [why, setWhy] = useState('insult'),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const reason = REASONS.find((r) => r[0] === why)!;
      const text =
        '🚩 SHIKOYAT (guruh chati)\n' +
        'Kimning xabari: ' +
        who.trim() +
        '\nSabab: ' +
        reason[1] +
        (note.trim() ? '\nIzoh: ' + note.trim() : '');
      const r = await request('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', input: { text, cat: 'report' } }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Xatolik');
      toast(
        '🚩 ' +
          L(
            'Shikoyat yuborildi — administrator ko‘rib chiqadi.',
            'Report sent — the administrator will review it.',
            'Жалоба отправлена — администратор её рассмотрит.',
          ),
      );
      setOpen(false);
      setWho('');
      setNote('');
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <button className="panel chat-help chat-report-open" onClick={() => setOpen(true)}>
        <span aria-hidden="true">🚩</span>
        <span>
          <b>{L('Shikoyat qilish', 'Report a message', 'Пожаловаться')}</b>
          <small>
            {L(
              'Haqorat, spam yoki nojo‘ya xabarni ko‘rsangiz — administratorga bildiring.',
              'Tell the administrator about insults, spam or inappropriate messages.',
              'Сообщите администратору об оскорблениях, спаме или неуместных сообщениях.',
            )}
          </small>
        </span>
      </button>
    );
  return (
    <form className="panel chat-report" onSubmit={(e) => void send(e)}>
      <h2>
        <Flag size={18} /> {L('Shikoyat qilish', 'Report a message', 'Пожаловаться')}
      </h2>
      <label>
        {L('Kimning xabari?', 'Whose message?', 'Чьё сообщение?')}
        <input
          className="input"
          required
          minLength={2}
          maxLength={80}
          value={who}
          onChange={(e) => setWho(e.target.value)}
          placeholder={L('Ism va familiya', 'First and last name', 'Имя и фамилия')}
        />
      </label>
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
            'Xabar qachon yozilgani yoki nima deyilgani',
            'When it was written or what it said',
            'Когда написано или что было сказано',
          )}
        />
      </label>
      <div className="chat-report-actions">
        <Button type="submit" disabled={busy || who.trim().length < 2}>
          {L('Yuborish', 'Send', 'Отправить')}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {L('Bekor', 'Cancel', 'Отмена')}
        </Button>
      </div>
      <small className="muted">
        {L(
          'Shikoyatingiz faqat administrator va o‘qituvchiga ko‘rinadi. Odatda 24 soat ichida ko‘rib chiqiladi.',
          'Only the administrator and teacher see your report. It is usually reviewed within 24 hours.',
          'Жалобу видят только администратор и преподаватель. Обычно её рассматривают в течение 24 часов.',
        )}
      </small>
    </form>
  );
}
