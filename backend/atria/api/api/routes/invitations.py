# api/api/routes/invitations.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from api.api.schemas import (
    InvitationDetailsResponseSchema,
    RegisterAndAcceptInvitationsSchema,
    RegisterAndAcceptResponseSchema
)
from api.services.invitation import InvitationService
from api.services.dashboard import DashboardService


blp = Blueprint(
    "invitations",
    "invitations",
    url_prefix="/api",
    description="Public invitation operations",
)


@blp.route("/invitations/<string:token>")
class InvitationDetails(MethodView):
    @blp.response(200, InvitationDetailsResponseSchema)
    @blp.doc(
        summary="Get invitation details by token",
        description="Get invitation details and check if user exists. If user doesn't exist, returns all pending invitations for the email.",
        responses={
            200: {"description": "Invitation details retrieved successfully"},
            404: {"description": "Invitation not found or invalid token"},
        },
    )
    def get(self, token):
        """Get invitation details and related invitations"""
        # Get invitation by token
        invitation_data = InvitationService.get_invitation_details_by_token(token)
        
        if not invitation_data:
            abort(404, message="Invalid or expired invitation token")
        
        email = invitation_data['email']
        invitation = invitation_data['invitation']
        
        # Check if user exists
        user_exists = InvitationService.check_user_exists(email)
        
        response = {
            'invitation': {
                'type': invitation_data['type'],
                'email': email,
                'role': invitation.role.value,
                'status': invitation.status.value,
                'expires_at': invitation.expires_at,
                'message': invitation.message
            },
            'user_exists': user_exists
        }
        
        # If invitation is for organization, add organization details
        if invitation_data['type'] == 'organization':
            response['invitation']['organization'] = {
                'id': invitation.organization.id,
                'name': invitation.organization.name
            }
        # If invitation is for event, add event details
        else:
            response['invitation']['event'] = {
                'id': invitation.event.id,
                'title': invitation.event.title,
                'organization': {
                    'id': invitation.event.organization.id,
                    'name': invitation.event.organization.name
                }
            }
        
        # Add inviter information if available
        if invitation.invited_by:
            response['invitation']['invited_by'] = {
                'id': invitation.invited_by.id,
                'name': invitation.invited_by.full_name,
                'email': invitation.invited_by.email
            }
        
        # If user doesn't exist, get all pending invitations for this email
        if not user_exists:
            all_invitations = InvitationService.get_all_invitations_for_email(email)
            
            # Format organization invitations
            org_invitations = []
            for inv in all_invitations['organization_invitations']:
                org_invitations.append({
                    'id': inv.id,
                    'type': 'organization',
                    'organization': {
                        'id': inv.organization.id,
                        'name': inv.organization.name
                    },
                    'role': inv.role.value,
                    'invited_by': {
                        'id': inv.invited_by.id,
                        'name': inv.invited_by.full_name
                    } if inv.invited_by else None,
                    'message': inv.message,
                    'expires_at': inv.expires_at,
                    'token': inv.token
                })
            
            # Format event invitations
            event_invitations = []
            for inv in all_invitations['event_invitations']:
                event_invitations.append({
                    'id': inv.id,
                    'type': 'event',
                    'event': {
                        'id': inv.event.id,
                        'title': inv.event.title,
                        'organization': {
                            'id': inv.event.organization.id,
                            'name': inv.event.organization.name
                        }
                    },
                    'role': inv.role.value,
                    'invited_by': {
                        'id': inv.invited_by.id,
                        'name': inv.invited_by.full_name
                    } if inv.invited_by else None,
                    'message': inv.message,
                    'expires_at': inv.expires_at,
                    'token': inv.token,
                    'organization_id': inv.event.organization_id  # For grouping
                })
            
            response['all_invitations'] = {
                'organization_invitations': org_invitations,
                'event_invitations': event_invitations
            }
        
        return response


@blp.route("/invitations/register-and-accept")
class RegisterAndAccept(MethodView):
    @blp.arguments(RegisterAndAcceptInvitationsSchema)
    @blp.response(201, RegisterAndAcceptResponseSchema)
    @blp.doc(
        summary="Register new user and accept invitations",
        description="Create a new user account and accept selected invitations. Organization invitations are processed before event invitations.",
        responses={
            201: {"description": "User created and invitations accepted"},
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "examples": {
                            "user_exists": {
                                "value": {"message": "User already exists with this email"}
                            },
                            "invalid_password": {
                                "value": {"message": "Password must be at least 8 characters"}
                            },
                        }
                    }
                },
            },
        },
    )
    def post(self, data):
        """Register new user and accept selected invitations"""
        try:
            # Log incoming data for debugging
            print(f"DEBUG: Received data: {data}")
            
            result = InvitationService.register_and_accept_invitations(
                user_data=data['user_data'],
                org_invitation_ids=data.get('org_invitation_ids', []),
                event_invitation_ids=data.get('event_invitation_ids', [])
            )
            
            # Format response
            user = result['user']
            response = {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.full_name
                },
                'access_token': result['access_token'],
                'refresh_token': result['refresh_token'],
                'accepted_invitations': {
                    'organizations': result['accepted_org_count'],
                    'events': result['accepted_event_count']
                },
                'message': 'Account created successfully'
            }
            
            return response, 201
            
        except ValueError as e:
            print(f"DEBUG: ValueError: {e}")
            abort(400, message=str(e))
        except Exception as e:
            print(f"DEBUG: Exception: {e}")
            import traceback
            traceback.print_exc()
            abort(500, message="An error occurred while processing your request")