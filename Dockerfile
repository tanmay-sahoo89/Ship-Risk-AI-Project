# Multi-stage build for Ship Risk AI
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY ship-risk-ai/package*.json ./
RUN npm ci

COPY ship-risk-ai/ ./
RUN npm run build

# Stage 2: Python Backend Base
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python backend files
COPY api_server.py .
COPY data_generator.py .
COPY feature_engineering.py .
COPY model_training.py .
COPY risk_scoring.py .
COPY recommendation_engine.py .
COPY firebase_uploader.py .
COPY main_pipeline.py .

# Copy artifacts and data directories
COPY artifacts/ ./artifacts/
COPY data/ ./data/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend

# Expose ports
EXPOSE 8000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start both API and frontend
CMD ["python", "api_server.py"]
