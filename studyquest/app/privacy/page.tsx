import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { legalLang, privacyDoc } from '@/lib/legal';
import { appInfo } from '@/lib/server/app-store';

/* 🔒 Maxfiylik siyosati — ochiq sahifa (Google Play talabi): kirmasdan ochiladi, ?lang=uz|ru|en. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Maxfiylik siyosati · Tadbirkorlik asoslari',
  description:
    'Tadbirkorlik asoslari platformasi qanday ma’lumot yig‘adi va uni qanday o‘chirish mumkin.',
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const lang = legalLang((await searchParams).lang);
  return <LegalPage doc={privacyDoc(lang, await appInfo())} lang={lang} path="/privacy" />;
}
