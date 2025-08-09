# api/api/routes/users.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, current_app

from api.api.schemas import (
    UserDetailSchema,
    UserUpdateSchema,
    EventSchema,
    SessionSchema,
    UserCheckResponseSchema,
)
from api.api.schemas.user_privacy import PrivacyAwareUserSchema
from api.api.schemas.privacy import (
    PrivacySettingsSchema,
    PrivacySettingsUpdateSchema,
    UserPrivacyResponseSchema,
    PrivacySettingsResponseSchema
)
from api.api.schemas.dashboard import DashboardResponseSchema, UserInvitationsResponseSchema
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.user import UserService
from api.services.dashboard import DashboardService

from api.models.enums import EventUserRole


blp = Blueprint(
    "users",
    "users",
    url_prefix="/api/users",
    description="Operations on users",
)


@blp.route("/<int:user_id>")
class UserResource(MethodView):
    @blp.response(200, PrivacyAwareUserSchema)
    @blp.doc(
        summary="Get user profile",
        description="Get detailed information about a user with privacy filtering",
        responses={
            403: {"description": "Not authorized to view this user"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user profile with privacy filtering"""
        current_user_id = int(get_jwt_identity())
        event_id = request.args.get('event_id', type=int)

        # Use privacy-aware method that filters data based on viewer context
        return UserService.get_user_for_viewer(user_id, current_user_id, event_id)

    @blp.arguments(UserUpdateSchema)
    @blp.response(200, UserDetailSchema)
    @blp.doc(
        summary="Update user profile",
        description="Update user's own profile information",
        responses={
            403: {"description": "Can only update own profile"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def put(self, update_data, user_id):
        """Update user profile"""
        current_user_id = int(get_jwt_identity())

        if current_user_id != user_id:
            return {"message": "Can only update own profile"}, 403

        return UserService.update_user(user_id, update_data)


@blp.route("/<int:user_id>/events")
class UserEventsResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get user's events",
        description="Get all events a user is participating in",
        parameters=[
            {
                "in": "query",
                "name": "role",
                "schema": {"type": "string"},
                "description": "Filter by role in event (optional)",
                "enum": [role.value for role in EventUserRole],
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("events", "EventBase"),
            403: {"description": "Not authorized"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's events"""
        role = request.args.get("role")

        return UserService.get_user_events(
            user_id, role, EventSchema(many=True)
        )


@blp.route("/<int:user_id>/speaking-sessions")
class UserSessionsResource(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get user's speaking sessions",
        description="Get all sessions where user is speaking",
        parameters=[
            {
                "in": "query",
                "name": "page",
                "schema": {"type": "integer"},
                "description": "Page number (default: 1)",
            },
            {
                "in": "query",
                "name": "per_page",
                "schema": {"type": "integer"},
                "description": "Items per page (default: 50)",
            },
        ],
        responses={
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's speaking sessions"""
        return UserService.get_user_speaking_sessions(
            user_id, SessionSchema(many=True)
        )


@blp.route("/<int:user_id>/dashboard")
class UserDashboardResource(MethodView):
    @blp.response(200, DashboardResponseSchema)
    @blp.doc(
        summary="Get user dashboard",
        description="Get dashboard data for a user including stats, organizations, events, and connections",
        responses={
            403: {"description": "Not authorized to view this dashboard"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user dashboard data"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only view their own dashboard
        if current_user_id != user_id:
            abort(403, message="Not authorized to view this dashboard")
        
        dashboard_data = DashboardService.get_user_dashboard(user_id)
        if not dashboard_data:
            abort(404, message="User not found")
            
        return dashboard_data


@blp.route("/<int:user_id>/invitations")
class UserInvitationsResource(MethodView):
    @blp.response(200, UserInvitationsResponseSchema)
    @blp.doc(
        summary="Get user invitations",
        description="Get all pending invitations for a user (both organization and event invitations)",
        responses={
            403: {"description": "Not authorized to view these invitations"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user's pending invitations"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only view their own invitations
        if current_user_id != user_id:
            abort(403, message="Not authorized to view these invitations")
        
        invitations = DashboardService.get_user_invitations(user_id)
        return invitations


@blp.route("/<int:user_id>/privacy-settings")
class UserPrivacySettingsResource(MethodView):
    @blp.response(200, UserPrivacyResponseSchema)
    @blp.doc(
        summary="Get user privacy settings",
        description="Get privacy settings for a user including event overrides. Users can only access their own privacy settings.",
        responses={
            403: {"description": "Can only access own privacy settings"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def get(self, user_id):
        """Get user privacy settings"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only access their own privacy settings
        if current_user_id != user_id:
            abort(403, message="Can only access own privacy settings")
        
        # Get privacy settings from service
        from api.services.privacy import PrivacyService
        privacy_data = PrivacyService.get_user_privacy_settings(user_id)
        return privacy_data
    
    @blp.arguments(PrivacySettingsUpdateSchema)
    @blp.response(200, UserPrivacyResponseSchema)
    @blp.doc(
        summary="Update user privacy settings",
        description="Update privacy settings for a user. Users can only update their own privacy settings.",
        responses={
            403: {"description": "Can only update own privacy settings"},
            404: {"description": "User not found"},
        },
    )
    @jwt_required()
    def put(self, update_data, user_id):
        """Update user privacy settings"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only update their own privacy settings
        if current_user_id != user_id:
            return {"message": "Can only update own privacy settings"}, 403
        
        # Debug logging
        print(f"DEBUG: Received update_data: {update_data}")
        for key, value in update_data.items():
            if hasattr(value, 'value'):
                print(f"  {key}: {value} (enum) -> {value.value}")
            else:
                print(f"  {key}: {value} ({type(value).__name__})")
        
        # Update privacy settings via service
        from api.services.privacy import PrivacyService
        updated_settings = PrivacyService.update_user_privacy_settings(user_id, update_data)
        print(f"DEBUG: Returning settings: {updated_settings['privacy_settings']}")
        return updated_settings


@blp.route("/<int:user_id>/events/<int:event_id>/privacy-overrides")
class UserEventPrivacyOverrides(MethodView):
    @jwt_required()
    @blp.response(200, PrivacySettingsResponseSchema)
    @blp.doc(
        summary="Get user's privacy overrides for an event",
        description="Get event-specific privacy setting overrides"
    )
    def get(self, user_id, event_id):
        """Get user's privacy overrides for a specific event"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only get their own privacy overrides
        if user_id != current_user_id:
            abort(403, message="You can only view your own privacy overrides")
        
        # Check user is part of the event
        from api.models import EventUser
        event_user = EventUser.query.filter_by(
            user_id=user_id,
            event_id=event_id
        ).first()
        
        if not event_user:
            abort(404, message="User is not part of this event")
        
        # Get overrides from service
        from api.services.privacy import PrivacyService
        overrides = PrivacyService.get_event_privacy_overrides(user_id, event_id)
        
        return {
            "event_id": event_id,
            "user_id": user_id,
            "privacy_overrides": overrides or {}
        }
    
    @jwt_required()
    @blp.arguments(PrivacySettingsUpdateSchema)
    @blp.response(200, PrivacySettingsResponseSchema)
    @blp.doc(
        summary="Update user's privacy overrides for an event",
        description="Set or update event-specific privacy setting overrides"
    )
    def put(self, update_data, user_id, event_id):
        """Update user's privacy overrides for a specific event"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only update their own privacy overrides
        if user_id != current_user_id:
            abort(403, message="You can only update your own privacy overrides")
        
        # Update overrides via service
        from api.services.privacy import PrivacyService
        result = PrivacyService.update_event_privacy_overrides(
            user_id, event_id, update_data
        )
        
        return result
    
    @jwt_required()
    @blp.response(204)
    @blp.doc(
        summary="Delete user's privacy overrides for an event",
        description="Remove event-specific privacy setting overrides"
    )
    def delete(self, user_id, event_id):
        """Delete user's privacy overrides for a specific event"""
        current_user_id = int(get_jwt_identity())
        
        # Users can only delete their own privacy overrides
        if user_id != current_user_id:
            abort(403, message="You can only delete your own privacy overrides")
        
        # Delete overrides via service
        from api.services.privacy import PrivacyService
        PrivacyService.update_event_privacy_overrides(user_id, event_id, None)
        
        return None, 204


@blp.route("/debug")
class DebugView(MethodView):
    def get(self):
        """Debug endpoint"""
        return {
            "endpoints": [
                {
                    "url": str(rule),
                    "endpoint": rule.endpoint,
                    "methods": list(rule.methods),
                }
                for rule in current_app.url_map.iter_rules()
            ]
        }


@blp.route("/check-email")
class UserEmailCheck(MethodView):
    @blp.response(200, UserCheckResponseSchema)
    @blp.doc(
        summary="Check if user exists by email",
        description="Check if a user exists and return their basic info",
        parameters=[
            {
                "in": "query",
                "name": "email",
                "schema": {"type": "string"},
                "required": True,
                "description": "Email address to check",
            }
        ],
        responses={
            400: {"description": "Missing email parameter"},
        },
    )
    def get(self):
        """Check if user exists by email"""
        email = request.args.get("email")
        if not email:
            abort(400, message="Email parameter required")

        user = UserService.check_user_by_email(email)
        return {"user": user}
