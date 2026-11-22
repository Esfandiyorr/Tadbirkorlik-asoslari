'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { tr } from '@/lib/points';
import type { HelpRow } from '@/lib/server/account-help';
export function AccountHelpForm() {
  const { lang } = useApp(),
    L = (a: string, b: string, c: string) => tr(lang, a, b, c),
    [open, setOpen] = useState(false),
    [receipt, setReceipt] = useState(''),
    [status, setStatus] = useState<{ status: string; reply: string } | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setReceipt(localStorage.getItem('unistay-account-help') || '');
    } catch {}
  }, []);
  const checkStatus = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/account-help?receipt=' + receipt, { cache: 'no-store' }),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      setStatus(v);
      setMessage('');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <details
      className="account-help panel"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {L('Hisobga kira olmayapsizmi?', 'Need help signing in?', 'Не удаётся войти?')}
      </summary>
      <p>
        {L(
          'Ism, familiya va aloqa ma’lumotingizni yozing. O‘qituvchi yoki administrator tekshirib, shu yerda javob beradi. Parolingizni yubormang.',
          'Send your name and contact. A teacher or administrator will review and reply here. Do not send your password.',
          'Укажите имя и контакт. Преподаватель или администратор проверит запрос и ответит здесь. Пароль не отправляйте.',
        )}
      </p>
      {receipt ? (
        <>
          <p>
            {L('So‘rovingiz saqlangan.', 'Your request has been saved.', 'Ваш запрос сохранён.')}
          </p>
          <Button disabled={busy} variant="outline" onClick={checkStatus}>
            {L('So‘rov holatini tekshirish', 'Check request status', 'Проверить статус')}
          </Button>
          {status && (
            <div role="status">
              <b>
                {status.status === 'resolved'
                  ? L('Javob berilgan', 'Answered', 'Есть ответ')
                  : status.status === 'reviewing'
                    ? L('Tekshirilmoqda', 'Under review', 'На проверке')
                    : L('Navbatda', 'In queue', 'В очереди')}
              </b>
              <p>{status.reply}</p>
            </div>
          )}
          {(status?.status === 'resolved' || message) && (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setReceipt('');
                setStatus(null);
                setMessage('');
                try {
                  localStorage.removeItem('unistay-account-help');
                } catch {}
              }}
            >
              {L('Yangi yordam so‘rovi', 'New help request', 'Новый запрос помощи')}
            </Button>
          )}
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const r = await fetch('/api/account-help', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(Object.fromEntries(f)),
                }),
                v = await r.json();
              if (!r.ok) throw Error(v.error);
              setReceipt(v.receipt);
              setStatus(v);
              try {
                localStorage.setItem('unistay-account-help', v.receipt);
              } catch {}
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {L('Ism va familiya', 'Full name', 'Имя и фамилия')}
            <input
              className="input"
              name="name"
              minLength={3}
              maxLength={150}
              required
              autoComplete="name"
            />
          </label>
          <label>
            {L('Guruh (bo‘lsa)', 'Group (if any)', 'Группа (если есть)')}
            <input className="input" name="group" maxLength={60} />
          </label>
          <label>
            {L('Email yoki telefon', 'Email or phone', 'Email или телефон')}
            <input
              className="input"
              name="contact"
              minLength={5}
              maxLength={150}
              required
              autoComplete="email"
            />
          </label>
          <label>
            {L('Nima yordam kerak?', 'What help do you need?', 'Какая помощь нужна?')}
            <textarea
              className="input"
              name="message"
              minLength={5}
              maxLength={1000}
              rows={3}
              required
            />
          </label>
          <Button type="submit" disabled={busy}>
            {L('Yordam so‘rash', 'Request help', 'Запросить помощь')}
          </Button>
        </form>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
export function AccountHelpAdmin() {
  const { request, lang } = useApp(),
    L = (a: string, b: string, c: string) => tr(lang, a, b, c),
    [rows, setRows] = useState<HelpRow[] | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState('');
  const load = async () => {
    try {
      const r = await request('/api/account-help?view=inbox'),
        v = await r.json();
      if (!r.ok) throw Error(v.error);
      setRows(v.rows);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [request]);
  return (
    <section className="account-help-inbox">
      <h2>{L('Hisobga kirish bo‘yicha yordam', 'Sign-in help requests', 'Помощь со входом')}</h2>
      <p>
        {L(
          'Hisob egasini tekshiring. Kerak bo‘lsa mavjud “Talabalar va baholar” bo‘limida kirishni tiklang, so‘ng javob yozing.',
          'Verify account ownership. If needed, use the existing student records to restore access, then reply.',
          'Проверьте владельца. При необходимости восстановите вход через существующий раздел студентов, затем ответьте.',
        )}
      </p>
      <Button variant="outline" onClick={load}>
        {L('Yangilash', 'Refresh', 'Обновить')}
      </Button>
      <p role="status">{message}</p>
      {rows?.map((row) => (
        <form
          className="panel account-help-request"
          key={row.id + ':' + row.updatedAt}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(row.id);
            try {
              const r = await request('/api/account-help', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: row.id,
                    status: f.get('status'),
                    reply: f.get('reply'),
                  }),
                }),
                v = await r.json();
              if (!r.ok) throw Error(v.error);
              await load();
              setMessage(L('Javob saqlandi.', 'Reply saved.', 'Ответ сохранён.'));
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy('');
            }
          }}
        >
          <h3>
            {row.name} · {row.group}
          </h3>
          <p>{row.contact}</p>
          <p>{row.message}</p>
          <label>
            {L('Holat', 'Status', 'Статус')}
            <select className="input" name="status" defaultValue={row.status}>
              <option value="new">{L('Navbatda', 'Queued', 'В очереди')}</option>
              <option value="reviewing">{L('Tekshirilmoqda', 'Reviewing', 'Проверяется')}</option>
              <option value="resolved">{L('Javob berildi', 'Answered', 'Дан ответ')}</option>
            </select>
          </label>
          <label>
            {L('Javob', 'Reply', 'Ответ')}
            <textarea className="input" name="reply" defaultValue={row.reply} maxLength={1000} />
          </label>
          <Button type="submit" disabled={busy === row.id}>
            {L('Javobni saqlash', 'Save reply', 'Сохранить ответ')}
          </Button>
        </form>
      ))}
      {rows?.length === 0 && (
        <p>{L('Yordam so‘rovlari yo‘q.', 'No help requests.', 'Запросов нет.')}</p>
      )}
    </section>
  );
}
