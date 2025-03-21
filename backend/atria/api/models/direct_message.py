# api/models/direct_message.py
from api.extensions import db
from api.models.enums import MessageStatus
from datetime import datetime, timezone


class DirectMessage(db.Model):
    __tablename__ = "direct_messages"

    id = db.Column(db.BigInteger, primary_key=True)
    thread_id = db.Column(
        db.BigInteger,
        db.ForeignKey("direct_message_threads.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content = db.Column(db.Text, nullable=False)
    encrypted_content = db.Column(db.Text)  # Only used for E2EE messages
    status = db.Column(db.Enum(MessageStatus), default=MessageStatus.SENT)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    thread = db.relationship("DirectMessageThread", back_populates="messages")
    sender = db.relationship("User", back_populates="sent_direct_messages")

    def __repr__(self):
        return f"DirectMessage(id={self.id}, thread_id={self.thread_id}, sender_id={self.sender_id})"
