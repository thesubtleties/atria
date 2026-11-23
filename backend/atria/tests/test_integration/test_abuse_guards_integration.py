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
        # from the security review: bare domains, other separators, Unicode and zero-width tricks, other schemes
        "Claim at secure-pay.com", "bit.ly/", "calendar.app.google?x=1", "evil.com#x", "evil.com:8080",
        "calendar.app.google /abc", "evil\uff0ecom/abc", "https\uff1a//evil.com", "WWW\u200b.evil.com",
        "пример.рф/путь", "пример.рф", "tel:+18005550100", "mailto:x@y.z", "atria.gg", "evil\u3002com/x", "evil\uff61com",
    ])
    def test_links_are_refused(self, value):
        with pytest.raises(ValidationError):
            no_links(value)

    @pytest.mark.parametrize("value", ["Node.js Meetup", "St. Louis Tech Week", "Acme Inc.", "Dr. Jane O'Neil", "Q3 2026: Kickoff", "", None])
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


class TestSharedTokenCheck:
    def test_token_rejected_for_turned_off_account_and_revoked_token(self, app, db):
        from api.commons.abuse_guards import token_rejected, user_is_active
        from api.models import TokenBlocklist
        on = make_user("tok-on@sbtl.ai")
        off = make_user("tok-off@sbtl.ai", active=False)
        assert token_rejected({"jti": "none", "sub": str(on.id)}) is False
        assert token_rejected({"jti": "none", "sub": str(off.id)}) is True
        db.session.add(TokenBlocklist(jti="revoked-jti", token_type="access", user_id=on.id, revoked=True,
                                      expires=datetime.now(timezone.utc) + timedelta(hours=1)))
        db.session.commit()
        assert token_rejected({"jti": "revoked-jti", "sub": str(on.id)}) is True
        assert user_is_active(on.id) is True and user_is_active(off.id) is False and user_is_active("x") is False


class TestInviteEmailContent:
    def test_event_invitation_email_has_no_free_form_description(self, app, mocker):
        from api.services.email import email_service
        send = mocker.patch.object(email_service.backend, "send")
        event = mocker.Mock(title="Conf", description="Approved! https://calendar.app.google/x", company_name="Acme",
                            start_date=datetime(2026, 12, 1), end_date=datetime(2026, 12, 2), id=1)
        inviter = mocker.Mock(full_name="Pat Doe")
        email_service.send_event_invitation(email="r@sbtl.ai", event=event, role="attendee", invitation_token="t",
                                            inviter=inviter, has_account=False)
        rendered = " ".join(str(a) for a in send.call_args.args) + " ".join(str(v) for v in send.call_args.kwargs.values())
        assert "calendar.app.google" not in rendered


class TestRegisterAndAccept:
    def test_needs_a_real_pending_invitation_for_that_address(self, client, db):
        r = client.post("/api/invitations/register-and-accept", json={
            "user_data": {"email": "free@sbtl.ai", "password": "SecurePass123!", "first_name": "A", "last_name": "B"},
            "org_invitation_ids": [], "event_invitation_ids": [],
        }, content_type="application/json")
        assert r.status_code in (400, 422)
        assert User.query.filter_by(email="free@sbtl.ai").first() is None


class TestSignupCap:
    def test_signups_pause_after_the_hourly_cap(self, app, db, monkeypatch):
        from api.commons.abuse_guards import SignupLimitError, check_signup_allowed
        monkeypatch.setattr(abuse_guards, "SIGNUPS_PER_HOUR", 2)
        check_signup_allowed()
        make_user("s1@sbtl.ai"); make_user("s2@sbtl.ai")
        with pytest.raises(SignupLimitError):
            check_signup_allowed()


class TestNameLength:
    def test_names_are_capped(self):
        from marshmallow import ValidationError as VE
        from api.schemas.organization import OrganizationCreateSchema
        with pytest.raises(VE):
            OrganizationCreateSchema().load({"name": "x" * 101})


class TestInvitedRegistrationNotCapped:
    def test_signup_cap_does_not_block_a_real_invitation(self, client, db, monkeypatch):
        monkeypatch.setattr(abuse_guards, "SIGNUPS_PER_HOUR", 0)
        owner = make_user("cap-owner@sbtl.ai", created_at=datetime.now(timezone.utc) - timedelta(days=30))
        org = make_org_with_owner(owner)
        inv = OrganizationInvitation(organization_id=org.id, email="invited@sbtl.ai", role=OrganizationUserRole.MEMBER,
                                     token=secrets.token_urlsafe(16), status=InvitationStatus.PENDING, invited_by_id=owner.id,
                                     expires_at=datetime.now(timezone.utc) + timedelta(days=7))
        db.session.add(inv); db.session.commit()
        r = client.post("/api/invitations/register-and-accept", json={
            "user_data": {"email": "invited@sbtl.ai", "password": "SecurePass123!", "first_name": "In", "last_name": "Vited"},
            "org_invitation_ids": [inv.id], "event_invitation_ids": [],
        }, content_type="application/json")
        assert r.status_code == 201, r.data
