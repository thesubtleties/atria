# api/models/chat_room.py
from api.extensions import db
from api.models.enums import ChatRoomType
from datetime import datetime, timezone


class ChatRoom(db.Model):
    __tablename__ = "chat_rooms"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id = db.Column(
        db.BigInteger,
        db.ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=True,
    )
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    room_type = db.Column(db.Enum(ChatRoomType), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship("Event", back_populates="chat_rooms")
    session = db.relationship("Session", back_populates="chat_rooms")
    messages = db.relationship(
        "ChatMessage", back_populates="room", cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        # Unique constraint for session + room_type combination
        db.UniqueConstraint('session_id', 'room_type', name='unique_session_room_type'),
        # Either global/admin (no session) or public/backstage (with session)
        db.CheckConstraint(
            "(room_type IN ('global', 'admin') AND session_id IS NULL) OR "
            "(room_type IN ('public', 'backstage') AND session_id IS NOT NULL)",
            name="chat_room_type_session_check"
        ),
    )

    def __repr__(self):
        return f"ChatRoom(id={self.id}, name='{self.name}', type={self.room_type}, event_id={self.event_id})"
