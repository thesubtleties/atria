from api.extensions import db, pwd_context
from sqlalchemy.ext.hybrid import hybrid_property
from api.models.enums import (
    SessionSpeakerRole,
    OrganizationUserRole,
    EventUserRole,
)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    _password = db.Column("password_hash", db.Text, nullable=False)
    first_name = db.Column(db.Text, nullable=False)
    last_name = db.Column(db.Text, nullable=False)
    company_name = db.Column(db.Text)
    title = db.Column(db.Text)
    bio = db.Column(db.Text)
    image_url = db.Column(db.Text)
    social_links = db.Column(db.JSON, nullable=False, default={})
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    organizations = db.relationship(
        "Organization",
        secondary="organization_users",
        back_populates="users",
        overlaps="organization_users",
    )
    organization_users = db.relationship(
        "OrganizationUser",
        back_populates="user",
        overlaps="organizations,users",
        cascade="all, delete-orphan",
    )
    events = db.relationship(
        "Event",
        secondary="event_users",
        back_populates="users",
        overlaps="event_users",
    )
    event_users = db.relationship(
        "EventUser",
        back_populates="user",
        overlaps="events,users",
        cascade="all, delete-orphan",
    )
    speaking_sessions = db.relationship(
        "Session",
        secondary="session_speakers",
        back_populates="speakers",
        overlaps="session_speakers",
    )
    session_speakers = db.relationship(
        "SessionSpeaker",
        back_populates="user",
        overlaps="speakers",
        cascade="all, delete-orphan",
    )

    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, value):
        self._password = pwd_context.hash(value)

    def verify_password(self, password):
        return pwd_context.verify(password, self._password)

    def get_event_role(self, event_id) -> EventUserRole | None:
        """Get user's role in an event"""
        from api.models import EventUser

        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=self.id
        ).first()
        return event_user.role if event_user else None

    def has_event_access(self, event_id) -> bool:
        """Check if user has any role in event"""
        return self.get_event_role(event_id) is not None

    def can_edit_event(self, event_id) -> bool:
        """Check if user can edit event"""
        role = self.get_event_role(event_id)
        return role in [EventUserRole.ORGANIZER, EventUserRole.MODERATOR]

    def get_org_role(self, org_id) -> OrganizationUserRole | None:
        """Get user's role in an organization"""
        from api.models import OrganizationUser  # Import inside method

        org_user = OrganizationUser.query.filter_by(
            organization_id=org_id, user_id=self.id
        ).first()
        return org_user.role if org_user else None

    def is_org_admin(self, org_id) -> bool:
        """Check if user is admin of organization"""
        return self.get_org_role(org_id) == OrganizationUserRole.ADMIN

    def get_session_role(self, session_id) -> SessionSpeakerRole | None:
        """Get user's role in a session"""
        from api.models import SessionSpeaker  # Import inside method

        session_speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=self.id
        ).first()
        return session_speaker.role if session_speaker else None

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"

    def get_upcoming_events(self):
        """Get user's upcoming events using relationship"""
        return (
            self.events.filter(db.text("start_date > CURRENT_TIMESTAMP"))
            .order_by(db.text("start_date"))
            .all()
        )

    def get_speaking_sessions(self):
        """Get all sessions where user is speaking"""
        from api.models import Session, SessionSpeaker

        return (
            Session.query.join(SessionSpeaker)
            .filter(
                SessionSpeaker.user_id == self.id,
                SessionSpeaker.role.in_(
                    [
                        SessionSpeakerRole.SPEAKER,
                        SessionSpeakerRole.PANELIST,
                        SessionSpeakerRole.KEYNOTE,
                    ]
                ),
            )
            .all()
        )

    def is_password_valid(self, password: str) -> bool:
        """Alias for verify_password - more intuitive name"""
        return self.verify_password(password)

    def get_events_by_role(self, role: EventUserRole):
        """Get all events where user has specific role"""
        return self.events.filter(EventUser.role == role).all()
