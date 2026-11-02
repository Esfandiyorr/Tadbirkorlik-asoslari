'use client';
import { useEffect, useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './provider';
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallApp({
  prompt,
  onInstalled,
}: {
  prompt: InstallPrompt | null;
  onInstalled: () => void;
}) {
  const { lang, toast } = useApp(),
    [installed, setInstalled] = useState(false),
    [ios, setIos] = useState(false);
  useEffect(() => {
    const update = () =>
      setInstalled(
        matchMedia('(display-mode: standalone)').matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    update();
    setIos(
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
    window.addEventListener('appinstalled', update);
    return () => window.removeEventListener('appinstalled', update);
  }, []);
  async function install() {
    if (!prompt) {
      toast(
        ios ? 'Safari → Ulashish → Bosh ekranga qo‘shish' : 'Brauzer menyusi → Ilovani o‘rnatish',
      );
      return;
    }
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
      onInstalled();
    }
  }
  return (
    <section className="install-page panel">
      <img src="/icon-192.png" width={88} height={88} alt="Tadbirkorlik asoslari" />
      <span className="eyebrow">TERDU</span>
      <h1>
        {lang === 'uz'
          ? 'Tadbirkorlik asoslari ilovasi'
          : lang === 'en'
            ? 'Tadbirkorlik asoslari app'
            : 'Приложение Tadbirkorlik asoslari'}
      </h1>
      <p>
        {lang === 'uz'
          ? 'Darslar, akademik ballar va o‘yin maydoni — telefoningiz bosh ekranida.'
          : 'Lessons, academic scores and the game arena on your home screen.'}
      </p>
      <Button onClick={install} disabled={installed}>
        {installed ? <Check size={18} /> : <Download size={18} />}{' '}
        {installed
          ? lang === 'uz'
            ? 'Ilova o‘rnatilgan'
            : 'App installed'
          : lang === 'uz'
            ? 'Ilovani o‘rnatish'
            : 'Install app'}
      </Button>
      <div className="install-instructions">
        <Smartphone size={26} />
        <h2>{ios ? 'iPhone / iPad' : 'Android / kompyuter'}</h2>
        <p>
          {ios
            ? 'Safari brauzerida Ulashish tugmasi → Bosh ekranga qo‘shish → Qo‘shish.'
            : 'Chrome yoki Edge menyusidan “Ilovani o‘rnatish” yoki “Bosh ekranga qo‘shish” ni tanlang.'}
        </p>
        <p className="muted">
          {lang === 'uz'
            ? 'Mavjud hisobingiz va ballaringiz saqlanadi. Darslar, reyting va musobaqalar uchun internet kerak.'
            : 'Your existing account and points are preserved. Lessons, rankings and competitions require an internet connection.'}
        </p>
      </div>
    </section>
  );
}
