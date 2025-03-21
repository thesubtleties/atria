# api/models/user_key_backup.py
from api.extensions import db
from datetime import datetime, timezone


class UserKeyBackup(db.Model):
    __tablename__ = "user_key_backups"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    encrypted_private_key = db.Column(db.Text, nullable=False)
    salt = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    # Relationships
    user = db.relationship("User", back_populates="key_backup")

    __table_args__ = (
        db.UniqueConstraint("user_id", name="uix_user_key_backup"),
    )

    def __repr__(self):
        return f"UserKeyBackup(id={self.id}, user_id={self.user_id})"
