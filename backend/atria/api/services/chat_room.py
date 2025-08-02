from api.extensions import db
from api.models import ChatRoom, ChatMessage, Event, User, EventUser
from api.models.enums import EventUserRole
from api.commons.pagination import paginate
from datetime import datetime, timezone


class ChatRoomService:
    @staticmethod
    def get_event_chat_rooms(event_id, schema=None):
        """Get all chat rooms for an event with pagination"""
        query = ChatRoom.query.filter_by(event_id=event_id).order_by(
            ChatRoom.room_type,
            ChatRoom.display_order
        )
        if schema:
            return paginate(query, schema, collection_name="chat_rooms")
        return query.all()

    @staticmethod
    def create_event_chat_room(event_id, room_data, user_id):
        """Create a new event-level chat room"""
        from api.models.enums import ChatRoomType
        
        # Validate room type
        room_type_str = room_data.get("room_type", "GLOBAL")
        try:
            room_type = ChatRoomType(room_type_str)
        except ValueError:
            raise ValueError(f"Invalid room type: {room_type_str}")
        
        if room_type not in [ChatRoomType.GLOBAL, ChatRoomType.ADMIN, ChatRoomType.GREEN_ROOM]:
            raise ValueError("Invalid room type for event chat room")
        
        # Check for duplicate names
        existing = ChatRoom.query.filter_by(
            event_id=event_id,
            name=room_data["name"],
            session_id=None
        ).first()
        if existing:
            raise ValueError("A chat room with this name already exists")
        
        # Get next display order for this room type
        next_order = ChatRoomService.get_next_display_order(event_id, room_type)
        
        # Create room
        chat_room = ChatRoom(
            event_id=event_id,
            name=room_data["name"],
            description=room_data.get("description", ""),
            room_type=room_type,
            is_enabled=room_data.get("is_enabled", False),
            display_order=next_order,
            session_id=None  # Explicitly set to None for event rooms
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

        # Update allowed fields
        if "name" in room_data:
            # Check for duplicate names if name is changing
            if room_data["name"] != chat_room.name:
                existing = ChatRoom.query.filter_by(
                    event_id=chat_room.event_id,
                    name=room_data["name"],
                    session_id=None
                ).filter(ChatRoom.id != room_id).first()
                if existing:
                    raise ValueError("A chat room with this name already exists")
            chat_room.name = room_data["name"]
            
        if "description" in room_data:
            chat_room.description = room_data["description"]
            
        if "is_enabled" in room_data:
            chat_room.is_enabled = room_data["is_enabled"]
            
        if "display_order" in room_data:
            chat_room.display_order = room_data["display_order"]

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
    def get_chat_messages(room_id, user_id, schema=None):
        """Get messages for a chat room with role-based filtering"""
        # Get user's role in the event
        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)
        user = User.query.get_or_404(user_id)
        user_role = event.get_user_role(user)
        
        # Base query
        query = ChatMessage.query.filter_by(room_id=room_id)
        
        # Filter out deleted messages for non-privileged users
        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            query = query.filter(ChatMessage.deleted_at.is_(None))
        
        # Order by creation time
        query = query.order_by(ChatMessage.created_at.asc())

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
        """Soft delete a chat message (moderation)"""
        message = ChatMessage.query.get_or_404(message_id)
        chat_room = ChatRoom.query.get(message.room_id)
        event = Event.query.get(chat_room.event_id)

        # Only admins/organizers can moderate messages
        current_user = User.query.get(user_id)
        user_role = event.get_user_role(current_user)

        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            raise ValueError("Not authorized to moderate this message")

        # Soft delete the message
        message.deleted_at = datetime.now(timezone.utc)
        message.deleted_by_id = user_id

        db.session.commit()

        return {"message_id": message_id, "room_id": message.room_id, "deleted_by": current_user}

    @staticmethod
    def format_message_for_response(message, include_deletion_info=False):
        """Format a message for socket response"""
        user = User.query.get(message.user_id)
        data = {
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
            "is_deleted": message.is_deleted,
        }
        
        # Include deletion info for privileged users
        if include_deletion_info and message.is_deleted:
            data["deleted_at"] = message.deleted_at.isoformat()
            if message.deleted_by:
                data["deleted_by"] = {
                    "id": message.deleted_by.id,
                    "full_name": message.deleted_by.full_name,
                }
        
        return data

    @staticmethod
    def get_next_display_order(event_id, room_type):
        """Get the next display order for a new chat room"""
        # Get the highest display order for this room type
        last_room = ChatRoom.query.filter_by(
            event_id=event_id,
            room_type=room_type,
            session_id=None
        ).order_by(ChatRoom.display_order.desc()).first()
        
        if last_room:
            return last_room.display_order + 10.0
        else:
            # Start at 10 for the first room of this type
            return 10.0
    
    @staticmethod
    def format_room_for_response(room):
        """Format a chat room for API/socket response"""
        return {
            "id": room.id,
            "event_id": room.event_id,
            "session_id": room.session_id,
            "name": room.name,
            "description": room.description,
            "room_type": room.room_type.value if room.room_type else None,
            "is_enabled": room.is_enabled,
            "display_order": room.display_order,
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
            # Check if session has public chat enabled
            if chat_room.session:
                from api.models.enums import SessionChatMode
                if chat_room.session.chat_mode == SessionChatMode.DISABLED:
                    return False
                if chat_room.session.chat_mode == SessionChatMode.BACKSTAGE_ONLY:
                    return False
            # All event attendees can access if enabled
            return True
            
        elif chat_room.room_type == ChatRoomType.BACKSTAGE:
            # Check if session has backstage chat enabled
            if chat_room.session:
                from api.models.enums import SessionChatMode
                if chat_room.session.chat_mode == SessionChatMode.DISABLED:
                    return False
                # Only speakers and organizers can access backstage
                is_speaker = chat_room.session.has_speaker(user)
                is_organizer = user_event_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
                return is_speaker or is_organizer
            return False
            
        elif chat_room.room_type == ChatRoomType.ADMIN:
            # Only event admins/organizers
            return user_event_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
            
        elif chat_room.room_type == ChatRoomType.GREEN_ROOM:
            # Speakers, admins, and organizers can access
            return user_event_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER, EventUserRole.SPEAKER]
            
        return False

    @staticmethod
    def get_recent_messages(room_id, user_id, limit=50):
        """Get recent messages for a chat room with role-based filtering"""
        # Get user's role
        chat_room = ChatRoom.query.get_or_404(room_id)
        event = Event.query.get_or_404(chat_room.event_id)
        user = User.query.get_or_404(user_id)
        user_role = event.get_user_role(user)
        
        # Build query
        query = ChatMessage.query.filter_by(room_id=room_id)
        
        # Filter deleted messages for non-privileged users
        include_deletion_info = user_role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]
        if not include_deletion_info:
            query = query.filter(ChatMessage.deleted_at.is_(None))
        
        messages = query.order_by(ChatMessage.created_at.desc()).limit(limit).all()

        # Format messages for response
        formatted_messages = []
        for message in reversed(messages):  # Reverse to get chronological order
            formatted_messages.append(
                ChatRoomService.format_message_for_response(message, include_deletion_info)
            )

        return formatted_messages
    
    @staticmethod
    def toggle_chat_room(room_id, user_id):
        """Toggle chat room enabled status"""
        chat_room = ChatRoom.query.get_or_404(room_id)
        chat_room.is_enabled = not chat_room.is_enabled
        db.session.commit()
        return chat_room
    
    @staticmethod
    def disable_all_public_rooms(event_id, user_id):
        """Disable all GLOBAL chat rooms for an event"""
        from api.models.enums import ChatRoomType
        
        # Only disable GLOBAL rooms, not ADMIN or GREEN_ROOM
        updated = ChatRoom.query.filter_by(
            event_id=event_id,
            room_type=ChatRoomType.GLOBAL,
            is_enabled=True,
            session_id=None
        ).update({"is_enabled": False})
        
        db.session.commit()
        return {"disabled_count": updated}
    
    @staticmethod
    def get_event_admin_chat_rooms(event_id):
        """Get all event-level chat rooms with admin metadata"""
        rooms = ChatRoom.query.filter_by(
            event_id=event_id,
            session_id=None
        ).order_by(
            ChatRoom.room_type,
            ChatRoom.display_order
        ).all()
        
        # Add metadata for each room
        for room in rooms:
            room.message_count = ChatMessage.query.filter_by(room_id=room.id).count()
            # TODO: Add participant count and last activity logic when we have user tracking
            room.participant_count = 0
            last_message = ChatMessage.query.filter_by(room_id=room.id).order_by(
                ChatMessage.created_at.desc()
            ).first()
            room.last_activity = last_message.created_at if last_message else room.created_at
        
        return rooms
