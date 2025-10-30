"""
Tests for Organization model Mux credential management.

Tests the BYOA (Bring Your Own Account) Mux credential storage with encryption.
"""
import pytest
from api.models import Organization
from api.commons.encryption import encrypt_secret, decrypt_secret


class TestOrganizationMuxCredentials:
    """Test Organization model Mux credential management with encryption"""

    def test_set_mux_credentials_basic(self, db):
        """Test setting basic Mux API credentials (token only)"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set basic API credentials (no signing credentials)
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret-key-abc123"
        )
        db.session.commit()

        # Verify token ID stored as plaintext
        assert org.mux_token_id == "test-token-id"

        # Verify token secret is encrypted (not plaintext)
        assert org.mux_token_secret is not None
        assert org.mux_token_secret != "test-secret-key-abc123"

        # Verify signing credentials are None
        assert org.mux_signing_key_id is None
        assert org.mux_signing_private_key is None

    def test_set_mux_credentials_with_signing(self, db):
        """Test setting Mux credentials with signing key for signed URLs"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just for testing encryption format
        test_private_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-MIIEowIBAAKCAQEAtest123456789
-----END RSA PRIVATE KEY-----"""

        # Set full credentials including signing
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret-key",
            signing_key_id="test-signing-key-id",
            signing_private_key=test_private_key
        )
        db.session.commit()

        # Verify all fields set
        assert org.mux_token_id == "test-token-id"
        assert org.mux_token_secret is not None
        assert org.mux_signing_key_id == "test-signing-key-id"
        assert org.mux_signing_private_key is not None

        # Verify private key is encrypted
        assert org.mux_signing_private_key != test_private_key

    def test_get_mux_token_secret(self, db):
        """Test decrypting Mux token secret"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        original_secret = "test-secret-key-abc123"
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret=original_secret
        )
        db.session.commit()

        # Retrieve and decrypt
        decrypted_secret = org.get_mux_token_secret()
        assert decrypted_secret == original_secret

    def test_get_mux_signing_private_key(self, db):
        """Test decrypting Mux signing private key"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just for testing encryption format
        original_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-MIIEowIBAAKCAQEAtest123456789
-----END RSA PRIVATE KEY-----"""

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret",
            signing_key_id="test-key-id",
            signing_private_key=original_key
        )
        db.session.commit()

        # Retrieve and decrypt
        decrypted_key = org.get_mux_signing_private_key()
        assert decrypted_key == original_key

    def test_clear_mux_credentials(self, db):
        """Test removing all Mux credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set credentials
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret",
            signing_key_id="test-key-id",
            signing_private_key="test-private-key"
        )
        db.session.commit()

        # Clear all credentials
        org.clear_mux_credentials()
        db.session.commit()

        # Verify all fields are None
        assert org.mux_token_id is None
        assert org.mux_token_secret is None
        assert org.mux_signing_key_id is None
        assert org.mux_signing_private_key is None

    def test_has_mux_credentials_property(self, db):
        """Test has_mux_credentials property checks for basic API credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Initially False
        assert org.has_mux_credentials is False

        # Set only token ID (not enough)
        org.mux_token_id = "test-token-id"
        db.session.commit()
        assert org.has_mux_credentials is False

        # Set both token ID and secret
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret"
        )
        db.session.commit()
        assert org.has_mux_credentials is True

    def test_has_mux_signing_credentials_property(self, db):
        """Test has_mux_signing_credentials property checks for signing credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Initially False
        assert org.has_mux_signing_credentials is False

        # Set basic API credentials (no signing)
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret"
        )
        db.session.commit()
        assert org.has_mux_signing_credentials is False

        # Set full credentials with signing
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret",
            signing_key_id="test-key-id",
            signing_private_key="test-private-key"
        )
        db.session.commit()
        assert org.has_mux_signing_credentials is True

    def test_partial_signing_credentials_not_valid(self, db):
        """Test that having only signing key ID without private key is not considered valid"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret"
        )
        # Manually set only signing key ID
        org.mux_signing_key_id = "test-key-id"
        db.session.commit()

        # Should be False because private key is missing
        assert org.has_mux_signing_credentials is False

    def test_roundtrip_database_persistence(self, db):
        """Test full roundtrip: set credentials, save, reload from DB, decrypt"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()
        org_id = org.id

        original_secret = "super-secret-token-abc123"
        # FAKE TEST KEY - Not a real RSA key
        original_key = "-----BEGIN RSA PRIVATE KEY-----\nFAKE-TEST-KEY-NOT-REAL\n-----END RSA PRIVATE KEY-----"

        org.set_mux_credentials(
            token_id="prod-token-id",
            token_secret=original_secret,
            signing_key_id="prod-key-id",
            signing_private_key=original_key
        )
        db.session.commit()

        # Clear session to force reload from DB
        db.session.expire_all()

        # Reload organization from database
        reloaded_org = Organization.query.get(org_id)

        # Verify plaintext fields
        assert reloaded_org.mux_token_id == "prod-token-id"
        assert reloaded_org.mux_signing_key_id == "prod-key-id"

        # Verify encrypted fields are encrypted
        assert reloaded_org.mux_token_secret != original_secret
        assert reloaded_org.mux_signing_private_key != original_key

        # Verify decryption works
        assert reloaded_org.get_mux_token_secret() == original_secret
        assert reloaded_org.get_mux_signing_private_key() == original_key

    def test_decrypt_none_returns_none(self, db):
        """Test that decrypting None/empty values returns None"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # No credentials set
        assert org.get_mux_token_secret() is None
        assert org.get_mux_signing_private_key() is None

    def test_set_credentials_without_signing(self, db):
        """Test setting credentials with None/empty signing credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set credentials with explicit None for signing
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret",
            signing_key_id=None,
            signing_private_key=None
        )
        db.session.commit()

        assert org.has_mux_credentials is True
        assert org.has_mux_signing_credentials is False
        assert org.mux_signing_key_id is None
        assert org.mux_signing_private_key is None

    def test_update_existing_credentials(self, db):
        """Test updating existing Mux credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set initial credentials
        org.set_mux_credentials(
            token_id="old-token-id",
            token_secret="old-secret"
        )
        db.session.commit()

        # Update with new credentials
        org.set_mux_credentials(
            token_id="new-token-id",
            token_secret="new-secret",
            signing_key_id="new-key-id",
            signing_private_key="new-private-key"
        )
        db.session.commit()

        # Verify updated values
        assert org.mux_token_id == "new-token-id"
        assert org.get_mux_token_secret() == "new-secret"
        assert org.mux_signing_key_id == "new-key-id"
        assert org.get_mux_signing_private_key() == "new-private-key"

    def test_unicode_in_credentials(self, db):
        """Test that credentials with unicode characters work correctly"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        unicode_secret = "secret-with-unicode-🔐-chars"
        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret=unicode_secret
        )
        db.session.commit()

        # Verify roundtrip with unicode
        assert org.get_mux_token_secret() == unicode_secret

    def test_long_credentials(self, db):
        """Test that very long credentials (like RSA keys) encrypt/decrypt properly"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just proper length for testing encryption
        # Real RSA keys would have valid base64-encoded ASN.1 structure
        long_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-2048bit-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
TESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTK
NOTAREALRSAKEYJUSTFORTESTINGENCRYPTIONANDDECRYPTIONOFVERYLONGCREDENTIAL
THISISSIMULATINGTHE2048BITKEYLENGTHBUTCONTENTISCLEARLYFAKEFORTESTSUITE
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END RSA PRIVATE KEY-----"""

        org.set_mux_credentials(
            token_id="test-token-id",
            token_secret="test-secret",
            signing_key_id="test-key-id",
            signing_private_key=long_key
        )
        db.session.commit()

        # Verify long key roundtrip
        assert org.get_mux_signing_private_key() == long_key
