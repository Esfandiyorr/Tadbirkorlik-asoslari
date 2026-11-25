import type { Metadata } from 'next';
import { RaceGame } from '@/components/race-game';
import '../race.css';

/* 🏁 Jamoaviy poyga — ochiq sahifa: talabalar havola orqali kirmasdan ham o'ynaydi (components/race-game.tsx). */
export const metadata: Metadata = {
  title: 'Jamoaviy poyga · Unistay',
  description:
    '1–10-mavzulardan aralash savollar: ikki jamoa, ikki mashina — eng tez javob bergan jamoa yutadi.',
};
export default function Page() {
  return <RaceGame />;
}
