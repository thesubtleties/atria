from api.extensions import db
from api.models.enums import EventUserRole


class EventUser(db.Model):
    __tablename__ = "event_users"

    event_id = db.Column(
        db.BigInteger, db.ForeignKey("events.id"), primary_key=True
    )
    user_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id"), primary_key=True
    )
    role = db.Column(db.Enum(EventUserRole), nullable=False)
    speaker_bio = db.Column(db.Text)
    speaker_title = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship(
        "Event", back_populates="event_users", overlaps="users,events"
    )
    user = db.relationship(
        "User", back_populates="event_users", overlaps="events,users"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-fill speaker info if role is speaker and we do not directly apply a bio
        if (
            self.role == EventUserRole.SPEAKER
            and not self.speaker_bio
            and hasattr(self.user, "bio")
        ):
            self.speaker_bio = self.user.bio
            self.speaker_title = self.user.title

    @property
    def user_name(self):
        """Get user's full name"""
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def is_speaker(self):
        """Check if user is a speaker"""
        return self.role == EventUserRole.SPEAKER

    @property
    def is_organizer(self):
        """Check if user is an organizer"""
        return self.role == EventUserRole.ORGANIZER

    def update_speaker_info(self, speaker_bio=None, speaker_title=None):
        """Update speaker bio and title"""
        if self.role != EventUserRole.SPEAKER:
            raise ValueError("Can only update speaker info for speakers")

        if speaker_bio is not None:
            self.speaker_bio = speaker_bio
        if speaker_title is not None:
            self.speaker_title = speaker_title

    @classmethod
    def get_by_role(cls, event_id, role: EventUserRole):
        """Get all event users with specific role"""
        return cls.query.filter_by(event_id=event_id, role=role).all()

    @classmethod
    def get_speaker_count(cls, event_id):
        """Get number of speakers for event"""
        return cls.query.filter_by(
            event_id=event_id, role=EventUserRole.SPEAKER
        ).count()

    @classmethod
    def get_attendee_count(cls, event_id):
        """Get number of attendees for event"""
        return cls.query.filter_by(
            event_id=event_id, role=EventUserRole.ATTENDEE
        ).count()
