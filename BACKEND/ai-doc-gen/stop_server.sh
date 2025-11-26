#!/bin/bash
# Stop the FastAPI backend server running on port 8000

echo "Stopping server on port 8000..."
PIDS=$(lsof -ti:8000)

if [ -z "$PIDS" ]; then
    echo "No process found on port 8000"
else
    echo "Killing processes: $PIDS"
    kill -9 $PIDS
    echo "Server stopped"
fi

