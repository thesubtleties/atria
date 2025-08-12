# api/services/invitation.py
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy.orm import joinedload

from api.extensions import db
from api.models import (
    User, 
    Organization, 
    Event,
    EventInvitation, 
    OrganizationInvitation,
    OrganizationUser,
    EventUser
)
from api.models.enums import (
    InvitationStatus, 
    EventUserRole, 
    OrganizationUserRole
)
from api.services.dashboard import DashboardService


class InvitationService:
    @staticmethod
    def get_invitation_details_by_token(token):
        """Get invitation details by token (either org or event invitation)
        
        Tokens can optionally have prefixes:
        - org_ for organization invitations
        - evt_ for event invitations
        - No prefix: try both (backward compatibility)
        """
        # Check for prefix to optimize lookup
        if token.startswith('org_'):
            actual_token = token[4:]  # Remove 'org_' prefix
            org_invitation = OrganizationInvitation.query.filter_by(token=actual_token).first()
            if org_invitation:
                # Check if expired
                if org_invitation.status == InvitationStatus.PENDING:
                    if org_invitation.expires_at < datetime.now(timezone.utc):
                        org_invitation.status = InvitationStatus.EXPIRED
                        db.session.commit()
                
                return {
                    'type': 'organization',
                    'invitation': org_invitation,
                    'email': org_invitation.email,
                    'organization_id': org_invitation.organization_id
                }
        elif token.startswith('evt_'):
            actual_token = token[4:]  # Remove 'evt_' prefix
            event_invitation = EventInvitation.query.filter_by(token=actual_token).first()
            if event_invitation:
                # Check if expired
                if event_invitation.status == InvitationStatus.PENDING:
                    if event_invitation.expires_at < datetime.now(timezone.utc):
                        event_invitation.status = InvitationStatus.EXPIRED
                        db.session.commit()
                
                return {
                    'type': 'event',
                    'invitation': event_invitation,
                    'email': event_invitation.email,
                    'event_id': event_invitation.event_id
                }
        else:
            # No prefix - try both for backward compatibility
            # Try organization invitation first
            org_invitation = OrganizationInvitation.query.filter_by(token=token).first()
            if org_invitation:
                # Check if expired
                if org_invitation.status == InvitationStatus.PENDING:
                    if org_invitation.expires_at < datetime.now(timezone.utc):
                        org_invitation.status = InvitationStatus.EXPIRED
                        db.session.commit()
                
                return {
                    'type': 'organization',
                    'invitation': org_invitation,
                    'email': org_invitation.email,
                    'organization_id': org_invitation.organization_id
                }
            
            # Try event invitation
            event_invitation = EventInvitation.query.filter_by(token=token).first()
            if event_invitation:
                # Check if expired
                if event_invitation.status == InvitationStatus.PENDING:
                    if event_invitation.expires_at < datetime.now(timezone.utc):
                        event_invitation.status = InvitationStatus.EXPIRED
                        db.session.commit()
                
                return {
                    'type': 'event',
                    'invitation': event_invitation,
                    'email': event_invitation.email,
                    'event_id': event_invitation.event_id
                }
        
        return None
    
    @staticmethod
    def check_user_exists(email):
        """Check if user exists with given email"""
        return User.query.filter_by(email=email).first() is not None
    
    @staticmethod
    def get_all_invitations_for_email(email):
        """Get all pending invitations for an email address"""
        # Get organization invitations
        org_invitations = OrganizationInvitation.query.filter_by(
            email=email,
            status=InvitationStatus.PENDING
        ).options(
            joinedload(OrganizationInvitation.organization),
            joinedload(OrganizationInvitation.invited_by)
        ).all()
        
        # Get event invitations
        event_invitations = EventInvitation.query.filter_by(
            email=email,
            status=InvitationStatus.PENDING
        ).options(
            joinedload(EventInvitation.event).joinedload(Event.organization),
            joinedload(EventInvitation.invited_by)
        ).all()
        
        return {
            'organization_invitations': org_invitations,
            'event_invitations': event_invitations
        }
    
    @staticmethod
    def register_and_accept_invitations(user_data, org_invitation_ids, event_invitation_ids):
        """
        Register a new user and accept selected invitations.
        Process org invitations first, then event invitations with role adjustments.
        """
        email = user_data['email']
        
        # Verify user doesn't exist
        if InvitationService.check_user_exists(email):
            raise ValueError("User already exists with this email")
        
        # Create user with email already verified
        user = User(
            email=email,
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            email_verified=True  # Skip verification for invited users
        )
        user.password = user_data['password']  # Uses the property setter which hashes the password
        db.session.add(user)
        db.session.flush()  # Get user ID without committing
        
        # Track accepted organization IDs for role adjustment
        accepted_org_ids = []
        
        # Process organization invitations first
        for inv_id in org_invitation_ids:
            invitation = OrganizationInvitation.query.get(inv_id)
            if not invitation or invitation.email != email:
                continue
            
            if invitation.status != InvitationStatus.PENDING:
                continue
            
            # Check if not expired
            if invitation.expires_at < datetime.now(timezone.utc):
                invitation.status = InvitationStatus.EXPIRED
                continue
            
            # Add user to organization
            organization = Organization.query.get(invitation.organization_id)
            if organization and not organization.has_user(user):
                organization.add_user(user, invitation.role)
                accepted_org_ids.append(invitation.organization_id)
            
            # Update invitation status
            invitation.status = InvitationStatus.ACCEPTED
            invitation.user_id = user.id
            invitation.accepted_at = datetime.now(timezone.utc)
        
        # Process event invitations with role adjustments
        for inv_id in event_invitation_ids:
            invitation = EventInvitation.query.get(inv_id)
            if not invitation or invitation.email != email:
                continue
            
            if invitation.status != InvitationStatus.PENDING:
                continue
            
            # Check if not expired
            if invitation.expires_at < datetime.now(timezone.utc):
                invitation.status = InvitationStatus.EXPIRED
                continue
            
            event = Event.query.get(invitation.event_id)
            if not event:
                continue
            
            # Adjust role if user didn't accept org invitation
            role = invitation.role
            if event.organization_id not in accepted_org_ids:
                # Downgrade high-privilege roles to attendee
                if role in [EventUserRole.ADMIN, EventUserRole.ORGANIZER]:
                    role = EventUserRole.ATTENDEE
            
            # Add user to event
            if not event.has_user(user):
                event.add_user(user, role)
            
            # Update invitation status
            invitation.status = InvitationStatus.ACCEPTED
            invitation.user_id = user.id
            invitation.accepted_at = datetime.now(timezone.utc)
        
        # Commit all changes
        db.session.commit()
        
        # Generate JWT tokens for auto-login
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return {
            'user': user,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'accepted_org_count': len(accepted_org_ids),
            'accepted_event_count': len([i for i in event_invitation_ids if EventInvitation.query.get(i) and EventInvitation.query.get(i).status == InvitationStatus.ACCEPTED])
        }