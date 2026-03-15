"""
Database configuration.
- Production: PostgreSQL via DATABASE_URL env var
- Local dev:  SQLite (auto-created at ./tracksuite.db)
"""
import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer,
    DateTime, JSON, event
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from sqlalchemy.pool import StaticPool

# ── Connection ────────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    SQLITE_PATH = os.path.join(os.path.dirname(__file__), "tracksuite.db")
    DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Models ────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id            = Column(String(36), primary_key=True)
    username      = Column(String(80),  unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    role          = Column(String(20),  nullable=False, default="employee")
    full_name     = Column(String(120), nullable=False)
    department    = Column(String(80),  nullable=False, default="General")
    created_at    = Column(DateTime, default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"
    id                 = Column(String(36),  primary_key=True)
    device_name        = Column(String(100), nullable=False, index=True)
    device_type        = Column(String(50),  nullable=False)
    manufacturer       = Column(String(80),  nullable=False)
    cpu                = Column(String(120), nullable=False)
    ram_gb             = Column(Integer,     nullable=False)
    storage_gb         = Column(Integer,     nullable=False)
    os_name            = Column(String(80),  nullable=False)
    os_version         = Column(String(120), nullable=False)
    last_updated       = Column(String(20),  nullable=False)
    installed_software = Column(JSON,        nullable=False, default=list)
    employee_name      = Column(String(120), nullable=False)
    department         = Column(String(80),  nullable=False)
    submitted_by       = Column(String(36),  nullable=False, index=True)
    created_at         = Column(DateTime, default=datetime.utcnow)


# ── Session dependency ────────────────────────────────────────────────────────

def get_db():
    """FastAPI dependency — yields a DB session and always closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Seed ─────────────────────────────────────────────────────────────────────

def init_db():
    """Create tables and insert seed data (only if users table is empty)."""
    import uuid
    import bcrypt

    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded

        def hp(pw: str) -> str:
            return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

        admin  = User(id=str(uuid.uuid4()), username="admin",  password_hash=hp("admin123"),
                      role="admin",    full_name="IT Administrator", department="IT")
        smith  = User(id=str(uuid.uuid4()), username="jsmith", password_hash=hp("pass123"),
                      role="employee", full_name="John Smith",       department="Engineering")
        jones  = User(id=str(uuid.uuid4()), username="mjones", password_hash=hp("pass123"),
                      role="employee", full_name="Mary Jones",       department="Finance")
        db.add_all([admin, smith, jones])
        db.flush()

        db.add_all([
            Device(id=str(uuid.uuid4()), device_name="DELL-ENG-001", device_type="Laptop",
                   manufacturer="Dell", cpu="Intel Core i5-10th Gen",
                   ram_gb=8, storage_gb=256, os_name="Windows 10",
                   os_version="Windows 10 Pro 21H2", last_updated="2022-06-15",
                   installed_software=["Microsoft Office", "Chrome", "Slack"],
                   employee_name="John Smith", department="Engineering",
                   submitted_by=smith.id),
            Device(id=str(uuid.uuid4()), device_name="HP-FIN-002", device_type="Desktop",
                   manufacturer="HP", cpu="Intel Core i3-8th Gen",
                   ram_gb=4, storage_gb=128, os_name="Windows 10",
                   os_version="Windows 10 Home 1903", last_updated="2021-03-10",
                   installed_software=["Microsoft Office", "QuickBooks"],
                   employee_name="Mary Jones", department="Finance",
                   submitted_by=jones.id),
            Device(id=str(uuid.uuid4()), device_name="MAC-MKT-003", device_type="Laptop",
                   manufacturer="Apple", cpu="Apple M2",
                   ram_gb=16, storage_gb=512, os_name="macOS",
                   os_version="macOS Ventura 13.5", last_updated="2024-01-05",
                   installed_software=["Figma", "Chrome", "CrowdStrike"],
                   employee_name="Alex Chen", department="Marketing",
                   submitted_by=admin.id),
            Device(id=str(uuid.uuid4()), device_name="LENOVO-IT-004", device_type="Laptop",
                   manufacturer="Lenovo", cpu="Intel Core i7-12th Gen",
                   ram_gb=32, storage_gb=1000, os_name="Windows 11",
                   os_version="Windows 11 Pro 23H2", last_updated="2024-02-20",
                   installed_software=["Chrome", "CrowdStrike", "GlobalProtect", "Acronis"],
                   employee_name="IT Admin", department="IT",
                   submitted_by=admin.id),
            Device(id=str(uuid.uuid4()), device_name="DELL-HR-005", device_type="Desktop",
                   manufacturer="Dell", cpu="Intel Core i5-6th Gen",
                   ram_gb=8, storage_gb=500, os_name="Windows 7",
                   os_version="Windows 7 SP1", last_updated="2020-11-01",
                   installed_software=["Microsoft Office 2010", "Internet Explorer"],
                   employee_name="Robert Davis", department="HR",
                   submitted_by=admin.id),
        ])
        db.commit()
        print("✅ Database seeded.")
    except Exception as exc:
        db.rollback()
        print(f"❌ Seed error: {exc}")
    finally:
        db.close()
