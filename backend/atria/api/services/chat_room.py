from api.extensions import db
from api.models import ChatRoom, ChatMessage, Event, User, EventUser
from api.models.enums import EventUserRole
from api.commons.pagination import paginate
from datetime import datetime


class ChatRoomService:
    @staticmethod
    def get_event_chat_rooms(event_id, schema=None):
        """Get all chat rooms for an event with pagination"""
        query = ChatRoom.query.filter_by(event_id=event_id)
        if schema:
            return paginate(query, schema, collection_name="chat_rooms")
        return query.all()

    @staticmethod
    def create_chat_room(event_id, room_data):
        """Create a new chat room for an event"""
        chat_room = ChatRoom(
            event_id=event_id,
            name=room_data["name"],
            description=room_data.get("description", ""),
            is_global=room_data.get("is_global", False),
        )

        db.session.add(chat_room)
        db.session.commit()

        return chat_room

    @staticmethod
    def get_chat_room(room_id):
        """Get chat room details"""
        return ChatRoom.query.get_or_404(room_id)

    @staticmethod
    def update_chat_room(room_id, room_data, user_id):
        """Update a chat room"""
        current_user = User.query.get_or_404(user_id)
        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)

        user_role = event.get_user_role(current_user)
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            raise ValueError("Must be admin or organizer to update chat rooms")

        chat_room.name = room_data["name"]
        chat_room.description = room_data.get(
            "description", chat_room.description
        )
        chat_room.is_global = room_data.get("is_global", chat_room.is_global)

        db.session.commit()

        return chat_room

    @staticmethod
    def delete_chat_room(room_id, user_id):
        """Delete a chat room"""
        current_user = User.query.get_or_404(user_id)
        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)

        user_role = event.get_user_role(current_user)
        if user_role != EventUserRole.ADMIN:
            raise ValueError("Must be admin to delete chat rooms")

        db.session.delete(chat_room)
        db.session.commit()

        return chat_room.event_id  # Return event_id for notifications

    @staticmethod
    def get_chat_messages(room_id, schema=None):
        """Get messages for a chat room with pagination"""
        query = ChatMessage.query.filter_by(room_id=room_id).order_by(
            ChatMessage.created_at.desc()
        )

        if schema:
            return paginate(query, schema, collection_name="messages")
        return query.all()

    @staticmethod
    def send_message(room_id, user_id, content):
        """Send a new message in a chat room"""
        message = ChatMessage(
            room_id=room_id, user_id=user_id, content=content
        )

        db.session.add(message)
        db.session.commit()

        return message

    @staticmethod
    def delete_message(message_id, user_id):
        """Delete a chat message"""
        message = ChatMessage.query.get_or_404(message_id)
        chat_room = ChatRoom.query.get(message.room_id)
        event = Event.query.get(chat_room.event_id)

        # Check if user is the message sender or an admin/organizer/moderator
        current_user = User.query.get(user_id)
        user_role = event.get_user_role(current_user)

        if message.user_id != user_id and user_role not in [
            EventUserRole.ADMIN,
            EventUserRole.ORGANIZER,
            EventUserRole.MODERATOR,
        ]:
            raise ValueError("Not authorized to delete this message")

        room_id = message.room_id  # Store before deletion

        db.session.delete(message)
        db.session.commit()

        return {"message_id": message_id, "room_id": room_id}

    @staticmethod
    def format_message_for_response(message):
        """Format a message for socket response"""
        user = User.query.get(message.user_id)
        return {
            "id": message.id,
            "room_id": message.room_id,
            "user_id": message.user_id,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "image_url": user.image_url,
            },
            "content": message.content,
            "created_at": message.created_at.isoformat(),
        }

    @staticmethod
    def format_room_for_response(room):
        """Format a chat room for API/socket response"""
        return {
            "id": room.id,
            "event_id": room.event_id,
            "session_id": room.session_id,
            "name": room.name,
            "description": room.description,
            "is_global": room.is_global,
            "room_type": room.room_type.value if room.room_type else None,
            "is_enabled": room.is_enabled,
            "created_at": room.created_at.isoformat(),
        }

    @staticmethod
    def check_room_access(room_id, user_id):
        """Check if a user has access to a chat room"""
        from api.models.enums import ChatRoomType
        
        chat_room = ChatRoom.query.get(room_id)
        if not chat_room:
            return False

        # Check if user is part of the event
        event_user = EventUser.query.filter_by(
            event_id=chat_room.event_id, user_id=user_id
        ).first()
        
        if not event_user:
            return False
            
        # Check room type specific permissions
        return ChatRoomService.can_access_room_type(chat_room, event_user.user, event_user.role)
    
    @staticmethod
    def can_access_room_type(chat_room, user, user_event_role=None):
        """Check if user can access a specific room type"""
        from api.models.enums import ChatRoomType
        
        if chat_room.room_type == ChatRoomType.GLOBAL:
            # All event attendees can access
            return True
            
        elif chat_room.room_type == ChatRoomType.PUBLIC:
            # All event attendees can access
            return True
            
        elif chat_room.room_type == ChatRoomType.BACKSTAGE:
            # Only speakers and organizers
            if chat_room.session:
                is_speaker = chat_room.session.has_speaker(user)
                is_organizer = user_event_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
                return is_speaker or is_organizer
            return False
            
        elif chat_room.room_type == ChatRoomType.ADMIN:
            # Only event admins/organizers
            return user_event_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
            
        return False

    @staticmethod
    def get_recent_messages(room_id, limit=50):
        """Get recent messages for a chat room"""
        messages = (
            ChatMessage.query.filter_by(room_id=room_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )

        # Format messages for response
        formatted_messages = []
        for message in reversed(
            messages
        ):  # Reverse to get chronological order
            formatted_messages.append(
                ChatRoomService.format_message_for_response(message)
            )

        return formatted_messages
