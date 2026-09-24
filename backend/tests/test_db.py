from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.models.user import User


def test_postgresql_connection_and_version():
    """Verify live PostgreSQL connection and database version retrieval."""
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.scalar()
        assert version is not None
        assert "PostgreSQL" in version


def test_users_table_queryable():
    """Verify users table is queryable in PostgreSQL."""
    session = SessionLocal()
    try:
        count = session.query(User).count()
        assert count >= 0
    finally:
        session.close()
