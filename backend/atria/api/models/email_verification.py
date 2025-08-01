# api/models/email_verification.py
from api.extensions import db
from datetime import datetime, timezone


class EmailVerification(db.Model):
    __tablename__ = "email_verifications"

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
    verified_at = db.Column(db.DateTime(timezone=True))

    # Relationships
    user = db.relationship("User", backref="email_verifications")

    __table_args__ = (
        db.Index("idx_user_email", "user_id", "email"),
        db.Index("idx_token_expires", "token", "expires_at"),
    )

    def __repr__(self):
        return f"EmailVerification(id={self.id}, email='{self.email}', user_id={self.user_id})"

    @property
    def is_expired(self):
        """Check if the verification token has expired"""
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def is_verified(self):
        """Check if the email has been verified"""
        return self.verified_at is not None