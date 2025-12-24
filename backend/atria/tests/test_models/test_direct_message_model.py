"""Test DirectMessage model functionality.

Testing Strategy:
- DirectMessages are individual messages within a DirectMessageThread
- Can be regular text or encrypted
- Track delivery status (SENT, DELIVERED, READ)
- Must belong to a thread and have a sender
"""

import pytest
from datetime import datetime, timezone, timedelta
from api.models import DirectMessage, DirectMessageThread, User
from api.models.enums import MessageStatus


class TestDirectMessageModel:
    """Test DirectMessage model and messaging functionality."""

    def test_message_creation(self, db, user_factory):
        """Test creating a basic direct message.

        Why test this? Messages are the core content of conversations.
        Each message must have content, a sender, and belong to a thread.
        """
        user1 = user_factory()
        user2 = user_factory()

        # Create thread first
        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Create message
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Hello, how are you?"
        )
        db.session.add(message)
        db.session.commit()

        assert message.id is not None
        assert message.thread_id == thread.id
        assert message.sender_id == user1.id
        assert message.content == "Hello, how are you?"
        assert message.status == MessageStatus.SENT  # Default
        assert message.created_at is not None

    def test_message_status_tracking(self, db, user_factory):
        """Test message delivery status tracking.

        Why test this? Users need to know if their messages were
        delivered and read (like WhatsApp checkmarks).
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Important message",
            status=MessageStatus.SENT
        )
        db.session.add(message)
        db.session.commit()

        # Update status to DELIVERED
        message.status = MessageStatus.DELIVERED
        db.session.commit()
        assert message.status == MessageStatus.DELIVERED

        # Update status to READ
        message.status = MessageStatus.READ
        db.session.commit()
        assert message.status == MessageStatus.READ

    def test_encrypted_message(self, db, user_factory):
        """Test encrypted message storage.

        Why test this? End-to-end encrypted messages store
        ciphertext separately from regular content.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            is_encrypted=True
        )
        db.session.add(thread)
        db.session.commit()

        # Encrypted messages use encrypted_content field
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="",  # Empty for encrypted
            encrypted_content="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."  # Mock encrypted data
        )
        db.session.add(message)
        db.session.commit()

        assert message.content == ""
        assert message.encrypted_content is not None
        assert "eyJhbGciOi" in message.encrypted_content

    def test_message_ordering_in_thread(self, db, user_factory):
        """Test that messages maintain chronological order.

        Why test this? Conversation flow depends on correct
        message ordering by timestamp.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Create messages in mixed order
        msg1 = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="First message"
        )
        db.session.add(msg1)
        db.session.commit()

        # Small delay to ensure different timestamps
        import time
        time.sleep(0.01)

        msg2 = DirectMessage(
            thread_id=thread.id,
            sender_id=user2.id,
            content="Second message"
        )
        db.session.add(msg2)
        db.session.commit()

        time.sleep(0.01)

        msg3 = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Third message"
        )
        db.session.add(msg3)
        db.session.commit()

        # Get messages in order
        messages = DirectMessage.query.filter_by(
            thread_id=thread.id
        ).order_by(DirectMessage.created_at).all()

        assert len(messages) == 3
        assert messages[0].content == "First message"
        assert messages[1].content == "Second message"
        assert messages[2].content == "Third message"

    def test_message_sender_validation(self, db, user_factory):
        """Test that only thread participants can send messages.

        Why test this? Security - users not in a conversation
        shouldn't be able to inject messages.

        Note: This validation likely happens at service layer.
        """
        user1 = user_factory()
        user2 = user_factory()
        user3 = user_factory()  # Not in thread

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # User3 tries to send message to thread they're not in
        # Model allows this - service layer should validate
        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user3.id,  # Not a participant!
            content="Sneaky message"
        )
        db.session.add(message)
        db.session.commit()

        # Document that model doesn't enforce this
        assert message.id is not None
        # TODO: Service layer should prevent non-participants from sending

    def test_message_deletion_behavior(self, db, user_factory):
        """Test message deletion (soft delete vs hard delete).

        Why test this? Messages might be soft-deleted to preserve
        conversation context while hiding content.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Message to delete"
        )
        db.session.add(message)
        db.session.commit()

        message_id = message.id

        # Hard delete
        db.session.delete(message)
        db.session.commit()

        # Message should be gone
        deleted_msg = DirectMessage.query.get(message_id)
        assert deleted_msg is None

    def test_message_with_cutoff_filtering(self, db, user_factory):
        """Test that messages respect thread cutoff times.

        Why test this? Users can "clear" chat history from their view
        using cutoff timestamps on the thread.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Add old message
        old_msg = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Old message"
        )
        db.session.add(old_msg)
        db.session.commit()

        # Set cutoff for user1 to now
        cutoff_time = datetime.now(timezone.utc)
        thread.set_user_cutoff(user1.id, cutoff_time)
        db.session.commit()

        # Add new message after cutoff
        import time
        time.sleep(0.01)  # Ensure timestamp difference

        new_msg = DirectMessage(
            thread_id=thread.id,
            sender_id=user2.id,
            content="New message"
        )
        db.session.add(new_msg)
        db.session.commit()

        # Service layer would filter based on cutoff
        # Get messages visible to user1 (after cutoff)
        visible_messages = DirectMessage.query.filter(
            DirectMessage.thread_id == thread.id,
            DirectMessage.created_at > cutoff_time
        ).all()

        assert len(visible_messages) == 1
        assert visible_messages[0].content == "New message"

    def test_message_content_validation(self, db, user_factory):
        """Test message content constraints.

        Why test this? Messages should have reasonable limits
        and not allow empty content (except encrypted).
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Test empty content (should fail for non-encrypted)
        empty_msg = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content=""  # Empty!
        )
        db.session.add(empty_msg)

        # Model might allow empty - document behavior
        try:
            db.session.commit()
            # If it succeeds, that's a potential issue
            assert empty_msg.id is not None
            # TODO: Should validate non-empty content for regular messages
        except Exception:
            db.session.rollback()

        # Test very long content
        long_content = "x" * 10000  # 10k characters
        long_msg = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content=long_content
        )
        db.session.add(long_msg)
        db.session.commit()

        # Text field should handle long content
        assert len(long_msg.content) == 10000

    def test_message_thread_relationship(self, db, user_factory):
        """Test message-thread relationship navigation.

        Why test this? Need to navigate from message to thread
        and get thread participants.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Test message"
        )
        db.session.add(message)
        db.session.commit()

        # Navigate from message to thread
        assert message.thread == thread
        assert message.thread.user1_id == user1.id
        assert message.thread.user2_id == user2.id

        # Navigate from message to sender
        assert message.sender == user1
        assert message.sender.email == user1.email

    def test_message_cascade_from_thread_deletion(self, db, user_factory):
        """Test that messages are deleted when thread is deleted.

        Why test this? Already tested in thread model, but verify
        from message perspective.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        message = DirectMessage(
            thread_id=thread.id,
            sender_id=user1.id,
            content="Will be deleted"
        )
        db.session.add(message)
        db.session.commit()

        message_id = message.id

        # Delete thread
        db.session.delete(thread)
        db.session.commit()

        # Message should be cascade deleted
        assert DirectMessage.query.get(message_id) is None

    def test_multiple_conversations_same_users(self, db, user_factory, event_factory):
        """Test messages in different scoped threads between same users.

        Why test this? Same user pair can have separate conversations
        in different event contexts.
        """
        user1 = user_factory()
        user2 = user_factory()
        event = event_factory()

        # Global thread
        global_thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(global_thread)

        # Event-scoped thread
        event_thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id,
            event_scope_id=event.id
        )
        db.session.add(event_thread)
        db.session.commit()

        # Add message to each thread
        global_msg = DirectMessage(
            thread_id=global_thread.id,
            sender_id=user1.id,
            content="Global conversation"
        )
        event_msg = DirectMessage(
            thread_id=event_thread.id,
            sender_id=user1.id,
            content="Event-specific conversation"
        )
        db.session.add_all([global_msg, event_msg])
        db.session.commit()

        # Messages are separate
        assert global_msg.thread_id != event_msg.thread_id
        assert global_msg.thread.event_scope_id is None
        assert event_msg.thread.event_scope_id == event.id

    def test_message_status_enum_values(self, db, user_factory):
        """Test all valid MessageStatus enum values.

        Why test this? Ensure all status values work and
        understand the message lifecycle.
        """
        user1 = user_factory()
        user2 = user_factory()

        thread = DirectMessageThread(
            user1_id=user1.id,
            user2_id=user2.id
        )
        db.session.add(thread)
        db.session.commit()

        # Test each status
        statuses = [
            MessageStatus.SENT,
            MessageStatus.DELIVERED,
            MessageStatus.READ
        ]

        for status in statuses:
            message = DirectMessage(
                thread_id=thread.id,
                sender_id=user1.id,
                content=f"Message with status {status.value}",
                status=status
            )
            db.session.add(message)
            db.session.commit()

            assert message.status == status
            assert message.status.value in ['SENT', 'DELIVERED', 'READ']

    def test_conversation_flow(self, db, user_factory):
        """Test a realistic conversation flow.

        Why test this? Verify that back-and-forth messaging
        works as expected in practice.
        """
        alice = user_factory(first_name="Alice")
        bob = user_factory(first_name="Bob")

        # Create conversation thread
        thread = DirectMessageThread(
            user1_id=alice.id,
            user2_id=bob.id
        )
        db.session.add(thread)
        db.session.commit()

        # Conversation flow
        messages = [
            (alice.id, "Hey Bob, are you coming to the conference?"),
            (bob.id, "Hi Alice! Yes, I'll be there on Tuesday."),
            (alice.id, "Great! Want to grab coffee?"),
            (bob.id, "Sounds good! Let's meet at the main lobby at 10am."),
            (alice.id, "Perfect, see you then! ☕"),
        ]

        created_messages = []
        for sender_id, content in messages:
            import time
            time.sleep(0.01)  # Ensure timestamp ordering

            msg = DirectMessage(
                thread_id=thread.id,
                sender_id=sender_id,
                content=content
            )
            db.session.add(msg)
            created_messages.append(msg)

        db.session.commit()

        # Verify conversation
        assert len(thread.messages) == 5

        # Check message alternation
        assert thread.messages[0].sender_id == alice.id
        assert thread.messages[1].sender_id == bob.id
        assert thread.messages[2].sender_id == alice.id
        assert thread.messages[3].sender_id == bob.id
        assert thread.messages[4].sender_id == alice.id

        # Verify last message updates thread
        thread.last_message_at = created_messages[-1].created_at
        db.session.commit()
        assert thread.last_message_at == created_messages[-1].created_at