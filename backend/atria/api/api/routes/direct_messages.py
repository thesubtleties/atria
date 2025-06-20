# api/api/routes/direct_messages.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.api.schemas import (
    DirectMessageThreadSchema,
    DirectMessageSchema,
    DirectMessageCreateSchema,
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
        return DirectMessageService.get_user_threads(
            user_id, DirectMessageThreadSchema(many=True)
        )


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
    @blp.response(200)
    @blp.doc(
        summary="List thread messages",
        description="Get messages for a thread with pagination",
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
            200: get_pagination_schema("messages", "DirectMessageBase"),
            403: {"description": "Not authorized to view these messages"},
            404: {"description": "Thread not found"},
        },
    )
    @jwt_required()
    def get(self, thread_id):
        """Get thread messages"""
        user_id = int(get_jwt_identity())

        try:
            return DirectMessageService.get_thread_messages(
                thread_id, user_id, DirectMessageSchema(many=True)
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
