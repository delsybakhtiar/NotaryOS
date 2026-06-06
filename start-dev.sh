#!/bin/bash

# Kill any existing dev servers
pkill -f "next dev" 2>/dev/null
sleep 1

# Start dev server and keep it running
cd /home/z/my-project

while true; do
  bun run dev > /home/z/my-project/dev.log 2>&1 &
  DEV_PID=$!

  echo "Started dev server with PID: $DEV_PID"

  # Keep the script running
  sleep 30
done