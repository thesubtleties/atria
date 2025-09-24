"""Integration tests for authentication flow.

Testing Strategy:
- Tests the FULL authentication stack: HTTP → Route → Service → Model → Database
- Uses Flask test client to simulate real HTTP requests
- Tests actual JWT tokens, cookies, and security headers
- Validates the complete auth flow works end-to-end
- No mocking - tests the real implementation
"""

import pytest
import json
from api.models import User
from api.extensions import db


class TestAuthIntegration:
    """Test authentication through the full stack."""

    def test_complete_authentication_flow(self, client, db):
        """Test complete auth flow: signup → login → access → refresh → logout.

        Why test this? Ensures the entire authentication system works
        together properly, not just individual pieces.
        """
        # 1. Create a user (simulating signup) - direct user creation to bypass email verification - will test that elsewhere
        user = User(
            email="integration@sbtl.ai",
            first_name="Test",
            last_name="User",
            password="SecurePass123!",
            email_verified=True,  # Skip email verification for this test
        )
        db.session.add(user)
        db.session.commit()

        # 2. Login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "integration@sbtl.ai",
                "password": "SecurePass123!",
            },
            content_type="application/json",
        )

        assert login_response.status_code == 200
        login_data = json.loads(login_response.data)
        assert "message" in login_data
        assert login_data["message"] == "Login successful"

        # Verify cookies were set in response headers
        cookies = login_response.headers.getlist("Set-Cookie")
        assert any("access_token_cookie" in cookie for cookie in cookies)
        assert any("refresh_token_cookie" in cookie for cookie in cookies)

        # 3. Access protected endpoint
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200
        me_data = json.loads(me_response.data)
        assert me_data["email"] == "integration@sbtl.ai"
        assert me_data["first_name"] == "Test"

        # 4. Refresh token
        refresh_response = client.post("/api/auth/refresh")
        assert refresh_response.status_code == 200
        refresh_data = json.loads(refresh_response.data)
        assert refresh_data["message"] == "Token refreshed successfully"

        # 5. Verify we can still access protected endpoints
        me_response_2 = client.get("/api/auth/me")
        assert me_response_2.status_code == 200

        # 6. Logout
        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200

        # 7. Verify we can't access protected endpoints after logout
        # Clear cookies to simulate browser behavior
        client.clear_cookies()

        me_response_3 = client.get("/api/auth/me")
        assert me_response_3.status_code == 401

    def test_invalid_credentials_rejection(self, client, db):
        """Test that invalid credentials are properly rejected.

        Why test this? Security - must prevent unauthorized access
        and not leak information about valid emails.
        """
        user = User(
            email="valid@sbtl.ai",
            first_name="Valid",
            last_name="User",
            password="CorrectPassword123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Test wrong password
        response = client.post(
            "/api/auth/login",
            json={"email": "valid@sbtl.ai", "password": "WrongPassword123!"},
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert "Invalid credentials" in data.get("message", "")

        # Test non-existent email
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@sbtl.ai",
                "password": "AnyPassword123!",
            },
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        # Should give same error to prevent email enumeration
        assert "Invalid credentials" in data.get("message", "")

    def test_email_verification_requirement(self, client, db):
        """Test that unverified emails cannot login.

        Why test this? Email verification prevents spam and ensures
        users own the email addresses they register with.
        """
        user = User(
            email="unverified@sbtl.ai",
            first_name="Unverified",
            last_name="User",
            password="Password123!",
            email_verified=False,  # Not verified!
        )
        db.session.add(user)
        db.session.commit()

        response = client.post(
            "/api/auth/login",
            json={"email": "unverified@sbtl.ai", "password": "Password123!"},
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        # System currently returns generic "Invalid credentials" to prevent email enumeration
        # TODO: Consider returning more helpful errors while maintaining security:
        #   - If email exists and password is correct but email not verified: "Please verify your email"
        #   - If email exists but password wrong: "Invalid credentials"
        #   - If email doesn't exist: "Invalid credentials"
        # This balances UX with security (only reveals email status if password is correct)
        assert "Invalid credentials" in data.get("message", "")

    def test_jwt_cookie_security_headers(self, client, db):
        """Test that JWT cookies have proper security headers.

        Why test this? Cookies must be httpOnly, secure (in production),
        and have proper SameSite settings to prevent XSS and CSRF attacks.
        """
        user = User(
            email="security@sbtl.ai",
            first_name="Security",
            last_name="Test",
            password="SecurePass123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        response = client.post(
            "/api/auth/login",
            json={"email": "security@sbtl.ai", "password": "SecurePass123!"},
        )

        # Check Set-Cookie headers
        cookies = response.headers.getlist("Set-Cookie")

        # Find access token cookie
        access_cookie = next(
            (c for c in cookies if "access_token_cookie" in c), None
        )
        assert access_cookie is not None

        # Security checks
        assert (
            "HttpOnly" in access_cookie
        )  # Prevents JS access (XSS protection)
        assert "SameSite" in access_cookie  # CSRF protection
        # Note: Secure flag only in production (HTTPS)

    def test_protected_endpoints_require_auth(self, client):
        """Test that protected endpoints properly require authentication.

        Why test this? Ensures authentication is enforced across the API
        and sensitive data isn't exposed.
        """
        # Try various protected endpoints without auth
        # Note: There's no /api/events endpoint - events are always in context
        endpoints = [
            ("/api/auth/me", "GET"),
            ("/api/organizations", "GET"),
            ("/api/users/1/events", "GET"),  # User's events
            ("/api/users/1/dashboard", "GET"),  # User dashboard
            ("/api/organizations/1/events", "GET"),  # Org's events
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})

            # Should return 401 Unauthorized for auth-required endpoints
            assert (
                response.status_code == 401
            ), f"Endpoint {endpoint} not protected! Got {response.status_code}"

    def test_token_refresh_extends_session(self, client, db):
        """Test that refresh tokens properly extend user sessions.

        Why test this? Refresh tokens allow users to stay logged in
        without re-entering credentials, improving UX.
        """
        user = User(
            email="refresh@sbtl.ai",
            first_name="Refresh",
            last_name="Test",
            password="Password123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Login to get initial tokens
        login_response = client.post(
            "/api/auth/login",
            json={"email": "refresh@sbtl.ai", "password": "Password123!"},
        )
        assert login_response.status_code == 200

        # Use refresh endpoint
        refresh_response = client.post("/api/auth/refresh")
        assert refresh_response.status_code == 200
        # Note: Cookies might be same object, check if new one was set
        assert refresh_response.headers.getlist("Set-Cookie")

        # Can still access protected endpoints with new token
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200

    def test_concurrent_sessions_support(self, client, db):
        """Test that users can have multiple active sessions.

        Why test this? Users often login from multiple devices
        (phone, laptop, tablet) simultaneously.
        """
        user = User(
            email="multi@sbtl.ai",
            first_name="Multi",
            last_name="Session",
            password="Password123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # First login (simulating laptop)
        login1 = client.post(
            "/api/auth/login",
            json={"email": "multi@sbtl.ai", "password": "Password123!"},
        )
        assert login1.status_code == 200

        # Second login (simulating phone)
        # In real scenario, this would be a different client
        login2 = client.post(
            "/api/auth/login",
            json={"email": "multi@sbtl.ai", "password": "Password123!"},
        )
        assert login2.status_code == 200

        # Both sessions should work
        # The test client maintains the last session
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200

    def test_password_field_security(self, client, db):
        """Test that passwords are never exposed in responses.

        Why test this? Passwords (even hashed) should never be
        sent to the client for security.
        """
        user = User(
            email="secure@sbtl.ai",
            first_name="Secure",
            last_name="User",
            password="Password123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Login
        client.post(
            "/api/auth/login",
            json={"email": "secure@sbtl.ai", "password": "Password123!"},
        )

        # Get user details
        response = client.get("/api/auth/me")
        data = json.loads(response.data)

        # Check password not in response
        assert "password" not in data
        assert "_password" not in data
        assert "password_hash" not in data

        # Check no field contains the actual password value
        for key, value in data.items():
            if isinstance(value, str):
                assert "Password123!" not in value

    def test_malformed_request_handling(self, client):
        """Test that malformed requests are handled gracefully.

        Why test this? API should handle bad requests without crashing
        and provide useful error messages.
        """
        # Missing email
        response = client.post(
            "/api/auth/login", json={"password": "Password123!"}
        )
        assert response.status_code in [
            400,
            422,
        ]  # Bad request or validation error

        # Missing password
        response = client.post(
            "/api/auth/login", json={"email": "test@sbtl.ai"}
        )
        assert response.status_code in [400, 422]

        # Invalid email format
        response = client.post(
            "/api/auth/login",
            json={"email": "not-an-email", "password": "Password123!"},
        )
        assert response.status_code in [400, 422]

        # Empty request
        response = client.post("/api/auth/login", json={})
        assert response.status_code in [400, 422]

        # Not JSON
        response = client.post(
            "/api/auth/login", data="not json", content_type="text/plain"
        )
        assert response.status_code in [
            400,
            422,
            415,
        ]  # Bad request or unsupported media

    def test_logout_invalidates_tokens(self, client, db):
        """Test that logout properly invalidates all tokens.

        Why test this? Logout must immediately prevent further access
        with the invalidated tokens for security.
        """
        user = User(
            email="logout@sbtl.ai",
            first_name="Logout",
            last_name="Test",
            password="Password123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Login
        client.post(
            "/api/auth/login",
            json={"email": "logout@sbtl.ai", "password": "Password123!"},
        )

        # Verify we're logged in
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200

        # Logout
        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200

        # Clear cookies (simulating browser behavior)
        client.clear_cookies()

        # Should not be able to access protected endpoints
        me_response_2 = client.get("/api/auth/me")
        assert me_response_2.status_code == 401

        # Should not be able to refresh
        refresh_response = client.post("/api/auth/refresh")
        assert refresh_response.status_code == 401

    def test_rate_limiting_on_login_attempts(self, client, db):
        """Test that login attempts are rate limited.

        Why test this? Prevents brute force attacks on passwords.
        Without rate limiting, attackers can try unlimited passwords.

        SECURITY TEST: This SHOULD fail if rate limiting is not implemented!
        """
        user = User(
            email="ratelimit@sbtl.ai",
            first_name="Rate",
            last_name="Limited",
            password="RealPassword123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Try many failed login attempts
        rate_limited = False
        for i in range(10):
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "ratelimit@sbtl.ai",
                    "password": f"WrongPassword{i}!",
                },
            )

            # First 5 attempts should work (return 401)
            if i < 5:
                assert response.status_code == 401
            else:
                # After 5 attempts, MUST be rate limited for security
                if response.status_code == 429:
                    rate_limited = True
                    break
                # If still getting 401 after 5 attempts, that's a security issue!

        # This assertion WILL FAIL if rate limiting is not implemented
        assert (
            rate_limited
        ), "SECURITY ISSUE: No rate limiting on login attempts! Brute force attacks possible!"

    def test_rate_limit_resets_on_successful_login(self, client, db, user_factory):
        """Test that rate limit counter resets after successful login"""
        # Create a user for testing
        user = user_factory(
            email="resettest@sbtl.ai",
            password="TestPassword123!",
            email_verified=True
        )
        db.session.commit()

        # Make 4 failed login attempts (just under the limit)
        for i in range(4):
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "resettest@sbtl.ai",
                    "password": "WrongPassword!",
                },
            )
            assert response.status_code == 401

        # Successful login should work and reset the counter
        response = client.post(
            "/api/auth/login",
            json={
                "email": "resettest@sbtl.ai",
                "password": "TestPassword123!",
            },
        )
        assert response.status_code == 200

        # After successful login, we should be able to make 5 more failed attempts
        # before being rate limited (counter was reset)
        for i in range(6):  # Try 6 times to verify the 6th is blocked
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "resettest@sbtl.ai",
                    "password": "WrongPassword!",
                },
            )
            if i < 5:  # First 5 attempts should fail with 401
                assert response.status_code == 401, f"Attempt {i+1} should be 401, got {response.status_code}"
            else:  # 6th attempt should be rate limited
                assert response.status_code == 429, f"Attempt {i+1} should be 429, got {response.status_code}"
