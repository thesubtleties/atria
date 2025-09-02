from api.extensions import db
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole, SessionChatMode
from datetime import datetime, timezone, time, date, timedelta


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = db.Column(db.Enum(SessionStatus), nullable=False)
    session_type = db.Column(db.Enum(SessionType), nullable=False)
    chat_mode = db.Column(
        db.Enum(SessionChatMode), 
        nullable=False, 
        default=SessionChatMode.ENABLED
    )
    title = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.String(200))  # For agenda view, max 200 chars
    description = db.Column(db.Text)  # Full description for session detail page
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    stream_url = db.Column(db.Text)
    day_number = db.Column(db.BigInteger, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship("Event", back_populates="sessions")
    speakers = db.relationship(
        "User",
        secondary="session_speakers",
        back_populates="speaking_sessions",
        overlaps="session_speakers",
    )
    session_speakers = db.relationship(
        "SessionSpeaker",
        back_populates="session",
        overlaps="speakers,speaking_sessions",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    chat_rooms = db.relationship(
        "ChatRoom",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.Index('idx_sessions_event_day_time', 'event_id', 'day_number', 'start_time'),
    )

    def __repr__(self):
        return (
            f"Session(id={self.id}, "
            f"title='{self.title}', "
            f"day={self.day_number}, "
            f"time={self.start_time}-{self.end_time})"
        )

    def get_datetime_for_time(self, time_obj: time) -> datetime:
        """Convert time to full datetime based on event date and day number"""
        event_start_date = self.event.start_date
        session_date = event_start_date + timedelta(days=self.day_number - 1)
        return datetime.combine(session_date, time_obj).replace(
            tzinfo=timezone.utc
        )

    def validate_times(self):
        """Validate session times"""
        # Check time order
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")

        # Check if day number is valid
        if hasattr(self, "event") and self.event:
            event_duration = (
                self.event.end_date - self.event.start_date
            ).days + 1
            if self.day_number < 1 or self.day_number > event_duration:
                raise ValueError(
                    f"Day number must be between 1 and {event_duration}"
                )

    def update_times(self, new_start_time: time, new_end_time: time):
        """Update both times together safely."""
        if new_end_time <= new_start_time:
            raise ValueError("End time must be after start time")

        with db.session.begin_nested():
            self.start_time = new_start_time
            self.end_time = new_end_time

    def add_speaker(self, user, role=SessionSpeakerRole.SPEAKER, order=None):
        """Add speaker with role to session"""
        from api.models import SessionSpeaker

        if user in self.speakers:
            raise ValueError("Already a speaker for this session")

        speaker = SessionSpeaker(
            session_id=self.id, user_id=user.id, role=role, order=order
        )
        db.session.add(speaker)

        # Not adding speaker to event because our speaker list will only
        # contain those registered to event as speaker.

        return speaker

    def remove_speaker(self, user):
        """Remove speaker from session"""
        from api.models import SessionSpeaker

        SessionSpeaker.query.filter_by(
            session_id=self.id, user_id=user.id
        ).delete()

    def update_status(self, new_status: SessionStatus):
        """
        Update session status with hooks but without strict validation.
        Allows any transition for flexibility in emergency situations.
        """

        with db.session.begin_nested():
            self.status = new_status

            transition_method = f"_on_transition_to_{new_status.value}"
            if hasattr(self, transition_method):
                getattr(self, transition_method)()

    def mark_starting_soon(self):
        """Mark session as starting soon"""
        self.update_status(SessionStatus.STARTING_SOON)

    def start_session(self):
        """Start the session"""
        self.update_status(SessionStatus.LIVE)

    def complete_session(self):
        """Complete the session"""
        self.update_status(SessionStatus.COMPLETED)

    def cancel_session(self):
        """Cancel the session"""
        self.update_status(SessionStatus.CANCELLED)

    @property
    def start_datetime(self) -> datetime:
        """Get full start datetime"""
        return self.get_datetime_for_time(self.start_time)

    @property
    def end_datetime(self) -> datetime:
        """Get full end datetime"""
        return self.get_datetime_for_time(self.end_time)

    @property
    def is_live(self) -> bool:
        return self.status == SessionStatus.LIVE

    @property
    def is_completed(self) -> bool:
        return self.status == SessionStatus.COMPLETED

    @property
    def is_cancelled(self) -> bool:
        return self.status == SessionStatus.CANCELLED

    @property
    def duration_minutes(self):
        """Get session duration in minutes"""
        start_minutes = self.start_time.hour * 60 + self.start_time.minute
        end_minutes = self.end_time.hour * 60 + self.end_time.minute
        return end_minutes - start_minutes

    @property
    def is_upcoming(self):
        """Check if session is upcoming"""
        return (
            self.status == SessionStatus.SCHEDULED
            and self.start_datetime > datetime.now(timezone.utc)
        )

    @property
    def is_in_progress(self):
        """Check if session is currently running"""
        now = datetime.now(timezone.utc)
        return (
            self.status == SessionStatus.LIVE
            and self.start_datetime <= now <= self.end_datetime
        )

    @property
    def formatted_duration(self) -> str:
        """Get human-readable duration"""
        minutes = self.duration_minutes
        hours = minutes // 60
        remaining_minutes = minutes % 60
        return f"{hours}h {remaining_minutes}m"

    def has_speaker(self, user):
        """Check if user is a speaker"""
        return user in self.speakers

    @property
    def public_chat_room(self):
        """Get the public chat room for this session"""
        from api.models.enums import ChatRoomType
        return next((room for room in self.chat_rooms if room.room_type == ChatRoomType.PUBLIC), None)
    
    @property
    def backstage_chat_room(self):
        """Get the backstage chat room for this session"""
        from api.models.enums import ChatRoomType
        return next((room for room in self.chat_rooms if room.room_type == ChatRoomType.BACKSTAGE), None)
    
    @property
    def has_chat_enabled(self):
        """Check if any chat is enabled for this session"""
        return self.chat_mode != SessionChatMode.DISABLED
    
    @property
    def has_public_chat_enabled(self):
        """Check if public chat is enabled for this session"""
        return self.chat_mode == SessionChatMode.ENABLED
    
    @property
    def has_backstage_chat_enabled(self):
        """Check if backstage chat is enabled for this session"""
        return self.chat_mode in [SessionChatMode.ENABLED, SessionChatMode.BACKSTAGE_ONLY]

    def get_speakers_by_role(self, role: SessionSpeakerRole):
        """Get all speakers with specific role"""
        from api.models import SessionSpeaker

        return [
            speaker.user
            for speaker in SessionSpeaker.query.filter_by(
                session_id=self.id, role=role
            ).all()
        ]

    def get_speakers_with_details(self):
        """Get speakers with their roles and details combined"""
        return [
            {
                "id": speaker.id,
                "full_name": speaker.full_name,
                "title": speaker.title,
                "company_name": speaker.company_name,
                "image_url": speaker.image_url,
                "social_links": speaker.social_links,
                "role": next(
                    (
                        ss.role.value
                        for ss in self.session_speakers
                        if ss.user_id == speaker.id
                    ),
                    None,
                ),
            }
            for speaker in self.speakers
        ]

    def has_speaker_conflicts(self, user):
        """Check if speaker has conflicts with other sessions"""
        user_sessions = user.speaking_sessions

        for session in user_sessions:
            if session.id != self.id:  # Don't check against self
                if (
                    session.day_number == self.day_number  # Same day
                    and self.start_time < session.end_time
                    and self.end_time > session.start_time
                ):
                    return True
        return False

    def save(self):
        """Save with validation"""
        self.validate_times()
        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_upcoming(cls, event_id):
        """Get upcoming sessions for event"""
        now = datetime.now(timezone.utc)

        # First get the event
        from api.models import Event

        event = Event.query.get(event_id)
        if not event:
            return []

        # Calculate current day number
        current_day = (now.date() - event.start_date.date()).days + 1
        current_time = now.time()

        return (
            cls.query.filter(
                cls.event_id == event_id,
                cls.status == SessionStatus.SCHEDULED,
                db.or_(
                    cls.day_number > current_day,
                    db.and_(
                        cls.day_number == current_day,
                        cls.start_time > current_time,
                    ),
                ),
            )
            .order_by(cls.day_number, cls.start_time)
            .all()
        )

    @classmethod
    def get_by_day(cls, event_id, day_number):
        """Get all sessions for specific day"""
        return (
            cls.query.filter(
                cls.event_id == event_id, cls.day_number == day_number
            )
            .order_by(cls.start_time)
            .all()
        )
