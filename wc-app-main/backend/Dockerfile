# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Set PATH for pip's --user install
ENV PATH=/root/.local/bin:$PATH

# Default port — Railway overrides $PORT at runtime via Procfile/startCommand
ENV PORT=8000

# Expose default port (Railway ignores EXPOSE; the actual port comes from $PORT)
EXPOSE 8000

# Health check uses the default port; Railway's load-balancer health check
# uses the /health path configured in railway.json instead.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -c "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:$PORT/health')\" || exit 1"

# Fallback CMD for plain `docker run` (Railway uses Procfile / startCommand)
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 4"]
