from api.extensions import db
from datetime import datetime, timezone


class Sponsor(db.Model):
    __tablename__ = "sponsors"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Basic info
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    website_url = db.Column(db.String(500))
    logo_url = db.Column(db.String(500))

    # Contact info
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))

    # Sponsorship details
    tier_id = db.Column(
        db.String(50)
    )  # References tier in event's sponsor_tiers
    custom_benefits = db.Column(db.JSON)  # Additional benefits beyond the tier

    # Display settings
    display_order = db.Column(
        db.Integer, default=999
    )  # Override tier order if needed
    is_active = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)  # Highlight sponsor

    # Social media links (optional)
    social_links = db.Column(
        db.JSON,
        default={
            "twitter": None,
            "linkedin": None,
            "facebook": None,
            "instagram": None,
        },
    )

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship("Event", back_populates="sponsors")

    def __repr__(self):
        return (
            f"Sponsor(id={self.id}, "
            f"name='{self.name}', "
            f"event_id={self.event_id}, "
            f"tier='{self.tier_id}')"
        )

    @property
    def tier_info(self):
        """Get tier information from event's sponsor_tiers"""
        if not self.event or not self.event.sponsor_tiers or not self.tier_id:
            return None

        for tier in self.event.sponsor_tiers:
            if tier.get("id") == self.tier_id:
                return tier
        return None

    @property
    def tier_name(self):
        """Get tier display name"""
        tier = self.tier_info
        return tier.get("name") if tier else self.tier_id

    @property
    def tier_order(self):
        """Get tier order for sorting"""
        tier = self.tier_info
        return tier.get("order", 999) if tier else 999

    def update_social_links(self, **kwargs):
        """Update social media links"""
        valid_platforms = {"twitter", "linkedin", "facebook", "instagram"}

        social = self.social_links or {}
        for platform, url in kwargs.items():
            if platform in valid_platforms:
                social[platform] = url
        self.social_links = social

    @classmethod
    def get_active_by_event(cls, event_id):
        """Get all active sponsors for an event, ordered by tier and display order"""
        return (
            cls.query.filter_by(event_id=event_id, is_active=True)
            .order_by(cls.display_order, cls.id)
            .all()
        )

    def validate_tier(self):
        """Validate tier_id exists in event's sponsor_tiers"""
        if not self.tier_id:
            return True  # Tier is optional

        if not self.event or not self.event.sponsor_tiers:
            raise ValueError("Event has no sponsor tiers defined")

        tier_ids = [tier.get("id") for tier in self.event.sponsor_tiers]
        if self.tier_id not in tier_ids:
            raise ValueError(f"Invalid tier_id: {self.tier_id}")

        return True
