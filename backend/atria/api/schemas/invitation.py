# api/api/schemas/invitation.py
from api.extensions import ma
from marshmallow import validate


class InvitationDetailsResponseSchema(ma.Schema):
    """Schema for invitation details response"""
    invitation = ma.Dict(required=True)
    user_exists = ma.Boolean(required=True)
    all_invitations = ma.Dict(required=False)


class UserRegistrationDataSchema(ma.Schema):
    """Schema for user registration data"""
    email = ma.Email(required=True)
    first_name = ma.String(
        required=True, 
        validate=validate.Length(min=1, max=100)
    )
    last_name = ma.String(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    password = ma.String(
        required=True,
        validate=validate.Length(min=8, max=128)
    )


class RegisterAndAcceptInvitationsSchema(ma.Schema):
    """Schema for registering and accepting invitations"""
    user_data = ma.Nested(
        UserRegistrationDataSchema,
        required=True
    )
    org_invitation_ids = ma.List(
        ma.Integer(),
        required=False,
        load_default=[]
    )
    event_invitation_ids = ma.List(
        ma.Integer(),
        required=False,
        load_default=[]
    )


class RegisterAndAcceptResponseSchema(ma.Schema):
    """Schema for registration and acceptance response"""
    user = ma.Dict(required=True)
    access_token = ma.String(required=True)
    refresh_token = ma.String(required=True)
    accepted_invitations = ma.Dict(required=True)
    message = ma.String(required=True)