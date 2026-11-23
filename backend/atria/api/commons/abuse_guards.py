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
# All invitation emails across the site per 24 h: bounds the total however many accounts exist (an account farm built
# through invited registration, which isn't under the signup cap). Real use: about 3 a day.
SITE_DAILY_LIMIT = _env_int("INVITES_SITE_PER_DAY", 300)


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


# Advisory lock key for invite counting, clear of other lock users
_INVITE_LOCK = (0x41545249 << 32) + 1  # "ATRI" + 1


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

    # One site-wide lock around count + insert (invitations are rare): neither one inviter's parallel requests nor
    # many inviters at once can pass the per-user or site-wide counts before the others commit.
    db.session.execute(db.text("SELECT pg_advisory_xact_lock(:k)"), {"k": _INVITE_LOCK})

    now = datetime.now(timezone.utc)

    def sent_since(since, everyone=False):
        org = db.session.query(db.func.count(OrganizationInvitation.id)).filter(OrganizationInvitation.created_at >= since)
        event = db.session.query(db.func.count(EventInvitation.id)).filter(EventInvitation.created_at >= since)
        if not everyone:
            org = org.filter(OrganizationInvitation.invited_by_id == inviter.id)
            event = event.filter(EventInvitation.invited_by_id == inviter.id)
        return (org.scalar() or 0) + (event.scalar() or 0)

    if sent_since(now - timedelta(hours=24), everyone=True) >= SITE_DAILY_LIMIT:
        raise InviteLimitError("Invitations are paused for today. Please try again tomorrow.")

    if inviter.created_at and now - _utc(inviter.created_at) < timedelta(hours=NEW_ACCOUNT_HOURS):
        if sent_since(_utc(inviter.created_at)) >= NEW_ACCOUNT_LIMIT:
            raise InviteLimitError(
                f"New accounts can send {NEW_ACCOUNT_LIMIT} invitations in their first day. Please try again later."
            )
    if sent_since(now - timedelta(hours=1)) >= HOURLY_LIMIT:
        raise InviteLimitError(f"Invitation limit reached ({HOURLY_LIMIT} per hour). Please try again later.")
    if sent_since(now - timedelta(hours=24)) >= DAILY_LIMIT:
        raise InviteLimitError(f"Invitation limit reached ({DAILY_LIMIT} per day). Please try again tomorrow.")


# Text that reaches emails (names, organizations, events) can't carry a link. Normalized first (NFKC folds fullwidth
# dots/colons; format characters such as zero-width spaces are dropped), then refused on: a URL scheme, "www.", a
# domain followed by a path/query/fragment/port, or a bare domain ending in a common TLD. Dotted words that aren't
# domains ("Node.js Meetup", "St. Louis") pass.
_TLDS = (
    "com|net|org|info|biz|io|co|me|ly|app|dev|page|site|online|xyz|top|link|click|gg|tv|ru|su|cn|de|uk|us|ca|eu|"
    "tk|ml|ga|cf|gq|shop|store|live|google|so|to|cc|ws|pw|icu|vip|club|win|bid|loan|work|today|lol|fun|space|"
    "website|tech|cloud|ai|in|br|fr|it|es|nl|pl|ua|kz|by|uz|tr|ir|vn|id|ph|ng|pk|bd|рф|рус|бел|укр|қаз"
)
_SCHEME = re.compile(r"(?i)\b(https?|ftp|mailto|tel|sms|data|javascript|file|intent|market)\s*:")
_WWW = re.compile(r"(?i)\bwww\s*\.")
_DOMAIN_PATH = re.compile(r"(?i)[\w-]+(\.[\w-]+)+\s*[/?#:]")
_BARE_DOMAIN = re.compile(r"(?i)[\w-]+(\.[\w-]+)*\.(" + _TLDS + r"|xn--[\w-]+)(?![\w-])")


# Dots that IDNA (browsers, mail clients) treat as label separators but NFKC leaves alone
_IDNA_DOTS = str.maketrans({"\u3002": ".", "\uff61": ".", "\uff0e": "."})


def _normalize(value):
    import unicodedata
    text = unicodedata.normalize("NFKC", value).translate(_IDNA_DOTS)
    return "".join(ch for ch in text if unicodedata.category(ch) != "Cf")


def has_link(value):
    if not value:
        return False
    text = _normalize(value)
    return bool(_SCHEME.search(text) or _WWW.search(text) or _DOMAIN_PATH.search(text) or _BARE_DOMAIN.search(text))


def no_links(value):
    """Marshmallow validator for names that appear in emails (organizations, events, people)."""
    if has_link(value):
        raise ValidationError("Links aren't allowed here.")
    return True


def name_text(max_len):
    """Validators for a name that goes into emails: no links, at most max_len characters."""
    from marshmallow import validate
    return [no_links, validate.Length(max=max_len)]


# New accounts across the whole site per hour. Client IPs aren't visible behind the ingress, so this is global;
# real signups have been a handful a month.
SIGNUPS_PER_HOUR = _env_int("SIGNUPS_PER_HOUR", 20)


class SignupLimitError(ValueError):
    pass


def check_signup_allowed():
    from api.extensions import db
    from api.models import User
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = db.session.query(db.func.count(User.id)).filter(User.created_at >= since).scalar() or 0
    if recent >= SIGNUPS_PER_HOUR:
        raise SignupLimitError("Sign-ups are busy right now. Please try again in a little while.")
