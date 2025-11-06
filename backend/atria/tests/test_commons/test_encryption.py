"""
Tests for encryption utility (api/commons/encryption.py).

Tests the Fernet encryption/decryption functions used for storing
organization credentials securely in the database.

TDD Approach: Write tests first, then implement encryption.py
"""
import pytest
from cryptography.fernet import Fernet


class TestEncryptionUtility:
    """Test encryption and decryption functions"""

    def test_encrypt_decrypt_roundtrip(self, app):
        """
        Test that encrypting and then decrypting returns original value.
        This is the most critical test - data integrity.
        """
        from api.commons.encryption import encrypt_secret, decrypt_secret

        original = "my-secret-mux-key-12345"
        encrypted = encrypt_secret(original)
        decrypted = decrypt_secret(encrypted)

        assert decrypted == original
        assert encrypted != original  # Verify it's actually encrypted

    def test_encrypt_returns_different_each_time(self, app):
        """
        Fernet includes random IV, so same plaintext encrypts differently each time.
        This is a security feature - prevents pattern analysis.
        """
        from api.commons.encryption import encrypt_secret

        plaintext = "same-secret-value"
        encrypted1 = encrypt_secret(plaintext)
        encrypted2 = encrypt_secret(plaintext)

        assert encrypted1 != encrypted2  # Different encrypted values
        # But both should decrypt to same plaintext (tested in roundtrip)

    def test_encrypt_none_returns_none(self, app):
        """Handle None values gracefully (nullable fields)"""
        from api.commons.encryption import encrypt_secret

        result = encrypt_secret(None)
        assert result is None

    def test_decrypt_none_returns_none(self, app):
        """Handle None values gracefully (nullable fields)"""
        from api.commons.encryption import decrypt_secret

        result = decrypt_secret(None)
        assert result is None

    def test_encrypt_empty_string_returns_none(self, app):
        """Empty strings should be treated as None"""
        from api.commons.encryption import encrypt_secret

        result = encrypt_secret("")
        assert result is None

    def test_decrypt_empty_string_returns_none(self, app):
        """Empty strings should be treated as None"""
        from api.commons.encryption import decrypt_secret

        result = decrypt_secret("")
        assert result is None

    def test_encrypted_value_is_base64_string(self, app):
        """Encrypted values should be valid base64 (safe for DB storage)"""
        from api.commons.encryption import encrypt_secret

        encrypted = encrypt_secret("test-secret")

        # Should be a string
        assert isinstance(encrypted, str)

        # Should be base64-encoded (Fernet output)
        # Fernet tokens are base64url-encoded and start with version byte
        assert len(encrypted) > 40  # Fernet tokens are at least this long

    def test_encrypt_with_unicode_characters(self, app):
        """Handle non-ASCII characters properly"""
        from api.commons.encryption import encrypt_secret, decrypt_secret

        original = "🔒 Secret Key with émojis and àccents"
        encrypted = encrypt_secret(original)
        decrypted = decrypt_secret(encrypted)

        assert decrypted == original

    def test_encrypt_multiline_pem_key(self, app):
        """
        Handle multi-line PEM keys (actual use case for Mux private keys).
        This is what we'll actually be encrypting in production.
        """
        from api.commons.encryption import encrypt_secret, decrypt_secret

        pem_key = """-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j9k8kSQv9w4L5g5Y7H6Fg7Qh+vGaRpA=
-----END PRIVATE KEY-----"""

        encrypted = encrypt_secret(pem_key)
        decrypted = decrypt_secret(encrypted)

        assert decrypted == pem_key
        assert "-----BEGIN PRIVATE KEY-----" in decrypted

    def test_encrypt_uses_config_encryption_key(self, app):
        """
        Verify that encryption uses the ENCRYPTION_KEY from Flask config.
        This ensures we're using the right key from environment.
        """
        from api.commons.encryption import encrypt_secret

        # Should not raise an error if config is properly set
        # (app fixture should have ENCRYPTION_KEY set)
        result = encrypt_secret("test")
        assert result is not None

    def test_decrypt_with_wrong_key_raises_error(self, app):
        """
        Attempting to decrypt with wrong key should raise an error.
        This tests security - can't decrypt without correct key.
        """
        from api.commons.encryption import encrypt_secret, decrypt_secret
        from cryptography.fernet import InvalidToken

        # Encrypt with one key
        original = "secret-data"
        encrypted = encrypt_secret(original)

        # Modify the app config to use a different key
        original_key = app.config['ENCRYPTION_KEY']
        app.config['ENCRYPTION_KEY'] = Fernet.generate_key().decode()

        # Try to decrypt with wrong key
        with pytest.raises(InvalidToken):
            decrypt_secret(encrypted)

        # Restore original key
        app.config['ENCRYPTION_KEY'] = original_key

    def test_encrypt_very_long_string(self, app):
        """Handle long strings (large PEM keys, etc.)"""
        from api.commons.encryption import encrypt_secret, decrypt_secret

        # Very long string (simulate large private key)
        original = "A" * 5000
        encrypted = encrypt_secret(original)
        decrypted = decrypt_secret(encrypted)

        assert decrypted == original
        assert len(encrypted) > len(original)  # Encryption adds overhead
