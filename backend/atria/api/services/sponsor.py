from typing import Dict, List, Optional, Any

from api.extensions import db
from api.models import Sponsor, Event
from api.commons.pagination import paginate


class SponsorService:
    @staticmethod
    def get_event_sponsors(
        event_id: int, 
        active_only: bool = True, 
        schema=None
    ):
        """Get sponsors for an event"""
        # Verify event exists
        event = Event.query.get_or_404(event_id)

        # Build query with event relationship loaded
        query = Sponsor.query.filter_by(event_id=event_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        # Load with event relationship to avoid N+1 queries
        from sqlalchemy.orm import joinedload
        query = query.options(joinedload(Sponsor.event))
        
        # Order by display_order, then by tier_order (via computed property won't work in SQL)
        # So we'll sort in memory after fetching
        sponsors = query.all()
        
        # Sort by display order, then by tier order
        # Handle None values in tier_order by treating them as 999
        sponsors.sort(key=lambda s: (s.display_order or 999, s.tier_order or 999, s.id))
        
        if schema:
            return schema.dump(sponsors, many=True)
        
        return sponsors

    @staticmethod
    def get_sponsor(sponsor_id: int):
        """Get a sponsor by ID"""
        sponsor = Sponsor.query.get_or_404(sponsor_id)
        return sponsor

    @staticmethod
    def create_sponsor(event_id: int, sponsor_data: Dict[str, Any]):
        """Create a new sponsor for an event"""
        # Verify event exists
        event = Event.query.get_or_404(event_id)
        
        # Validate tier_id if provided
        if sponsor_data.get("tier_id"):
            if not event.sponsor_tiers:
                raise ValueError("Event has no sponsor tiers defined")
            
            tier_ids = [tier.get("id") for tier in event.sponsor_tiers]
            if sponsor_data["tier_id"] not in tier_ids:
                raise ValueError(f"Invalid tier_id: {sponsor_data['tier_id']}")
        
        # Create sponsor - filter out datetime fields that should be managed by DB
        allowed_data = {k: v for k, v in sponsor_data.items() if k not in ("created_at", "updated_at")}
        sponsor = Sponsor(event_id=event_id, **allowed_data)
        
        db.session.add(sponsor)
        db.session.commit()
        
        return sponsor

    @staticmethod
    def update_sponsor(sponsor_id: int, sponsor_data: Dict[str, Any]):
        """Update a sponsor"""
        sponsor = Sponsor.query.get_or_404(sponsor_id)
        
        # Validate tier_id if being updated
        if "tier_id" in sponsor_data and sponsor_data["tier_id"]:
            sponsor.tier_id = sponsor_data["tier_id"]
            sponsor.validate_tier()  # This will raise if invalid
        
        # Update social links if provided
        if "social_links" in sponsor_data:
            sponsor.update_social_links(**sponsor_data.pop("social_links"))
        
        # Update other fields
        for key, value in sponsor_data.items():
            # Skip datetime fields - they're managed by the database
            if key in ("created_at", "updated_at"):
                continue
            if hasattr(sponsor, key):
                setattr(sponsor, key, value)
        
        db.session.commit()
        
        return sponsor

    @staticmethod
    def delete_sponsor(sponsor_id: int):
        """Delete a sponsor"""
        sponsor = Sponsor.query.get_or_404(sponsor_id)
        
        db.session.delete(sponsor)
        db.session.commit()

    @staticmethod
    def reorder_sponsors(event_id: int, sponsor_orders: List[Dict[str, int]]):
        """Reorder sponsors by updating display_order
        
        Args:
            event_id: Event ID
            sponsor_orders: List of dicts with sponsor_id and display_order
        """
        # Verify event exists
        event = Event.query.get_or_404(event_id)
        
        # Get all sponsors for this event
        sponsors = {s.id: s for s in Sponsor.query.filter_by(event_id=event_id).all()}
        
        # Update display orders
        for order_data in sponsor_orders:
            sponsor_id = order_data.get("sponsor_id")
            display_order = order_data.get("display_order")
            
            if sponsor_id in sponsors:
                sponsors[sponsor_id].display_order = display_order
        
        db.session.commit()
        
        return list(sponsors.values())

    @staticmethod
    def toggle_sponsor_active(sponsor_id: int):
        """Toggle sponsor active status"""
        sponsor = Sponsor.query.get_or_404(sponsor_id)
        sponsor.is_active = not sponsor.is_active
        
        db.session.commit()
        db.session.refresh(sponsor)  # Refresh to ensure relationships are loaded
        
        return sponsor

    @staticmethod
    def toggle_sponsor_featured(sponsor_id: int):
        """Toggle sponsor featured status"""
        sponsor = Sponsor.query.get_or_404(sponsor_id)
        sponsor.featured = not sponsor.featured
        
        db.session.commit()
        db.session.refresh(sponsor)  # Refresh to ensure relationships are loaded
        
        return sponsor

    @staticmethod
    def get_featured_sponsors(event_id: int):
        """Get featured sponsors for an event"""
        sponsors = Sponsor.query.filter_by(
            event_id=event_id,
            is_active=True,
            featured=True
        ).all()
        
        # Sort by display order
        sponsors.sort(key=lambda s: (s.display_order or 999, s.tier_order or 999, s.id))
        
        return sponsors

    @staticmethod
    def update_sponsor_tiers(event_id: int, tiers: List[Dict[str, Any]]):
        """Update sponsor tier configuration for an event"""
        event = Event.query.get_or_404(event_id)
        
        # Validate tier structure
        for tier in tiers:
            if not all(k in tier for k in ["id", "name", "order"]):
                raise ValueError("Each tier must have id, name, and order")
        
        # Update tiers
        event.sponsor_tiers = tiers
        
        db.session.commit()
        
        return event.sponsor_tiers