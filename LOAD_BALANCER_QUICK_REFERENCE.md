# ⚡ LOAD BALANCER QUICK REFERENCE

## 🎯 TÓM TẮT NHANH

### **Kiến trúc 2-tier Load Balancing**

```
Client → NGINX (Port 80) → Gateway (Port 8080) → Microservices
         ↓                   ↓
    Rate Limiting      Load Balancing
    SSL Termination    Circuit Breaker
    Static Content     Service Discovery
```

---

## 📊 THÔNG SỐ QUAN TRỌNG

### **NGINX Load Balancer**
- **Thuật toán:** Least Connections
- **Rate Limit API:** 100 requests/phút (burst 20)
- **Rate Limit Login:** 5 requests/phút (burst 3)
- **Max Connections/IP:** 10 concurrent
- **Timeout:** 5s connect, 60s read/write
- **Health Check:** Mỗi 30s

### **Spring Cloud Gateway**
- **Thuật toán:** Round Robin
- **Service Discovery:** Eureka (Port 8761)
- **Retry:** 3 lần, exponential backoff (3s → 6s → 10s)
- **Circuit Breaker:** 50% failure rate → OPEN 30s
- **Timeout:** 5s connect, 30s response

### **Rate Limits per Service**
| Service | Rate | Burst |
|---------|------|-------|
| Product | 20/s | 40 |
| Auth | 10/s | 20 |
| Payment | 2/s | 5 |
| Cart | 10/s | 20 |
| User | 5/s | 10 |
| Order | 5/s | 10 |


---

## 🚀 LỆNH THƯỜNG DÙNG

### **Start & Scale**
```bash
# Start hệ thống
docker-compose up -d

# Scale product-service lên 3 instances
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3

# Check instances
docker ps | grep product-service
```

### **Monitoring**
```bash
# Eureka Dashboard
http://localhost:8761

# Gateway Routes
curl http://localhost:8080/actuator/gateway/routes | jq

# Service Health
curl http://localhost:8080/actuator/health | jq

# NGINX Logs
docker logs -f techshop-nginx
```

### **Testing**
```bash
# Test Load Balancing
for i in {1..10}; do curl http://localhost/api/products; done

# Test Rate Limiting
for i in {1..200}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/products; done

# Test Fault Tolerance
docker stop techshop-product-service-1
curl http://localhost/api/products  # Vẫn hoạt động
```

---

## 🔧 FILES QUAN TRỌNG

| File | Mô tả |
|------|-------|
| `nginx/nginx.conf` | NGINX load balancer config |
| `gateway-service/application.yml` | Gateway routing & rate limiting |
| `gateway-service/application-docker.yml` | Docker-specific config |
| `docker-compose.yml` | Service definitions |
| `docker-compose.scale.yml` | Scaling configuration |


---

## 🎯 KEY FEATURES

✅ **2-Tier Load Balancing** - NGINX + Spring Cloud Gateway  
✅ **Dynamic Service Discovery** - Eureka auto-registration  
✅ **Horizontal Scaling** - Scale services on-demand  
✅ **Fault Tolerance** - Circuit Breaker + Retry  
✅ **Rate Limiting** - Protect from DDoS  
✅ **Health Monitoring** - Auto health checks  
✅ **High Availability** - Multiple instances  
✅ **Auto Failover** - Automatic retry on failure  

---

## 🐛 TROUBLESHOOTING NHANH

### Service không xuất hiện trong Eureka
```bash
docker logs techshop-product-service
docker restart techshop-product-service
```

### Load balancing không hoạt động
```bash
curl http://localhost:8761  # Check Eureka
curl http://localhost:8080/actuator/gateway/routes | jq
```

### 429 Too Many Requests
```nginx
# Tăng rate limit trong nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=1000r/m;
```

### Circuit breaker OPEN
```bash
docker restart techshop-product-service
sleep 30  # Wait for HALF_OPEN state
```

### 502 Bad Gateway
```bash
docker ps | grep gateway
docker restart techshop-nginx
```

---

## 📖 CHI TIẾT ĐẦY ĐỦ

Xem file: **`LOAD_BALANCER_DOCUMENTATION.md`**

---

**Version:** 1.0 | **Last Updated:** 2025
