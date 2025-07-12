# api/services/session.py
from datetime import datetime, time
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import Session, Event, User, SessionSpeaker
from api.models.enums import SessionStatus, SessionType, SessionSpeakerRole
from api.commons.pagination import paginate


class SessionService:
    @staticmethod
    def get_event_sessions(
        event_id: int, day_number: Optional[int] = None, schema=None
    ):
        """Get sessions for an event with optional day filter"""
        # Verify event exists
        event = Event.query.get_or_404(event_id)

        # Build query with eager loading of relationships
        query = Session.query.options(
            db.joinedload(Session.speakers),
            db.joinedload(Session.session_speakers),
        ).filter_by(event_id=event_id)

        # Apply day filter if provided
        if day_number:
            query = query.filter_by(day_number=day_number)

        # Order by day and start time
        query = query.order_by(Session.day_number, Session.start_time)

        if schema:
            return paginate(query, schema, collection_name="sessions")

        return query.all()

    @staticmethod
    def get_session(session_id: int):
        """Get a session by ID"""
        session = Session.query.options(
            db.joinedload(Session.speakers),
            db.joinedload(Session.session_speakers),
        ).get_or_404(session_id)

        return session

    @staticmethod
    def create_session(event_id: int, session_data: Dict[str, Any]):
        """Create a new session for an event"""
        from api.models.chat_room import ChatRoom
        from api.models.enums import ChatRoomType
        
        # Verify event exists
        event = Event.query.get_or_404(event_id)

        # Create session
        session = Session(event_id=event_id, **session_data)

        # Validate times
        try:
            session.validate_times()
        except ValueError as e:
            raise ValueError(str(e))

        db.session.add(session)
        db.session.flush()  # Get session ID before commit
        
        # Create chat rooms for the session
        chat_rooms = [
            ChatRoom(
                event_id=event_id,
                session_id=session.id,
                name=f"{session.title} - Chat",
                description=f"Public discussion for {session.title}",
                room_type=ChatRoomType.PUBLIC,
                is_enabled=True
            ),
            ChatRoom(
                event_id=event_id,
                session_id=session.id,
                name=f"{session.title} - Backstage",
                description=f"Speaker and organizer coordination",
                room_type=ChatRoomType.BACKSTAGE,
                is_enabled=True
            )
        ]
        
        for room in chat_rooms:
            db.session.add(room)
        
        db.session.commit()

        return session

    @staticmethod
    def update_session(session_id: int, update_data: Dict[str, Any]):
        """Update a session"""
        session = Session.query.get_or_404(session_id)

        # Handle time fields separately for validation
        if "start_time" in update_data or "end_time" in update_data:
            try:
                if "start_time" in update_data:
                    session.start_time = update_data["start_time"]
                if "end_time" in update_data:
                    session.end_time = update_data["end_time"]
                session.validate_times()
            except ValueError as e:
                raise ValueError(str(e))

        # Update other fields
        for key, value in update_data.items():
            if key not in ["start_time", "end_time"]:
                setattr(session, key, value)

        db.session.commit()
        return session

    @staticmethod
    def delete_session(session_id: int):
        """Delete a session"""
        session = Session.query.get_or_404(session_id)

        db.session.delete(session)
        db.session.commit()
        return True

    @staticmethod
    def update_session_status(session_id: int, new_status: SessionStatus):
        """Update a session's status"""
        session = Session.query.get_or_404(session_id)

        session.update_status(new_status)
        db.session.commit()
        return session

    @staticmethod
    def update_session_times(
        session_id: int, start_time: time, end_time: time
    ):
        """Update a session's start and end times"""
        session = Session.query.get_or_404(session_id)

        try:
            session.update_times(start_time, end_time)
            db.session.commit()
            return session
        except ValueError as e:
            raise ValueError(str(e))

    @staticmethod
    def add_speaker_to_session(
        session_id: int,
        user_id: int,
        role: SessionSpeakerRole = SessionSpeakerRole.SPEAKER,
        order: Optional[int] = None,
    ):
        """Add a speaker to a session"""
        session = Session.query.get_or_404(session_id)
        user = User.query.get_or_404(user_id)

        try:
            speaker = session.add_speaker(user, role, order)
            db.session.commit()
            return speaker
        except ValueError as e:
            db.session.rollback()
            raise ValueError(str(e))

    @staticmethod
    def remove_speaker_from_session(session_id: int, user_id: int):
        """Remove a speaker from a session"""
        session = Session.query.get_or_404(session_id)
        user = User.query.get_or_404(user_id)

        session.remove_speaker(user)
        db.session.commit()
        return True

    @staticmethod
    def get_session_speakers(session_id: int, schema=None):
        """Get all speakers for a session"""
        session = Session.query.get_or_404(session_id)

        # Get session speakers with roles
        query = SessionSpeaker.query.filter_by(session_id=session_id)

        if schema:
            return paginate(query, schema, collection_name="speakers")

        return query.all()

    @staticmethod
    def get_upcoming_sessions(event_id: int, schema=None):
        """Get upcoming sessions for an event"""
        # Verify event exists
        event = Event.query.get_or_404(event_id)

        # Use the model's class method
        upcoming = Session.get_upcoming(event_id)

        if schema and hasattr(schema, "dump"):
            return schema.dump(upcoming, many=True)

        return upcoming

    @staticmethod
    def get_sessions_by_day(event_id: int, day_number: int, schema=None):
        """Get all sessions for a specific day"""
        # Verify event exists
        event = Event.query.get_or_404(event_id)

        # Use the model's class method
        sessions = Session.get_by_day(event_id, day_number)

        if schema and hasattr(schema, "dump"):
            return schema.dump(sessions, many=True)

        return sessions

    @staticmethod
    def check_speaker_conflicts(session_id: int, user_id: int) -> bool:
        """Check if a speaker has conflicts with this session"""
        session = Session.query.get_or_404(session_id)
        user = User.query.get_or_404(user_id)

        return session.has_speaker_conflicts(user)

    @staticmethod
    def get_user_speaking_sessions(user_id: int, schema=None):
        """Get all sessions where user is a speaker"""
        user = User.query.get_or_404(user_id)

        # Use the relationship directly
        sessions = user.speaking_sessions

        if schema and hasattr(schema, "dump"):
            return schema.dump(sessions, many=True)

        # For pagination, we need to convert to a query
        if schema:
            session_ids = [session.id for session in sessions]
            query = Session.query.filter(Session.id.in_(session_ids))
            return paginate(query, schema, collection_name="sessions")

        return sessions
