'use client';
import { useEffect, useState } from 'react';
import { useApp } from './provider';
import { tr } from '@/lib/points';
export function ConnectionNotice() {
  const { lang } = useApp(),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="connection-notice" role="status">
      {tr(
        lang,
        'Internet yo‘q. Yuklab olingan matnni o‘qishingiz mumkin. Shaxsiy qayd qoralamasi qurilmada saqlanadi; ballni yuborish uchun ulanish kerak.',
        'Offline. You can read downloaded text. Personal note drafts stay on this device; submitting scores requires a connection.',
        'Нет сети. Можно читать скачанный текст. Черновики заметок сохраняются на устройстве; для отправки баллов нужно подключение.',
      )}
    </div>
  );
}
