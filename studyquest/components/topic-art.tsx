'use client';
import {
  Lightbulb,
  MessageCircleQuestion,
  FlaskConical,
  Landmark,
  Calculator,
  LayoutGrid,
  HeartHandshake,
  Megaphone,
  Presentation,
  ShoppingCart,
  Tag,
  Wallet,
  ChartLine,
  Ship,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

/* Har mavzuning o'z rangi, belgisi va ikkita «jonli» emojisi — kartochka va dars sarlavhasida ishlatiladi. */
export const topicThemes: Record<
  string,
  { icon: typeof BookOpen; from: string; to: string; emoji: [string, string] }
> = {
  m1: { icon: Lightbulb, from: '#7c3aed', to: '#db2777', emoji: ['💡', '🚀'] },
  m2: { icon: MessageCircleQuestion, from: '#0e7490', to: '#22c3e6', emoji: ['🧑‍🤝‍🧑', '❓'] },
  m3: { icon: FlaskConical, from: '#15803d', to: '#65c23a', emoji: ['🧪', '💰'] },
  m4: { icon: Landmark, from: '#1d4ed8', to: '#4f9cf9', emoji: ['📜', '✅'] },
  m5: { icon: Calculator, from: '#c2410c', to: '#f5a524', emoji: ['🧾', '🧮'] },
  m6: { icon: LayoutGrid, from: '#7e22ce', to: '#5b6cf0', emoji: ['🧩', '📊'] },
  m7: { icon: HeartHandshake, from: '#be185d', to: '#f06aa8', emoji: ['🤝', '💬'] },
  m8: { icon: Megaphone, from: '#ea580c', to: '#f2b705', emoji: ['📣', '🚚'] },
  m9: { icon: Presentation, from: '#0f766e', to: '#2cc6b0', emoji: ['🎤', '🌟'] },
  m10: { icon: ShoppingCart, from: '#1e40af', to: '#08a5c8', emoji: ['🛒', '🤝'] },
  m11: { icon: Tag, from: '#a21caf', to: '#ec6aa8', emoji: ['🏷️', '💵'] },
  m12: { icon: Wallet, from: '#047857', to: '#21b884', emoji: ['💸', '🏦'] },
  m13: { icon: ChartLine, from: '#b91c1c', to: '#f2792b', emoji: ['📈', '📉'] },
  m14: { icon: Ship, from: '#0369a1', to: '#6d4bd8', emoji: ['🗺️', '🚢'] },
  m15: { icon: ShieldCheck, from: '#4338ca', to: '#14a89a', emoji: ['👥', '🛡️'] },
};
export const themeOf = (id: string) =>
  topicThemes[id] || {
    icon: BookOpen,
    from: '#6d28d9',
    to: '#2563eb',
    emoji: ['📘', '✨'] as [string, string],
  };

export function TopicArt({
  id,
  number,
  compact = false,
}: {
  id: string;
  number?: number;
  compact?: boolean;
}) {
  const t = themeOf(id),
    Icon = t.icon;
  return (
    <div
      className={'topic-art' + (compact ? ' compact' : '')}
      style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
      aria-hidden="true"
    >
      <span className="topic-art-orb one" />
      <span className="topic-art-orb two" />
      <span className="topic-art-icon">
        <Icon size={compact ? 26 : 38} strokeWidth={1.9} />
      </span>
      <span className="topic-art-emoji a">{t.emoji[0]}</span>
      <span className="topic-art-emoji b">{t.emoji[1]}</span>
      {number !== undefined && (
        <span className="topic-art-number">{String(number).padStart(2, '0')}</span>
      )}
    </div>
  );
}

/* Fan (kurs) rasmi: TerDU gerbi va tadbirkorlik belgilari bilan ajralib turadi. */
export function CourseArt({ title }: { title: string }) {
  return (
    <div className="course-hero-art" aria-hidden="true">
      <span className="course-hero-glow" />
      <img src="/terdu-logo.png" alt="" className="course-hero-logo" width="64" height="64" />
      <span className="course-hero-emoji e1">🚀</span>
      <span className="course-hero-emoji e2">💡</span>
      <span className="course-hero-emoji e3">📈</span>
      <span className="course-hero-emoji e4">💼</span>
      <b className="course-hero-title">{title}</b>
    </div>
  );
}
