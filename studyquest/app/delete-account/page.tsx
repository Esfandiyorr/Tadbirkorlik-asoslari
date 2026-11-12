import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { deleteDoc, legalLang } from '@/lib/legal';
import { appInfo } from '@/lib/server/app-store';

/* 🗑 Hisobni o'chirish yo'riqnomasi — ochiq sahifa (Google Play talabi): kirmasdan ochiladi, ?lang=uz|ru|en. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Hisobni o‘chirish · Tadbirkorlik asoslari',
  description:
    'Tadbirkorlik asoslari platformasidagi hisob va ma’lumotlarni qanday o‘chirish mumkin.',
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const lang = legalLang((await searchParams).lang);
  return <LegalPage doc={deleteDoc(lang, await appInfo())} lang={lang} path="/delete-account" />;
}
