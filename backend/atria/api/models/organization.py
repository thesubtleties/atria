from api.extensions import db
from api.models.enums import OrganizationUserRole
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timezone


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Mux BYOA (Bring Your Own Account) credentials

    # Mux API credentials (OPTIONAL - for future analytics/management features)
    # Currently unused - users manage Mux assets via Mux dashboard
    mux_token_id = db.Column(db.String(255), nullable=True)  # API Token ID (public)
    mux_token_secret = db.Column(db.Text, nullable=True)  # API Token Secret (ENCRYPTED)

    # Mux signing credentials (OPTIONAL - only needed for SIGNED playback policy)
    # Used to generate JWT tokens for secure video playback at organization level
    mux_signing_key_id = db.Column(db.String(255), nullable=True)  # Signing Key ID (public)
    mux_signing_private_key = db.Column(db.Text, nullable=True)  # RSA Private Key (ENCRYPTED)

    # JaaS (Jitsi as a Service) BYOA credentials
    # Used to generate JWT tokens for Jitsi video conferencing
    jaas_app_id = db.Column(db.String(255), nullable=True)  # JaaS App ID (vpaas-magic-cookie-xxx)
    jaas_api_key = db.Column(db.String(255), nullable=True)  # API Key ID for JWT header kid
    jaas_private_key_encrypted = db.Column(db.Text, nullable=True)  # RSA Private Key (ENCRYPTED)

    # Relationships
    users = db.relationship(
        "User",
        secondary="organization_users",
        back_populates="organizations",
        overlaps="organization_users",
    )
    events = db.relationship(
        "Event",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    organization_users = db.relationship(
        "OrganizationUser",
        back_populates="organization",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def add_user(self, user, role: OrganizationUserRole):
        """Add user to organization with role"""
        from api.models import OrganizationUser

        if self.has_user(user):
            raise ValueError("User already in organization")

        org_user = OrganizationUser(
            organization_id=self.id, user_id=user.id, role=role
        )
        db.session.add(org_user)

    def remove_user(self, user):
        """Remove user from organization"""
        from api.models import OrganizationUser

        # Can't remove the last owner
        if (
            self.get_user_role(user) == OrganizationUserRole.OWNER
            and self.owner_count == 1
        ):
            raise ValueError("Cannot remove last owner")

        OrganizationUser.query.filter_by(
            organization_id=self.id, user_id=user.id
        ).delete()

    def get_user_role(self, user) -> OrganizationUserRole:
        """Get user's role in organization"""
        from api.models import OrganizationUser

        org_user = OrganizationUser.query.filter_by(
            organization_id=self.id, user_id=user.id
        ).first()
        return org_user.role if org_user else None

    def has_user(self, user) -> bool:
        """Check if user has an explicit OrganizationUser record

        This method only checks for actual organization membership.
        For organizations, has_user() and user_can_access() are the same
        since there's no implicit access like with events.
        """
        return user in self.users

    def user_can_access(self, user) -> bool:
        """Check if user can access this organization

        For organizations, this is the same as has_user().
        Provided for API consistency with Event model.
        """
        return self.has_user(user)

    def get_users_by_role(self, role: OrganizationUserRole):
        """Get all users with specific role"""
        from api.models import OrganizationUser

        return [
            org_user.user
            for org_user in OrganizationUser.query.filter_by(
                organization_id=self.id, role=role
            ).all()
        ]

    def is_user_admin_or_owner(self, user) -> bool:
        user_role = self.get_user_role(user)
        return user_role in [
            OrganizationUserRole.OWNER,
            OrganizationUserRole.ADMIN,
        ]

    @property
    def owner_count(self):
        """Get number of owners"""
        from api.models import OrganizationUser

        return OrganizationUser.query.filter_by(
            organization_id=self.id, role=OrganizationUserRole.OWNER
        ).count()

    @property
    def member_count(self):
        """Get total number of users"""
        from api.models import OrganizationUser

        return OrganizationUser.query.filter_by(
            organization_id=self.id
        ).count()

    @property
    def upcoming_events(self):
        """Get organization's upcoming events using relationship"""
        return [
            event
            for event in self.events
            if event.start_date > datetime.datetime.now(timezone.utc)
        ]

    @property
    def user_is_admin_or_owner(self):
        """Determine if current JWT user is admin or owner"""

        current_user_id = int(get_jwt_identity())
        # Import here to avoid circular imports
        from api.models import User

        user = User.query.get(current_user_id)
        if not user:
            return False
        user_role = self.get_user_role(user)
        return user_role in [
            OrganizationUserRole.OWNER,
            OrganizationUserRole.ADMIN,
        ]

    def transfer_ownership(self, from_user, to_user):
        """Transfer organization ownership"""
        if not self.has_user(from_user) or not self.has_user(to_user):
            raise ValueError("Both users must be in organization")

        if self.get_user_role(from_user) != OrganizationUserRole.OWNER:
            raise ValueError("Current user is not owner")

        with db.session.begin_nested():
            # Remove owner role from current owner
            self.update_user_role(from_user, OrganizationUserRole.ADMIN)
            # Add owner role to new owner
            self.update_user_role(to_user, OrganizationUserRole.OWNER)

    def update_user_role(self, user, new_role: OrganizationUserRole):
        """Update user's role"""
        from api.models import OrganizationUser

        org_user = OrganizationUser.query.filter_by(
            organization_id=self.id, user_id=user.id
        ).first()

        if not org_user:
            raise ValueError("User not in organization")

        if (
            org_user.role == OrganizationUserRole.OWNER
            and new_role != OrganizationUserRole.OWNER
            and self.owner_count == 1
        ):
            raise ValueError("Cannot remove last owner")

        org_user.role = new_role

    # Mux credential management with automatic encryption/decryption
    def set_mux_credentials(
        self, token_id: str, token_secret: str, signing_key_id: str = None, signing_private_key: str = None
    ):
        """Set Mux API credentials (encrypts secrets automatically)"""
        from api.commons.encryption import encrypt_secret

        self.mux_token_id = token_id
        self.mux_token_secret = encrypt_secret(token_secret)
        self.mux_signing_key_id = signing_key_id
        self.mux_signing_private_key = encrypt_secret(signing_private_key) if signing_private_key else None

    def get_mux_token_secret(self) -> str:
        """Get decrypted Mux token secret"""
        from api.commons.encryption import decrypt_secret

        return decrypt_secret(self.mux_token_secret)

    def get_mux_signing_private_key(self) -> str:
        """Get decrypted Mux signing private key"""
        from api.commons.encryption import decrypt_secret

        return decrypt_secret(self.mux_signing_private_key)

    def clear_mux_credentials(self):
        """Remove all Mux credentials from organization"""
        self.mux_token_id = None
        self.mux_token_secret = None
        self.mux_signing_key_id = None
        self.mux_signing_private_key = None

    @property
    def has_mux_credentials(self) -> bool:
        """Check if organization has Mux API credentials configured"""
        return bool(self.mux_token_id and self.mux_token_secret)

    @property
    def has_mux_signing_credentials(self) -> bool:
        """Check if organization has Mux signing credentials for signed URLs"""
        return bool(self.mux_signing_key_id and self.mux_signing_private_key)

    # JaaS credential management with automatic encryption/decryption
    def set_jaas_credentials(
        self, app_id: str, api_key: str, private_key: str
    ):
        """Set JaaS credentials (encrypts private key automatically)"""
        from api.commons.encryption import encrypt_secret

        self.jaas_app_id = app_id
        self.jaas_api_key = api_key
        self.jaas_private_key_encrypted = encrypt_secret(private_key)

    def get_jaas_private_key(self) -> str:
        """Get decrypted JaaS private key"""
        from api.commons.encryption import decrypt_secret

        return decrypt_secret(self.jaas_private_key_encrypted)

    def clear_jaas_credentials(self):
        """Remove all JaaS credentials from organization"""
        self.jaas_app_id = None
        self.jaas_api_key = None
        self.jaas_private_key_encrypted = None

    @property
    def has_jaas_credentials(self) -> bool:
        """Check if organization has JaaS credentials configured"""
        return bool(self.jaas_app_id and self.jaas_api_key and self.jaas_private_key_encrypted)
