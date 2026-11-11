'use client';
import { useState, type FormEvent } from 'react';
import { Send, TestTube } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { PushToggle } from '../push-toggle';
import { useAdminView, useL } from './common';
import type { PushAdminView, PushAuto, PushKind } from '@/lib/server/push';

/* 🔔 Sayt boshqaruvi → Bildirishnomalar: ilovani o'rnatgan va saytda bildirishnomani yoqqanlarga xabar yuborish,
   avtomatik xabarlarni (jonli test, mavzu, e'lon, video) yoqish/o'chirish va yuborilganlar tarixi. */

type Sent = { total: number; sent: number; failed: number; removed: number };
const hm = (ms: number) => new Date(ms + 18000000).toISOString().slice(11, 16);
const dmhm = (ms: number) => {
  const d = new Date(ms + 18000000).toISOString();
  return d.slice(8, 10) + '.' + d.slice(5, 7) + ' ' + d.slice(11, 16);
};
const LINKS: { u: string; uz: string; en: string; ru: string }[] = [
  { u: '/#home', uz: '🏠 Bosh sahifa', en: '🏠 Home', ru: '🏠 Главная' },
  { u: '/#arena/play/live', uz: '⚡ Jonli test', en: '⚡ Live quiz', ru: '⚡ Живой тест' },
  { u: '/#courses', uz: '📚 Mavzular', en: '📚 Topics', ru: '📚 Темы' },
  { u: '/#ranking', uz: '🏆 Reyting', en: '🏆 Ranking', ru: '🏆 Рейтинг' },
  { u: '/#arena', uz: '🎮 O‘yin maydoni', en: '🎮 Arena', ru: '🎮 Арена' },
];

export function PushAdmin() {
  const L = useL();
  const { data, error, busy, act } = useAdminView<PushAdminView>('pushAdmin', 'pushAdmin');
  const [tab, setTab] = useState<'send' | 'auto' | 'log'>('send');
  if (error) return <p className="error-state">{error}</p>;
  if (!data) return <div className="skeleton h-64" />;
  const s = data.stats;
  return (
    <div className="bo-live bo-push">
      <div className="bo-status">
        <span className={'bo-pill ' + (s.devices ? 'on' : 'off')}>📲 {s.devices}</span>
        <span>
          {L(
            `ta qurilmada yoqilgan: 📱 ilovada — ${s.app}, 🌐 brauzerda — ${s.browser}. Odamlar: ${s.students} talaba, ${s.staff} o‘qituvchi/administrator.`,
            `devices turned on: 📱 in the app — ${s.app}, 🌐 in a browser — ${s.browser}. People: ${s.students} students, ${s.staff} staff.`,
            `устройств включено: 📱 в приложении — ${s.app}, 🌐 в браузере — ${s.browser}. Люди: ${s.students} студентов, ${s.staff} сотрудников.`,
          )}
        </span>
      </div>
      <p className="bo-hint">
        {L(
          'Xabar faqat «🔔 Bildirishnomalar → Yoqish» ni bosganlarga boradi: ilovani telefonga o‘rnatganlar ham, saytni brauzerda ochib yoqqanlar ham. Talabalarga bosh sahifada yoqish taklifi chiqib turadi. iPhone’da faqat «Bosh ekranga qo‘shilgan» ilovada ishlaydi.',
          'Messages reach only people who pressed “🔔 Notifications → Turn on”: both app users and browser users. Students see an invitation on the home page. On iPhone it works only in the app added to the Home Screen.',
          'Сообщения получат только те, кто нажал «🔔 Уведомления → Включить» — и в приложении, и в браузере. Студентам на главной показывается приглашение. На iPhone — только в приложении на экране «Домой».',
        )}
      </p>
      <div className="bo-push-me">
        <PushToggle compact />
      </div>
      <div className="bo-subtabs" role="tablist">
        {(
          [
            ['send', L('✉️ Xabar yuborish', '✉️ Send a message', '✉️ Отправить')],
            ['auto', L('⚙️ Avtomatik xabarlar', '⚙️ Automatic messages', '⚙️ Автоматические')],
            ['log', L('🕘 Tarix', '🕘 History', '🕘 История') + ` (${data.log.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'send' && <SendForm data={data} busy={busy} act={act} />}
      {tab === 'auto' && <AutoForm data={data} busy={busy} act={act} />}
      {tab === 'log' && <History data={data} />}
    </div>
  );
}

type Act = ReturnType<typeof useAdminView<PushAdminView>>['act'];

function SendForm({ data, busy, act }: { data: PushAdminView; busy: string; act: Act }) {
  const L = useL();
  const { lang, toast } = useApp();
  const [f, setF] = useState({ t: '', b: '', u: '/#home', custom: '', aud: 'all' });
  const s = data.stats;
  const count =
    f.aud === 'all'
      ? s.devices
      : f.aud === 'students'
        ? s.studentDevices
        : f.aud === 'staff'
          ? s.staffDevices
          : data.groups.find((g) => 'g:' + g.g === f.aud)?.devices || 0;
  const url = f.u === 'custom' ? f.custom.trim() : f.u;
  const urlOk = !url || /^https:\/\/\S+$/.test(url) || /^\/#[a-z][a-z0-9/_-]*$/i.test(url);
  const ready = f.t.trim().length >= 2 && urlOk;
  const msg = (self: boolean) => ({
    t: f.t.trim(),
    b: f.b.trim(),
    u: url,
    ...(self ? { self: true } : { aud: f.aud }),
  });
  const report = (r: Sent | undefined, self: boolean) => {
    if (!r) return;
    toast(
      (self ? '🧪 ' : '✅ ') +
        L(
          `${r.sent} ta qurilmaga yetkazildi` + (r.failed ? `, ${r.failed} tasiga yetmadi` : ''),
          `Delivered to ${r.sent} devices` + (r.failed ? `, ${r.failed} failed` : ''),
          `Доставлено на ${r.sent} устройств` + (r.failed ? `, не доставлено: ${r.failed}` : ''),
        ),
    );
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    if (
      !window.confirm(
        L(
          `Xabar ${count} ta qurilmaga yuboriladi. Yuborilsinmi?`,
          `The message goes to ${count} devices. Send it?`,
          `Сообщение уйдёт на ${count} устройств. Отправить?`,
        ),
      )
    )
      return;
    try {
      const v = (await act({ op: 'send', msg: msg(false) }, 'send')) as PushAdminView & {
        result?: Sent;
      };
      report(v.result, false);
      setF((x) => ({ ...x, t: '', b: '' }));
    } catch {}
  }
  async function selfTest() {
    try {
      const v = (await act({ op: 'send', msg: msg(true) }, 'self')) as PushAdminView & {
        result?: Sent;
      };
      report(v.result, true);
    } catch {}
  }
  return (
    <form className="bo-form" onSubmit={submit}>
      <h3>✉️ {L('Yangi xabar', 'New message', 'Новое сообщение')}</h3>
      <label>
        {L('Sarlavha', 'Title', 'Заголовок')}
        <input
          className="input"
          required
          maxLength={80}
          value={f.t}
          onChange={(e) => setF({ ...f, t: e.target.value })}
          placeholder={L(
            'Masalan: 📢 Ertaga dars 2-binoda bo‘ladi',
            'E.g. 📢 Tomorrow’s class is in building 2',
            'Например: 📢 Завтра занятие во 2-м корпусе',
          )}
        />
      </label>
      <label>
        {L('Matn', 'Text', 'Текст')}
        <textarea
          className="input"
          rows={3}
          maxLength={300}
          value={f.b}
          onChange={(e) => setF({ ...f, b: e.target.value })}
          placeholder={L(
            'Qisqa matn (300 belgigacha) — telefonda sarlavha ostida chiqadi',
            'Short text (up to 300 characters) — shown under the title',
            'Короткий текст (до 300 символов) — под заголовком',
          )}
        />
      </label>
      <div className="bo-row">
        <label>
          {L('Kimga', 'To', 'Кому')}
          <select
            className="input"
            value={f.aud}
            onChange={(e) => setF({ ...f, aud: e.target.value })}
          >
            <option value="all">
              {L('Hammaga', 'Everyone', 'Всем')} ({s.devices})
            </option>
            <option value="students">
              {L('Faqat talabalarga', 'Students only', 'Только студентам')} ({s.studentDevices})
            </option>
            <option value="staff">
              {L('O‘qituvchi va administratorlarga', 'Teachers and admins', 'Преподавателям')} (
              {s.staffDevices})
            </option>
            {data.groups.map((g) => (
              <option key={g.g} value={'g:' + g.g}>
                👥 {g.g} ({g.devices})
              </option>
            ))}
          </select>
        </label>
        <label>
          {L('Bosganda ochiladi', 'Opens on tap', 'Открывается по нажатию')}
          <select className="input" value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })}>
            {LINKS.map((x) => (
              <option key={x.u} value={x.u}>
                {x[lang]}
              </option>
            ))}
            <option value="custom">
              🔗 {L('Boshqa havola…', 'Other link…', 'Другая ссылка…')}
            </option>
          </select>
        </label>
      </div>
      {f.u === 'custom' && (
        <input
          className="input"
          maxLength={300}
          value={f.custom}
          onChange={(e) => setF({ ...f, custom: e.target.value })}
          placeholder="https://…"
          aria-label={L('Havola', 'Link', 'Ссылка')}
        />
      )}
      {!urlOk && (
        <p className="bo-hint bo-bad">
          {L(
            'Havola https:// bilan boshlansin.',
            'The link must start with https://',
            'Ссылка должна начинаться с https://',
          )}
        </p>
      )}
      <div className="bo-push-preview" aria-label={L('Ko‘rinishi', 'Preview', 'Предпросмотр')}>
        <img src="/icon-192.png" alt="" width={36} height={36} />
        <div>
          <b>{f.t.trim() || L('Sarlavha', 'Title', 'Заголовок')}</b>
          <span>
            {f.b.trim() || L('Matn shu yerda chiqadi', 'Text appears here', 'Здесь текст')}
          </span>
        </div>
      </div>
      <div className="bo-actions">
        <Button type="submit" disabled={!ready || !!busy || !count}>
          <Send size={15} />
          {L(`Yuborish (${count})`, `Send (${count})`, `Отправить (${count})`)}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!ready || !!busy || !s.mine}
          onClick={() => void selfTest()}
          title={
            s.mine
              ? ''
              : L(
                  'Avval yuqorida o‘zingizda «🔔 Yoqish» ni bosing',
                  'First turn notifications on for yourself above',
                  'Сначала включите уведомления у себя выше',
                )
          }
        >
          <TestTube size={15} />
          {L('Avval o‘zimga sinab ko‘rish', 'Try on my devices first', 'Сначала себе')}
        </Button>
      </div>
      {!count && (
        <p className="bo-hint">
          {L(
            'Hozircha tanlanganlar orasida bildirishnomani yoqqan qurilma yo‘q.',
            'No devices with notifications on among the chosen people yet.',
            'Среди выбранных пока нет устройств с уведомлениями.',
          )}
        </p>
      )}
    </form>
  );
}

const AUTO_ROWS: {
  k: Exclude<keyof PushAuto, 'liveMin'>;
  icon: string;
  uz: [string, string];
  en: [string, string];
  ru: [string, string];
}[] = [
  {
    k: 'liveNew',
    icon: '📅',
    uz: [
      'Jonli test e’loni',
      'O‘yindan 14 soat oldin («Bugun 21:30 da jonli test», 09:30 dagi o‘yin uchun — kechqurun «Ertaga 09:30 da…»). Kech tuzilgan o‘yin uchun — tuzilgan zahoti.',
    ],
    en: [
      'Live quiz announcement',
      '14 hours before the game (“Today at 21:30 — live quiz”; for 09:30 — the evening before). A game created later is announced at once.',
    ],
    ru: [
      'Анонс живого теста',
      'За 14 часов до игры («Сегодня в 21:30 живой тест»; для 09:30 — накануне вечером). Игра, созданная позже, — сразу.',
    ],
  },
  {
    k: 'live',
    icon: '⚡',
    uz: [
      'Jonli test eslatmasi',
      'Boshlanishidan oldin: «21:30 da boshlanadi, qo‘shilish 21:20 da ochiladi». Yozuv marafoniga ham.',
    ],
    en: ['Live quiz reminder', 'Before the start: “Starts at 21:30, joining opens at 21:20”.'],
    ru: ['Напоминание о тесте', 'Перед началом: «Начало в 21:30, вход с 21:20».'],
  },
  {
    k: 'topics',
    icon: '🟢',
    uz: [
      'Mavzu ochilganda',
      '«Mavzular holati»da mavzu 🟢 ochilsa yoki 🔒 dan 📖 o‘qish rejimiga o‘tsa — talabalarga, ball yig‘ish muddati bilan.',
    ],
    en: [
      'When a topic opens',
      'When a topic is opened (or moved from closed to reading) in “Topic access” — to students, with the deadline.',
    ],
    ru: ['Когда открыта тема', 'Когда тему открывают в «Доступ к темам» — студентам, со сроком.'],
  },
  {
    k: 'news',
    icon: '📢',
    uz: [
      'Yangi e’lon',
      '«E’lonlar» bo‘limida «📲 Telefonlarga ham yuborilsin» belgisi odatda yoqilgan bo‘ladi (har e’londa o‘zgartirsa bo‘ladi).',
    ],
    en: [
      'New announcement',
      'In “Announcements” the “📲 Also send to phones” box is ticked by default (can be changed for each one).',
    ],
    ru: [
      'Новое объявление',
      'В «Объявлениях» галочка «📲 Отправить на телефоны» включена по умолчанию.',
    ],
  },
  {
    k: 'videos',
    icon: '📺',
    uz: ['Yangi video', '«Mavzu videolari»da mavzuga video qo‘shilganda — talabalarga.'],
    en: ['New video', 'When a video is added in “Topic videos” — to students.'],
    ru: ['Новое видео', 'Когда в «Видео по темам» добавлено видео — студентам.'],
  },
];

function AutoForm({ data, busy, act }: { data: PushAdminView; busy: string; act: Act }) {
  const L = useL();
  const { lang } = useApp();
  // belgi darhol o'zgaradi (server javobini kutmasdan); xato bo'lsa — avvalgi holatiga qaytadi
  const [local, setLocal] = useState<PushAuto | null>(null);
  const save = (next: PushAuto) => {
    setLocal(next);
    return act({ op: 'settings', auto: next }, 'auto', '💾 ' + L('Saqlandi', 'Saved', 'Сохранено'))
      .catch(() => {})
      .finally(() => setLocal(null));
  };
  const a = local || data.auto,
    n = data.next;
  return (
    <div className="bo-card">
      <h3>⚙️ {L('Avtomatik xabarlar', 'Automatic messages', 'Автоматические сообщения')}</h3>
      <ul className="bo-push-auto">
        {AUTO_ROWS.map((r) => (
          <li key={r.k}>
            <label className="bo-check">
              <input
                type="checkbox"
                checked={a[r.k]}
                disabled={!!local}
                onChange={(e) => void save({ ...a, [r.k]: e.target.checked })}
              />
              <span>
                <b>
                  {r.icon} {r[lang][0]}
                </b>
                <small>{r[lang][1]}</small>
              </span>
            </label>
            {r.k === 'live' && a.live && (
              <label className="bo-push-min">
                {L('Necha daqiqa oldin', 'Minutes before', 'За сколько минут')}
                <select
                  className="input"
                  value={a.liveMin}
                  disabled={!!local}
                  onChange={(e) => void save({ ...a, liveMin: +e.target.value })}
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} {L('daqiqa', 'min', 'мин')}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </li>
        ))}
      </ul>
      <div className="bo-status">
        {n ? (
          <span>
            {(n.type === 'yz' ? '⌨️ ' : '⚡ ') +
              L('Navbatdagi o‘yin: ', 'Next game: ', 'Следующая игра: ') +
              dmhm(n.start)}
            {' · '}
            {n.sentAnn
              ? L('📅 e’lon yuborilgan', '📅 announced', '📅 анонс отправлен')
              : n.announceAt
                ? L('📅 e’lon ', '📅 announcement ', '📅 анонс ') + dmhm(n.announceAt)
                : ''}
            {' · '}
            {n.sentRem
              ? L('⚡ eslatma yuborilgan', '⚡ reminder sent', '⚡ напоминание отправлено')
              : n.remindAt
                ? L('⚡ eslatma ', '⚡ reminder ', '⚡ напоминание ') + hm(n.remindAt)
                : L('⚡ eslatma o‘chiq', '⚡ reminder off', '⚡ напоминание выкл.')}
          </span>
        ) : (
          <span>
            {L(
              'Yaqin kunlarda jonli test rejalashtirilmagan.',
              'No live quiz is planned soon.',
              'Живой тест в ближайшие дни не запланирован.',
            )}
          </span>
        )}
      </div>
      <p className="bo-hint">
        {L(
          'Jonli test xabarlari har o‘yinga bir martadan ketadi. O‘yin boshqa vaqtga ko‘chirilsa, yangi vaqt uchun yana yuboriladi. Xabarlar o‘z vaqtidan 1–5 daqiqa kechikishi mumkin.',
          'Live quiz messages go once per game. If a game is moved, they go again for the new time. Messages may arrive 1–5 minutes late.',
          'Сообщения о тесте уходят по одному разу на игру; при переносе — снова для нового времени. Возможна задержка 1–5 минут.',
        )}
      </p>
    </div>
  );
}

const KIND: Record<PushKind, [string, string, string]> = {
  manual: ['✉️ Qo‘lda', '✉️ Manual', '✉️ Вручную'],
  test: ['🧪 Sinov', '🧪 Test', '🧪 Тест'],
  ann: ['📅 Jonli test e’loni', '📅 Live quiz announcement', '📅 Анонс теста'],
  live: ['⚡ Jonli test eslatmasi', '⚡ Live quiz reminder', '⚡ Напоминание'],
  topic: ['🟢 Mavzu ochildi', '🟢 Topic opened', '🟢 Тема открыта'],
  news: ['📢 E’lon', '📢 Announcement', '📢 Объявление'],
  video: ['📺 Video', '📺 Video', '📺 Видео'],
};

function History({ data }: { data: PushAdminView }) {
  const L = useL();
  const { lang } = useApp();
  const li = lang === 'en' ? 1 : lang === 'ru' ? 2 : 0;
  const aud = (x: string) =>
    x === 'all'
      ? L('hammaga', 'everyone', 'всем')
      : x === 'students'
        ? L('talabalarga', 'students', 'студентам')
        : x === 'staff'
          ? L('o‘qituvchilarga', 'staff', 'сотрудникам')
          : x === 'live'
            ? L('talaba va o‘qituvchilarga', 'students and staff', 'студентам и преподавателям')
            : x.startsWith('g:')
              ? '👥 ' + x.slice(2)
              : x;
  if (!data.log.length)
    return (
      <p className="bo-hint">
        {L(
          'Hali hech narsa yuborilmagan.',
          'Nothing has been sent yet.',
          'Пока ничего не отправлено.',
        )}
      </p>
    );
  return (
    <ul className="bo-list bo-push-log">
      {data.log.map((x) => (
        <li key={x.at + x.t}>
          <div>
            <small>
              {dmhm(x.at)} · {KIND[x.k]?.[li] || x.k} · {aud(x.aud)}
              {x.by ? ' · ' + x.by : ''}
            </small>
            <b>{x.t}</b>
            {x.b && <span>{x.b}</span>}
          </div>
          <span
            className={'bo-pill ' + (x.s ? 'on' : 'off')}
            title={L('yetkazildi', 'delivered', 'доставлено')}
          >
            ✅ {x.s}/{x.n}
          </span>
        </li>
      ))}
    </ul>
  );
}
