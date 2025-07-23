# Example: How to integrate email service into your existing services
# This shows the pattern - you would add these methods to your existing EventUserService

from api.extensions import db
from api.models import Event, User, EventUser, EventInvitation  # EventInvitation to be created
from api.models.enums import EventUserRole, InvitationStatus  # InvitationStatus to be created
from api.services.email import email_service
from flask_jwt_extended import get_jwt_identity
import secrets
import string
from datetime import datetime, timedelta


class EventUserServiceWithEmail:
    """Example showing email integration patterns"""
    
    @staticmethod
    def invite_user_to_event(event_id: int, email: str, role: EventUserRole) -> EventInvitation:
        """
        Send invitation to join event
        This method demonstrates the email integration pattern
        """
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
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # Send email using our service
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
    def bulk_invite_users(event_id: int, invitations: list) -> dict:
        """
        Bulk invite multiple users
        Shows pattern for batch operations
        """
        event = Event.query.get_or_404(event_id)
        inviter_id = get_jwt_identity()
        inviter = User.query.get(inviter_id)
        
        results = {
            'successful': [],
            'failed': []
        }
        
        for invite_data in invitations:
            try:
                invitation = EventUserServiceWithEmail.invite_user_to_event(
                    event_id=event_id,
                    email=invite_data['email'],
                    role=invite_data['role']
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
    def promote_attendee_to_speaker(event_id: int, user_id: int, speaker_info: dict) -> EventUser:
        """
        Promote attendee to speaker and optionally notify them
        Shows pattern for role changes with notifications
        """
        event_user = EventUser.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first_or_404()
        
        if event_user.role != EventUserRole.ATTENDEE:
            raise ValueError("User must be an attendee to be promoted to speaker")
        
        # Update role and info
        event_user.role = EventUserRole.SPEAKER
        event_user.speaker_bio = speaker_info.get('bio', event_user.user.bio)
        event_user.speaker_title = speaker_info.get('title', event_user.user.title)
        
        db.session.commit()
        
        # Send notification email if requested
        if speaker_info.get('notify_user', True):
            # You would create a speaker_promotion.html template
            email_service.backend.send(
                to=event_user.user.email,
                subject=f"You're now a speaker at {event_user.event.title}!",
                template_name='speaker_promotion.html',
                context={
                    'user_name': event_user.user.first_name,
                    'event_title': event_user.event.title,
                    'event_url': f"{current_app.config['FRONTEND_URL']}/events/{event_user.event.slug}"
                }
            )
        
        return event_user
    
    @staticmethod
    def accept_invitation(token: str, user_id: int = None) -> EventUser:
        """
        Accept event invitation
        Shows pattern for token-based operations
        """
        invitation = EventInvitation.query.filter_by(
            token=token,
            status=InvitationStatus.PENDING
        ).first_or_404()
        
        # Check expiration
        if invitation.expires_at < datetime.utcnow():
            invitation.status = InvitationStatus.EXPIRED
            db.session.commit()
            raise ValueError("Invitation has expired")
        
        # If user_id provided, verify it matches the invitation
        if user_id:
            user = User.query.get(user_id)
            if user.email != invitation.email:
                raise ValueError("This invitation is for a different email address")
        else:
            # Get user by email
            user = User.query.filter_by(email=invitation.email).first_or_404()
        
        # Add user to event
        event = Event.query.get(invitation.event_id)
        event_user = event.add_user(user, invitation.role)
        
        # Update invitation status
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.utcnow()
        invitation.user_id = user.id
        
        db.session.commit()
        
        # Send confirmation email (optional)
        email_service.backend.send(
            to=user.email,
            subject=f"Welcome to {event.title}!",
            template_name='invitation_accepted.html',
            context={
                'user_name': user.first_name,
                'event_title': event.title,
                'role': invitation.role.value,
                'event_url': f"{current_app.config['FRONTEND_URL']}/events/{event.slug}"
            }
        )
        
        return event_user


# Example models you'll need to create:

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    DECLINED = "declined"


class EventInvitation(db.Model):
    """Model for tracking event invitations"""
    __tablename__ = "event_invitations"
    
    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(db.BigInteger, db.ForeignKey('events.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(EventUserRole), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    status = db.Column(db.Enum(InvitationStatus), default=InvitationStatus.PENDING)
    invited_by_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    # Relationships
    event = db.relationship('Event', backref='invitations')
    invited_by = db.relationship('User', foreign_keys=[invited_by_id])
    user = db.relationship('User', foreign_keys=[user_id])