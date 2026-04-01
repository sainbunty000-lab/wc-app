# Deployment Guide

This guide covers deploying the **Financial Analytics** app:
- **Backend** (FastAPI + MongoDB) → [Railway](https://railway.app)
- **Frontend** (React Native / Expo) → Expo EAS Build + App Stores

---

## Repository Layout

```
wc-app/
├── Procfile                   ← Root-level Procfile (Railway fallback from repo root)
├── railway.json               ← Railway build/deploy config
├── docker-compose.yml         ← Local development only (MongoDB + backend)
├── wc-app-main/
│   ├── backend/               ← FastAPI app (Railway deploys this)
│   │   ├── server.py
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── Procfile           ← Used when Railway root-dir = wc-app-main/backend
│   │   ├── nixpacks.toml      ← Nixpacks build config (Railway auto-detect)
│   │   └── .env.example       ← Copy to .env for local dev
│   └── frontend/              ← Expo app
│       ├── app.json
│       ├── eas.json
│       └── .env.example       ← Copy to .env for local dev
```

---

## Backend Deployment (Railway)

### Prerequisites

- [Railway account](https://railway.app) and [Railway CLI](https://docs.railway.app/develop/cli)
- MongoDB — use the Railway MongoDB plugin (free tier available)

### Option A — GitHub Integration (Recommended)

1. Push your code to GitHub.
2. In the Railway dashboard → **New Project → Deploy from GitHub repo**.
3. Select your repository.
4. **IMPORTANT**: In project settings → **Root Directory** → set to `wc-app-main/backend`.
   Railway will then use `wc-app-main/backend/Procfile` and `nixpacks.toml` directly.
5. Add the **MongoDB** plugin from the Railway marketplace.
   Railway sets `MONGO_URL` automatically when the plugin is attached.
6. Set the remaining environment variables (see below).
7. Deploy — Railway will auto-detect Python via nixpacks and start uvicorn.

### Option B — Railway CLI from Repo Root

```bash
# Authenticate
railway login

# Create or link project
railway init          # new project
# OR
railway link          # existing project

# Deploy (uses root Procfile + railway.json)
railway up

# Tail logs
railway logs

# Open in browser
railway open
```

The root `Procfile` and `railway.json` are already configured to navigate into
`wc-app-main/backend` and start uvicorn.

### Environment Variables (Railway Dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ | Set automatically by Railway MongoDB plugin |
| `DB_NAME` | ✅ | `financial_analytics` |
| `LOG_LEVEL` | ✅ | `INFO` (or `DEBUG` during troubleshooting) |
| `EMERGENT_LLM_KEY` | Optional | Gemini Vision API key for AI document parsing |
| `CORS_ORIGINS` | Optional | Restrict in production, e.g. `["https://your-domain.com"]` |

> **Never commit secrets.** Use Railway's dashboard or `railway variables set KEY=VALUE`.

### Verify Backend Health

```bash
# Replace with your Railway public URL
curl https://your-app.up.railway.app/health

# Expected response
# {"status": "healthy", "timestamp": "...", "database": "connected", ...}

# The /api/health route is also available:
curl https://your-app.up.railway.app/api/health
```

---

## Frontend Deployment (Expo)

### 1. Configure the Backend URL

```bash
cd wc-app-main/frontend

# Copy the example and fill in your Railway URL
cp .env.example .env
# Edit .env:
#   EXPO_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
```

The API client (`src/api/index.ts`) reads `EXPO_PUBLIC_BACKEND_URL` — no code
changes are needed once the env var is set.

### 2. Install Dependencies

```bash
cd wc-app-main/frontend
npm install
```

### 3. Run Locally Against Deployed Backend

```bash
npx expo start
```

### 4. EAS Build (Production Builds)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in / create account
eas login

# Configure project (first time)
eas build:configure

# Build for Android (APK for testing)
eas build --platform android --profile preview2

# Build for iOS (internal distribution)
eas build --platform ios --profile preview

# Production builds
eas build --platform android --profile production
eas build --platform ios    --profile production
```

### 5. Submit to Stores

```bash
# Google Play
eas submit --platform android --latest --track internal

# Apple App Store
eas submit --platform ios --latest
```

---

## Local Development with Docker Compose

Spins up MongoDB + backend together — no Railway account needed.

```bash
# From repo root
docker-compose up --build

# Backend →  http://localhost:8001
# MongoDB → mongodb://localhost:27017

# Stop
docker-compose down
```

Copy `.env.example` to `.env` inside `wc-app-main/backend/` and adjust as needed.

---

## Troubleshooting

### Backend: `Connection refused` / MongoDB error

- Verify `MONGO_URL` is set in Railway dashboard.
- Check Railway logs: `railway logs` or dashboard → Deployments → Logs.
- The server handles a missing DB connection gracefully — only data endpoints fail.

### Backend: 500 on startup

- Confirm Railway root directory is set to `wc-app-main/backend`.
- Check that `requirements.txt` is present and the build log shows pip install succeeded.

### Frontend: Cannot reach API

- Confirm `EXPO_PUBLIC_BACKEND_URL` in `wc-app-main/frontend/.env` points to
  the live Railway URL (no trailing slash).
- Verify CORS — the backend currently allows `*`. For production, restrict to
  your frontend origin.

### Docker build fails locally

```bash
docker build -t wc-app:latest wc-app-main/backend/
docker run -e MONGO_URL=mongodb://host.docker.internal:27017 -p 8001:8000 wc-app:latest
```

---

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (Railway load-balancer target) |
| GET | `/api/health` | Health check (includes AI status) |
| POST | `/api/analysis/wc` | Working-capital analysis |
| POST | `/api/analysis/banking` | Banking analysis |
| POST | `/api/analysis/trend` | Multi-year trend analysis |
| GET | `/api/cases` | List saved cases |
| POST | `/api/cases` | Save a case |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/parse/upload` | AI document parsing (requires `EMERGENT_LLM_KEY`) |
| POST | `/api/export/pdf` | PDF report export |

FastAPI auto-generates interactive docs at `/docs` and `/redoc`.

---

## Cost Estimates

| Service | Cost |
|---------|------|
| Railway Hobby plan | ~$5/month |
| Railway MongoDB plugin | ~$5/month (512 MB) |
| Expo EAS Free tier | 30 builds/month free |
| Apple Developer | $99/year (iOS only) |
| Google Play | $25 one-time (Android only) |

---

For more details:
- [Railway Docs](https://docs.railway.app)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

