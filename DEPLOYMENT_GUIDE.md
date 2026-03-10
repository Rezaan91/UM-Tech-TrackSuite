# UM Tech TrackSuite — Full Stack Deployment Guide

## Architecture Overview

```
Frontend (React/JSX)          Backend (FastAPI/Python)        Database
     Vercel          →→→→→→→   Render / Railway   →→→→→→→   PostgreSQL
  (Static SPA)              (REST API + Auth)             (Neon / Supabase)
```

---

## 🗂️ Project Structure

```
um-tracksuite/
├── backend/
│   ├── main.py              ← FastAPI app + all routes
│   ├── database.py          ← In-memory DB (swap for PostgreSQL)
│   ├── requirements.txt
│   ├── Procfile             ← For Render deployment
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   └── App.jsx          ← Full React app (single file)
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
└── README.md
```

---

## 🔧 Backend Setup (FastAPI)

### Local Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### PostgreSQL Migration (Production)
Replace `database.py` with:

```python
from sqlalchemy import create_engine, Column, String, Integer, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(String, default="employee")
    full_name = Column(String)
    department = Column(String)

class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True)
    device_name = Column(String)
    device_type = Column(String)
    manufacturer = Column(String)
    cpu = Column(String)
    ram_gb = Column(Integer)
    storage_gb = Column(Integer)
    os_name = Column(String)
    os_version = Column(String)
    last_updated = Column(String)
    installed_software = Column(JSON)
    employee_name = Column(String)
    department = Column(String)
    submitted_by = Column(String)
    created_at = Column(DateTime)
```

---

## 🚀 Deploy Backend to Render

### 1. Create `render.yaml` in backend/
```yaml
services:
  - type: web
    name: um-tracksuite-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: tracksuite-db
          property: connectionString

databases:
  - name: tracksuite-db
    databaseName: tracksuite
    user: tracksuite
```

### 2. Push to GitHub, connect Render
```bash
git init && git add . && git commit -m "Initial commit"
# Create repo on GitHub, push, connect to render.com
```

### 3. Set environment variables in Render dashboard:
- `SECRET_KEY` — random string
- `DATABASE_URL` — from Neon/Supabase/Render DB

---

## ⚡ Deploy Frontend to Vercel

### 1. Create Vite React project
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### 2. Copy App.jsx to `src/App.jsx`, update API_BASE
```javascript
// In App.jsx, change:
const API_BASE = "https://your-render-url.onrender.com";
```

### 3. Create `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4. Deploy
```bash
npm install -g vercel
vercel --prod
```

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Get JWT token |
| GET | `/devices` | JWT | List devices |
| POST | `/devices` | JWT | Register device |
| GET | `/devices/{id}` | JWT | Device + analysis |
| PUT | `/devices/{id}` | JWT | Update device |
| DELETE | `/devices/{id}` | Admin | Delete device |
| GET | `/dashboard/stats` | JWT | Aggregate stats |
| GET | `/devices/{id}/recommendations` | JWT | AI recommendations |

---

## 🧠 AI Recommendation Engine

The analysis engine (`analyze_device()`) scores each device 0–100:

| Check | Severity | Risk Points |
|-------|----------|-------------|
| RAM < 8GB | Critical | +35 |
| RAM < 16GB | Warning | +15 |
| Storage < 128GB | Critical | +30 |
| OS = Windows 7/8 | Critical | +50 |
| OS = Windows 10 | Warning | +25 |
| Last update > 2yr | Critical | +30 |
| No antivirus | Critical | +20 |
| No VPN | Warning | +10 |

**Health Status:**
- 0–29: ✅ Healthy
- 30–59: ⚠️ Warning  
- 60+: 🔴 Critical

### To add real AI (Claude API):
```python
import anthropic

async def get_ai_recommendation(device: dict) -> str:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"As an IT analyst, provide upgrade recommendations for: {device}"
        }]
    )
    return message.content[0].text
```

---

## 👥 Default Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| jsmith | pass123 | Employee |
| mjones | pass123 | Employee |

---

## 🔒 Security Checklist for Production

- [ ] Replace in-memory DB with PostgreSQL
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set CORS to specific frontend domain only
- [ ] Add rate limiting (`slowapi`)
- [ ] Add input validation with Pydantic
- [ ] Hash passwords with bcrypt (not SHA-256)
- [ ] Add refresh tokens

```python
# Production password hashing
import bcrypt
def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h): return bcrypt.checkpw(p.encode(), h.encode())
```

---

## 🌐 Tech Stack Summary

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React + Vite | Vercel (free) |
| Backend | FastAPI (Python) | Render (free tier) |
| Database | PostgreSQL | Neon.tech (free) |
| Auth | JWT (PyJWT) | — |
| AI Engine | Rule-based + Claude API | — |
