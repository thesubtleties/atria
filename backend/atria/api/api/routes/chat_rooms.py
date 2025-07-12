# api/api/routes/chat_rooms.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db
from api.models import ChatRoom, ChatMessage, Event, User
from api.models.enums import EventUserRole, ChatRoomType
from api.api.schemas import (
    ChatRoomSchema,
    ChatRoomDetailSchema,
    ChatRoomCreateSchema,
    ChatMessageSchema,
    ChatMessageCreateSchema,
)
from api.commons.decorators import (
    event_member_required,
    event_organizer_required,
    event_admin_required,
    chat_room_access_required,
)
from api.commons.pagination import (
    paginate,
    PAGINATION_PARAMETERS,
    get_pagination_schema,
)
from api.services.chat_room import ChatRoomService

blp = Blueprint(
    "chat_rooms",
    "chat_rooms",
    url_prefix="/api",
    description="Operations on chat rooms",
)


@blp.route("/events/<int:event_id>/chat-rooms")
class ChatRoomList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List event chat rooms",
        description="Get all chat rooms for an event",
        parameters=[
            {
                "in": "path",
                "name": "event_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Event ID",
                "example": 123,
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("chat_rooms", "ChatRoomBase"),
            403: {"description": "Not authorized to access this event"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_member_required()
    def get(self, event_id):
        """Get event's chat rooms"""
        user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(user_id)
        event = Event.query.get_or_404(event_id)
        
        # Start with GLOBAL rooms (visible to all event members)
        query = ChatRoom.query.filter_by(event_id=event_id).filter(
            ChatRoom.room_type == ChatRoomType.GLOBAL
        )
        
        # Add ADMIN rooms if user is admin/organizer
        user_role = event.get_user_role(current_user)
        if user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            # Include both GLOBAL and ADMIN rooms
            query = ChatRoom.query.filter_by(event_id=event_id).filter(
                ChatRoom.room_type.in_([ChatRoomType.GLOBAL, ChatRoomType.ADMIN])
            )
        
        return paginate(
            query, ChatRoomSchema(many=True), collection_name="chat_rooms"
        )

    @blp.arguments(ChatRoomCreateSchema)
    @blp.response(201, ChatRoomDetailSchema)
    @blp.doc(
        summary="Create new chat room",
        description="Create a new chat room for the event",
        responses={
            400: {
                "description": "Validation error",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "Validation error",
                            "errors": {"name": ["Name is required"]},
                        }
                    }
                },
            },
            403: {"description": "Not authorized to create chat rooms"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, room_data, event_id):
        """Create new chat room"""
        chat_room = ChatRoom(
            event_id=event_id,
            name=room_data["name"],
            description=room_data.get("description", ""),
            is_global=room_data.get("is_global", False),
        )

        db.session.add(chat_room)
        db.session.commit()

        return chat_room, 201


@blp.route("/chat-rooms/<int:room_id>")
class ChatRoomResource(MethodView):
    @blp.response(200, ChatRoomDetailSchema)
    @blp.doc(
        summary="Get chat room details",
        responses={
            403: {"description": "Not authorized to view this chat room"},
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    @chat_room_access_required()
    def get(self, room_id):
        """Get chat room details"""
        chat_room = ChatRoom.query.get_or_404(room_id)
        return chat_room

    @blp.arguments(ChatRoomCreateSchema)
    @blp.response(200, ChatRoomDetailSchema)
    @blp.doc(
        summary="Update chat room",
        responses={
            400: {"description": "Validation error"},
            403: {"description": "Not authorized to update this chat room"},
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    def put(self, room_data, room_id):
        """Update chat room"""
        user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(user_id)

        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)

        user_role = event.get_user_role(current_user)
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            return {
                "message": "Must be admin or organizer to update chat rooms"
            }, 403

        chat_room.name = room_data["name"]
        chat_room.description = room_data.get(
            "description", chat_room.description
        )
        chat_room.is_global = room_data.get("is_global", chat_room.is_global)

        db.session.commit()

        return chat_room

    @blp.response(204)
    @blp.doc(
        summary="Delete chat room",
        responses={
            403: {"description": "Not authorized to delete this chat room"},
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    def delete(self, room_id):
        """Delete chat room"""
        user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(user_id)

        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)

        user_role = event.get_user_role(current_user)
        if user_role != EventUserRole.ADMIN:
            return {"message": "Must be admin to delete chat rooms"}, 403

        db.session.delete(chat_room)
        db.session.commit()

        return ""


@blp.route("/chat-rooms/<int:room_id>/messages")
class ChatMessageList(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="List chat room messages",
        description="Get messages for a chat room with pagination",
        parameters=[
            {
                "in": "path",
                "name": "room_id",
                "schema": {"type": "integer"},
                "required": True,
                "description": "Chat Room ID",
                "example": 123,
            },
            *PAGINATION_PARAMETERS,
        ],
        responses={
            200: get_pagination_schema("messages", "ChatMessageBase"),
            403: {"description": "Not authorized to access this chat room"},
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    @chat_room_access_required()
    def get(self, room_id):
        """Get chat room messages"""
        query = ChatMessage.query.filter_by(room_id=room_id).order_by(
            ChatMessage.created_at.asc()
        )
        return paginate(
            query, ChatMessageSchema(many=True), collection_name="messages"
        )

    @blp.arguments(ChatMessageCreateSchema)
    @blp.response(201, ChatMessageSchema)
    @blp.doc(
        summary="Send chat message",
        description="Send a new message in a chat room",
        responses={
            400: {"description": "Validation error"},
            403: {
                "description": "Not authorized to send messages in this chat room"
            },
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    @chat_room_access_required()
    def post(self, message_data, room_id):
        """Send chat message"""
        user_id = int(get_jwt_identity())

        message = ChatMessage(
            room_id=room_id, user_id=user_id, content=message_data["content"]
        )

        db.session.add(message)
        db.session.commit()

        # Emit to all users in the chat room via Socket.IO
        from api.api.sockets.chat_notifications import emit_new_chat_message
        emit_new_chat_message(message, room_id)

        return message, 201
