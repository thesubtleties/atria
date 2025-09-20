"""Add IN_PERSON value to eventformat enum

Revision ID: f1a2b3c4d5e6
Revises: eee0ea388710
Create Date: 2025-09-20 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'eee0ea388710'
branch_labels = None
depends_on = None


def upgrade():
    """Add IN_PERSON to the eventformat enum."""
    # PostgreSQL requires explicit ALTER TYPE to add enum values
    # The value must be uppercase to match existing enum values in DB
    op.execute("ALTER TYPE eventformat ADD VALUE IF NOT EXISTS 'IN_PERSON'")

    # Note: We also need to handle the other enum types that might have similar issues
    # Based on the devjournal, PostgreSQL stores enum names in uppercase


def downgrade():
    """
    Note: PostgreSQL doesn't support removing enum values easily.
    This would require:
    1. Creating a new enum type without IN_PERSON
    2. Altering the column to use the new type
    3. Dropping the old type

    Since this is complex and rarely needed, we'll leave it unimplemented.
    """
    pass