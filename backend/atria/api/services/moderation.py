from datetime import datetime, timezone, timedelta
from typing import Optional
from flask_jwt_extended import get_jwt_identity
from api.extensions import db
from api.models import EventUser, User, Event
from api.models.enums import EventUserRole


class ModerationService:
    """Service for handling event moderation actions like banning users"""
    
    @staticmethod
    def ban_user_from_event(
        event_id: int, 
        user_id: int, 
        ban_data: dict,
        banned_by_id: Optional[int] = None
    ) -> EventUser:
        """
        Ban a user from an event.
        
        Args:
            event_id: ID of the event
            user_id: ID of the user to ban
            ban_data: Dictionary with 'reason' and optional 'moderation_notes'
            banned_by_id: ID of the user performing the ban (defaults to current user)
            
        Returns:
            Updated EventUser object
            
        Raises:
            ValueError: If user is not part of event or cannot be banned
        """
        if banned_by_id is None:
            banned_by_id = int(get_jwt_identity())
        
        # Get the moderator's event user record
        moderator_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=banned_by_id
        ).first()
        
        if not moderator_event_user:
            raise ValueError("Moderator is not part of this event")
        
        # Get the target user's event user record
        target_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not target_event_user:
            raise ValueError("User is not part of this event")
        
        # Check permissions
        can_moderate, reason = ModerationService.can_moderate_user(
            moderator_event_user, target_event_user
        )
        if not can_moderate:
            raise ValueError(reason)
        
        if target_event_user.is_banned:
            raise ValueError("User is already banned from this event")
        
        # Don't allow banning the last admin
        if target_event_user.role == EventUserRole.ADMIN:
            admin_count = EventUser.query.filter_by(
                event_id=event_id,
                role=EventUserRole.ADMIN,
                is_banned=False
            ).count()
            if admin_count <= 1:
                raise ValueError("Cannot ban the last admin of the event")
        
        # Update ban status
        target_event_user.is_banned = True
        target_event_user.banned_at = datetime.now(timezone.utc)
        target_event_user.banned_by = banned_by_id
        target_event_user.ban_reason = ban_data['reason']

        # TODO: Migrate moderation_notes to JSON array structure for proper audit trail
        # Should store: timestamp, action, moderator_id, moderator_name, reason, note
        # This would allow better querying and display of moderation history
        if ban_data.get('moderation_notes'):
            current_notes = target_event_user.moderation_notes or ""
            ban_note = f"Event banned: {ban_data['moderation_notes']}"
            target_event_user.moderation_notes = f"{current_notes}\n{ban_note}".strip()
        
        db.session.commit()
        return target_event_user
    
    @staticmethod
    def unban_user_from_event(
        event_id: int,
        user_id: int,
        unban_data: dict,
        unbanned_by_id: Optional[int] = None
    ) -> EventUser:
        """
        Unban a user from an event.
        
        Args:
            event_id: ID of the event
            user_id: ID of the user to unban
            unban_data: Dictionary with optional 'moderation_notes'
            unbanned_by_id: ID of the user performing the unban (defaults to current user)
            
        Returns:
            Updated EventUser object
            
        Raises:
            ValueError: If user is not part of event or not banned
        """
        if unbanned_by_id is None:
            unbanned_by_id = int(get_jwt_identity())
        
        # Get the moderator's event user record
        moderator_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=unbanned_by_id
        ).first()
        
        if not moderator_event_user:
            raise ValueError("Moderator is not part of this event")
        
        # Get the target user's event user record
        target_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not target_event_user:
            raise ValueError("User is not part of this event")
        
        # Check permissions
        can_moderate, reason = ModerationService.can_moderate_user(
            moderator_event_user, target_event_user
        )
        if not can_moderate:
            raise ValueError(reason)
        
        if not target_event_user.is_banned:
            raise ValueError("User is not currently banned from this event")
        
        # Clear ban status
        target_event_user.is_banned = False
        target_event_user.banned_at = None
        target_event_user.banned_by = None
        target_event_user.ban_reason = None
        # Keep moderation notes for audit trail
        if unban_data.get('moderation_notes'):
            current_notes = target_event_user.moderation_notes or ""
            target_event_user.moderation_notes = f"{current_notes}\nUnbanned: {unban_data['moderation_notes']}".strip()
        
        db.session.commit()
        return target_event_user
    
    @staticmethod
    def chat_ban_user(
        event_id: int,
        user_id: int,
        chat_ban_data: dict,
        banned_by_id: Optional[int] = None
    ) -> EventUser:
        """
        Ban a user from chat in an event.
        
        Args:
            event_id: ID of the event
            user_id: ID of the user to chat ban
            chat_ban_data: Dictionary with 'reason', optional 'duration_hours', 'moderation_notes'
            banned_by_id: ID of the user performing the ban (defaults to current user)
            
        Returns:
            Updated EventUser object
            
        Raises:
            ValueError: If user is not part of event or already chat banned
        """
        if banned_by_id is None:
            banned_by_id = int(get_jwt_identity())
        
        # Get the moderator's event user record
        moderator_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=banned_by_id
        ).first()
        
        if not moderator_event_user:
            raise ValueError("Moderator is not part of this event")
        
        # Get the target user's event user record
        target_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not target_event_user:
            raise ValueError("User is not part of this event")
        
        # Check permissions
        can_moderate, reason = ModerationService.can_moderate_user(
            moderator_event_user, target_event_user
        )
        if not can_moderate:
            raise ValueError(reason)
        
        # Check if user is banned from event entirely
        if target_event_user.is_banned:
            raise ValueError("User is banned from the event entirely")
        
        # Check if already chat banned and still active
        if target_event_user.is_chat_banned:
            if target_event_user.chat_ban_until is None:
                raise ValueError("User is already permanently chat banned")
            elif target_event_user.chat_ban_until > datetime.now(timezone.utc):
                raise ValueError("User is already chat banned until {}".format(
                    target_event_user.chat_ban_until.strftime("%Y-%m-%d %H:%M UTC")
                ))
        
        # Set chat ban
        target_event_user.is_chat_banned = True
        target_event_user.chat_ban_reason = chat_ban_data['reason']
        if chat_ban_data.get('duration_hours'):
            target_event_user.chat_ban_until = datetime.now(timezone.utc) + timedelta(hours=chat_ban_data['duration_hours'])
        else:
            target_event_user.chat_ban_until = None  # Permanent ban
        
        if chat_ban_data.get('moderation_notes'):
            current_notes = target_event_user.moderation_notes or ""
            ban_note = f"Chat banned: {chat_ban_data['moderation_notes']}"
            target_event_user.moderation_notes = f"{current_notes}\n{ban_note}".strip()
        
        db.session.commit()
        return target_event_user
    
    @staticmethod
    def chat_unban_user(
        event_id: int,
        user_id: int,
        chat_unban_data: dict,
        unbanned_by_id: Optional[int] = None
    ) -> EventUser:
        """
        Unban a user from chat in an event.
        
        Args:
            event_id: ID of the event
            user_id: ID of the user to chat unban
            chat_unban_data: Dictionary with optional 'moderation_notes'
            unbanned_by_id: ID of the user performing the unban (defaults to current user)
            
        Returns:
            Updated EventUser object
            
        Raises:
            ValueError: If user is not part of event or not chat banned
        """
        if unbanned_by_id is None:
            unbanned_by_id = int(get_jwt_identity())
        
        # Get the moderator's event user record
        moderator_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=unbanned_by_id
        ).first()
        
        if not moderator_event_user:
            raise ValueError("Moderator is not part of this event")
        
        # Get the target user's event user record
        target_event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not target_event_user:
            raise ValueError("User is not part of this event")
        
        # Check permissions
        can_moderate, reason = ModerationService.can_moderate_user(
            moderator_event_user, target_event_user
        )
        if not can_moderate:
            raise ValueError(reason)
        
        if not target_event_user.is_chat_banned:
            raise ValueError("User is not currently chat banned")
        
        # Clear chat ban
        target_event_user.is_chat_banned = False
        target_event_user.chat_ban_until = None
        target_event_user.chat_ban_reason = None
        
        if chat_unban_data.get('moderation_notes'):
            current_notes = target_event_user.moderation_notes or ""
            unban_note = f"Chat unbanned: {chat_unban_data['moderation_notes']}"
            target_event_user.moderation_notes = f"{current_notes}\n{unban_note}".strip()
        
        db.session.commit()
        return target_event_user
    
    @staticmethod
    def get_moderation_status(event_id: int, user_id: int) -> Optional[EventUser]:
        """
        Get the moderation status for a user in an event.
        
        Args:
            event_id: ID of the event
            user_id: ID of the user
            
        Returns:
            EventUser object with moderation status or None if user not in event
        """
        return EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
    
    @staticmethod
    def can_moderate_user(
        moderator_event_user: EventUser,
        target_event_user: EventUser
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a moderator can take action against a target user.
        
        Args:
            moderator_event_user: EventUser record for the moderator
            target_event_user: EventUser record for the target user
            
        Returns:
            Tuple of (can_moderate: bool, reason: Optional[str])
        """
        # Can't moderate yourself
        if moderator_event_user.user_id == target_event_user.user_id:
            return False, "Cannot moderate yourself"
        
        # Banned users cannot moderate
        if moderator_event_user.is_banned:
            return False, "Banned users cannot moderate others"
        
        # Check permissions based on roles
        moderator_role = moderator_event_user.role
        target_role = target_event_user.role
        
        # Admins can moderate anyone
        if moderator_role == EventUserRole.ADMIN:
            return True, None
        
        # Organizers can moderate attendees and speakers
        if moderator_role == EventUserRole.ORGANIZER:
            if target_role in [EventUserRole.ATTENDEE, EventUserRole.SPEAKER]:
                return True, None
            else:
                return False, "Organizers cannot moderate other organizers or admins"
        
        # Other roles cannot moderate
        return False, "Insufficient permissions to moderate users"