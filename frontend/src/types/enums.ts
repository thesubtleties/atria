export type SessionType = 'keynote' | 'workshop' | 'panel' | 'PRESENTATION' | 'networking' | 'qa';

export type EventType = 'conference' | 'single_session';

export type EventStatus = 'draft' | 'published' | 'archived' | 'deleted';

export type SessionStatus = 'scheduled' | 'starting_soon' | 'live' | 'completed' | 'cancelled';

export type EventUserRole = 'ADMIN' | 'ORGANIZER' | 'MODERATOR' | 'SPEAKER' | 'ATTENDEE';

export type OrganizationUserRole = 'ADMIN' | 'MEMBER' | 'OWNER';

export type SessionSpeakerRole = 'host' | 'speaker' | 'panelist' | 'moderator' | 'keynote';

export type EventFormat = 'virtual' | 'in_person' | 'hybrid';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'removed' | 'blocked';

export type EmailVisibility = 'event_attendees' | 'connections_organizers' | 'organizers_only';

export type ConnectionRequestPermission = 'event_attendees' | 'speakers_organizers' | 'none';

export type SocialLinksVisibility = 'event_attendees' | 'connections' | 'hidden';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type ChatRoomType = 'GLOBAL' | 'PUBLIC' | 'BACKSTAGE' | 'ADMIN' | 'GREEN_ROOM';

export type SessionChatMode = 'ENABLED' | 'BACKSTAGE_ONLY' | 'DISABLED';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'declined' | 'cancelled';

export type StreamingPlatform = 'VIMEO' | 'MUX' | 'ZOOM' | 'JITSI' | 'OTHER';

/** US State codes */
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
