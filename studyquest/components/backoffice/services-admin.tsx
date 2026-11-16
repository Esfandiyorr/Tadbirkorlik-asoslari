'use client';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { ExternalLink, RefreshCw, Upload } from 'lucide-react';
import { useApp } from '../provider';
import { Button } from '../ui/button';
import { useL } from './common';
import { Chat, FileList } from '../services';
import { sendOrderFile, servicesAct } from '../service-files';
import { dueText, tr } from '@/lib/points';
import {
  FILE_ACCEPT,
  FILE_MAX,
  FILES_PER_ORDER,
  STATUS_LABEL,
  fileSize,
  formatSum,
  isActive,
  serviceKind,
  type AdminOrder,
  type ServicesAdminView,
  type Tri,
  type WorkerProfile,
} from '@/lib/services';

/* 💼 Sayt boshqaruvi → Pullik xizmatlar (talabalar ish bozori):
   • Vazifalar — arizalar orasidan ijrochini tasdiqlash, to'lovni tasdiqlash, nazorat, ijrochiga pul o'tkazish;
   • Ijrochilar — ro'yxat, pul o'tkazish ma'lumoti, ishlagan/kutilayotgan pul, to'xtatish;
   • Yo'nalishlar — katalog (odatdagi narx, muddat, yopish);
   • Sozlamalar — to'lov yo'riqnomasi va platforma ulushi (%). */
type Tab = 'tasks' | 'workers' | 'catalog' | 'settings';
type Filter = 'todo' | 'open' | 'pay' | 'work' | 'done' | 'cancel' | 'all';

/** Administrator biror amal qilishi kerak bo'lgan vazifa. */
const needsMe = (o: AdminOrder) =>
  (o.status === 'open' && o.apps.length > 0) ||
  o.status === 'paid' ||
  (o.status === 'done' && !!o.worker && !o.payout);
const FILTERS: [Filter, Tri, (o: AdminOrder) => boolean][] = [
  ['todo', ['Diqqat', 'Needs action', 'Требуют действия'], needsMe],
  ['open', ['E’londa', 'On the board', 'На бирже'], (o) => o.status === 'open'],
  ['pay', ['To‘lov', 'Payment', 'Оплата'], (o) => o.status === 'assigned' || o.status === 'paid'],
  [
    'work',
    ['Ishda', 'In progress', 'В работе'],
    (o) => o.status === 'work' || o.status === 'review',
  ],
  ['done', ['Yakunlangan', 'Completed', 'Завершённые'], (o) => o.status === 'done'],
  ['cancel', ['Bekor', 'Cancelled', 'Отменённые'], (o) => o.status === 'cancel'],
  ['all', ['Hammasi', 'All', 'Все'], () => true],
];
const share = (budget: number, fee: number) => Math.round((budget * (100 - fee)) / 100);
const kindTitle = (lang: Parameters<typeof tr>[0], id: string) => {
  const k = serviceKind(id);
  return k ? k.icon + ' ' + tr(lang, ...k.name) : id;
};

export function ServicesAdmin() {
  const L = useL();
  const { request, toast } = useApp();
  const [view, setView] = useState<ServicesAdminView | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('tasks');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await request('/api/services?admin=1'),
        v = await r.json();
      if (!r.ok) throw new Error(v.error);
      setView(v);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <p className="error-state">{error}</p>;
  if (!view) return <div className="skeleton" style={{ height: 220 }} />;
  const todo = view.orders.filter(needsMe).length;
  const owed = view.workers.reduce((n, w) => n + w.pending, 0);
  const paid = view.workers.reduce((n, w) => n + w.earned, 0);
  /** Bo'limni ishga tushirish yoki yana «tez orada» rejimiga qaytarish. */
  async function launch(open: boolean) {
    if (
      !window.confirm(
        open
          ? L(
              'Bo‘lim ishga tushirilsinmi? Talabalar vazifa bera boshlaydi. Avval to‘lov yo‘riqnomasi va ulushni tekshiring.',
              'Launch the section? Students will start posting tasks. Check the payment instructions and the fee first.',
              'Запустить раздел? Студенты начнут давать задачи. Сначала проверьте инструкцию по оплате и комиссию.',
            )
          : L(
              'Bo‘lim «Tez orada» rejimiga qaytarilsinmi? Yangi vazifa qabul qilinmaydi, ochiq vazifalar davom etadi.',
              'Switch back to “Launching soon”? New tasks stop; open tasks continue.',
              'Вернуть режим «Скоро запуск»? Новые задачи не принимаются, открытые продолжаются.',
            ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'launch',
        open,
      });
      setView(r.admin);
      toast(
        open
          ? L('🚀 Bo‘lim ishga tushdi!', '🚀 The section is live!', '🚀 Раздел запущен!')
          : L(
              '⏸ «Tez orada» rejimi yoqildi.',
              '⏸ “Launching soon” is on.',
              '⏸ Режим «Скоро запуск».',
            ),
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="svc-admin">
      <div className={'svc-launch' + (view.open ? ' is-open' : '')}>
        <span className={'bo-pill ' + (view.open ? 'on' : 'off')}>
          {view.open ? L('Ishlayapti', 'Live', 'Работает') : L('Tez orada', 'Coming soon', 'Скоро')}
        </span>
        <p>
          {view.open
            ? L(
                'Talabalar vazifa beryapti, ijrochilar ariza beryapti.',
                'Students post tasks and workers apply.',
                'Студенты дают задачи, исполнители откликаются.',
              )
            : L(
                'Bo‘lim hali ishga tushmagan: talaba kirganda «🚀 Tez orada» oynasi chiqadi, u taklif yuboradi yoki ijrochi bo‘lib ro‘yxatdan o‘tadi. Takliflar «Kelgan xabarlar»ga 💡 belgisi bilan tushadi.',
                'Not launched yet: students see “🚀 Launching soon”, send suggestions or sign up as workers. Suggestions arrive in the inbox marked 💡.',
                'Ещё не запущен: студенты видят «🚀 Скоро запуск», отправляют идеи или регистрируются исполнителями. Идеи приходят во «Входящие» со значком 💡.',
              )}
        </p>
        {view.open ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void launch(false)}>
            ⏸ {L('«Tez orada»ga qaytarish', 'Back to “coming soon”', 'Вернуть «Скоро»')}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => void launch(true)}>
            🚀 {L('Ishga tushirish', 'Launch', 'Запустить')}
          </Button>
        )}
      </div>
      <ul className="mk-tiles is-admin">
        <li className="is-violet">
          <small>{L('Faol vazifalar', 'Active tasks', 'Активные задачи')}</small>
          <b>{view.orders.filter((o) => isActive(o.status)).length}</b>
        </li>
        <li className="is-blue">
          <small>{L('Ijrochilar', 'Workers', 'Исполнители')}</small>
          <b>{view.workers.filter((w) => w.status === 'active').length}</b>
        </li>
        <li className="is-amber">
          <small>{L('Ijrochilarga o‘tkazish kerak', 'Owed to workers', 'К выплате')}</small>
          <b>{formatSum(owed)}</b>
        </li>
        <li className="is-green">
          <small>{L('O‘tkazib berilgan', 'Paid out', 'Выплачено')}</small>
          <b>{formatSum(paid)}</b>
        </li>
      </ul>
      <div className="bo-subtabs" role="tablist">
        {(
          [
            ['tasks', '📋 ' + L('Vazifalar', 'Tasks', 'Задачи') + (todo ? ` (${todo})` : '')],
            [
              'workers',
              '🧑‍💻 ' +
                L('Ijrochilar', 'Workers', 'Исполнители') +
                (view.workers.length ? ` (${view.workers.length})` : ''),
            ],
            ['catalog', '🗂 ' + L('Yo‘nalishlar', 'Directions', 'Направления')],
            ['settings', '⚙️ ' + L('To‘lov va ulush', 'Payment and fee', 'Оплата и комиссия')],
          ] as [Tab, string][]
        ).map(([id, name]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === 'tasks' && <Tasks view={view} reload={load} onView={setView} />}
      {tab === 'workers' && <Workers view={view} onView={setView} />}
      {tab === 'catalog' && <Catalog view={view} onView={setView} />}
      {tab === 'settings' && <Settings view={view} onView={setView} />}
      <p className="muted svc-used">
        {L('Saqlangan fayllar hajmi', 'Stored files', 'Объём файлов')}: {fileSize(view.used || 1)}
      </p>
    </div>
  );
}

function Tasks({
  view,
  reload,
  onView,
}: {
  view: ServicesAdminView;
  reload: () => Promise<void>;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang } = useApp();
  const [filter, setFilter] = useState<Filter>(() => (view.orders.some(needsMe) ? 'todo' : 'all'));
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState('');
  const test = FILTERS.find(([f]) => f === filter)![2];
  const needle = q.trim().toLowerCase();
  // ochiq turgan karta amal bajarilgach boshqa filtrga o'tsa ham, yopilguncha ro'yxatda qoladi
  const list = view.orders.filter(
    (o) =>
      (test(o) || openId === o.uk + o.id) &&
      (!needle ||
        (o.title + ' ' + o.name + ' ' + (o.group || '') + ' ' + (o.worker?.name || ''))
          .toLowerCase()
          .includes(needle)),
  );
  return (
    <>
      <div className="svc-admin-tools">
        <div className="lib-kinds" role="group" aria-label={L('Holat', 'Status', 'Статус')}>
          {FILTERS.map(([f, name, fn]) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {tr(lang, ...name)} <em>{view.orders.filter(fn).length}</em>
            </button>
          ))}
        </div>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={L('Ism, guruh yoki mavzu', 'Name, group or topic', 'Имя, группа или тема')}
          aria-label={L('Vazifalardan qidirish', 'Search tasks', 'Поиск задач')}
        />
        <Button size="sm" variant="outline" onClick={() => void reload()}>
          <RefreshCw size={14} /> {L('Yangilash', 'Refresh', 'Обновить')}
        </Button>
      </div>
      {!list.length && (
        <p className="muted svc-empty">
          {L('Bu yerda hozircha vazifa yo‘q.', 'No tasks here yet.', 'Здесь пока нет задач.')}
        </p>
      )}
      <ul className="svc-admin-list">
        {list.map((o) => (
          <li key={o.uk + o.id}>
            <AdminTask
              order={o}
              view={view}
              open={openId === o.uk + o.id}
              toggle={() => setOpenId(openId === o.uk + o.id ? '' : o.uk + o.id)}
              reload={reload}
              onView={onView}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function AdminTask({
  order: o,
  view,
  open,
  toggle,
  reload,
  onView,
}: {
  order: AdminOrder;
  view: ServicesAdminView;
  open: boolean;
  toggle: () => void;
  reload: () => Promise<void>;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState(o.link || '');
  const [amount, setAmount] = useState(String(share(o.budget, view.fee)));
  const [payNote, setPayNote] = useState('');
  const [progress, setProgress] = useState('');
  const [icon, name] = STATUS_LABEL[o.status];
  const k = serviceKind(o.kind);
  const pending = needsMe(o);
  async function act(input: Record<string, unknown>, key: string, done?: string) {
    setBusy(key);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        uk: o.uk,
        id: o.id,
        ...input,
      });
      onView(r.admin);
      if (done) toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    } finally {
      setBusy('');
    }
  }
  async function upload(list: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length) return;
    setBusy('upload');
    try {
      for (const [i, f] of files.entries()) {
        if (f.size > FILE_MAX.out) {
          toast(L('Fayl 30 MB dan oshmasin: ', 'Max 30 MB: ', 'Не больше 30 МБ: ') + f.name);
          continue;
        }
        await sendOrderFile(request, 'admin', o.uk + '/' + o.id, { uk: o.uk, id: o.id }, f, (x) =>
          setProgress(`${i + 1}/${files.length} · ${Math.round(x * 100)}%`),
        );
      }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      await reload();
      setBusy('');
      setProgress('');
    }
  }
  const removeFile = async (f: { id: string }) => {
    await act({ op: 'unfile', fid: f.id }, 'unfile');
  };
  const ins = o.files.filter((f) => f.side === 'in'),
    outs = o.files.filter((f) => f.side === 'out');
  const busyNow = !!busy;
  return (
    <article
      className={'panel svc-aorder is-' + o.status + (pending ? ' is-todo' : '')}
      style={(k ? { '--c1': k.tone[0], '--c2': k.tone[1] } : {}) as CSSProperties}
    >
      <button type="button" className="svc-aorder-head" aria-expanded={open} onClick={toggle}>
        <span className="svc-aorder-title">
          <b>{o.title}</b>
          <small className="muted">
            {kindTitle(lang, o.kind)} · {o.name}
            {o.group ? ' · ' + o.group : ''} · {dueText(o.at, lang).date}
          </small>
        </span>
        <span className="svc-admin-side">
          <b className="mk-budget">{formatSum(o.budget)}</b>
          <span className={'svc-status is-' + o.status}>
            {icon} {tr(lang, ...name)}
          </span>
          {o.status === 'open' && !!o.apps.length && (
            <em className="svc-admin-flag">🙋 {o.apps.length}</em>
          )}
          {o.status === 'done' && o.worker && !o.payout && (
            <em className="svc-admin-flag">💸 {L('o‘tkazish', 'pay out', 'выплата')}</em>
          )}
        </span>
      </button>
      {open && (
        <div className="svc-aorder-body">
          <p className="svc-text">{o.text}</p>
          <p className="svc-order-meta">
            {o.due && <span>📅 {o.due}</span>}
            {o.contact && <span>📞 {o.contact}</span>}
            {o.email && <span>✉️ {o.email}</span>}
            {o.worker && (
              <span>
                🧑‍💻 {o.worker.name} ·{' '}
                {L(`${o.worker.jobs} ta ish`, `${o.worker.jobs} jobs`, `работ: ${o.worker.jobs}`)}
                {o.worker.rating ? ' · ⭐ ' + o.worker.rating : ''}
              </span>
            )}
          </p>
          {!!ins.length && (
            <>
              <b className="svc-sub">
                📎 {L('Buyurtmachi fayllari', 'Client files', 'Файлы заказчика')}
              </b>
              <FileList files={ins} o={o.uk + '/' + o.id} remove={removeFile} />
            </>
          )}

          {o.status === 'open' && (
            <div className="mk-apps is-admin">
              <b>
                🙋 {L('Arizalar', 'Applications', 'Отклики')} ({o.apps.length})
              </b>
              {!o.apps.length ? (
                <p className="muted">
                  {L(
                    'Hali hech kim ariza bermagan.',
                    'No one has applied yet.',
                    'Откликов пока нет.',
                  )}
                </p>
              ) : (
                <ul>
                  {o.apps.map((x) => (
                    <li key={x.uk}>
                      <span className="mk-avatar" aria-hidden="true">
                        {x.name[0]}
                      </span>
                      <span>
                        <b>{x.name}</b>{' '}
                        <small className="muted">
                          {L(`${x.jobs} ta ish`, `${x.jobs} jobs`, `работ: ${x.jobs}`)}
                          {x.rating ? ' · ⭐ ' + x.rating : ''}
                        </small>
                        {x.note && <q>{x.note}</q>}
                      </span>
                      <Button
                        size="sm"
                        disabled={busyNow}
                        onClick={() =>
                          void act(
                            { op: 'assign', worker: x.uk },
                            'assign',
                            L(
                              'Ijrochi tasdiqlandi — buyurtmachiga to‘lov haqida xabar ketdi.',
                              'Worker approved — the client was asked to pay.',
                              'Исполнитель утверждён — заказчику отправлен запрос на оплату.',
                            ),
                          )
                        }
                      >
                        ✅ {L('Tasdiqlash', 'Approve', 'Утвердить')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(o.status === 'assigned' || o.status === 'paid') && (
            <div className="svc-pay is-admin">
              <b>
                💳{' '}
                {o.status === 'paid'
                  ? L(
                      'Buyurtmachi «To‘lov qildim» dedi — tekshiring',
                      'The client says they paid — check it',
                      'Заказчик сообщил об оплате — проверьте',
                    )
                  : L(
                      'Buyurtmachining to‘lovi kutilmoqda',
                      'Waiting for the client’s payment',
                      'Ожидается оплата заказчика',
                    )}
                : {formatSum(o.budget)}
              </b>
              {o.paidNote && <p className="muted">🧾 {o.paidNote}</p>}
              <div className="svc-row">
                <Button
                  size="sm"
                  disabled={busyNow}
                  onClick={() =>
                    void act(
                      { op: 'confirm' },
                      'confirm',
                      L(
                        'To‘lov tasdiqlandi — ijrochi ishni boshlaydi.',
                        'Payment confirmed — the worker starts.',
                        'Оплата подтверждена — исполнитель начинает работу.',
                      ),
                    )
                  }
                >
                  ✅ {L('To‘lovni tasdiqlash', 'Confirm payment', 'Подтвердить оплату')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyNow}
                  onClick={() => {
                    if (
                      window.confirm(
                        L(
                          'Ijrochi olib tashlanib, vazifa yana e’longa qaytsinmi?',
                          'Remove the worker and put the task back on the board?',
                          'Снять исполнителя и вернуть задачу на биржу?',
                        ),
                      )
                    )
                      void act({ op: 'unassign' }, 'unassign');
                  }}
                >
                  🔄 {L('Ijrochini almashtirish', 'Change worker', 'Сменить исполнителя')}
                </Button>
              </div>
            </div>
          )}

          {(o.status === 'work' || o.status === 'review' || o.status === 'done') && (
            <div className="svc-deliver">
              <b className="svc-sub">📥 {L('Natija', 'Result', 'Результат')}</b>
              {outs.length ? (
                <FileList files={outs} o={o.uk + '/' + o.id} remove={removeFile} />
              ) : (
                <p className="muted">
                  {L('Hali fayl yuklanmagan.', 'No files yet.', 'Файлов пока нет.')}
                </p>
              )}
              {o.status !== 'done' && outs.length < FILES_PER_ORDER.out && (
                <label className="svc-attach-btn is-small">
                  <Upload size={15} />
                  {progress || L('Fayl yuklash', 'Upload a file', 'Загрузить файл')}
                  <input
                    type="file"
                    multiple
                    accept={FILE_ACCEPT}
                    disabled={busyNow}
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
              <form
                className="svc-msg-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(
                    { op: 'link', link: link.trim() },
                    'link',
                    L('Saqlandi.', 'Saved.', 'Сохранено.'),
                  );
                }}
              >
                <input
                  className="input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  aria-label={L('Natija havolasi', 'Result link', 'Ссылка на результат')}
                />
                <Button type="submit" size="sm" variant="outline" disabled={busyNow}>
                  {L('Saqlash', 'Save', 'Сохранить')}
                </Button>
              </form>
              {o.link && (
                <a className="svc-link" href={o.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> {o.link}
                </a>
              )}
              {o.status !== 'done' && (
                <div className="svc-row">
                  {o.status === 'work' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyNow}
                      onClick={() => void act({ op: 'status', status: 'review' }, 'status')}
                    >
                      👀 {L('Topshirildi deb belgilash', 'Mark delivered', 'Отметить сданным')}
                    </Button>
                  )}
                  {o.status === 'review' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyNow}
                      onClick={() => void act({ op: 'status', status: 'work' }, 'status')}
                    >
                      🔁 {L('Ishga qaytarish', 'Back to work', 'Вернуть в работу')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyNow}
                    onClick={() => {
                      if (
                        window.confirm(
                          L(
                            'Buyurtmachi o‘rniga vazifani yakunlaysizmi? (masalan, u javob bermayapti)',
                            'Complete the task for the client? (e.g. they do not respond)',
                            'Завершить задачу за заказчика? (например, он не отвечает)',
                          ),
                        )
                      )
                        void act({ op: 'status', status: 'done' }, 'status');
                    }}
                  >
                    ✅ {L('Yakunlash', 'Complete', 'Завершить')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {o.status === 'done' && o.rating && (
            <p className="svc-note">
              ⭐ {o.rating}/5{o.review ? ' — ' + o.review : ''}
            </p>
          )}
          {o.status === 'done' && o.worker && (
            <div className={'mk-payout' + (o.payout ? ' is-paid' : '')}>
              {o.payout ? (
                <p>
                  💸{' '}
                  {L(
                    `${formatSum(o.payout.amount)} ijrochiga o‘tkazilgan`,
                    `${formatSum(o.payout.amount)} paid to the worker`,
                    `${formatSum(o.payout.amount)} выплачено исполнителю`,
                  )}{' '}
                  · {dueText(o.payout.at, lang).date}
                  {o.payout.note ? ' · ' + o.payout.note : ''}
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(amount.replace(/\D/g, ''));
                    if (
                      window.confirm(
                        L(
                          `${o.worker!.name} hisobiga ${formatSum(n)} o‘tkazdingizmi?`,
                          `Did you transfer ${formatSum(n)} to ${o.worker!.name}?`,
                          `Вы перевели ${formatSum(n)} исполнителю ${o.worker!.name}?`,
                        ),
                      )
                    )
                      void act(
                        {
                          op: 'payout',
                          amount: n,
                          ...(payNote.trim() ? { note: payNote.trim() } : {}),
                        },
                        'payout',
                        '💸 ' + L('Belgilandi.', 'Recorded.', 'Отмечено.'),
                      );
                  }}
                >
                  <b>💸 {L('Ijrochiga pul o‘tkazish', 'Pay the worker', 'Выплата исполнителю')}</b>
                  <small className="muted">
                    {L(
                      `Buyurtmachi ${formatSum(o.budget)} to‘lagan. Platforma ulushi ${view.fee}% — ijrochiga ${formatSum(share(o.budget, view.fee))}. Pul o‘tkazish ma’lumoti «Ijrochilar» bo‘limida.`,
                      `The client paid ${formatSum(o.budget)}. Fee ${view.fee}% — the worker gets ${formatSum(share(o.budget, view.fee))}. Payout details are under “Workers”.`,
                      `Заказчик оплатил ${formatSum(o.budget)}. Комиссия ${view.fee}% — исполнителю ${formatSum(share(o.budget, view.fee))}. Реквизиты — в разделе «Исполнители».`,
                    )}
                  </small>
                  <div className="svc-row">
                    <input
                      className="input"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      aria-label={L('Summa', 'Amount', 'Сумма')}
                    />
                    <input
                      className="input"
                      maxLength={200}
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder={L('Izoh (chek raqami)', 'Note (receipt)', 'Комментарий (чек)')}
                      aria-label={L('Izoh', 'Note', 'Комментарий')}
                    />
                    <Button type="submit" size="sm" disabled={busyNow || !Number(amount)}>
                      {L('O‘tkazildi', 'Paid', 'Выплачено')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
          {o.status === 'cancel' && o.reason && (
            <p className="svc-note">
              ✖ {L('Sabab', 'Reason', 'Причина')}: {o.reason}
            </p>
          )}

          <Chat
            msgs={o.msgs}
            me="team"
            open={o.msgs.length > 0}
            send={
              o.status === 'cancel'
                ? undefined
                : async (text) => await act({ op: 'msg', text }, 'msg')
            }
          />

          <footer className="svc-order-actions">
            {o.status !== 'cancel' && o.status !== 'done' && (
              <Button
                size="sm"
                variant="outline"
                disabled={busyNow}
                onClick={() => {
                  const reason = window.prompt(
                    L('Bekor qilish sababi:', 'Reason for cancelling:', 'Причина отмены:'),
                  );
                  if (reason && reason.trim().length >= 3)
                    void act({ op: 'cancel', reason: reason.trim() }, 'cancel');
                }}
              >
                ✖ {L('Bekor qilish', 'Cancel', 'Отменить')}
              </Button>
            )}
            {!isActive(o.status) && (
              <Button
                size="sm"
                variant="outline"
                disabled={busyNow}
                onClick={() => {
                  if (
                    window.confirm(
                      L(
                        'Vazifa va fayllari butunlay o‘chirilsinmi?',
                        'Delete the task and its files for good?',
                        'Удалить задачу и её файлы навсегда?',
                      ),
                    )
                  )
                    void act({ op: 'remove' }, 'remove');
                }}
              >
                🗑 {L('O‘chirish', 'Delete', 'Удалить')}
              </Button>
            )}
          </footer>
        </div>
      )}
    </article>
  );
}

function Workers({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [busy, setBusy] = useState('');
  async function setStatus(w: WorkerProfile, status: 'active' | 'blocked') {
    if (
      status === 'blocked' &&
      !window.confirm(
        L(
          `${w.name} ijrochi hisobi to‘xtatilsinmi? U ariza bera olmaydi.`,
          `Suspend ${w.name}? They will not be able to apply.`,
          `Приостановить ${w.name}? Он не сможет откликаться.`,
        ),
      )
    )
      return;
    setBusy(w.uk);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'worker',
        wk: w.uk,
        status,
      });
      onView(r.admin);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  if (!view.workers.length)
    return (
      <p className="muted svc-empty">
        {L(
          'Hali ijrochi yo‘q. Talabalar «💸 Ishlab topish» bo‘limida ro‘yxatdan o‘tadi.',
          'No workers yet. Students sign up under “💸 Earn”.',
          'Исполнителей пока нет. Студенты регистрируются в разделе «💸 Заработать».',
        )}
      </p>
    );
  return (
    <ul className="mk-workers">
      {view.workers.map((w) => (
        <li key={w.uk} className={'panel' + (w.status === 'blocked' ? ' is-off' : '')}>
          <div className="mk-me">
            <span className="mk-avatar" aria-hidden="true">
              {w.name[0]}
            </span>
            <div>
              <b>{w.name}</b>
              <small className="muted">
                {w.group ? w.group + ' · ' : ''}
                {L('ro‘yxatdan o‘tgan', 'joined', 'с')} {dueText(w.at, lang).date}
              </small>
            </div>
            <span className={'bo-pill ' + (w.status === 'active' ? 'on' : 'off')}>
              {w.status === 'active'
                ? L('Faol', 'Active', 'Активен')
                : L('To‘xtatilgan', 'Suspended', 'Приостановлен')}
            </span>
          </div>
          <p className="muted">{w.skills.map((s) => kindTitle(lang, s)).join(' · ')}</p>
          <p className="svc-text">{w.about}</p>
          <p className="mk-pay-info">
            💳 {L('Pul o‘tkazish uchun', 'Payout details', 'Реквизиты')}: <b>{w.pay || '—'}</b>
          </p>
          <p className="svc-order-meta">
            <span>✅ {L(`${w.jobs} ta ish`, `${w.jobs} jobs`, `работ: ${w.jobs}`)}</span>
            <span>⭐ {w.rating ?? '—'}</span>
            <span>
              💸 {L('o‘tkazilgan', 'paid', 'выплачено')}: {formatSum(w.earned)}
            </span>
            {w.pending > 0 && (
              <span className="mk-owed">
                ⏳ {L('o‘tkazish kerak', 'owed', 'к выплате')}: {formatSum(w.pending)}
              </span>
            )}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy === w.uk}
            onClick={() => void setStatus(w, w.status === 'active' ? 'blocked' : 'active')}
          >
            {w.status === 'active'
              ? '⛔ ' + L('To‘xtatish', 'Suspend', 'Приостановить')
              : '✅ ' + L('Tiklash', 'Restore', 'Восстановить')}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Catalog({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { lang, request, toast } = useApp();
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      view.catalog.map((k) => [k.id, { price: k.price || '', days: k.days || '', off: !!k.off }]),
    ),
  );
  const [busy, setBusy] = useState('');
  async function save(kind: string) {
    setBusy(kind);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', {
        op: 'catalog',
        kind,
        ...rows[kind],
      });
      onView(r.admin);
      toast(L('Saqlandi.', 'Saved.', 'Сохранено.'));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <>
      <p className="muted">
        {L(
          'Odatdagi narx va muddat katalog kartasida va vazifa berish oynasida maslahat sifatida ko‘rinadi («50 000 so‘mdan», «2–3 kun»). Summani talabaning o‘zi yozadi. «Yopiq» yo‘nalish talabalarga ko‘rinmaydi.',
          'The usual price and timing appear on the card and as a hint in the task form (“from 50 000 so‘m”, “2–3 days”). Students set the amount themselves. “Closed” directions are hidden.',
          'Обычная цена и срок видны на карточке и как подсказка в форме задачи («от 50 000 сум», «2–3 дня»). Сумму студент пишет сам. «Закрыто» — направление скрыто.',
        )}
      </p>
      <ul className="svc-cat-admin">
        {view.catalog.map((k) => {
          const r = rows[k.id];
          return (
            <li key={k.id} className={r.off ? 'is-off' : ''}>
              <b>
                {k.icon} {tr(lang, ...k.name)}
                <small className="svc-cat-count">
                  👥 {k.used} · 🙋 {k.wants}
                </small>
              </b>
              <input
                className="input"
                maxLength={60}
                value={r.price}
                onChange={(e) => setRows({ ...rows, [k.id]: { ...r, price: e.target.value } })}
                placeholder={L('Narx (masalan 50 000 so‘mdan)', 'Price', 'Цена')}
                aria-label={L('Narx', 'Price', 'Цена') + ': ' + tr(lang, ...k.name)}
              />
              <input
                className="input"
                maxLength={40}
                value={r.days}
                onChange={(e) => setRows({ ...rows, [k.id]: { ...r, days: e.target.value } })}
                placeholder={L('Muddat (2–3 kun)', 'Timing', 'Срок')}
                aria-label={L('Muddat', 'Timing', 'Срок') + ': ' + tr(lang, ...k.name)}
              />
              <label className="svc-off">
                <input
                  type="checkbox"
                  checked={r.off}
                  onChange={(e) => setRows({ ...rows, [k.id]: { ...r, off: e.target.checked } })}
                />
                {L('Yopiq', 'Closed', 'Закрыто')}
              </label>
              <Button size="sm" disabled={!!busy} onClick={() => void save(k.id)}>
                {L('Saqlash', 'Save', 'Сохранить')}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Settings({
  view,
  onView,
}: {
  view: ServicesAdminView;
  onView: (v: ServicesAdminView) => void;
}) {
  const L = useL();
  const { request, toast } = useApp();
  const [how, setHow] = useState(view.how);
  const [fee, setFee] = useState(String(view.fee));
  const [busy, setBusy] = useState(false);
  async function save(input: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await servicesAct<{ admin: ServicesAdminView }>(request, 'admin', input);
      onView(r.admin);
      toast(L('Saqlandi.', 'Saved.', 'Сохранено.'));
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const feeN = Math.min(50, Math.max(0, Number(fee) || 0));
  return (
    <div className="svc-pay-admin">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ op: 'info', how: how.trim() });
        }}
      >
        <label>
          {L(
            'To‘lov yo‘riqnomasi (ijrochi tasdiqlangach buyurtmachiga ko‘rinadi)',
            'Payment instructions (shown to the client once a worker is approved)',
            'Инструкция по оплате (видна заказчику после утверждения исполнителя)',
          )}
          <textarea
            className="input"
            rows={5}
            maxLength={1500}
            value={how}
            onChange={(e) => setHow(e.target.value)}
            placeholder={L(
              'Masalan: Click yoki Payme orqali … kartaga o‘tkazing va «To‘lov qildim» tugmasini bosing.',
              'E.g. pay by Click or Payme to card … and press “I paid”.',
              'Например: переведите через Click или Payme на карту … и нажмите «Я оплатил».',
            )}
          />
        </label>
        <Button type="submit" disabled={busy}>
          {L('Saqlash', 'Save', 'Сохранить')}
        </Button>
      </form>
      <form
        className="mk-fee"
        onSubmit={(e) => {
          e.preventDefault();
          void save({ op: 'fee', fee: feeN });
        }}
      >
        <label>
          {L('Platforma ulushi (%)', 'Platform fee (%)', 'Комиссия платформы (%)')}
          <input
            className="input"
            type="number"
            min={0}
            max={50}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </label>
        <small className="muted">
          {L(
            `Masalan, buyurtmachi 100 000 so‘m to‘lasa, ijrochi ${formatSum(share(100000, feeN))} oladi. Ijrochilar e’londa «Siz olasiz» summasini ko‘radi.`,
            `E.g. if the client pays 100 000 so‘m, the worker gets ${formatSum(share(100000, feeN))}. Workers see the “You get” amount on the board.`,
            `Например, если заказчик платит 100 000 сум, исполнитель получит ${formatSum(share(100000, feeN))}. Исполнители видят сумму «Вы получите».`,
          )}
        </small>
        <Button type="submit" disabled={busy}>
          {L('Saqlash', 'Save', 'Сохранить')}
        </Button>
      </form>
      <small className="muted">
        {L(
          'Pul har doim administrator orqali o‘tadi: buyurtmachi sizga to‘laydi, ish qabul qilingach siz ijrochiga o‘tkazasiz va «O‘tkazildi» deb belgilaysiz. Play Market ilovasida bu bo‘lim ko‘rinmaydi (Google qoidasi) — vazifalar saytda beriladi.',
          'Money always goes through the administrator: the client pays you, and after acceptance you pay the worker and mark it “Paid”. This section is hidden in the Play Market app (Google rules) — tasks are posted on the website.',
          'Деньги всегда идут через администратора: заказчик платит вам, после приёмки вы переводите исполнителю и отмечаете «Выплачено». В приложении Play Market раздел скрыт (правила Google) — задачи даются на сайте.',
        )}
      </small>
    </div>
  );
}
