from enum import Enum


class SessionType(str, Enum):
    KEYNOTE = "keynote"
    WORKSHOP = "workshop"
    PANEL = "panel"
    PRESENTATION = "PRESENTATION"
    NETWORKING = "networking"
    QA = "qa"


class EventType(str, Enum):
    CONFERENCE = "conference"
    SINGLE_SESSION = "single_session"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"


class UserRole(str, Enum):
    ADMIN = "admin"
    ORGANIZER = "organizer"
    SPEAKER = "speaker"
    ATTENDEE = "attendee"


class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    STARTING_SOON = "starting_soon"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventUserRole(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    MODERATOR = "MODERATOR"
    SPEAKER = "SPEAKER"
    ATTENDEE = "ATTENDEE"


class OrganizationUserRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    OWNER = "OWNER"


class SessionSpeakerRole(str, Enum):
    HOST = "host"
    SPEAKER = "speaker"
    PANELIST = "panelist"
    MODERATOR = "moderator"
    KEYNOTE = "keynote"


class EventFormat(str, Enum):
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"
    HYBRID = "hybrid"


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REMOVED = "removed"  # User voluntarily removed connection
    BLOCKED = "blocked"


class EmailVisibility(str, Enum):
    EVENT_ATTENDEES = "event_attendees"
    CONNECTIONS_ORGANIZERS = "connections_organizers"
    ORGANIZERS_ONLY = "organizers_only"


class ConnectionRequestPermission(str, Enum):
    EVENT_ATTENDEES = "event_attendees"
    SPEAKERS_ORGANIZERS = "speakers_organizers"
    NONE = "none"


class SocialLinksVisibility(str, Enum):
    EVENT_ATTENDEES = "event_attendees"
    CONNECTIONS = "connections"
    HIDDEN = "hidden"


class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class ChatRoomType(str, Enum):
    GLOBAL = "GLOBAL"           # Event-wide, all attendees
    PUBLIC = "PUBLIC"           # Session-specific, all attendees
    BACKSTAGE = "BACKSTAGE"     # Session-specific, speakers/organizers only
    ADMIN = "ADMIN"             # Event-wide, admins/organizers only
    GREEN_ROOM = "GREEN_ROOM"   # Event-wide, speakers/admins/organizers only


class SessionChatMode(str, Enum):
    ENABLED = "ENABLED"             # Both PUBLIC and BACKSTAGE chat enabled
    BACKSTAGE_ONLY = "BACKSTAGE_ONLY"  # Only BACKSTAGE chat enabled
    DISABLED = "DISABLED"           # No chat rooms enabled


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class StreamingPlatform(str, Enum):
    VIMEO = "VIMEO"
    MUX = "MUX"
    ZOOM = "ZOOM"
    JITSI = "JITSI"
    OTHER = "OTHER"


class USState(str, Enum):
    AL = "AL"  # Alabama
    AK = "AK"  # Alaska
    AZ = "AZ"  # Arizona
    AR = "AR"  # Arkansas
    CA = "CA"  # California
    CO = "CO"  # Colorado
    CT = "CT"  # Connecticut
    DE = "DE"  # Delaware
    FL = "FL"  # Florida
    GA = "GA"  # Georgia
    HI = "HI"  # Hawaii
    ID = "ID"  # Idaho
    IL = "IL"  # Illinois
    IN = "IN"  # Indiana
    IA = "IA"  # Iowa
    KS = "KS"  # Kansas
    KY = "KY"  # Kentucky
    LA = "LA"  # Louisiana
    ME = "ME"  # Maine
    MD = "MD"  # Maryland
    MA = "MA"  # Massachusetts
    MI = "MI"  # Michigan
    MN = "MN"  # Minnesota
    MS = "MS"  # Mississippi
    MO = "MO"  # Missouri
    MT = "MT"  # Montana
    NE = "NE"  # Nebraska
    NV = "NV"  # Nevada
    NH = "NH"  # New Hampshire
    NJ = "NJ"  # New Jersey
    NM = "NM"  # New Mexico
    NY = "NY"  # New York
    NC = "NC"  # North Carolina
    ND = "ND"  # North Dakota
    OH = "OH"  # Ohio
    OK = "OK"  # Oklahoma
    OR = "OR"  # Oregon
    PA = "PA"  # Pennsylvania
    RI = "RI"  # Rhode Island
    SC = "SC"  # South Carolina
    SD = "SD"  # South Dakota
    TN = "TN"  # Tennessee
    TX = "TX"  # Texas
    UT = "UT"  # Utah
    VT = "VT"  # Vermont
    VA = "VA"  # Virginia
    WA = "WA"  # Washington
    WV = "WV"  # West Virginia
    WI = "WI"  # Wisconsin
    WY = "WY"  # Wyoming
    DC = "DC"  # District of Columbia
