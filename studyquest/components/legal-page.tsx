import type { LegalDoc, LegalLang } from '@/lib/legal';
import { APP_NAME, LEGAL_LANGS } from '@/lib/legal';

/* 📄 Ochiq huquqiy sahifa ko'rinishi (/privacy, /delete-account) — serverda chiziladi, kirish talab qilinmaydi. */
const LANG_NAME: Record<LegalLang, string> = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };
const OTHER: Record<LegalLang, { privacy: string; del: string; home: string }> = {
  uz: { privacy: 'Maxfiylik siyosati', del: 'Hisobni o‘chirish', home: 'Platformaga o‘tish' },
  ru: {
    privacy: 'Политика конфиденциальности',
    del: 'Удаление аккаунта',
    home: 'Открыть платформу',
  },
  en: { privacy: 'Privacy Policy', del: 'Delete account', home: 'Open the platform' },
};

export function LegalPage({
  doc,
  lang,
  path,
}: {
  doc: LegalDoc;
  lang: LegalLang;
  path: '/privacy' | '/delete-account';
}) {
  const o = OTHER[lang];
  return (
    <main className="legal" lang={lang}>
      <header className="legal-top">
        <a className="legal-brand" href="/">
          <img src="/terdu-logo.png" alt="" width={40} height={40} />
          <b>{APP_NAME}</b>
        </a>
        <nav className="legal-langs" aria-label="Til / Язык / Language">
          {LEGAL_LANGS.map((l) => (
            <a key={l} href={path + '?lang=' + l} aria-current={l === lang ? 'page' : undefined}>
              {LANG_NAME[l]}
            </a>
          ))}
        </nav>
      </header>
      <article className="legal-doc">
        <h1>{doc.title}</h1>
        <p className="legal-lead">{doc.lead}</p>
        <small className="legal-date">{doc.updated}</small>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.ul && (
              <ul>
                {s.ul.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
            {s.note?.map((p, i) => (
              <p key={'n' + i}>{p}</p>
            ))}
          </section>
        ))}
      </article>
      <footer className="legal-foot">
        <a href={(path === '/privacy' ? '/delete-account' : '/privacy') + '?lang=' + lang}>
          {path === '/privacy' ? o.del : o.privacy}
        </a>
        <a href="/">{o.home} →</a>
      </footer>
    </main>
  );
}
