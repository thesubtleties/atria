# api/services/email_verification.py
from api.extensions import db
from api.models import User, EmailVerification
from api.services.email import email_service
from datetime import datetime, timedelta, timezone
import secrets
import string


class EmailVerificationService:
    @staticmethod
    def create_verification(user_id: int, email: str):
        """Create email verification token and send verification email"""
        user = User.query.get_or_404(user_id)
        
        # Check if user already verified
        if user.email_verified:
            raise ValueError("Email already verified")
        
        # Invalidate any existing verification tokens
        EmailVerification.query.filter_by(
            user_id=user_id
        ).update({"verified_at": datetime.now(timezone.utc)})
        
        # Generate secure token
        token = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
        )
        
        # Create verification record
        verification = EmailVerification(
            user_id=user_id,
            email=email,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        
        db.session.add(verification)
        db.session.commit()
        
        # Send verification email
        email_service.send_email_verification(
            user=user,
            verification_token=token,
        )
        
        return verification
    
    @staticmethod
    def verify_email(token: str):
        """Verify email using token"""
        verification = EmailVerification.query.filter_by(token=token).first()
        
        if not verification:
            raise ValueError("Invalid verification token")
        
        if verification.is_expired:
            raise ValueError("Verification token has expired")
        
        if verification.is_verified:
            raise ValueError("Email already verified")
        
        # Get user and update verification status
        user = verification.user
        user.email_verified = True
        verification.verified_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return user
    
    @staticmethod
    def resend_verification(email: str):
        """Resend verification email"""
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal if email exists
            return None
        
        if user.email_verified:
            raise ValueError("Email already verified")
        
        # Check for recent verification emails (rate limiting)
        recent_verification = EmailVerification.query.filter_by(
            user_id=user.id
        ).filter(
            EmailVerification.created_at > datetime.now(timezone.utc) - timedelta(minutes=5)
        ).first()
        
        if recent_verification and not recent_verification.is_expired:
            raise ValueError("Verification email sent recently. Please wait before requesting another.")
        
        # Create new verification
        return EmailVerificationService.create_verification(user.id, user.email)
    
    @staticmethod
    def check_verification_token(token: str):
        """Check if a verification token is valid without using it"""
        verification = EmailVerification.query.filter_by(token=token).first()
        
        if not verification:
            return {"valid": False, "reason": "Invalid token"}
        
        if verification.is_expired:
            return {"valid": False, "reason": "Token expired"}
        
        if verification.is_verified:
            return {"valid": False, "reason": "Already verified"}
        
        return {"valid": True, "email": verification.email}