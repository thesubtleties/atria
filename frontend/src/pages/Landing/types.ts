import type { ReactNode } from 'react';
import type { AudienceItem } from './AudienceCards/audienceData';

// ─────────────────────────────────────────────────────────────────────────────
// Animation Types
// ─────────────────────────────────────────────────────────────────────────────

// Note: GSAPTimeline and ScrollTrigger.Vars are global types defined by GSAP

export type AnimationContextValue = {
  masterTimeline: GSAPTimeline | undefined;
  registerSection: (name: string, ref: HTMLElement | null) => void;
  animationState: {
    currentSection: number;
    isTransitioning: boolean;
    sectionProgress: Record<string, number>;
  };
};

export type ScrollTriggerConfig = ScrollTrigger.Vars;

// ─────────────────────────────────────────────────────────────────────────────
// Network Graph Types
// ─────────────────────────────────────────────────────────────────────────────

export type NetworkNode = {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  icon: string;
  textFill?: string;
  fontSize?: number;
};

export type NetworkConnection = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Prop Types
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPosition = 'left' | 'right';

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type DemoCard = {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon?: ReactNode;
};

export type ModalType = 'login' | 'signup' | 'forgotPassword' | null;

// ─────────────────────────────────────────────────────────────────────────────
// Section Wrapper Types
// ─────────────────────────────────────────────────────────────────────────────

export type BackgroundVariant = 'default' | 'light' | 'dark' | 'gradient';
export type PaddingSize = 'small' | 'normal' | 'large' | 'none';
export type OverflowType = 'hidden' | 'visible' | 'auto';

// ─────────────────────────────────────────────────────────────────────────────
// Stats Types
// ─────────────────────────────────────────────────────────────────────────────

export type StatsObject = Record<string, number>;

// ─────────────────────────────────────────────────────────────────────────────
// Platform Demo Types
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformDemoCard = {
  id: string;
  title: string;
  subtitle: string;
  Component: React.ComponentType<{ isFirefox: boolean }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Panel Types (OpenSourceSplit)
// ─────────────────────────────────────────────────────────────────────────────

export type PanelType = 'intro' | 'opensource' | 'enterprise' | 'philosophy';
export type CtaIconType = 'github' | 'calendar';

export type Panel = {
  id: string;
  type: PanelType;
  title: string;
  subtitle?: string;
  description?: string;
  gradient?: string;
  cta?: string;
  ctaIcon?: CtaIconType;
  quote?: string;
  content?: string;
  footer?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Event Types
// ─────────────────────────────────────────────────────────────────────────────

export type CardActiveEventDetail = { index: number };
export type CardActiveEvent = CustomEvent<CardActiveEventDetail>;

// ─────────────────────────────────────────────────────────────────────────────
// Re-export AudienceItem for convenience
// ─────────────────────────────────────────────────────────────────────────────

export type { AudienceItem };
