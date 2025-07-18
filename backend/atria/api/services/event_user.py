from api.extensions import db
from api.models import Event, User, EventUser, Session, SessionSpeaker, EventInvitation
from api.models.enums import EventUserRole, InvitationStatus
from api.commons.pagination import paginate
from api.services.email import email_service
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta, timezone
import secrets
import string


class EventUserService:
    @staticmethod
    def add_or_create_user(event_id, data):
        """Add or create user and add to event"""
        # Check if user exists
        user = User.query.filter_by(email=data["email"]).first()

        if not user:
            # Create new user if they don't exist
            user = User(
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                password=data.get("password", "changeme"),
            )
            db.session.add(user)
            db.session.flush()  # Get user ID without committing

        event = Event.query.get_or_404(event_id)

        if event.has_user(user):
            raise ValueError("User already in event")

        event.add_user(
            user,
            data["role"],
        )

        db.session.commit()

        return EventUser.query.filter_by(
            event_id=event_id, user_id=user.id
        ).first()

    @staticmethod
    def get_event_users(event_id, role=None, schema=None):
        """Get list of event users with optional role filter"""
        query = EventUser.query.filter_by(event_id=event_id)

        if role:
            query = query.filter_by(role=role)

        return paginate(query, schema, collection_name="event_users")

    @staticmethod
    def add_user_to_event(event_id, data):
        """Add existing user to event"""
        new_user = User.query.get_or_404(data["user_id"])
        event = Event.query.get_or_404(event_id)

        if event.has_user(new_user):
            raise ValueError("User already in event")

        event.add_user(
            new_user,
            data["role"],
            speaker_bio=data.get("speaker_bio"),
            speaker_title=data.get("speaker_title"),
        )
        db.session.commit()

        return EventUser.query.filter_by(
            event_id=event_id, user_id=new_user.id
        ).first()

    @staticmethod
    def update_user_role(event_id, user_id, update_data):
        """Update user's role or info in event"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        if "role" in update_data:
            event_user.role = update_data["role"]

        if event_user.role == EventUserRole.SPEAKER:
            if "speaker_bio" in update_data:
                event_user.speaker_bio = update_data["speaker_bio"]
            if "speaker_title" in update_data:
                event_user.speaker_title = update_data["speaker_title"]

        db.session.commit()
        return event_user

    @staticmethod
    def remove_user_from_event(event_id, user_id):
        """Remove user from event"""
        event = Event.query.get_or_404(event_id)
        target_user = User.query.get_or_404(user_id)
        target_role = event.get_user_role(target_user)

        if (
            target_role == EventUserRole.ADMIN
            and len(
                [
                    eu
                    for eu in event.event_users
                    if eu.role == EventUserRole.ADMIN
                ]
            )
            <= 1
        ):
            raise ValueError("Cannot remove last admin")

        # Remove from sessions using subquery
        session_ids = Session.query.filter_by(event_id=event_id).with_entities(
            Session.id
        )
        SessionSpeaker.query.filter(
            SessionSpeaker.session_id.in_(session_ids),
            SessionSpeaker.user_id == user_id,
        ).delete(synchronize_session=False)

        # Then remove from event
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first_or_404()

        db.session.delete(event_user)
        db.session.commit()

        return {"message": "User removed from event"}

    @staticmethod
    def update_speaker_info(event_id, user_id, speaker_data):
        """Update speaker information"""
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id, role=EventUserRole.SPEAKER
        ).first_or_404()

        event_user.update_speaker_info(**speaker_data)
        db.session.commit()

        return event_user

    @staticmethod
    def invite_user_to_event(event_id, email, role, message=None):
        """Send invitation to join event"""
        event = Event.query.get_or_404(event_id)
        inviter_id = get_jwt_identity()
        inviter = User.query.get(inviter_id)
        
        # Check if user already in event
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and event.has_user(existing_user):
            raise ValueError("User already in event")
        
        # Check for pending invitation
        existing_invite = EventInvitation.query.filter_by(
            event_id=event_id,
            email=email,
            status=InvitationStatus.PENDING
        ).first()
        
        if existing_invite:
            raise ValueError("Invitation already sent to this email")
        
        # Generate secure invitation token
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        
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
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
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
            has_account=existing_user is not None
        )
        
        return invitation
    
    @staticmethod
    def bulk_invite_users(event_id, invitations):
        """Bulk invite multiple users"""
        results = {
            'successful': [],
            'failed': []
        }
        
        for invite_data in invitations:
            try:
                invitation = EventUserService.invite_user_to_event(
                    event_id=event_id,
                    email=invite_data['email'],
                    role=invite_data['role'],
                    message=invite_data.get('message')
                )
                results['successful'].append({
                    'email': invite_data['email'],
                    'invitation_id': invitation.id
                })
            except Exception as e:
                results['failed'].append({
                    'email': invite_data['email'],
                    'error': str(e)
                })
        
        return results
    
    @staticmethod
    def accept_invitation(token):
        """Accept event invitation"""
        invitation = EventInvitation.query.filter_by(
            token=token,
            status=InvitationStatus.PENDING
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
    def get_pending_invitations(event_id):
        """Get all pending invitations for an event"""
        return EventInvitation.query.filter_by(
            event_id=event_id,
            status=InvitationStatus.PENDING
        ).all()
    
    @staticmethod
    def cancel_invitation(invitation_id):
        """Cancel a pending invitation"""
        invitation = EventInvitation.query.get_or_404(invitation_id)
        
        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("Can only cancel pending invitations")
        
        invitation.status = InvitationStatus.CANCELLED
        db.session.commit()
        
        return invitation
