# Financial Analytics — Working Capital App

A full-stack financial analytics platform for working-capital assessment, banking analysis, and multi-year trend reporting.

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Backend API | Python 3.11 · FastAPI · Motor (async MongoDB) | Railway |
| Database | MongoDB 7 | Railway MongoDB plugin |
| Mobile App | React Native · Expo (iOS + Android) | Expo EAS / App Stores |

---

## Quick Start (Local Development)

### 1. Clone the repo

```bash
git clone <repo-url>
cd wc-app
```

### 2. Start backend + MongoDB with Docker Compose

```bash
# From repo root
docker-compose up --build
```

- Backend API → [http://localhost:8001](http://localhost:8001)
- API docs    → [http://localhost:8001/docs](http://localhost:8001/docs)
- Health check → [http://localhost:8001/health](http://localhost:8001/health)

### 3. Configure the frontend

```bash
cd wc-app-main/frontend
cp .env.example .env
# .env already defaults to http://localhost:8001 via the fallback in src/api/index.ts
npm install
npx expo start
```

---

## Project Structure

```
wc-app/
├── Procfile                   ← Railway startup command (repo-root deployment)
├── railway.json               ← Railway build & deploy config
├── docker-compose.yml         ← Local dev: MongoDB + backend
├── DEPLOYMENT.md              ← Step-by-step Railway + Expo deployment guide
├── DEPLOYMENT_CHECKLIST.md    ← Pre-launch checklist
└── wc-app-main/
    ├── backend/
    │   ├── server.py          ← FastAPI application (all routes + business logic)
    │   ├── requirements.txt   ← Pinned Python dependencies
    │   ├── Dockerfile         ← Multi-stage Docker image
    │   ├── Procfile           ← Used when Railway root-dir = wc-app-main/backend
    │   ├── nixpacks.toml      ← Nixpacks config for Railway auto-detection
    │   └── .env.example       ← Environment variable template
    └── frontend/
        ├── src/api/index.ts   ← Axios API client (reads EXPO_PUBLIC_BACKEND_URL)
        ├── app.json           ← Expo app configuration
        ├── eas.json           ← EAS Build profiles
        └── .env.example       ← Environment variable template
```

---

## Environment Variables

### Backend (`wc-app-main/backend/.env`)

```ini
MONGO_URL=mongodb://localhost:27017
DB_NAME=financial_analytics
LOG_LEVEL=INFO
EMERGENT_LLM_KEY=          # optional — Gemini Vision API key
```

### Frontend (`wc-app-main/frontend/.env`)

```ini
EXPO_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
```

---

## Deploying to Railway

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide. Short version:

1. In the Railway dashboard → **New Project → Deploy from GitHub repo**
2. Set **Root Directory** → `wc-app-main/backend`
3. Add the **MongoDB plugin**
4. Set env vars: `DB_NAME=financial_analytics`, `LOG_LEVEL=INFO` (and optionally `EMERGENT_LLM_KEY`)
5. Deploy 🚀

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/health` | Health check (AI status included) |
| POST | `/api/analysis/wc` | Working-capital analysis |
| POST | `/api/analysis/banking` | Banking analysis |
| POST | `/api/analysis/trend` | Multi-year trend analysis |
| GET | `/api/cases` | List saved cases |
| POST | `/api/cases` | Save a case |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/parse/upload` | AI document parsing |
| POST | `/api/export/pdf` | PDF report export |

Interactive docs available at `/docs` (Swagger UI) and `/redoc` when the server is running.
