from api.extensions import db
from api.models import Event, User
from api.models.enums import EventUserRole, EventStatus
from api.commons.pagination import paginate


class EventService:
    @staticmethod
    def get_organization_events(org_id, schema, include_deleted=False):
        """Get all events for an organization with pagination"""
        query = Event.query.filter_by(organization_id=org_id)
        
        # Exclude deleted events by default
        if not include_deleted:
            # When comparing SQLAlchemy Enum columns, use the enum directly (not .value)
            # SQLAlchemy will handle the conversion properly
            query = query.filter(Event.status != EventStatus.DELETED)
        
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
        from flask_jwt_extended import get_jwt_identity
        from api.models import User
        from flask_smorest import abort
        
        event = Event.query.get_or_404(event_id)
        
        # Check if event is soft-deleted
        if event.status == EventStatus.DELETED:
            abort(404, message="Event not found")
        
        # Add current user's role in the event
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        if current_user:
            role = event.get_user_role(current_user)
            event.user_role = role.value if role else None
        
        return event

    @staticmethod
    def update_event(event_id, update_data):
        """Update event details"""
        from api.models import Session
        from flask_smorest import abort
        
        event = Event.query.get_or_404(event_id)

        # Validate dates first if they're being updated
        if "start_date" in update_data or "end_date" in update_data:
            event.validate_dates(
                update_data.get("start_date"), update_data.get("end_date")
            )
        
        # Validate main_session_id if provided
        if "main_session_id" in update_data and update_data["main_session_id"] is not None:
            session = Session.query.filter_by(
                id=update_data["main_session_id"],
                event_id=event_id
            ).first()
            if not session:
                abort(400, message="Selected session does not belong to this event")

        # If validation passed, update all fields
        for key, value in update_data.items():
            setattr(event, key, value)

        db.session.commit()
        return event

    @staticmethod
    def delete_event(event_id):
        """Soft delete an event - clears sensitive data but preserves for connections"""
        from flask_jwt_extended import get_jwt_identity
        
        event = Event.query.get_or_404(event_id)
        current_user_id = int(get_jwt_identity())
        
        event.soft_delete(current_user_id)
        db.session.commit()

    @staticmethod
    def update_event_branding(event_id, branding_data):
        """Update event branding"""
        event = Event.query.get_or_404(event_id)
        event.update_branding(**branding_data)
        db.session.commit()
        return event
