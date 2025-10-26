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
    link = fields.Str(dump_only=True, allow_none=True)


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


class InvitationInviterSchema(Schema):
    """Schema for invitation inviter info"""
    id = fields.Int(dump_only=True)
    name = fields.Str(dump_only=True)
    email = fields.Email(dump_only=True)


class OrganizationInvitationSchema(Schema):
    """Schema for organization invitation in dashboard"""
    id = fields.Int(dump_only=True)
    type = fields.Str(dump_only=True)  # Will be set to "organization" in the service
    organization = fields.Dict(dump_only=True)  # {id, name}
    role = fields.Str(dump_only=True)
    invited_by = fields.Nested(InvitationInviterSchema, dump_only=True, allow_none=True)
    message = fields.Str(dump_only=True, allow_none=True)
    created_at = fields.DateTime(format="iso", dump_only=True)
    expires_at = fields.DateTime(format="iso", dump_only=True)
    token = fields.Str(dump_only=True)


class EventInvitationSchema(Schema):
    """Schema for event invitation in dashboard"""
    id = fields.Int(dump_only=True)
    type = fields.Str(dump_only=True)  # Will be set to "event" in the service
    event = fields.Dict(dump_only=True)  # {id, title, start_date, organization: {id, name}}
    role = fields.Str(dump_only=True)
    invited_by = fields.Nested(InvitationInviterSchema, dump_only=True, allow_none=True)
    message = fields.Str(dump_only=True, allow_none=True)
    created_at = fields.DateTime(format="iso", dump_only=True)
    expires_at = fields.DateTime(format="iso", dump_only=True)
    token = fields.Str(dump_only=True)


class UserInvitationsResponseSchema(Schema):
    """Response schema for user invitations"""
    organization_invitations = fields.List(fields.Nested(OrganizationInvitationSchema), dump_only=True)
    event_invitations = fields.List(fields.Nested(EventInvitationSchema), dump_only=True)
    total_count = fields.Int(dump_only=True)