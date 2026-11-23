"""Guards against using Atria to send spam: invite email limits and no links in names that end up in emails.

Every invitation email carries text the inviter chose (organization name, event title, company, their own name),
so a fresh account could otherwise mail a phishing line to thousands of strangers. See the 2026-11-22 incident.
"""

import os
import re
from datetime import datetime, timedelta, timezone

from marshmallow import ValidationError


def _env_int(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# Real use has never passed 3 invitations a day; these leave a lot of room. Raise per deployment if an event needs it.
NEW_ACCOUNT_HOURS = 24
NEW_ACCOUNT_LIMIT = _env_int("INVITES_NEW_ACCOUNT_LIMIT", 10)  # in an account's first day
HOURLY_LIMIT = _env_int("INVITES_PER_HOUR", 25)
DAILY_LIMIT = _env_int("INVITES_PER_DAY", 50)


def token_rejected(jwt_payload):
    """True if a decoded JWT must not be honoured: revoked in the blocklist, or its account is turned off
    (is_active=False). Used by the HTTP blocklist loader and the socket connect handler."""
    from api.extensions import db
    from api.models import TokenBlocklist, User

    jti = jwt_payload.get("jti")
    token = TokenBlocklist.query.filter_by(jti=jti).first() if jti else None
    if token is not None and token.revoked:
        return True
    sub = str(jwt_payload.get("sub", ""))
    user = db.session.get(User, int(sub)) if sub.isdigit() else None
    return user is not None and not user.is_active


def user_is_active(user_id):
    """False for a turned-off or missing account (sockets check this on every event)."""
    from api.extensions import db
    from api.models import User

    user = db.session.get(User, int(user_id)) if str(user_id).isdigit() else None
    return user is not None and user.is_active


# Advisory lock keys for invite counting: a fixed high base plus the user id, clear of other lock users
_LOCK_BASE = 0x41545249 << 32  # "ATRI"


class InviteLimitError(ValueError):
    """Raised before an invitation email would go over the inviter's limit."""


def _utc(dt):
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def check_invite_allowed(inviter):
    """Raise InviteLimitError if one more invitation email from this user would pass a limit.

    Counted from the database (organization and event invitations together), so it holds when Redis is down
    and covers single and bulk invites alike.
    """
    from api.extensions import db
    from api.models import OrganizationInvitation, EventInvitation

    if inviter is None or not inviter.is_active:
        raise InviteLimitError("This account can't send invitations.")

    db.session.execute(db.text("SELECT pg_advisory_xact_lock(:k)"), {"k": _LOCK_BASE + int(inviter.id)})

    now = datetime.now(timezone.utc)

    def sent_since(since):
        org = db.session.query(db.func.count(OrganizationInvitation.id)).filter(
            OrganizationInvitation.invited_by_id == inviter.id, OrganizationInvitation.created_at >= since
        ).scalar()
        event = db.session.query(db.func.count(EventInvitation.id)).filter(
            EventInvitation.invited_by_id == inviter.id, EventInvitation.created_at >= since
        ).scalar()
        return (org or 0) + (event or 0)

    if inviter.created_at and now - _utc(inviter.created_at) < timedelta(hours=NEW_ACCOUNT_HOURS):
        if sent_since(_utc(inviter.created_at)) >= NEW_ACCOUNT_LIMIT:
            raise InviteLimitError(
                f"New accounts can send {NEW_ACCOUNT_LIMIT} invitations in their first day. Please try again later."
            )
    if sent_since(now - timedelta(hours=1)) >= HOURLY_LIMIT:
        raise InviteLimitError(f"Invitation limit reached ({HOURLY_LIMIT} per hour). Please try again later.")
    if sent_since(now - timedelta(hours=24)) >= DAILY_LIMIT:
        raise InviteLimitError(f"Invitation limit reached ({DAILY_LIMIT} per day). Please try again tomorrow.")


# A link: a scheme, www., or a domain followed by a path. Plain names with dots ("Node.js Meetup", "atria.gg") pass.
_LINK = re.compile(r"(?i)([a-z][a-z0-9+.-]*://|\bwww\.|\b[a-z0-9-]+(\.[a-z0-9-]+)+/\S)")


def no_links(value):
    """Marshmallow validator for names that appear in emails (organizations, events, people)."""
    if value and _LINK.search(value):
        raise ValidationError("Links aren't allowed here.")
    return True
