# CI/CD Setup Guide — UM Tech TrackSuite

## Pipeline Overview

```
git push main
     │
     ├─► 🐍 Backend Tests (pytest + coverage)
     │         └── PostgreSQL service container spun up automatically
     │
     ├─► ⚛️  Frontend Build (vite build)
     │
     ├─── Both pass? ──────────────────────────────────┐
     │                                                  │
     ▼                                                  ▼
🚀 Deploy Backend → Render            🌐 Deploy Frontend → Firebase Hosting
     │                                                  │
    ├── Trigger Render deploy API                      ├── vite build
    ├── Poll status until live                         └── firebase deploy --only hosting
     └── Health check /
     
     └── 📣 Notify (success or failure)
```

**On Pull Requests:** Smoke tests + Firebase preview URL posted as PR comment.

---

## Step 1 — One-Time Setup

### 1a. Push project to GitHub
```bash
cd um-tracksuite
git init
git add .
git commit -m "feat: initial TrackSuite commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/um-tracksuite.git
git push -u origin main
```

### 1b. Set up Firebase Hosting
```bash
cd frontend
npm install
npm install -g firebase-tools
firebase login

# Create project if needed (or use the Firebase Console)
firebase projects:create um-tech-tracksuite-6e2aa

# Set default project in .firebaserc
firebase use --add

# Build and deploy manually once
npm run build
firebase deploy --only hosting

# Your frontend URL:
# https://um-tech-tracksuite-6e2aa.web.app

# Optional custom domain via Firebase Console > Hosting
```

### 1c. Create Firebase service account for CI
1. Firebase Console → Project Settings → Service accounts
2. Click **Generate new private key**
3. Save the JSON file securely

### 1d. Set up Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Set root directory to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Note down:
   - **Service ID** (from URL: `https://dashboard.render.com/web/srv-XXXXXXXX`)
   - **API Key** (Account → API Keys → Create API Key)
   - **Service URL** (e.g. `https://um-tracksuite-api.onrender.com`)

---

## Step 2 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add each of these:

| Secret Name | Where to find it | Example |
|-------------|-----------------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project settings | `um-tech-tracksuite-6e2aa` |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON (entire file contents) | `{ "type": "service_account", ... }` |
| `RENDER_API_KEY` | render.com → Account → API Keys | `rnd_abc123` |
| `RENDER_SERVICE_ID` | Render dashboard URL | `srv-abc123` |
| `RENDER_SERVICE_URL` | Your Render URL | `https://um-tracksuite-api.onrender.com` |
| `VITE_API_BASE` | Same as above | `https://um-tracksuite-api.onrender.com` |
| `VITE_API_BASE_STAGING` | Your staging Render URL (can be same) | `https://um-tracksuite-api.onrender.com` |

### Quick secret setup via GitHub CLI
```bash
gh secret set FIREBASE_PROJECT_ID --body "um-tech-tracksuite-6e2aa"
gh secret set FIREBASE_SERVICE_ACCOUNT < service-account.json
gh secret set RENDER_API_KEY --body "rnd_xxxxx"
gh secret set RENDER_SERVICE_ID --body "srv-xxxxx"
gh secret set RENDER_SERVICE_URL --body "https://your-app.onrender.com"
gh secret set VITE_API_BASE --body "https://your-app.onrender.com"
gh secret set VITE_API_BASE_STAGING --body "https://your-app.onrender.com"
```

---

## Step 3 — Set up GitHub Environments (Optional but recommended)

Go to **Settings → Environments** → Create two environments:

**`production-backend`**
- Required reviewers: add yourself
- Deployment branches: `main` only

**`production-frontend`**
- Deployment branches: `main` only

**`preview`**
- No restrictions (used for PR previews)

---

## Step 4 — First Push

```bash
git push origin main
```

Go to **Actions** tab — you'll see the workflow run in real time.

### Expected timeline:
| Step | Duration |
|------|----------|
| Backend tests | ~45s |
| Frontend build | ~30s |
| Render deploy | ~2–3min |
| Firebase deploy | ~30s |
| Health check | ~15s |
| **Total** | **~4–5 min** |

---

## Daily Workflow

### Feature development
```bash
git checkout -b feature/add-bulk-import
# ... make changes ...
git push origin feature/add-bulk-import
# Open PR → GitHub Actions runs smoke tests
# Merge PR → full CI/CD pipeline runs → auto-deploys to production
```

### Hotfix
```bash
git checkout main
git checkout -b hotfix/fix-login-bug
# ... fix ...
git push origin hotfix/fix-login-bug
# PR → merge → auto-deploy
```

---

## Troubleshooting

### ❌ "Firebase deploy failed: permission denied"
→ `FIREBASE_SERVICE_ACCOUNT` is invalid, incomplete, or lacks Hosting permissions. Generate a new key from Firebase Console and update the secret.

### ❌ "Firebase project not found"
→ `FIREBASE_PROJECT_ID` secret is wrong. Confirm project ID in Firebase Console.

### ❌ "Health check failed after 3 attempts"
→ Render free tier cold starts take 30s+. Increase the `sleep 10` between retries in the workflow, or upgrade to a paid Render plan to avoid cold starts.

### ❌ Backend tests fail locally but pass in CI
→ Check `ENVIRONMENT=test` is set when running locally:
```bash
ENVIRONMENT=test pytest tests/ -v
```

### ❌ Frontend build fails on CI but works locally
→ Check that `VITE_API_BASE` secret is set. Without it, `import.meta.env.VITE_API_BASE` is undefined. The app falls back to `localhost:8000` which is fine for local but wrong for prod.

---

## Monitoring After Deploy

Check these after every deploy:

```bash
# Is backend alive?
curl https://your-app.onrender.com/

# Is frontend live?
curl -I https://um-tech-tracksuite-6e2aa.web.app

# Can you log in?
curl -X POST https://your-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Are devices loading?
TOKEN="paste-token-here"
curl https://your-app.onrender.com/devices \
  -H "Authorization: Bearer $TOKEN"
```

---

## Pipeline Files Summary

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Main pipeline: test → build → deploy on `git push main` |
| `.github/workflows/preview.yml` | PR smoke tests |
| `.github/workflows/security.yml` | Weekly security scan (pip-audit, npm audit, CodeQL) |
| `backend/tests/test_api.py` | 20 pytest tests covering auth, devices, analysis engine |
| `backend/requirements-dev.txt` | pytest, ruff, black, pip-audit |
| `backend/pyproject.toml` | Ruff + Black + pytest config |
| `frontend/firebase.json` | SPA routing + cache headers for Firebase Hosting |
| `render.yaml` | Render service + DB config |
