from api.extensions import db
from api.models.enums import OrganizationUserRole


class OrganizationUser(db.Model):
    __tablename__ = "organization_users"

    organization_id = db.Column(
        db.BigInteger,
        db.ForeignKey("organizations.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id = db.Column(
        db.BigInteger, db.ForeignKey("users.id"), primary_key=True
    )
    role = db.Column(db.Enum(OrganizationUserRole), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )

    organization = db.relationship(
        "Organization",
        back_populates="organization_users",
        overlaps="users,organizations",
    )
    user = db.relationship(
        "User",
        back_populates="organization_users",
        overlaps="organizations,users",
    )

    def update_role(self, new_role: OrganizationUserRole):
        """Update user's role with validation"""
        # Check if this would remove the last owner
        if (
            self.role == OrganizationUserRole.OWNER
            and new_role != OrganizationUserRole.OWNER
        ):
            # Count other owners
            other_owners = OrganizationUser.query.filter_by(
                organization_id=self.organization_id,
                role=OrganizationUserRole.OWNER,
            ).count()
            if other_owners <= 1:
                raise ValueError("Cannot remove last owner")

        old_role = self.role
        self.role = new_role
        return old_role != new_role  # Returns True if role changed

    @classmethod
    def get_by_role(cls, organization_id, role: OrganizationUserRole):
        """Get all organization users with specific role"""
        return cls.query.filter_by(
            organization_id=organization_id, role=role
        ).all()

    @property
    def user_name(self):
        """Get user's full name"""
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def is_owner(self):
        """Check if user is owner"""
        return self.role == OrganizationUserRole.OWNER

    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == OrganizationUserRole.ADMIN

    @property
    def first_name(self):
        """Get user's first name"""
        return self.user.first_name

    @property
    def last_name(self):
        """Get user's last name"""
        return self.user.last_name

    @property
    def sort_name(self):
        """Get name for sorting (last name first)"""
        return f"{self.user.last_name}, {self.user.first_name}"

    @property
    def image_url(self):
        """Get user's image URL"""
        return self.user.image_url

    @property
    def social_links(self):
        """Get user's social links"""
        return self.user.social_links
    
    @property
    def email(self):
        """Get user's email"""
        return self.user.email
