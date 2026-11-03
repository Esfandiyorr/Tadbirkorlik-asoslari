'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';
import { legacySessionToken } from '@/lib/legacy-session';
import type { Data, Lang, Actor } from '@/lib/types';
type Legacy = {
  id: string;
  name: string;
  surname: string;
  group?: string;
  learnerType?: string;
  status: string;
};
type Context = {
  data: Data | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  call: <T = any>(action: string, input: unknown) => Promise<T>;
  request: (url: string, init?: RequestInit) => Promise<Response>;
  toast: (s: string) => void;
  message: string;
  legacy: Legacy | null;
  login: boolean;
  setLogin: (v: boolean) => void;
  demoLogin: (role: string) => Promise<void>;
  logout: () => Promise<void>;
  useEmailMode: () => void;
};
const C = createContext<Context | null>(null);
export const useApp = () => useContext(C)!;
export function Provider({
  children,
  demoMode = false,
}: {
  children: ReactNode;
  demoMode?: boolean;
}) {
  const [data, setData] = useState<Data | null>(null),
    [lang, setLanguage] = useState<Lang>('uz'),
    [dark, setDarkness] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [legacy, setLegacy] = useState<Legacy | null>(null),
    [login, setLogin] = useState(false),
    [token, setToken] = useState(''),
    [preferLegacy, setPreferLegacy] = useState(false);
  const toast = useCallback((s: string) => {
    setMessage(s);
    setTimeout(() => setMessage(''), 4500);
  }, []);
  const receivedSession = useRef('');
  const refreshVersion = useRef(0);
  const request = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const h = new Headers(init.headers);
      const auth = demoMode ? null : firebaseAuth();
      let current = token,
        usingLegacy = false;
      let old: Legacy | null = null;
      try {
        old = demoMode ? null : JSON.parse(localStorage.getItem('terdu_student') || 'null');
      } catch {}
      if (!demoMode && preferLegacy && old && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        current = await legacySessionToken(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
        usingLegacy = true;
      } else if (auth?.currentUser) current = await auth.currentUser.getIdToken();
      if (current) {
        h.set('Authorization', 'Bearer ' + current);
        if (old && usingLegacy) h.set('X-Legacy-Student', old.id);
      }
      return fetch(url, { ...init, headers: h, cache: 'no-store' });
    },
    [token, demoMode, preferLegacy],
  );
  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current;
    try {
      const staffView = /^#(?:admin|teacher)(?:\/|$)/.test(location.hash);
      const r = await request('/api/platform' + (staffView ? '?view=staff' : ''));
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (version !== refreshVersion.current) return;
      setData(d);
      setError('');
    } catch (e) {
      if (version !== refreshVersion.current) return;
      // A revoked or expired saved session must not hide the sign-in screen.
      // Load only public data; keep the account and its academic records intact.
      try {
        const publicResponse = await fetch('/api/platform', { cache: 'no-store' });
        const publicData = publicResponse.ok ? await publicResponse.json() : null;
        if (version !== refreshVersion.current) return;
        if (publicData) {
          setData(publicData);
          setLegacy(null);
        }
      } catch {}
      if (version !== refreshVersion.current) return;
      setError(e instanceof Error ? e.message : 'Ulanishda xatolik');
    } finally {
      if (version === refreshVersion.current) setLoading(false);
    }
  }, [request]);
  const call = useCallback(
    async <T,>(action: string, input: unknown) => {
      const r = await request('/api/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, input }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      if (['slide', 'beginLesson'].includes(action) && v.progress) {
        setData((d) =>
          d
            ? {
                ...d,
                progress: [...(d.progress || []).filter((p) => p.id !== v.progress.id), v.progress],
              }
            : d,
        );
      } else if (!['getLesson', 'enroll', 'beginQuiz'].includes(action)) await refresh();
      return v as T;
    },
    [refresh, request],
  );
  useEffect(() => {
    try {
      setLanguage((localStorage.getItem('sq-lang') as Lang) || 'uz');
      setDarkness(localStorage.getItem('sq-theme') === 'dark');
      const s = JSON.parse(localStorage.getItem('terdu_student') || 'null');
      if (s) {
        setPreferLegacy(localStorage.getItem('sq-session-mode') !== 'email');
        setLegacy({
          id: s.id,
          name: s.name,
          surname: s.surname,
          group: s.group,
          learnerType: s.learnerType,
          status: s.status,
        });
      }
    } catch {}
    const a = demoMode ? null : firebaseAuth();
    if (a)
      return onAuthStateChanged(a, (u) => {
        if (u)
          u.getIdToken()
            .then(setToken)
            .catch(() => setToken(''));
        else setToken('');
      });
  }, []);
  useEffect(() => {
    void refresh();
    let previous = location.hash;
    const enterStaff = () => {
      const next = location.hash;
      if (
        /^#(?:admin|teacher)(?:\/|$)/.test(next) ||
        (previous.startsWith('#lesson/') && !next.startsWith('#lesson/'))
      )
        void refresh();
      previous = next;
    };
    window.addEventListener('hashchange', enterStaff);
    return () => window.removeEventListener('hashchange', enterStaff);
  }, [refresh]);
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.data?.source !== 'studyquest-legacy' ||
        e.data.type !== 'session'
      )
        return;
      const frames = document.querySelectorAll<HTMLIFrameElement>('#legacy-login, #student-login');
      if (!Array.from(frames).some((frame) => e.source === frame.contentWindow)) return;
      const s = e.data.student as Legacy | null;
      if (s && (s.status === 'ok' || s.learnerType === 'independent')) {
        const identity = JSON.stringify(s) + localStorage.getItem('terdu_sa');
        if (receivedSession.current === identity) return;
        receivedSession.current = identity;
        setLegacy(s);
        setPreferLegacy(true);
        localStorage.setItem('sq-session-mode', 'legacy');
        void refresh();
      }
    };
    window.addEventListener('message', f);
    return () => window.removeEventListener('message', f);
  }, [refresh]);
  useEffect(() => {
    // Stored names alone are not proof of a successful sign-in.
    // Keep the form open until the server accepts the account and ownership token.
    if (!data?.user) return;
    if (preferLegacy && (!legacy || data.user.id !== 'legacy_' + legacy.id)) return;
    setLogin(false);
    if (location.hash === '#login') location.hash = 'home';
  }, [data, preferLegacy, legacy]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('dark', dark);
  }, [lang, dark]);
  const setLang = (l: Lang) => {
    setLanguage(l);
    localStorage.setItem('sq-lang', l);
  };
  const setDark = (v: boolean) => {
    setDarkness(v);
    localStorage.setItem('sq-theme', v ? 'dark' : 'light');
  };
  const demoLogin = async (role: string) => {
    const r = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'demo-' + role }),
    });
    if (!r.ok) throw new Error('Demo kirish mavjud emas');
    await refresh();
  };
  const useEmailMode = () => {
    receivedSession.current = '';
    setPreferLegacy(false);
    setLegacy(null);
    localStorage.removeItem('terdu_student');
    localStorage.removeItem('terdu_sa');
    localStorage.setItem('sq-session-mode', 'email');
  };
  const showLogin = (v: boolean) => {
    if (v) {
      setPreferLegacy(true);
      localStorage.setItem('sq-session-mode', 'legacy');
    }
    setLogin(v);
  };
  const logout = async () => {
    receivedSession.current = '';
    const a = demoMode ? null : firebaseAuth();
    if (a?.currentUser) await signOut(a);
    await fetch('/api/auth/demo', { method: 'DELETE' });
    if (!demoMode) {
      localStorage.removeItem('terdu_student');
      localStorage.removeItem('terdu_sa');
    }
    setLegacy(null);
    setToken('');
    const r = await fetch('/api/platform', { cache: 'no-store' });
    if (r.ok) setData(await r.json());
  };
  return (
    <C.Provider
      value={{
        data,
        lang,
        setLang,
        dark,
        setDark,
        loading,
        error,
        refresh,
        call,
        request,
        toast,
        message,
        legacy,
        login,
        setLogin: showLogin,
        demoLogin,
        logout,
        useEmailMode,
      }}
    >
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
      {login && (
        <div className="modal-backdrop">
          <div className="legacy-modal">
            <button aria-label="Close" className="close-modal" onClick={() => setLogin(false)}>
              ×
            </button>
            <iframe
              id="legacy-login"
              title="TerDU account login"
              src="/legacy/index.html?studyquest=login&sqEmbed=login"
            />
          </div>
        </div>
      )}
    </C.Provider>
  );
}
