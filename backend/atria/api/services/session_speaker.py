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
            # For paginated results, we need to apply privacy filtering
            from api.commons.pagination import extract_pagination
            from flask import url_for, request
            
            page, per_page, other_request_args = extract_pagination(**request.args)
            page_obj = query.paginate(page=page, per_page=per_page)
            
            # Apply privacy filtering to the fetched items BEFORE serialization
            for speaker in page_obj.items:
                SessionSpeakerService._apply_speaker_privacy_filtering(speaker, session.event_id)
            
            # Generate pagination response
            endpoint = request.endpoint
            view_args = request.view_args or {}
            
            links = {
                "self": url_for(endpoint, page=page_obj.page, per_page=per_page, **other_request_args, **view_args),
                "first": url_for(endpoint, page=1, per_page=per_page, **other_request_args, **view_args),
                "last": url_for(endpoint, page=page_obj.pages, per_page=per_page, **other_request_args, **view_args),
            }
            
            if page_obj.has_next:
                links["next"] = url_for(endpoint, page=page_obj.next_num, per_page=per_page, **other_request_args, **view_args)
            
            if page_obj.has_prev:
                links["prev"] = url_for(endpoint, page=page_obj.prev_num, per_page=per_page, **other_request_args, **view_args)
            
            return {
                "total_items": page_obj.total,
                "total_pages": page_obj.pages,
                "current_page": page_obj.page,
                "per_page": per_page,
                **links,
                "session_speakers": schema.dump(page_obj.items),  # Now serialized with filtered data
            }

        # For non-paginated results
        speakers = query.all()
        for speaker in speakers:
            SessionSpeakerService._apply_speaker_privacy_filtering(speaker, session.event_id)
        return speakers

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

    @staticmethod
    def _apply_speaker_privacy_filtering(speaker, event_id):
        """Apply privacy filtering to a session speaker based on viewer context"""
        from flask_jwt_extended import get_jwt_identity
        from api.services.privacy import PrivacyService
        from api.models import User
        
        viewer_id = get_jwt_identity()
        viewer_id = int(viewer_id) if viewer_id else None
        
        if not speaker.user:
            return
        
        # Apply privacy filtering for all viewers
        viewer = User.query.get(viewer_id) if viewer_id else None
        context = PrivacyService.get_viewer_context(
            speaker.user,
            viewer,
            event_id
        )
        
        filtered_data = PrivacyService.filter_user_data(
            speaker.user,
            context,
            event_id
        )
        
        # Store the filtered data as temporary attributes on the speaker
        speaker._privacy_filtered = True
        speaker._filtered_title = filtered_data.get('title')
        speaker._filtered_company_name = filtered_data.get('company_name')
        speaker._filtered_social_links = filtered_data.get('social_links')
