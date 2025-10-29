"""
Tests for MuxPlaybackService - BYOA signed playback URL generation.

Tests JWT generation for Mux signed playback (playback, thumbnail, storyboard tokens).
"""
import pytest
import jwt
import time
from datetime import datetime, timedelta
from api.models import Organization
from api.services.mux_playback_service import MuxPlaybackService


class TestMuxPlaybackServicePublicPlayback:
    """Test PUBLIC playback (no tokens needed)"""

    def test_get_playback_url_public_policy(self, db):
        """Test generating public playback URL (no tokens)"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        playback_id = "test-playback-id-abc123"
        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id=playback_id,
            playback_policy="PUBLIC"
        )

        # PUBLIC playback doesn't need tokens
        assert result["playback_url"] == f"https://stream.mux.com/{playback_id}.m3u8"
        assert result["playback_policy"] == "PUBLIC"
        assert result["tokens"] is None

    def test_get_playback_url_public_without_org_credentials(self, db):
        """Test PUBLIC playback works even without org credentials"""
        org = Organization(name="Test Org")
        # No Mux credentials set
        db.session.add(org)
        db.session.commit()

        playback_id = "test-playback-id"
        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id=playback_id,
            playback_policy="PUBLIC"
        )

        # Should work fine - PUBLIC doesn't need credentials
        assert result["playback_url"] == f"https://stream.mux.com/{playback_id}.m3u8"
        assert result["tokens"] is None


class TestMuxPlaybackServiceSignedPlayback:
    """Test SIGNED playback (requires JWT tokens)"""

    @pytest.fixture
    def org_with_signing_credentials(self, db):
        """Organization with Mux signing credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Generate test RSA key pair
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-token-secret",
            signing_key_id="test-signing-key-id",
            signing_private_key=private_pem
        )
        db.session.commit()

        return org

    def test_get_playback_url_signed_policy(self, db, org_with_signing_credentials):
        """Test generating signed playback URL with JWT tokens"""
        playback_id = "test-playback-id"
        result = MuxPlaybackService.get_playback_url(
            organization=org_with_signing_credentials,
            playback_id=playback_id,
            playback_policy="SIGNED"
        )

        # Verify URL structure
        assert result["playback_url"] == f"https://stream.mux.com/{playback_id}.m3u8"
        assert result["playback_policy"] == "SIGNED"
        assert result["tokens"] is not None

        # Verify all 3 tokens generated
        tokens = result["tokens"]
        assert "playback" in tokens
        assert "thumbnail" in tokens
        assert "storyboard" in tokens
        assert all(isinstance(t, str) for t in tokens.values())

    def test_signed_tokens_are_valid_jwts(self, db, org_with_signing_credentials):
        """Test that generated tokens are valid JWTs with correct claims"""
        playback_id = "test-playback-id"
        result = MuxPlaybackService.get_playback_url(
            organization=org_with_signing_credentials,
            playback_id=playback_id,
            playback_policy="SIGNED"
        )

        tokens = result["tokens"]

        # Get public key from org's private key for verification
        private_key_pem = org_with_signing_credentials.get_mux_signing_private_key()
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        # Verify each token
        for token_type, token in tokens.items():
            # Determine expected audience for this token type
            expected_aud = {
                "playback": "v",
                "thumbnail": "t",
                "storyboard": "s"
            }[token_type]

            # Decode with audience validation
            decoded = jwt.decode(
                token,
                public_pem,
                algorithms=["RS256"],
                audience=expected_aud  # Pass expected audience for validation
            )

            # Verify required claims
            assert "exp" in decoded  # Expiration
            assert "aud" in decoded  # Audience
            assert "kid" in decoded  # Key ID

            # Verify audience matches token type
            assert decoded["aud"] == expected_aud

            # Verify key ID matches org's signing key
            assert decoded["kid"] == org_with_signing_credentials.mux_signing_key_id

            # Verify expiration is in the future
            assert decoded["exp"] > time.time()

    def test_signed_playback_without_org_credentials_raises_error(self, db):
        """Test that SIGNED playback requires org credentials"""
        org = Organization(name="Test Org")
        # No credentials set
        db.session.add(org)
        db.session.commit()

        with pytest.raises(ValueError, match="Organization does not have Mux signing credentials"):
            MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id="test-playback-id",
                playback_policy="SIGNED"
            )

    def test_signed_playback_without_signing_credentials_raises_error(self, db):
        """Test that SIGNED playback requires signing credentials (not just API credentials)"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set only API credentials (no signing credentials)
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-token-secret"
        )
        db.session.commit()

        with pytest.raises(ValueError, match="Organization does not have Mux signing credentials"):
            MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id="test-playback-id",
                playback_policy="SIGNED"
            )

    def test_token_expiration_default(self, db, org_with_signing_credentials):
        """Test that tokens have a reasonable default expiration"""
        result = MuxPlaybackService.get_playback_url(
            organization=org_with_signing_credentials,
            playback_id="test-playback-id",
            playback_policy="SIGNED"
        )

        # Get public key for verification
        private_key_pem = org_with_signing_credentials.get_mux_signing_private_key()
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        # Check expiration is around default (8 hours)
        for token in result["tokens"].values():
            decoded = jwt.decode(
                token,
                public_pem,
                algorithms=["RS256"],
                options={"verify_aud": False}  # Skip audience validation
            )
            exp_time = datetime.fromtimestamp(decoded["exp"])
            now = datetime.now()

            time_until_exp = exp_time - now
            # Should be around 8 hours (default)
            assert timedelta(hours=7) <= time_until_exp <= timedelta(hours=9)

    def test_token_expiration_custom(self, db, org_with_signing_credentials):
        """Test custom token expiration"""
        custom_expiration = 3600  # 1 hour in seconds
        result = MuxPlaybackService.get_playback_url(
            organization=org_with_signing_credentials,
            playback_id="test-playback-id",
            playback_policy="SIGNED",
            token_expiration=custom_expiration
        )

        # Get public key for verification
        private_key_pem = org_with_signing_credentials.get_mux_signing_private_key()
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        for token in result["tokens"].values():
            decoded = jwt.decode(
                token,
                public_pem,
                algorithms=["RS256"],
                options={"verify_aud": False}  # Skip audience validation
            )
            exp_time = datetime.fromtimestamp(decoded["exp"])
            now = datetime.now()

            time_until_exp = (exp_time - now).total_seconds()
            # Should be close to 1 hour (within 5 seconds)
            assert abs(time_until_exp - custom_expiration) < 5


class TestMuxPlaybackServiceSessionDuration:
    """Test smart token expiration based on session duration"""

    def test_calculate_session_token_expiration(self, db):
        """Test calculating token expiration from session duration"""
        from api.models import Event, Organization, Session
        from api.models.enums import EventType, SessionType, SessionStatus
        from datetime import date, time

        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()

        event = Event(
            organization_id=org.id,
            title="Test Event",
            event_type=EventType.CONFERENCE,
            company_name="Test Company",
            slug="test-event-" + str(org.id),  # Unique slug
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 1),
            timezone="America/New_York"
        )
        db.session.add(event)
        db.session.flush()

        # Create 90-minute session
        session = Session(
            event_id=event.id,
            title="Test Session",
            session_type=SessionType.PRESENTATION,
            status=SessionStatus.SCHEDULED,
            start_time=time(10, 0),
            end_time=time(11, 30),  # 90 minutes
            day_number=1
        )
        db.session.add(session)
        db.session.commit()

        # Calculate expiration
        expiration = MuxPlaybackService.calculate_session_token_expiration(session)

        # Should be 90 minutes (5400 seconds) + 1 hour buffer (3600 seconds) = 9000 seconds
        expected = (90 * 60) + (60 * 60)
        assert expiration == expected

    def test_calculate_session_token_expiration_no_duration(self, db):
        """Test that sessions without duration get default expiration"""
        expiration = MuxPlaybackService.calculate_session_token_expiration(None)

        # Should return default (8 hours)
        assert expiration == 8 * 60 * 60

    def test_signed_playback_with_session_duration(self, db):
        """Test generating signed playback URL with session-based expiration"""
        from api.models import Event, Organization, Session
        from api.models.enums import EventType, SessionType, SessionStatus
        from datetime import date, time
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.flush()

        # Generate test credentials
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-token-secret",
            signing_key_id="test-signing-key-id",
            signing_private_key=private_pem
        )
        db.session.flush()

        event = Event(
            organization_id=org.id,
            title="Test Event",
            event_type=EventType.CONFERENCE,
            company_name="Test Company",
            slug="test-event-" + str(org.id),  # Unique slug
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 1),
            timezone="America/New_York"
        )
        db.session.add(event)
        db.session.flush()

        # Create 2-hour session
        session = Session(
            event_id=event.id,
            title="Test Session",
            session_type=SessionType.PRESENTATION,
            status=SessionStatus.SCHEDULED,
            start_time=time(14, 0),
            end_time=time(16, 0),  # 2 hours
            day_number=1
        )
        db.session.add(session)
        db.session.commit()

        # Calculate smart expiration
        token_exp = MuxPlaybackService.calculate_session_token_expiration(session)

        # Generate playback URL with session-based expiration
        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id="test-playback-id",
            playback_policy="SIGNED",
            token_expiration=token_exp
        )

        # Get public key for verification
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        # Verify token expiration matches session duration + buffer
        for token in result["tokens"].values():
            decoded = jwt.decode(
                token,
                public_pem,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )

            exp_time = datetime.fromtimestamp(decoded["exp"])
            now = datetime.now()
            time_until_exp = (exp_time - now).total_seconds()

            # Should be close to 3 hours (2hr session + 1hr buffer)
            expected_duration = (2 * 60 * 60) + (60 * 60)  # 3 hours
            assert abs(time_until_exp - expected_duration) < 5  # Within 5 seconds


class TestMuxPlaybackServiceEdgeCases:
    """Test edge cases and validation"""

    def test_invalid_playback_policy_raises_error(self, db):
        """Test that invalid playback policy raises error"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        with pytest.raises(ValueError, match="Invalid playback_policy"):
            MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id="test-playback-id",
                playback_policy="INVALID"
            )

    def test_empty_playback_id_raises_error(self, db):
        """Test that empty playback ID raises error"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        with pytest.raises(ValueError, match="playback_id is required"):
            MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id="",
                playback_policy="PUBLIC"
            )

    def test_none_playback_id_raises_error(self, db):
        """Test that None playback ID raises error"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        with pytest.raises(ValueError, match="playback_id is required"):
            MuxPlaybackService.get_playback_url(
                organization=org,
                playback_id=None,
                playback_policy="PUBLIC"
            )

    def test_playback_id_with_special_characters(self, db):
        """Test playback IDs with special characters"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        playback_id = "test-123_ABC.xyz"
        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id=playback_id,
            playback_policy="PUBLIC"
        )

        assert result["playback_url"] == f"https://stream.mux.com/{playback_id}.m3u8"


class TestMuxPlaybackServiceReturnFormat:
    """Test service return data structure"""

    def test_return_format_public(self, db):
        """Test return format for PUBLIC playback"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id="test-id",
            playback_policy="PUBLIC"
        )

        # Verify structure
        assert isinstance(result, dict)
        assert "playback_url" in result
        assert "playback_policy" in result
        assert "tokens" in result
        assert result["tokens"] is None

    def test_return_format_signed(self, db):
        """Test return format for SIGNED playback"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Generate test credentials
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-token-secret",
            signing_key_id="test-signing-key-id",
            signing_private_key=private_pem
        )
        db.session.commit()

        result = MuxPlaybackService.get_playback_url(
            organization=org,
            playback_id="test-id",
            playback_policy="SIGNED"
        )

        # Verify structure
        assert isinstance(result, dict)
        assert "playback_url" in result
        assert "playback_policy" in result
        assert "tokens" in result

        # Verify tokens structure
        tokens = result["tokens"]
        assert isinstance(tokens, dict)
        assert set(tokens.keys()) == {"playback", "thumbnail", "storyboard"}
        assert all(isinstance(v, str) for v in tokens.values())
