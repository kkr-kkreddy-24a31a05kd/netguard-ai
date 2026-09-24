import os
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv
import psycopg2

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL", "")

if not db_url or "sqlite" in db_url:
    print("STATUS: NOT_CONFIGURED - DATABASE_URL in backend/.env is not set to PostgreSQL.")
    sys.exit(1)

sanitized_url = db_url.replace("postgresql+psycopg2://", "postgresql://")
parsed = urlparse(sanitized_url)

target_host = parsed.hostname or "localhost"
port = parsed.port or 5432
user = parsed.username or "postgres"
password = parsed.password or ""
target_db = parsed.path.lstrip("/") or "netguard_ai"

print(f"Connecting to PostgreSQL server at {target_host}:{port} as user '{user}'...")

conn = None
last_error = None

for candidate_host in [target_host, "127.0.0.1", "localhost"]:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=candidate_host,
            port=port,
            connect_timeout=3,
        )
        target_host = candidate_host
        break
    except psycopg2.OperationalError as e:
        last_error = e

if not conn:
    err_str = str(last_error).strip()
    if "password authentication failed" in err_str:
        print("ERROR: Password authentication failed. Please check the password in backend/.env.")
    else:
        print(f"ERROR: Could not connect to PostgreSQL server: {err_str}")
    sys.exit(1)

try:
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT version();")
    server_ver = cur.fetchone()[0]
    print(f"SUCCESS: Connected to PostgreSQL: {server_ver.split(',')[0]}")

    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (target_db,))
    if not cur.fetchone():
        cur.execute(f'CREATE DATABASE "{target_db}";')
        print(f"SUCCESS: Project database '{target_db}' created.")
    else:
        print(f"SUCCESS: Project database '{target_db}' already exists.")

    cur.close()
    conn.close()

    # Verify connection to target db
    conn_target = psycopg2.connect(
        dbname=target_db,
        user=user,
        password=password,
        host=target_host,
        port=port,
        connect_timeout=3,
    )
    conn_target.close()
    print(f"SUCCESS: Direct connection to '{target_db}' verified.")
    print("POSTGRES_VERIFIED_OK")
    sys.exit(0)

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    sys.exit(1)
