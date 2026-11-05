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
        ios
          ? lang === 'uz'
            ? 'Safari → Ulashish → Bosh ekranga qo‘shish'
            : lang === 'ru'
              ? 'Safari → Поделиться → На экран «Домой»'
              : 'Safari → Share → Add to Home Screen'
          : lang === 'uz'
            ? 'Brauzer menyusi → Ilovani o‘rnatish'
            : lang === 'ru'
              ? 'Меню браузера → Установить приложение'
              : 'Browser menu → Install app',
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
          : lang === 'ru'
            ? 'Уроки, учебные баллы и игровая арена — на главном экране телефона.'
            : 'Lessons, academic scores and the game arena on your home screen.'}
      </p>
      <Button onClick={install} disabled={installed}>
        {installed ? <Check size={18} /> : <Download size={18} />}{' '}
        {installed
          ? lang === 'uz'
            ? 'Ilova o‘rnatilgan'
            : lang === 'ru'
              ? 'Приложение установлено'
              : 'App installed'
          : lang === 'uz'
            ? 'Ilovani o‘rnatish'
            : lang === 'ru'
              ? 'Установить приложение'
              : 'Install app'}
      </Button>
      <div className="install-instructions">
        <Smartphone size={26} />
        <h2>
          {ios
            ? 'iPhone / iPad'
            : lang === 'uz'
              ? 'Android / kompyuter'
              : lang === 'ru'
                ? 'Android / компьютер'
                : 'Android / computer'}
        </h2>
        <p>
          {ios
            ? lang === 'uz'
              ? 'Safari brauzerida Ulashish tugmasi → Bosh ekranga qo‘shish → Qo‘shish.'
              : lang === 'ru'
                ? 'В Safari: Поделиться → На экран «Домой» → Добавить.'
                : 'In Safari: Share → Add to Home Screen → Add.'
            : lang === 'uz'
              ? 'Chrome yoki Edge menyusidan “Ilovani o‘rnatish” yoki “Bosh ekranga qo‘shish” ni tanlang.'
              : lang === 'ru'
                ? 'В меню Chrome или Edge выберите «Установить приложение» или «Добавить на главный экран».'
                : 'In the Chrome or Edge menu choose “Install app” or “Add to Home screen”.'}
        </p>
        <p className="muted">
          {lang === 'uz'
            ? 'Mavjud hisobingiz va ballaringiz saqlanadi. Darslar, reyting va musobaqalar uchun internet kerak.'
            : lang === 'ru'
              ? 'Ваш аккаунт и баллы сохраняются. Для уроков, рейтинга и соревнований нужен интернет.'
              : 'Your existing account and points are preserved. Lessons, rankings and competitions require an internet connection.'}
        </p>
      </div>
    </section>
  );
}
