#!/bin/bash

# Kill any existing processes on these ports to avoid conflicts
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Starting AI Engine on port 8000..."
cd /Users/studies/medical/ai_engine
python3 main.py > ai_engine.log 2>&1 &

echo "Starting Java Backend on port 8080..."
cd /Users/studies/medical/backend
mvn spring-boot:run > backend.log 2>&1 &

echo "Starting Frontend on port 5173..."
cd /Users/studies/medical/frontend
export VITE_API_URL=http://localhost:8080
npm run dev > frontend.log 2>&1 &

echo "Waiting for frontend to be ready..."
sleep 15
open http://localhost:5173

echo "All services launched locally!"
