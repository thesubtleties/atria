"""Add event-scoped threads and thread hiding features

Revision ID: add_event_scoped_threads_and_hiding
Revises: fractional_display_order
Create Date: 2025-08-15 12:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '118120f66269'
branch_labels = None
depends_on = None


def upgrade():
    # Add event scoping and thread hiding fields to direct_message_threads
    with op.batch_alter_table('direct_message_threads', schema=None) as batch_op:
        # Event scoping: NULL = global thread, event_id = event-scoped thread
        batch_op.add_column(sa.Column('event_scope_id', sa.BigInteger(), nullable=True))
        batch_op.create_foreign_key(
            'fk_dm_threads_event_scope', 
            'events', 
            ['event_scope_id'], 
            ['id'], 
            ondelete='SET NULL'
        )
        
        # Thread hiding: cutoff timestamps for each user
        batch_op.add_column(sa.Column('user1_cutoff', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('user2_cutoff', sa.DateTime(timezone=True), nullable=True))

    # Add indexes for performance
    op.create_index('idx_dm_threads_event_scope', 'direct_message_threads', ['event_scope_id'])
    op.create_index('idx_dm_threads_user1_cutoff', 'direct_message_threads', ['user1_id', 'user1_cutoff'])
    op.create_index('idx_dm_threads_user2_cutoff', 'direct_message_threads', ['user2_id', 'user2_cutoff'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_dm_threads_user2_cutoff', table_name='direct_message_threads')
    op.drop_index('idx_dm_threads_user1_cutoff', table_name='direct_message_threads')
    op.drop_index('idx_dm_threads_event_scope', table_name='direct_message_threads')
    
    # Drop columns
    with op.batch_alter_table('direct_message_threads', schema=None) as batch_op:
        batch_op.drop_constraint('fk_dm_threads_event_scope', type_='foreignkey')
        batch_op.drop_column('user2_cutoff')
        batch_op.drop_column('user1_cutoff')
        batch_op.drop_column('event_scope_id')