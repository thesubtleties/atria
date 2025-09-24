import json
import pytest

from api.models import User
from api.extensions import db as _db
from pytest_factoryboy import register

# Import all factories
from tests.factories.user_factory import UserFactory, AdminUserFactory, SpeakerUserFactory
from tests.factories.organization_factory import OrganizationFactory, OrganizationUserFactory
from tests.factories.event_factory import EventFactory, EventUserFactory, VirtualEventFactory
from tests.factories.session_factory import SessionFactory

# Register factories with pytest-factoryboy
# This makes them available as fixtures automatically
register(UserFactory)
register(AdminUserFactory)
register(SpeakerUserFactory)
register(OrganizationFactory)
register(OrganizationUserFactory)
register(EventFactory)
register(EventUserFactory)
register(VirtualEventFactory)
register(SessionFactory)


@pytest.fixture(scope="session")
def app():
    """Create application for testing."""
    import os

    # Use environment variables if they exist, otherwise use defaults for local testing
    test_db_url = os.environ.get('SQLALCHEMY_DATABASE_URI') or os.environ.get('DATABASE_URL') or 'postgresql://test_user:test_pass@localhost:5433/test_atria'
    os.environ['TEST_DATABASE_URL'] = test_db_url
    os.environ['SQLALCHEMY_DATABASE_URI'] = test_db_url
    os.environ['DATABASE_URL'] = test_db_url
    os.environ['DATABASE_URI'] = test_db_url

    # Override PostgreSQL env vars to ensure they don't interfere
    os.environ['POSTGRES_USER'] = 'test_user'
    os.environ['POSTGRES_PASSWORD'] = 'test_pass'
    os.environ['POSTGRES_DB'] = 'test_atria'
    os.environ['POSTGRES_PORT'] = '5433'

    # Set testing environment
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['TESTING'] = 'true'
    os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
    os.environ['SECRET_KEY'] = 'test-secret-key'
    # Use Redis URL from environment or default to test instance
    if 'REDIS_URL' not in os.environ:
        os.environ['REDIS_URL'] = 'redis://localhost:6380/0'  # Use test Redis instance

    # Import create_app after setting environment
    from api.app import create_app

    # Create app with test config override
    app = create_app(testing=True)

    # Force test configuration
    app.config.from_object("api.config_test")

    return app


@pytest.fixture
def client(app):
    """Test client for making requests."""
    client = app.test_client()

    # Add helper methods to the client
    def clear_cookies():
        """Clear all cookies from the test client."""
        # Access the cookie jar if available
        if hasattr(client, 'cookie_jar'):
            client.cookie_jar.clear()

    def get_cookies():
        """Get all cookies as a dict."""
        # Parse cookies from the cookie jar
        cookies = {}
        if hasattr(client, 'cookie_jar'):
            for cookie in client.cookie_jar:
                cookies[cookie.name] = cookie.value
        return cookies

    # Attach helper methods
    client.clear_cookies = clear_cookies
    client.get_cookies = get_cookies

    return client


@pytest.fixture(autouse=True)
def clean_db(app):
    """Automatically clean database between tests."""
    with app.app_context():
        # Clean all data from tables before each test
        # This ensures test isolation
        _db.session.rollback()

        # Delete in correct order to respect foreign keys
        from api.models import (
            EventUser, OrganizationUser, Event,
            Organization, User
        )
        from api.models.blocklist import TokenBlocklist

        # Delete tokens first (references users)
        TokenBlocklist.query.delete()

        # Then delete user associations
        EventUser.query.delete()
        OrganizationUser.query.delete()

        # Then delete events and orgs
        Event.query.delete()
        Organization.query.delete()

        # Finally delete users
        User.query.delete()

        _db.session.commit()
        yield
        # Rollback any uncommitted changes after test
        _db.session.rollback()


@pytest.fixture
def db(app, clean_db):
    """Database fixture that ensures we're in app context."""
    with app.app_context():
        yield _db


@pytest.fixture
def admin_user(db):
    user = User(
        email='admin@admin.com',
        first_name='Admin',
        last_name='User',
        password='admin'
    )

    db.session.add(user)
    db.session.commit()

    return user


@pytest.fixture
def admin_headers(admin_user, client):
    data = {
        'email': admin_user.email,
        'password': 'admin'
    }
    rep = client.post(
        '/api/auth/login',
        data=json.dumps(data),
        headers={'content-type': 'application/json'}
    )

    tokens = json.loads(rep.get_data(as_text=True))
    return {
        'content-type': 'application/json',
        'authorization': 'Bearer %s' % tokens['access_token']
    }


@pytest.fixture
def admin_refresh_headers(admin_user, client):
    data = {
        'email': admin_user.email,
        'password': 'admin'
    }
    rep = client.post(
        '/api/auth/login',
        data=json.dumps(data),
        headers={'content-type': 'application/json'}
    )

    tokens = json.loads(rep.get_data(as_text=True))
    return {
        'content-type': 'application/json',
        'authorization': 'Bearer %s' % tokens['refresh_token']
    }
