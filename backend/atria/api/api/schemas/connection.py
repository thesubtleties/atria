# api/api/schemas/connection.py
import logging
from api.extensions import ma, db
from api.models import Connection
from api.models.enums import ConnectionStatus
from marshmallow import fields


class ConnectionSchema(ma.SQLAlchemyAutoSchema):
    """Base Connection Schema with privacy filtering support"""

    class Meta:
        model = Connection
        sqla_session = db.session
        include_fk = True
        name = "ConnectionBase"

    # Use methods to handle privacy-filtered data
    requester = ma.Method("get_requester")
    recipient = ma.Method("get_recipient")
    originating_event = ma.Nested(
        "EventSchema",
        only=("id", "title"),
        dump_only=True,
    )
    
    def get_requester(self, obj):
        """Get requester with privacy filtering if applied"""
        user = obj.requester
        if not user:
            return None
            
        # Check if privacy filtering was applied
        if hasattr(user, '_privacy_filtered') and user._privacy_filtered:
            return {
                "id": user.id,
                "full_name": user.full_name,
                "email": user._filtered_email,
                "image_url": user.image_url,  # Image URL is always visible
                "company_name": user._filtered_company_name,
                "title": user._filtered_title,
                "social_links": user._filtered_social_links,
            }
        
        # SAFETY: If no privacy filtering was applied, return minimal safe data
        # This should only happen if called from a different context
        # Log this as it indicates a potential security issue
        logging.warning(f"ConnectionSchema: Privacy filtering not applied for user {user.id}, connection_id={obj.id if obj else 'None'}")
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": None,  # Hide by default
            "image_url": user.image_url,  # Image URL is always visible
            "company_name": None,  # Hide by default
            "title": None,  # Hide by default
            "social_links": None,  # Hide by default
        }
    
    def get_recipient(self, obj):
        """Get recipient with privacy filtering if applied"""
        user = obj.recipient
        if not user:
            return None
            
        # Check if privacy filtering was applied
        if hasattr(user, '_privacy_filtered') and user._privacy_filtered:
            return {
                "id": user.id,
                "full_name": user.full_name,
                "email": user._filtered_email,
                "image_url": user.image_url,  # Image URL is always visible
                "company_name": user._filtered_company_name,
                "title": user._filtered_title,
                "social_links": user._filtered_social_links,
            }
        
        # SAFETY: If no privacy filtering was applied, return minimal safe data
        # Check if this is expected (recipient viewing their own pending connections)
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request_optional
        
        try:
            verify_jwt_in_request_optional()
            current_user_id = get_jwt_identity()
            if current_user_id and int(current_user_id) == user.id:
                # This is expected - recipient is viewing their own pending connections
                logging.debug(f"ConnectionSchema.get_recipient: User {user.id} viewing self (expected for /connections/pending)")
            else:
                # This is unexpected - warn about it
                logging.warning(f"ConnectionSchema: Privacy filtering not applied for recipient user {user.id} (viewer is user {current_user_id})")
        except:
            # Can't determine current user - warn to be safe
            logging.warning(f"ConnectionSchema: Privacy filtering not applied for recipient user {user.id} (couldn't determine viewer)")
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": None,  # Hide by default
            "image_url": user.image_url,  # Image URL is always visible
            "company_name": None,  # Hide by default
            "title": None,  # Hide by default
            "social_links": None,  # Hide by default
        }


class ConnectionCreateSchema(ma.Schema):
    """Schema for creating connection requests"""

    class Meta:
        name = "ConnectionCreate"

    recipient_id = ma.Integer(required=True)
    icebreaker_message = ma.String(required=True)
    originating_event_id = ma.Integer()


class ConnectionUpdateSchema(ma.Schema):
    """Schema for updating connection status"""

    class Meta:
        name = "ConnectionUpdate"

    status = ma.Enum(ConnectionStatus, required=True)
