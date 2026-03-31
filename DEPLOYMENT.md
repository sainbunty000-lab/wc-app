# Deployment Guide

This guide covers deploying the Financial Analytics app on Railway (backend) and Expo (frontend).

## Prerequisites

- [Railway CLI](https://docs.railway.app/cli/installation) installed and authenticated
- [Expo CLI](https://docs.expo.dev/get-started/installation/) installed
- [Docker](https://www.docker.com/products/docker-desktop) for local testing
- MongoDB database (Railway will provide MongoDB plugin)

## Backend Deployment (Railway)

### 1. Prepare Your Backend

```bash
cd backend
# The .env file is configured with defaults
# Railway will override MONGO_URL via environment variables
```

### 2. Deploy to Railway

#### Option A: Using Railway CLI (Recommended)

```bash
# Log in to Railway
railway login

# Initialize Railway project
railway init

# Link to project
railway link

# Deploy
railway up

# Check deployment status
railway status

# View logs
railway logs
```

#### Option B: GitHub Integration (Easiest)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project → GitHub repo
4. Select the repo
5. Configure environment:
   - Railway auto-detects Python project
   - Add MongoDB plugin from Railway marketplace
   - Set `MONGO_URL` to the MongoDB connection string
   - Set other env vars: `DB_NAME=financial_analytics`, `LOG_LEVEL=INFO`

### 3. Configure Environment Variables

In Railway dashboard:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/financial_analytics
DB_NAME=financial_analytics
EMERGENT_LLM_KEY=your_gemini_api_key (optional)
LOG_LEVEL=INFO
```

### 4. Test Backend

Once deployed:

```bash
# Health check
curl https://your-railway-url.railway.app/health

# Should return: {"status": "healthy", "database": "connected", ...}
```

---

## Frontend Deployment (Expo)

### 1. Setup Expo Project

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Verify the app runs locally
npx expo start
```

### 2. Create Expo Account

```bash
# If you don't have an Expo account
npx eas-cli register

# Log in
npx eas-cli login
```

### 3. Build for Android (Recommended to Start)

```bash
# Configure EAS
npx eas-cli configure

# Create debug build
npx eas-cli build --platform android --local

# Or submit to Expo cloud (slower but more reliable)
npx eas-cli build --platform android
```

### 4. Build for iOS

```bash
# Requires Apple Developer account ($99/year)

# Create release build
npx eas-cli build --platform ios --type release

# Or use internal distribution for testing
npx eas-cli build --platform ios --type preview
```

### 5. Publish to Stores

#### Google Play Store

```bash
# Create app signing credentials
npx eas-cli credentials --platform android

# Submit to Play Store
npx eas-cli submit --platform android \
  --latest \
  --track internal
```

#### Apple App Store

```bash
# Create app signing credentials (expensive - requires Apple Developer account)
npx eas-cli credentials --platform ios

# Submit to App Store
npx eas-cli submit --platform ios \
  --latest
```

---

## Environment Configuration

### Backend (.env)

```ini
# MongoDB
MONGO_URL=mongodb+srv://user:pass@host/db
DB_NAME=financial_analytics

# API Configuration
API_TITLE=Financial Analytics API
LOG_LEVEL=INFO

# Security
CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]

# LLM (Optional)
EMERGENT_LLM_KEY=your_key
```

### Frontend (.env)

```ini
# Update based on your backend URL
EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app
```

---

## Local Development with Docker Compose

For local testing with MongoDB:

```bash
# Start services (MongoDB + Backend)
docker-compose up --build

# Backend will be available at http://localhost:8000
# MongoDB at mongodb://localhost:27017

# Stop services
docker-compose down
```

---

##  Troubleshooting

### Backend Won't Start

**Error: "KeyError: 'MONGO_URL'"**
- Solution: Ensure `.env` file exists in `backend/` directory
- Or set environment variables in Railway dashboard

**Error: "Connection refused"**
- MongoDB not available
- Check MongoDB service is running
- For Railway: verify MongoDB plugin is attached

### Frontend Build Fails

**Error: "Module not found"**
- Run `npm install` or `yarn install`
- Clear cache: `npm cache clean --force`

**Error: "eas-cli not found"**
- Install globally: `npm install -g eas-cli`
- Or use: `npx eas-cli`

### API Connection Issues

**Frontend can't reach backend**
- Verify `EXPO_PUBLIC_API_URL` in `.env`
- Check CORS settings in backend
- Use Railway public URL, not localhost

---

## Monitoring

### Railway
- Real-time logs in dashboard
- Metrics: CPU, memory, network
- Alerts configurable

### Expo
- Rollout analytics
- Crash reports via Sentry (optional integration)
- Release notes in Dashboard

---

## Cost Estimates

- **Railway**: $5-20/month (free tier available)
- **Expo EAS**: Free builds + $99/year for advanced features
- **MongoDB**: $57+/month (Atlas basic tier)
- **Apple Developer**: $99/year (for iOS distribution)
- **Google Play**: $25 one-time (for Android distribution)

---

## Next Steps

1. Update API endpoint in frontend `.env` after backend deployment
2. Test health endpoint: `/health`
3. Run sample API calls
4. Build and test mobile apps locally before cloud submission
5. Set up monitoring and error tracking

For more details:
- [Railway Documentation](https://docs.railway.app)
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/eas-update/introduction/)
