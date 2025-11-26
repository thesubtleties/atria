"""
Tests for Organization model JaaS credential management.

Tests the BYOA (Bring Your Own Account) JaaS credential storage with encryption.
"""
import pytest
from api.models import Organization
from api.commons.encryption import encrypt_secret, decrypt_secret


class TestOrganizationJaasCredentials:
    """Test Organization model JaaS credential management with encryption"""

    def test_set_jaas_credentials_basic(self, db):
        """Test setting JaaS credentials with all fields"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just for testing encryption format
        test_private_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-MIIEowIBAAKCAQEAtest123456789
-----END RSA PRIVATE KEY-----"""

        # Set JaaS credentials
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test123",
            api_key="test-api-key-abc123",
            private_key=test_private_key
        )
        db.session.commit()

        # Verify app ID stored as plaintext
        assert org.jaas_app_id == "vpaas-magic-cookie-test123"

        # Verify API key is encrypted (not plaintext)
        assert org.jaas_api_key_encrypted is not None
        assert org.jaas_api_key_encrypted != "test-api-key-abc123"

        # Verify private key is encrypted (not plaintext)
        assert org.jaas_private_key_encrypted is not None
        assert org.jaas_private_key_encrypted != test_private_key

    def test_get_jaas_api_key(self, db):
        """Test decrypting JaaS API key"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        original_api_key = "test-api-key-abc123xyz"
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key=original_api_key,
            private_key="fake-private-key"
        )
        db.session.commit()

        # Retrieve and decrypt
        decrypted_key = org.get_jaas_api_key()
        assert decrypted_key == original_api_key

    def test_get_jaas_private_key(self, db):
        """Test decrypting JaaS private key"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just for testing encryption format
        original_private_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-MIIEowIBAAKCAQEAtest123456789
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END RSA PRIVATE KEY-----"""

        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key="test-api-key",
            private_key=original_private_key
        )
        db.session.commit()

        # Retrieve and decrypt
        decrypted_key = org.get_jaas_private_key()
        assert decrypted_key == original_private_key

    def test_clear_jaas_credentials(self, db):
        """Test removing all JaaS credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set credentials
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key="test-api-key",
            private_key="test-private-key"
        )
        db.session.commit()

        # Verify credentials were set
        assert org.jaas_app_id is not None
        assert org.jaas_api_key_encrypted is not None
        assert org.jaas_private_key_encrypted is not None

        # Clear all credentials
        org.clear_jaas_credentials()
        db.session.commit()

        # Verify all fields are None
        assert org.jaas_app_id is None
        assert org.jaas_api_key_encrypted is None
        assert org.jaas_private_key_encrypted is None

    def test_has_jaas_credentials_property(self, db):
        """Test has_jaas_credentials property checks for all required fields"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Initially False
        assert org.has_jaas_credentials is False

        # Set only app ID (not enough)
        org.jaas_app_id = "vpaas-magic-cookie-test"
        db.session.commit()
        assert org.has_jaas_credentials is False

        # Set app ID and API key (still not enough - missing private key)
        org.jaas_api_key_encrypted = encrypt_secret("test-api-key")
        db.session.commit()
        assert org.has_jaas_credentials is False

        # Set all three fields
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key="test-api-key",
            private_key="test-private-key"
        )
        db.session.commit()
        assert org.has_jaas_credentials is True

    def test_roundtrip_database_persistence(self, db):
        """Test full roundtrip: set credentials, save, reload from DB, decrypt"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()
        org_id = org.id

        original_api_key = "prod-api-key-xyz789"
        # FAKE TEST KEY - Not a real RSA key
        original_private_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-PRODUCTION-KEY
MIIEowIBAAKCAQEAtest123456789abcdef
-----END RSA PRIVATE KEY-----"""

        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-prod123",
            api_key=original_api_key,
            private_key=original_private_key
        )
        db.session.commit()

        # Clear session to force reload from DB
        db.session.expire_all()

        # Reload organization from database
        reloaded_org = Organization.query.get(org_id)

        # Verify plaintext field
        assert reloaded_org.jaas_app_id == "vpaas-magic-cookie-prod123"

        # Verify encrypted fields are encrypted
        assert reloaded_org.jaas_api_key_encrypted != original_api_key
        assert reloaded_org.jaas_private_key_encrypted != original_private_key

        # Verify decryption works
        assert reloaded_org.get_jaas_api_key() == original_api_key
        assert reloaded_org.get_jaas_private_key() == original_private_key

    def test_decrypt_none_returns_none(self, db):
        """Test that decrypting None/empty values returns None"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # No credentials set
        assert org.get_jaas_api_key() is None
        assert org.get_jaas_private_key() is None

    def test_update_existing_credentials(self, db):
        """Test updating existing JaaS credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Set initial credentials
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-old",
            api_key="old-api-key",
            private_key="old-private-key"
        )
        db.session.commit()

        # Update with new credentials
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-new",
            api_key="new-api-key",
            private_key="new-private-key"
        )
        db.session.commit()

        # Verify updated values
        assert org.jaas_app_id == "vpaas-magic-cookie-new"
        assert org.get_jaas_api_key() == "new-api-key"
        assert org.get_jaas_private_key() == "new-private-key"

    def test_unicode_in_credentials(self, db):
        """Test that credentials with unicode characters work correctly"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        unicode_api_key = "api-key-with-unicode-🔐-chars"
        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key=unicode_api_key,
            private_key="test-private-key"
        )
        db.session.commit()

        # Verify roundtrip with unicode
        assert org.get_jaas_api_key() == unicode_api_key

    def test_long_private_key(self, db):
        """Test that very long private keys (real RSA keys) encrypt/decrypt properly"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # FAKE TEST KEY - Not a real RSA key, just proper length for testing encryption
        # Real RSA 2048-bit keys are typically 1700-1800 characters
        long_key = """-----BEGIN RSA PRIVATE KEY-----
FAKE-TEST-KEY-NOT-REAL-2048bit-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
TESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTKEYTESTK
NOTAREALRSAKEYJUSTFORTESTINGENCRYPTIONANDDECRYPTIONOFVERYLONGCREDENTIAL
THISISSIMULATINGTHE2048BITKEYLENGTHBUTCONTENTISCLEARLYFAKEFORTESTSUITE
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
-----END RSA PRIVATE KEY-----"""

        org.set_jaas_credentials(
            app_id="vpaas-magic-cookie-test",
            api_key="test-api-key",
            private_key=long_key
        )
        db.session.commit()

        # Verify long key roundtrip
        assert org.get_jaas_private_key() == long_key

    def test_app_id_formats(self, db):
        """Test various JaaS app ID formats"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Different app ID formats
        app_ids = [
            "vpaas-magic-cookie-1234567890abcdef",  # Standard format
            "test-app-id",  # Custom format
            "app123",  # Short format
            "vpaas-magic-cookie-1234567890abcdef1234567890abcdef",  # Long format
        ]

        for app_id in app_ids:
            org.set_jaas_credentials(
                app_id=app_id,
                api_key="test-api-key",
                private_key="test-private-key"
            )
            db.session.commit()

            assert org.jaas_app_id == app_id
            db.session.expire_all()
            reloaded = Organization.query.get(org.id)
            assert reloaded.jaas_app_id == app_id

    def test_encryption_produces_different_ciphertext(self, db):
        """Test that encrypting the same value twice produces different ciphertext (Fernet uses IV)"""
        org1 = Organization(name="Test Org 1")
        org2 = Organization(name="Test Org 2")
        db.session.add(org1)
        db.session.add(org2)
        db.session.commit()

        same_api_key = "identical-api-key-123"
        same_private_key = "identical-private-key-xyz"

        # Set identical credentials on both orgs
        org1.set_jaas_credentials(
            app_id="app1",
            api_key=same_api_key,
            private_key=same_private_key
        )
        org2.set_jaas_credentials(
            app_id="app2",
            api_key=same_api_key,
            private_key=same_private_key
        )
        db.session.commit()

        # Encrypted values should differ (Fernet includes random IV)
        assert org1.jaas_api_key_encrypted != org2.jaas_api_key_encrypted
        assert org1.jaas_private_key_encrypted != org2.jaas_private_key_encrypted

        # But decrypted values should match
        assert org1.get_jaas_api_key() == org2.get_jaas_api_key()
        assert org1.get_jaas_private_key() == org2.get_jaas_private_key()

    def test_partial_credentials_not_valid(self, db):
        """Test that having partial credentials doesn't satisfy has_jaas_credentials"""
        org = Organization(name="Test Org")
        db.session.add(org)
        db.session.commit()

        # Only app ID
        org.jaas_app_id = "test-app-id"
        assert org.has_jaas_credentials is False

        # App ID + API key (missing private key)
        org.jaas_api_key_encrypted = encrypt_secret("test-api-key")
        assert org.has_jaas_credentials is False

        # App ID + private key (missing API key)
        org.jaas_api_key_encrypted = None
        org.jaas_private_key_encrypted = encrypt_secret("test-private-key")
        assert org.has_jaas_credentials is False

        # All three required
        org.set_jaas_credentials(
            app_id="test-app-id",
            api_key="test-api-key",
            private_key="test-private-key"
        )
        assert org.has_jaas_credentials is True
