#!/bin/sh

# Start Redis in background
redis-server /data/redis.conf &
REDIS_PID=$!

# Wait for Redis to start
sleep 2

# Start monitoring Redis commands and log to stdout
(
  echo "Redis command monitor started..."
  redis-cli MONITOR | while read -r line; do
    # Filter only product cache commands
    if echo "$line" | grep -q "products::"; then
      timestamp=$(date '+%Y-%m-%d %H:%M:%S')
      
      if echo "$line" | grep -q '"SET"'; then
        echo "[$timestamp] [CACHE SAVE] $line"
      elif echo "$line" | grep -q '"GET"'; then
        echo "[$timestamp] [CACHE READ] $line"
      elif echo "$line" | grep -q '"DEL"'; then
        echo "[$timestamp] [CACHE DELETE] $line"
      fi
    fi
  done
) &

# Wait for Redis process
wait $REDIS_PID
