# api/services/event_invitation.py
from api.extensions import db
from api.models import Event, User, EventInvitation
from api.models.enums import EventUserRole, InvitationStatus
from api.services.email import email_service
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta, timezone
import secrets
import string


class EventInvitationService:
    @staticmethod
    def invite_user_to_event(event_id, email, role, message=None):
        """Send invitation to join event"""
        from api.models import EventUser, Organization
        from api.models.enums import OrganizationUserRole
        
        event = Event.query.get_or_404(event_id)
        inviter_id = get_jwt_identity()
        inviter = User.query.get(inviter_id)
        
        # Get inviter's role in the event
        inviter_event_role = event.get_user_role(inviter)
        
        # Check if inviter is org owner
        org = Organization.query.get(event.organization_id)
        is_org_owner = org.get_user_role(inviter) == OrganizationUserRole.OWNER
        
        # Validate role assignment based on inviter's permissions
        if not is_org_owner:  # Org owners can invite anyone
            if inviter_event_role == EventUserRole.ORGANIZER:
                # Organizers can only invite ATTENDEE and SPEAKER
                if role not in [EventUserRole.ATTENDEE, EventUserRole.SPEAKER]:
                    raise ValueError("Organizers can only invite attendees and speakers")
            elif inviter_event_role != EventUserRole.ADMIN:
                # Only admins, organizers, and org owners can send invitations
                raise ValueError("You don't have permission to send invitations")

        # Check if user already in event
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and event.has_user(existing_user):
            raise ValueError("User already in event")

        # Check for pending invitation
        existing_invite = EventInvitation.query.filter_by(
            event_id=event_id, email=email, status=InvitationStatus.PENDING
        ).first()

        if existing_invite:
            raise ValueError("Invitation already sent to this email")

        # Generate secure invitation token
        token = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
        )

        # Create invitation record
        invitation = EventInvitation(
            event_id=event_id,
            email=email,
            role=role,
            token=token,
            status=InvitationStatus.PENDING,
            invited_by_id=inviter_id,
            user_id=existing_user.id if existing_user else None,
            message=message,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )

        db.session.add(invitation)
        db.session.commit()

        # Send email
        email_service.send_event_invitation(
            email=email,
            event=event,
            role=role.value,
            invitation_token=token,
            inviter=inviter,
            has_account=existing_user is not None,
        )

        return invitation

    @staticmethod
    def bulk_invite_users(event_id, invitations):
        """Bulk invite multiple users"""
        results = {"successful": [], "failed": []}

        for invite_data in invitations:
            try:
                invitation = EventInvitationService.invite_user_to_event(
                    event_id=event_id,
                    email=invite_data["email"],
                    role=invite_data["role"],
                    message=invite_data.get("message"),
                )
                results["successful"].append(
                    {"email": invite_data["email"], "invitation_id": invitation.id}
                )
            except Exception as e:
                results["failed"].append(
                    {"email": invite_data["email"], "error": str(e)}
                )

        return results

    @staticmethod
    def accept_invitation(token):
        """Accept event invitation"""
        invitation = EventInvitation.query.filter_by(
            token=token, status=InvitationStatus.PENDING
        ).first_or_404()

        # Check expiration
        if invitation.expires_at < datetime.now(timezone.utc):
            invitation.status = InvitationStatus.EXPIRED
            db.session.commit()
            raise ValueError("Invitation has expired")

        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Verify email matches
        if user.email != invitation.email:
            raise ValueError("This invitation is for a different email address")

        # Add user to event
        event = Event.query.get(invitation.event_id)
        if event.has_user(user):
            # User already in event, just update invitation
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = datetime.now(timezone.utc)
            invitation.user_id = user.id
            db.session.commit()
            raise ValueError("You are already a member of this event")

        # Add user with the invited role
        event_user = event.add_user(user, invitation.role)

        # Update invitation status
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.now(timezone.utc)
        invitation.user_id = user.id

        db.session.commit()

        return event_user

    @staticmethod
    def decline_invitation(token):
        """Decline event invitation"""
        invitation = EventInvitation.query.filter_by(
            token=token, status=InvitationStatus.PENDING
        ).first_or_404()

        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Verify email matches
        if user.email != invitation.email:
            raise ValueError("This invitation is for a different email address")

        # Update invitation
        invitation.status = InvitationStatus.DECLINED
        invitation.declined_at = datetime.now(timezone.utc)

        db.session.commit()

        return invitation

    @staticmethod
    def get_pending_invitations_query(event_id):
        """Get query for pending invitations for an event"""
        return EventInvitation.query.filter_by(
            event_id=event_id, status=InvitationStatus.PENDING
        ).order_by(EventInvitation.created_at.desc())

    @staticmethod
    def cancel_invitation(invitation_id):
        """Cancel a pending invitation"""
        invitation = EventInvitation.query.get_or_404(invitation_id)

        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("Can only cancel pending invitations")

        # Check authorization - user must be admin/organizer of the event
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        event = Event.query.get_or_404(invitation.event_id)
        user_role = event.get_user_role(current_user)

        if user_role not in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
            raise ValueError("Must be admin or organizer to cancel invitations")

        invitation.status = InvitationStatus.CANCELLED
        db.session.commit()

        return invitation

    @staticmethod
    def get_invitation_by_token(token):
        """Get invitation by token for public view"""
        invitation = EventInvitation.query.filter_by(token=token).first_or_404()

        # Check if expired
        if invitation.status == InvitationStatus.PENDING:
            if invitation.expires_at < datetime.now(timezone.utc):
                invitation.status = InvitationStatus.EXPIRED
                db.session.commit()

        return invitation

    @staticmethod
    def get_user_pending_invitations_query(email):
        """Get query for pending invitations for a user by email"""
        return EventInvitation.query.filter_by(
            email=email, status=InvitationStatus.PENDING
        ).order_by(EventInvitation.created_at.desc())

    @staticmethod
    def get_user_pending_invitations(user_id):
        """Get pending invitations for a user"""
        user = User.query.get_or_404(user_id)
        return EventInvitation.query.filter_by(
            email=user.email, status=InvitationStatus.PENDING
        ).order_by(EventInvitation.created_at.desc()).all()
