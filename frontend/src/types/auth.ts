/**
 * Authentication and user-related types
 *
 * Convention: Properties use `| null` for values that may not exist in the database.
 * Optional parameters (`?:`) are only used for function/API params that can be omitted.
 */

import type { EventUserRole } from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// Social & Privacy
// ─────────────────────────────────────────────────────────────────────────────

/** Social links stored as JSON - all fields nullable */
export type SocialLinks = {
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  website: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  facebook: string | null;
  other: string | null;
};

/** Empty social links for initialization */
export const EMPTY_SOCIAL_LINKS: SocialLinks = {
  linkedin: null,
  twitter: null,
  github: null,
  website: null,
  youtube: null,
  tiktok: null,
  instagram: null,
  facebook: null,
  other: null,
} as const;

/** Privacy settings stored as JSON on user */
export type PrivacySettings = {
  email_visibility: 'event_attendees' | 'connections_organizers' | 'organizers_only';
  show_public_email: boolean;
  public_email: string | null;
  allow_connection_requests: 'event_attendees' | 'speakers_organizers' | 'none';
  show_social_links: 'event_attendees' | 'connections' | 'hidden';
  show_company: boolean;
  show_bio: boolean;
};

/** Default privacy settings */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  email_visibility: 'connections_organizers',
  show_public_email: false,
  public_email: null,
  allow_connection_requests: 'event_attendees',
  show_social_links: 'connections',
  show_company: true,
  show_bio: true,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

/** Core user model returned by API */
export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string; // Computed property
  company_name: string | null;
  title: string | null;
  bio: string | null;
  image_url: string | null;
  social_links: SocialLinks;
  privacy_settings: PrivacySettings;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string | null;
};

/** User with nested organization/event data */
export type UserDetail = User & {
  organizations: Array<{
    id: number;
    name: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    start_date: string | null;
  }>;
  speaking_sessions: Array<{
    id: number;
    title: string;
  }>;
};

/** Privacy-aware user */
export type PrivacyAwareUser = {
  // Always visible fields
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;

  // Conditionally visible fields (may be null based on privacy)
  email: string | null;
  company_name: string | null;
  title: string | null;
  bio: string | null;
  social_links: SocialLinks;

  // Privacy control fields
  allow_connection_requests: string | null;
  can_send_connection_request: boolean | null;
  is_connected: boolean | null;

  // Event-specific fields (only included when event context present)
  event_role: string | null;
  speaker_bio: string | null;
  speaker_title: string | null;

  // Privacy settings (only for self)
  privacy_settings: PrivacySettings | null;

  // Account info (only for self)
  created_at: string | null;
  is_active: boolean | null;
  email_verified: boolean | null;
};

/** Basic user info for nested responses */
export type UserBasic = Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;

/** User with role info */
export type UserWithRole = {
  id: number;
  full_name: string;
  email: string;
  role: EventUserRole;
};

// ─────────────────────────────────────────────────────────────────────────────
// API Payloads
// ─────────────────────────────────────────────────────────────────────────────

/** User profile update payload - optional fields can be omitted */
export type UserProfileUpdate = {
  first_name?: string;
  last_name?: string;
  company_name?: string | null;
  title?: string | null;
  bio?: string | null;
  image_url?: string | null;
  social_links?: Partial<SocialLinks>;
};

/** Login credentials */
export type LoginCredentials = {
  email: string;
  password: string;
};

/** Signup data - optional fields can be omitted */
export type SignupData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  title?: string;
};

/** Password change payload */
export type PasswordChangeData = {
  current_password: string;
  new_password: string;
};

/** Password reset payload */
export type PasswordResetData = {
  token: string;
  password: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/** Check if user has a specific role */
export function hasRole(user: UserWithRole, role: EventUserRole): boolean {
  return user.role === role;
}

/** Check if user is admin or organizer */
export function isAdminOrOrganizer(user: UserWithRole): boolean {
  return user.role === 'ADMIN' || user.role === 'ORGANIZER';
}

/** Check if user can manage event (admin, organizer, or moderator) */
export function canManageEvent(user: UserWithRole): boolean {
  return ['ADMIN', 'ORGANIZER', 'MODERATOR'].includes(user.role);
}
