import type { Metadata, Viewport } from 'next';
import { Provider } from '@/components/provider';
import './globals.css';
import './platform.css';
import './learning-ux.css';
import './unistay-ui.css';
import './auth-login.css';
export const metadata: Metadata = {
  title: 'Unistay',
  description:
    'Unistay — talabalar platformasi: kurslar, jonli test va o‘yinlar, talabalar bir-biriga xizmat ko‘rsatib pul ishlaydigan bozor.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Unistay' },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#7c3aed' };
export default function Layout({ children }: { children: React.ReactNode }) {
  const demoMode =
    process.env.STUDYQUEST_DEMO === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    !process.env.VERCEL;
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <Provider demoMode={demoMode}>{children}</Provider>
      </body>
    </html>
  );
}
