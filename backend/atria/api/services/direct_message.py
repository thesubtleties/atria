# api/services/direct_message.py
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import DirectMessageThread, DirectMessage, User, Connection
from api.models.enums import MessageStatus, ConnectionStatus
from api.commons.pagination import paginate


class DirectMessageService:
    @staticmethod
    def get_user_threads(user_id: int, schema=None):
        """Get all direct message threads for a user"""
        query = DirectMessageThread.query.filter(
            (DirectMessageThread.user1_id == user_id)
            | (DirectMessageThread.user2_id == user_id)
        ).order_by(DirectMessageThread.last_message_at.desc())

        if schema:
            return paginate(query, schema, collection_name="threads")

        return query.all()

    @staticmethod
    def get_thread(thread_id: int, user_id: int):
        """Get a thread by ID, ensuring the user has access"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to view this thread")

        return thread

    @staticmethod
    def get_thread_messages(
        thread_id: int, user_id: int, schema=None, page=1, per_page=50
    ):
        """Get messages for a thread with pagination"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to view these messages")

        query = DirectMessage.query.filter_by(thread_id=thread_id).order_by(
            DirectMessage.created_at.desc()
        )

        # Mark unread messages as read
        DirectMessageService.mark_messages_read(thread_id, user_id)

        if schema:
            return paginate(query, schema, collection_name="messages")

        # Manual pagination for socket responses
        if per_page:
            per_page = min(per_page, 100)  # Limit max per_page
            total = query.count()
            total_pages = (total + per_page - 1) // per_page

            messages = (
                query.offset((page - 1) * per_page).limit(per_page).all()
            )

            return {
                "messages": messages,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                },
            }

        return query.all()

    @staticmethod
    def create_message(
        thread_id: int,
        user_id: int,
        content: str,
        encrypted_content: Optional[str] = None,
    ):
        """Create a new direct message"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to send messages in this thread")

        # Check if users are connected
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )

        # Check if connection exists using the User model helper method
        current_user = User.query.get(user_id)
        if not current_user.is_connected_with(other_user_id):
            raise ValueError(
                "You must be connected with this user to send messages"
            )

        # Create the message
        message = DirectMessage(
            thread_id=thread_id,
            sender_id=user_id,
            content=content,
            encrypted_content=(
                encrypted_content if thread.is_encrypted else None
            ),
            status=MessageStatus.DELIVERED,
        )

        db.session.add(message)

        # Update thread's last_message_at
        thread.last_message_at = datetime.utcnow()

        db.session.commit()

        return message, other_user_id

    @staticmethod
    def mark_messages_read(thread_id: int, user_id: int):
        """Mark all unread messages in a thread as read"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to access this thread")

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

        # Get the other user ID for notifications
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )

        return thread_id, other_user_id, len(unread_messages) > 0

    @staticmethod
    def get_or_create_thread(user1_id: int, user2_id: int):
        """Get existing thread or create a new one between two users"""
        # Check if thread already exists
        thread = DirectMessageThread.query.filter(
            (
                (DirectMessageThread.user1_id == user1_id)
                & (DirectMessageThread.user2_id == user2_id)
            )
            | (
                (DirectMessageThread.user1_id == user2_id)
                & (DirectMessageThread.user2_id == user1_id)
            )
        ).first()

        if thread:
            return thread, False

        # Create new thread
        thread = DirectMessageThread(
            user1_id=user1_id,
            user2_id=user2_id,
            is_encrypted=False,
        )

        db.session.add(thread)
        db.session.commit()

        return thread, True

    @staticmethod
    def format_thread_for_response(
        thread: DirectMessageThread, user_id: int
    ) -> Dict[str, Any]:
        """Format thread data for API/socket response"""
        # Use the model's helper method to get the other user
        other_user = thread.get_other_user(user_id)

        # Get the last message
        last_message = (
            DirectMessage.query.filter_by(thread_id=thread.id)
            .order_by(DirectMessage.created_at.desc())
            .first()
        )

        # Get unread count
        unread_count = (
            DirectMessage.query.filter_by(
                thread_id=thread.id, status=MessageStatus.DELIVERED
            )
            .filter(DirectMessage.sender_id != user_id)
            .count()
        )

        thread_data = {
            "id": thread.id,
            "is_encrypted": thread.is_encrypted,
            "created_at": thread.created_at.isoformat(),
            "last_message_at": (
                thread.last_message_at.isoformat()
                if thread.last_message_at
                else thread.created_at.isoformat()
            ),
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
            },
            "unread_count": unread_count,
        }

        if last_message:
            thread_data["last_message"] = {
                "id": last_message.id,
                "sender_id": last_message.sender_id,
                "content": last_message.content,
                "created_at": last_message.created_at.isoformat(),
                "status": last_message.status.value,
            }

        return thread_data

    @staticmethod
    def format_message_for_response(message: DirectMessage) -> Dict[str, Any]:
        """Format message data for API/socket response"""
        sender = message.sender

        return {
            "id": message.id,
            "thread_id": message.thread_id,
            "sender_id": message.sender_id,
            "sender": {
                "id": sender.id,
                "full_name": sender.full_name,
                "image_url": sender.image_url,
            },
            "content": message.content,
            "encrypted_content": message.encrypted_content,
            "status": message.status.value,
            "created_at": message.created_at.isoformat(),
        }

    @staticmethod
    def format_messages_for_response(
        messages: List[DirectMessage], reverse=True
    ) -> List[Dict[str, Any]]:
        """Format multiple messages for API/socket response"""
        message_list = []

        # Optionally reverse to get chronological order
        messages_to_format = reversed(messages) if reverse else messages

        for message in messages_to_format:
            message_list.append(
                DirectMessageService.format_message_for_response(message)
            )

        return message_list

    @staticmethod
    def toggle_encryption(
        thread_id: int, user_id: int, enable_encryption: bool
    ):
        """Toggle encryption for a thread"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to modify this thread")

        thread.is_encrypted = enable_encryption
        db.session.commit()

        return thread

    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """Get total unread messages count across all threads"""
        # Find all threads the user is part of
        threads = DirectMessageThread.query.filter(
            (DirectMessageThread.user1_id == user_id)
            | (DirectMessageThread.user2_id == user_id)
        ).all()

        thread_ids = [thread.id for thread in threads]

        # Count unread messages
        if not thread_ids:
            return 0

        return DirectMessage.query.filter(
            DirectMessage.thread_id.in_(thread_ids),
            DirectMessage.sender_id != user_id,
            DirectMessage.status == MessageStatus.DELIVERED,
        ).count()

    @staticmethod
    def delete_message(message_id: int, user_id: int) -> Tuple[int, int]:
        """Delete a message (only sender can delete)"""
        message = DirectMessage.query.get_or_404(message_id)

        # Only sender can delete
        if message.sender_id != user_id:
            raise ValueError("Only the sender can delete this message")

        # Check if message is recent (e.g., within 5 minutes)
        now = datetime.utcnow()
        time_diff = (now - message.created_at).total_seconds()
        if time_diff > 300:  # 5 minutes in seconds
            raise ValueError(
                "Messages can only be deleted within 5 minutes of sending"
            )

        # Get thread and other user for notification
        thread = message.thread
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )

        # Delete the message
        db.session.delete(message)
        db.session.commit()

        return message_id, other_user_id

    @staticmethod
    def search_messages(user_id: int, query: str, schema=None):
        """Search for messages containing the query text"""
        if not query or len(query) < 3:
            raise ValueError("Search query must be at least 3 characters")

        # Find all threads the user is part of
        threads = DirectMessageThread.query.filter(
            (DirectMessageThread.user1_id == user_id)
            | (DirectMessageThread.user2_id == user_id)
        ).all()

        thread_ids = [thread.id for thread in threads]

        if not thread_ids:
            return [] if not schema else {"results": []}

        # Search for messages
        search_query = DirectMessage.query.filter(
            DirectMessage.thread_id.in_(thread_ids),
            DirectMessage.content.ilike(f"%{query}%"),
        ).order_by(DirectMessage.created_at.desc())

        if schema:
            return paginate(search_query, schema, collection_name="results")

        return search_query.all()
