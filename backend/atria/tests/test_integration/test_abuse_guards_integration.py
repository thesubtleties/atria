"""Guards from the 2026-11-22 invite spam: a fresh account bulk-invited 1,554 addresses with a phishing line as its
organization name. Invitation emails are limited per inviter, names that go into emails can't carry links, and a
turned-off account (is_active=False) can't sign in, use its tokens or reset its password."""

import json
import secrets
from datetime import datetime, timedelta, timezone

import pytest
from marshmallow import ValidationError

from api.commons import abuse_guards
from api.commons.abuse_guards import InviteLimitError, check_invite_allowed, no_links
from api.extensions import db
from api.models import Organization, OrganizationInvitation, OrganizationUser, User
from api.models.enums import InvitationStatus, OrganizationUserRole


def make_user(email, created_at=None, active=True):
    user = User(email=email, first_name="Test", last_name="User", password="SecurePass123!", email_verified=True)
    user.is_active = active
    db.session.add(user)
    db.session.commit()
    if created_at is not None:
        user.created_at = created_at
        db.session.commit()
    return user


def make_org_with_owner(owner):
    org = Organization(name="Test Org")
    db.session.add(org)
    db.session.flush()
    db.session.add(OrganizationUser(organization_id=org.id, user_id=owner.id, role=OrganizationUserRole.OWNER))
    db.session.commit()
    return org


def add_invites(org, inviter, n, at=None):
    for i in range(n):
        inv = OrganizationInvitation(
            organization_id=org.id, email=f"x{secrets.token_hex(4)}@sbtl.ai", role=OrganizationUserRole.MEMBER,
            token=secrets.token_urlsafe(16), status=InvitationStatus.PENDING, invited_by_id=inviter.id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.session.add(inv)
        if at is not None:
            db.session.flush()
            inv.created_at = at
    db.session.commit()


def login(client, email):
    return client.post("/api/auth/login", json={"email": email, "password": "SecurePass123!"},
                       content_type="application/json")


class TestNoLinks:
    @pytest.mark.parametrize("value", [
        "Вам одобрено 545оо р. Войдите здесь- https://calendar.app.google/rLe4ZRmvUNNp277",
        "Claim at www.example.com", "calendar.app.google/abc", "ftp://files", "HTTP://X.Y",
    ])
    def test_links_are_refused(self, value):
        with pytest.raises(ValidationError):
            no_links(value)

    @pytest.mark.parametrize("value", ["Node.js Meetup", "atria.gg", "St. Louis Tech Week", "Acme Inc.", "", None])
    def test_plain_names_pass(self, value):
        assert no_links(value)

    def test_organization_create_refuses_a_link_in_the_name(self, client, db):
        make_user("orgmaker@sbtl.ai")
        assert login(client, "orgmaker@sbtl.ai").status_code == 200
        r = client.post("/api/organizations", json={"name": "Approved! https://calendar.app.google/x"},
                        content_type="application/json")
        assert r.status_code == 422


class TestInviteLimits:
    def test_new_account_is_capped_in_its_first_day(self, app, db):
        user = make_user("fresh@sbtl.ai")
        org = make_org_with_owner(user)
        add_invites(org, user, abuse_guards.NEW_ACCOUNT_LIMIT - 1)
        check_invite_allowed(user)  # one more is fine
        add_invites(org, user, 1, at=datetime.now(timezone.utc))
        with pytest.raises(InviteLimitError):
            check_invite_allowed(user)

    def test_established_account_hourly_limit(self, app, db):
        user = make_user("old@sbtl.ai", created_at=datetime.now(timezone.utc) - timedelta(days=30))
        org = make_org_with_owner(user)
        add_invites(org, user, abuse_guards.HOURLY_LIMIT)
        with pytest.raises(InviteLimitError):
            check_invite_allowed(user)

    def test_old_invites_dont_count(self, app, db):
        user = make_user("older@sbtl.ai", created_at=datetime.now(timezone.utc) - timedelta(days=30))
        org = make_org_with_owner(user)
        add_invites(org, user, abuse_guards.DAILY_LIMIT, at=datetime.now(timezone.utc) - timedelta(days=2))
        check_invite_allowed(user)

    def test_turned_off_account_cannot_invite(self, app, db):
        user = make_user("off@sbtl.ai", active=False)
        with pytest.raises(InviteLimitError):
            check_invite_allowed(user)

    def test_bulk_invite_stops_at_the_limit(self, client, db):
        user = make_user("bulk@sbtl.ai")
        org = make_org_with_owner(user)
        assert login(client, "bulk@sbtl.ai").status_code == 200
        n = abuse_guards.NEW_ACCOUNT_LIMIT + 5
        r = client.post(f"/api/organizations/{org.id}/invitations/bulk",
                        json={"invitations": [{"email": f"r{i}@sbtl.ai", "role": "MEMBER"} for i in range(n)]},
                        content_type="application/json")
        assert r.status_code == 201
        body = json.loads(r.data)
        assert len(body["successful"]) == abuse_guards.NEW_ACCOUNT_LIMIT
        assert len(body["failed"]) == 5
        assert OrganizationInvitation.query.filter_by(organization_id=org.id).count() == abuse_guards.NEW_ACCOUNT_LIMIT


class TestTurnedOffAccounts:
    def test_cannot_sign_in(self, client, db):
        make_user("disabled@sbtl.ai", active=False)
        r = login(client, "disabled@sbtl.ai")
        assert r.status_code == 401

    def test_existing_session_stops_working(self, client, db):
        user = make_user("later-off@sbtl.ai")
        assert login(client, "later-off@sbtl.ai").status_code == 200
        assert client.get("/api/auth/me").status_code == 200
        user.is_active = False
        db.session.commit()
        assert client.get("/api/auth/me").status_code == 401

    def test_no_password_reset_email(self, app, db, mocker):
        from api.services.password_reset import PasswordResetService
        make_user("noreset@sbtl.ai", active=False)
        send = mocker.patch("api.services.password_reset.email_service.send_password_reset")
        assert PasswordResetService.create_reset_token("noreset@sbtl.ai") is None
        send.assert_not_called()
