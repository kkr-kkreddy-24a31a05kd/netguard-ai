import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

# Add backend root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

load_dotenv()
url = os.getenv("DATABASE_URL")

engine = create_engine(url)
with engine.connect() as conn:
    db_name, pg_version = conn.execute(text("SELECT current_database(), version()")).fetchone()
    print(f"DATABASE: {db_name}")
    print(f"POSTGRES_VERSION: {pg_version[:45]}")

    alembic_row = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
    print(f"ALEMBIC_CURRENT_HEAD: {alembic_row[0] if alembic_row else 'None'}")

inspector = inspect(engine)
tables = sorted(inspector.get_table_names())
print(f"TABLES_FOUND: {tables}")

expected_tables = ["alerts", "audit_logs", "detections", "models", "network_flows", "users"]
all_present = all(t in tables for t in expected_tables)
print(f"ALL_REQUIRED_TABLES_PRESENT: {all_present}")
