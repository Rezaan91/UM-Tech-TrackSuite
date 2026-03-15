"""
UM Tech TrackSuite — FastAPI Backend
Production-ready: bcrypt passwords, SQLAlchemy ORM, JWT auth, CORS locked to env var.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import Device, User, get_db, init_db

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

SECRET_KEY  = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM   = "HS256"
TOKEN_TTL_H = 24

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="UM Tech TrackSuite API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


@app.on_event("startup")
def on_startup():
    init_db()


# ── Auth helpers ──────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_H),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(payload: dict = Depends(verify_token)) -> dict:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserLogin(BaseModel):
    username: str
    password: str


class DeviceCreate(BaseModel):
    device_name: str
    device_type: str
    manufacturer: str
    cpu: str
    ram_gb: int
    storage_gb: int
    os_name: str
    os_version: str
    last_updated: str
    installed_software: Optional[List[str]] = []
    employee_name: str
    department: str

    @field_validator("ram_gb")
    @classmethod
    def ram_positive(cls, v):
        if v <= 0:
            raise ValueError("ram_gb must be positive")
        return v

    @field_validator("storage_gb")
    @classmethod
    def storage_positive(cls, v):
        if v <= 0:
            raise ValueError("storage_gb must be positive")
        return v


class DeviceUpdate(BaseModel):
    device_name: Optional[str]       = None
    ram_gb: Optional[int]            = None
    storage_gb: Optional[int]        = None
    os_name: Optional[str]           = None
    os_version: Optional[str]        = None
    last_updated: Optional[str]      = None
    installed_software: Optional[List[str]] = None


# ── Recommendation engine ─────────────────────────────────────────────────────

def analyze_device(device: Device) -> dict:
    recs   = []
    risk   = 0
    sw_str = " ".join(device.installed_software or []).lower()

    # RAM
    if device.ram_gb < 8:
        recs.append({"category": "Hardware", "severity": "critical",
                     "issue": f"RAM is {device.ram_gb}GB — below minimum threshold",
                     "action": "Upgrade RAM to at least 16GB", "priority": 1})
        risk += 35
    elif device.ram_gb < 16:
        recs.append({"category": "Hardware", "severity": "warning",
                     "issue": f"RAM is {device.ram_gb}GB — adequate but limited",
                     "action": "Consider upgrading to 16GB", "priority": 2})
        risk += 15

    # Storage
    if device.storage_gb < 128:
        recs.append({"category": "Hardware", "severity": "critical",
                     "issue": f"Storage is {device.storage_gb}GB — critically low",
                     "action": "Upgrade to at least 256GB SSD", "priority": 1})
        risk += 30
    elif device.storage_gb < 256:
        recs.append({"category": "Hardware", "severity": "warning",
                     "issue": f"Storage is {device.storage_gb}GB — may run low",
                     "action": "Consider upgrading to 512GB SSD", "priority": 2})
        risk += 10

    # OS
    os_str = (device.os_name + " " + device.os_version).lower()
    if any(x in os_str for x in ["windows 7", "windows 8"]):
        recs.append({"category": "Operating System", "severity": "critical",
                     "issue": "Running end-of-life Windows — severe security risk",
                     "action": "Immediately upgrade to Windows 11", "priority": 1})
        risk += 50
    elif "windows 10" in os_str:
        recs.append({"category": "Operating System", "severity": "warning",
                     "issue": "Windows 10 end of support October 2025",
                     "action": "Upgrade to Windows 11", "priority": 1})
        risk += 25

    # Last update age
    try:
        years_old = datetime.now().year - int(device.last_updated[:4])
        if years_old >= 2:
            recs.append({"category": "Software Updates", "severity": "critical",
                         "issue": f"System not updated since {device.last_updated} ({years_old}yr ago)",
                         "action": "Run all pending system updates immediately", "priority": 1})
            risk += 30
        elif years_old >= 1:
            recs.append({"category": "Software Updates", "severity": "warning",
                         "issue": "System update over 1 year old",
                         "action": "Schedule updates within 30 days", "priority": 2})
            risk += 15
    except (ValueError, TypeError):
        pass

    # Antivirus
    av_tools = ["norton", "mcafee", "defender", "kaspersky", "avast",
                "bitdefender", "crowdstrike", "eset", "malwarebytes"]
    if not any(t in sw_str for t in av_tools):
        recs.append({"category": "Security", "severity": "critical",
                     "issue": "No antivirus software detected",
                     "action": "Install enterprise antivirus solution", "priority": 1})
        risk += 20

    # VPN
    vpn_tools = ["cisco vpn", "globalprotect", "nordvpn", "expressvpn",
                 "openvpn", "fortinet", "wireguard"]
    if not any(t in sw_str for t in vpn_tools):
        recs.append({"category": "Security", "severity": "warning",
                     "issue": "No VPN client detected",
                     "action": "Install corporate VPN client", "priority": 2})
        risk += 10

    risk = min(risk, 100)
    health = "critical" if risk >= 60 else ("warning" if risk >= 30 else "healthy")
    return {
        "health_status": health,
        "risk_score": risk,
        "recommendations": sorted(recs, key=lambda r: r["priority"]),
    }


def device_to_dict(d: Device) -> dict:
    return {
        "id": d.id,
        "device_name": d.device_name,
        "device_type": d.device_type,
        "manufacturer": d.manufacturer,
        "cpu": d.cpu,
        "ram_gb": d.ram_gb,
        "storage_gb": d.storage_gb,
        "os_name": d.os_name,
        "os_version": d.os_version,
        "last_updated": d.last_updated,
        "installed_software": d.installed_software or [],
        "employee_name": d.employee_name,
        "department": d.department,
        "submitted_by": d.submitted_by,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "UM Tech TrackSuite API", "version": "2.0.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Auth -------------------------------------------------------------------------

@app.post("/auth/login")
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "token": create_token(user.id, user.role),
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name,
            "department": user.department,
        },
    }


@app.post("/auth/register", status_code=201)
def register(body: UserLogin, db: Session = Depends(get_db),
             _=Depends(require_admin)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    new_user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        password_hash=hash_password(body.password),
        role="employee",
        full_name=body.username,
        department="General",
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created"}


# Devices ----------------------------------------------------------------------

@app.get("/devices")
def get_devices(db: Session = Depends(get_db),
                payload: dict = Depends(verify_token)):
    query = db.query(Device)
    if payload["role"] != "admin":
        query = query.filter(Device.submitted_by == payload["sub"])
    devices = query.all()
    result = []
    for d in devices:
        row = device_to_dict(d)
        analysis = analyze_device(d)
        row.update(analysis)
        row["recommendation_count"] = len(analysis["recommendations"])
        result.append(row)
    return result


@app.post("/devices", status_code=201)
def create_device(body: DeviceCreate, db: Session = Depends(get_db),
                  payload: dict = Depends(verify_token)):
    device = Device(
        id=str(uuid.uuid4()),
        submitted_by=payload["sub"],
        **body.model_dump(),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return {"message": "Device registered", "device_id": device.id}


@app.get("/devices/{device_id}")
def get_device(device_id: str, db: Session = Depends(get_db),
               payload: dict = Depends(verify_token)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    row = device_to_dict(device)
    row.update(analyze_device(device))
    return row


@app.put("/devices/{device_id}")
def update_device(device_id: str, body: DeviceUpdate,
                  db: Session = Depends(get_db),
                  payload: dict = Depends(verify_token)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if payload["role"] != "admin" and device.submitted_by != payload["sub"]:
        raise HTTPException(status_code=403, detail="Not your device")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(device, field, value)
    db.commit()
    return {"message": "Device updated"}


@app.delete("/devices/{device_id}")
def delete_device(device_id: str, db: Session = Depends(get_db),
                  _=Depends(require_admin)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted"}


# Dashboard -------------------------------------------------------------------

@app.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db),
              payload: dict = Depends(verify_token)):
    query = db.query(Device)
    if payload["role"] != "admin":
        query = query.filter(Device.submitted_by == payload["sub"])
    devices = query.all()
    total = len(devices)
    counts = {"critical": 0, "warning": 0, "healthy": 0}
    for d in devices:
        counts[analyze_device(d)["health_status"]] += 1
    return {
        "total_devices": total,
        **counts,
        "compliance_rate": round(counts["healthy"] / total * 100, 1) if total else 0,
    }


@app.get("/devices/{device_id}/recommendations")
def get_recommendations(device_id: str, db: Session = Depends(get_db),
                        _=Depends(verify_token)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return analyze_device(device)
