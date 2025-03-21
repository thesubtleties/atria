# api/api/routes/direct_messages.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db
from api.models import DirectMessageThread, DirectMessage, User, Connection
from api.models.enums import ConnectionStatus, MessageStatus
from api.api.schemas import (
    DirectMessageThreadSchema,
    DirectMessageSchema,
    DirectMessageCreateSchema,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)

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

        query = DirectMessageThread.query.filter(
            (DirectMessageThread.user1_id == user_id)
            | (DirectMessageThread.user2_id == user_id)
        ).order_by(DirectMessageThread.last_message_at.desc())

        return paginate(
            query,
            DirectMessageThreadSchema(many=True),
            collection_name="threads",
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

        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            return {"message": "Not authorized to view this thread"}, 403

        return thread


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

        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            return {"message": "Not authorized to view these messages"}, 403

        query = DirectMessage.query.filter_by(thread_id=thread_id).order_by(
            DirectMessage.created_at.desc()
        )

        # Mark unread messages as read
        unread_messages = (
            DirectMessage.query.filter_by(
                thread_id=thread_id, status=MessageStatus.DELIVERED
            )
            .filter(DirectMessage.sender_id != user_id)
            .all()
        )

        for message in unread_messages:
            message.status = MessageStatus.READ

        db.session.commit()

        return paginate(
            query, DirectMessageSchema(many=True), collection_name="messages"
        )

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

        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            return {
                "message": "Not authorized to send messages in this thread"
            }, 403

        # Check if users are connected
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )
        current_user = User.query.get(user_id)

        if not current_user.is_connected_with(other_user_id):
            return {
                "message": "You must be connected with this user to send messages"
            }, 403

        # Create the message
        message = DirectMessage(
            thread_id=thread_id,
            sender_id=user_id,
            content=message_data["content"],
            encrypted_content=message_data.get("encrypted_content"),
            status=MessageStatus.DELIVERED,
        )

        db.session.add(message)

        # Update thread's last_message_at
        thread.last_message_at = db.func.current_timestamp()

        db.session.commit()

        # Emit socket event for real-time notification
        from api.extensions import socketio

        socketio.emit(
            "new_direct_message",
            {
                "id": message.id,
                "thread_id": message.thread_id,
                "sender_id": message.sender_id,
                "content": message.content,
                "encrypted_content": message.encrypted_content,
                "created_at": message.created_at.isoformat(),
                "status": message.status.value,
            },
            room=f"user_{other_user_id}",
        )

        return message, 201
