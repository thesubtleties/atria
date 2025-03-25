# api/services/session_speaker.py
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import Session, User, SessionSpeaker
from api.models.enums import SessionSpeakerRole
from api.commons.pagination import paginate


class SessionSpeakerService:
    @staticmethod
    def get_session_speakers(
        session_id: int, role: Optional[str] = None, schema=None
    ):
        """Get speakers for a session with optional role filter"""
        # Verify session exists
        session = Session.query.get_or_404(session_id)

        # Build query - order by speaker order
        query = SessionSpeaker.query.filter_by(session_id=session_id).order_by(
            SessionSpeaker.order
        )

        # Apply role filter if provided
        if role:
            query = query.filter_by(role=role)

        if schema:
            return paginate(query, schema, collection_name="session_speakers")

        return query.all()

    @staticmethod
    def get_session_speaker(session_id: int, user_id: int):
        """Get a specific session speaker"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        return speaker

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

        # Check if already a speaker
        if session.has_speaker(user):
            raise ValueError("Already a speaker in this session")

        # Check for conflicts
        if session.has_speaker_conflicts(user):
            raise ValueError("Speaker has conflicting sessions")

        # Add speaker
        session.add_speaker(user, role=role, order=order)
        db.session.commit()

        # Return the created speaker record
        return SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first()

    @staticmethod
    def update_speaker(
        session_id: int, user_id: int, update_data: Dict[str, Any]
    ):
        """Update a session speaker's role or order"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        if "role" in update_data:
            speaker.role = update_data["role"]
        if "order" in update_data:
            speaker.order = update_data["order"]

        db.session.commit()
        return speaker

    @staticmethod
    def remove_speaker(session_id: int, user_id: int):
        """Remove a speaker from a session"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        db.session.delete(speaker)
        db.session.commit()
        return True

    @staticmethod
    def update_speaker_order(session_id: int, user_id: int, new_order: int):
        """Update a speaker's order in the session"""
        speaker = SessionSpeaker.query.filter_by(
            session_id=session_id, user_id=user_id
        ).first_or_404()

        try:
            speakers = speaker.update_order(new_order)
            db.session.commit()
            return speakers
        except ValueError as e:
            raise ValueError(str(e))

    @staticmethod
    def get_ordered_speakers(session_id: int, schema=None):
        """Get all speakers for a session in order"""
        # Verify session exists
        session = Session.query.get_or_404(session_id)

        speakers = SessionSpeaker.get_ordered_speakers(session_id)

        if schema and hasattr(schema, "dump"):
            return schema.dump(speakers, many=True)

        return speakers

    @staticmethod
    def get_speakers_by_role(
        session_id: int, role: SessionSpeakerRole, schema=None
    ):
        """Get all speakers with a specific role for a session"""
        # Verify session exists
        session = Session.query.get_or_404(session_id)

        speakers = SessionSpeaker.get_speakers_by_role(session_id, role)

        if schema and hasattr(schema, "dump"):
            return schema.dump(speakers, many=True)

        return speakers

    @staticmethod
    def check_speaker_conflicts(session_id: int, user_id: int) -> bool:
        """Check if a user has conflicts with a session"""
        session = Session.query.get_or_404(session_id)
        user = User.query.get_or_404(user_id)

        return session.has_speaker_conflicts(user)

    @staticmethod
    def get_user_speaking_sessions(user_id: int, schema=None):
        """Get all sessions where a user is a speaker"""
        user = User.query.get_or_404(user_id)

        # Use the relationship directly
        sessions = user.speaking_sessions

        if schema and hasattr(schema, "dump"):
            return schema.dump(sessions, many=True)

        return sessions
