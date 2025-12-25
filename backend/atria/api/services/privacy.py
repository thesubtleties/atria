from typing import Dict, Any, Optional
from api.models import User, EventUser, Connection
from api.models.enums import (
    EventUserRole, 
    ConnectionStatus,
    EmailVisibility,
    ConnectionRequestPermission,
    SocialLinksVisibility
)


class PrivacyService:
    """Service for handling user privacy settings and data filtering"""
    
    @staticmethod
    def get_viewer_context(user: User, viewer: Optional[User], event_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Determine the viewer's relationship to the user being viewed.
        
        Args:
            user: The user whose data is being viewed
            viewer: The user viewing the data (None for unauthenticated)
            event_id: Optional event context for event-specific relationships
            
        Returns:
            Dictionary containing relationship context
        """
        context = {
            'is_self': False,
            'is_connected': False,
            'is_organizer': False,
            'is_co_speaker': False,
            'is_event_attendee': False,
            'shared_events': []
        }
        
        if not viewer:
            return context
            
        # Check if viewing own profile
        context['is_self'] = viewer.id == user.id
        
        # Check connection status
        connection = user.get_connection_with(viewer.id)
        context['is_connected'] = (
            connection is not None and 
            connection.status == ConnectionStatus.ACCEPTED
        )
        
        # Check event-specific relationships if event context provided
        if event_id:
            event_user = EventUser.query.filter_by(
                event_id=event_id, 
                user_id=user.id
            ).first()
            
            viewer_event = EventUser.query.filter_by(
                event_id=event_id, 
                user_id=viewer.id
            ).first()
            
            if viewer_event and not viewer_event.is_banned:
                # Check if viewer is an organizer/admin of the event
                context['is_organizer'] = viewer_event.role in [
                    EventUserRole.ADMIN, 
                    EventUserRole.ORGANIZER
                ]
                
                # Check if viewer is attending the event
                context['is_event_attendee'] = True
                
                # Check if both are speakers
                if event_user and viewer_event:
                    context['is_co_speaker'] = (
                        viewer_event.role == EventUserRole.SPEAKER and 
                        event_user.role == EventUserRole.SPEAKER
                    )
        
        # Get shared events (for future use)
        if not context['is_self']:
            viewer_events = {eu.event_id for eu in viewer.event_users if not eu.is_banned}
            user_events = {eu.event_id for eu in user.event_users if not eu.is_banned}
            context['shared_events'] = list(viewer_events & user_events)
        
        return context
    
    @staticmethod
    def _determine_email_visibility(user: User, context: Dict[str, Any], privacy: Dict, email_visibility: str, event_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Determine email visibility based on context and privacy settings.
        
        Returns:
            Dict with show_real_email, show_public_email, and public_email values
        """
        result = {
            'show_real_email': False,
            'show_public_email': False,
            'public_email': None
        }
        
        # Check public email settings
        show_public_email = privacy.get('show_public_email', False)
        public_email = privacy.get('public_email')
        
        # Determine visibility
        if context['is_self']:
            result['show_real_email'] = True
            result['show_public_email'] = show_public_email
            result['public_email'] = public_email
        elif context['is_organizer']:
            # Organizers always see real email for event management
            result['show_real_email'] = True
        elif email_visibility == 'EVENT_ATTENDEES':
            # Most permissive setting - but context matters:
            show_email = False
            if event_id:
                # In event context: show to actual event attendees
                show_email = context.get('is_event_attendee', False)
            else:
                # Outside event context: connections are "higher tier"
                show_email = context['is_connected']

            if show_email:
                if show_public_email and public_email:
                    result['show_public_email'] = True
                    result['public_email'] = public_email
                else:
                    result['show_real_email'] = True
        elif email_visibility == 'CONNECTIONS_ORGANIZERS' and context['is_connected']:
            if show_public_email and public_email:
                result['show_public_email'] = True
                result['public_email'] = public_email
            else:
                result['show_real_email'] = True
        elif email_visibility == 'ORGANIZERS_ONLY':
            # Already handled in is_organizer check above
            pass
        # 'HIDDEN' - no email shown unless organizer/self
        
        return result
    
    @staticmethod
    def filter_user_data(user: User, context: Dict[str, Any], event_id: Optional[int] = None, event_user=None) -> Dict[str, Any]:
        """
        Apply privacy rules to user data based on viewer context.
        
        Args:
            user: The user whose data is being filtered
            context: Viewer context from get_viewer_context()
            event_id: Optional event ID for event-specific privacy overrides
            event_user: Optional pre-loaded EventUser to avoid extra query
            
        Returns:
            Filtered user data dictionary with appropriate fields
        """
        # Start with basic always-visible fields
        filtered = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'image_url': user.image_url
        }
        
        # Get privacy settings with defaults
        privacy = user.privacy_settings or {}
        
        # Check for event-specific overrides
        if event_id:
            # Use pre-loaded event_user if provided, otherwise query
            if not event_user:
                event_user = EventUser.query.filter_by(
                    event_id=event_id,
                    user_id=user.id
                ).first()
            
            if event_user and event_user.privacy_overrides:
                # Merge event overrides with global settings
                privacy = {**privacy, **event_user.privacy_overrides}
        
        # Extract privacy settings with defaults (normalize to UPPERCASE for consistency)
        email_visibility = (privacy.get('email_visibility') or 'CONNECTIONS_ORGANIZERS').upper()
        show_company = privacy.get('show_company', True)
        show_bio = privacy.get('show_bio', True)
        show_social_links = (privacy.get('show_social_links') or 'EVENT_ATTENDEES').upper()
        allow_connection_requests = (privacy.get('allow_connection_requests') or 'EVENT_ATTENDEES').upper()
        
        # Apply email visibility rules
        email_data = PrivacyService._determine_email_visibility(user, context, privacy, email_visibility, event_id)
        
        # Set email field (explicit None if hidden)
        if email_data['show_real_email']:
            filtered['email'] = user.email
        elif email_data['show_public_email'] and email_data['public_email']:
            filtered['email'] = email_data['public_email']
        else:
            filtered['email'] = None
        
        # Apply company/title visibility
        if show_company or context['is_self'] or context['is_organizer']:
            filtered['company_name'] = user.company_name
            filtered['title'] = user.title
        else:
            filtered['company_name'] = None
            filtered['title'] = None
        
        # Apply bio visibility
        if show_bio or context['is_self'] or context['is_organizer']:
            filtered['bio'] = user.bio
        else:
            filtered['bio'] = None
        
        # Apply social links visibility
        # Social links respect user's privacy even for organizers (unlike email)
        if context['is_self']:
            # Always show to self
            filtered['social_links'] = user.social_links or {}
        elif show_social_links == 'HIDDEN':
            # Explicitly hidden from EVERYONE except self (even organizers)
            filtered['social_links'] = None
        elif show_social_links == 'EVENT_ATTENDEES':
            # Most permissive setting - but context matters:
            if event_id:
                # In event context: show only to actual event attendees
                if context.get('is_event_attendee'):
                    filtered['social_links'] = user.social_links or {}
                else:
                    filtered['social_links'] = None
            else:
                # Outside event context: connections are "higher tier" than attendees
                # Profile pages and My Network use this path
                if context['is_connected']:
                    filtered['social_links'] = user.social_links or {}
                else:
                    filtered['social_links'] = None
        elif show_social_links == 'CONNECTIONS' and context['is_connected']:
            # Show only to connections
            filtered['social_links'] = user.social_links or {}
        else:
            # Default to hidden if not specified or no connection
            filtered['social_links'] = None
        
        # Add privacy settings and account info only for self
        if context['is_self']:
            filtered['privacy_settings'] = privacy
            filtered['created_at'] = user.created_at
            filtered['is_active'] = user.is_active
            filtered['email_verified'] = user.email_verified
        
        # Add connection request permission for others
        if not context['is_self']:
            filtered['allow_connection_requests'] = allow_connection_requests
            
            # Check if viewer can actually send a connection request
            can_connect = False

            if allow_connection_requests == 'EVENT_ATTENDEES':
                # Allow if viewer is an event attendee (in shared event context)
                can_connect = context.get('is_event_attendee', False)
            elif allow_connection_requests == 'SPEAKERS_ORGANIZERS':
                # Allow only if viewer is a speaker or organizer
                can_connect = context['is_organizer'] or context['is_co_speaker']
            elif allow_connection_requests == 'NONE':
                # Block all connection requests
                can_connect = False
                
            filtered['can_send_connection_request'] = can_connect
        
        # Add additional context flags for frontend
        filtered['is_connected'] = context['is_connected']
        
        # If in event context, add event-specific user info
        if event_id:
            event_user = EventUser.query.filter_by(
                event_id=event_id,
                user_id=user.id
            ).first()
            
            if event_user:
                filtered['event_role'] = event_user.role.value if event_user.role else None
                
                # Add speaker-specific fields if applicable
                if event_user.role == EventUserRole.SPEAKER:
                    filtered['speaker_bio'] = event_user.speaker_bio
                    filtered['speaker_title'] = event_user.speaker_title
        
        return filtered
    
    @staticmethod
    def can_send_connection_request(
        requester: User,
        recipient: User,
        event_id: Optional[int] = None,
        requester_event_user = None,
        recipient_event_user = None,
        existing_connection = None
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a user can send a connection request to another user.

        Args:
            requester: User trying to send the request
            recipient: User receiving the request
            event_id: Optional event context
            requester_event_user: Optional pre-loaded EventUser for requester (performance optimization)
            recipient_event_user: Optional pre-loaded EventUser for recipient (performance optimization)
            existing_connection: Optional pre-loaded Connection object (performance optimization)

        Returns:
            Tuple of (can_send: bool, reason: Optional[str])
        """
        # Can't connect with yourself
        if requester.id == recipient.id:
            return False, "Cannot connect with yourself"

        # Check if already connected (use pre-loaded or query)
        if existing_connection is None:
            existing_connection = requester.get_connection_with(recipient.id)

        if existing_connection:
            if existing_connection.status == ConnectionStatus.ACCEPTED:
                return False, "Already connected"
            elif existing_connection.status == ConnectionStatus.PENDING:
                return False, "Connection request already pending"
            elif existing_connection.status == ConnectionStatus.BLOCKED:
                return False, "Connection blocked"

        # Get recipient's privacy settings (normalize to UPPERCASE)
        privacy = recipient.privacy_settings or {}
        allow_requests = (privacy.get('allow_connection_requests') or 'EVENT_ATTENDEES').upper()

        # Check event-specific overrides (use pre-loaded or query)
        if event_id:
            if recipient_event_user is None:
                recipient_event_user = EventUser.query.filter_by(
                    event_id=event_id,
                    user_id=recipient.id
                ).first()

            if recipient_event_user and recipient_event_user.privacy_overrides:
                event_privacy = recipient_event_user.privacy_overrides
                override_value = event_privacy.get('allow_connection_requests')
                if override_value:
                    allow_requests = override_value.upper()

        # Apply connection request rules
        if allow_requests == 'NONE':
            return False, "User has disabled connection requests"

        # Need event context for all other permission levels
        if not event_id:
            return False, "Connection requests require shared event context"

        # Check requester's event status - must be active participant (use pre-loaded or query)
        if requester_event_user is None:
            requester_event_user = EventUser.query.filter_by(
                event_id=event_id,
                user_id=requester.id
            ).first()

        if not requester_event_user or requester_event_user.is_banned:
            return False, "Must be active event participant"

        # Now check permission level (requester is confirmed to be in the event)
        if allow_requests == 'EVENT_ATTENDEES':
            # Allow any active event participant
            return True, None

        if allow_requests == 'SPEAKERS_ORGANIZERS':
            if requester_event_user.role in [
                EventUserRole.SPEAKER,
                EventUserRole.ORGANIZER,
                EventUserRole.ADMIN
            ]:
                return True, None
            return False, "Only speakers and organizers can send requests to this user"
        
        return False, "Cannot send connection request"
    
    @staticmethod
    def get_default_privacy_settings() -> Dict[str, Any]:
        """Get default privacy settings for new users"""
        return {
            'email_visibility': 'CONNECTIONS_ORGANIZERS',
            'show_public_email': False,
            'public_email': '',
            'allow_connection_requests': 'EVENT_ATTENDEES',
            'show_social_links': 'EVENT_ATTENDEES',
            'show_company': True,
            'show_bio': True
        }

    @staticmethod
    def get_speaker_default_privacy_settings() -> Dict[str, Any]:
        """Get recommended privacy settings for speakers"""
        return {
            'email_visibility': 'CONNECTIONS_ORGANIZERS',
            'show_public_email': False,
            'public_email': '',
            'allow_connection_requests': 'EVENT_ATTENDEES',
            'show_social_links': 'EVENT_ATTENDEES',
            'show_company': True,
            'show_bio': True
        }
    
    @staticmethod
    def _normalize_privacy_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize enum values to UPPERCASE for consistency."""
        normalized = dict(settings)
        enum_fields = ['email_visibility', 'allow_connection_requests', 'show_social_links']
        for field in enum_fields:
            if field in normalized and isinstance(normalized[field], str):
                normalized[field] = normalized[field].upper()
        return normalized

    @staticmethod
    def get_user_privacy_settings(user_id: int) -> Dict[str, Any]:
        """
        Get user's privacy settings with event overrides.

        Args:
            user_id: ID of the user

        Returns:
            Dictionary containing privacy_settings and event_overrides
        """
        from api.models import User, EventUser

        user = User.query.get_or_404(user_id)

        # Get base privacy settings and normalize to UPPERCASE
        raw_settings = user.privacy_settings or PrivacyService.get_default_privacy_settings()
        privacy_settings = PrivacyService._normalize_privacy_settings(raw_settings)
        
        # Get event-specific overrides (normalized to UPPERCASE)
        event_overrides = []
        event_users = EventUser.query.filter_by(user_id=user_id).filter(
            EventUser.privacy_overrides.isnot(None)
        ).all()

        for event_user in event_users:
            if event_user.privacy_overrides:
                event_overrides.append({
                    'event_id': event_user.event_id,
                    'event_name': event_user.event.title if event_user.event else None,
                    'overrides': PrivacyService._normalize_privacy_settings(event_user.privacy_overrides)
                })
        
        return {
            'privacy_settings': privacy_settings,
            'event_overrides': event_overrides
        }
    
    @staticmethod
    def update_user_privacy_settings(user_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user's privacy settings.
        
        Args:
            user_id: ID of the user
            updates: Dictionary of settings to update
            
        Returns:
            Updated privacy settings
        """
        from api.models import User
        from api.extensions import db
        
        user = User.query.get_or_404(user_id)
        
        # Get current settings or defaults - MUST create a new dict
        current_settings = dict(user.privacy_settings or PrivacyService.get_default_privacy_settings())
        print(f"DEBUG Service: Current settings before update: {current_settings}")
        
        # Clean up empty strings for email field
        if 'public_email' in updates and updates['public_email'] == '':
            updates['public_email'] = None
        
        # Create a new dictionary with updates (important for SQLAlchemy change detection)
        new_settings = current_settings.copy()
        
        # Update only provided fields
        for key, value in updates.items():
            # Convert enum objects to their string values for JSON storage
            if hasattr(value, 'value'):
                print(f"DEBUG Service: Converting enum {key}: {value} -> {value.value}")
                new_settings[key] = value.value
            else:
                print(f"DEBUG Service: Setting {key}: {value}")
                new_settings[key] = value
        
        print(f"DEBUG Service: Settings after update: {new_settings}")
        
        # CRITICAL: Must assign a NEW dict for SQLAlchemy to detect the change
        user.privacy_settings = new_settings
        db.session.commit()
        print(f"DEBUG Service: Committed to DB")
        
        return PrivacyService.get_user_privacy_settings(user_id)
    
    @staticmethod
    def get_event_privacy_overrides(user_id: int, event_id: int) -> Optional[Dict[str, Any]]:
        """
        Get event-specific privacy overrides for a user.

        Args:
            user_id: ID of the user
            event_id: ID of the event

        Returns:
            Privacy overrides if they exist (normalized to UPPERCASE), None otherwise
        """
        from api.models import EventUser

        event_user = EventUser.query.filter_by(
            user_id=user_id,
            event_id=event_id
        ).first()

        if event_user and event_user.privacy_overrides:
            return PrivacyService._normalize_privacy_settings(event_user.privacy_overrides)
        return None
    
    @staticmethod
    def update_event_privacy_overrides(user_id: int, event_id: int, overrides: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Update event-specific privacy overrides for a user.
        
        Args:
            user_id: ID of the user
            event_id: ID of the event
            overrides: Privacy settings overrides for this event (None to delete)
            
        Returns:
            Updated event user data with overrides
        """
        from api.models import EventUser
        from api.extensions import db
        
        event_user = EventUser.query.filter_by(
            user_id=user_id,
            event_id=event_id
        ).first()
        
        if not event_user:
            from flask_smorest import abort
            abort(404, message="User is not part of this event")
        
        # Set or update overrides (None to delete)
        event_user.privacy_overrides = overrides
        db.session.commit()
        
        return {
            'event_id': event_id,
            'user_id': user_id,
            'privacy_overrides': event_user.privacy_overrides or {}
        }
    
    @staticmethod
    def set_event_privacy_override(user_id: int, event_id: int, overrides: Dict[str, Any]) -> Dict[str, Any]:
        """
        Set event-specific privacy overrides for a user.
        
        Args:
            user_id: ID of the user
            event_id: ID of the event
            overrides: Privacy settings overrides for this event
            
        Returns:
            Updated event user data with overrides
        """
        from api.models import EventUser
        from api.extensions import db
        
        event_user = EventUser.query.filter_by(
            user_id=user_id, 
            event_id=event_id
        ).first_or_404()
        
        # Validate user is a speaker (only speakers can have overrides)
        from api.models.enums import EventUserRole
        if event_user.role != EventUserRole.SPEAKER:
            raise ValueError("Only speakers can set event-specific privacy overrides")
        
        # Set or update overrides
        event_user.privacy_overrides = overrides if overrides else None
        db.session.commit()
        
        return {
            'event_id': event_id,
            'user_id': user_id,
            'privacy_overrides': event_user.privacy_overrides
        }