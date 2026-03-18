#!/bin/bash

# Ship Risk AI - Startup Script
# This script starts both the Python API server and React frontend

echo "================================================"
echo "  Ship Risk AI - Intelligent Risk Management"
echo "================================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv"
    echo "Then run: source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "ship-risk-ai/node_modules" ]; then
    echo "❌ Frontend dependencies not installed!"
    echo "Please run: cd ship-risk-ai && npm install"
    exit 1
fi

# Check if data exists
if [ ! -f "data/live_shipments.csv" ] && [ ! -f "data/shipments_raw.csv" ]; then
    echo "⚠️  No data found. Generating sample data..."
    source venv/bin/activate
    python main_pipeline.py --mode full --train-samples 5000 --live-samples 500
    deactivate
    echo "✅ Data generation complete!"
    echo ""
fi

# Start API server in background
echo "🚀 Starting API server on port 8000..."
source venv/bin/activate
python api_server.py &
API_PID=$!
deactivate
echo "✅ API server started (PID: $API_PID)"
echo ""

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API is ready!"
        break
    fi
    sleep 1
done
echo ""

# Start frontend
echo "🚀 Starting React frontend on port 5173..."
cd ship-risk-ai
npm run dev &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

echo "================================================"
echo "  ✅ Ship Risk AI is running!"
echo "================================================"
echo ""
echo "  🌐 Frontend: http://localhost:5173"
echo "  🔧 API:      http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
