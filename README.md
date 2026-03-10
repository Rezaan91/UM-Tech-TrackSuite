# UM Tech TrackSuite

> Lightweight tracking suite (backend + frontend) for the UM Tech project.

## Contents
- `backend_main.py` — backend entrypoint
- `backend_database.py` — database helper/static data
- `backend_requirements.txt` — Python dependencies
- `UMTrackSuite.jsx` — frontend React component
- `DEPLOYMENT_GUIDE.md` — deployment notes

## Prerequisites
- Python 3.8+ installed
- Git installed

## Setup (backend)
1. Create a virtual environment (recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r backend_requirements.txt
```

3. Run the backend:

```powershell
python backend_main.py
```

## Development / Git
- This repository is hosted at: https://github.com/Rezaan91/UM-Tech-TrackSuite
- To clone locally:

```bash
git clone https://github.com/Rezaan91/UM-Tech-TrackSuite.git
```

## Notes
- Add a `.gitignore` for `__pycache__/`, `.venv/`, and IDE files if desired.
- See `DEPLOYMENT_GUIDE.md` for deployment-specific steps.

---
Generated and added by the project maintainer via Copilot assistant.
