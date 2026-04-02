# WC App – Financial Analytics

Full-stack application with a **FastAPI** backend (Python) and **Expo** (React Native) frontend.

---

## Project Structure

```
wc-app-main/
├── backend/          # FastAPI backend (deploy this to Railway)
│   ├── server.py     # Main FastAPI app entry point
│   ├── Dockerfile    # Docker image for Railway
│   ├── Procfile      # Fallback start command
│   ├── railway.json  # Railway deployment config
│   └── requirements.txt
└── frontend/         # Expo React Native app
```

---

## Running the Backend Locally

```bash
cd wc-app-main/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start a local MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Copy and edit environment variables
cp .env.example .env  # or create .env manually (see below)

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

API docs are available at `http://localhost:8000/docs`.  
Health check: `http://localhost:8000/health`

---

## Deploying the Backend on Railway

### Required Environment Variables

Set these in the Railway service dashboard (or via Railway CLI):

| Variable | Description | Example |
|---|---|---|
| `MONGO_URL` | MongoDB connection string (auto-set by Railway MongoDB plugin) | `mongodb://...` |
| `DB_NAME` | Database name | `financial_analytics` |
| `EMERGENT_LLM_KEY` | Gemini API key for AI features (optional) | `AIza...` |
| `LOG_LEVEL` | Logging verbosity (optional) | `INFO` |

### Steps

1. Push this repository to GitHub.
2. In [railway.app](https://railway.app), create a new project → **Deploy from GitHub repo**.
3. Select this repository.
4. In the Railway service settings, set the **Root Directory** to `wc-app-main/backend`.
5. Railway will detect the `Dockerfile` and build the image automatically.
6. Add a **MongoDB** plugin from the Railway marketplace; `MONGO_URL` will be injected automatically.
7. Set `DB_NAME=financial_analytics` in the service's environment variables.
8. Deploy and verify the health endpoint:
   ```bash
   curl https://<your-railway-url>.railway.app/health
   # {"status": "healthy", ...}
   ```

---

## Expo Frontend – API Base URL

After deploying the backend, set the public Railway URL in the frontend environment:

```ini
# wc-app-main/frontend/.env
EXPO_PUBLIC_API_URL=https://<your-railway-url>.railway.app
```

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/analysis/working-capital` | Working capital analysis |
| `POST` | `/api/analysis/banking` | Banking score analysis |
| `POST` | `/api/analysis/trend` | Multi-year trend analysis |
| `POST` | `/api/export/pdf` | Generate PDF report |
| `GET` | `/api/cases` | List saved cases |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |

Full interactive docs: `<backend-url>/docs`
