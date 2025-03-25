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

    # Relationships
    user1 = db.relationship("User", foreign_keys=[user1_id])
    user2 = db.relationship("User", foreign_keys=[user2_id])
    messages = db.relationship(
        "DirectMessage", back_populates="thread", cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user1_id", "user2_id", name="uix_dm_thread_users"
        ),
    )

    def get_other_user(self, user_id):
        """Get the other user in the conversation"""
        return self.user2 if self.user1_id == user_id else self.user1

    def __repr__(self):
        return f"DirectMessageThread(id={self.id}, user1_id={self.user1_id}, user2_id={self.user2_id})"
