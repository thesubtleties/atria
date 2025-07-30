#!/usr/bin/env python3
"""
Script to update existing sponsor tiers with default colors
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.app import create_app
from api.extensions import db
from api.models import Event

# Default colors for sponsor tiers - refined metal theme
DEFAULT_TIER_COLORS = {
    "platinum": "#E5E4E2",  # Platinum gray (kept classic)
    "gold": "#DEAE4A",      # Refined gold
    "silver": "#C7D3DB",    # Sophisticated silver
    "bronze": "#BB8F4C",    # Traditional bronze
    "community": "#8B5CF6",  # Brand purple
}

def update_sponsor_tiers():
    """Update all events' sponsor tiers to include color field"""
    app = create_app()
    
    with app.app_context():
        # Get all events
        events = Event.query.all()
        
        updated_count = 0
        
        for event in events:
            if event.sponsor_tiers:
                updated = False
                
                # Check if any tier is missing a color
                for tier in event.sponsor_tiers:
                    if "color" not in tier:
                        # Add default color based on tier ID
                        tier_id = tier.get("id", "").lower()
                        
                        # Try to match by ID
                        if tier_id in DEFAULT_TIER_COLORS:
                            tier["color"] = DEFAULT_TIER_COLORS[tier_id]
                        else:
                            # Default color for unknown tiers
                            tier["color"] = "#6B7280"  # Gray
                        
                        updated = True
                
                if updated:
                    # Mark the column as modified
                    db.session.add(event)
                    updated_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"Updated {updated_count} events with sponsor tier colors")
        
        # Verify the update
        print("\nSample of updated sponsor tiers:")
        sample_event = Event.query.filter(Event.sponsor_tiers.isnot(None)).first()
        if sample_event and sample_event.sponsor_tiers:
            for tier in sample_event.sponsor_tiers[:3]:
                print(f"  - {tier.get('name')}: {tier.get('color')}")

if __name__ == "__main__":
    update_sponsor_tiers()