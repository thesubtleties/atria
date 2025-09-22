"""Debug test to figure out factory issues."""

import pytest
from api.models import Event, User, Organization
from api.models.enums import EventFormat, EventType, EventStatus, USState


def test_factory_debug(db, user_factory, organization_factory, event_factory):
    """Test factories work correctly."""

    # Test user factory
    user = user_factory()
    assert user.id is not None
    print(f"✓ User created: {user.email}")

    # Test organization factory
    org = organization_factory()
    assert org.id is not None
    print(f"✓ Organization created: {org.name}")

    # Test event factory without nested organization
    event = Event(
        title="Test Event",
        organization_id=org.id,
        event_type="conference",  # Try lowercase
        event_format="in_person",  # Try lowercase
        status="published",  # Try lowercase
        company_name="Test Company",
        slug="test-event",
        start_date="2025-01-01",
        end_date="2025-01-02",
        venue_state="CA"
    )
    db.session.add(event)
    db.session.commit()

    assert event.id is not None
    print(f"✓ Manual event created with lowercase enums")

    # Now try with uppercase
    event2 = Event(
        title="Test Event 2",
        organization_id=org.id,
        event_type="CONFERENCE",  # Uppercase
        event_format="IN_PERSON",  # Uppercase
        status="PUBLISHED",  # Uppercase
        company_name="Test Company 2",
        slug="test-event-2",
        start_date="2025-01-01",
        end_date="2025-01-02",
        venue_state="CA"
    )
    db.session.add(event2)
    db.session.commit()

    assert event2.id is not None
    print(f"✓ Manual event created with uppercase enums")

    # Now test the factory
    print("Testing factory...")
    event3 = event_factory(organization=org)
    assert event3.id is not None
    print(f"✓ Factory event created: {event3.title}")