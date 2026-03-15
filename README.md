# UM Tech TrackSuite

**IT Asset Monitoring & Upgrade Recommendation System**

React frontend · FastAPI backend · PostgreSQL · JWT auth · GitHub Actions CI/CD

---

## Quick Start (Local)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env          # edit SECRET_KEY; leave DATABASE_URL blank for SQLite
uvicorn main:app --reload
# API docs → http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # set VITE_API_BASE=http://localhost:8000
npm run dev
# App → http://localhost:5173
```

### Demo accounts
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| jsmith | pass123 | Employee |
| mjones | pass123 | Employee |

---

## Deploy

See **CICD_SETUP.md** for the full step-by-step guide.

**Short version:**
1. Push to GitHub
2. Add the 7 secrets listed in CICD_SETUP.md
3. Every `git push main` auto-deploys backend → Render, frontend → Firebase Hosting

---

## Project Structure

```
um-tracksuite/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml       ← main pipeline (test → build → deploy)
│       ├── preview.yml     ← PR preview deploys (Firebase channel)
│       └── security.yml    ← weekly dependency audit
├── backend/
│   ├── main.py             ← FastAPI app (routes, auth, analysis engine)
│   ├── database.py         ← SQLAlchemy models + seed data
│   ├── requirements.txt    ← production deps
│   ├── requirements-dev.txt← test/lint deps
│   ├── pyproject.toml      ← ruff + black + pytest config
│   ├── .env.example        ← env var template
│   └── tests/
│       └── test_api.py     ← 25 pytest tests
├── frontend/
│   ├── index.html          ← Vite entry point
│   ├── src/
│   │   ├── main.jsx        ← React root
│   │   ├── App.jsx         ← Full app (all pages + components)
│   │   └── api.js          ← Real API client for production
│   ├── .eslintrc.cjs       ← ESLint config
│   ├── .env.example        ← env var template
│   ├── package.json
│   ├── vite.config.js
│   ├── firebase.json
│   └── .firebaserc
├── render.yaml             ← Render service + DB config
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Health + version |
| GET | `/health` | — | Health check (used by Render) |
| POST | `/auth/login` | — | Get JWT token |
| POST | `/auth/register` | Admin | Create employee account |
| GET | `/devices` | JWT | List devices (own or all) |
| POST | `/devices` | JWT | Register device |
| GET | `/devices/{id}` | JWT | Device + analysis |
| PUT | `/devices/{id}` | JWT | Update device |
| DELETE | `/devices/{id}` | Admin | Delete device |
| GET | `/dashboard/stats` | JWT | Aggregate health stats |
| GET | `/devices/{id}/recommendations` | JWT | AI recommendations |
