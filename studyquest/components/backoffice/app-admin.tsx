'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Check, Copy, ExternalLink, Save, Trash2, X } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { dueText } from '@/lib/points';
import { useAdminView, useL } from './common';
import type { AppAdminView } from '@/lib/server/app-store';

/* 📱 Sayt boshqaruvi → Ilova (Play Market): Google Play talab qiladigan narsalar bir joyda —
   maxfiylik siyosati uchun operator va email, ilova imzosi (assetlinks.json), hisobni o'chirish so'rovlari va
   Play Console'ga kiritiladigan havolalar. */
export function AppAdmin() {
  const L = useL();
  const { lang, toast } = useApp();
  const { data, error, busy, act } = useAdminView<AppAdminView>('appAdmin', 'appAdmin');
  const [f, setF] = useState({ operator: '', email: '', pkg: '', sha: '' });
  const [origin, setOrigin] = useState('');
  const info = data?.info;
  useEffect(() => {
    if (info)
      setF({
        operator: info.operator,
        email: info.email,
        pkg: info.pkg,
        sha: info.sha.join('\n'),
      });
  }, [info]);
  useEffect(() => setOrigin(location.origin), []);
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const save = (e: FormEvent) => {
    e.preventDefault();
    void act(
      {
        op: 'save',
        operator: f.operator.trim(),
        email: f.email.trim(),
        pkg: f.pkg.trim(),
        sha: f.sha
          .split(/\n+/)
          .map((x) => x.trim())
          .filter(Boolean),
      },
      'save',
      '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'),
    ).catch(() => {});
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(L('Nusxalandi', 'Copied', 'Скопировано'));
    } catch {
      toast(text);
    }
  };
  const links: [string, string, string][] = [
    [
      L('Maxfiylik siyosati', 'Privacy Policy', 'Политика конфиденциальности'),
      origin + '/privacy',
      L(
        'Play Console → App content → Privacy policy',
        'Play Console → App content → Privacy policy',
        'Play Console → App content → Privacy policy',
      ),
    ],
    [
      L('Hisobni o‘chirish sahifasi', 'Account deletion page', 'Страница удаления аккаунта'),
      origin + '/delete-account',
      L(
        'Play Console → App content → Data safety → Delete account URL',
        'Play Console → App content → Data safety → Delete account URL',
        'Play Console → App content → Data safety → Delete account URL',
      ),
    ],
    [
      'assetlinks.json',
      origin + '/.well-known/assetlinks.json',
      L(
        'Ilova va sayt bog‘langanini tekshirish uchun',
        'To check that the app and the site are linked',
        'Для проверки связи приложения и сайта',
      ),
    ],
  ];
  const steps: [boolean, string][] = [
    [
      data.ready.policy,
      L(
        'Operator va email kiritilgan (maxfiylik siyosatida ko‘rinadi)',
        'Operator and email are filled in (shown in the privacy policy)',
        'Указаны оператор и email (видны в политике конфиденциальности)',
      ),
    ],
    [
      data.ready.links,
      L(
        'Paket nomi va SHA-256 izi kiritilgan (ilova to‘liq ekranda ochiladi)',
        'Package name and SHA-256 fingerprint are set (the app opens full screen)',
        'Указаны имя пакета и отпечаток SHA-256 (приложение открывается на весь экран)',
      ),
    ],
    [
      !data.requests.length,
      data.requests.length
        ? L(
            `${data.requests.length} ta o‘chirish so‘rovi kutmoqda`,
            `${data.requests.length} deletion request(s) waiting`,
            `Запросов на удаление: ${data.requests.length}`,
          )
        : L(
            'Kutayotgan o‘chirish so‘rovi yo‘q',
            'No deletion requests waiting',
            'Запросов на удаление нет',
          ),
    ],
  ];
  return (
    <div className="bo-live bo-app">
      <ul className="bo-app-steps">
        {steps.map(([ok, text]) => (
          <li key={text} className={ok ? 'is-ok' : 'is-todo'}>
            {ok ? <Check size={16} /> : <X size={16} />}
            {text}
          </li>
        ))}
      </ul>
      <form className="bo-form" onSubmit={save}>
        <h3>
          🔒{' '}
          {L(
            'Maxfiylik siyosati uchun',
            'For the privacy policy',
            'Для политики конфиденциальности',
          )}
        </h3>
        <div className="bo-row">
          <label>
            {L(
              'Operator (kim javobgar)',
              'Operator (who is responsible)',
              'Оператор (кто отвечает)',
            )}
            <input
              className="input"
              maxLength={120}
              value={f.operator}
              onChange={(e) => setF({ ...f, operator: e.target.value })}
              placeholder={L(
                'Masalan: F.I.Sh. yoki tashkilot nomi',
                'E.g. your full name or the organisation',
                'Например: ФИО или название организации',
              )}
            />
          </label>
          <label>
            {L('Murojaat uchun email', 'Contact email', 'Email для обращений')}
            <input
              className="input"
              type="email"
              maxLength={120}
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              placeholder="ism@example.uz"
            />
          </label>
        </div>
        <p className="bo-hint">
          {L(
            'Bu ikki ma’lumot ochiq «Maxfiylik siyosati» va «Hisobni o‘chirish» sahifalarida ko‘rinadi. Google Play uchun email ko‘rsatish shart.',
            'These two details are shown on the public “Privacy Policy” and “Delete account” pages. Google Play requires a contact email.',
            'Эти данные видны на открытых страницах «Политика конфиденциальности» и «Удаление аккаунта». Google Play требует email.',
          )}
        </p>
        <h3>
          🔗 {L('Android ilovasi imzosi', 'Android app signature', 'Подпись Android-приложения')}
        </h3>
        <label>
          {L('Paket nomi (Package name)', 'Package name', 'Имя пакета (Package name)')}
          <input
            className="input"
            maxLength={150}
            value={f.pkg}
            onChange={(e) => setF({ ...f, pkg: e.target.value })}
            placeholder="uz.terdu.tadbirkorlik"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <label>
          {L(
            'SHA-256 izlari (har qatorda bittadan)',
            'SHA-256 fingerprints (one per line)',
            'Отпечатки SHA-256 (по одному в строке)',
          )}
          <textarea
            className="input bo-mono"
            rows={3}
            value={f.sha}
            onChange={(e) => setF({ ...f, sha: e.target.value })}
            placeholder="14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
            spellCheck={false}
          />
        </label>
        <p className="bo-hint">
          {L(
            'Ilova Play Console’ga yuklangach: Play Console → Test and release → Setup → App integrity → App signing → «SHA-256 certificate fingerprint» ni nusxalab shu yerga qo‘ying (PWABuilder bergan kalitning izi ham bo‘lsa — uni ikkinchi qatorga). Shundan keyin ilova saytni brauzer manzil satrisiz, to‘liq ekranda ochadi.',
            'After uploading the app: Play Console → Test and release → Setup → App integrity → App signing → copy the “SHA-256 certificate fingerprint” here (add the PWABuilder upload key fingerprint on a second line if you have it). The app then opens the site full screen without the browser address bar.',
            'После загрузки приложения: Play Console → Test and release → Setup → App integrity → App signing → скопируйте «SHA-256 certificate fingerprint» сюда. После этого приложение открывает сайт на весь экран без адресной строки.',
          )}
        </p>
        <div className="bo-actions">
          <Button type="submit" disabled={!!busy}>
            <Save size={15} /> {L('Saqlash', 'Save', 'Сохранить')}
          </Button>
        </div>
      </form>
      <div className="bo-card">
        <h3>
          🧷{' '}
          {L(
            'Play Console’ga kiritiladigan havolalar',
            'Links for Play Console',
            'Ссылки для Play Console',
          )}
        </h3>
        <ul className="bo-list bo-app-links">
          {links.map(([name, url, where]) => (
            <li key={url}>
              <div>
                <b>{name}</b>
                <code>{url}</code>
                <small>{where}</small>
              </div>
              <span className="bo-row-btns">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copy(url)}
                  aria-label={L('Nusxalash', 'Copy', 'Копировать') + ': ' + name}
                >
                  <Copy size={14} />
                </Button>
                <a
                  className="bo-app-open"
                  href={url}
                  target="_blank"
                  rel="noopener"
                  aria-label={L('Ochish', 'Open', 'Открыть') + ': ' + name}
                >
                  <ExternalLink size={14} />
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bo-card">
        <h3>
          🗑{' '}
          {L(
            'Hisobni o‘chirish so‘rovlari',
            'Account deletion requests',
            'Запросы на удаление аккаунта',
          )}{' '}
          ({data.requests.length})
        </h3>
        {data.requests.length ? (
          <>
            <p className="bo-warn">
              {L(
                'Tasdiqlansa, talabaning hisobi, ballari va o‘qish tarixi butunlay o‘chadi — tiklab bo‘lmaydi. Baholar kerak bo‘lsa, avval «Talabalar va baholar → CSV» orqali saqlab oling. So‘rovga 30 kun ichida javob bering.',
                'Approving deletes the student’s account, points and reading history for good. If you need the grades, export them first (“Students and grades → CSV”). Answer each request within 30 days.',
                'После подтверждения аккаунт, баллы и история чтения удаляются безвозвратно. Если оценки нужны — сначала выгрузите CSV. Отвечайте на запрос в течение 30 дней.',
              )}
            </p>
            <ul className="bo-list bo-app-requests">
              {data.requests.map((r) => (
                <li key={r.uid}>
                  <div>
                    <b>{r.name}</b>
                    <small>
                      {(r.group ? r.group + ' · ' : '') + dueText(r.at, lang, Date.now()).date}
                    </small>
                    {r.reason && <span>«{r.reason}»</span>}
                  </div>
                  <span className="bo-row-btns">
                    <Button
                      size="sm"
                      variant="outline"
                      className="danger"
                      disabled={!!busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            L(
                              `${r.name} hisobi va barcha ma’lumotlari butunlay o‘chirilsinmi? Buni ortga qaytarib bo‘lmaydi.`,
                              `Delete ${r.name}’s account and all data for good? This cannot be undone.`,
                              `Удалить аккаунт ${r.name} и все данные безвозвратно?`,
                            ),
                          )
                        )
                          void act(
                            { op: 'approve', uid: r.uid },
                            'ap' + r.uid,
                            L('Hisob o‘chirildi', 'Account deleted', 'Аккаунт удалён'),
                          ).catch(() => {});
                      }}
                    >
                      <Trash2 size={14} /> {L('O‘chirish', 'Delete', 'Удалить')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() =>
                        void act(
                          { op: 'reject', uid: r.uid },
                          'rj' + r.uid,
                          L('So‘rov rad etildi', 'Request declined', 'Запрос отклонён'),
                        ).catch(() => {})
                      }
                    >
                      {L('Rad etish', 'Decline', 'Отклонить')}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="bo-hint">
            {L(
              'Hozircha so‘rov yo‘q. Talaba «Profil → Hisobni o‘chirish» ni bossa, so‘rovi shu yerda chiqadi.',
              'No requests yet. When a student presses “Profile → Delete account”, the request appears here.',
              'Запросов пока нет. Когда студент нажмёт «Профиль → Удалить аккаунт», запрос появится здесь.',
            )}
          </p>
        )}
      </div>
    </div>
  );
}
