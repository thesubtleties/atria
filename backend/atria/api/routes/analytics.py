"""Analytics proxy routes for Plausible Analytics.

This module provides proxy endpoints for Plausible analytics to bypass
ad blockers while preserving user privacy. Plausible is privacy-focused,
GDPR-compliant, and does not use cookies or collect personal data.
"""
from flask import request, Response
from flask.views import MethodView
from flask_smorest import Blueprint
import requests
import logging

logger = logging.getLogger(__name__)

# Create Flask-Smorest blueprint to match Atria's pattern
blp = Blueprint(
    "analytics",
    __name__,
    url_prefix="/api/anonstats",
    description="Analytics proxy endpoints"
)

# Plausible configuration
PLAUSIBLE_BASE_URL = "https://plausible.sbtl.dev"
PLAUSIBLE_SCRIPT_BASE = f"{PLAUSIBLE_BASE_URL}/js"
PLAUSIBLE_EVENT_URL = f"{PLAUSIBLE_BASE_URL}/api/event"

# Timeout for requests to Plausible
REQUEST_TIMEOUT = 30


@blp.route("/js/<path:script_name>")
class AnalyticsScriptProxy(MethodView):
    @blp.doc(
        summary="Proxy Plausible analytics script",
        description=(
            "Proxies the Plausible analytics script to bypass ad blockers. "
            "Returns JavaScript content or a harmless fallback on error."
        ),
        responses={
            200: {"description": "Analytics script content"},
        },
    )
    def get(self, script_name):
        """Proxy Plausible analytics scripts"""
        try:
            # Construct the full URL to the Plausible script
            script_url = f"{PLAUSIBLE_SCRIPT_BASE}/{script_name}"

            # Fetch the script from Plausible
            resp = requests.get(script_url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()

            # Return the script with appropriate headers
            return Response(
                resp.content,
                status=resp.status_code,
                headers={
                    "Content-Type": "application/javascript",
                    "Cache-Control": "public, max-age=3600",
                    "X-Proxied-From": "plausible.sbtl.dev",
                }
            )

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch analytics script: {e}")
            # Return a minimal fallback that won't break the page
            return Response(
                'console.warn("Analytics script unavailable");',
                status=200,
                headers={"Content-Type": "application/javascript"}
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response(
                'console.warn("Analytics script unavailable");',
                status=200,
                headers={"Content-Type": "application/javascript"}
            )


@blp.route("/event")
class AnalyticsEventProxy(MethodView):
    @blp.doc(
        summary="Proxy Plausible analytics events",
        description=(
            "Forwards analytics events to Plausible while preserving "
            "client IP for accurate geolocation tracking."
        ),
        responses={
            200: {"description": "Event forwarded successfully"},
        },
    )
    def post(self):
        """Forward analytics event to Plausible"""
        try:
            # Get the request body
            body = request.get_data()

            # Get the real client IP for geolocation
            forwarded = request.headers.get("X-Forwarded-For", "")
            client_ip = forwarded.split(",")[0].strip()
            if not client_ip:
                client_ip = request.remote_addr or ""

            # Prepare headers for Plausible
            headers = {
                "Content-Type": request.headers.get(
                    "Content-Type", "application/json"
                ),
                "User-Agent": request.headers.get("User-Agent", ""),
                "X-Forwarded-For": request.headers.get(
                    "X-Forwarded-For", request.remote_addr
                ),
                "X-Forwarded-Proto": request.headers.get(
                    "X-Forwarded-Proto", "https"
                ),
                "X-Forwarded-Host": "atria.gg",
                "X-Plausible-IP": client_ip,
            }

            # Forward the event to Plausible
            resp = requests.post(
                PLAUSIBLE_EVENT_URL,
                data=body,
                headers=headers,
                timeout=REQUEST_TIMEOUT
            )

            # Return Plausible's response
            return Response(
                resp.content,
                status=resp.status_code,
                headers={
                    "Content-Type": resp.headers.get(
                        "Content-Type", "application/json"
                    ),
                }
            )

        except Exception as e:
            logger.error(f"Failed to forward event: {e}")
            # Return success to prevent client-side errors
            return Response(
                '{"status":"ok"}',
                status=200,
                headers={"Content-Type": "application/json"}
            )
