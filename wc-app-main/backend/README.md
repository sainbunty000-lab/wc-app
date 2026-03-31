# Financial Analytics API - Backend

FastAPI backend for financial analysis and working capital assessment.

## Quick Start

### Local Development

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Copy and edit .env file
   cp .env.example .env  # If it exists, otherwise .env is already set up
   ```

4. **Start MongoDB (Docker)**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

5. **Run server**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access API**
   - API docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

### Using Docker Compose

```bash
# From project root
docker-compose up --build

# Or just backend
cd ../
docker-compose up backend
```

## API Endpoints

### Analysis
- `POST /api/analysis/working-capital` - Working capital analysis
- `POST /api/analysis/banking` - Banking score analysis  
- `POST /api/analysis/trend` - Multi-year trend analysis

### Export
- `POST /api/export/pdf` - Generate PDF report

### Cases (History)
- `GET /api/cases` - List all cases
- `POST /api/cases` - Save new case
- `GET /api/cases/{case_id}` - Get specific case
- `DELETE /api/cases/{case_id}` - Delete case

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Health
- `GET /health` - Health check endpoint

## Environment Variables

```ini
# Required
MONGO_URL=mongodb://localhost:27017
DB_NAME=financial_analytics

# Optional
EMERGENT_LLM_KEY=your_gemini_key  # For document analysis
LOG_LEVEL=INFO
CORS_ORIGINS=["*"]
```

## Development

### Format Code
```bash
black . --line-length 100
```

### Run Tests
```bash
pytest -v
pytest --cov=. --cov-report=html
```

### Type Checking
```bash
mypy server.py
```

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions:
- Railway deployment
- Environment configuration
- Monitoring setup

## Project Structure

```
backend/
├── server.py           # Main FastAPI application
├── requirements.txt    # Python dependencies
├── Dockerfile         # Docker image configuration
├── .env               # Environment variables (local)
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running: `docker ps | grep mongodb`
- Check `MONGO_URL` in `.env`

**Port Already in Use**
- Change port: `uvicorn server:app --port 8001`

**Module Import Errors**
- Reinstall dependencies: `pip install -r requirements.txt`

## Performance Notes

- Workers: 4 by default (configurable)
- Database: Async Motor driver
- Caching: Recommended for production
- Rate limiting: Not configured (add if needed)

## Security

- CORS enabled for all origins (restrict in production)
- Input validation via Pydantic
- SQL injection: N/A (using MongoDB)
- Authentication: Not implemented (add if needed)

## Support

For issues or questions:
1. Check logs: `docker-compose logs backend`
2. Verify .env configuration
3. Test health endpoint: `curl http://localhost:8000/health`
