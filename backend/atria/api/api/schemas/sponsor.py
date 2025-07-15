from api.extensions import ma, db
from api.models import Sponsor
from marshmallow import validates, ValidationError


class SponsorSchema(ma.SQLAlchemyAutoSchema):
    """Base Sponsor Schema"""

    class Meta:
        model = Sponsor
        sqla_session = db.session
        include_fk = True
        name = "SponsorBase"
        # Exclude datetime fields to avoid serialization issues
        exclude = ("created_at", "updated_at")

    # Computed Properties
    tier_name = ma.String(dump_only=True)
    tier_order = ma.Integer(dump_only=True)
    tier_info = ma.Dict(dump_only=True)


class SponsorDetailSchema(SponsorSchema):
    """Detailed Sponsor Schema with relationships"""

    class Meta(SponsorSchema.Meta):
        name = "SponsorDetail"

    # Include event details
    event = ma.Nested(
        "EventSchema",
        only=("id", "title", "slug", "sponsor_tiers"),
        dump_only=True
    )


class SponsorCreateSchema(ma.Schema):
    """Schema for creating sponsors"""

    name = ma.String(required=True)
    description = ma.String(allow_none=True)
    website_url = ma.String(allow_none=True)
    logo_url = ma.String(allow_none=True)

    # Contact info
    contact_name = ma.String(allow_none=True)
    contact_email = ma.Email(allow_none=True)
    contact_phone = ma.String(allow_none=True)

    # Sponsorship details
    tier_id = ma.String(allow_none=True)
    custom_benefits = ma.Dict(allow_none=True)

    # Display settings
    display_order = ma.Float(allow_none=True)
    is_active = ma.Boolean(load_default=True)
    featured = ma.Boolean(load_default=False)

    # Social media links
    social_links = ma.Dict(allow_none=True)

    @validates("website_url")
    def validate_website_url(self, value, **kwargs):
        """Validate website URL format"""
        if value and not value.startswith(("http://", "https://")):
            raise ValidationError(
                "Website URL must start with http:// or https://"
            )

    @validates("social_links")
    def validate_social_links(self, value, **kwargs):
        """Validate social media links structure"""
        if not value:
            return

        valid_platforms = {"twitter", "linkedin", "facebook", "instagram"}
        for platform, url in value.items():
            if platform not in valid_platforms:
                raise ValidationError(f"Invalid social platform: {platform}")
            if url and not url.startswith(("http://", "https://")):
                raise ValidationError(
                    f"{platform} URL must start with http:// or https://"
                )


class SponsorUpdateSchema(ma.Schema):
    """Schema for updating sponsors - all fields optional and nullable"""
    
    # Name is optional but can't be null if provided
    name = ma.String(required=False)
    
    # All other fields can be null to clear them
    description = ma.String(allow_none=True)
    website_url = ma.String(allow_none=True) 
    logo_url = ma.String(allow_none=True)
    contact_name = ma.String(allow_none=True)
    contact_email = ma.Email(allow_none=True)
    contact_phone = ma.String(allow_none=True)
    tier_id = ma.String(allow_none=True)
    custom_benefits = ma.Dict(allow_none=True)
    display_order = ma.Float(allow_none=True)
    is_active = ma.Boolean(allow_none=True)
    featured = ma.Boolean(allow_none=True)
    social_links = ma.Dict(allow_none=True)
    
    @validates("website_url")
    def validate_website_url(self, value, **kwargs):
        """Validate website URL format only if not None/empty"""
        if value and value.strip() and not value.startswith(("http://", "https://")):
            raise ValidationError("Website URL must start with http:// or https://")
    
    @validates("social_links")
    def validate_social_links(self, value, **kwargs):
        """Validate social media links only if provided"""
        if not value:
            return
            
        valid_platforms = {"twitter", "linkedin", "facebook", "instagram"}
        for platform, url in value.items():
            if platform not in valid_platforms:
                raise ValidationError(f"Invalid social platform: {platform}")
            if url and url.strip() and not url.startswith(("http://", "https://")):
                raise ValidationError(f"{platform} URL must start with http:// or https://")


class SponsorListSchema(ma.Schema):
    """Schema for listing sponsors with minimal data"""

    id = ma.Integer()
    name = ma.String()
    logo_url = ma.String()
    website_url = ma.String()
    tier_id = ma.String()
    tier_name = ma.String()
    tier_order = ma.Integer()
    display_order = ma.Float()
    featured = ma.Boolean()
    is_active = ma.Boolean()


class SponsorTierSchema(ma.Schema):
    """Schema for sponsor tier configuration"""

    id = ma.String(required=True)
    name = ma.String(required=True)
    order = ma.Integer(required=True)


