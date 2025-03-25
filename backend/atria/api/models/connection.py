# api/models/connection.py
from api.extensions import db
from api.models.enums import ConnectionStatus
from datetime import datetime, timezone


class Connection(db.Model):
    __tablename__ = "connections"

    id = db.Column(db.BigInteger, primary_key=True)
    requester_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = db.Column(
        db.Enum(ConnectionStatus), default=ConnectionStatus.PENDING
    )
    icebreaker_message = db.Column(db.Text, nullable=False)
    originating_event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    requester = db.relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_connections"
    )
    recipient = db.relationship(
        "User",
        foreign_keys=[recipient_id],
        back_populates="received_connections",
    )
    originating_event = db.relationship(
        "Event", back_populates="originated_connections"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "requester_id", "recipient_id", name="uix_connection_users"
        ),
    )

    def __repr__(self):
        return f"Connection(id={self.id}, requester_id={self.requester_id}, recipient_id={self.recipient_id}, status={self.status})"
