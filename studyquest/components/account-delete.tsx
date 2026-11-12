'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { dueText, tr } from '@/lib/points';

/* 🗑 Profil → «Hisobni o'chirish» (Google Play talabi: hisob ochish mumkin bo'lgan ilovada uni o'chirishni ilova
   ichidan so'rash imkoni bo'lishi shart). So'rov administratorga boradi; u tasdiqlaguncha hisob ishlayveradi va
   so'rovni bekor qilish mumkin. Ochiq yo'riqnoma — /delete-account. */
export function AccountDelete() {
  const { data, lang, request, toast } = useApp();
  const L = (uz: string, en: string, ru: string) => tr(lang, uz, en, ru);
  const u = data?.user;
  const [pending, setPending] = useState<number | null | undefined>(undefined),
    [open, setOpen] = useState(false),
    [reason, setReason] = useState(''),
    [sure, setSure] = useState(false),
    [busy, setBusy] = useState(false);
  const can = !!u && u.role !== 'admin';
  useEffect(() => {
    if (!can) return;
    let live = true;
    request('/api/platform?view=deletion')
      .then((r) => (r.ok ? r.json() : { pending: null }))
      .then((v) => live && setPending(v.pending || null))
      .catch(() => live && setPending(null));
    return () => {
      live = false;
    };
  }, [can, request]);
  if (!can) return null;
  async function act(op: 'request' | 'cancel') {
    setBusy(true);
    try {
      const r = await request('/api/platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deletion',
            input: { op, ...(op === 'request' && reason.trim() ? { reason: reason.trim() } : {}) },
          }),
        }),
        v = await r.json();
      if (!r.ok) throw new Error(v.error || v.issues?.[0]?.message || 'Xatolik');
      setPending(v.pending || null);
      setOpen(false);
      setSure(false);
      setReason('');
      toast(
        op === 'request'
          ? L(
              'So‘rov yuborildi. Hisobingiz 30 kun ichida o‘chiriladi.',
              'Request sent. Your account will be deleted within 30 days.',
              'Запрос отправлен. Аккаунт будет удалён в течение 30 дней.',
            )
          : L('So‘rov bekor qilindi.', 'Request cancelled.', 'Запрос отменён.'),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel profile-card account-delete">
      <h2>🗑 {L('Hisobni o‘chirish', 'Delete account', 'Удалить аккаунт')}</h2>
      {pending ? (
        <>
          <p className="account-delete-pending" role="status">
            {L(
              `O‘chirish so‘rovi yuborilgan (${dueText(pending, lang, Date.now()).date}). Administrator tasdiqlagach hisobingiz va ma’lumotlaringiz o‘chiriladi.`,
              `Deletion requested (${dueText(pending, lang, Date.now()).date}). Your account and data will be deleted once the administrator confirms.`,
              `Запрос на удаление отправлен (${dueText(pending, lang, Date.now()).date}). После подтверждения администратором аккаунт и данные будут удалены.`,
            )}
          </p>
          <Button variant="outline" disabled={busy} onClick={() => void act('cancel')}>
            {L('So‘rovni bekor qilish', 'Cancel the request', 'Отменить запрос')}
          </Button>
        </>
      ) : open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (sure) void act('request');
          }}
        >
          <p className="muted">
            {L(
              'Hisobingiz, ism-familiyangiz, o‘qish tarixi, ballar, yutuqlar va yozishmalaringiz o‘chiriladi. Buni ortga qaytarib bo‘lmaydi.',
              'Your account, name, reading history, points, achievements and messages will be deleted. This cannot be undone.',
              'Аккаунт, имя, история чтения, баллы, достижения и переписка будут удалены. Это нельзя отменить.',
            )}
          </p>
          <label>
            {L('Sabab (ixtiyoriy)', 'Reason (optional)', 'Причина (необязательно)')}
            <textarea
              className="input"
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />
            {L(
              'Tushundim, hisobim va ma’lumotlarim o‘chirilsin',
              'I understand — delete my account and data',
              'Понимаю — удалите мой аккаунт и данные',
            )}
          </label>
          <div className="account-delete-actions">
            <Button type="submit" variant="outline" className="danger" disabled={!sure || busy}>
              <Trash2 size={15} />
              {L('O‘chirishni so‘rash', 'Request deletion', 'Запросить удаление')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {L('Bekor', 'Cancel', 'Отмена')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="muted">
            {L(
              'Hisobingiz va barcha shaxsiy ma’lumotlaringizni o‘chirishni so‘rashingiz mumkin.',
              'You can ask for your account and all personal data to be deleted.',
              'Вы можете запросить удаление аккаунта и всех личных данных.',
            )}{' '}
            <a href={'/privacy?lang=' + lang} target="_blank" rel="noopener">
              {L('Maxfiylik siyosati', 'Privacy Policy', 'Политика конфиденциальности')}
            </a>
          </p>
          <Button variant="outline" disabled={pending === undefined} onClick={() => setOpen(true)}>
            <Trash2 size={15} />
            {L('Hisobni o‘chirish', 'Delete account', 'Удалить аккаунт')}
          </Button>
        </>
      )}
    </section>
  );
}
