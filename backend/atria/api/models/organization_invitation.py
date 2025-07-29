# api/models/organization_invitation.py
from api.extensions import db
from api.models.enums import OrganizationUserRole, InvitationStatus


class OrganizationInvitation(db.Model):
    __tablename__ = "organization_invitations"

    id = db.Column(db.BigInteger, primary_key=True)
    organization_id = db.Column(
        db.BigInteger,
        db.ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    email = db.Column(db.String(255), nullable=False, index=True)
    role = db.Column(db.Enum(OrganizationUserRole), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    status = db.Column(
        db.Enum(InvitationStatus),
        default=InvitationStatus.PENDING,
        nullable=False,
    )
    message = db.Column(db.Text)  # Optional personal message from inviter
    invited_by_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    accepted_at = db.Column(db.DateTime(timezone=True))
    declined_at = db.Column(db.DateTime(timezone=True))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)

    # Relationships
    organization = db.relationship("Organization", backref="invitations")
    invited_by = db.relationship(
        "User", foreign_keys=[invited_by_id], backref="sent_org_invitations"
    )
    user = db.relationship(
        "User", foreign_keys=[user_id], backref="received_org_invitations"
    )

    __table_args__ = (
        db.Index("idx_org_email", "organization_id", "email"),
        db.Index("idx_org_status", "organization_id", "status"),
        db.Index("idx_org_expires_at", "expires_at"),
    )

    def __repr__(self):
        return (
            f"OrganizationInvitation(id={self.id}, email='{self.email}', "
            f"org_id={self.organization_id}, role={self.role})"
        )