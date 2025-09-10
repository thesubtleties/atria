# api/services/direct_message.py
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Union

from api.extensions import db
from api.models import DirectMessageThread, DirectMessage, User, Connection
from api.models.enums import MessageStatus, ConnectionStatus
from api.commons.pagination import paginate


class DirectMessageService:
    @staticmethod
    def get_user_threads(user_id: int, schema=None, include_enrichment=False, event_id=None):
        """
        Get direct message threads for a user with multi-layer filtering.
        
        SQL filtering (efficient, reduces data loaded):
        - Only threads where user is participant (user1_id or user2_id)
        - Only threads with no cutoff OR messages after cutoff time
        
        Python filtering (complex business logic):
        - Remove global threads where connection.status = REMOVED
        - Hide event threads when an active global thread exists
        
        This two-stage approach balances performance with complex logic that
        would be difficult to express in SQL.
        
        Args:
            user_id: ID of the user requesting threads
            schema: Optional Marshmallow schema for serialization
            include_enrichment: If True, enrich threads with service data like shared_event_ids
            
        Returns:
            Filtered list of threads with pagination metadata if schema provided
        """
        from sqlalchemy import case, and_, or_, func
        from sqlalchemy.orm import aliased
        from api.models.user import User
        from api.models.enums import ConnectionStatus
        
        # Create an alias for the messages table to check for messages after cutoff
        dm_alias = aliased(DirectMessage)
        
        # Create a CASE expression to get the user's cutoff time
        user_cutoff = case(
            (DirectMessageThread.user1_id == user_id, DirectMessageThread.user1_cutoff),
            (DirectMessageThread.user2_id == user_id, DirectMessageThread.user2_cutoff),
            else_=None
        )
        
        # Subquery to check if thread has messages after cutoff
        has_messages_after_cutoff = db.session.query(dm_alias.id).filter(
            dm_alias.thread_id == DirectMessageThread.id,
            dm_alias.created_at > user_cutoff
        ).limit(1).scalar_subquery()
        
        # Main query that filters threads based on cutoff logic
        query = DirectMessageThread.query.filter(
            and_(
                # User is part of the thread
                or_(
                    DirectMessageThread.user1_id == user_id,
                    DirectMessageThread.user2_id == user_id
                ),
                # Include thread if either:
                # 1. No cutoff is set (user_cutoff IS NULL), OR
                # 2. There are messages after the cutoff time
                or_(
                    user_cutoff.is_(None),
                    has_messages_after_cutoff.is_not(None)
                )
            )
        )
        
        # Fetch all threads then filter in Python
        # This is more efficient than complex SQL for typical thread counts
        all_threads = query.all()
        
        # Quick lookup for current user
        current_user = User.query.get(user_id)
        
        # Build a set of user pairs with active global threads
        # This lets us hide event threads when global exists
        active_global_pairs = set()
        visible_threads = []
        
        # First pass: identify global threads with active connections
        for thread in all_threads:
            if thread.event_scope_id is None:  # Global thread
                other_user_id = thread.user2_id if thread.user1_id == user_id else thread.user1_id
                connection = current_user.get_connection_with(other_user_id)
                
                # Include global thread only if connection is not removed
                if not connection or connection.status != ConnectionStatus.REMOVED:
                    user_pair = tuple(sorted([user_id, other_user_id]))
                    active_global_pairs.add(user_pair)
                    visible_threads.append(thread)
        
        # Second pass: add event threads only if no global thread exists
        for thread in all_threads:
            if thread.event_scope_id is not None:  # Event thread
                other_user_id = thread.user2_id if thread.user1_id == user_id else thread.user1_id
                user_pair = tuple(sorted([user_id, other_user_id]))
                
                # Show event thread only if no active global thread exists
                if user_pair not in active_global_pairs:
                    visible_threads.append(thread)
        
        # Sort by last message time
        visible_threads.sort(key=lambda t: t.last_message_at or t.created_at, reverse=True)
        
        # Add event-specific enrichment if event_id is provided
        if event_id:
            from api.models.event_user import EventUser
            
            # Get all other user IDs from visible threads
            other_user_ids = []
            for thread in visible_threads:
                other_id = thread.user2_id if thread.user1_id == user_id else thread.user1_id
                other_user_ids.append(other_id)
            
            # Single query to check which users are in the event
            event_users = set(
                row[0] for row in 
                db.session.query(EventUser.user_id)
                .filter(
                    EventUser.event_id == event_id,
                    EventUser.user_id.in_(other_user_ids)
                )
                .all()
            ) if other_user_ids else set()
            
            # Add the event membership info to each thread
            for thread in visible_threads:
                other_id = thread.user2_id if thread.user1_id == user_id else thread.user1_id
                # Add as a transient attribute (won't be persisted to DB)
                thread.other_user_in_event = other_id in event_users
                # For backwards compatibility, also add shared_event_ids 
                # but only include the current event if user is in it
                if other_id in event_users:
                    thread.shared_event_ids = [event_id]
                else:
                    thread.shared_event_ids = []
        
        if schema:
            # Return in expected format for pagination
            return {
                "threads": schema.dump(visible_threads),
                "total_items": len(visible_threads),
                "total_pages": 1,
                "current_page": 1,
                "per_page": len(visible_threads) or 1
            }

        return visible_threads

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
        """Get messages for a thread with pagination, respecting user's cutoff"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to view these messages")

        # Base query with eager loading to avoid N+1
        from sqlalchemy.orm import joinedload
        query = DirectMessage.query.options(
            joinedload(DirectMessage.sender)
        ).filter_by(thread_id=thread_id)
        
        # Apply cutoff filter if user has cleared their history
        cutoff_time = thread.get_user_cutoff(user_id)
        if cutoff_time:
            query = query.filter(DirectMessage.created_at > cutoff_time)
        
        # Order by created_at DESC for newest first
        query = query.order_by(DirectMessage.created_at.desc())

        # Mark unread messages as read (only messages user can see)
        DirectMessageService.mark_messages_read(thread_id, user_id, cutoff_time)

        if schema:
            # Don't reverse - return newest first
            return paginate(query, schema, collection_name="messages")

        # Manual pagination for socket responses
        if per_page:
            per_page = min(per_page, 100)  # Limit max per_page
            total = query.count()
            total_pages = (total + per_page - 1) // per_page

            messages = (
                query.offset((page - 1) * per_page).limit(per_page).all()
            )
            
            # Don't reverse - return newest first

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

        # Check if connection exists OR admin privilege for event-scoped threads
        current_user = User.query.get(user_id)
        is_connected = current_user.is_connected_with(other_user_id)
        
        if not is_connected:
            # If not connected, check for admin privilege in event-scoped thread
            if thread.event_scope_id:
                # For event-scoped threads, allow messaging if EITHER user has admin privilege
                # This allows both admin-initiated messages AND recipient responses
                can_sender_message = DirectMessageService.can_user_message_in_event_context(
                    user_id, other_user_id, thread.event_scope_id
                )
                can_recipient_respond = DirectMessageService.can_user_message_in_event_context(
                    other_user_id, user_id, thread.event_scope_id
                )
                
                if not (can_sender_message or can_recipient_respond):
                    raise ValueError(
                        "You must be connected with this user to send messages"
                    )
            else:
                # Global thread requires connection
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
    def mark_messages_read(thread_id: int, user_id: int, cutoff_time=None):
        """Mark all unread messages in a thread as read, respecting cutoff"""
        thread = DirectMessageThread.query.get_or_404(thread_id)

        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to access this thread")

        # Base query for unread messages
        unread_query = DirectMessage.query.filter_by(
            thread_id=thread_id, status=MessageStatus.DELIVERED
        ).filter(DirectMessage.sender_id != user_id)
        
        # Apply cutoff filter if provided
        if cutoff_time:
            unread_query = unread_query.filter(DirectMessage.created_at > cutoff_time)
        
        unread_messages = unread_query.all()

        for message in unread_messages:
            message.status = MessageStatus.READ

        db.session.commit()

        # Get the other user ID for notifications
        other_user_id = (
            thread.user2_id if thread.user1_id == user_id else thread.user1_id
        )

        return thread_id, other_user_id, len(unread_messages) > 0

    @staticmethod
    def get_or_create_thread(user1_id: int, user2_id: int, event_scope_id: int = None):
        """
        Get existing thread or create a new one between two users.
        If users are connected, always use global thread (event_scope_id=None).
        If not connected, use event-scoped thread.
        """
        from api.models.user import User
        
        # Prevent users from creating threads with themselves
        if user1_id == user2_id:
            raise ValueError(f"Cannot create thread with yourself (user_id: {user1_id})")
        
        print(f"Creating/getting thread between user1_id={user1_id} and user2_id={user2_id}, event_scope_id={event_scope_id}")
        
        # Check if users are connected
        user1 = User.query.get(user1_id)
        are_connected = user1.is_connected_with(user2_id)
        
        if are_connected:
            # Always use global thread for connected users
            event_scope_id = None
        
        # Check if thread already exists in this scope
        thread = DirectMessageThread.query.filter(
            (
                (DirectMessageThread.user1_id == user1_id)
                & (DirectMessageThread.user2_id == user2_id)
            )
            | (
                (DirectMessageThread.user1_id == user2_id)
                & (DirectMessageThread.user2_id == user1_id)
            ),
            DirectMessageThread.event_scope_id == event_scope_id
        ).first()

        if thread:
            return thread, False

        # Create new thread with appropriate scope
        thread = DirectMessageThread(
            user1_id=user1_id,
            user2_id=user2_id,
            event_scope_id=event_scope_id,
            is_encrypted=False,
        )

        db.session.add(thread)
        db.session.commit()

        return thread, True

    @staticmethod
    def get_shared_event_ids(user1_id: int, user2_id: int) -> List[int]:
        """
        Get IDs of events where both users are members.
        Uses an efficient single query with intersect for optimal performance.
        
        Args:
            user1_id: ID of first user
            user2_id: ID of second user
            
        Returns:
            List of event IDs where both users are members
        """
        from api.models.event_user import EventUser
        
        # Use intersect for efficient query - finds events where both users are members
        shared_events = db.session.query(EventUser.event_id).filter(
            EventUser.user_id == user1_id
        ).intersect(
            db.session.query(EventUser.event_id).filter(
                EventUser.user_id == user2_id
            )
        ).all()
        
        return [event_id for (event_id,) in shared_events]

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
            "event_scope_id": thread.event_scope_id,  # Include event scoping info
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
        
        # Include list of shared events using the reusable method
        shared_event_ids = DirectMessageService.get_shared_event_ids(user_id, other_user.id)
        thread_data["shared_event_ids"] = shared_event_ids

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
    def get_thread_messages_with_context(
        thread_id: int, user_id: int, page=1, per_page=50
    ) -> Dict[str, Any]:
        """
        Get thread messages with full context including other_user info.
        This is the unified method for both HTTP and WebSocket responses.
        """
        # Get the thread and validate access
        thread = DirectMessageService.get_thread(thread_id, user_id)
        
        # Get the other user efficiently (already have thread, just need user)
        other_user = thread.get_other_user(user_id)
        
        # Get paginated messages
        messages_result = DirectMessageService.get_thread_messages(
            thread_id, user_id, page=page, per_page=per_page
        )
        
        # Format messages for response
        message_list = DirectMessageService.format_messages_for_response(
            messages_result["messages"], reverse=True
        )
        
        # Build the complete response
        return {
            "thread_id": thread_id,
            "messages": message_list,
            "pagination": messages_result["pagination"],
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
            },
            "is_encrypted": thread.is_encrypted,
        }
    
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

    @staticmethod
    def can_user_message_in_event_context(sender_id: int, recipient_id: int, event_id: int) -> bool:
        """
        Check if sender can message recipient in specific event context without connection.
        Returns True if sender is admin/organizer in the specified event and recipient is in the event.
        """
        from api.models.event_user import EventUser
        from api.models.enums import EventUserRole
        from api.models.user import User
        
        # First check if already connected (then no need for admin privilege)
        sender = User.query.get(sender_id)
        if sender and sender.is_connected_with(recipient_id):
            return True  # Connected users can always message
        
        # Check admin privilege in specific event
        sender_role = EventUser.query.filter_by(
            user_id=sender_id, 
            event_id=event_id
        ).first()
        
        if not sender_role or sender_role.role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            return False
        
        # Check if recipient is in this event
        recipient_in_event = EventUser.query.filter_by(
            user_id=recipient_id,
            event_id=event_id
        ).first()
        
        return recipient_in_event is not None

    @staticmethod
    def merge_event_threads_on_connection(user1_id: int, user2_id: int):
        """
        When users connect, copy all their event-scoped thread messages into one global thread.
        Event threads are preserved (not deleted) so they can be reactivated if connection is removed.
        Called after connection is accepted.
        """
        from api.models.direct_message import DirectMessage
        
        # Get all event-scoped threads between these users
        event_threads = DirectMessageThread.query.filter(
            (
                (DirectMessageThread.user1_id == user1_id)
                & (DirectMessageThread.user2_id == user2_id)
            )
            | (
                (DirectMessageThread.user1_id == user2_id)
                & (DirectMessageThread.user2_id == user1_id)
            ),
            DirectMessageThread.event_scope_id.isnot(None)
        ).all()
        
        if not event_threads:
            return  # No event threads to merge
        
        # Get or create global thread
        global_thread, _ = DirectMessageService.get_or_create_thread(
            user1_id, user2_id, event_scope_id=None
        )
        
        # Copy all messages from event threads to global thread
        # We COPY instead of MOVE to preserve the event context
        for event_thread in event_threads:
            messages = DirectMessage.query.filter_by(thread_id=event_thread.id).all()
            
            # Sort messages by created_at to maintain chronological order
            messages.sort(key=lambda m: m.created_at)
            
            for message in messages:
                # Check if this message already exists in global thread (avoid duplicates on re-merge)
                existing = DirectMessage.query.filter_by(
                    thread_id=global_thread.id,
                    sender_id=message.sender_id,
                    content=message.content,
                    created_at=message.created_at
                ).first()
                
                if not existing:
                    # Create a copy of the message in the global thread
                    new_message = DirectMessage(
                        thread_id=global_thread.id,
                        sender_id=message.sender_id,
                        content=message.content,
                        encrypted_content=message.encrypted_content,
                        status=message.status,
                        created_at=message.created_at  # Preserve original timestamp
                    )
                    db.session.add(new_message)
            
            # Update global thread's last_message_at if needed
            if event_thread.last_message_at and (not global_thread.last_message_at or 
                                                  event_thread.last_message_at > global_thread.last_message_at):
                global_thread.last_message_at = event_thread.last_message_at
        
        # NOTE: We intentionally do NOT delete the event threads
        # They will be hidden by get_user_threads when a global thread exists
        # but can be reactivated if the connection is removed
        
        db.session.commit()

    @staticmethod
    def clear_thread_for_user(thread_id: int, user_id: int):
        """Clear/hide a thread for a specific user"""
        thread = DirectMessageThread.query.get_or_404(thread_id)
        
        # Check if user is part of this thread
        if thread.user1_id != user_id and thread.user2_id != user_id:
            raise ValueError("Not authorized to clear this thread")
        
        # Set cutoff to current time
        thread.set_user_cutoff(user_id)
        db.session.commit()
        
        return thread
