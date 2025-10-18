from api.extensions import ma, db
from api.models import SessionSpeaker
from api.models.enums import SessionSpeakerRole
from marshmallow import validates, ValidationError, fields


class SessionSpeakerSchema(ma.SQLAlchemyAutoSchema):
    """Base SessionSpeaker Schema with privacy filtering support"""

    class Meta:
        model = SessionSpeaker
        sqla_session = db.session
        include_fk = True

    # Computed Property
    speaker_name = ma.String(dump_only=True)

    # These fields use privacy-filtered data if available, otherwise fall back to user data
    image_url = ma.Method("get_image_url")
    title = ma.Method("get_title")
    company_name = ma.Method("get_company_name")
    social_links = ma.Method("get_social_links")
    
    def get_image_url(self, obj):
        """Get image URL (not filtered by privacy)"""
        return obj.user.image_url if obj.user else None
    
    def get_title(self, obj):
        """Get title with privacy filtering"""
        if hasattr(obj, '_privacy_filtered') and obj._privacy_filtered:
            return obj._filtered_title
        # SAFETY: Hide by default if privacy filtering wasn't applied
        # This should only happen if the service layer didn't apply filtering
        import logging
        if obj.user:
            logging.warning(f"SessionSpeakerSchema: Privacy filtering not applied for speaker user {obj.user.id}")
        return None
    
    def get_company_name(self, obj):
        """Get company name with privacy filtering"""
        if hasattr(obj, '_privacy_filtered') and obj._privacy_filtered:
            return obj._filtered_company_name
        # SAFETY: Hide by default if privacy filtering wasn't applied
        import logging
        if obj.user:
            logging.warning(f"SessionSpeakerSchema: Privacy filtering not applied for speaker user {obj.user.id}")
        return None
    
    def get_social_links(self, obj):
        """Get social links with privacy filtering"""
        if hasattr(obj, '_privacy_filtered') and obj._privacy_filtered:
            return obj._filtered_social_links
        # SAFETY: Hide by default if privacy filtering wasn't applied
        import logging
        if obj.user:
            logging.warning(f"SessionSpeakerSchema: Privacy filtering not applied for speaker user {obj.user.id}")
        return None


class SessionSpeakerDetailSchema(SessionSpeakerSchema):
    """Detailed SessionSpeaker Schema with relationships"""

    session = ma.Nested(
        "SessionSchema",
        only=(
            "id",
            "title",
            "start_time",
            "end_time",
            "day_number",
        ),
        dump_only=True,
    )
    user = ma.Nested(
        "UserSchema",
        only=("bio",),
        dump_only=True,
    )


class SessionSpeakerCreateSchema(ma.Schema):
    """Schema for adding speakers to sessions"""

    user_id = ma.Integer(required=True)
    role = ma.Enum(SessionSpeakerRole, required=True)
    order = ma.Integer()  # Optional, will be auto-set if not provided


class SessionSpeakerUpdateSchema(ma.Schema):
    """Schema for updating session speaker details"""

    role = ma.Enum(SessionSpeakerRole)
    order = ma.Integer()


class SpeakerReorderSchema(ma.Schema):
    """Schema for reordering speaker"""

    order = ma.Integer(required=True)

    @validates("order")
    def validate_order(self, value, **kwargs):
        if value < 1:
            raise ValidationError("Order must be positive")
