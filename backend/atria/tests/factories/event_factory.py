"""Factory for creating test Event instances."""

import factory
from factory import Faker, SubFactory
from datetime import datetime, timedelta, timezone
from api.models import Event, EventUser
from api.models.enums import EventStatus, EventUserRole, EventFormat, EventType, USState
from api.extensions import db
from .user_factory import UserFactory
from .organization_factory import OrganizationFactory


class EventFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating Event instances for testing."""

    class Meta:
        model = Event
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    # Basic information
    title = Faker('catch_phrase')
    description = Faker('text', max_nb_chars=500)
    event_type = EventType.CONFERENCE.name  # "CONFERENCE"
    company_name = Faker('company')
    slug = factory.LazyAttribute(lambda obj: obj.title.lower().replace(' ', '-')[:50])

    # Dates - Events are 2 days in the future by default
    start_date = factory.LazyFunction(
        lambda: (datetime.now(timezone.utc) + timedelta(days=2)).date()
    )
    end_date = factory.LazyAttribute(
        lambda obj: (datetime.fromisoformat(str(obj.start_date)) + timedelta(days=1)).date()
    )

    # Organization relationship - SubFactory.id to get the ID
    organization = factory.SubFactory(OrganizationFactory)
    organization_id = factory.LazyAttribute(lambda obj: obj.organization.id)

    # Event settings - DB stores UPPERCASE enum values
    event_type = "CONFERENCE"  # Required field, was missing
    event_format = "IN_PERSON"  # Now exists in DB after migration!
    status = "PUBLISHED"  # DB stores UPPERCASE
    is_private = False

    # Venue information
    venue_name = Faker('company')
    venue_address = Faker('street_address')
    venue_city = Faker('city')
    venue_state = USState.CA.name  # "CA"
    venue_country = "United States"

    # Branding as JSON
    branding = factory.LazyAttribute(
        lambda obj: {
            "primary_color": "#007bff",
            "secondary_color": "#6c757d",
            "font_family": "Inter, sans-serif"
        }
    )

    # Hero section
    hero_description = Faker('text', max_nb_chars=200)
    hero_images = factory.LazyAttribute(lambda obj: [])

    # Sections as JSON
    sections = factory.LazyAttribute(
        lambda obj: {
            "about": True,
            "speakers": True,
            "sessions": True,
            "sponsors": True,
            "networking": True
        }
    )

    # Icebreakers for networking
    icebreakers = factory.LazyAttribute(
        lambda obj: [
            "Hi! I noticed we're both interested in similar sessions. Would you like to connect?",
            "Hello! I saw your profile and would love to discuss technology with you.",
            "I'm looking to connect with others in the tech field. Would you be open to chatting?",
            "Hi there! I enjoyed your question during the session. Could we discuss it further?",
            "Hello! I'm exploring opportunities in this field. Would you have a few minutes to chat?",
            "I see we're both from the same industry. I'd love to connect!",
            "Hi! I'm interested in learning more about your work. Could we chat?",
            "Hello! I'm building a network of professionals. Would you like to connect?",
        ]
    )

    # Sponsor tiers configuration
    sponsor_tiers = factory.LazyAttribute(
        lambda obj: [
            {"id": "platinum", "name": "Platinum Sponsor", "order": 1, "color": "#E5E4E2"},
            {"id": "gold", "name": "Gold Sponsor", "order": 2, "color": "#DEAE4A"},
            {"id": "silver", "name": "Silver Sponsor", "order": 3, "color": "#C7D3DB"},
            {"id": "bronze", "name": "Bronze Sponsor", "order": 4, "color": "#BB8F4C"},
            {"id": "community", "name": "Community Partner", "order": 5, "color": "#8B5CF6"},
        ]
    )

    @factory.post_generation
    def creator(self, create, extracted, **kwargs):
        """Add creator as admin of the event."""
        if not create:
            return

        user = extracted or UserFactory()
        EventUserFactory(
            event=self,
            user=user,
            role=EventUserRole.ADMIN
        )

    @factory.post_generation
    def attendees(self, create, extracted, **kwargs):
        """Add attendees to the event."""
        if not create:
            return

        if extracted:
            for user in extracted:
                EventUserFactory(
                    event=self,
                    user=user,
                    role=EventUserRole.ATTENDEE
                )

    @factory.post_generation
    def speakers(self, create, extracted, **kwargs):
        """Add speakers to the event."""
        if not create:
            return

        if extracted:
            for user in extracted:
                EventUserFactory(
                    event=self,
                    user=user,
                    role=EventUserRole.SPEAKER
                )


class EventUserFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating EventUser association instances."""

    class Meta:
        model = EventUser
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    event = SubFactory(EventFactory)
    user = SubFactory(UserFactory)
    role = EventUserRole.ATTENDEE.name  # "ATTENDEE"
    is_banned = False

    # Speaker-specific fields
    speaker_bio = factory.Maybe(
        factory.LazyAttribute(lambda obj: obj.role == EventUserRole.SPEAKER.name),
        yes_declaration=Faker('paragraph'),
        no_declaration=None
    )
    speaker_title = factory.Maybe(
        factory.LazyAttribute(lambda obj: obj.role == EventUserRole.SPEAKER.name),
        yes_declaration=Faker('job'),
        no_declaration=None
    )


class VirtualEventFactory(EventFactory):
    """Factory for creating virtual events."""

    event_format = "VIRTUAL"  # DB stores UPPERCASE
    venue_name = None
    venue_address = None
    venue_city = None
    venue_state = None
    venue_country = None


class HybridEventFactory(EventFactory):
    """Factory for creating hybrid events."""

    event_format = "HYBRID"  # DB stores UPPERCASE