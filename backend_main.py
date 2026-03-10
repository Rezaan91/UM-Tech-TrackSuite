from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import jwt
import hashlib
import uuid
from datetime import datetime, timedelta
from database import db

app = FastAPI(title="UM Tech TrackSuite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "um-tracksuite-secret-2024"
ALGORITHM = "HS256"
security = HTTPBearer()

# ─── Models ───────────────────────────────────────────────────────────────────

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

class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    os_name: Optional[str] = None
    os_version: Optional[str] = None
    last_updated: Optional[str] = None
    installed_software: Optional[List[str]] = None

# ─── Auth Helpers ─────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Recommendation Engine ────────────────────────────────────────────────────

def analyze_device(device: dict) -> dict:
    recommendations = []
    risk_score = 0

    # RAM analysis
    if device["ram_gb"] < 8:
        recommendations.append({
            "category": "Hardware",
            "severity": "critical",
            "issue": f"RAM is {device['ram_gb']}GB — below minimum threshold",
            "action": "Upgrade RAM to at least 16GB for optimal performance",
            "priority": 1
        })
        risk_score += 35
    elif device["ram_gb"] < 16:
        recommendations.append({
            "category": "Hardware",
            "severity": "warning",
            "issue": f"RAM is {device['ram_gb']}GB — adequate but limited",
            "action": "Consider upgrading RAM to 16GB for better multitasking",
            "priority": 2
        })
        risk_score += 15

    # Storage analysis
    if device["storage_gb"] < 128:
        recommendations.append({
            "category": "Hardware",
            "severity": "critical",
            "issue": f"Storage is {device['storage_gb']}GB — critically low",
            "action": "Upgrade storage to at least 256GB SSD",
            "priority": 1
        })
        risk_score += 30
    elif device["storage_gb"] < 256:
        recommendations.append({
            "category": "Hardware",
            "severity": "warning",
            "issue": f"Storage is {device['storage_gb']}GB — may run low",
            "action": "Consider upgrading to 512GB SSD",
            "priority": 2
        })
        risk_score += 10

    # OS analysis
    os_name = device["os_name"].lower()
    os_ver = device["os_version"].lower()

    if "windows 10" in os_name or "windows 10" in os_ver:
        recommendations.append({
            "category": "Operating System",
            "severity": "warning",
            "issue": "Running Windows 10 — end of support October 2025",
            "action": "Upgrade to Windows 11 to maintain security support",
            "priority": 1
        })
        risk_score += 25
    elif "windows 7" in os_name or "windows 8" in os_name:
        recommendations.append({
            "category": "Operating System",
            "severity": "critical",
            "issue": "Running end-of-life Windows version — severe security risk",
            "action": "Immediately upgrade to Windows 11",
            "priority": 1
        })
        risk_score += 50

    if "ubuntu 18" in os_ver or "ubuntu 20" in os_ver:
        recommendations.append({
            "category": "Operating System",
            "severity": "warning",
            "issue": "Ubuntu version nearing end of support",
            "action": "Upgrade to Ubuntu 22.04 LTS or 24.04 LTS",
            "priority": 2
        })
        risk_score += 20

    # Last update analysis
    try:
        last_update_year = int(device["last_updated"][:4])
        current_year = datetime.now().year
        years_old = current_year - last_update_year

        if years_old >= 2:
            recommendations.append({
                "category": "Software Updates",
                "severity": "critical",
                "issue": f"System hasn't been updated since {device['last_updated']} ({years_old} years ago)",
                "action": "Run all pending system updates and security patches immediately",
                "priority": 1
            })
            risk_score += 30
        elif years_old >= 1:
            recommendations.append({
                "category": "Software Updates",
                "severity": "warning",
                "issue": f"System update is over 1 year old",
                "action": "Schedule system updates within the next 30 days",
                "priority": 2
            })
            risk_score += 15
    except:
        pass

    # Software checks
    software = [s.lower() for s in device.get("installed_software", [])]
    essential_software = {
        "antivirus": ["norton", "mcafee", "defender", "kaspersky", "avast", "bitdefender", "crowdstrike"],
        "backup": ["acronis", "veeam", "backblaze", "carbonite"],
        "vpn": ["cisco vpn", "globalprotect", "nordvpn", "expressvpn", "openvpn"]
    }

    for category, tools in essential_software.items():
        if not any(tool in " ".join(software) for tool in tools):
            recommendations.append({
                "category": "Security",
                "severity": "warning" if category != "antivirus" else "critical",
                "issue": f"No {category} software detected",
                "action": f"Install enterprise {category} solution",
                "priority": 2 if category != "antivirus" else 1
            })
            risk_score += 20 if category == "antivirus" else 10

    # Determine overall health
    risk_score = min(risk_score, 100)
    if risk_score >= 60:
        health_status = "critical"
    elif risk_score >= 30:
        health_status = "warning"
    else:
        health_status = "healthy"

    return {
        "health_status": health_status,
        "risk_score": risk_score,
        "recommendations": sorted(recommendations, key=lambda x: x["priority"])
    }

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "UM Tech TrackSuite API", "version": "1.0.0"}

@app.post("/auth/login")
def login(body: UserLogin):
    user = db["users"].get(body.username)
    if not user or user["password"] != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": body.username,
            "role": user["role"],
            "full_name": user["full_name"],
            "department": user["department"]
        }
    }

@app.post("/auth/register")
def register(body: UserLogin, payload=Depends(verify_token)):
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if body.username in db["users"]:
        raise HTTPException(status_code=400, detail="User already exists")
    user_id = str(uuid.uuid4())
    db["users"][body.username] = {
        "id": user_id,
        "password": hash_password(body.password),
        "role": "employee",
        "full_name": body.username,
        "department": "General"
    }
    return {"message": "User created successfully"}

@app.get("/devices")
def get_devices(payload=Depends(verify_token)):
    devices = list(db["devices"].values())
    if payload["role"] != "admin":
        devices = [d for d in devices if d.get("submitted_by") == payload["sub"]]
    # Attach analysis to each
    for d in devices:
        analysis = analyze_device(d)
        d["health_status"] = analysis["health_status"]
        d["risk_score"] = analysis["risk_score"]
        d["recommendation_count"] = len(analysis["recommendations"])
    return devices

@app.post("/devices")
def create_device(body: DeviceCreate, payload=Depends(verify_token)):
    device_id = str(uuid.uuid4())
    device = body.dict()
    device["id"] = device_id
    device["submitted_by"] = payload["sub"]
    device["created_at"] = datetime.now().isoformat()
    db["devices"][device_id] = device
    return {"message": "Device registered", "device_id": device_id}

@app.get("/devices/{device_id}")
def get_device(device_id: str, payload=Depends(verify_token)):
    device = db["devices"].get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    analysis = analyze_device(device)
    return {**device, **analysis}

@app.put("/devices/{device_id}")
def update_device(device_id: str, body: DeviceUpdate, payload=Depends(verify_token)):
    device = db["devices"].get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    db["devices"][device_id].update(update_data)
    return {"message": "Device updated"}

@app.delete("/devices/{device_id}")
def delete_device(device_id: str, payload=Depends(verify_token)):
    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if device_id not in db["devices"]:
        raise HTTPException(status_code=404, detail="Device not found")
    del db["devices"][device_id]
    return {"message": "Device deleted"}

@app.get("/dashboard/stats")
def get_stats(payload=Depends(verify_token)):
    devices = list(db["devices"].values())
    total = len(devices)
    critical = warning = healthy = 0
    for d in devices:
        analysis = analyze_device(d)
        if analysis["health_status"] == "critical":
            critical += 1
        elif analysis["health_status"] == "warning":
            warning += 1
        else:
            healthy += 1
    return {
        "total_devices": total,
        "critical": critical,
        "warning": warning,
        "healthy": healthy,
        "compliance_rate": round((healthy / total * 100) if total > 0 else 0, 1)
    }

@app.get("/devices/{device_id}/recommendations")
def get_recommendations(device_id: str, payload=Depends(verify_token)):
    device = db["devices"].get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return analyze_device(device)
