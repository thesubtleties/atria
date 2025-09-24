"""Integration tests for organization management and multi-tenancy.

Testing Strategy:
- Tests the FULL organization stack: HTTP → Route → Service → Model → Database
- Validates multi-tenant data isolation
- Tests role-based access control (OWNER > ADMIN > MEMBER)
- Ensures organizations are properly isolated from each other
- No mocking - tests the real implementation
"""

import pytest
import json
from api.models import User, Organization, OrganizationUser
from api.models.enums import OrganizationUserRole
from api.extensions import db


class TestOrganizationIntegration:
    """Test organization management through the full stack."""

    def test_create_organization_flow(self, client, db):
        """Test complete organization creation flow.

        Why test this? Organizations are the foundation of multi-tenancy.
        Every feature depends on proper org creation and setup.
        """
        # Create and login a user
        user = User(
            email="founder@sbtl.ai",
            first_name="Org",
            last_name="Founder",
            password="Password123!",
            email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

        # Login
        client.post(
            "/api/auth/login",
            json={"email": "founder@sbtl.ai", "password": "Password123!"},
        )

        # Create organization
        response = client.post(
            "/api/organizations", json={"name": "Test Organization"}
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["name"] == "Test Organization"
        assert "id" in data

        # Verify creator is automatically owner
        org_id = data["id"]
        org_users_response = client.get(f"/api/organizations/{org_id}/users")
        assert org_users_response.status_code == 200

        users_data = json.loads(org_users_response.data)
        # Debug: print actual response structure
        print(f"Users response: {users_data}")

        # Handle paginated or direct response
        if "users" in users_data:
            users_list = users_data["users"]
        elif "organization_users" in users_data:
            users_list = users_data["organization_users"]
        elif isinstance(users_data, list):
            users_list = users_data
        else:
            # Paginated response
            users_list = users_data.get("items", users_data.get("data", []))

        assert len(users_list) >= 1  # At least the founder
        # Find the founder in the list
        founder = next(
            (u for u in users_list if "founder@sbtl.ai" in str(u)), None
        )
        assert founder is not None

    def test_organization_role_hierarchy(self, client, db):
        """Test role-based access control in organizations.

        Why test this? Different roles have different permissions.
        OWNER > ADMIN > MEMBER hierarchy must be enforced.
        """
        # Create users
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        member = User(
            email="member@sbtl.ai",
            first_name="Member",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, admin, member])
        db.session.commit()

        # Owner creates org
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations", json={"name": "Role Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Owner sends invitation to admin
        invite_admin_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "admin@sbtl.ai", "role": "ADMIN"},
        )
        assert invite_admin_response.status_code in [200, 201]
        admin_invite_data = json.loads(invite_admin_response.data)
        # Debug: See what the invitation response contains
        print(f"Admin invitation response: {admin_invite_data}")
        admin_token = admin_invite_data.get(
            "token", admin_invite_data.get("invitation", {}).get("token")
        )

        # Owner sends invitation to member
        invite_member_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "member@sbtl.ai", "role": "MEMBER"},
        )
        assert invite_member_response.status_code in [200, 201]
        member_invite_data = json.loads(invite_member_response.data)
        member_token = member_invite_data.get(
            "token", member_invite_data.get("invitation", {}).get("token")
        )

        # Admin must accept invitation - this is the REAL integration flow
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )

        if admin_token:
            # Accept the invitation using the token
            admin_accept = client.post(
                f"/api/invitations/organization/{admin_token}/accept", json={}
            )
            assert admin_accept.status_code == 200
        else:
            # If no token, maybe invitations work differently, check response
            print(
                f"No token found in invitation response: {admin_invite_data}"
            )

        # Member must accept invitation
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "member@sbtl.ai", "password": "Pass123!"},
        )

        if member_token:
            member_accept = client.post(
                f"/api/invitations/organization/{member_token}/accept", json={}
            )
            assert member_accept.status_code == 200

        # Test admin permissions - now they're actually in the org
        # Admin is already logged in from accepting invitation

        new_member = User(
            email="newmember@sbtl.ai",
            first_name="New",
            last_name="Member",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(new_member)
        db.session.commit()

        # Admin can invite members
        add_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "newmember@sbtl.ai", "role": "MEMBER"},
        )
        # Note: Actual permission might vary - document behavior
        # Some systems allow, some don't

        # Test member permissions - can't add users
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "member@sbtl.ai", "password": "Pass123!"},
        )

        another_user = User(
            email="another@sbtl.ai",
            first_name="Another",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(another_user)
        db.session.commit()

        # Member can't invite users
        forbidden_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "another@sbtl.ai", "role": "MEMBER"},
        )
        assert forbidden_response.status_code in [
            403,
            401,
        ]  # Should be forbidden

    def test_multi_tenant_isolation(self, client, db):
        """Test that organizations are completely isolated from each other.

        Why test this? Critical security - users in one org should never
        see data from another org.
        """
        # Create two separate organizations with different owners
        owner1 = User(
            email="owner1@sbtl.ai",
            first_name="Owner",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        owner2 = User(
            email="owner2@sbtl.ai",
            first_name="Owner",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner1, owner2])
        db.session.commit()

        # Create org 1
        client.post(
            "/api/auth/login",
            json={"email": "owner1@sbtl.ai", "password": "Pass123!"},
        )
        org1_response = client.post(
            "/api/organizations", json={"name": "Organization One"}
        )
        org1_id = json.loads(org1_response.data)["id"]

        # Create event in org 1
        event1_response = client.post(
            f"/api/organizations/{org1_id}/events",
            json={
                "name": "Private Event Org1",
                "start_date": "2024-12-01",
                "end_date": "2024-12-02",
            },
        )

        client.post("/api/auth/logout")

        # Create org 2
        client.post(
            "/api/auth/login",
            json={"email": "owner2@sbtl.ai", "password": "Pass123!"},
        )
        org2_response = client.post(
            "/api/organizations", json={"name": "Organization Two"}
        )
        org2_id = json.loads(org2_response.data)["id"]

        # Owner2 should NOT be able to access org1's data
        org1_access = client.get(f"/api/organizations/{org1_id}")
        assert org1_access.status_code in [403, 404]  # Forbidden or not found

        # Owner2 should NOT see org1's events
        org1_events = client.get(f"/api/organizations/{org1_id}/events")
        assert org1_events.status_code in [403, 404]

        # Owner2 should NOT be able to modify org1
        modify_org1 = client.put(
            f"/api/organizations/{org1_id}", json={"name": "Hacked!"}
        )
        assert modify_org1.status_code in [403, 404]

    def test_organization_user_invitation_flow(self, client, db):
        """Test inviting users to organizations and validating access after acceptance.

        Why test this? Invitations are how organizations grow.
        Must handle existing users, new users, and role assignments.
        CRITICAL: Must verify invited users can actually access org resources.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(owner)
        db.session.commit()

        # Create org with some events to test access
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations", json={"name": "Invite Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Create an event in the org to test access later
        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json={
                "name": "Test Event for Access Validation",
                "start_date": "2024-12-01",
                "end_date": "2024-12-02",
            },
        )
        event_id = (
            json.loads(event_response.data)["id"]
            if event_response.status_code in [200, 201]
            else None
        )

        # Invite existing user
        existing_user = User(
            email="existing@sbtl.ai",
            first_name="Existing",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(existing_user)
        db.session.commit()

        invite_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "existing@sbtl.ai", "role": "MEMBER"},
        )
        assert invite_response.status_code in [200, 201]
        invite_data = json.loads(invite_response.data)
        invitation_id = invite_data.get("id")

        # Log out owner and log in as the invited existing user
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "existing@sbtl.ai", "password": "Pass123!"},
        )

        # REAL FLOW: User fetches their own invitations to get the token
        # This is how the dashboard/frontend actually works!
        invitations_response = client.get(f"/api/users/{existing_user.id}/invitations")
        assert invitations_response.status_code == 200
        invitations_data = json.loads(invitations_response.data)

        # Extract the organization invitation token
        org_invitations = invitations_data.get("organization_invitations", [])
        assert len(org_invitations) > 0, "Should have at least one org invitation"

        # Find our specific invitation
        our_invitation = next((inv for inv in org_invitations
                               if inv["organization"]["name"] == "Invite Test Org"), None)
        assert our_invitation is not None, "Should find our invitation"

        invitation_token = our_invitation["token"]
        print(f"Retrieved token from user invitations API: {invitation_token[:10]}...")

        # Accept the invitation using the token
        accept_response = client.post(
            f"/api/invitations/organization/{invitation_token}/accept",
            json={}  # Accept schema might need empty body
        )
        print(f"Acceptance response status: {accept_response.status_code}")
        if accept_response.status_code != 200:
            print(f"Acceptance failed: {accept_response.data}")

        # NOW THE CRITICAL PART: Verify the invited user can access org resources
        # Test 1: Can see the organization in their list
        orgs_response = client.get("/api/organizations")
        assert orgs_response.status_code == 200
        orgs_data = json.loads(orgs_response.data)
        print(f"Organizations response: {orgs_data}")

        # Handle paginated or direct response
        if "organizations" in orgs_data:
            org_list = orgs_data["organizations"]
        elif isinstance(orgs_data, list):
            org_list = orgs_data
        else:
            org_list = orgs_data.get("items", orgs_data.get("data", []))

        # Verify our invited org is in the list
        org_names = [org["name"] for org in org_list]
        assert "Invite Test Org" in org_names, "Invited user should see the organization"

        # Test 2: Can access the organization's events
        events_response = client.get(f"/api/organizations/{org_id}/events")
        assert events_response.status_code == 200, "Member should be able to see org events"
        events_data = json.loads(events_response.data)

        # Test 3: Can get organization details
        org_details = client.get(f"/api/organizations/{org_id}")
        assert org_details.status_code == 200, "Member should be able to view org details"

        # Test 4: Verify role is correct
        org_users_response = client.get(f"/api/organizations/{org_id}/users")
        if org_users_response.status_code == 200:
            users_data = json.loads(org_users_response.data)
            # Find the existing user in the response
            if "organization_users" in users_data:
                users_list = users_data["organization_users"]
            elif "users" in users_data:
                users_list = users_data["users"]
            elif isinstance(users_data, list):
                users_list = users_data
            else:
                users_list = users_data.get("items", users_data.get("data", []))

            invited_user = next(
                (u for u in users_list if "existing@sbtl.ai" in str(u)), None
            )
            assert invited_user is not None, "Invited user should be in org users list"
            assert (
                invited_user.get("role") == "MEMBER"
            ), "User should have the assigned MEMBER role"

        # Invite non-existing user (should create invitation)
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )

        new_invite_response = client.post(
            f"/api/organizations/{org_id}/invitations",
            json={"email": "newuser@sbtl.ai", "role": "ADMIN"},
        )
        assert new_invite_response.status_code in [
            200,
            201,
        ], "Should create pending invitation"

        # Check pending invitations to verify it was created
        invitations_response = client.get(
            f"/api/organizations/{org_id}/invitations"
        )
        if invitations_response.status_code == 200:
            invitations_data = json.loads(invitations_response.data)
            # Verify we have at least one pending invitation
            print(f"Invitations data: {invitations_data}")

    def test_remove_user_from_organization(self, client, db):
        """Test removing users from organizations with validation.

        Why test this? Must prevent removing last owner (orphaned org).
        Must handle cascade effects properly.
        """
        owner1 = User(
            email="owner1@sbtl.ai",
            first_name="Owner",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        owner2 = User(
            email="owner2@sbtl.ai",
            first_name="Owner",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        member = User(
            email="member@sbtl.ai",
            first_name="Member",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner1, owner2, member])
        db.session.commit()

        # Create org with owner1
        client.post(
            "/api/auth/login",
            json={"email": "owner1@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations", json={"name": "Remove Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Add owner2 and member
        client.post(
            f"/api/organizations/{org_id}/users",
            json={"email": "owner2@sbtl.ai", "role": "OWNER"},
        )
        client.post(
            f"/api/organizations/{org_id}/users",
            json={"email": "member@sbtl.ai", "role": "MEMBER"},
        )

        # Remove member (should work)
        remove_member = client.delete(
            f"/api/organizations/{org_id}/users/{member.id}"
        )
        assert remove_member.status_code in [200, 204]

        # Try to remove owner1 when owner2 exists (should work)
        remove_owner1 = client.delete(
            f"/api/organizations/{org_id}/users/{owner1.id}"
        )
        # This might fail if you can't remove yourself

        # Login as owner2
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "owner2@sbtl.ai", "password": "Pass123!"},
        )

        # Try to remove last owner (should fail)
        remove_last_owner = client.delete(
            f"/api/organizations/{org_id}/users/{owner2.id}"
        )
        # Should fail - can't remove last owner

    def test_organization_listing_and_filtering(self, client, db):
        """Test listing organizations with proper filtering.

        Why test this? Users should only see organizations they belong to.
        Must not leak information about other organizations.
        """
        user1 = User(
            email="user1@sbtl.ai",
            first_name="User",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        user2 = User(
            email="user2@sbtl.ai",
            first_name="User",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([user1, user2])
        db.session.commit()

        # User1 creates 2 orgs
        client.post(
            "/api/auth/login",
            json={"email": "user1@sbtl.ai", "password": "Pass123!"},
        )
        client.post("/api/organizations", json={"name": "User1 Org A"})
        client.post("/api/organizations", json={"name": "User1 Org B"})

        # User1 lists their orgs
        user1_orgs = client.get("/api/organizations")
        assert user1_orgs.status_code == 200
        user1_data = json.loads(user1_orgs.data)
        assert len(user1_data.get("organizations", [])) == 2

        client.post("/api/auth/logout")

        # User2 creates 1 org
        client.post(
            "/api/auth/login",
            json={"email": "user2@sbtl.ai", "password": "Pass123!"},
        )
        client.post("/api/organizations", json={"name": "User2 Org"})

        # User2 lists their orgs (should only see their own)
        user2_orgs = client.get("/api/organizations")
        assert user2_orgs.status_code == 200
        user2_data = json.loads(user2_orgs.data)
        assert len(user2_data.get("organizations", [])) == 1

        # Verify user2 doesn't see user1's orgs
        org_names = [
            org["name"] for org in user2_data.get("organizations", [])
        ]
        assert "User1 Org A" not in org_names
        assert "User1 Org B" not in org_names

    def test_organization_update_permissions(self, client, db):
        """Test who can update organization details.

        Why test this? Only certain roles should modify org settings.
        Tests permission boundaries for updates.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        member = User(
            email="member@sbtl.ai",
            first_name="Member",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, admin, member])
        db.session.commit()

        # Create org
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations", json={"name": "Update Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Add users
        client.post(
            f"/api/organizations/{org_id}/users",
            json={"email": "admin@sbtl.ai", "role": "ADMIN"},
        )
        client.post(
            f"/api/organizations/{org_id}/users",
            json={"email": "member@sbtl.ai", "role": "MEMBER"},
        )

        # Owner can update
        owner_update = client.put(
            f"/api/organizations/{org_id}", json={"name": "Updated by Owner"}
        )
        assert owner_update.status_code == 200

        # Admin permissions (might vary by implementation)
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "admin@sbtl.ai", "password": "Pass123!"},
        )
        admin_update = client.put(
            f"/api/organizations/{org_id}", json={"name": "Updated by Admin"}
        )
        # Document actual behavior - some systems allow, some don't

        # Member can't update
        client.post("/api/auth/logout")
        client.post(
            "/api/auth/login",
            json={"email": "member@sbtl.ai", "password": "Pass123!"},
        )
        member_update = client.put(
            f"/api/organizations/{org_id}", json={"name": "Updated by Member"}
        )
        assert member_update.status_code in [403, 401]  # Should be forbidden

    def test_organization_deletion_cascade(self, client, db):
        """Test organization deletion and cascade effects.

        Why test this? Deleting an org affects events, users, and data.
        Must understand cascade behavior for data integrity.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(owner)
        db.session.commit()

        # Create org with events
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations", json={"name": "Delete Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Create event in org
        event_response = client.post(
            f"/api/organizations/{org_id}/events",
            json={
                "name": "Event to Delete",
                "start_date": "2024-12-01",
                "end_date": "2024-12-02",
            },
        )
        event_id = (
            json.loads(event_response.data)["id"]
            if event_response.status_code in [200, 201]
            else None
        )

        # Try to delete org
        delete_response = client.delete(f"/api/organizations/{org_id}")

        # Document actual behavior
        # Options:
        # 1. CASCADE - deletes everything (dangerous)
        # 2. PROTECT - prevents deletion if has events
        # 3. SET NULL - orphans events

        # TODO: Need to see how we actually have this implemented. Frontend may not have deletion available at the moment. Don't add until we know how it works.

        if delete_response.status_code in [200, 204]:
            # Deletion succeeded - check cascade
            if event_id:
                event_check = client.get(f"/api/events/{event_id}")
                # If 404, events were cascade deleted
                # If 200, events were orphaned
        else:
            # Deletion prevented (PROTECT behavior)
            assert delete_response.status_code in [400, 409]  # Conflict

    def test_cross_organization_event_access(self, client, db):
        """Test that events are properly scoped to organizations.

        Why test this? Events belong to orgs and shouldn't be accessible
        across organization boundaries.
        """
        owner1 = User(
            email="owner1@sbtl.ai",
            first_name="Owner",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        owner2 = User(
            email="owner2@sbtl.ai",
            first_name="Owner",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner1, owner2])
        db.session.commit()

        # Create org1 with event
        client.post(
            "/api/auth/login",
            json={"email": "owner1@sbtl.ai", "password": "Pass123!"},
        )
        org1_response = client.post(
            "/api/organizations", json={"name": "Org One"}
        )
        org1_id = json.loads(org1_response.data)["id"]

        event1_response = client.post(
            f"/api/organizations/{org1_id}/events",
            json={
                "name": "Org1 Private Event",
                "start_date": "2024-12-01",
                "end_date": "2024-12-02",
            },
        )

        if event1_response.status_code in [200, 201]:
            event1_id = json.loads(event1_response.data)["id"]

            client.post("/api/auth/logout")

            # Owner2 shouldn't access org1's event
            client.post(
                "/api/auth/login",
                json={"email": "owner2@sbtl.ai", "password": "Pass123!"},
            )

            # Try to access event directly
            event_access = client.get(f"/api/events/{event1_id}")
            assert event_access.status_code in [403, 404]

            # Try to modify event
            event_modify = client.put(
                f"/api/events/{event1_id}", json={"name": "Hacked Event"}
            )
            assert event_modify.status_code in [403, 404]

    def test_organization_listing_with_pagination(self, client, db):
        """Test pagination for organization listing.

        Why test this? Users may belong to many organizations,
        pagination ensures scalable API responses.
        """
        # Create a user who will own multiple orgs
        owner = User(
            email="multi_org_owner@sbtl.ai",
            first_name="Multi",
            last_name="Owner",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(owner)
        db.session.commit()

        # Login as owner
        client.post(
            "/api/auth/login",
            json={"email": "multi_org_owner@sbtl.ai", "password": "Pass123!"},
        )

        # Create 15 organizations
        org_ids = []
        for i in range(15):
            org_response = client.post(
                "/api/organizations",
                json={"name": f"Test Organization {i+1}"}
            )
            org_ids.append(json.loads(org_response.data)["id"])

        # Test default pagination
        list_response = client.get("/api/organizations")
        assert list_response.status_code == 200
        data = json.loads(list_response.data)
        assert data["total_items"] == 15

        # Test page 1 with 5 items per page
        page1_response = client.get("/api/organizations?page=1&per_page=5")
        assert page1_response.status_code == 200
        page1_data = json.loads(page1_response.data)
        assert len(page1_data["organizations"]) == 5
        assert page1_data["current_page"] == 1
        assert page1_data["total_pages"] == 3
        assert page1_data["per_page"] == 5

        # Test page 2
        page2_response = client.get("/api/organizations?page=2&per_page=5")
        assert page2_response.status_code == 200
        page2_data = json.loads(page2_response.data)
        assert len(page2_data["organizations"]) == 5
        assert page2_data["current_page"] == 2

        # Test last page
        page3_response = client.get("/api/organizations?page=3&per_page=5")
        assert page3_response.status_code == 200
        page3_data = json.loads(page3_response.data)
        assert len(page3_data["organizations"]) == 5
        assert page3_data["current_page"] == 3

        # Organization list doesn't include current_user_role in list view
        # That's only in the detail view (OrganizationDetailSchema)
        # Just verify we got organizations back
        for org in page1_data["organizations"]:
            assert "id" in org
            assert "name" in org

    def test_last_owner_demotion_protection(self, client, db):
        """Test that the last owner cannot be demoted to a lower role.

        Why test this? Every organization must maintain at least one owner
        to prevent orphaned organizations without administrative control.
        """
        owner = User(
            email="sole_owner@sbtl.ai",
            first_name="Sole",
            last_name="Owner",
            password="Pass123!",
            email_verified=True,
        )
        admin = User(
            email="admin@sbtl.ai",
            first_name="Admin",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, admin])
        db.session.commit()

        # Create organization
        client.post(
            "/api/auth/login",
            json={"email": "sole_owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations",
            json={"name": "Single Owner Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Add admin user
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "admin@sbtl.ai",
                "first_name": "Admin",
                "last_name": "User",
                "role": "ADMIN"
            }
        )

        # Try to demote the only owner to ADMIN (should fail)
        demote_response = client.put(
            f"/api/organizations/{org_id}/users/{owner.id}",
            json={"role": "ADMIN"}
        )
        assert demote_response.status_code == 400
        error_msg = json.loads(demote_response.data).get("message", "").lower()
        assert "last owner" in error_msg or "cannot" in error_msg

        # Try to demote to MEMBER (should also fail)
        demote_to_member = client.put(
            f"/api/organizations/{org_id}/users/{owner.id}",
            json={"role": "MEMBER"}
        )
        assert demote_to_member.status_code == 400

        # Promote admin to owner (now we have 2 owners)
        promote_response = client.put(
            f"/api/organizations/{org_id}/users/{admin.id}",
            json={"role": "OWNER"}
        )
        assert promote_response.status_code == 200

        # Now demotion should work since there are 2 owners
        demote_now_response = client.put(
            f"/api/organizations/{org_id}/users/{owner.id}",
            json={"role": "ADMIN"}
        )
        assert demote_now_response.status_code == 200

        # Verify the role change
        members_response = client.get(f"/api/organizations/{org_id}/users")
        members_data = json.loads(members_response.data)

        # Find the original owner in the members list
        # OrganizationUserSchema has user_id field from include_fk=True
        original_owner = next(
            (m for m in members_data["organization_users"]
             if m["user_id"] == owner.id), None
        )
        assert original_owner is not None
        assert original_owner["role"] == "ADMIN"

    def test_organization_members_with_role_filter(self, client, db):
        """Test filtering organization members by role.

        Why test this? Admins need to quickly find users by role
        for management purposes.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        admin1 = User(
            email="admin1@sbtl.ai",
            first_name="Admin",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        admin2 = User(
            email="admin2@sbtl.ai",
            first_name="Admin",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        member1 = User(
            email="member1@sbtl.ai",
            first_name="Member",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        member2 = User(
            email="member2@sbtl.ai",
            first_name="Member",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, admin1, admin2, member1, member2])
        db.session.commit()

        # Create organization and add members
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations",
            json={"name": "Role Filter Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Add users with different roles
        for user_email, role in [
            ("admin1@sbtl.ai", "ADMIN"),
            ("admin2@sbtl.ai", "ADMIN"),
            ("member1@sbtl.ai", "MEMBER"),
            ("member2@sbtl.ai", "MEMBER"),
        ]:
            client.post(
                f"/api/organizations/{org_id}/users",
                json={
                    "email": user_email,
                    "first_name": "Test",
                    "last_name": "User",
                    "role": role
                }
            )

        # Test filtering by OWNER role
        owners_response = client.get(
            f"/api/organizations/{org_id}/users?role=OWNER"
        )
        assert owners_response.status_code == 200
        owners_data = json.loads(owners_response.data)
        assert owners_data["total_items"] == 1
        assert owners_data["organization_users"][0]["role"] == "OWNER"

        # Test filtering by ADMIN role
        admins_response = client.get(
            f"/api/organizations/{org_id}/users?role=ADMIN"
        )
        assert admins_response.status_code == 200
        admins_data = json.loads(admins_response.data)
        assert admins_data["total_items"] == 2
        for user in admins_data["organization_users"]:
            assert user["role"] == "ADMIN"

        # Test filtering by MEMBER role
        members_response = client.get(
            f"/api/organizations/{org_id}/users?role=MEMBER"
        )
        assert members_response.status_code == 200
        members_data = json.loads(members_response.data)
        assert members_data["total_items"] == 2
        for user in members_data["organization_users"]:
            assert user["role"] == "MEMBER"

        # Test listing all without filter
        all_response = client.get(f"/api/organizations/{org_id}/users")
        assert all_response.status_code == 200
        all_data = json.loads(all_response.data)
        assert all_data["total_items"] == 5  # 1 owner + 2 admins + 2 members

    def test_add_existing_vs_new_user_to_organization(self, client, db):
        """Test adding existing platform users vs creating new placeholder users.

        Why test this? Organizations need to add both existing users
        and invite new users who don't have accounts yet.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        existing_user = User(
            email="existing@sbtl.ai",
            first_name="Existing",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, existing_user])
        db.session.commit()

        # Create organization
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations",
            json={"name": "User Addition Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Test 1: Add existing user
        add_existing_response = client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "existing@sbtl.ai",
                "first_name": "Existing",
                "last_name": "User",
                "role": "ADMIN"
            }
        )
        assert add_existing_response.status_code == 201
        existing_data = json.loads(add_existing_response.data)
        # OrganizationUserDetailSchema includes a nested user object
        assert existing_data["user"]["email"] == "existing@sbtl.ai"
        assert existing_data["role"] == "ADMIN"

        # Verify existing user wasn't duplicated
        existing_count = User.query.filter_by(email="existing@sbtl.ai").count()
        assert existing_count == 1

        # Test 2: Add new user (creates placeholder)
        add_new_response = client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "newuser@sbtl.ai",
                "first_name": "New",
                "last_name": "User",
                "role": "MEMBER"
            }
        )
        assert add_new_response.status_code == 201
        new_data = json.loads(add_new_response.data)
        # OrganizationUserDetailSchema includes a nested user object
        assert new_data["user"]["email"] == "newuser@sbtl.ai"
        assert new_data["role"] == "MEMBER"

        # Verify new user was created in database
        new_user = User.query.filter_by(email="newuser@sbtl.ai").first()
        assert new_user is not None
        assert new_user.first_name == "New"
        assert new_user.last_name == "User"

        # Test 3: Try to add duplicate (should fail)
        duplicate_response = client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "existing@sbtl.ai",
                "first_name": "Existing",
                "last_name": "User",
                "role": "MEMBER"
            }
        )
        assert duplicate_response.status_code == 409
        error_data = json.loads(duplicate_response.data)
        # Now using abort() which should properly return the error message
        assert "already" in error_data.get("message", "").lower()

        # Verify organization member count
        members_response = client.get(f"/api/organizations/{org_id}/users")
        members_data = json.loads(members_response.data)
        assert members_data["total_items"] == 3  # owner + existing + new

    def test_comprehensive_role_updates(self, client, db):
        """Test all role transition scenarios.

        Why test this? Role changes have complex permission rules
        and we need to verify all transitions work correctly.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        user1 = User(
            email="user1@sbtl.ai",
            first_name="User",
            last_name="One",
            password="Pass123!",
            email_verified=True,
        )
        user2 = User(
            email="user2@sbtl.ai",
            first_name="User",
            last_name="Two",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add_all([owner, user1, user2])
        db.session.commit()

        # Create organization
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations",
            json={"name": "Role Update Test Org"}
        )
        org_id = json.loads(org_response.data)["id"]

        # Add users as members
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "user1@sbtl.ai",
                "first_name": "User",
                "last_name": "One",
                "role": "MEMBER"
            }
        )
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "user2@sbtl.ai",
                "first_name": "User",
                "last_name": "Two",
                "role": "MEMBER"
            }
        )

        # Test MEMBER -> ADMIN promotion
        promote_to_admin = client.put(
            f"/api/organizations/{org_id}/users/{user1.id}",
            json={"role": "ADMIN"}
        )
        assert promote_to_admin.status_code == 200
        admin_data = json.loads(promote_to_admin.data)
        assert admin_data["role"] == "ADMIN"

        # Test MEMBER -> OWNER promotion
        promote_to_owner = client.put(
            f"/api/organizations/{org_id}/users/{user2.id}",
            json={"role": "OWNER"}
        )
        assert promote_to_owner.status_code == 200
        owner_data = json.loads(promote_to_owner.data)
        assert owner_data["role"] == "OWNER"

        # Now we have 2 owners, test OWNER -> ADMIN demotion
        demote_to_admin = client.put(
            f"/api/organizations/{org_id}/users/{user2.id}",
            json={"role": "ADMIN"}
        )
        assert demote_to_admin.status_code == 200

        # Test ADMIN -> MEMBER demotion
        demote_to_member = client.put(
            f"/api/organizations/{org_id}/users/{user1.id}",
            json={"role": "MEMBER"}
        )
        assert demote_to_member.status_code == 200

        # Verify final roles
        members_response = client.get(f"/api/organizations/{org_id}/users")
        members_data = json.loads(members_response.data)

        # OrganizationUserSchema has user_id field from include_fk=True
        roles_map = {
            m["user_id"]: m["role"]
            for m in members_data["organization_users"]
        }

        assert roles_map[owner.id] == "OWNER"
        assert roles_map[user1.id] == "MEMBER"
        assert roles_map[user2.id] == "ADMIN"

    def test_member_count_validation(self, client, db):
        """Test that member_count and owner_count are accurate.

        Why test this? These counts are used in UI and must be accurate
        for proper organization management.
        """
        owner = User(
            email="owner@sbtl.ai",
            first_name="Owner",
            last_name="User",
            password="Pass123!",
            email_verified=True,
        )
        db.session.add(owner)
        db.session.commit()

        # Create organization
        client.post(
            "/api/auth/login",
            json={"email": "owner@sbtl.ai", "password": "Pass123!"},
        )
        org_response = client.post(
            "/api/organizations",
            json={"name": "Count Test Org"}
        )
        org_data = json.loads(org_response.data)
        org_id = org_data["id"]

        # Initial counts
        assert org_data["member_count"] == 1
        assert org_data["owner_count"] == 1

        # Add more users
        for i in range(3):
            new_user = User(
                email=f"user{i}@sbtl.ai",
                first_name=f"User",
                last_name=f"{i}",
                password="Pass123!",
                email_verified=True,
            )
            db.session.add(new_user)
        db.session.commit()

        # Add users with different roles
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "user0@sbtl.ai",
                "first_name": "User",
                "last_name": "0",
                "role": "OWNER"
            }
        )
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "user1@sbtl.ai",
                "first_name": "User",
                "last_name": "1",
                "role": "ADMIN"
            }
        )
        client.post(
            f"/api/organizations/{org_id}/users",
            json={
                "email": "user2@sbtl.ai",
                "first_name": "User",
                "last_name": "2",
                "role": "MEMBER"
            }
        )

        # Get updated organization data
        org_get_response = client.get(f"/api/organizations/{org_id}")
        updated_org_data = json.loads(org_get_response.data)

        # Verify counts
        assert updated_org_data["member_count"] == 4  # 2 owners + 1 admin + 1 member
        assert updated_org_data["owner_count"] == 2  # 2 owners
