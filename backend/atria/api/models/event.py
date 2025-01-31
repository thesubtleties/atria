from api.extensions import db
from api.models.enums import EventType, EventStatus, EventUserRole
from datetime import datetime, timezone
from slugify import slugify


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.BigInteger, primary_key=True)
    organization_id = db.Column(
        db.BigInteger,
        db.ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    event_type = db.Column(
        db.Enum(EventType), nullable=False
    )  # enum: 'conference', 'single_session',
    start_date = db.Column(db.DateTime(timezone=True), nullable=False)
    end_date = db.Column(db.DateTime(timezone=True), nullable=False)
    company_name = db.Column(db.Text, nullable=False)
    slug = db.Column(db.Text, nullable=False, unique=True)
    status = db.Column(
        db.Enum(EventStatus), nullable=False, default="draft"
    )  # enum: 'draft', 'published', 'archived'
    branding = db.Column(
        db.JSON,
        nullable=False,
        default={
            "primary_color": "#000000",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
    )
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    organization = db.relationship("Organization", back_populates="events")

    sessions = db.relationship(
        "Session",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    users = db.relationship(
        "User",
        secondary="event_users",
        back_populates="events",
        overlaps="event_users",
        passive_deletes=True,
    )

    event_users = db.relationship(
        "EventUser",
        back_populates="event",
        overlaps="users,events",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __init__(self, *args, **kwargs):
        """Initialize event and generate slug from title"""
        if "title" in kwargs and "slug" not in kwargs:
            base_slug = slugify(kwargs["title"])
            slug = base_slug
            counter = 1

            while Event.query.filter_by(slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            kwargs["slug"] = slug

        super().__init__(*args, **kwargs)

    def add_user(self, user, role: EventUserRole, **kwargs):
        """Add user to event with role and optional speaker info"""
        from api.models import EventUser

        if self.has_user(user):
            raise ValueError("User already in event")

        event_user = EventUser(
            event_id=self.id,
            user_id=user.id,
            role=role,
            speaker_bio=kwargs.get("speaker_bio"),
            speaker_title=kwargs.get("speaker_title"),
        )
        db.session.add(event_user)
        return event_user

    def add_speaker(self, user, **kwargs):
        """Convenience method to add speaker with optional bio and title"""
        return self.add_user(
            user,
            EventUserRole.SPEAKER,
            speaker_bio=kwargs.get("speaker_bio"),
            speaker_title=kwargs.get("speaker_title"),
        )

    def has_user(self, user) -> bool:
        """Check if user is in event"""
        return user in self.users

    def get_user_role(self, user) -> EventUserRole:
        """Get user's role in event"""
        from api.models import EventUser

        event_user = EventUser.query.filter_by(
            event_id=self.id, user_id=user.id
        ).first()
        return event_user.role if event_user else None

    def get_users_by_role(self, *roles: EventUserRole):
        """Get all users with specific roles"""
        from api.models import EventUser

        return [
            event_user.user
            for event_user in EventUser.query.filter(
                EventUser.event_id == self.id, EventUser.role.in_(roles)
            ).all()
        ]

    def get_event_users_by_role(self, *roles: EventUserRole):
        """Get all EventUser objects with specific roles"""
        from api.models import EventUser

        return EventUser.query.filter(
            EventUser.event_id == self.id, EventUser.role.in_(roles)
        ).all()

    @property
    def speakers(self):
        """Get all speakers"""
        return self.get_users_by_role(EventUserRole.SPEAKER)

    @property
    def organizers(self):
        """Get all organizers and admins with their roles - for role-aware contexts"""
        return self.get_event_users_by_role(
            EventUserRole.ORGANIZER, EventUserRole.ADMIN
        )

    @property
    def organizer_users(self):
        """Get all organizer users - for user-only contexts"""
        return self.get_users_by_role(
            EventUserRole.ORGANIZER, EventUserRole.ADMIN
        )

    @property
    def attendees(self):
        """Get all attendees"""
        return self.get_users_by_role(EventUserRole.ATTENDEE)

    @property
    def is_published(self) -> bool:
        return self.status == EventStatus.PUBLISHED

    @property
    def is_draft(self) -> bool:
        return self.status == EventStatus.DRAFT

    @property
    def is_archived(self) -> bool:
        return self.status == EventStatus.ARCHIVED

    @property
    def is_upcoming(self) -> bool:
        return self.start_date > datetime.now(timezone.utc)

    @property
    def is_ongoing(self) -> bool:
        now = datetime.now(timezone.utc)
        return self.start_date <= now <= self.end_date

    @property
    def is_past(self) -> bool:
        return self.end_date < datetime.now(timezone.utc)

    def update_status(self, new_status: EventStatus):
        """Update event status with validation"""
        if new_status == EventStatus.PUBLISHED:
            self._validate_for_publishing()

        self.status = new_status

    def _validate_for_publishing(self):
        """Validate event can be published"""
        if not self.title:
            raise ValueError("Event must have a title")
        if not self.start_date or not self.end_date:
            raise ValueError("Event must have start and end dates")
        if not self.organizers:
            raise ValueError("Event must have at least one organizer")

    def update_branding(self, **kwargs):
        """Update branding fields"""
        valid_fields = {
            "primary_color",
            "secondary_color",
            "logo_url",
            "banner_url",
        }

        for key, value in kwargs.items():
            if key in valid_fields:
                self.branding[key] = value

    def get_sessions_by_day(self, day_number):
        """Get all sessions for a specific day"""
        return [s for s in self.sessions if s.day_number == day_number]

    @property
    def day_count(self):
        """Get number of days in event"""
        if not self.sessions:
            return (self.end_date - self.start_date).days + 1
        return max(s.day_number for s in self.sessions)

    @classmethod
    def get_upcoming(cls):
        """Get all upcoming published events"""
        return (
            cls.query.filter(
                cls.status == EventStatus.PUBLISHED,
                cls.start_date > datetime.now(timezone.utc),
            )
            .order_by(cls.start_date)
            .all()
        )

    def can_user_edit(self, user) -> bool:
        """Check if user can edit event"""
        role = self.get_user_role(user)
        return role in [EventUserRole.ORGANIZER, EventUserRole.MODERATOR]

    def validate_dates(self):
        """Validate event dates"""
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")

        # Check if sessions are within event dates
        for session in self.sessions:
            if (
                session.start_time < self.start_date
                or session.end_time > self.end_date
            ):
                raise ValueError(
                    f"Session '{session.title}' times are outside event dates"
                )

    def generate_slug(self):
        """Generate unique slug from title"""

        base_slug = slugify(self.title)
        slug = base_slug
        counter = 1

        while Event.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        self.slug = slug
