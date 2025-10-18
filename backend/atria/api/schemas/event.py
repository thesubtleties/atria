from api.extensions import ma, db
from api.models import Event
from api.models.enums import EventType, EventStatus, EventUserRole, EventFormat, USState
from marshmallow import validates, ValidationError, validates_schema
from datetime import datetime, timezone
import pytz


class EventSchema(ma.SQLAlchemyAutoSchema):
    """Base Event Schema - handles basic event serialization/deserialization"""

    class Meta:
        model = Event
        sqla_session = db.session
        include_fk = True
        load_instance = True
        name = "EventBase"

    # Computed Properties - read only
    is_published = ma.Boolean(dump_only=True)
    is_upcoming = ma.Boolean(dump_only=True)
    is_ongoing = ma.Boolean(dump_only=True)
    is_past = ma.Boolean(dump_only=True)
    day_count = ma.Integer(dump_only=True)
    first_session_time = ma.String(dump_only=True)
    last_session_time = ma.String(dump_only=True)
    event_hours = ma.Dict(dump_only=True)
    user_role = ma.String(dump_only=True)  # Current user's role in the event
    main_session_id = ma.Integer(dump_only=True)  # For single_session events


# Detailed Schema - Used for GET /events/<id> with all relationships
class EventDetailSchema(EventSchema):
    """Detailed Event Schema - includes relationships and nested data"""

    class Meta(EventSchema.Meta):
        name = "EventDetail"

    # Computed properties specific to detail view
    sponsors_count = ma.Integer(dump_only=True)  # Number of active sponsors (detail only to avoid N+1)

    # Nested relationships - only include necessary fields
    organization = ma.Nested(
        "OrganizationSchema", only=("id", "name"), dump_only=True
    )

    sessions = ma.Nested(
        "SessionSchema",
        many=True,  # One-to-many relationship
        only=(
            "id",
            "title",
            "start_time",
            "end_time",
            "day_number",
            "session_type",
            "description",
            "speakers",
        ),
        dump_only=True,
        dump_default=None,
    )

    organizers = ma.Nested(
        "UserWithRoleSchema",
        many=True,
        attribute="organizers",
        only=(
            "id",
            "full_name",
            "email",
            "role",
        ),
        dump_only=True,
        dump_default=None,
    )

    speakers = ma.Nested(
        "UserSchema",
        many=True,
        only=("id", "full_name", "title", "company_name"),
        dump_only=True,
        dump_default=None,
    )

    main_session = ma.Nested(
        "SessionMinimalSchema",
        dump_only=True,
        dump_default=None,
    )


# Creation Schema - Used for POST /events
class EventCreateSchema(ma.Schema):
    """Schema for creating new events - strict validation"""

    class Meta:
        name = "EventCreate"

    # Required fields
    title = ma.String(required=True)
    event_type = ma.Enum(EventType, required=True)
    start_date = ma.Date(required=True)
    end_date = ma.Date(required=True)
    timezone = ma.String(required=True)
    company_name = ma.String(required=True)

    # Optional fields
    description = ma.String()
    status = ma.Enum(EventStatus, load_default=EventStatus.DRAFT)
    branding = ma.Dict(
        load_default={
            "primary_color": "#000000",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        }
    )

    # Validate individual fields
    @validates("title")
    def validate_title(self, value, **kwargs):
        if len(value.strip()) < 3:
            raise ValidationError("Title must be at least 3 characters")

    @validates("timezone")
    def validate_timezone(self, value, **kwargs):
        if value not in pytz.all_timezones:
            raise ValidationError(
                f"Invalid timezone. Must be a valid IANA timezone (e.g., 'America/New_York')"
            )

    # Validate multiple fields together
    @validates_schema
    def validate_dates(self, data, **kwargs):
        if "start_date" in data and "end_date" in data:
            if data["end_date"] < data["start_date"]:
                raise ValidationError("End date cannot be before start date")

            if data["start_date"] < datetime.now(timezone.utc).date():
                raise ValidationError("Start date cannot be in the past")


# Update Schema - Used for PUT /events/<id>
class EventUpdateSchema(ma.Schema):
    """Schema for updating events - all fields optional"""

    class Meta:
        name = "EventUpdate"

    title = ma.String()
    description = ma.String()
    event_type = ma.Enum(EventType)
    start_date = ma.Date()
    end_date = ma.Date()
    timezone = ma.String()
    company_name = ma.String()
    status = ma.Enum(EventStatus)
    branding = ma.Dict()
    
    # Venue and format fields
    event_format = ma.Enum(EventFormat)
    is_private = ma.Boolean()
    venue_name = ma.String(allow_none=True)
    venue_address = ma.String(allow_none=True)
    venue_city = ma.String(allow_none=True)
    venue_state = ma.Enum(USState, allow_none=True)
    venue_country = ma.String(allow_none=True)
    
    # Hero section
    hero_description = ma.String(allow_none=True)
    hero_images = ma.Dict(allow_none=True)  # {desktop: url, mobile: url}
    
    # Content sections
    sections = ma.Dict(allow_none=True)  # {welcome: {...}, highlights: [...], faqs: [...]}
    
    # Networking
    icebreakers = ma.List(ma.String(), allow_none=True)
    
    # Single session navigation
    main_session_id = ma.Integer(allow_none=True)

    @validates("timezone")
    def validate_timezone(self, value, **kwargs):
        if value not in pytz.all_timezones:
            raise ValidationError(
                f"Invalid timezone. Must be a valid IANA timezone (e.g., 'America/New_York')"
            )

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate dates if provided"""
        if "start_date" in data and "end_date" in data:
            if data["end_date"] < data["start_date"]:
                raise ValidationError("End date cannot be before start date")

    @validates_schema
    def validate_venue(self, data, **kwargs):
        """Validate venue requirements based on event format"""
        if "event_format" in data:
            if data["event_format"] in [EventFormat.IN_PERSON, EventFormat.HYBRID]:
                # Check if venue details are provided
                if not data.get("venue_name") or not data.get("venue_city") or not data.get("venue_country"):
                    raise ValidationError("Venue details are required for in-person and hybrid events")


# Branding Update Schema - Used for PATCH /events/<id>/branding
class EventBrandingSchema(ma.Schema):
    """Schema for updating event branding only"""

    class Meta:
        name = "EventBranding"

    primary_color = ma.String()
    secondary_color = ma.String()
    logo_url = ma.String(allow_none=True)  # Now stores object_key, not URL

    @validates("primary_color")
    def validate_color(self, value, **kwargs):
        """Ensure color is valid hex code"""
        if not value.startswith("#") or len(value) != 7:
            raise ValidationError("Must be valid hex color (e.g., #FF0000)")


class EventNestedSchema(ma.SQLAlchemyAutoSchema):
    """Schema for events when nested in other schemas"""

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "start_date",
            "status",
        )  # Only the fields we need


class AddUserToEventSchema(ma.Schema):
    """Schema for adding/creating users in events"""

    class Meta:
        name = "AddUserToEvent"

    email = ma.Email(required=True)
    password = ma.String(load_only=True)
    first_name = ma.String(required=True)
    last_name = ma.String(required=True)
    role = ma.Enum(EventUserRole, required=True)
