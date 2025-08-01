# api/models/password_reset.py
from api.extensions import db
from datetime import datetime, timezone


class PasswordReset(db.Model):
    __tablename__ = "password_resets"

    id = db.Column(db.BigInteger, primary_key=True)
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    email = db.Column(db.String(255), nullable=False, index=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used_at = db.Column(db.DateTime(timezone=True))

    # Relationships
    user = db.relationship("User", backref="password_resets")

    __table_args__ = (
        db.Index("idx_user_token", "user_id", "token"),
        db.Index("idx_token_expires_used", "token", "expires_at", "used_at"),
    )

    def __repr__(self):
        return f"PasswordReset(id={self.id}, email='{self.email}', user_id={self.user_id})"

    @property
    def is_expired(self):
        """Check if the reset token has expired"""
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def is_used(self):
        """Check if the reset token has been used"""
        return self.used_at is not None

    @property
    def is_valid(self):
        """Check if the token is valid (not expired and not used)"""
        return not self.is_expired and not self.is_used