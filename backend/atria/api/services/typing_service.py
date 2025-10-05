"""
Typing Indicator Service - Redis-backed real-time typing status tracking

This service tracks when users are typing in chat rooms or DM threads using Redis Hashes
with short TTLs. This provides a responsive typing indicator that automatically clears
if the user stops typing or disconnects.

Architecture:
- Uses Redis Hashes to store {user_id: timestamp} for each room/thread
- Short TTL (5 seconds) with automatic expiration prevents stale indicators
- User must keep sending typing events to maintain "is typing" status
- Client-side debouncing recommended (send every 500ms while typing)

Redis Key Structure:
- typing:room:{room_id} → Hash of {user_id: timestamp} for chat rooms
- typing:dm:{thread_id} → Hash of {user_id: timestamp} for DM threads

Performance Characteristics:
- O(1) set/check operations (HSET, HEXISTS)
- O(N) get all typing users where N = number typing (typically small, <10)
- Automatic cleanup via TTL reduces server load
- No background jobs needed for cleanup
"""

import logging
import time
from typing import List, Dict, Optional
from api.extensions import presence_redis  # Shares the same Redis instance as presence

logger = logging.getLogger(__name__)


class TypingService:
    """
    Service for tracking typing indicators in chat rooms and DM threads.

    Why Redis Hashes?
    - O(1) per-user operations (HSET, HDEL, HEXISTS)
    - Can store metadata (timestamp) with user ID
    - HGETALL returns all typing users efficiently
    - Entire hash expires with TTL (automatic cleanup)

    Client Implementation Notes:
    The frontend should:
    1. Debounce typing events (send max once per 500ms)
    2. Send typing=true when user starts typing
    3. Send typing=false when user stops or clears input
    4. Don't send events if already showing "is typing" status
    """

    # TTL for typing indicators (5 seconds - user must refresh to stay "typing")
    TYPING_TTL = 5

    # Timestamp threshold (5 seconds) - typing indicators older than this are ignored
    TYPING_THRESHOLD = 5

    @staticmethod
    def _get_room_typing_key(room_id: int) -> str:
        """Generate Redis key for chat room typing indicator"""
        return f"typing:room:{room_id}"

    @staticmethod
    def _get_dm_typing_key(thread_id: int) -> str:
        """Generate Redis key for DM thread typing indicator"""
        return f"typing:dm:{thread_id}"

    @staticmethod
    def set_typing_in_room(room_id: int, user_id: int, is_typing: bool) -> bool:
        """
        Set typing status for a user in a chat room.

        When a user is typing, we store their user ID with current timestamp in a Redis Hash.
        The entire hash has a TTL of TYPING_TTL seconds - if no typing events are received,
        the hash expires and all typing indicators are cleared.

        Args:
            room_id: Chat room ID
            user_id: User ID
            is_typing: True if user is typing, False to clear

        Returns:
            True if successful, False if Redis unavailable
        """
        if not presence_redis:
            logger.debug("Redis not available, skipping typing indicator")
            return False

        try:
            typing_key = TypingService._get_room_typing_key(room_id)

            if is_typing:
                # Store current timestamp
                timestamp = int(time.time())
                presence_redis.hset(typing_key, user_id, timestamp)
                # Refresh TTL on the entire hash
                presence_redis.expire(typing_key, TypingService.TYPING_TTL)
                logger.debug(f"User {user_id} is typing in room {room_id}")
            else:
                # Remove user from typing hash
                presence_redis.hdel(typing_key, user_id)
                logger.debug(f"User {user_id} stopped typing in room {room_id}")

            return True

        except Exception as e:
            logger.error(f"Error setting typing status for user {user_id} in room {room_id}: {e}")
            return False

    @staticmethod
    def set_typing_in_dm(thread_id: int, user_id: int, is_typing: bool) -> bool:
        """
        Set typing status for a user in a DM thread.

        Same pattern as room typing, but uses DM thread ID instead.

        Args:
            thread_id: DM thread ID
            user_id: User ID
            is_typing: True if user is typing, False to clear

        Returns:
            True if successful, False if Redis unavailable
        """
        if not presence_redis:
            return False

        try:
            typing_key = TypingService._get_dm_typing_key(thread_id)

            if is_typing:
                timestamp = int(time.time())
                presence_redis.hset(typing_key, user_id, timestamp)
                presence_redis.expire(typing_key, TypingService.TYPING_TTL)
                logger.debug(f"User {user_id} is typing in DM thread {thread_id}")
            else:
                presence_redis.hdel(typing_key, user_id)
                logger.debug(f"User {user_id} stopped typing in DM thread {thread_id}")

            return True

        except Exception as e:
            logger.error(f"Error setting typing status for user {user_id} in DM {thread_id}: {e}")
            return False

    @staticmethod
    def get_typing_users_in_room(room_id: int) -> List[Dict[str, any]]:
        """
        Get list of users currently typing in a chat room.

        We filter out any typing indicators older than TYPING_THRESHOLD seconds
        to handle edge cases where TTL hasn't expired yet but user stopped typing.

        Args:
            room_id: Chat room ID

        Returns:
            List of dicts with user_id and timestamp, sorted by timestamp (oldest first)
            Empty list if Redis unavailable
        """
        if not presence_redis:
            return []

        try:
            typing_key = TypingService._get_room_typing_key(room_id)
            typing_data = presence_redis.hgetall(typing_key)

            if not typing_data:
                return []

            current_time = int(time.time())
            typing_users = []

            # Filter out stale typing indicators
            for user_id, timestamp in typing_data.items():
                timestamp = int(timestamp)
                age = current_time - timestamp

                # Only include if within threshold
                if age <= TypingService.TYPING_THRESHOLD:
                    typing_users.append({
                        'user_id': int(user_id),
                        'timestamp': timestamp,
                        'age_seconds': age
                    })

            # Sort by timestamp (oldest first)
            typing_users.sort(key=lambda x: x['timestamp'])

            return typing_users

        except Exception as e:
            logger.error(f"Error getting typing users for room {room_id}: {e}")
            return []

    @staticmethod
    def get_typing_users_in_dm(thread_id: int) -> List[Dict[str, any]]:
        """
        Get list of users currently typing in a DM thread.

        For DMs, typically only one user will be typing at a time (the other person),
        but the implementation supports multiple users for group DMs in the future.

        Args:
            thread_id: DM thread ID

        Returns:
            List of dicts with user_id and timestamp
            Empty list if Redis unavailable
        """
        if not presence_redis:
            return []

        try:
            typing_key = TypingService._get_dm_typing_key(thread_id)
            typing_data = presence_redis.hgetall(typing_key)

            if not typing_data:
                return []

            current_time = int(time.time())
            typing_users = []

            for user_id, timestamp in typing_data.items():
                timestamp = int(timestamp)
                age = current_time - timestamp

                if age <= TypingService.TYPING_THRESHOLD:
                    typing_users.append({
                        'user_id': int(user_id),
                        'timestamp': timestamp,
                        'age_seconds': age
                    })

            typing_users.sort(key=lambda x: x['timestamp'])

            return typing_users

        except Exception as e:
            logger.error(f"Error getting typing users for DM thread {thread_id}: {e}")
            return []

    @staticmethod
    def is_user_typing_in_room(room_id: int, user_id: int) -> bool:
        """
        Check if a specific user is currently typing in a chat room.

        This is an O(1) operation using HEXISTS.

        Args:
            room_id: Chat room ID
            user_id: User ID to check

        Returns:
            True if user is typing, False otherwise
        """
        if not presence_redis:
            return False

        try:
            typing_key = TypingService._get_room_typing_key(room_id)
            exists = presence_redis.hexists(typing_key, user_id)

            if not exists:
                return False

            # Double-check timestamp to ensure it's not stale
            timestamp = int(presence_redis.hget(typing_key, user_id))
            age = int(time.time()) - timestamp

            return age <= TypingService.TYPING_THRESHOLD

        except Exception as e:
            logger.error(f"Error checking typing status for user {user_id} in room {room_id}: {e}")
            return False

    @staticmethod
    def cleanup_user_typing(user_id: int) -> int:
        """
        Remove user from ALL typing indicators.

        This is called when a user disconnects. Unlike presence tracking,
        we don't maintain a bidirectional mapping for typing (too ephemeral),
        so we rely on TTL expiration for most cleanup.

        This method is primarily for immediate cleanup on disconnect to provide
        better UX (typing indicator disappears immediately rather than after TTL).

        Note: This requires scanning all typing keys, which is acceptable because:
        1. It only happens on disconnect (infrequent)
        2. Typing keys are short-lived and few in number
        3. We limit the scan to a reasonable batch size

        Args:
            user_id: User ID to clean up

        Returns:
            Number of keys cleaned up, or 0 if Redis unavailable
        """
        if not presence_redis:
            return 0

        try:
            cleaned = 0

            # Scan for room typing keys
            for key in presence_redis.scan_iter(match="typing:room:*", count=100):
                if presence_redis.hexists(key, user_id):
                    presence_redis.hdel(key, user_id)
                    cleaned += 1

            # Scan for DM typing keys
            for key in presence_redis.scan_iter(match="typing:dm:*", count=100):
                if presence_redis.hexists(key, user_id):
                    presence_redis.hdel(key, user_id)
                    cleaned += 1

            if cleaned > 0:
                logger.info(f"Cleaned up user {user_id} from {cleaned} typing indicators")

            return cleaned

        except Exception as e:
            logger.error(f"Error cleaning up typing indicators for user {user_id}: {e}")
            return 0

    @staticmethod
    def get_typing_count_in_room(room_id: int) -> int:
        """
        Get count of users currently typing in a room.

        This is more efficient than get_typing_users_in_room() when you only
        need the count, not the user details.

        Args:
            room_id: Chat room ID

        Returns:
            Number of users typing, or 0 if Redis unavailable
        """
        if not presence_redis:
            return 0

        try:
            typing_key = TypingService._get_room_typing_key(room_id)
            count = presence_redis.hlen(typing_key)

            # Note: This includes potentially stale entries
            # For exact count, use len(get_typing_users_in_room())
            return count or 0

        except Exception as e:
            logger.error(f"Error getting typing count for room {room_id}: {e}")
            return 0
