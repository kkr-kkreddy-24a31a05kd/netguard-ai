"""create_users_table

Revision ID: 54285f278ef6
Revises: 
Create Date: 2026-09-24 16:55:21.576844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54285f278ef6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('role', sa.String(length=50), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.CheckConstraint("role IN ('analyst', 'admin')", name='check_user_role'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if 'users' in tables:
        op.drop_index(op.f('ix_users_id'), table_name='users')
        op.drop_index(op.f('ix_users_email'), table_name='users')
        op.drop_table('users')
