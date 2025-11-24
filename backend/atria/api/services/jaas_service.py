"""
JaaS (Jitsi as a Service) JWT Service - BYOA (Bring Your Own Account)

Generates JaaS JWT tokens for Jitsi video conferencing.
Uses organization's encrypted JaaS credentials.

Token Generation Strategy:
- Tokens generated on-demand when user loads Jitsi player
- Expiration calculated as: session_duration + 1 hour buffer
- Similar to Mux: time-limited but long enough for viewing
- Fallback: 8 hours if session duration unknown

Feature Permissions:
- Moderators: Can record, livestream, upload files
- Attendees: Can only view and participate in chat
"""
import jwt
import time
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend


class JaaSService:
    """Service for generating JaaS JWT tokens for Jitsi video conferencing"""

    # Default token expiration if duration unknown (8 hours)
    DEFAULT_TOKEN_EXPIRATION = 8 * 60 * 60

    # Buffer to add to session duration (1 hour)
    EXPIRATION_BUFFER = 60 * 60

    # NBF (not before) delay to account for clock skew (10 seconds)
    NBF_DELAY = 10

    # Feature permissions for moderators (event admins/organizers)
    MODERATOR_FEATURES = {
        "livestreaming": "true",   # Allow streaming to YouTube/Facebook
        "recording": "true",       # Allow recording ($0.01/min when used)
        "transcription": "false",  # Disabled by default (may cost $)
        "outbound-call": "false",  # Phone dial-out (not needed)
        "sip-outbound-call": "false",  # SIP integration (not needed)
        "file-upload": "true",     # Allow file sharing in chat
        "list-visitors": "true",   # Show participant list
    }

    # Feature permissions for regular attendees
    ATTENDEE_FEATURES = {
        "livestreaming": "false",  # Only moderators can stream
        "recording": "false",      # Only moderators can record
        "transcription": "false",  # Disabled
        "outbound-call": "false",
        "sip-outbound-call": "false",
        "file-upload": "false",    # Prevent file sharing abuse
        "list-visitors": "true",   # Everyone can see participant list
    }

    @staticmethod
    def generate_token(
        organization,
        room_name: str,
        user,
        is_moderator: bool = False,
        token_expiration: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate JaaS JWT token for a user joining a Jitsi meeting.

        Args:
            organization: Organization model instance with JaaS credentials
            room_name: Jitsi room identifier (e.g., "atria-event-123-session-456")
            user: User model instance
            is_moderator: Whether user should have moderator permissions
            token_expiration: Token expiration in seconds (optional)
                - If not provided, uses DEFAULT_TOKEN_EXPIRATION (8 hours)
                - For session-based meetings, calculate as: session.duration_minutes * 60 + EXPIRATION_BUFFER

        Returns:
            {
                "token": str,  # JWT token
                "expires_at": int  # Unix timestamp
            }

        Raises:
            ValueError: If organization doesn't have JaaS credentials configured

        Example:
            # For session-based meeting with smart duration:
            token_exp = JaaSService.calculate_session_token_expiration(session)
            token_data = JaaSService.generate_token(
                organization=org,
                room_name=f"atria-event-{event.id}-session-{session.id}",
                user=current_user,
                is_moderator=True,
                token_expiration=token_exp
            )
        """
        # Validate organization has credentials
        if not organization.has_jaas_credentials:
            raise ValueError(
                "Organization does not have JaaS credentials configured. "
                "JaaS requires App ID, API Key, and Private Key."
            )

        # Get credentials
        app_id = organization.jaas_app_id
        api_key = organization.jaas_api_key
        private_key_pem = organization.get_jaas_private_key()

        # Load RSA private key
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )

        # Calculate timestamps
        now = int(time.time())
        expiration = token_expiration or JaaSService.DEFAULT_TOKEN_EXPIRATION
        exp_timestamp = now + expiration
        nbf_timestamp = now - JaaSService.NBF_DELAY

        # Build user context from our User model
        user_context = {
            "id": str(user.id),
            "name": user.full_name or "Anonymous",
            "email": user.email,
            "moderator": "true" if is_moderator else "false",  # Must be string, not boolean
            "hidden-from-recorder": "false",  # Could be a privacy setting later
        }

        # Add avatar if available
        if hasattr(user, 'image_url') and user.image_url:
            user_context["avatar"] = user.image_url

        # Select feature permissions based on moderator status
        features_context = (
            JaaSService.MODERATOR_FEATURES.copy() if is_moderator
            else JaaSService.ATTENDEE_FEATURES.copy()
        )

        # Build full context
        context = {
            "user": user_context,
            "features": features_context
        }

        # Build JWT claims
        payload = {
            "aud": "jitsi",  # Required, hardcoded
            "iss": "chat",  # Required, hardcoded
            "sub": app_id,  # JaaS App ID (vpaas-magic-cookie-xxx)
            "exp": exp_timestamp,  # Expiration timestamp
            "nbf": nbf_timestamp,  # Not before timestamp (accounts for clock skew)
            "room": room_name,  # Lock token to specific room (prevents reuse)
            "context": context
        }

        # Build JWT header
        headers = {
            "alg": "RS256",
            "kid": api_key,  # API Key ID
            "typ": "JWT"
        }

        # Sign token with RS256
        token = jwt.encode(
            payload,
            private_key,
            algorithm="RS256",
            headers=headers
        )

        return {
            "token": token,
            "expires_at": exp_timestamp
        }

    @staticmethod
    def calculate_session_token_expiration(session) -> int:
        """
        Calculate smart token expiration for a session.

        Returns session_duration + 1 hour buffer.
        If duration unknown, returns default (8 hours).

        Args:
            session: Session model instance with duration_minutes property

        Returns:
            Expiration in seconds

        Example:
            # 2-hour session → 3 hour token (2hr + 1hr buffer)
            expiration = JaaSService.calculate_session_token_expiration(session)
            token = JaaSService.generate_token(..., token_expiration=expiration)
        """
        if not session or not hasattr(session, 'duration_minutes') or not session.duration_minutes:
            return JaaSService.DEFAULT_TOKEN_EXPIRATION

        # Convert duration to seconds and add buffer
        session_duration_seconds = session.duration_minutes * 60
        return session_duration_seconds + JaaSService.EXPIRATION_BUFFER

    @staticmethod
    def is_user_moderator(user, session) -> bool:
        """
        Determine if user should have moderator permissions for a session.

        Users are moderators if they have ADMIN or ORGANIZER role in the event.

        Future enhancement: Check session.allow_speaker_moderators flag
        to also grant moderator to session speakers.

        Args:
            user: User model instance
            session: Session model instance

        Returns:
            True if user should be moderator, False otherwise

        Example:
            is_mod = JaaSService.is_user_moderator(current_user, session)
            token = JaaSService.generate_token(..., is_moderator=is_mod)
        """
        from api.models.enums import EventUserRole

        # Get user's role in the event
        event_user = None
        for eu in session.event.event_users:
            if eu.user_id == user.id:
                event_user = eu
                break

        if not event_user:
            return False  # Not in event

        # Event admins and organizers are moderators
        if event_user.role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            return True

        # Future enhancement: Check if session allows speakers as moderators
        # if hasattr(session, 'allow_speaker_moderators') and session.allow_speaker_moderators:
        #     if user in session.speakers:
        #         return True

        return False
