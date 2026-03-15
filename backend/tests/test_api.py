"""
UM TrackSuite — Backend Test Suite
Uses SQLite in-memory via env var so no real DB needed.
Run: pytest tests/ -v --cov=. --cov-report=term-missing
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest
from fastapi.testclient import TestClient
from database import Base, engine
from main import app, hash_password, analyze_device
from database import SessionLocal, User, Device
import uuid

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def seed_users():
    db = SessionLocal()
    try:
        import bcrypt
        def hp(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

        admin = User(id="admin-001", username="testadmin", password_hash=hp("testpass"),
                     role="admin", full_name="Test Admin", department="IT")
        emp   = User(id="emp-001",   username="testuser",  password_hash=hp("testpass"),
                     role="employee", full_name="Test User", department="Engineering")
        db.add_all([admin, emp])
        db.commit()
    finally:
        db.close()

    yield

    db = SessionLocal()
    try:
        db.query(Device).filter(Device.submitted_by.in_(["admin-001","emp-001"])).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(["admin-001","emp-001"])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def admin_token():
    r = client.post("/auth/login", json={"username": "testadmin", "password": "testpass"})
    return r.json()["token"]

def user_token():
    r = client.post("/auth/login", json={"username": "testuser", "password": "testpass"})
    return r.json()["token"]

SAMPLE = {
    "device_name": "CI-DEV-001", "device_type": "Laptop",
    "manufacturer": "Dell", "cpu": "Intel Core i7",
    "ram_gb": 16, "storage_gb": 512,
    "os_name": "Windows 11", "os_version": "Windows 11 Pro 23H2",
    "last_updated": "2024-01-01",
    "installed_software": ["Chrome", "CrowdStrike", "GlobalProtect"],
    "employee_name": "CI User", "department": "Engineering"
}


# ── Health ────────────────────────────────────────────────────────────────────

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_health():
    r = client.get("/health")
    assert r.status_code == 200


# ── Auth ──────────────────────────────────────────────────────────────────────

class TestAuth:
    def test_login_admin(self):
        r = client.post("/auth/login", json={"username": "testadmin", "password": "testpass"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"
        assert "token" in r.json()

    def test_login_employee(self):
        r = client.post("/auth/login", json={"username": "testuser", "password": "testpass"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "employee"

    def test_wrong_password(self):
        r = client.post("/auth/login", json={"username": "testadmin", "password": "bad"})
        assert r.status_code == 401

    def test_unknown_user(self):
        r = client.post("/auth/login", json={"username": "ghost", "password": "x"})
        assert r.status_code == 401

    def test_no_token_rejected(self):
        r = client.get("/devices")
        assert r.status_code == 403

    def test_bad_token_rejected(self):
        r = client.get("/devices", headers={"Authorization": "Bearer bad.token.here"})
        assert r.status_code == 401


# ── Devices ───────────────────────────────────────────────────────────────────

class TestDevices:
    def test_create_device(self):
        r = client.post("/devices", json=SAMPLE,
                        headers={"Authorization": f"Bearer {admin_token()}"})
        assert r.status_code == 201
        assert "device_id" in r.json()

    def test_admin_sees_all_devices(self):
        r = client.get("/devices", headers={"Authorization": f"Bearer {admin_token()}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_employee_sees_own_only(self):
        tok = user_token()
        client.post("/devices", json={**SAMPLE, "device_name": "EMP-DEV-001"},
                    headers={"Authorization": f"Bearer {tok}"})
        r = client.get("/devices", headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        for d in r.json():
            assert d["submitted_by"] == "emp-001"

    def test_get_device_by_id(self):
        tok = admin_token()
        create = client.post("/devices", json=SAMPLE,
                             headers={"Authorization": f"Bearer {tok}"})
        dev_id = create.json()["device_id"]
        r = client.get(f"/devices/{dev_id}",
                       headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200
        assert r.json()["id"] == dev_id

    def test_get_nonexistent_device(self):
        r = client.get("/devices/does-not-exist",
                       headers={"Authorization": f"Bearer {admin_token()}"})
        assert r.status_code == 404

    def test_update_device(self):
        tok = admin_token()
        create = client.post("/devices", json=SAMPLE,
                             headers={"Authorization": f"Bearer {tok}"})
        dev_id = create.json()["device_id"]
        r = client.put(f"/devices/{dev_id}", json={"ram_gb": 32},
                       headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200

    def test_delete_device_admin(self):
        tok = admin_token()
        create = client.post("/devices", json=SAMPLE,
                             headers={"Authorization": f"Bearer {tok}"})
        dev_id = create.json()["device_id"]
        r = client.delete(f"/devices/{dev_id}",
                          headers={"Authorization": f"Bearer {tok}"})
        assert r.status_code == 200

    def test_delete_device_employee_forbidden(self):
        admin_tok = admin_token()
        create = client.post("/devices", json=SAMPLE,
                             headers={"Authorization": f"Bearer {admin_tok}"})
        dev_id = create.json()["device_id"]
        r = client.delete(f"/devices/{dev_id}",
                          headers={"Authorization": f"Bearer {user_token()}"})
        assert r.status_code == 403


# ── Analysis engine ───────────────────────────────────────────────────────────

def make_device(**kwargs):
    defaults = dict(id="x", device_name="X", device_type="Laptop",
                    manufacturer="Dell", cpu="i7",
                    ram_gb=16, storage_gb=512,
                    os_name="Windows 11", os_version="Windows 11 Pro 23H2",
                    last_updated="2024-06-01",
                    installed_software=["CrowdStrike", "GlobalProtect"],
                    employee_name="X", department="IT",
                    submitted_by="x", created_at=None)
    defaults.update(kwargs)
    d = Device.__new__(Device)
    for k, v in defaults.items():
        setattr(d, k, v)
    return d

class TestAnalysis:
    def test_healthy_device(self):
        result = analyze_device(make_device())
        assert result["health_status"] == "healthy"
        assert result["risk_score"] < 30

    def test_critical_low_ram(self):
        result = analyze_device(make_device(ram_gb=4))
        issues = [r["issue"] for r in result["recommendations"]]
        assert any("RAM" in i for i in issues)
        ram_rec = next(r for r in result["recommendations"] if "RAM" in r["issue"])
        assert ram_rec["severity"] == "critical"

    def test_critical_old_os(self):
        result = analyze_device(make_device(os_name="Windows 7", os_version="Windows 7 SP1"))
        assert result["health_status"] == "critical"

    def test_warning_windows10(self):
        result = analyze_device(make_device(os_name="Windows 10", os_version="Windows 10 Pro"))
        os_recs = [r for r in result["recommendations"] if r["category"] == "Operating System"]
        assert os_recs and os_recs[0]["severity"] == "warning"

    def test_missing_antivirus(self):
        result = analyze_device(make_device(installed_software=["Chrome"]))
        cats = [r["category"] for r in result["recommendations"]]
        assert "Security" in cats

    def test_risk_capped_at_100(self):
        result = analyze_device(make_device(
            ram_gb=2, storage_gb=32,
            os_name="Windows 7", os_version="Windows 7",
            last_updated="2018-01-01", installed_software=[]))
        assert result["risk_score"] <= 100

    def test_recs_sorted_by_priority(self):
        result = analyze_device(make_device(
            ram_gb=2, os_name="Windows 7", os_version="7",
            last_updated="2018-01-01", installed_software=[]))
        prios = [r["priority"] for r in result["recommendations"]]
        assert prios == sorted(prios)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class TestDashboard:
    def test_stats_shape(self):
        r = client.get("/dashboard/stats",
                       headers={"Authorization": f"Bearer {admin_token()}"})
        assert r.status_code == 200
        data = r.json()
        for key in ("total_devices", "critical", "warning", "healthy", "compliance_rate"):
            assert key in data

    def test_stats_add_up(self):
        r = client.get("/dashboard/stats",
                       headers={"Authorization": f"Bearer {admin_token()}"})
        d = r.json()
        assert d["critical"] + d["warning"] + d["healthy"] == d["total_devices"]

    def test_compliance_rate_range(self):
        r = client.get("/dashboard/stats",
                       headers={"Authorization": f"Bearer {admin_token()}"})
        rate = r.json()["compliance_rate"]
        assert 0 <= rate <= 100
