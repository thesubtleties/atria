from enum import Enum


class SessionType(str, Enum):
    KEYNOTE = "keynote"
    WORKSHOP = "workshop"
    PANEL = "panel"
    PRESENTATION = "presentation"
    NETWORKING = "networking"
    QA = "qa"


class EventType(str, Enum):
    CONFERENCE = "conference"
    SINGLE_SESSION = "single_session"


class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


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
    ADMIN = "admin"
    ORGANIZER = "organizer"
    MODERATOR = "moderator"
    SPEAKER = "speaker"
    ATTENDEE = "attendee"


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
