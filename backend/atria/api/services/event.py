from api.extensions import db
from api.models import Event, User
from api.models.enums import EventUserRole
from api.commons.pagination import paginate


class EventService:
    @staticmethod
    def get_organization_events(org_id, schema):
        """Get all events for an organization with pagination"""
        query = Event.query.filter_by(organization_id=org_id)
        return paginate(query, schema, collection_name="events")

    @staticmethod
    def create_event(org_id, event_data, user_id):
        """Create a new event and add the creator as admin"""
        current_user = User.query.get_or_404(user_id)

        event = Event(organization_id=org_id, **event_data)
        db.session.add(event)
        db.session.flush()  # Get ID without committing

        event.add_user(current_user, EventUserRole.ADMIN)
        db.session.commit()

        return event

    @staticmethod
    def get_event(event_id):
        """Get event details by ID"""
        return Event.query.get_or_404(event_id)

    @staticmethod
    def update_event(event_id, update_data):
        """Update event details"""
        event = Event.query.get_or_404(event_id)

        # Validate dates first if they're being updated
        if "start_date" in update_data or "end_date" in update_data:
            event.validate_dates(
                update_data.get("start_date"), update_data.get("end_date")
            )

        # If validation passed, update all fields
        for key, value in update_data.items():
            setattr(event, key, value)

        db.session.commit()
        return event

    @staticmethod
    def delete_event(event_id):
        """Delete an event"""
        event = Event.query.get_or_404(event_id)
        db.session.delete(event)
        db.session.commit()

    @staticmethod
    def update_event_branding(event_id, branding_data):
        """Update event branding"""
        event = Event.query.get_or_404(event_id)
        event.update_branding(**branding_data)
        db.session.commit()
        return event
