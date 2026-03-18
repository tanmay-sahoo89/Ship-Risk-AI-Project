#!/bin/bash

# Ship Risk AI - Production Deployment Script
# This script prepares the application for production deployment

set -e

echo "================================================"
echo "  Ship Risk AI - Production Deployment Setup"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${RED}❌ Please edit .env with your production values${NC}"
    exit 1
fi

# Check if serviceAccountKey.json exists
if [ ! -f serviceAccountKey.json ]; then
    echo -e "${RED}❌ serviceAccountKey.json not found!${NC}"
    echo "Please download it from Firebase Console and place it in the project root."
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration found${NC}"
echo ""

# Build frontend
echo "📦 Building React frontend..."
cd ship-risk-ai
npm ci
npm run build
cd ..
echo -e "${GREEN}✅ Frontend build complete${NC}"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ ! -d venv ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
deactivate
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p artifacts data outputs logs
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Test configurations
echo "🔍 Verifying configurations..."

# Check if Python modules can be imported
source venv/bin/activate
python -c "import fastapi; print('✅ FastAPI OK')"
python -c "import pandas; print('✅ Pandas OK')"
python -c "import firebase_admin; print('✅ Firebase Admin OK')"
deactivate

echo ""
echo "================================================"
echo "  Deployment Preparation Complete!"
echo "================================================"
echo ""
echo "🚀 Next steps:"
echo ""
echo "Option 1 - Docker Deployment:"
echo "  docker-compose build"
echo "  docker-compose up -d"
echo ""
echo "Option 2 - Manual Linux Deployment:"
echo "  Follow DEPLOYMENT.md for manual setup"
echo ""
echo "Option 3 - Heroku Deployment:"
echo "  git push heroku main"
echo ""
echo "Option 4 - Cloud Platforms (AWS, GCP, Azure):"
echo "  See DEPLOYMENT.md for detailed instructions"
echo ""
