# api/models/direct_message_thread.py
from api.extensions import db
from datetime import datetime, timezone


class DirectMessageThread(db.Model):
    __tablename__ = "direct_message_threads"

    id = db.Column(db.BigInteger, primary_key=True)
    user1_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    user2_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_encrypted = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    last_message_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    # Event scoping: NULL = global thread, event_id = event-scoped thread
    event_scope_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=True,
    )
    # Thread hiding: cutoff timestamps for each user
    user1_cutoff = db.Column(db.DateTime(timezone=True), nullable=True)
    user2_cutoff = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    user1 = db.relationship("User", foreign_keys=[user1_id])
    user2 = db.relationship("User", foreign_keys=[user2_id])
    messages = db.relationship(
        "DirectMessage", back_populates="thread", cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user1_id", "user2_id", "event_scope_id", name="uix_dm_thread_users_scope"
        ),
    )

    def get_other_user(self, user_id):
        """Get the other user in the conversation"""
        return self.user2 if self.user1_id == user_id else self.user1

    def get_user_cutoff(self, user_id):
        """Get the cutoff timestamp for a specific user"""
        if self.user1_id == user_id:
            return self.user1_cutoff
        elif self.user2_id == user_id:
            return self.user2_cutoff
        return None

    def set_user_cutoff(self, user_id, cutoff_time=None):
        """Set the cutoff timestamp for a specific user"""
        if cutoff_time is None:
            cutoff_time = datetime.now(timezone.utc)
            
        if self.user1_id == user_id:
            self.user1_cutoff = cutoff_time
        elif self.user2_id == user_id:
            self.user2_cutoff = cutoff_time
        else:
            raise ValueError("User is not part of this thread")

    def clear_user_cutoff(self, user_id):
        """Clear the cutoff timestamp for a specific user (restore full history)"""
        if self.user1_id == user_id:
            self.user1_cutoff = None
        elif self.user2_id == user_id:
            self.user2_cutoff = None
        else:
            raise ValueError("User is not part of this thread")

    def __repr__(self):
        return f"DirectMessageThread(id={self.id}, user1_id={self.user1_id}, user2_id={self.user2_id}, event_scope_id={self.event_scope_id})"
