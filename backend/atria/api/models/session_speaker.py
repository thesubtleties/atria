from api.extensions import db
from api.models.enums import SessionSpeakerRole


class SessionSpeaker(db.Model):
    __tablename__ = "session_speakers"

    session_id = db.Column(
        db.BigInteger,
        db.ForeignKey("sessions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id"), primary_key=True
    )
    # Update to use enum
    role = db.Column(db.Enum(SessionSpeakerRole), nullable=False)
    order = db.Column(db.BigInteger)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    session = db.relationship(
        "Session",
        back_populates="session_speakers",
        overlaps="speakers,speaking_sessions",
    )
    user = db.relationship(
        "User",
        back_populates="session_speakers",
        overlaps="speakers,speaking_sessions",
    )

    __table_args__ = (
        db.Index('idx_session_speakers_session_order', 'session_id', 'order'),
    )

    def __init__(self, **kwargs):
        if "order" in kwargs and kwargs["order"] is not None:
            session_id = kwargs["session_id"]
            requested_order = kwargs["order"]

            # Find all speakers that need to be shifted
            speakers_to_shift = (
                SessionSpeaker.query.filter(
                    SessionSpeaker.session_id == session_id,
                    SessionSpeaker.order >= requested_order,
                )
                .order_by(SessionSpeaker.order.desc())
                .all()
            )

            # Shift each speaker up by one
            for speaker in speakers_to_shift:
                speaker.order += 1

        super().__init__(**kwargs)

        if self.order is None:
            # Auto-set order if not provided (add to end)
            existing = SessionSpeaker.query.filter_by(
                session_id=self.session_id
            ).count()
            self.order = existing + 1

    @property
    def speaker_name(self):
        """Get speaker's full name"""
        return f"{self.user.first_name} {self.user.last_name}"

    @classmethod
    def get_ordered_speakers(cls, session_id):
        """Get speakers in order"""
        return (
            cls.query.filter_by(session_id=session_id)
            .order_by(cls.order)
            .all()
        )

    @classmethod
    def get_speakers_by_role(cls, session_id, role: SessionSpeakerRole):
        """Get all speakers with specific role for a session"""
        return (
            cls.query.filter_by(session_id=session_id, role=role)
            .order_by(cls.order)
            .all()
        )

    def update_order(self, new_order):
        """Update speaker order and maintain sequence"""
        old_order = self.order

        # Get all speakers
        speakers = (
            SessionSpeaker.query.filter_by(session_id=self.session_id)
            .order_by(SessionSpeaker.order)
            .all()
        )

        if new_order < 1 or new_order > len(speakers):
            raise ValueError(f"Order must be between 1 and {len(speakers)}")

        # Update orders
        if old_order < new_order:
            for speaker in speakers:
                if old_order < speaker.order <= new_order:
                    speaker.order -= 1
        else:
            for speaker in speakers:
                if new_order <= speaker.order < old_order:
                    speaker.order += 1

        self.order = new_order
        return speakers

    def update_role(self, new_role: SessionSpeakerRole):
        """Update speaker's role"""
        old_role = self.role
        self.role = new_role

        return old_role != new_role  # Returns True if role changed
