"""
Presence Service - Redis-backed real-time user presence tracking

This service tracks which users are currently active in which chat rooms using Redis.
It provides O(1) lookups for room member counts and presence checks, which is crucial
for real-time features at scale.

Architecture:
- Uses Redis Sets for efficient membership tracking
- Tracks bidirectional relationships (user->rooms, room->users) for fast cleanup
- Automatic TTL expiration prevents stale presence data
- Gracefully degrades if Redis is unavailable

Redis Key Structure:
- presence:room:{room_id}:users → Set of user IDs in this room
- presence:user:{user_id}:rooms → Set of room IDs this user is in
"""

import logging
from typing import Set, Optional
from api.extensions import presence_redis  # Will be added to extensions

logger = logging.getLogger(__name__)


class PresenceService:
    """
    Service for tracking user presence in chat rooms using Redis.

    Why Redis Sets?
    - O(1) membership checks (SISMEMBER)
    - O(1) count operations (SCARD)
    - Atomic add/remove operations (SADD/SREM)
    - Native set operations (SUNION, SDIFF for advanced queries)
    """

    # TTL for presence keys (5 minutes - refreshed on heartbeat)
    PRESENCE_TTL = 300

    @staticmethod
    def _get_room_key(room_id: int) -> str:
        """Generate Redis key for room's user set"""
        return f"presence:room:{room_id}:users"

    @staticmethod
    def _get_user_key(user_id: int) -> str:
        """Generate Redis key for user's room set"""
        return f"presence:user:{user_id}:rooms"

    @staticmethod
    def join_room(room_id: int, user_id: int) -> Optional[int]:
        """
        Add user to room presence tracking.

        This creates a bidirectional relationship:
        1. Add user to room's member set
        2. Add room to user's active rooms set

        The bidirectional tracking allows efficient cleanup when a user disconnects
        - we can quickly find all rooms they were in.

        Args:
            room_id: Chat room ID
            user_id: User ID joining the room

        Returns:
            New user count in room, or None if Redis unavailable
        """
        if not presence_redis:
            logger.debug("Redis not available, skipping presence tracking")
            return None

        try:
            room_key = PresenceService._get_room_key(room_id)
            user_key = PresenceService._get_user_key(user_id)

            # Use pipeline for atomic operation (both or neither)
            pipeline = presence_redis.pipeline()

            # Add user to room's set
            pipeline.sadd(room_key, user_id)
            pipeline.expire(room_key, PresenceService.PRESENCE_TTL)

            # Add room to user's set (for cleanup on disconnect)
            pipeline.sadd(user_key, room_id)
            pipeline.expire(user_key, PresenceService.PRESENCE_TTL)

            # Get updated count
            pipeline.scard(room_key)

            results = pipeline.execute()
            user_count = results[-1]  # Last result is the count

            logger.debug(f"User {user_id} joined room {room_id}. Count: {user_count}")
            return user_count

        except Exception as e:
            logger.error(f"Error adding user {user_id} to room {room_id}: {e}")
            return None

    @staticmethod
    def leave_room(room_id: int, user_id: int) -> Optional[int]:
        """
        Remove user from room presence tracking.

        Args:
            room_id: Chat room ID
            user_id: User ID leaving the room

        Returns:
            New user count in room, or None if Redis unavailable
        """
        if not presence_redis:
            return None

        try:
            room_key = PresenceService._get_room_key(room_id)
            user_key = PresenceService._get_user_key(user_id)

            # Remove from both sets
            pipeline = presence_redis.pipeline()
            pipeline.srem(room_key, user_id)
            pipeline.srem(user_key, room_id)
            pipeline.scard(room_key)

            results = pipeline.execute()
            user_count = results[-1]

            logger.debug(f"User {user_id} left room {room_id}. Count: {user_count}")
            return user_count

        except Exception as e:
            logger.error(f"Error removing user {user_id} from room {room_id}: {e}")
            return None

    @staticmethod
    def get_room_user_count(room_id: int) -> int:
        """
        Get count of users currently in a room.

        This is O(1) with Redis SCARD command, making it very efficient
        even for rooms with thousands of users.

        Args:
            room_id: Chat room ID

        Returns:
            Number of active users in room, or 0 if Redis unavailable
        """
        if not presence_redis:
            return 0

        try:
            room_key = PresenceService._get_room_key(room_id)
            count = presence_redis.scard(room_key)
            return count or 0

        except Exception as e:
            logger.error(f"Error getting room {room_id} count: {e}")
            return 0

    @staticmethod
    def get_room_users(room_id: int) -> Set[int]:
        """
        Get set of all user IDs currently in a room.

        Use this when you need the actual user IDs, not just the count.
        For large rooms (>100 users), prefer get_room_user_count() if you
        only need the count.

        Args:
            room_id: Chat room ID

        Returns:
            Set of user IDs in room, empty set if Redis unavailable
        """
        if not presence_redis:
            return set()

        try:
            room_key = PresenceService._get_room_key(room_id)
            members = presence_redis.smembers(room_key)
            # Convert string IDs back to integers
            return {int(user_id) for user_id in members}

        except Exception as e:
            logger.error(f"Error getting users for room {room_id}: {e}")
            return set()

    @staticmethod
    def is_user_in_room(room_id: int, user_id: int) -> bool:
        """
        Check if a user is currently present in a room.

        O(1) operation using Redis SISMEMBER.

        Args:
            room_id: Chat room ID
            user_id: User ID to check

        Returns:
            True if user is in room, False otherwise
        """
        if not presence_redis:
            return False

        try:
            room_key = PresenceService._get_room_key(room_id)
            return presence_redis.sismember(room_key, user_id)

        except Exception as e:
            logger.error(f"Error checking user {user_id} in room {room_id}: {e}")
            return False

    @staticmethod
    def cleanup_user(user_id: int) -> int:
        """
        Remove user from ALL rooms they're in.

        This is called when a user disconnects. The bidirectional tracking
        makes this efficient - we can look up all rooms the user is in
        without scanning all rooms.

        Args:
            user_id: User ID to clean up

        Returns:
            Number of rooms cleaned up, or 0 if Redis unavailable
        """
        if not presence_redis:
            return 0

        try:
            user_key = PresenceService._get_user_key(user_id)

            # Get all rooms user is in
            room_ids = presence_redis.smembers(user_key)

            if not room_ids:
                logger.debug(f"User {user_id} not in any rooms, nothing to clean up")
                return 0

            # Remove user from all their rooms
            pipeline = presence_redis.pipeline()

            for room_id in room_ids:
                room_key = PresenceService._get_room_key(int(room_id))
                pipeline.srem(room_key, user_id)

            # Delete user's room set
            pipeline.delete(user_key)

            pipeline.execute()

            count = len(room_ids)
            logger.info(f"Cleaned up user {user_id} from {count} rooms")
            return count

        except Exception as e:
            logger.error(f"Error cleaning up user {user_id}: {e}")
            return 0

    @staticmethod
    def refresh_user_presence(user_id: int) -> bool:
        """
        Refresh TTL for all of a user's presence keys.

        This should be called on heartbeat events to prevent active users
        from being expired. Without periodic refresh, users would be removed
        after PRESENCE_TTL seconds even if still connected.

        Args:
            user_id: User ID to refresh

        Returns:
            True if successful, False if Redis unavailable
        """
        if not presence_redis:
            return False

        try:
            user_key = PresenceService._get_user_key(user_id)

            # Get all rooms user is in
            room_ids = presence_redis.smembers(user_key)

            if not room_ids:
                return True

            # Refresh TTL on all keys
            pipeline = presence_redis.pipeline()

            for room_id in room_ids:
                room_key = PresenceService._get_room_key(int(room_id))
                pipeline.expire(room_key, PresenceService.PRESENCE_TTL)

            pipeline.expire(user_key, PresenceService.PRESENCE_TTL)
            pipeline.execute()

            logger.debug(f"Refreshed presence for user {user_id} in {len(room_ids)} rooms")
            return True

        except Exception as e:
            logger.error(f"Error refreshing presence for user {user_id}: {e}")
            return False

    @staticmethod
    def get_user_rooms(user_id: int) -> Set[int]:
        """
        Get all room IDs a user is currently in.

        Useful for debugging or admin features.

        Args:
            user_id: User ID

        Returns:
            Set of room IDs user is in, empty set if Redis unavailable
        """
        if not presence_redis:
            return set()

        try:
            user_key = PresenceService._get_user_key(user_id)
            room_ids = presence_redis.smembers(user_key)
            return {int(room_id) for room_id in room_ids}

        except Exception as e:
            logger.error(f"Error getting rooms for user {user_id}: {e}")
            return set()

    # ========================================================================
    # SESSION VIEWING PRESENCE
    # Real-time viewer tracking + future cumulative analytics
    # ========================================================================

    @staticmethod
    def _get_session_key(session_id: int) -> str:
        """Generate Redis key for session's viewer set"""
        return f"presence:session:{session_id}:viewers"

    @staticmethod
    def _get_user_sessions_key(user_id: int) -> str:
        """Generate Redis key for user's active sessions set"""
        return f"presence:user:{user_id}:sessions"

    @staticmethod
    def join_session(session_id: int, user_id: int, is_live: bool = False) -> Optional[int]:
        """
        Add user to session viewing tracking.

        Tracks real-time viewers in Redis. Future DB integration will track:
        - Visit counts (every page view)
        - Watch time (cumulative, only when session is live)

        Args:
            session_id: Session ID
            user_id: User ID viewing the session
            is_live: Whether session is currently live (for watch time tracking)

        Returns:
            New viewer count, or None if Redis unavailable

        TODO: Future DB persistence (single row per user/session)
        ```python
        # Always increment visit count
        UserSessionTracking.increment_visit(user_id, session_id)
        # total_visits++

        if is_live:
            # Start watch time tracking
            UserSessionTracking.start_watching(user_id, session_id)
            # SET current_join_time = NOW
        ```
        """
        if not presence_redis:
            return None

        try:
            session_key = PresenceService._get_session_key(session_id)
            user_sessions_key = PresenceService._get_user_sessions_key(user_id)

            pipeline = presence_redis.pipeline()
            pipeline.sadd(session_key, user_id)
            pipeline.expire(session_key, PresenceService.PRESENCE_TTL)
            pipeline.sadd(user_sessions_key, session_id)
            pipeline.expire(user_sessions_key, PresenceService.PRESENCE_TTL)
            pipeline.scard(session_key)

            results = pipeline.execute()
            viewer_count = results[-1]

            logger.debug(
                f"User {user_id} joined session {session_id} "
                f"(live={is_live}). Viewers: {viewer_count}"
            )
            return viewer_count

        except Exception as e:
            logger.error(f"Error adding user {user_id} to session {session_id}: {e}")
            return None

    @staticmethod
    def leave_session(session_id: int, user_id: int) -> Optional[int]:
        """
        Remove user from session viewing tracking.

        Args:
            session_id: Session ID
            user_id: User ID leaving the session

        Returns:
            New viewer count, or None if Redis unavailable

        TODO: Future DB persistence
        ```python
        tracking = UserSessionTracking.get(user_id, session_id)

        if tracking.current_join_time:
            # Calculate elapsed time for this viewing session
            elapsed = NOW - tracking.current_join_time
            # Add to cumulative total
            tracking.total_watch_seconds += elapsed
            # Clear current viewing session
            tracking.current_join_time = NULL
            tracking.save()
        ```
        """
        if not presence_redis:
            return None

        try:
            session_key = PresenceService._get_session_key(session_id)
            user_sessions_key = PresenceService._get_user_sessions_key(user_id)

            pipeline = presence_redis.pipeline()
            pipeline.srem(session_key, user_id)
            pipeline.srem(user_sessions_key, session_id)
            pipeline.scard(session_key)

            results = pipeline.execute()
            viewer_count = results[-1]

            logger.debug(f"User {user_id} left session {session_id}. Viewers: {viewer_count}")
            return viewer_count

        except Exception as e:
            logger.error(f"Error removing user {user_id} from session {session_id}: {e}")
            return None

    @staticmethod
    def heartbeat_session(session_id: int, user_id: int, is_live: bool) -> bool:
        """
        Process heartbeat for user viewing a session.

        Refreshes Redis TTL and updates DB watch time accumulation.
        Frontend should call this every 60 seconds while user is viewing.

        Args:
            session_id: Session ID
            user_id: User ID
            is_live: Whether session is currently live

        Returns:
            True if successful, False if Redis unavailable

        TODO: Future DB persistence (heartbeat pattern)
        ```python
        if is_live:
            tracking = UserSessionTracking.get(user_id, session_id)

            if tracking.current_join_time:
                # Calculate elapsed since last checkpoint
                elapsed = NOW - tracking.current_join_time
                # Add to cumulative total
                tracking.total_watch_seconds += elapsed
                # Reset for next interval (prevents double-counting)
                tracking.current_join_time = NOW
                tracking.last_updated = NOW
                tracking.save()

                # This pattern means:
                # - Can't game by reopening (each interval tracked)
                # - Survives crashes (checkpoint every 60s)
                # - Accurate total across multiple visits
        ```
        """
        if not presence_redis:
            return False

        try:
            session_key = PresenceService._get_session_key(session_id)
            user_sessions_key = PresenceService._get_user_sessions_key(user_id)

            # Refresh TTL on presence keys
            pipeline = presence_redis.pipeline()
            pipeline.expire(session_key, PresenceService.PRESENCE_TTL)
            pipeline.expire(user_sessions_key, PresenceService.PRESENCE_TTL)
            pipeline.execute()

            logger.debug(
                f"Heartbeat for user {user_id} in session {session_id} (live={is_live})"
            )
            return True

        except Exception as e:
            logger.error(f"Error processing heartbeat for user {user_id} in session {session_id}: {e}")
            return False

    @staticmethod
    def get_session_viewer_count(session_id: int) -> int:
        """
        Get count of users currently viewing a session (real-time).

        This is the live count for displaying on session pages/dashboards.
        Separate from total visit counts or watch time in DB.

        Args:
            session_id: Session ID

        Returns:
            Number of active viewers, or 0 if Redis unavailable
        """
        if not presence_redis:
            return 0

        try:
            session_key = PresenceService._get_session_key(session_id)
            count = presence_redis.scard(session_key)
            return count or 0

        except Exception as e:
            logger.error(f"Error getting viewer count for session {session_id}: {e}")
            return 0

    @staticmethod
    def get_session_viewers(session_id: int) -> Set[int]:
        """
        Get set of all user IDs currently viewing a session.

        Args:
            session_id: Session ID

        Returns:
            Set of user IDs viewing session, empty set if Redis unavailable
        """
        if not presence_redis:
            return set()

        try:
            session_key = PresenceService._get_session_key(session_id)
            members = presence_redis.smembers(session_key)
            return {int(user_id) for user_id in members}

        except Exception as e:
            logger.error(f"Error getting viewers for session {session_id}: {e}")
            return set()

    @staticmethod
    def get_user_sessions(user_id: int) -> Set[int]:
        """
        Get all session IDs a user is currently viewing.

        Used during cleanup to emit leave events to all sessions.

        Args:
            user_id: User ID

        Returns:
            Set of session IDs user is viewing, empty set if Redis unavailable
        """
        if not presence_redis:
            return set()

        try:
            user_sessions_key = PresenceService._get_user_sessions_key(user_id)
            session_ids = presence_redis.smembers(user_sessions_key)
            return {int(session_id) for session_id in session_ids}

        except Exception as e:
            logger.error(f"Error getting sessions for user {user_id}: {e}")
            return set()
