from api.extensions import db
from api.models.enums import EventUserRole


class EventUser(db.Model):
    __tablename__ = "event_users"

    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        primary_key=True,
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

    @property
    def id(self):
        """Get user's id"""
        return self.user.id

    @property
    def full_name(self):
        """Get user's full name"""
        return self.user.full_name

    @property
    def email(self):
        """Get user's email"""
        return self.user.email

    @property
    def first_name(self):
        """Get user's first name"""
        return self.user.first_name

    @property
    def last_name(self):
        """Get user's last name"""
        return self.user.last_name

    @property
    def sort_name(self):
        """Get name for sorting (last name first)"""
        return f"{self.user.last_name}, {self.user.first_name}"

    @property
    def image_url(self):
        """Get user's image URL or return None"""
        return self.user.image_url

    @property
    def social_links(self):
        """Get user's social links"""
        return self.user.social_links
    
    @property
    def company_name(self):
        """Get user's company name"""
        return self.user.company_name
    
    @property
    def title(self):
        """Get user's title"""
        return self.user.title
    
    @property
    def session_count(self):
        """Get count of sessions this speaker is assigned to"""
        if self.role != EventUserRole.SPEAKER:
            return 0
        # Avoid circular import by importing here
        from api.models import SessionSpeaker
        return SessionSpeaker.query.filter_by(
            user_id=self.user_id
        ).join(SessionSpeaker.session).filter_by(
            event_id=self.event_id
        ).count()
    
    @property
    def sessions(self):
        """Get list of sessions this speaker is assigned to"""
        if self.role != EventUserRole.SPEAKER:
            return []
        # Avoid circular import by importing here
        from api.models import SessionSpeaker, Session
        speaker_sessions = db.session.query(SessionSpeaker).join(Session).filter(
            SessionSpeaker.user_id == self.user_id,
            Session.event_id == self.event_id
        ).all()
        
        return [{
            'id': ss.session.id,
            'title': ss.session.title,
            'start_time': ss.session.start_time.strftime('%H:%M') if ss.session.start_time else None,
            'end_time': ss.session.end_time.strftime('%H:%M') if ss.session.end_time else None,
            'day_number': ss.session.day_number,
            'role': ss.role.value if ss.role else None,
            'session_type': ss.session.session_type.value if ss.session.session_type else None
        } for ss in speaker_sessions]

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
