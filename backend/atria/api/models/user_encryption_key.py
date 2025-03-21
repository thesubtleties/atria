# api/models/user_encryption_key.py
from api.extensions import db
from datetime import datetime, timezone


class UserEncryptionKey(db.Model):
    __tablename__ = "user_encryption_keys"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    public_key = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    user = db.relationship("User", back_populates="encryption_key")

    __table_args__ = (db.UniqueConstraint("user_id", name="uix_user_key"),)

    def __repr__(self):
        return f"UserEncryptionKey(id={self.id}, user_id={self.user_id})"
