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
    privacy_overrides = db.Column(db.JSON, nullable=True, default=None)
    is_banned = db.Column(db.Boolean, nullable=False, default=False)
    banned_at = db.Column(db.DateTime(timezone=True), nullable=True)
    banned_by = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    ban_reason = db.Column(db.Text, nullable=True)
    is_chat_banned = db.Column(db.Boolean, nullable=False, default=False)
    chat_ban_until = db.Column(db.DateTime(timezone=True), nullable=True)
    chat_ban_reason = db.Column(db.Text, nullable=True)
    moderation_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship(
        "Event", 
        foreign_keys=[event_id],
        back_populates="event_users", 
        overlaps="users,events"
    )
    user = db.relationship(
        "User", 
        foreign_keys=[user_id],
        back_populates="event_users", 
        overlaps="events,users"
    )
    banned_by_user = db.relationship(
        "User",
        foreign_keys=[banned_by]
    )

    __table_args__ = (
        db.Index('idx_event_users_user_event', 'user_id', 'event_id'),
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
        # Use existing relationship instead of manual query to avoid N+1 issues
        return len([
            ss for ss in self.user.session_speakers 
            if ss.session.event_id == self.event_id
        ])
    
    @property
    def sessions(self):
        """Get list of sessions this speaker is assigned to"""
        if self.role != EventUserRole.SPEAKER:
            return []
        # Use existing relationship instead of manual query to avoid N+1 issues
        return [{
            'id': ss.session.id,
            'title': ss.session.title,
            'start_time': ss.session.start_time.strftime('%H:%M') if ss.session.start_time else None,
            'end_time': ss.session.end_time.strftime('%H:%M') if ss.session.end_time else None,
            'day_number': ss.session.day_number,
            'role': ss.role.value if ss.role else None,
            'session_type': ss.session.session_type.value if ss.session.session_type else None
        } for ss in self.user.session_speakers 
          if ss.session.event_id == self.event_id]

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
    
    def is_active_in_event(self):
        """Check if user is active in event (not banned)"""
        return not self.is_banned
    
    def can_use_chat(self):
        """Check if user can use chat in this event"""
        if self.is_banned:
            return False
        if self.is_chat_banned:
            if self.chat_ban_until:
                from datetime import datetime, timezone
                if self.chat_ban_until > datetime.now(timezone.utc):
                    return False
            else:
                return False  # Permanent chat ban
        return True
