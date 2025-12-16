/**
 * Event-related types
 */

import type {
  EventType,
  EventStatus,
  EventFormat,
  EventUserRole,
  USState,
  SessionType,
  SessionStatus,
  SessionSpeakerRole,
  SessionChatMode,
  StreamingPlatform,
} from './enums';
import type { UserWithRole, SocialLinks } from './auth';
import type { Patch } from './utils';

/** Event branding stored as JSON */
export interface EventBranding {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  banner_url: string | null;
}

/** Hero images structure */
export interface HeroImages {
  desktop: string | null;
  mobile: string | null;
}

/** Welcome section in event sections */
export interface WelcomeSection {
  title: string | null;
  content: string | null;
}

/** Highlight item in event sections */
export interface EventHighlight {
  title: string;
  description: string;
  icon: string | null;
}

/** FAQ item in event sections */
export interface EventFAQ {
  question: string;
  answer: string;
}

/** Event sections JSON structure */
export interface EventSections {
  welcome: WelcomeSection;
  highlights: EventHighlight[];
  faqs: EventFAQ[];
}

/** Sponsor tier configuration stored on event */
export interface SponsorTier {
  id: string;
  name: string;
  order: number;
  color: string;
}

/** Core event model */
export interface Event {
  id: number;
  organization_id: number;
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string; // Date as ISO string
  end_date: string;
  timezone: string;
  company_name: string;
  slug: string;
  status: EventStatus;
  branding: EventBranding;
  hero_description: string | null;
  hero_images: HeroImages | null;
  event_format: EventFormat;
  is_private: boolean;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: USState | null;
  venue_country: string | null;
  sections: EventSections | null;
  icebreakers: string[];
  sponsor_tiers: SponsorTier[];
  main_session_id: number | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  // Computed properties from schema
  is_published: boolean;
  is_upcoming: boolean;
  is_ongoing: boolean;
  is_past: boolean;
  day_count: number;
  first_session_time: string | null;
  last_session_time: string | null;
  event_hours: { start: string; end: string } | null;
  user_role?: EventUserRole; // Current user's role if authenticated
}

/** Detailed event with relationships */
export interface EventDetail extends Event {
  sponsors_count: number;
  organization: {
    id: number;
    name: string;
  };
  sessions: SessionSummary[];
  organizers: UserWithRole[];
  speakers: Array<{
    id: number;
    full_name: string;
    title: string | null;
    company_name: string | null;
  }>;
  main_session: SessionMinimal | null;
}

/** Nested event for other schemas - derived from Event */
export type EventNested = Pick<Event, 'id' | 'title' | 'start_date' | 'status'>;

/** Event creation payload */
export interface EventCreateData {
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  timezone: string;
  company_name: string;
  description?: string;
  status?: EventStatus;
  branding?: Partial<EventBranding>;
}

/** Mutable fields for event updates */
interface EventMutableFields {
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string;
  end_date: string;
  timezone: string;
  company_name: string;
  status: EventStatus;
  branding: Partial<EventBranding>;
  event_format: EventFormat;
  is_private: boolean;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_state: USState | null;
  venue_country: string | null;
  hero_description: string | null;
  hero_images: Partial<HeroImages>;
  sections: Partial<EventSections>;
  icebreakers: string[];
  main_session_id: number | null;
}

/** Event update payload - requires at least one field */
export type EventUpdateData = Patch<EventMutableFields>;

/** Event branding update payload - banner_url is excluded as it's set via file upload */
export type EventBrandingUpdate = Partial<Omit<EventBranding, 'banner_url'>>;

// ─────────────────────────────────────────────────────────────────────────────
// Session types
// ─────────────────────────────────────────────────────────────────────────────

/** Session speaker with role */
export interface SessionSpeaker {
  id: number;
  session_id: number;
  user_id: number;
  role: SessionSpeakerRole;
  order: number | null;
  speaker_name: string;
  image_url: string | null;
  title: string | null;
  company_name: string | null;
  social_links: SocialLinks | null;
}

/** Session summary for event listings */
export interface SessionSummary {
  id: number;
  title: string;
  start_time: string; // Time as HH:MM:SS
  end_time: string;
  day_number: number;
  session_type: SessionType;
  description: string | null;
  speakers: SessionSpeaker[];
}

/** Minimal session for dropdowns - derived from Session */
export type SessionMinimal = Pick<
  Session,
  'id' | 'title' | 'day_number' | 'start_time' | 'end_time'
>;

/** Full session model */
export interface Session {
  id: number;
  event_id: number;
  status: SessionStatus;
  session_type: SessionType;
  chat_mode: SessionChatMode;
  title: string;
  short_description: string | null;
  description: string | null;
  start_time: string; // Time as HH:MM:SS
  end_time: string;
  stream_url: string | null;
  streaming_platform: StreamingPlatform | null;
  zoom_meeting_id: string | null;
  zoom_passcode: string | null;
  mux_playback_policy: 'PUBLIC' | 'SIGNED' | null;
  jitsi_room_name: string | null;
  day_number: number;
  created_at: string;
  updated_at: string | null;

  // Computed properties
  duration_minutes: number;
  formatted_duration: string;
  is_live: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  is_upcoming: boolean;
  is_in_progress: boolean;
  has_chat_enabled: boolean;
  has_public_chat_enabled: boolean;
  has_backstage_chat_enabled: boolean;
}

/** Detailed session with relationships */
export interface SessionDetail extends Session {
  event: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
  };
  session_speakers: SessionSpeaker[];
}

/** Session creation payload */
export interface SessionCreateData {
  title: string;
  session_type: SessionType;
  start_time: string;
  end_time: string;
  day_number: number;
  status?: SessionStatus;
  short_description?: string;
  description?: string;
  stream_url?: string | null;
  chat_mode?: SessionChatMode;
  streaming_platform?: StreamingPlatform | null;
  zoom_meeting_id?: string | null;
  zoom_passcode?: string | null;
  mux_playback_policy?: 'PUBLIC' | 'SIGNED' | null;
  jitsi_room_name?: string | null;
}

/** Mutable fields for session updates */
interface SessionMutableFields {
  title: string;
  session_type: SessionType;
  status: SessionStatus;
  short_description: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  stream_url: string | null;
  day_number: number;
  chat_mode: SessionChatMode;
  streaming_platform: StreamingPlatform | null;
  zoom_meeting_id: string | null;
  zoom_passcode: string | null;
  mux_playback_policy: 'PUBLIC' | 'SIGNED' | null;
  jitsi_room_name: string | null;
}

/** Session update payload - requires at least one field */
export type SessionUpdateData = Patch<SessionMutableFields>;

/** Playback data returned for streaming */
export interface SessionPlaybackData {
  platform: StreamingPlatform;
  // Vimeo/Mux/Other
  playback_url?: string | null;
  // Mux specific
  playback_policy?: 'PUBLIC' | 'SIGNED' | null;
  tokens?: Record<string, string> | null;
  // Zoom specific
  join_url?: string | null;
  passcode?: string | null;
  // Jitsi specific
  app_id?: string | null;
  room_name?: string | null;
  token?: string | null;
  expires_at?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event User types
// ─────────────────────────────────────────────────────────────────────────────

/** Event user association */
export interface EventUser {
  event_id: number;
  user_id: number;
  role: EventUserRole;
  speaker_bio: string | null;
  speaker_title: string | null;
  privacy_overrides: Record<string, unknown> | null;
  is_banned: boolean;
  banned_at: string | null;
  banned_by: number | null;
  ban_reason: string | null;
  is_chat_banned: boolean;
  chat_ban_until: string | null;
  chat_ban_reason: string | null;
  moderation_notes: string | null;
  created_at: string;

  // Computed from user relationship
  id: number; // user.id
  full_name: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url: string | null;
  social_links: SocialLinks;
  company_name: string | null;
  title: string | null;

  // Speaker-specific computed
  session_count?: number;
  sessions?: Array<{
    id: number;
    title: string;
    start_time: string | null;
    end_time: string | null;
    day_number: number;
    role: SessionSpeakerRole | null;
    session_type: SessionType | null;
  }>;

  // Connection status fields (added by networking service)
  connection_status?: string | null;
  connection_id?: number | null;
  connection_direction?: string | null;

  // Additional computed fields
  user_name?: string;
  is_speaker?: boolean;
  is_organizer?: boolean;
}

/** Add user to event payload */
export interface AddUserToEventData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: EventUserRole;
}
