# api/models/chat_room.py
from api.extensions import db
from datetime import datetime, timezone


class ChatRoom(db.Model):
    __tablename__ = "chat_rooms"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    is_global = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship("Event", back_populates="chat_rooms")
    messages = db.relationship(
        "ChatMessage", back_populates="room", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"ChatRoom(id={self.id}, name='{self.name}', event_id={self.event_id})"
