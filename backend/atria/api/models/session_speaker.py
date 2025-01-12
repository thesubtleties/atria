from api.extensions import db
from api.models.enums import SessionSpeakerRole


class SessionSpeaker(db.Model):
    __tablename__ = "session_speakers"

    session_id = db.Column(
        db.BigInteger, db.ForeignKey("sessions.id"), primary_key=True
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

    # Add relationships
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.order is None:
            # Auto-set order if not provided
            existing = SessionSpeaker.query.filter_by(
                session_id=self.session_id
            ).count()
            self.order = existing + 1

    @property
    def speaker_name(self):
        """Get speaker's full name"""
        return f"{self.user.first_name} {self.user.last_name}"

    @classmethod
    def reorder_speakers(cls, session_id, new_order: list):
        """
        Reorder speakers for a session

        Args:
            session_id: The session ID
            new_order: List of user_ids in desired order
        """
        with db.session.begin_nested():
            for index, user_id in enumerate(new_order, 1):
                speaker = cls.query.filter_by(
                    session_id=session_id, user_id=user_id
                ).first()
                if speaker:
                    speaker.order = index

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

    def update_role(self, new_role: SessionSpeakerRole):
        """Update speaker's role"""
        old_role = self.role
        self.role = new_role

        return old_role != new_role  # Returns True if role changed
