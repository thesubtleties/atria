"""
Tests for JaaSService - BYOA JaaS JWT token generation.

Tests JWT generation for Jitsi as a Service (JaaS) with per-user tokens and
moderator permissions.
"""
import pytest
import jwt
import time
from datetime import timedelta
from api.models import Organization, User, Session, Event
from api.models.enums import SessionType, SessionChatMode, SessionStatus, EventUserRole
from api.services.jaas_service import JaaSService
from tests.factories.user_factory import UserFactory
from tests.factories.event_factory import EventFactory
from tests.factories.organization_factory import OrganizationFactory


class TestJaasTokenGeneration:
    """Test JaaS JWT token generation"""

    @pytest.fixture
    def org_with_jaas_credentials(self, db):
        """Organization with JaaS credentials and real RSA key"""
        org = OrganizationFactory()

        # Generate real RSA key pair for testing JWT signing
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

        # Set JaaS credentials with real key
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test123",
            api_key="test-api-key-abc",
            private_key=private_pem
        )
        db.session.commit()

        return org

    def test_generate_token_basic(self, db, org_with_jaas_credentials):
        """Test generating basic JaaS token"""
        user = UserFactory()
        room_name = "test-room-123"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        # Verify return structure
        assert "token" in token_data
        assert "expires_at" in token_data
        assert isinstance(token_data["token"], str)
        assert isinstance(token_data["expires_at"], int)
        assert len(token_data["token"]) > 100  # JWT tokens are long

    def test_generated_token_is_valid_jwt(self, db, org_with_jaas_credentials):
        """Test that generated token is a valid JWT that can be decoded"""
        user = UserFactory(first_name="Test", last_name="User", email="test@example.com")
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        # Decode WITHOUT verification (we don't need to verify, just parse structure)
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify JWT structure
        assert decoded["aud"] == "jitsi"
        assert decoded["iss"] == "chat"
        assert decoded["sub"] == org_with_jaas_credentials.jaas_app_id
        assert decoded["room"] == room_name
        assert "exp" in decoded
        assert "nbf" in decoded
        assert "context" in decoded

    def test_token_context_includes_user_info(self, db, org_with_jaas_credentials):
        """Test that token includes user information in context"""
        user = UserFactory(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            image_url="https://example.com/avatar.jpg"
        )
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify user context
        user_context = decoded["context"]["user"]
        assert user_context["id"] == str(user.id)
        assert user_context["name"] == "John Doe"
        assert user_context["email"] == "john@example.com"
        assert user_context["avatar"] == "https://example.com/avatar.jpg"
        assert user_context["moderator"] == "false"  # String, not boolean

    def test_token_moderator_features(self, db, org_with_jaas_credentials):
        """Test that moderator token includes correct features"""
        user = UserFactory()
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=True  # Moderator
        )

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify moderator features
        user_context = decoded["context"]["user"]
        features = decoded["context"]["features"]

        assert user_context["moderator"] == "true"  # String
        assert features["recording"] == "true"
        assert features["livestreaming"] == "true"
        assert features["file-upload"] == "true"
        assert features["list-visitors"] == "true"

    def test_token_attendee_features(self, db, org_with_jaas_credentials):
        """Test that attendee token includes restricted features"""
        user = UserFactory()
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False  # Attendee
        )

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify attendee features (restricted)
        user_context = decoded["context"]["user"]
        features = decoded["context"]["features"]

        assert user_context["moderator"] == "false"  # String
        assert features["recording"] == "false"  # No recording
        assert features["livestreaming"] == "false"  # No streaming
        assert features["file-upload"] == "false"  # No file upload
        assert features["list-visitors"] == "true"  # Can see participants

    def test_token_without_avatar(self, db, org_with_jaas_credentials):
        """Test token generation for user without avatar"""
        user = UserFactory()
        # Bypass auto-generation by directly setting to None after creation
        user.image_url = None
        db.session.commit()
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Avatar should not be in context
        user_context = decoded["context"]["user"]
        assert "avatar" not in user_context

    def test_token_header_includes_api_key(self, db, org_with_jaas_credentials):
        """Test that JWT header includes API key as kid"""
        user = UserFactory()
        room_name = "test-room"

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        # Decode header
        header = jwt.get_unverified_header(token_data["token"])

        assert header["alg"] == "RS256"
        assert header["typ"] == "JWT"
        assert header["kid"] == "test-api-key-abc"  # API key in header

    def test_generate_token_without_credentials_raises_error(self, db):
        """Test that generating token without credentials raises ValueError"""
        org = OrganizationFactory()  # No JaaS credentials
        user = UserFactory()

        with pytest.raises(ValueError) as exc_info:
            JaaSService.generate_token(
                organization=org,
                room_name="test-room",
                user=user,
                is_moderator=False
            )

        assert "does not have JaaS credentials" in str(exc_info.value)

    def test_token_expiration_default(self, db, org_with_jaas_credentials):
        """Test default token expiration (8 hours)"""
        user = UserFactory()
        room_name = "test-room"

        before_time = int(time.time())

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        after_time = int(time.time())

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify expiration is ~8 hours from now
        expected_exp = before_time + JaaSService.DEFAULT_TOKEN_EXPIRATION
        assert decoded["exp"] >= expected_exp
        assert decoded["exp"] <= after_time + JaaSService.DEFAULT_TOKEN_EXPIRATION

        # Verify expires_at matches JWT exp
        assert token_data["expires_at"] == decoded["exp"]

    def test_token_expiration_custom(self, db, org_with_jaas_credentials):
        """Test custom token expiration"""
        user = UserFactory()
        room_name = "test-room"
        custom_expiration = 2 * 60 * 60  # 2 hours

        before_time = int(time.time())

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False,
            token_expiration=custom_expiration
        )

        after_time = int(time.time())

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # Verify expiration is ~2 hours from now
        expected_exp = before_time + custom_expiration
        assert decoded["exp"] >= expected_exp
        assert decoded["exp"] <= after_time + custom_expiration

    def test_token_nbf_accounts_for_clock_skew(self, db, org_with_jaas_credentials):
        """Test that nbf (not before) is set to account for clock skew"""
        user = UserFactory()
        room_name = "test-room"

        before_time = int(time.time())

        token_data = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name,
            user=user,
            is_moderator=False
        )

        after_time = int(time.time())

        # Decode token
        decoded = jwt.decode(
            token_data["token"],
            options={"verify_signature": False}
        )

        # nbf should be ~10 seconds before now (clock skew tolerance)
        expected_nbf = before_time - JaaSService.NBF_DELAY
        assert decoded["nbf"] <= expected_nbf + 1  # Allow 1 second tolerance
        assert decoded["nbf"] >= after_time - JaaSService.NBF_DELAY - 1

    def test_token_room_locking(self, db, org_with_jaas_credentials):
        """Test that token is locked to specific room"""
        user = UserFactory()
        room_name_1 = "room-one"
        room_name_2 = "room-two"

        token_1 = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name_1,
            user=user,
            is_moderator=False
        )

        token_2 = JaaSService.generate_token(
            organization=org_with_jaas_credentials,
            room_name=room_name_2,
            user=user,
            is_moderator=False
        )

        # Decode both tokens
        decoded_1 = jwt.decode(token_1["token"], options={"verify_signature": False})
        decoded_2 = jwt.decode(token_2["token"], options={"verify_signature": False})

        # Tokens should be locked to different rooms
        assert decoded_1["room"] == room_name_1
        assert decoded_2["room"] == room_name_2
        assert decoded_1["room"] != decoded_2["room"]


class TestSessionTokenExpiration:
    """Test smart token expiration based on session duration"""

    def test_calculate_session_token_expiration(self, app, db):
        """Test calculating expiration from session duration"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)

            # Session with 2-hour duration (120 minutes)
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(12, 0),  # 2 hours
                day_number=1,
                session_type=SessionType.WORKSHOP,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Calculate expiration
            expiration = JaaSService.calculate_session_token_expiration(session)

            # Should be 2 hours (120 min) + 1 hour buffer = 3 hours = 10800 seconds
            expected = (120 * 60) + JaaSService.EXPIRATION_BUFFER
            assert expiration == expected
            assert expiration == 10800  # 3 hours in seconds

    def test_calculate_session_token_expiration_none_session(self):
        """Test fallback when session is None"""
        expiration = JaaSService.calculate_session_token_expiration(None)
        assert expiration == JaaSService.DEFAULT_TOKEN_EXPIRATION

    def test_session_token_with_duration(self, app, db, org_with_jaas_credentials):
        """Test generating token with session-based expiration"""
        with app.app_context():
            user = UserFactory()
            event = EventFactory(organization_id=org_with_jaas_credentials.id)

            # 90-minute session
            from datetime import time as dt_time
            session = Session(
                event_id=event.id,
                title="Short Session",
                start_time=dt_time(14, 0),
                end_time=dt_time(15, 30),  # 90 minutes
                day_number=1,
                session_type=SessionType.PRESENTATION,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Calculate smart expiration
            token_exp = JaaSService.calculate_session_token_expiration(session)

            # Generate token
            before_time = int(time.time())
            token_data = JaaSService.generate_token(
                organization=org_with_jaas_credentials,
                room_name="test-room",
                user=user,
                is_moderator=False,
                token_expiration=token_exp
            )

            # Verify expiration is 90 min + 60 min buffer = 150 minutes = 9000 seconds
            expected_exp = before_time + 9000
            assert token_data["expires_at"] >= expected_exp
            assert token_data["expires_at"] <= expected_exp + 2  # Allow 2 sec tolerance

    @pytest.fixture
    def org_with_jaas_credentials(self, db):
        """Organization with JaaS credentials"""
        org = OrganizationFactory()

        # Generate real RSA key
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

        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key="test-api-key",
            private_key=private_pem
        )
        db.session.commit()

        return org


class TestModeratorPermissions:
    """Test is_user_moderator logic"""

    def test_event_admin_is_moderator(self, app, db):
        """Test that event ADMIN has moderator permissions"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)
            user = UserFactory()

            # Add user as EVENT ADMIN
            event.add_user(user, EventUserRole.ADMIN)
            db.session.commit()

            # Create session
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.WORKSHOP,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Check moderator status
            is_mod = JaaSService.is_user_moderator(user, session)
            assert is_mod is True

    def test_event_organizer_is_moderator(self, app, db):
        """Test that event ORGANIZER has moderator permissions"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)
            user = UserFactory()

            # Add user as EVENT ORGANIZER
            event.add_user(user, EventUserRole.ORGANIZER)
            db.session.commit()

            # Create session
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.PANEL,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Check moderator status
            is_mod = JaaSService.is_user_moderator(user, session)
            assert is_mod is True

    def test_event_speaker_not_moderator(self, app, db):
        """Test that event SPEAKER does not have moderator permissions"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)
            user = UserFactory()

            # Add user as EVENT SPEAKER
            event.add_user(user, EventUserRole.SPEAKER)
            db.session.commit()

            # Create session
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.KEYNOTE,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Check moderator status
            is_mod = JaaSService.is_user_moderator(user, session)
            assert is_mod is False

    def test_event_attendee_not_moderator(self, app, db):
        """Test that event ATTENDEE does not have moderator permissions"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)
            user = UserFactory()

            # Add user as EVENT ATTENDEE
            event.add_user(user, EventUserRole.ATTENDEE)
            db.session.commit()

            # Create session
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.WORKSHOP,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Check moderator status
            is_mod = JaaSService.is_user_moderator(user, session)
            assert is_mod is False

    def test_user_not_in_event_not_moderator(self, app, db):
        """Test that user not in event does not have moderator permissions"""
        with app.app_context():
            org = OrganizationFactory()
            event = EventFactory(organization_id=org.id)
            user = UserFactory()  # Not added to event

            # Create session
            from datetime import time
            session = Session(
                event_id=event.id,
                title="Test Session",
                start_time=time(10, 0),
                end_time=time(11, 0),
                day_number=1,
                session_type=SessionType.PRESENTATION,
                status=SessionStatus.SCHEDULED,
                chat_mode=SessionChatMode.ENABLED
            )
            db.session.add(session)
            db.session.commit()

            # Check moderator status
            is_mod = JaaSService.is_user_moderator(user, session)
            assert is_mod is False
