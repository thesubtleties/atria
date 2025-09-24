"""Factory for creating test User instances."""

import factory
from factory import Faker
from api.models import User
from api.extensions import db


class UserFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating User instances for testing."""

    class Meta:
        model = User
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    # Basic fields
    # Using sequence with @sbtl.ai to avoid email bounces if SMTP is triggered
    email = factory.Sequence(lambda n: f"testuser{n}@sbtl.ai")
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    password = "TestPassword123!"  # Use a consistent password for testing

    # Profile fields
    bio = Faker('text', max_nb_chars=200)
    company_name = Faker('company')
    title = Faker('job')
    image_url = Faker('image_url')

    # Social links as JSON field
    social_links = factory.LazyAttribute(
        lambda obj: {
            "linkedin": f"https://linkedin.com/in/{obj.first_name.lower()}-{obj.last_name.lower()}",
            "twitter": f"@{obj.first_name.lower()}{obj.last_name.lower()}"
        }
    )

    # Privacy settings as JSON field
    privacy_settings = factory.LazyAttribute(
        lambda obj: {
            "hide_email": False,
            "hide_from_public_attendees": False,
            "allow_direct_messages": True
        }
    )

    # User status flags
    is_active = True
    email_verified = True

    # Timestamps (handled by model defaults)
    # created_at and updated_at are auto-generated

    @factory.post_generation
    def organizations(self, create, extracted, **kwargs):
        """Handle many-to-many relationship with organizations."""
        if not create:
            return

        if extracted:
            # A list of organizations was passed in
            for org in extracted:
                self.organizations.append(org)

    @factory.post_generation
    def events(self, create, extracted, **kwargs):
        """Handle many-to-many relationship with events."""
        if not create:
            return

        if extracted:
            # A list of events was passed in
            for event in extracted:
                self.events.append(event)


class AdminUserFactory(UserFactory):
    """Factory for creating admin users."""

    first_name = "Admin"
    last_name = "User"
    email = factory.Sequence(lambda n: f"admin{n}@sbtl.ai")
    title = "Platform Administrator"


class SpeakerUserFactory(UserFactory):
    """Factory for creating speaker users with complete profiles."""

    bio = Faker('paragraph', nb_sentences=3)
    title = factory.Iterator([
        "CEO", "CTO", "VP of Engineering",
        "Principal Engineer", "Product Manager",
        "Research Scientist", "Director of Innovation"
    ])
    social_links = factory.LazyAttribute(
        lambda obj: {
            "linkedin": f"https://linkedin.com/in/{obj.first_name.lower()}-{obj.last_name.lower()}",
            "twitter": f"@{obj.first_name.lower()}{obj.last_name.lower()}",
            "website": "https://example.com"
        }
    )