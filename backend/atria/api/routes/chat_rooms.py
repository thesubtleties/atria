# api/api/routes/chat_rooms.py
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request

from api.extensions import db, ma
from api.models import ChatRoom, ChatMessage, Event, User, EventUser
from api.models.enums import EventUserRole, ChatRoomType
from api.schemas import (
    ChatRoomSchema,
    ChatRoomDetailSchema,
    ChatRoomCreateSchema,
    ChatRoomUpdateSchema,
    ChatRoomAdminSchema,
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


class ChatRoomReorderSchema(ma.Schema):
    """Schema for reordering chat room"""
    display_order = ma.Float(required=True)

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
        from api.services.chat_room import ChatRoomService
        
        user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(user_id)
        event = Event.query.get_or_404(event_id)
        
        # Get user's role in the event
        user_role = event.get_user_role(current_user)
        
        # Build query based on user's permissions
        room_types_allowed = []
        
        # All event members can see GLOBAL rooms
        room_types_allowed.append(ChatRoomType.GLOBAL)
        
        # Add ADMIN rooms if user is admin/organizer
        if user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            room_types_allowed.append(ChatRoomType.ADMIN)
        
        # Add GREEN_ROOM if user is admin, organizer, or speaker
        if user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER, EventUserRole.SPEAKER]:
            room_types_allowed.append(ChatRoomType.GREEN_ROOM)
        
        # Build query with allowed room types
        query = ChatRoom.query.filter_by(event_id=event_id).filter(
            ChatRoom.room_type.in_(room_types_allowed),
            ChatRoom.is_enabled == True
        ).order_by(ChatRoom.room_type, ChatRoom.name)
        
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
        user_id = int(get_jwt_identity())
        
        try:
            chat_room = ChatRoomService.create_event_chat_room(event_id, room_data, user_id)
            
            # Emit socket event for real-time updates
            from api.sockets.chat_notifications import emit_chat_room_created
            emit_chat_room_created(chat_room, event_id)
            
            return chat_room, 201
        except ValueError as e:
            abort(400, message=str(e))


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

    @blp.arguments(ChatRoomUpdateSchema)
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
        
        try:
            chat_room = ChatRoomService.update_chat_room(room_id, room_data, user_id)
            
            # Emit socket event
            from api.sockets.chat_notifications import emit_chat_room_updated
            emit_chat_room_updated(chat_room)
            
            return chat_room
        except ValueError as e:
            abort(403, message=str(e))

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
        
        try:
            event_id = ChatRoomService.delete_chat_room(room_id, user_id)
            
            # Emit socket event
            from api.sockets.chat_notifications import emit_chat_room_deleted
            emit_chat_room_deleted(room_id, event_id)
            
            return "", 204
        except ValueError as e:
            abort(403, message=str(e))


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
        user_id = int(get_jwt_identity())
        
        # Use the service method with role-based filtering
        return ChatRoomService.get_chat_messages(
            room_id, user_id, ChatMessageSchema(many=True)
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
    @chat_room_access_required()  # Decorator now handles room type access checking
    def post(self, message_data, room_id):
        """Send chat message"""
        user_id = int(get_jwt_identity())

        # Validate message content is not empty first
        if not message_data.get("content") or not message_data["content"].strip():
            abort(400, message="Message content cannot be empty")

        # Check if user can send chat messages (banned/chat-banned check)
        chat_room = ChatRoom.query.get_or_404(room_id)
        event_user = EventUser.query.filter_by(
            event_id=chat_room.event_id,
            user_id=user_id
        ).first()

        if not event_user or not event_user.can_use_chat():
            abort(403, message="You are not allowed to send messages in this chat")

        # Room type access is already checked by @chat_room_access_required decorator

        message = ChatMessage(
            room_id=room_id, user_id=user_id, content=message_data["content"]
        )

        db.session.add(message)
        db.session.commit()

        # Emit to all users in the chat room via Socket.IO
        from api.sockets.chat_notifications import emit_new_chat_message
        emit_new_chat_message(message, room_id)

        return message, 201


@blp.route("/chat-rooms/<int:room_id>/messages/<int:message_id>")
class ChatMessageResource(MethodView):
    @blp.response(204)
    @blp.doc(
        summary="Delete (moderate) a chat message",
        description="Soft delete a chat message. Only available to event admins and organizers.",
        responses={
            403: {"description": "Not authorized to moderate messages"},
            404: {"description": "Message not found"},
        },
    )
    @jwt_required()
    def delete(self, room_id, message_id):
        """Delete (moderate) a chat message"""
        user_id = int(get_jwt_identity())
        
        try:
            result = ChatRoomService.delete_message(message_id, user_id)
            
            # Emit different events based on user role
            from api.sockets.chat_notifications import emit_chat_message_moderated
            emit_chat_message_moderated(message_id, room_id, result["deleted_by"])
            
            return "", 204
        except ValueError as e:
            abort(403, message=str(e))


@blp.route("/chat-rooms/<int:room_id>/toggle")
class ChatRoomToggle(MethodView):
    @jwt_required()
    @blp.response(200, ChatRoomDetailSchema)
    @blp.doc(
        summary="Toggle chat room enabled status",
        description="Toggle a chat room's enabled/disabled state",
        responses={
            403: {"description": "Not authorized to toggle this chat room"},
            404: {"description": "Chat room not found"},
        },
    )
    def patch(self, room_id):
        """Toggle chat room enabled status"""
        user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(user_id)
        
        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)
        
        # Check permissions
        user_role = event.get_user_role(current_user)
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            abort(403, message="Must be admin or organizer to toggle chat rooms")
        
        chat_room = ChatRoomService.toggle_chat_room(room_id, user_id)
        
        # Emit socket event
        from api.sockets.chat_notifications import emit_chat_room_updated
        emit_chat_room_updated(chat_room)
        
        return chat_room


@blp.route("/events/<int:event_id>/chat-rooms/admin")
class EventAdminChatRooms(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Get admin view of chat rooms",
        description="Get all event-level chat rooms with admin metadata",
        responses={
            403: {"description": "Not authorized to access admin view"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def get(self, event_id):
        """Get admin view of chat rooms"""
        rooms = ChatRoomService.get_event_admin_chat_rooms(event_id)
        schema = ChatRoomAdminSchema(many=True)
        return {"chat_rooms": schema.dump(rooms)}


@blp.route("/events/<int:event_id>/chat-rooms/disable-all-public")
class DisableAllPublicRooms(MethodView):
    @blp.response(200)
    @blp.doc(
        summary="Disable all public chat rooms",
        description="Disable all GLOBAL type chat rooms for the event",
        responses={
            403: {"description": "Not authorized to disable chat rooms"},
            404: {"description": "Event not found"},
        },
    )
    @jwt_required()
    @event_organizer_required()
    def post(self, event_id):
        """Disable all public chat rooms"""
        user_id = int(get_jwt_identity())
        
        result = ChatRoomService.disable_all_public_rooms(event_id, user_id)
        
        # Emit socket event for rooms that were disabled
        if result["disabled_count"] > 0:
            from api.sockets.chat_notifications import emit_bulk_chat_rooms_updated
            emit_bulk_chat_rooms_updated(event_id, {"is_enabled": False})
        
        return result


@blp.route("/chat-rooms/<int:room_id>/reorder")
class ChatRoomReorder(MethodView):
    @blp.arguments(ChatRoomReorderSchema)
    @blp.response(200, ChatRoomDetailSchema)
    @blp.doc(
        summary="Reorder chat room",
        description="Update the display order of a chat room",
        responses={
            400: {"description": "Invalid display order"},
            403: {"description": "Not authorized to reorder chat rooms"},
            404: {"description": "Chat room not found"},
        },
    )
    @jwt_required()
    def put(self, order_data, room_id):
        """Reorder chat room"""
        user_id = int(get_jwt_identity())
        
        try:
            chat_room = ChatRoomService.update_chat_room(
                room_id, 
                {"display_order": order_data["display_order"]}, 
                user_id
            )
            
            # Emit socket event
            from api.sockets.chat_notifications import emit_chat_room_updated
            emit_chat_room_updated(chat_room)
            
            return chat_room
        except ValueError as e:
            abort(403, message=str(e))
