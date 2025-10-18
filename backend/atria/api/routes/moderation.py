from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required

from api.schemas import (
    ModerationStatusSchema,
    BanUserSchema,
    UnbanUserSchema,
    ChatBanUserSchema,
    ChatUnbanUserSchema,
    ModerationActionResponseSchema,
)
from api.commons.decorators import event_organizer_required
from api.services.moderation import ModerationService


blp = Blueprint(
    "moderation",
    "moderation",
    url_prefix="/api",
    description="Operations for event moderation",
)


@blp.route("/events/<int:event_id>/users/<int:user_id>/moderation-status")
class ModerationStatus(MethodView):
    @blp.response(200, ModerationStatusSchema)
    @blp.doc(
        summary="Get user moderation status",
        description="Get the moderation status for a user in an event",
        responses={
            200: {"description": "Moderation status retrieved"},
            403: {"description": "Not authorized to view moderation status"},
            404: {"description": "User not found in event"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def get(self, event_id, user_id):
        """Get moderation status for a user in an event"""
        event_user = ModerationService.get_moderation_status(event_id, user_id)
        if not event_user:
            abort(404, message="User not found in this event")
        
        return event_user


@blp.route("/events/<int:event_id>/users/<int:user_id>/ban")
class BanUser(MethodView):
    @blp.arguments(BanUserSchema)
    @blp.response(200, ModerationActionResponseSchema)
    @blp.doc(
        summary="Ban user from event",
        description="Ban a user from an event",
        responses={
            200: {"description": "User banned successfully"},
            400: {"description": "Cannot ban user (validation error)"},
            403: {"description": "Not authorized to ban users"},
            404: {"description": "User not found in event"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, ban_data, event_id, user_id):
        """Ban a user from an event"""
        try:
            event_user = ModerationService.ban_user_from_event(
                event_id, user_id, ban_data
            )
            
            return {
                "success": True,
                "message": "User banned successfully",
                "moderation_status": event_user
            }
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users/<int:user_id>/unban")
class UnbanUser(MethodView):
    @blp.arguments(UnbanUserSchema)
    @blp.response(200, ModerationActionResponseSchema)
    @blp.doc(
        summary="Unban user from event",
        description="Unban a user from an event",
        responses={
            200: {"description": "User unbanned successfully"},
            400: {"description": "Cannot unban user (validation error)"},
            403: {"description": "Not authorized to unban users"},
            404: {"description": "User not found in event"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, unban_data, event_id, user_id):
        """Unban a user from an event"""
        try:
            event_user = ModerationService.unban_user_from_event(
                event_id, user_id, unban_data
            )
            
            return {
                "success": True,
                "message": "User unbanned successfully",
                "moderation_status": event_user
            }
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users/<int:user_id>/chat-ban")
class ChatBanUser(MethodView):
    @blp.arguments(ChatBanUserSchema)
    @blp.response(200, ModerationActionResponseSchema)
    @blp.doc(
        summary="Ban user from chat",
        description="Ban a user from chat in an event",
        responses={
            200: {"description": "User chat banned successfully"},
            400: {"description": "Cannot chat ban user (validation error)"},
            403: {"description": "Not authorized to chat ban users"},
            404: {"description": "User not found in event"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, chat_ban_data, event_id, user_id):
        """Ban a user from chat in an event"""
        try:
            event_user = ModerationService.chat_ban_user(
                event_id, user_id, chat_ban_data
            )
            
            return {
                "success": True,
                "message": "User chat banned successfully",
                "moderation_status": event_user
            }
        except ValueError as e:
            abort(400, message=str(e))


@blp.route("/events/<int:event_id>/users/<int:user_id>/chat-unban")
class ChatUnbanUser(MethodView):
    @blp.arguments(ChatUnbanUserSchema)
    @blp.response(200, ModerationActionResponseSchema)
    @blp.doc(
        summary="Unban user from chat",
        description="Unban a user from chat in an event",
        responses={
            200: {"description": "User chat unbanned successfully"},
            400: {"description": "Cannot chat unban user (validation error)"},
            403: {"description": "Not authorized to chat unban users"},
            404: {"description": "User not found in event"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, chat_unban_data, event_id, user_id):
        """Unban a user from chat in an event"""
        try:
            event_user = ModerationService.chat_unban_user(
                event_id, user_id, chat_unban_data
            )
            
            return {
                "success": True,
                "message": "User chat unbanned successfully",
                "moderation_status": event_user
            }
        except ValueError as e:
            abort(400, message=str(e))