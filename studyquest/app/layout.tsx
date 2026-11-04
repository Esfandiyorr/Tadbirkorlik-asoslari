import type { Metadata, Viewport } from 'next';
import { Provider } from '@/components/provider';
import './globals.css';
import './platform.css';
export const metadata: Metadata = {
  title: 'Tadbirkorlik asoslari',
  description: 'Tadbirkorlik asoslarini o‘rganing, bilimni mustahkamlang va yutuqlarga erishing.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tadbirkorlik asoslari' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
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
