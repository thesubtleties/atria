"""
Cache Service Layer
Provides a generic caching interface for future expansion beyond Socket.IO

This service operates at the service layer, AFTER authentication and authorization
checks have been performed. Cache keys are resource-based (not user-based) to ensure
that cached data is only accessed by users who have already passed permission checks.
"""

import json
import hashlib
from functools import wraps
from typing import Any, Optional, Callable
from api.extensions import cache_redis
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """
    Generic caching interface that gracefully handles Redis unavailability.

    Design Principles:
    - Graceful degradation: Works without Redis (returns None/False)
    - Resource-based keys: Cache keys use resource IDs, not user IDs
    - Service layer only: Never used in routes, only in services after auth
    """

    @staticmethod
    def get(key: str) -> Optional[Any]:
        """
        Retrieve a value from cache

        Args:
            key: Cache key to retrieve

        Returns:
            Cached value or None if not found/error
        """
        if not cache_redis:
            return None
        try:
            value = cache_redis.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.debug(f"Cache get error for key {key}: {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = 300) -> bool:
        """
        Store a value in cache

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default 5 minutes)

        Returns:
            True if successful, False otherwise
        """
        if not cache_redis:
            return False
        try:
            cache_redis.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.debug(f"Cache set error for key {key}: {e}")
            return False

    @staticmethod
    def delete(key: str) -> bool:
        """
        Delete a specific cache key

        Args:
            key: Cache key to delete

        Returns:
            True if successful, False otherwise
        """
        if not cache_redis:
            return False
        try:
            cache_redis.delete(key)
            return True
        except Exception as e:
            logger.debug(f"Cache delete error for key {key}: {e}")
            return False

    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        """
        Invalidate all keys matching pattern

        This is crucial for maintaining cache consistency when permissions
        or data changes. For example, when an event is updated, we invalidate
        all cache entries related to that event.

        Args:
            pattern: Redis pattern (e.g., "event:123:*", "org:456:*")

        Returns:
            Number of keys deleted
        """
        if not cache_redis:
            return 0
        try:
            deleted_count = 0
            # scan_iter is more memory efficient than keys() for large datasets
            for key in cache_redis.scan_iter(match=pattern):
                cache_redis.delete(key)
                deleted_count += 1
            logger.debug(f"Invalidated {deleted_count} keys matching {pattern}")
            return deleted_count
        except Exception as e:
            logger.debug(f"Cache pattern invalidation error for {pattern}: {e}")
            return 0

    @staticmethod
    def exists(key: str) -> bool:
        """
        Check if a key exists in cache

        Args:
            key: Cache key to check

        Returns:
            True if exists, False otherwise
        """
        if not cache_redis:
            return False
        try:
            return cache_redis.exists(key) > 0
        except Exception as e:
            logger.debug(f"Cache exists check error for key {key}: {e}")
            return False

    @staticmethod
    def get_ttl(key: str) -> Optional[int]:
        """
        Get remaining TTL for a key

        Args:
            key: Cache key

        Returns:
            TTL in seconds, None if key doesn't exist or error
        """
        if not cache_redis:
            return None
        try:
            ttl = cache_redis.ttl(key)
            return ttl if ttl > 0 else None
        except Exception as e:
            logger.debug(f"Cache TTL check error for key {key}: {e}")
            return None


def cache_result(ttl: int = 300, key_prefix: Optional[str] = None) -> Callable:
    """
    Decorator for caching function results at the service layer.

    IMPORTANT: This decorator should ONLY be used on service layer methods,
    never on routes. The service method should only be called after all
    authentication and authorization checks have passed.

    Args:
        ttl: Time to live in seconds (default 5 minutes)
        key_prefix: Custom key prefix (defaults to function name)

    Example:
        @cache_result(ttl=600, key_prefix="event_detail")
        def get_event(event_id):
            # This method is only called after auth checks pass
            return Event.query.get(event_id)

    The decorator automatically:
    1. Generates a cache key based on function arguments
    2. Checks cache before executing the function
    3. Stores the result if not cached
    4. Provides invalidation methods
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip caching if Redis is not available
            if not cache_redis:
                return func(*args, **kwargs)

            # Generate cache key based on function name and arguments
            prefix = key_prefix or func.__name__
            # Create a deterministic hash of arguments for the cache key
            args_str = str((args, sorted(kwargs.items())))
            args_hash = hashlib.md5(args_str.encode()).hexdigest()[:16]  # Use first 16 chars for brevity
            cache_key = f"{prefix}:{args_hash}"

            # Try to get from cache first
            cached = CacheService.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached

            # Execute function and cache result
            logger.debug(f"Cache miss for {cache_key}, executing function")
            result = func(*args, **kwargs)

            # Only cache non-None results
            if result is not None:
                CacheService.set(cache_key, result, ttl)
                logger.debug(f"Cached result for {cache_key} with TTL {ttl}s")

            return result

        # Add method to invalidate this specific function call's cache
        def invalidate(*args, **kwargs):
            """Invalidate cache for specific function arguments"""
            prefix = key_prefix or func.__name__
            args_str = str((args, sorted(kwargs.items())))
            args_hash = hashlib.md5(args_str.encode()).hexdigest()[:16]
            cache_key = f"{prefix}:{args_hash}"
            return CacheService.delete(cache_key)

        # Add method to invalidate by pattern
        def invalidate_all():
            """Invalidate all cached results for this function"""
            return CacheService.invalidate_pattern(f"{key_prefix or func.__name__}:*")

        wrapper.invalidate = invalidate
        wrapper.invalidate_all = invalidate_all

        return wrapper
    return decorator


class CacheKeys:
    """
    Helper class for generating consistent cache keys.

    These keys are resource-based, not user-based. This ensures that:
    1. Multiple users can benefit from the same cached data
    2. Authorization is still checked on each request
    3. Cache invalidation is simpler (invalidate once for all users)
    """

    # Event-related keys
    @staticmethod
    def event(event_id: int) -> str:
        """Cache key for event details"""
        return f"event:{event_id}"

    @staticmethod
    def event_sessions(event_id: int) -> str:
        """Cache key for event's session list"""
        return f"event:{event_id}:sessions"

    @staticmethod
    def event_users(event_id: int, page: int = 1) -> str:
        """Cache key for event's user list (paginated)"""
        return f"event:{event_id}:users:page:{page}"

    @staticmethod
    def event_sponsors(event_id: int) -> str:
        """Cache key for event's sponsor list"""
        return f"event:{event_id}:sponsors"

    # Organization-related keys
    @staticmethod
    def organization(org_id: int) -> str:
        """Cache key for organization details"""
        return f"org:{org_id}"

    @staticmethod
    def organization_events(org_id: int, page: int = 1) -> str:
        """Cache key for organization's event list (paginated)"""
        return f"org:{org_id}:events:page:{page}"

    @staticmethod
    def organization_users(org_id: int) -> str:
        """Cache key for organization's member list"""
        return f"org:{org_id}:users"

    # User-related keys (for public profile data only)
    @staticmethod
    def user_public_profile(user_id: int) -> str:
        """Cache key for user's public profile data"""
        return f"user:{user_id}:public_profile"

    # Session-related keys
    @staticmethod
    def session(session_id: int) -> str:
        """Cache key for session details"""
        return f"session:{session_id}"

    @staticmethod
    def session_speakers(session_id: int) -> str:
        """Cache key for session's speaker list"""
        return f"session:{session_id}:speakers"

    # Chat-related keys
    @staticmethod
    def chat_room(room_id: int) -> str:
        """Cache key for chat room details"""
        return f"chat_room:{room_id}"

    @staticmethod
    def chat_messages(room_id: int, page: int = 1) -> str:
        """Cache key for chat room messages (paginated)"""
        return f"chat_room:{room_id}:messages:page:{page}"

    # Dashboard/Analytics keys
    @staticmethod
    def event_stats(event_id: int) -> str:
        """Cache key for event statistics"""
        return f"event:{event_id}:stats"

    @staticmethod
    def org_dashboard(org_id: int) -> str:
        """Cache key for organization dashboard data"""
        return f"org:{org_id}:dashboard"


class CacheInvalidation:
    """
    Helper class for common cache invalidation patterns.

    These methods ensure cache consistency when data changes.
    Called from service layer after successful database updates.
    """

    @staticmethod
    def event_updated(event_id: int, org_id: int):
        """Invalidate all caches related to an updated event"""
        patterns = [
            f"event:{event_id}*",  # All event-related caches
            f"org:{org_id}:events:*",  # Organization's event lists
            f"org:{org_id}:dashboard",  # Organization dashboard
        ]
        for pattern in patterns:
            CacheService.invalidate_pattern(pattern)

    @staticmethod
    def session_updated(session_id: int, event_id: int):
        """Invalidate caches when a session is updated"""
        patterns = [
            f"session:{session_id}*",  # Session details and speakers
            f"event:{event_id}:sessions",  # Event's session list
        ]
        for pattern in patterns:
            CacheService.invalidate_pattern(pattern)

    @staticmethod
    def user_joined_event(user_id: int, event_id: int):
        """Invalidate caches when a user joins an event"""
        patterns = [
            f"event:{event_id}:users:*",  # Event's user lists
            f"event:{event_id}:stats",  # Event statistics
        ]
        for pattern in patterns:
            CacheService.invalidate_pattern(pattern)

    @staticmethod
    def organization_updated(org_id: int):
        """Invalidate all organization-related caches"""
        CacheService.invalidate_pattern(f"org:{org_id}*")

    @staticmethod
    def message_sent(room_id: int):
        """Invalidate message cache when new message is sent"""
        # Only invalidate first page since that's where new messages appear
        CacheService.delete(f"chat_room:{room_id}:messages:page:1")