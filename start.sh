#!/bin/bash

BACKEND_PORT=3002
FRONTEND_PORT=5173
DB_NAME="discovery_db"

echo "Starting DiscoverAI..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
sleep 1
set -a; [ -f .env ] && source .env; set +a
echo "Setting up database..."
createdb $DB_NAME 2>/dev/null || true
psql -d $DB_NAME -f backend/db/schema.sql -q
psql -d $DB_NAME -f backend/db/seed.sql -q
echo "Database ready"
echo "Installing dependencies..."
(cd backend && npm install --silent)
(cd frontend && npm install --silent)
echo "Starting backend on port $BACKEND_PORT..."
(cd backend && npx nodemon server.js) &
sleep 2
echo "Starting frontend on port $FRONTEND_PORT..."
(cd frontend && npm run dev) &
echo ""
echo "Running!"
echo "   App:    http://localhost:$FRONTEND_PORT"
echo "   API:    http://localhost:$BACKEND_PORT"
echo "   Login:  admin@demo.com / demo123"
echo ""
echo "Press Ctrl+C to stop"
trap 'kill $(jobs -p) 2>/dev/null' EXIT
wait
