#!/bin/sh
set -e

# Start Redis server in background
echo "Starting Redis server..."
redis-server /data/redis.conf &
REDIS_PID=$!

# Wait for Redis to be actually ready (ping loop instead of fixed sleep)
echo "Waiting for Redis to be ready..."
until redis-cli ping 2>/dev/null | grep -q PONG; do
    sleep 1
done
echo "Redis server ready (PID: $REDIS_PID)"

# Start monitoring cache operations in background (non-blocking)
echo "Starting cache monitor..."
echo "Listening for product cache operations..."
echo ""

redis-cli MONITOR 2>/dev/null | while IFS= read -r line; do
    # Check if line contains products::
    if echo "$line" | grep -q "products::"; then
        timestamp=$(date '+%H:%M:%S')

        # Check operation type
        if echo "$line" | grep -q '"SET"'; then
            product_id=$(echo "$line" | grep -o 'products::[0-9]*' | cut -d: -f3)
            echo "[$timestamp] [CACHE SAVE] Luu cache cho product ID: $product_id"
        elif echo "$line" | grep -q '"GET"'; then
            product_id=$(echo "$line" | grep -o 'products::[0-9]*' | cut -d: -f3)
            # Don't log GET to reduce noise
            :
        elif echo "$line" | grep -q '"DEL"'; then
            product_id=$(echo "$line" | grep -o 'products::[0-9]*' | cut -d: -f3)
            echo "[$timestamp] [CACHE DELETE] Xoa cache cho product ID: $product_id"
        fi
    fi
done &

# Wait for Redis process to exit
wait $REDIS_PID
