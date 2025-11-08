"""
Encryption utility for sensitive organization credentials.

Used for encrypting/decrypting:
- Mux signing private keys
- Mux API tokens
- Other third-party credentials

Uses Fernet (symmetric encryption) from cryptography library.
Fernet provides:
- Authenticated encryption (prevents tampering)
- Timestamped tokens (can set TTL if needed)
- Safe for database storage (base64-encoded output)
"""

from cryptography.fernet import Fernet
from flask import current_app


def encrypt_secret(plaintext: str) -> str:
    """
    Encrypt sensitive data before storing in database.

    Args:
        plaintext: The secret to encrypt (e.g., private key, API token)

    Returns:
        Base64-encoded encrypted string safe for database storage.
        Returns None for None/empty inputs.

    Example:
        >>> encrypted = encrypt_secret("my-secret-key")
        >>> # Store encrypted value in database
        >>> org.mux_signing_private_key = encrypted

    Security Notes:
        - Uses ENCRYPTION_KEY from Flask config (stored in Infisical or .env)
        - Fernet includes random IV, so same plaintext encrypts differently each time
        - Output is base64-encoded and safe for VARCHAR/TEXT columns
    """
    # Handle None/empty values (nullable database fields)
    if not plaintext:
        return None

    # Get encryption key from Flask config
    encryption_key = current_app.config["ENCRYPTION_KEY"]

    # Create Fernet cipher
    f = Fernet(encryption_key.encode())

    # Encrypt and return base64-encoded token
    return f.encrypt(plaintext.encode()).decode()


def decrypt_secret(encrypted: str) -> str:
    """
    Decrypt sensitive data from database.

    Args:
        encrypted: The encrypted string from database

    Returns:
        Decrypted plaintext string.
        Returns None for None/empty inputs.

    Raises:
        cryptography.fernet.InvalidToken: If decryption fails
            (wrong key, corrupted data, or tampered token)

    Example:
        >>> plaintext = decrypt_secret(org.mux_signing_private_key)
        >>> # Use plaintext to generate JWT
        >>> jwt_token = generate_mux_jwt(plaintext)

    Security Notes:
        - Decryption will fail if ENCRYPTION_KEY has changed
        - Fernet verifies authentication tag (prevents tampering)
        - If key is lost, encrypted data cannot be recovered
    """
    # Handle None/empty values (nullable database fields)
    if not encrypted:
        return None

    # Get encryption key from Flask config
    encryption_key = current_app.config["ENCRYPTION_KEY"]

    # Create Fernet cipher
    f = Fernet(encryption_key.encode())

    # Decrypt and return plaintext
    return f.decrypt(encrypted.encode()).decode()
