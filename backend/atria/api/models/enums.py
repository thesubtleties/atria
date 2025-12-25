from enum import Enum


class SessionType(str, Enum):
    KEYNOTE = "KEYNOTE"
    WORKSHOP = "WORKSHOP"
    PANEL = "PANEL"
    PRESENTATION = "PRESENTATION"
    NETWORKING = "NETWORKING"
    QA = "QA"


class EventType(str, Enum):
    CONFERENCE = "CONFERENCE"
    SINGLE_SESSION = "SINGLE_SESSION"


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    SPEAKER = "SPEAKER"
    ATTENDEE = "ATTENDEE"


class SessionStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    STARTING_SOON = "STARTING_SOON"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


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
    HOST = "HOST"
    SPEAKER = "SPEAKER"
    PANELIST = "PANELIST"
    MODERATOR = "MODERATOR"
    KEYNOTE = "KEYNOTE"


class EventFormat(str, Enum):
    VIRTUAL = "VIRTUAL"
    IN_PERSON = "IN_PERSON"
    HYBRID = "HYBRID"


class ConnectionStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    REMOVED = "REMOVED"  # User voluntarily removed connection
    BLOCKED = "BLOCKED"


class EmailVisibility(str, Enum):
    EVENT_ATTENDEES = "EVENT_ATTENDEES"
    CONNECTIONS_ORGANIZERS = "CONNECTIONS_ORGANIZERS"
    ORGANIZERS_ONLY = "ORGANIZERS_ONLY"


class ConnectionRequestPermission(str, Enum):
    EVENT_ATTENDEES = "EVENT_ATTENDEES"
    SPEAKERS_ORGANIZERS = "SPEAKERS_ORGANIZERS"
    NONE = "NONE"


class SocialLinksVisibility(str, Enum):
    EVENT_ATTENDEES = "EVENT_ATTENDEES"
    CONNECTIONS = "CONNECTIONS"
    HIDDEN = "HIDDEN"


class MessageStatus(str, Enum):
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"


class ChatRoomType(str, Enum):
    GLOBAL = "GLOBAL"  # Event-wide, all attendees
    PUBLIC = "PUBLIC"  # Session-specific, all attendees
    BACKSTAGE = "BACKSTAGE"  # Session-specific, speakers/organizers only
    ADMIN = "ADMIN"  # Event-wide, admins/organizers only
    GREEN_ROOM = "GREEN_ROOM"  # Event-wide, speakers/admins/organizers only


class SessionChatMode(str, Enum):
    ENABLED = "ENABLED"  # Both PUBLIC and BACKSTAGE chat enabled
    BACKSTAGE_ONLY = "BACKSTAGE_ONLY"  # Only BACKSTAGE chat enabled
    DISABLED = "DISABLED"  # No chat rooms enabled


class InvitationStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    EXPIRED = "EXPIRED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"


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
