"""metodo_pago: agregar 'tarjeta'

Revision ID: a1b2c3d4e5f6
Revises: c7c03aee77b4
Create Date: 2026-11-04
"""

from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "c7c03aee77b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE metodo_pago ADD VALUE IF NOT EXISTS 'tarjeta'")


def downgrade() -> None:
    # PostgreSQL no permite quitar valores de un enum; se deja el valor.
    pass
