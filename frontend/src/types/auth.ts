import type { EventUserRole } from './enums';

/** Social links structure stored as JSON */
export interface SocialLinks {
  linkedin?: string | null;
  twitter?: string | null;
  github?: string | null;
  website?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  other?: string | null;
}

/** Privacy settings stored as JSON on user */
export interface PrivacySettings {
  email_visibility: 'event_attendees' | 'connections_organizers' | 'organizers_only';
  show_public_email: boolean;
  public_email: string | null;
  allow_connection_requests: 'event_attendees' | 'speakers_organizers' | 'none';
  show_social_links: 'event_attendees' | 'connections' | 'hidden';
  show_company: boolean;
  show_bio: boolean;
}

/** Core user model returned by API */
export interface User {
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
}

/** User with nested organization/event data */
export interface UserDetail extends User {
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
}

/** Basic user info for nested responses */
export interface UserBasic {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

/** User with role info */
export interface UserWithRole {
  id: number;
  full_name: string;
  email: string;
  role: EventUserRole;
}

/** User profile update payload */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  company_name?: string | null;
  title?: string | null;
  bio?: string | null;
  image_url?: string | null;
  social_links?: Partial<SocialLinks>;
}

/** Login credentials */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Signup data */
export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  title?: string;
}

/** Password change payload */
export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

/** Password reset payload */
export interface PasswordResetData {
  token: string;
  password: string;
}
