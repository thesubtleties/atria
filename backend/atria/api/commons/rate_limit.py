"""Rate limiting utilities for API endpoints"""

from functools import wraps
from flask import request
from flask_smorest import abort
import redis
from datetime import datetime
from api import extensions


def get_redis_client():
    """Get Redis client for rate limiting - use the cache Redis instance"""
    # Use the cache_redis client (DB 2) to keep rate limiting separate from Socket.IO
    client = extensions.cache_redis
    if client:
        try:
            client.ping()
            return client
        except Exception:
            pass
    return None


def rate_limit(max_attempts=5, window_seconds=300, key_prefix="rl", by_ip_only=False):
    """
    Rate limiting decorator for endpoints.

    Args:
        max_attempts: Maximum number of attempts allowed
        window_seconds: Time window in seconds (default 5 minutes)
        key_prefix: Prefix for Redis keys
        by_ip_only: If True, only use IP for rate limiting (not email)

    Example:
        @rate_limit(max_attempts=5, window_seconds=300)  # 5 attempts per 5 minutes
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            import os

            redis_client = get_redis_client()

            # If Redis is not available, skip rate limiting (fail open for dev)
            if not redis_client:
                # In production, this is a problem - log it
                if os.getenv("FLASK_ENV") == "production":
                    # Could abort(503) here if we want to fail closed
                    pass
                return f(*args, **kwargs)

            # Get identifier (IP address for login, could be user_id for authenticated endpoints)
            identifier = request.remote_addr or "unknown"

            # For login endpoint, also consider email if provided (unless by_ip_only)
            if not by_ip_only and request.is_json and request.json and "email" in request.json:
                email = request.json['email'].lower()
                # Skip rate limiting for demo accounts if configured
                demo_accounts = os.getenv("DEMO_ACCOUNTS", "").split(",")
                if email in [d.strip() for d in demo_accounts if d.strip()]:
                    return f(*args, **kwargs)
                # Use combination of IP and email for more granular control
                identifier = f"{identifier}:{email}"

            # Create Redis key
            redis_key = f"{key_prefix}:{request.endpoint}:{identifier}"

            try:
                # Get current attempt count
                attempts = redis_client.get(redis_key)

                if attempts is None:
                    # First attempt, set key with expiration
                    redis_client.setex(redis_key, window_seconds, 1)
                    attempts = 1
                else:
                    attempts = int(attempts)
                    if attempts >= max_attempts:
                        # Calculate remaining time
                        ttl = redis_client.ttl(redis_key)
                        if ttl > 0:
                            abort(429, message=f"Too many attempts. Please try again in {ttl} seconds.")
                        else:
                            # TTL expired, reset counter
                            redis_client.setex(redis_key, window_seconds, 1)
                            attempts = 1
                    else:
                        # Increment counter
                        redis_client.incr(redis_key)
                        attempts += 1

                # Add rate limit headers
                response = f(*args, **kwargs)

                # Add rate limit info to response headers if it's a Response object
                if hasattr(response, 'headers'):
                    response.headers['X-RateLimit-Limit'] = str(max_attempts)
                    response.headers['X-RateLimit-Remaining'] = str(max(0, max_attempts - attempts))
                    response.headers['X-RateLimit-Reset'] = str(
                        int(datetime.now().timestamp()) + redis_client.ttl(redis_key)
                    )

                return response

            except redis.RedisError:
                # If Redis fails during operation, fail open
                return f(*args, **kwargs)

        return decorated_function
    return decorator


def reset_rate_limit(endpoint, identifier):
    """
    Reset rate limit for a specific endpoint and identifier.
    Useful for resetting after successful login or password reset.

    Args:
        endpoint: The endpoint name (e.g., "auth.login")
        identifier: The identifier (IP, email, or combination)
    """
    redis_client = get_redis_client()
    if redis_client:
        redis_key = f"rl:{endpoint}:{identifier}"
        try:
            redis_client.delete(redis_key)
        except redis.RedisError:
            pass  # Fail silently