Render deployment instructions

1. Create a new **Web Service** on render.com.
   - Repo: select this GitHub repository.
   - Branch: `main` (or specify a branch containing the `backend/` folder).
   - Root directory: set to `/backend`.
   - Environment: `Python 3` (choose latest available compatible runtime).
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

2. Add environment variables in Render settings:
   - `DATABASE_URL` = <your PostgreSQL connection string from Neon>
   - (Optional) `SECRET_KEY` to override default in code.

3. Deploy and monitor logs. The service will expose your FastAPI app.

Notes:
- This repo uses `backend/main.py` as the FastAPI app entrypoint. The start command above assumes Render's working directory is `/backend` and uses `main:app`.
- For production, replace the in-memory `db` with a real PostgreSQL-backed implementation using `DATABASE_URL`.
