from marshmallow import Schema, fields


class DashboardStatsSchema(Schema):
    """Schema for dashboard statistics"""
    events_hosted = fields.Int(dump_only=True)
    attendees_reached = fields.Int(dump_only=True)
    connections_made = fields.Int(dump_only=True)
    events_attended = fields.Int(dump_only=True)
    organizations_count = fields.Int(dump_only=True)


class DashboardOrganizationSchema(Schema):
    """Minimal organization schema for dashboard"""
    id = fields.Int(dump_only=True)
    name = fields.Str(dump_only=True)
    role = fields.Str(dump_only=True)  # User's role in the organization
    event_count = fields.Int(dump_only=True)
    member_count = fields.Int(dump_only=True)


class DashboardEventSchema(Schema):
    """Minimal event schema for dashboard"""
    id = fields.Int(dump_only=True)
    name = fields.Str(dump_only=True)  # Maps to 'title' in the service
    start_date = fields.Date(format="iso", dump_only=True)  # Event model uses Date not DateTime
    end_date = fields.Date(format="iso", dump_only=True, allow_none=True)  # Event model uses Date
    location = fields.Str(dump_only=True, allow_none=True)
    status = fields.Str(dump_only=True)  # 'upcoming', 'live', 'past'
    attendee_count = fields.Int(dump_only=True)
    organization = fields.Dict(dump_only=True)  # {id, name}
    user_role = fields.Str(dump_only=True)  # User's role in the event


class DashboardConnectionUserSchema(Schema):
    """User info for connections"""
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)  # Maps to email from User model
    display_name = fields.Str(dump_only=True)  # Maps to full_name property from User model
    avatar_url = fields.Str(dump_only=True, allow_none=True)  # Maps to image_url from User model


class DashboardConnectionSchema(Schema):
    """Minimal connection schema for dashboard"""
    id = fields.Int(dump_only=True)
    user = fields.Nested(DashboardConnectionUserSchema, dump_only=True)
    company = fields.Str(dump_only=True, allow_none=True)
    title = fields.Str(dump_only=True, allow_none=True)
    connected_at = fields.DateTime(format="iso", dump_only=True)


class DashboardNewsSchema(Schema):
    """News/announcement schema for dashboard"""
    id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    date = fields.DateTime(format="iso", dump_only=True)
    type = fields.Str(dump_only=True)  # 'platform_update', 'product_launch', 'feature_release', 'security'
    is_new = fields.Bool(dump_only=True)


class DashboardUserSchema(Schema):
    """Minimal user schema for dashboard"""
    id = fields.Int(dump_only=True)
    email = fields.Email(dump_only=True)
    first_name = fields.Str(dump_only=True)
    last_name = fields.Str(dump_only=True)
    full_name = fields.Str(dump_only=True)  # Computed property
    company_name = fields.Str(dump_only=True, allow_none=True)
    title = fields.Str(dump_only=True, allow_none=True)
    bio = fields.Str(dump_only=True, allow_none=True)
    image_url = fields.Str(dump_only=True, allow_none=True)
    created_at = fields.DateTime(format="iso", dump_only=True)


class DashboardResponseSchema(Schema):
    """Complete dashboard response schema"""
    user = fields.Nested(DashboardUserSchema, dump_only=True)
    stats = fields.Nested(DashboardStatsSchema, dump_only=True)
    organizations = fields.List(fields.Nested(DashboardOrganizationSchema), dump_only=True)
    events = fields.List(fields.Nested(DashboardEventSchema), dump_only=True)
    connections = fields.List(fields.Nested(DashboardConnectionSchema), dump_only=True)
    news = fields.List(fields.Nested(DashboardNewsSchema), dump_only=True)