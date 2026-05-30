#!/bin/bash

echo "================================"
echo "🔍 REDIS CACHE DEBUG SCRIPT"
echo "================================"
echo ""

echo "1️⃣ Checking Redis keys..."
echo "---"
docker exec techshop-redis redis-cli KEYS "*"
echo ""

echo "2️⃣ Checking Product Service containers..."
echo "---"
docker ps --filter "name=product" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "3️⃣ Testing Product API (via Gateway)..."
echo "---"
curl -s http://localhost:8080/api/products/3 | head -c 200
echo ""
echo ""

echo "4️⃣ Checking Redis keys after API call..."
echo "---"
docker exec techshop-redis redis-cli KEYS "products::*"
echo ""

echo "5️⃣ Checking Product Service logs (last 20 lines)..."
echo "---"
docker logs techshopproject-product-service-2 --tail 20 2>&1 | grep -E "Cache|Fetching|product"
echo ""

echo "6️⃣ Testing cache endpoint..."
echo "---"
echo "Cache names:"
curl -s http://localhost:8080/api/products/cache/names
echo ""
echo ""

echo "Cache keys:"
curl -s http://localhost:8080/api/products/cache/products/keys
echo ""
echo ""

echo "================================"
echo "✅ Debug complete!"
echo "================================"
