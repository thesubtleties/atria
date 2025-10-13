from api.extensions import db
from api.models.enums import EventType, EventStatus, EventUserRole, EventFormat, USState
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
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    timezone = db.Column(db.String(50), nullable=False, default='UTC')
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
    hero_description = db.Column(db.Text)
    hero_images = db.Column(
        db.JSON, nullable=True, default={"desktop": None, "mobile": None}
    )

    event_format = db.Column(
        db.Enum(EventFormat), nullable=False, default=EventFormat.VIRTUAL
    )
    is_private = db.Column(db.Boolean, default=False)
    venue_name = db.Column(db.String(255), nullable=True)
    venue_address = db.Column(db.Text, nullable=True)
    venue_city = db.Column(db.String(100), nullable=True)
    venue_state = db.Column(db.Enum(USState), nullable=True)
    venue_country = db.Column(db.String(100), nullable=True)

    sections = db.Column(
        db.JSON,
        nullable=True,
        default={
            "welcome": {"title": None, "content": None},
            "highlights": [],
            "faqs": [],
        },
    )
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deleted_by_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    main_session_id = db.Column(
        db.BigInteger, db.ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True
    )

    icebreakers = db.Column(
        db.JSON,
        nullable=True,
        default=[
            "Hi! I noticed we're both interested in similar sessions. Would you like to connect?",
            "Hello! I saw your profile and would love to discuss technology with you.",
            "I'm looking to connect with others in the tech field. Would you be open to chatting?",
            "Hi there! I enjoyed your question during the session. Could we discuss it further?",
            "Hello! I'm exploring opportunities in this field. Would you have a few minutes to chat?",
            "I see we're both from the same industry. I'd love to connect!",
            "Hi! I'm interested in learning more about your work. Could we chat?",
            "Hello! I'm building a network of professionals. Would you like to connect?",
        ],
    )

    sponsor_tiers = db.Column(
        db.JSON,
        nullable=True,
        default=[
            {"id": "platinum", "name": "Platinum Sponsor", "order": 1, "color": "#E5E4E2"},
            {"id": "gold", "name": "Gold Sponsor", "order": 2, "color": "#DEAE4A"},
            {"id": "silver", "name": "Silver Sponsor", "order": 3, "color": "#C7D3DB"},
            {"id": "bronze", "name": "Bronze Sponsor", "order": 4, "color": "#BB8F4C"},
            {"id": "community", "name": "Community Partner", "order": 5, "color": "#8B5CF6"},
        ],
    )

    # Relationships
    organization = db.relationship("Organization", back_populates="events")
    main_session = db.relationship("Session", foreign_keys=[main_session_id], post_update=True)

    sessions = db.relationship(
        "Session",
        foreign_keys="Session.event_id",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    users = db.relationship(
        "User",
        secondary="event_users",
        primaryjoin="Event.id == EventUser.event_id",
        secondaryjoin="EventUser.user_id == User.id",
        back_populates="events",
        overlaps="event_users",
        passive_deletes=True,
        viewonly=True
    )

    event_users = db.relationship(
        "EventUser",
        back_populates="event",
        overlaps="users,events",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    chat_rooms = db.relationship(
        "ChatRoom", back_populates="event", cascade="all, delete-orphan"
    )
    originated_connections = db.relationship(
        "Connection", back_populates="originating_event"
    )
    sponsors = db.relationship(
        "Sponsor",
        back_populates="event",
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

    def __repr__(self):
        return (
            f"Event(id={self.id}, "
            f"title='{self.title}', "
            f"type={self.event_type.value}, "
            f"dates={self.start_date} to {self.end_date}, "
            f"sessions={len(self.sessions)})"
        )

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

    def remove_user(self, user):
        """Remove user from event"""
        from api.models import EventUser

        # Can't remove the last admin
        if self.get_user_role(user) == EventUserRole.ADMIN and self.admin_count == 1:
            raise ValueError("Cannot remove last admin")

        EventUser.query.filter_by(
            event_id=self.id, user_id=user.id
        ).delete()

    def add_speaker(self, user, **kwargs):
        """Convenience method to add speaker with optional bio and title"""
        return self.add_user(
            user,
            EventUserRole.SPEAKER,
            speaker_bio=kwargs.get("speaker_bio"),
            speaker_title=kwargs.get("speaker_title"),
        )

    def has_user(self, user) -> bool:
        """Check if user has an explicit EventUser record for this event

        This method only checks for actual event membership, not implicit access.
        Use user_can_access() to check if a user has permission to access the event.
        """
        return user in self.users

    def user_can_access(self, user) -> bool:
        """Check if user can access this event

        Returns True if:
        - User has an explicit EventUser record (is a member)
        - User is an organization owner (implicit admin access)

        Use this for permission checks and access control.
        Use has_user() for membership management and duplicate prevention.
        """
        # Check explicit membership first (faster)
        if self.has_user(user):
            return True

        # Check if user is organization owner
        from api.models.enums import OrganizationUserRole
        if self.organization.get_user_role(user) == OrganizationUserRole.OWNER:
            return True

        return False

    def get_user_role(self, user) -> EventUserRole:
        """Get user's role in event
        
        #! SPECIAL CASE: Organization owners who are not event members are
        #! treated as having ADMIN role in all their organization's events.
        #! This provides org owners with full control over their events.
        """
        from api.models import EventUser
        from api.models.enums import OrganizationUserRole

        # Check actual event role first
        event_user = EventUser.query.filter_by(
            event_id=self.id, user_id=user.id
        ).first()
        
        if event_user:
            return event_user.role
        
        # Check if user is organization owner - treat as ADMIN
        if self.organization.get_user_role(user) == OrganizationUserRole.OWNER:
            return EventUserRole.ADMIN
        
        return None

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

    def add_icebreaker(self, message):
        """Add a new icebreaker message"""
        if not self.icebreakers:
            self.icebreakers = []
        self.icebreakers.append(message)
        return self.icebreakers

    def remove_icebreaker(self, index):
        """Remove an icebreaker by index"""
        if self.icebreakers and 0 <= index < len(self.icebreakers):
            self.icebreakers.pop(index)
        return self.icebreakers

    def create_default_chat_rooms(self):
        """Create default chat rooms for the event"""
        from api.models.chat_room import ChatRoom
        from api.models.enums import ChatRoomType

        # Check if global chat room exists
        global_room = ChatRoom.query.filter_by(
            event_id=self.id, room_type=ChatRoomType.GLOBAL, name="General"
        ).first()
        if not global_room:
            global_room = ChatRoom(
                event_id=self.id,
                name="General",
                description="General discussion for all attendees",
                room_type=ChatRoomType.GLOBAL,
                is_enabled=True,
            )
            db.session.add(global_room)

        # other default rooms (all are GLOBAL event-wide rooms)
        topic_rooms = [
            {"name": "Q&A", "description": "Ask questions about the event"},
            {
                "name": "Networking",
                "description": "Connect with other attendees",
            },
        ]

        for room_data in topic_rooms:
            existing = ChatRoom.query.filter_by(
                event_id=self.id, name=room_data["name"]
            ).first()
            if not existing:
                room = ChatRoom(
                    event_id=self.id,
                    name=room_data["name"],
                    description=room_data["description"],
                    room_type=ChatRoomType.GLOBAL,
                    is_enabled=True,
                )
                db.session.add(room)
        
        # Create ADMIN room
        admin_room = ChatRoom.query.filter_by(
            event_id=self.id, room_type=ChatRoomType.ADMIN
        ).first()
        if not admin_room:
            admin_room = ChatRoom(
                event_id=self.id,
                name="Staff Coordination",
                description="Private chat for event admins and organizers",
                room_type=ChatRoomType.ADMIN,
                is_enabled=True,
            )
            db.session.add(admin_room)
        
        # Create GREEN_ROOM
        green_room = ChatRoom.query.filter_by(
            event_id=self.id, room_type=ChatRoomType.GREEN_ROOM
        ).first()
        if not green_room:
            green_room = ChatRoom(
                event_id=self.id,
                name="Speaker Green Room",
                description="Private chat for speakers, admins, and organizers",
                room_type=ChatRoomType.GREEN_ROOM,
                is_enabled=True,
            )
            db.session.add(green_room)

        db.session.commit()

    @property
    def admin_count(self):
        """Get number of admins"""
        from api.models import EventUser

        return EventUser.query.filter_by(
            event_id=self.id, role=EventUserRole.ADMIN
        ).count()

    @property
    def sponsors_count(self):
        """Get number of active sponsors"""
        from api.models import Sponsor

        return Sponsor.query.filter_by(
            event_id=self.id, is_active=True
        ).count()

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
    def is_deleted(self) -> bool:
        return self.status == EventStatus.DELETED

    @property
    def is_upcoming(self) -> bool:
        return self.start_date > datetime.now(timezone.utc).date()

    @property
    def is_ongoing(self) -> bool:
        now = datetime.now(timezone.utc).date()
        return self.start_date <= now <= self.end_date

    @property
    def is_past(self) -> bool:
        return self.end_date < datetime.now(timezone.utc).date()

    @property
    def first_session_time(self):
        """Get earliest session start time for the event"""
        if not self.sessions:
            return None
        time_obj = min(session.start_time for session in self.sessions)
        return time_obj.strftime("%H:%M:%S") if time_obj else None

    @property
    def last_session_time(self):
        """Get latest session end time for the event"""
        if not self.sessions:
            return None
        time_obj = max(session.end_time for session in self.sessions)
        return time_obj.strftime("%H:%M:%S") if time_obj else None

    @property
    def event_hours(self):
        """Get actual event hours based on sessions"""
        first = self.first_session_time
        last = self.last_session_time
        if first and last:
            return {"start": first, "end": last}  # Now they're strings
        return None

    @property
    def day_count(self):
        """Get number of days in event"""
        if not self.sessions:
            return (self.end_date - self.start_date).days + 1
        return max(s.day_number for s in self.sessions)

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
        if not self.hero_description:
            raise ValueError("Event must have a hero description")
        if self.event_format == EventFormat.HYBRID and not self.venue_name:
            raise ValueError("Hybrid events must have a venue")

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
        """Get all sessions for a specific day, ordered by start time"""
        from api.models.session import Session

        # returns sessions by time of day
        return (
            Session.query.filter_by(event_id=self.id, day_number=day_number)
            .order_by(Session.start_time)
            .all()
        )

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
        """Check if user can edit event
        
        #! NOTE: Organization owners can edit via get_user_role() returning ADMIN.
        #! This method checks for ORGANIZER/MODERATOR, but ADMIN (including org owners)
        #! have separate, higher-level permissions.
        """
        role = self.get_user_role(user)
        return role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER, EventUserRole.MODERATOR]

    def validate_dates(self, new_start_date=None, new_end_date=None):
        """Validate event dates and session conflicts"""
        start = new_start_date or self.start_date
        end = new_end_date or self.end_date

        # Basic date order validation
        if end < start:
            raise ValueError("End date cannot be before start date")

        # Check if shortening event would orphan sessions
        if self.sessions:
            new_duration = (end - start).days + 1
            max_day = max(session.day_number for session in self.sessions)

            if max_day > new_duration:
                raise ValueError(
                    f"Cannot shorten event: sessions exist on day {max_day}. "
                    f"Please remove or reschedule sessions beyond day {new_duration} first."
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

    def update_hero(
        self, description=None, desktop_image=None, mobile_image=None
    ):
        """Update hero content"""
        if description is not None:
            self.hero_description = description

        if desktop_image is not None or mobile_image is not None:
            images = self.hero_images or {}
            if desktop_image is not None:
                images["desktop"] = desktop_image
            if mobile_image is not None:
                images["mobile"] = mobile_image
            self.hero_images = images

    def update_venue(self, **kwargs):
        """Update venue information"""
        valid_fields = {
            "venue_name",
            "venue_address",
            "venue_city",
            "venue_state",
            "venue_country",
        }
        for field, value in kwargs.items():
            if field in valid_fields:
                setattr(self, field, value)

    def update_section_field(self, section_type, field, value):
        """Update a specific field in sections"""
        sections = self.sections or {}
        if section_type not in sections:
            sections[section_type] = {}
        sections[section_type][field] = value
        self.sections = sections

    def add_highlight(self, title, description, icon=None):
        """Add a highlight to sections"""
        sections = self.sections or {}
        if "highlights" not in sections:
            sections["highlights"] = []
        sections["highlights"].append(
            {"title": title, "description": description, "icon": icon}
        )
        self.sections = sections

    def remove_highlight(self, index):
        """Remove a highlight by index"""
        sections = self.sections or {}
        if "highlights" in sections and 0 <= index < len(
            sections["highlights"]
        ):
            sections["highlights"].pop(index)
            self.sections = sections

    def add_faq(self, question, answer):
        """Add an FAQ"""
        sections = self.sections or {}
        if "faqs" not in sections:
            sections["faqs"] = []
        sections["faqs"].append({"question": question, "answer": answer})
        self.sections = sections

    def remove_faq(self, index):
        """Remove an FAQ by index"""
        sections = self.sections or {}
        if "faqs" in sections and 0 <= index < len(sections["faqs"]):
            sections["faqs"].pop(index)
            self.sections = sections

    def soft_delete(self, deleted_by_user_id):
        """Soft delete the event, clearing sensitive data but preserving core info for connections"""
        self.status = EventStatus.DELETED
        self.deleted_at = datetime.now(timezone.utc)
        self.deleted_by_id = deleted_by_user_id
        
        # Clear sensitive/unnecessary data
        self.description = None
        self.hero_description = None
        self.hero_images = {"desktop": None, "mobile": None}
        self.sections = {}
        self.branding = {
            "primary_color": "#000000",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        }
        self.icebreakers = []
        
        # Keep: title, dates, venue info, company_name for connection context
