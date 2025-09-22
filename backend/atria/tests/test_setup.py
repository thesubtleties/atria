"""Test to verify testing infrastructure is working."""


def test_app_exists(app):
    """Test that app fixture creates an app."""
    assert app is not None


def test_app_is_testing(app):
    """Test that app is in testing mode."""
    assert app.config['TESTING'] is True


def test_database_is_postgresql(app):
    """Test that PostgreSQL is being used for tests."""
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    assert 'postgresql' in db_uri
    assert 'test_atria' in db_uri  # Using test database
    assert '5433' in db_uri  # Using test port
    print(f"✓ Using test database: {db_uri}")


def test_health_endpoint_exists(client):
    """Test that health endpoint responds."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert 'status' in data
    assert data['status'] == 'healthy'
    print(f"✓ Health check passed: {data}")


def test_database_operations(db):
    """Test that we can perform database operations."""
    from api.models import User
    import uuid

    # Use unique email to avoid conflicts
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    # Create a test user
    user = User(
        email=test_email,
        first_name="Test",
        last_name="User",
        password="testpass123"
    )

    db.session.add(user)
    db.session.commit()

    # Query the user
    found_user = User.query.filter_by(email=test_email).first()
    assert found_user is not None
    assert found_user.first_name == "Test"
    assert found_user.verify_password("testpass123")
    print(f"✓ Database operations working with user: {found_user.email}")

    # Clean up
    db.session.delete(found_user)
    db.session.commit()