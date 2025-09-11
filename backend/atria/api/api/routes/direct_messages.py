# api/api/routes/direct_messages.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.api.schemas import (
    DirectMessageThreadSchema,
    DirectMessageSchema,
    DirectMessageCreateSchema,
    DirectMessageThreadCreateSchema,
    DirectMessagesWithContextSchema,
)
from api.commons.pagination import (
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.direct_message import DirectMessageService

blp = Blueprint(
    "direct_messages",
    "direct_messages",
    url_prefix="/api",
    description="Operations on direct messages",
)


@blp.route("/direct-messages/threads")
class DirectMessageThreadList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List message threads",
        description="Get all direct message threads for the current user",
        parameters=PAGINATION_PARAMETERS,
        responses={
            200: get_pagination_schema("threads", "DirectMessageThreadBase"),
        },
    )
    @jwt_required()
    def get(self):
        """Get user's message threads"""
        user_id = int(get_jwt_identity())
        # Get optional event_id from query params for event-specific enrichment
        event_id = request.args.get('event_id', type=int)
        return DirectMessageService.get_user_threads(
            user_id, DirectMessageThreadSchema(many=True), event_id=event_id
        )

    @blp.arguments(DirectMessageThreadCreateSchema)
    @blp.response(201, DirectMessageThreadSchema)
    @blp.doc(
        summary="Create or get direct message thread",
        description="Create a new thread or get existing thread between current user and another user",
        responses={
            201: {"description": "Thread created or retrieved successfully"},
            400: {"description": "Validation error"},
            403: {"description": "Not authorized to create thread with this user"},
        },
    )
    @jwt_required()
    def post(self, thread_data):
        """Create or get a direct message thread"""
        user_id = int(get_jwt_identity())
        other_user_id = thread_data["user_id"]
        event_id = thread_data.get("event_id")

        try:
            # Check permissions for thread creation
            if event_id:
                # Event-scoped thread requires admin privilege or existing connection
                if not DirectMessageService.can_user_message_in_event_context(
                    user_id, other_user_id, event_id
                ):
                    return {"message": "You must be connected with this user to start a conversation"}, 403
            else:
                # Global thread requires connection
                from api.models.user import User
                current_user = User.query.get(user_id)
                if not current_user.is_connected_with(other_user_id):
                    return {"message": "You must be connected with this user to start a conversation"}, 403

            # Create or get thread
            thread, is_new = DirectMessageService.get_or_create_thread(
                user_id, other_user_id, event_scope_id=event_id
            )

            # If it's a new thread, emit socket notifications
            if is_new:
                from api.api.sockets.dm_notifications import emit_direct_message_thread_created
                emit_direct_message_thread_created(thread, user_id, other_user_id)

            # Format response using existing service method
            thread_data = DirectMessageService.format_thread_for_response(thread, user_id)
            thread_data["is_new"] = is_new

            return thread_data, 201

        except ValueError as e:
            return {"message": str(e)}, 403


@blp.route("/direct-messages/threads/<int:thread_id>")
class DirectMessageThreadDetail(MethodView):
    @blp.response(200, DirectMessageThreadSchema)
    @blp.doc(
        summary="Get thread details",
        responses={
            403: {"description": "Not authorized to view this thread"},
            404: {"description": "Thread not found"},
        },
    )
    @jwt_required()
    def get(self, thread_id):
        """Get thread details"""
        user_id = int(get_jwt_identity())

        try:
            return DirectMessageService.get_thread(thread_id, user_id)
        except ValueError as e:
            return {"message": str(e)}, 403


@blp.route("/direct-messages/threads/<int:thread_id>/messages")
class DirectMessageList(MethodView):
    @blp.response(200, DirectMessagesWithContextSchema)
    @blp.doc(
        summary="List thread messages with context",
        description="Get messages for a thread with pagination and thread context (other user, encryption status)",
        parameters=[
            {
                "in": "path",
                "name": "thread_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Thread ID",
                "example": 123,
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: {"description": "Messages with thread context"},
            403: {"description": "Not authorized to view these messages"},
            404: {"description": "Thread not found"},
        },
    )
    @jwt_required()
    def get(self, thread_id):
        """Get thread messages"""
        user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        try:
            # Use the new unified service method that includes thread context
            return DirectMessageService.get_thread_messages_with_context(
                thread_id, user_id, page=page, per_page=per_page
            )
        except ValueError as e:
            return {"message": str(e)}, 403

    @blp.arguments(DirectMessageCreateSchema)
    @blp.response(201, DirectMessageSchema)
    @blp.doc(
        summary="Send direct message",
        description="Send a new message in a thread",
        responses={
            400: {"description": "Validation error"},
            403: {
                "description": "Not authorized to send messages in this thread"
            },
            404: {"description": "Thread not found"},
        },
    )
    @jwt_required()
    def post(self, message_data, thread_id):
        """Send direct message"""
        user_id = int(get_jwt_identity())

        try:
            message, other_user_id = DirectMessageService.create_message(
                thread_id,
                user_id,
                message_data["content"],
                message_data.get("encrypted_content"),
            )

            # Emit socket event for real-time notification
            from api.api.sockets.dm_notifications import emit_new_direct_message
            emit_new_direct_message(message, thread_id, other_user_id)

            return message, 201

        except ValueError as e:
            return {"message": str(e)}, 403


@blp.route("/direct-messages/threads/<int:thread_id>/clear")
class DirectMessageThreadClear(MethodView):
    @blp.response(200, DirectMessageThreadSchema)
    @blp.doc(
        summary="Clear/hide thread for current user",
        description="Hide thread from user's view (iMessage-style deletion)",
        responses={
            403: {"description": "Not authorized to clear this thread"},
            404: {"description": "Thread not found"},
        },
    )
    @jwt_required()
    def delete(self, thread_id):
        """Clear thread for current user"""
        user_id = int(get_jwt_identity())
        
        try:
            thread = DirectMessageService.clear_thread_for_user(thread_id, user_id)
            
            # Note: Socket event emission would go here if dm_notifications module exists
            # from api.api.sockets.dm_notifications import emit_thread_cleared
            # emit_thread_cleared(thread_id, user_id)
            
            return thread
        except ValueError as e:
            return {"message": str(e)}, 403
