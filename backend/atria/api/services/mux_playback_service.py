"""
Mux Playback Service - BYOA (Bring Your Own Account)

Generates Mux playback URLs with JWT tokens for signed playback.
Uses organization's encrypted Mux credentials.

Token Generation Strategy:
- Tokens generated on-demand when user loads player (not pre-generated)
- Expiration calculated as: session_duration + 1 hour buffer
- Similar to MinIO signed URLs: time-limited but long enough for viewing
"""
import jwt
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend


class MuxPlaybackService:
    """Service for generating Mux playback URLs with JWT tokens"""

    # Mux audience values for different token types (from Mux docs)
    AUDIENCE_VIDEO = "v"  # Video/Subtitles/Closed Captions
    AUDIENCE_THUMBNAIL = "t"  # Thumbnail images
    AUDIENCE_GIF = "g"  # Animated GIF
    AUDIENCE_STORYBOARD = "s"  # Timeline hover previews
    AUDIENCE_DRM = "d"  # DRM License (not used in our implementation)

    # Default token expiration if duration unknown (8 hours)
    DEFAULT_TOKEN_EXPIRATION = 8 * 60 * 60

    # Buffer to add to session duration (1 hour)
    EXPIRATION_BUFFER = 60 * 60

    @staticmethod
    def get_playback_url(
        organization,
        playback_id: str,
        playback_policy: str,
        token_expiration: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate Mux playback URL with tokens if needed.

        Args:
            organization: Organization model instance
            playback_id: Mux playback ID
            playback_policy: "PUBLIC" or "SIGNED"
            token_expiration: Token expiration in seconds (optional)
                - If not provided, uses DEFAULT_TOKEN_EXPIRATION (8 hours)
                - For session-based playback, calculate as: session.duration_minutes * 60 + EXPIRATION_BUFFER

        Returns:
            {
                "playback_url": str,  # HLS stream URL
                "playback_policy": str,  # "PUBLIC" or "SIGNED"
                "tokens": dict or None  # {playback, thumbnail, storyboard} for SIGNED, None for PUBLIC
            }

        Raises:
            ValueError: If playback_id is invalid, playback_policy is invalid,
                       or SIGNED requires missing credentials

        Example:
            # For session-based playback with smart duration:
            token_exp = session.duration_minutes * 60 + MuxPlaybackService.EXPIRATION_BUFFER
            result = MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id="abc123",
                playback_policy="SIGNED",
                token_expiration=token_exp
            )
        """
        # Validate inputs
        if not playback_id:
            raise ValueError("playback_id is required")

        if playback_policy not in ["PUBLIC", "SIGNED"]:
            raise ValueError(f"Invalid playback_policy: {playback_policy}. Must be 'PUBLIC' or 'SIGNED'")

        # Build base playback URL (HLS stream)
        playback_url = f"https://stream.mux.com/{playback_id}.m3u8"

        # PUBLIC playback - no tokens needed
        if playback_policy == "PUBLIC":
            return {
                "playback_url": playback_url,
                "playback_policy": "PUBLIC",
                "tokens": None
            }

        # SIGNED playback - generate JWT tokens
        if not organization.has_mux_signing_credentials:
            raise ValueError(
                "Organization does not have Mux signing credentials configured. "
                "SIGNED playback requires signing key ID and private key."
            )

        # Use provided expiration or default
        expiration = token_expiration or MuxPlaybackService.DEFAULT_TOKEN_EXPIRATION

        # Generate all 3 tokens (playback, thumbnail, storyboard)
        tokens = MuxPlaybackService._generate_tokens(
            organization=organization,
            playback_id=playback_id,
            expiration=expiration
        )

        return {
            "playback_url": playback_url,
            "playback_policy": "SIGNED",
            "tokens": tokens
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
            expiration = MuxPlaybackService.calculate_session_token_expiration(session)
        """
        if not session or not hasattr(session, 'duration_minutes') or not session.duration_minutes:
            return MuxPlaybackService.DEFAULT_TOKEN_EXPIRATION

        # Convert duration to seconds and add buffer
        session_duration_seconds = session.duration_minutes * 60
        return session_duration_seconds + MuxPlaybackService.EXPIRATION_BUFFER

    @staticmethod
    def _generate_tokens(organization, playback_id: str, expiration: int) -> Dict[str, str]:
        """
        Generate all 3 JWT tokens for Mux signed playback.

        Per Mux docs: "JWTs are granular, so a unique token is used for each resource."
        - Playback token: Authenticates video stream access
        - Thumbnail token: Retrieves poster/still images
        - Storyboard token: Enables timeline hover previews

        Args:
            organization: Organization with Mux signing credentials
            playback_id: Mux playback ID
            expiration: Token expiration in seconds from now

        Returns:
            {
                "playback": str (JWT),
                "thumbnail": str (JWT),
                "storyboard": str (JWT)
            }
        """
        # Get decrypted private key and key ID
        private_key_base64 = organization.get_mux_signing_private_key()
        signing_key_id = organization.mux_signing_key_id

        # Decode base64-encoded private key
        import base64
        private_key_pem = base64.b64decode(private_key_base64).decode('utf-8')

        # Load RSA private key
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )

        # Calculate expiration timestamp
        exp_timestamp = int(time.time() + expiration)

        # Generate tokens for each type
        tokens = {
            "playback": MuxPlaybackService._create_jwt(
                private_key=private_key,
                key_id=signing_key_id,
                audience=MuxPlaybackService.AUDIENCE_VIDEO,
                expiration=exp_timestamp,
                playback_id=playback_id
            ),
            "thumbnail": MuxPlaybackService._create_jwt(
                private_key=private_key,
                key_id=signing_key_id,
                audience=MuxPlaybackService.AUDIENCE_THUMBNAIL,
                expiration=exp_timestamp,
                playback_id=playback_id
            ),
            "storyboard": MuxPlaybackService._create_jwt(
                private_key=private_key,
                key_id=signing_key_id,
                audience=MuxPlaybackService.AUDIENCE_STORYBOARD,
                expiration=exp_timestamp,
                playback_id=playback_id
            )
        }

        return tokens

    @staticmethod
    def _create_jwt(
        private_key,
        key_id: str,
        audience: str,
        expiration: int,
        playback_id: str
    ) -> str:
        """
        Create a single JWT token for Mux playback.

        JWT Structure (from Mux docs):
        - Header: {"alg": "RS256", "kid": key_id}
        - Claims: {"sub": playback_id, "aud": audience, "exp": expiration, "kid": key_id}
        - Signature: RS256 (RSA + SHA256)

        Note: kid must be in BOTH the header and claims body per Mux requirements.

        Args:
            private_key: Cryptography RSA private key object
            key_id: Mux signing key ID
            audience: Token audience ("v", "t", "s", etc.)
            expiration: Unix timestamp for expiration
            playback_id: Mux playback ID

        Returns:
            JWT token string
        """
        # Build claims payload
        # Per Mux docs: sub (playback ID), aud (audience), exp (expiration), kid (key ID)
        payload = {
            "sub": playback_id,
            "aud": audience,
            "exp": expiration,
            "kid": key_id
        }

        # Sign with RS256 (RSA + SHA256)
        # kid must be in header as well per JWT spec
        token = jwt.encode(
            payload,
            private_key,
            algorithm="RS256",
            headers={"kid": key_id}
        )

        return token
