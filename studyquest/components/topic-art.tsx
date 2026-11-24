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
  ConciergeBell,
  SprayCan,
  UtensilsCrossed,
  Languages,
  Salad,
  Globe,
  ClipboardList,
  CreditCard,
  MessageCircleHeart,
  Clock,
  GraduationCap,
  Trophy,
} from 'lucide-react';
import { SiteVisual } from './site-content';
import { visualPath } from '@/lib/site-visuals';

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
  // 🍽️ Restoran xodimlari malakasini oshirish (RS 24)
  r1: { icon: ConciergeBell, from: '#9a3412', to: '#f59e0b', emoji: ['🤵', '👋'] },
  r2: { icon: SprayCan, from: '#0f766e', to: '#34d399', emoji: ['🧼', '⚠️'] },
  r3: { icon: UtensilsCrossed, from: '#7c2d12', to: '#fb7185', emoji: ['🍽️', '🥂'] },
  r4: { icon: Languages, from: '#1d4ed8', to: '#38bdf8', emoji: ['🌍', '💬'] },
  r5: { icon: Salad, from: '#15803d', to: '#a3e635', emoji: ['🥜', '📋'] },
  r6: { icon: Globe, from: '#6d28d9', to: '#f472b6', emoji: ['🏅', '🍱'] },
  r7: { icon: ClipboardList, from: '#b45309', to: '#fbbf24', emoji: ['🧾', '👨‍🍳'] },
  r8: { icon: CreditCard, from: '#0369a1', to: '#22d3ee', emoji: ['☕', '💳'] },
  r9: { icon: MessageCircleHeart, from: '#be123c', to: '#fb923c', emoji: ['🙏', '♿'] },
  r10: { icon: Clock, from: '#4338ca', to: '#10b981', emoji: ['🔁', '⭐'] },
  r11: { icon: GraduationCap, from: '#1e3a8a', to: '#7c3aed', emoji: ['📝', '🎓'] },
  r12: { icon: Trophy, from: '#9d174d', to: '#f59e0b', emoji: ['🏆', '🍽️'] },
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
      <SiteVisual
        className="topic-art-icon"
        imageKey={visualPath('topics', id + '-icon')}
        icon={t.emoji[0]}
      >
        <Icon size={compact ? 26 : 38} strokeWidth={1.9} />
      </SiteVisual>
      {t.emoji.map((icon, index) => (
        <SiteVisual
          key={index}
          className={'topic-art-emoji ' + (index ? 'b' : 'a')}
          imageKey={visualPath('topics', id + '-' + (index + 1))}
          icon={icon}
        />
      ))}
      {number !== undefined && (
        <span className="topic-art-number">{String(number).padStart(2, '0')}</span>
      )}
    </div>
  );
}

/* Fan (kurs) rasmi: platforma (Unistay) belgisi va tadbirkorlik belgilari bilan ajralib turadi. */
export function CourseArt({ title, kind }: { title: string; kind?: string }) {
  // «service» — restoran xizmati kursi: o'z rangi va belgilari bilan.
  const service = kind === 'service',
    emoji = service ? ['🤵', '🥗', '☕', '🧾'] : ['🚀', '💡', '📈', '💼'];
  return (
    <div className={'course-hero-art' + (service ? ' is-service' : '')} aria-hidden="true">
      <span className="course-hero-glow" />
      {service ? (
        <SiteVisual
          className="course-hero-logo course-hero-mark"
          imageKey={visualPath('courses', 'restaurant-logo')}
          icon="🍽️"
        />
      ) : (
        <img src="/unistay-logo.svg" alt="" className="course-hero-logo" width="64" height="64" />
      )}
      {emoji.map((e, i) => (
        <SiteVisual
          className={'course-hero-emoji e' + (i + 1)}
          key={e}
          imageKey={visualPath('courses', (service ? 'restaurant-' : 'business-') + (i + 1))}
          icon={e}
        />
      ))}
      <b className="course-hero-title">{title}</b>
    </div>
  );
}
