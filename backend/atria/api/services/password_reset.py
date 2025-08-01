# api/services/password_reset.py
from api.extensions import db
from api.models import User, PasswordReset
from api.services.email import email_service
from datetime import datetime, timedelta, timezone
import secrets
import string


class PasswordResetService:
    @staticmethod
    def create_reset_token(email: str):
        """Create password reset token and send reset email"""
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal if email exists - return silently
            return None
        
        # Check for recent reset requests (rate limiting)
        recent_reset = PasswordReset.query.filter_by(
            user_id=user.id
        ).filter(
            PasswordReset.created_at > datetime.now(timezone.utc) - timedelta(minutes=5)
        ).first()
        
        if recent_reset and recent_reset.is_valid:
            raise ValueError("Password reset email sent recently. Please wait before requesting another.")
        
        # Invalidate any existing reset tokens
        PasswordReset.query.filter_by(
            user_id=user.id,
            used_at=None
        ).update({"used_at": datetime.now(timezone.utc)})
        
        # Generate secure token
        token = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
        )
        
        # Create reset record
        reset = PasswordReset(
            user_id=user.id,
            email=email,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),  # Shorter expiry for security
        )
        
        db.session.add(reset)
        db.session.commit()
        
        # Send reset email
        email_service.send_password_reset(
            user=user,
            reset_token=token,
        )
        
        return reset
    
    @staticmethod
    def reset_password(token: str, new_password: str):
        """Reset password using token"""
        reset = PasswordReset.query.filter_by(token=token).first()
        
        if not reset:
            raise ValueError("Invalid reset token")
        
        if not reset.is_valid:
            if reset.is_expired:
                raise ValueError("Reset token has expired")
            if reset.is_used:
                raise ValueError("Reset token has already been used")
            raise ValueError("Invalid reset token")
        
        # Get user and update password
        user = reset.user
        user.password = new_password  # This will be hashed by the User model setter
        
        # Mark token as used
        reset.used_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return user
    
    @staticmethod
    def validate_reset_token(token: str):
        """Check if a reset token is valid without using it"""
        reset = PasswordReset.query.filter_by(token=token).first()
        
        if not reset:
            return {"valid": False, "reason": "Invalid token"}
        
        if reset.is_expired:
            return {"valid": False, "reason": "Token expired"}
        
        if reset.is_used:
            return {"valid": False, "reason": "Token already used"}
        
        return {
            "valid": True, 
            "email": reset.email,
            "expires_in": int((reset.expires_at - datetime.now(timezone.utc)).total_seconds())
        }
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired tokens (can be run periodically)"""
        expired_tokens = PasswordReset.query.filter(
            PasswordReset.expires_at < datetime.now(timezone.utc),
            PasswordReset.used_at.is_(None)
        ).all()
        
        for token in expired_tokens:
            db.session.delete(token)
        
        db.session.commit()
        
        return len(expired_tokens)