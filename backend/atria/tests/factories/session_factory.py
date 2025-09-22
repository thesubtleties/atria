"""Factory for creating test Session instances."""

import factory
from factory import Faker, SubFactory
from datetime import datetime, time, timedelta, timezone
from api.models import Session, SessionSpeaker
from api.models.enums import SessionType, SessionSpeakerRole, SessionStatus, SessionChatMode
from api.extensions import db
from .user_factory import UserFactory, SpeakerUserFactory
from .event_factory import EventFactory


class SessionFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating Session instances for testing."""

    class Meta:
        model = Session
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    # Required fields - use correct field names and types
    title = Faker('catch_phrase')  # Changed from 'name' to 'title'
    short_description = Faker('text', max_nb_chars=150)
    description = Faker('text', max_nb_chars=300)

    # Event relationship
    event = SubFactory(EventFactory)
    event_id = factory.LazyAttribute(lambda obj: obj.event.id)

    # Session timing - Note: Uses Time not DateTime!
    start_time = time(10, 0)  # 10:00 AM
    end_time = time(11, 0)     # 11:00 AM

    # Required enums - use enum objects directly
    # Session model handles enum objects differently than Event model
    status = SessionStatus.SCHEDULED
    session_type = SessionType.PRESENTATION
    chat_mode = SessionChatMode.ENABLED

    # Day number
    day_number = 1

    # URLs
    stream_url = factory.Maybe(
        factory.LazyAttribute(lambda obj: obj.session_type in [SessionType.KEYNOTE, SessionType.PRESENTATION]),
        yes_declaration=Faker('url'),
        no_declaration=None
    )
    recording_url = None  # Set after event
    slides_url = factory.Maybe(
        factory.LazyAttribute(lambda obj: obj.session_type == SessionType.PRESENTATION),
        yes_declaration=Faker('url'),
        no_declaration=None
    )

    @factory.post_generation
    def speakers(self, create, extracted, **kwargs):
        """Add speakers to the session."""
        if not create:
            return

        if extracted:
            # Specific speakers were provided
            for i, user in enumerate(extracted):
                role = SessionSpeakerRole.HOST if i == 0 else SessionSpeakerRole.SPEAKER
                SessionSpeakerFactory(
                    session=self,
                    user=user,
                    role=role
                )
        else:
            # Create a default speaker
            SessionSpeakerFactory(
                session=self,
                role=SessionSpeakerRole.SPEAKER
            )


class SessionSpeakerFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating SessionSpeaker association instances."""

    class Meta:
        model = SessionSpeaker
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    session = SubFactory(SessionFactory)
    user = SubFactory(SpeakerUserFactory)
    role = SessionSpeakerRole.SPEAKER
    display_order = factory.Sequence(int)


class KeynoteSessionFactory(SessionFactory):
    """Factory for creating keynote sessions."""

    session_type = SessionType.KEYNOTE
    name = factory.LazyAttribute(lambda obj: f"Keynote: {Faker('catch_phrase').generate()}")
    capacity = 500
    stream_url = Faker('url')


class WorkshopSessionFactory(SessionFactory):
    """Factory for creating workshop sessions."""

    session_type = SessionType.WORKSHOP
    name = factory.LazyAttribute(lambda obj: f"Workshop: {Faker('catch_phrase').generate()}")
    capacity = 30
    end_time = factory.LazyAttribute(
        lambda obj: obj.start_time + timedelta(hours=3)  # Workshops are longer
    )


class PanelSessionFactory(SessionFactory):
    """Factory for creating panel sessions."""

    session_type = SessionType.PANEL
    name = factory.LazyAttribute(lambda obj: f"Panel: {Faker('catch_phrase').generate()}")

    @factory.post_generation
    def speakers(self, create, extracted, **kwargs):
        """Add multiple panelists to the session."""
        if not create:
            return

        if extracted:
            for i, user in enumerate(extracted):
                if i == 0:
                    role = SessionSpeakerRole.MODERATOR
                else:
                    role = SessionSpeakerRole.PANELIST
                SessionSpeakerFactory(
                    session=self,
                    user=user,
                    role=role
                )
        else:
            # Create a moderator and 3 panelists
            SessionSpeakerFactory(session=self, role=SessionSpeakerRole.MODERATOR)
            for _ in range(3):
                SessionSpeakerFactory(session=self, role=SessionSpeakerRole.PANELIST)