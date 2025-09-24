"""Factory for creating test Organization instances."""

import factory
from factory import Faker, SubFactory
from api.models import Organization, OrganizationUser
from api.models.enums import OrganizationUserRole
from api.extensions import db
from .user_factory import UserFactory


class OrganizationFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating Organization instances for testing."""

    class Meta:
        model = Organization
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    name = Faker('company')

    # Timestamps handled by model
    # created_at and updated_at are auto-generated

    @factory.post_generation
    def owner(self, create, extracted, **kwargs):
        """Create an owner for the organization."""
        if not create:
            return

        if extracted:
            # A specific user was passed to be the owner
            OrganizationUserFactory(
                organization=self,
                user=extracted,
                role=OrganizationUserRole.OWNER
            )
        else:
            # Create a new user as owner
            OrganizationUserFactory(
                organization=self,
                role=OrganizationUserRole.OWNER
            )

    @factory.post_generation
    def members(self, create, extracted, **kwargs):
        """Add members to the organization."""
        if not create:
            return

        if extracted:
            # A list of users was passed in
            for user in extracted:
                OrganizationUserFactory(
                    organization=self,
                    user=user,
                    role=OrganizationUserRole.MEMBER
                )


class OrganizationUserFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating OrganizationUser association instances."""

    class Meta:
        model = OrganizationUser
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    organization = SubFactory(OrganizationFactory)
    user = SubFactory(UserFactory)
    role = factory.Iterator([
        OrganizationUserRole.MEMBER,
        OrganizationUserRole.ADMIN,
        OrganizationUserRole.OWNER
    ])

    # Timestamps handled by model


class TestOrganizationFactory(OrganizationFactory):
    """Factory for creating test organizations with predictable data."""

    name = factory.Sequence(lambda n: f"Test Organization {n}")