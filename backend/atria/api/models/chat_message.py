# api/models/chat_message.py
from api.extensions import db
from datetime import datetime, timezone


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.BigInteger, primary_key=True)
    room_id = db.Column(
        db.BigInteger,
        db.ForeignKey("chat_rooms.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    deleted_by_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    room = db.relationship("ChatRoom", back_populates="messages")
    user = db.relationship("User", foreign_keys=[user_id], back_populates="chat_messages")
    deleted_by = db.relationship(
        "User",
        foreign_keys=[deleted_by_id],
        backref="deleted_messages",
        lazy="joined",
    )

    @property
    def is_deleted(self):
        """Check if message has been soft deleted"""
        return self.deleted_at is not None

    def __repr__(self):
        return f"ChatMessage(id={self.id}, room_id={self.room_id}, user_id={self.user_id})"
