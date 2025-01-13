from api.extensions import db
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole
from datetime import datetime, timezone


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger, db.ForeignKey("events.id"), nullable=False
    )
    status = db.Column(db.Enum(SessionStatus), nullable=False)
    session_type = db.Column(db.Enum(SessionType), nullable=False)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime(timezone=True), nullable=False)
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)
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
        overlaps="speakers",
        cascade="all, delete-orphan",
    )

    def validate_times(self):
        """Validate session times are within event dates"""
        if hasattr(self, "event") and self.event:  # Check if event is loaded
            if (
                self.start_time < self.event.start_date
                or self.end_time > self.event.end_date
            ):
                raise ValueError("Session must be within event dates")

    def update_times(self, new_start_time, new_end_time):
        """
        Update both times together safely.
        """
        if new_end_time <= new_start_time:
            raise ValueError("End time must be after start time")

        if (
            new_start_time < self.event.start_date
            or new_end_time > self.event.end_date
        ):
            raise ValueError("Session must be within event dates")

        with db.session.begin_nested():
            self.start_time = new_start_time
            self.end_time = new_end_time

    def add_speaker(self, user, role=SessionSpeakerRole.SPEAKER):
        """Add speaker with role to session"""
        from api.models import (
            SessionSpeaker,
        )

        if user in self.speakers:
            raise ValueError("Already a speaker for this session")

        speaker = SessionSpeaker(
            session_id=self.id, user_id=user.id, role=role
        )
        db.session.add(speaker)

        self.event.add_speaker(user)

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
        return int((self.end_time - self.start_time).total_seconds() / 60)

    @property
    def is_upcoming(self):
        """Check if session is upcoming"""
        return (
            self.status == SessionStatus.SCHEDULED
            and self.start_time > datetime.now(timezone.utc)
        )

    @property
    def is_in_progress(self):
        """Check if session is currently running"""
        now = datetime.now(timezone.utc)
        return (
            self.status == SessionStatus.LIVE
            and self.start_time <= now <= self.end_time
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

    def get_speakers_by_role(self, role: SessionSpeakerRole):
        """Get all speakers with specific role"""
        from api.models import SessionSpeaker

        return [
            speaker.user
            for speaker in SessionSpeaker.query.filter_by(
                session_id=self.id, role=role
            ).all()
        ]

    def has_speaker_conflicts(self, user):
        """Check if speaker has conflicts with other sessions"""
        user_sessions = user.speaking_sessions

        for session in user_sessions:
            if session.id != self.id:  # Don't check against self
                if (
                    self.start_time < session.end_time
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
        return (
            cls.query.filter(
                cls.event_id == event_id,
                cls.status == SessionStatus.SCHEDULED,
                cls.start_time > datetime.now(timezone.utc),
            )
            .order_by(cls.start_time)
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
