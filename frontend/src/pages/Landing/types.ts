import type { ReactNode } from 'react';
import type { AudienceItem } from './AudienceCards/audienceData';

// ─────────────────────────────────────────────────────────────────────────────
// Animation Types
// ─────────────────────────────────────────────────────────────────────────────

// Import as values to access namespace types (gsap.core.Timeline, ScrollTrigger.Vars)
// These are only used in type definitions, but TypeScript requires value imports
// to access namespace properties in types. The unused variable warnings are
// suppressed because the imports are used in type positions below.

// @ts-expect-error TS6133: gsap is used in type definition (gsap.core.Timeline)
import type { gsap } from 'gsap';

// @ts-expect-error TS6133: ScrollTrigger is used in type definition (ScrollTrigger.Vars)
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export type AnimationContextValue = {
  masterTimeline: gsap.core.Timeline | undefined;
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
// Re-export AudienceItem for convenience
// ─────────────────────────────────────────────────────────────────────────────

export type { AudienceItem };
