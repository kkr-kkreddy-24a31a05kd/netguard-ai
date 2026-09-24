import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.db.session import SessionLocal, engine
from app.models.user import Base, User
from app.core.security import get_password_hash


def seed_database():
    """Idempotently seed default administrator and analyst users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Default Admin
        admin_email = "admin@netguard.ai"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin_user = User(
                name="Security Administrator",
                email=admin_email,
                password_hash=get_password_hash("Admin@NetGuard2026!"),
                role="admin",
            )
            db.add(admin_user)
            print(f"SUCCESS: Seeded administrator: {admin_email}")
        else:
            print(f"INFO: Administrator '{admin_email}' already exists.")

        # Default Analyst
        analyst_email = "analyst@netguard.ai"
        existing_analyst = db.query(User).filter(User.email == analyst_email).first()
        if not existing_analyst:
            analyst_user = User(
                name="Tier-1 SOC Analyst",
                email=analyst_email,
                password_hash=get_password_hash("Analyst@NetGuard2026!"),
                role="analyst",
            )
            db.add(analyst_user)
            print(f"SUCCESS: Seeded analyst: {analyst_email}")
        else:
            print(f"INFO: Analyst '{analyst_email}' already exists.")

        db.commit()
        print("SEEDING_COMPLETED_SUCCESSFULLY")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding failed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
