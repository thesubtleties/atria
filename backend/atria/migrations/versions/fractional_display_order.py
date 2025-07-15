"""Change sponsor display_order to float for fractional indexing

Revision ID: fractional_display_order
Revises: 786370c454f1
Create Date: 2025-07-15 20:10:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fractional_display_order'
down_revision = '786370c454f1'
branch_labels = None
depends_on = None


def upgrade():
    # Change display_order from Integer to Float
    with op.batch_alter_table('sponsors', schema=None) as batch_op:
        batch_op.alter_column('display_order',
                              existing_type=sa.Integer(),
                              type_=sa.Float(),
                              existing_nullable=True,
                              postgresql_using='display_order::float')


def downgrade():
    # Change display_order back to Integer
    with op.batch_alter_table('sponsors', schema=None) as batch_op:
        batch_op.alter_column('display_order',
                              existing_type=sa.Float(),
                              type_=sa.Integer(),
                              existing_nullable=True,
                              postgresql_using='display_order::integer')