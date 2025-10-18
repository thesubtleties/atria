"""
Health check endpoints for monitoring application status

This provides detailed health information about the application and its dependencies,
which is crucial for:
1. Kubernetes liveness/readiness probes
2. Load balancer health checks
3. Monitoring and alerting systems
4. Debugging connection issues
"""

from flask import Blueprint
from flask.views import MethodView
from flask_smorest import Blueprint as SmorestBlueprint
import os
from datetime import datetime

from api.extensions import db, socketio, redis_client, cache_redis

blp = SmorestBlueprint(
    "health",
    __name__,
    url_prefix="/api",
    description="Health check endpoints"
)


@blp.route("/health")
class HealthCheck(MethodView):
    """Basic health check endpoint"""

    def get(self):
        """
        Basic health check for load balancers and monitoring.

        This endpoint is intentionally simple and fast. It returns 200 if the
        application is running, regardless of dependency status. This is useful
        for Kubernetes liveness probes.

        Returns:
            dict: Basic health status
        """
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "atria-backend",
            "instance": os.getenv("INSTANCE_ID", "unknown"),
        }, 200


@blp.route("/health/ready")
class ReadinessCheck(MethodView):
    """Readiness check endpoint"""

    def get(self):
        """
        Detailed readiness check for Kubernetes and monitoring.

        This checks if the application is ready to serve traffic by verifying
        all critical dependencies. Returns 503 if any critical service is down.
        This is useful for Kubernetes readiness probes.

        Returns:
            dict: Readiness status with dependency details
        """
        health_status = {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "instance": os.getenv("INSTANCE_ID", "unknown"),
            "checks": {}
        }

        # Check database connectivity
        try:
            # Use a simple query that should always work
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
            db.session.commit()  # Ensure connection is working
            health_status["checks"]["database"] = {
                "status": "connected",
                "type": "postgresql"
            }
        except Exception as e:
            health_status["checks"]["database"] = {
                "status": "error",
                "error": str(e)[:100]  # Limit error message length
            }
            health_status["status"] = "not_ready"

        # If database is down, we're not ready
        if health_status["status"] == "not_ready":
            return health_status, 503

        return health_status, 200


@blp.route("/health/detailed")
class DetailedHealthCheck(MethodView):
    """Comprehensive health check with all service details"""

    def get(self):
        """
        Detailed health check including all services and metrics.

        This provides comprehensive information about all application components
        and dependencies. Useful for debugging and detailed monitoring.

        Note: This endpoint may be slower due to comprehensive checks.

        Returns:
            dict: Detailed health status with metrics
        """
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "instance": os.getenv("INSTANCE_ID", "unknown"),
            "environment": os.getenv("FLASK_ENV", "unknown"),
            "services": {}
        }

        # Database check with more details
        try:
            # Test database connectivity and get version
            from sqlalchemy import text
            result = db.session.execute(text("SELECT version()")).fetchone()
            health_status["services"]["database"] = {
                "status": "connected",
                "type": "postgresql",
                "version": result[0].split()[0] if result else "unknown"
            }

            # Get connection pool stats if available
            if hasattr(db.engine.pool, 'size'):
                health_status["services"]["database"]["pool"] = {
                    "size": db.engine.pool.size(),
                    "checked_in": db.engine.pool.checkedin(),
                    "checked_out": db.engine.pool.checkedout(),
                    "overflow": db.engine.pool.overflow(),
                }
        except Exception as e:
            health_status["services"]["database"] = {
                "status": "error",
                "error": str(e)[:200]
            }
            health_status["status"] = "degraded"

        # Redis checks (Socket.IO and Cache)
        if redis_client:
            try:
                # Socket.IO Redis
                info = redis_client.info()
                health_status["services"]["redis_socketio"] = {
                    "status": "connected",
                    "role": info.get("role", "unknown"),
                    "connected_clients": info.get("connected_clients", 0),
                    "used_memory_human": info.get("used_memory_human", "unknown"),
                    "used_memory_peak_human": info.get("used_memory_peak_human", "unknown"),
                    "uptime_in_seconds": info.get("uptime_in_seconds", 0),
                    "db": 0  # Socket.IO uses DB 0
                }

                # Check for Socket.IO related keys
                socketio_keys = redis_client.keys("socketio:*")
                health_status["services"]["redis_socketio"]["socketio_channels"] = len(socketio_keys)

            except Exception as e:
                health_status["services"]["redis_socketio"] = {
                    "status": "error",
                    "error": str(e)[:200]
                }
                # Redis being down is not critical, just degraded
                health_status["status"] = "degraded"
        else:
            health_status["services"]["redis_socketio"] = {
                "status": "not_configured",
                "note": "Running in single-instance mode"
            }

        # Cache Redis check (separate DB)
        if cache_redis:
            try:
                cache_info = cache_redis.info()
                health_status["services"]["redis_cache"] = {
                    "status": "connected",
                    "db": 2,  # Cache uses DB 2
                    "keys": cache_redis.dbsize(),
                    "expired_keys": cache_info.get("expired_keys", 0),
                    "evicted_keys": cache_info.get("evicted_keys", 0),
                    "keyspace_hits": cache_info.get("keyspace_hits", 0),
                    "keyspace_misses": cache_info.get("keyspace_misses", 0),
                }

                # Calculate cache hit ratio if we have data
                hits = cache_info.get("keyspace_hits", 0)
                misses = cache_info.get("keyspace_misses", 0)
                if hits + misses > 0:
                    health_status["services"]["redis_cache"]["hit_ratio"] = round(
                        hits / (hits + misses) * 100, 2
                    )

            except Exception as e:
                health_status["services"]["redis_cache"] = {
                    "status": "error",
                    "error": str(e)[:200]
                }
        else:
            health_status["services"]["redis_cache"] = {
                "status": "not_configured",
                "note": "Cache disabled, using in-memory only"
            }

        # Socket.IO status
        health_status["services"]["socketio"] = {
            "status": "active",
            "async_mode": socketio.async_mode if hasattr(socketio, 'async_mode') else "unknown",
            "clustered": redis_client is not None,
            "cors_origins": os.getenv("SOCKETIO_CORS_ALLOWED_ORIGINS", "not_set"),
        }

        # If we can access the server object, get more details
        if hasattr(socketio, 'server') and socketio.server:
            try:
                if hasattr(socketio.server, 'eio') and hasattr(socketio.server.eio, 'sockets'):
                    health_status["services"]["socketio"]["active_connections"] = len(
                        socketio.server.eio.sockets
                    )
            except:
                pass  # Not critical if we can't get connection count

        # Gunicorn worker information
        health_status["services"]["workers"] = {
            "count": int(os.getenv("GUNICORN_WORKERS", 1)),
            "class": "eventlet",
            "redis_enabled": redis_client is not None,
        }

        # MinIO/Storage check (if configured)
        minio_endpoint = os.getenv("MINIO_ENDPOINT")
        if minio_endpoint:
            health_status["services"]["storage"] = {
                "type": "minio",
                "endpoint": minio_endpoint,
                "status": "configured"  # Actual connectivity test would be expensive
            }

        # Overall status determination
        # - "healthy": All services operational
        # - "degraded": Non-critical services down (Redis)
        # - "unhealthy": Critical services down (Database)
        status_code = 200
        if health_status["status"] == "degraded":
            status_code = 200  # Still return 200 for degraded (non-critical issues)
        elif health_status["status"] == "unhealthy":
            status_code = 503

        return health_status, status_code


@blp.route("/health/redis")
class RedisHealthCheck(MethodView):
    """Redis-specific health check"""

    def get(self):
        """
        Check Redis connectivity and performance metrics.

        This endpoint specifically monitors Redis health and performance,
        useful for debugging Redis-related issues.

        Returns:
            dict: Redis health status and metrics
        """
        redis_status = {
            "timestamp": datetime.utcnow().isoformat(),
            "redis_configured": bool(redis_client),
            "cache_configured": bool(cache_redis),
        }

        if not redis_client and not cache_redis:
            return {
                **redis_status,
                "status": "not_configured",
                "message": "Redis is not configured. Running in single-instance mode."
            }, 200

        # Check Socket.IO Redis
        if redis_client:
            try:
                # Ping test
                redis_client.ping()

                # Get detailed info
                info = redis_client.info()
                stats = redis_client.info("stats")

                redis_status["socketio_redis"] = {
                    "status": "healthy",
                    "response_time_ms": round(redis_client.ping() or 0, 2),
                    "version": info.get("redis_version", "unknown"),
                    "uptime_hours": round(info.get("uptime_in_seconds", 0) / 3600, 2),
                    "connected_clients": info.get("connected_clients", 0),
                    "memory": {
                        "used": info.get("used_memory_human", "unknown"),
                        "peak": info.get("used_memory_peak_human", "unknown"),
                        "fragmentation_ratio": info.get("mem_fragmentation_ratio", 0),
                    },
                    "stats": {
                        "total_connections": stats.get("total_connections_received", 0),
                        "total_commands": stats.get("total_commands_processed", 0),
                        "instantaneous_ops": stats.get("instantaneous_ops_per_sec", 0),
                    }
                }
            except Exception as e:
                redis_status["socketio_redis"] = {
                    "status": "error",
                    "error": str(e)
                }

        # Check Cache Redis
        if cache_redis:
            try:
                cache_redis.ping()
                cache_info = cache_redis.info()

                redis_status["cache_redis"] = {
                    "status": "healthy",
                    "database": 2,
                    "keys": cache_redis.dbsize(),
                    "performance": {
                        "hit_ratio": 0,  # Calculated below
                        "hits": cache_info.get("keyspace_hits", 0),
                        "misses": cache_info.get("keyspace_misses", 0),
                        "evicted": cache_info.get("evicted_keys", 0),
                        "expired": cache_info.get("expired_keys", 0),
                    }
                }

                # Calculate hit ratio
                hits = cache_info.get("keyspace_hits", 0)
                misses = cache_info.get("keyspace_misses", 0)
                if hits + misses > 0:
                    redis_status["cache_redis"]["performance"]["hit_ratio"] = round(
                        hits / (hits + misses) * 100, 2
                    )

            except Exception as e:
                redis_status["cache_redis"] = {
                    "status": "error",
                    "error": str(e)
                }

        # Determine overall status
        any_errors = False
        if redis_client and redis_status.get("socketio_redis", {}).get("status") == "error":
            any_errors = True
        if cache_redis and redis_status.get("cache_redis", {}).get("status") == "error":
            any_errors = True

        redis_status["overall_status"] = "degraded" if any_errors else "healthy"

        return redis_status, 503 if any_errors else 200