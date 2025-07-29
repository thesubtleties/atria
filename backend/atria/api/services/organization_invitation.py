# api/services/organization_invitation.py
from api.extensions import db
from api.models import Organization, User, OrganizationUser, OrganizationInvitation
from api.models.enums import OrganizationUserRole, InvitationStatus
from api.commons.pagination import paginate
from api.services.email import email_service
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta, timezone
import secrets
import string


class OrganizationInvitationService:
    @staticmethod
    def invite_user_to_organization(org_id, email, role, message=None):
        """Send invitation to join organization"""
        organization = Organization.query.get_or_404(org_id)
        inviter_id = get_jwt_identity()
        inviter = User.query.get(inviter_id)
        
        # Check if user already in organization
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and organization.has_user(existing_user):
            raise ValueError("User already in organization")
        
        # Check for pending invitation
        existing_invite = OrganizationInvitation.query.filter_by(
            organization_id=org_id,
            email=email,
            status=InvitationStatus.PENDING
        ).first()
        
        if existing_invite:
            raise ValueError("Invitation already sent to this email")
        
        # Generate token
        token = secrets.token_urlsafe(32)
        
        # Create invitation
        invitation = OrganizationInvitation(
            organization_id=org_id,
            email=email,
            role=role,
            token=token,
            status=InvitationStatus.PENDING,
            message=message,
            invited_by_id=inviter_id,
            user_id=existing_user.id if existing_user else None,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # Send email
        email_service.send_organization_invitation(
            email=email,
            organization=organization,
            role=role.value,
            invitation_token=token,
            inviter=inviter,
            has_account=existing_user is not None
        )
        
        return invitation
    
    @staticmethod
    def bulk_invite_users(org_id, invitations):
        """Bulk invite multiple users"""
        results = {
            'successful': [],
            'failed': []
        }
        
        for invite_data in invitations:
            try:
                invitation = OrganizationInvitationService.invite_user_to_organization(
                    org_id=org_id,
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
        """Accept organization invitation"""
        invitation = OrganizationInvitation.query.filter_by(
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
        
        # Add user to organization
        organization = Organization.query.get(invitation.organization_id)
        if organization.has_user(user):
            raise ValueError("User already in organization")
        
        organization.add_user(user, invitation.role)
        
        # Update invitation
        invitation.status = InvitationStatus.ACCEPTED
        invitation.user_id = user.id
        invitation.accepted_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return OrganizationUser.query.filter_by(
            organization_id=invitation.organization_id,
            user_id=user.id
        ).first()
    
    @staticmethod
    def decline_invitation(token):
        """Decline organization invitation"""
        invitation = OrganizationInvitation.query.filter_by(
            token=token,
            status=InvitationStatus.PENDING
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
    def get_pending_invitations_query(org_id):
        """Get query for pending invitations for an organization"""
        return OrganizationInvitation.query.filter_by(
            organization_id=org_id,
            status=InvitationStatus.PENDING
        ).order_by(OrganizationInvitation.created_at.desc())
    
    @staticmethod
    def cancel_invitation(invitation_id):
        """Cancel a pending invitation"""
        invitation = OrganizationInvitation.query.get_or_404(invitation_id)
        
        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("Can only cancel pending invitations")
        
        # Check authorization - user must be admin/owner of the organization
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get_or_404(current_user_id)
        organization = Organization.query.get_or_404(invitation.organization_id)
        user_role = organization.get_user_role(current_user)
        
        if user_role not in [OrganizationUserRole.ADMIN, OrganizationUserRole.OWNER]:
            raise ValueError("Must be admin or owner to cancel invitations")
        
        invitation.status = InvitationStatus.CANCELLED
        db.session.commit()
        
        return invitation
    
    @staticmethod
    def get_invitation_by_token(token):
        """Get invitation by token for public view"""
        invitation = OrganizationInvitation.query.filter_by(
            token=token
        ).first_or_404()
        
        # Check if expired
        if invitation.status == InvitationStatus.PENDING:
            if invitation.expires_at < datetime.now(timezone.utc):
                invitation.status = InvitationStatus.EXPIRED
                db.session.commit()
        
        return invitation