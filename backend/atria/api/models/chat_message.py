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

    # Relationships
    room = db.relationship("ChatRoom", back_populates="messages")
    user = db.relationship("User", back_populates="chat_messages")

    def __repr__(self):
        return f"ChatMessage(id={self.id}, room_id={self.room_id}, user_id={self.user_id})"
