"""Factory for creating test ChatRoom and ChatMessage instances."""

import factory
from factory import Faker, SubFactory
from datetime import datetime, timezone
from api.models import ChatRoom, ChatMessage
from api.models.enums import ChatRoomType, MessageType
from api.extensions import db
from .user_factory import UserFactory
from .event_factory import EventFactory
from .session_factory import SessionFactory


class ChatRoomFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating ChatRoom instances for testing."""

    class Meta:
        model = ChatRoom
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    name = Faker('catch_phrase')
    description = Faker('text', max_nb_chars=100)
    room_type = ChatRoomType.GLOBAL
    event = SubFactory(EventFactory)
    session = None  # Only for SESSION type rooms
    is_active = True

    @factory.lazy_attribute
    def session(self):
        """Set session only for SESSION type rooms."""
        if self.room_type == ChatRoomType.SESSION:
            return SessionFactory(event=self.event)
        return None


class ChatMessageFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating ChatMessage instances for testing."""

    class Meta:
        model = ChatMessage
        sqlalchemy_session = db.session
        sqlalchemy_session_persistence = "commit"

    content = Faker('text', max_nb_chars=200)
    user = SubFactory(UserFactory)
    chat_room = SubFactory(ChatRoomFactory)
    message_type = MessageType.USER
    is_edited = False
    is_deleted = False

    # Reply fields
    parent_id = None
    reply_to = None

    # Timestamps
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    updated_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))


class SystemMessageFactory(ChatMessageFactory):
    """Factory for creating system messages."""

    message_type = MessageType.SYSTEM
    content = factory.Iterator([
        "User joined the chat",
        "User left the chat",
        "Session is starting soon",
        "Q&A session has begun",
        "Room settings have been updated"
    ])


class AnnouncementMessageFactory(ChatMessageFactory):
    """Factory for creating announcement messages."""

    message_type = MessageType.ANNOUNCEMENT
    content = factory.Iterator([
        "Welcome to the event!",
        "Lunch break starts in 15 minutes",
        "Please join us for the networking session",
        "The keynote session is about to begin"
    ])