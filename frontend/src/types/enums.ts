/**
 * Enum types matching backend API values.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Session Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionType = 'KEYNOTE' | 'WORKSHOP' | 'PANEL' | 'PRESENTATION' | 'NETWORKING' | 'QA';

export type SessionStatus = 'SCHEDULED' | 'STARTING_SOON' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type SessionSpeakerRole = 'HOST' | 'SPEAKER' | 'PANELIST' | 'MODERATOR' | 'KEYNOTE';

export type SessionChatMode = 'ENABLED' | 'BACKSTAGE_ONLY' | 'DISABLED';

// ─────────────────────────────────────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────────────────────────────────────

export type EventType = 'CONFERENCE' | 'SINGLE_SESSION';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';

export type EventFormat = 'VIRTUAL' | 'IN_PERSON' | 'HYBRID';

// ─────────────────────────────────────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────────────────────────────────────

export type EventUserRole = 'ADMIN' | 'ORGANIZER' | 'MODERATOR' | 'SPEAKER' | 'ATTENDEE';

export type OrganizationUserRole = 'ADMIN' | 'MEMBER' | 'OWNER';

// ─────────────────────────────────────────────────────────────────────────────
// Networking & Connections
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REMOVED' | 'BLOCKED';

export type EmailVisibility = 'EVENT_ATTENDEES' | 'CONNECTIONS_ORGANIZERS' | 'ORGANIZERS_ONLY';

export type ConnectionRequestPermission = 'EVENT_ATTENDEES' | 'SPEAKERS_ORGANIZERS' | 'NONE';

export type SocialLinksVisibility = 'EVENT_ATTENDEES' | 'CONNECTIONS' | 'HIDDEN';

// ─────────────────────────────────────────────────────────────────────────────
// Messaging
// ─────────────────────────────────────────────────────────────────────────────

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export type ChatRoomType = 'GLOBAL' | 'PUBLIC' | 'BACKSTAGE' | 'ADMIN' | 'GREEN_ROOM';

// ─────────────────────────────────────────────────────────────────────────────
// Invitations
// ─────────────────────────────────────────────────────────────────────────────

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED' | 'CANCELLED';

// ─────────────────────────────────────────────────────────────────────────────
// Streaming & Media
// ─────────────────────────────────────────────────────────────────────────────

export type StreamingPlatform = 'VIMEO' | 'MUX' | 'ZOOM' | 'JITSI' | 'OTHER';

// ─────────────────────────────────────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────────────────────────────────────

export type USState =
  | 'AL'
  | 'AK'
  | 'AZ'
  | 'AR'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IA'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'ME'
  | 'MD'
  | 'MA'
  | 'MI'
  | 'MN'
  | 'MS'
  | 'MO'
  | 'MT'
  | 'NE'
  | 'NV'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NY'
  | 'NC'
  | 'ND'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VT'
  | 'VA'
  | 'WA'
  | 'WV'
  | 'WI'
  | 'WY'
  | 'DC';
