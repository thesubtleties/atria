from api.extensions import db
from api.models.enums import OrganizationUserRole


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

    # Relationships
    users = db.relationship(
        "User",
        secondary="organization_users",
        back_populates="organizations",
        overlaps="organization_users",
    )
    events = db.relationship("Event", back_populates="organization")
    organization_users = db.relationship(
        "OrganizationUser",
        back_populates="organization",
        overlaps="users,organizations",
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
        """Check if user is in organization"""
        return user in self.users

    def get_users_by_role(self, role: OrganizationUserRole):
        """Get all users with specific role"""
        from api.models import OrganizationUser

        return [
            org_user.user
            for org_user in OrganizationUser.query.filter_by(
                organization_id=self.id, role=role
            ).all()
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
        return (
            self.events.filter(db.text("start_date > CURRENT_TIMESTAMP"))
            .order_by(db.text("start_date"))
            .all()
        )

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
