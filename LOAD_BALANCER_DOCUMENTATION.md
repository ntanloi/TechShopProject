# 📊 TÀI LIỆU LOAD BALANCER - HỆ THỐNG TECHSHOP

## 📋 MỤC LỤC
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Load Balancing](#kiến-trúc-load-balancing)
3. [NGINX Load Balancer](#nginx-load-balancer)
4. [Spring Cloud Gateway Load Balancer](#spring-cloud-gateway-load-balancer)
5. [Eureka Service Discovery](#eureka-service-discovery)
6. [Horizontal Scaling](#horizontal-scaling)
7. [Cấu Hình Chi Tiết](#cấu-hình-chi-tiết)
8. [Testing & Monitoring](#testing--monitoring)

---

## 🎯 TỔNG QUAN

Hệ thống TechShop sử dụng **2 tầng Load Balancing**:

```
Client Request
      ↓
┌─────────────────┐
│  NGINX (Layer 7)│  ← Tầng 1: External Load Balancer
│  Port 80/443    │     - Rate Limiting
└────────┬────────┘     - SSL Termination
         │              - Static Content
         ↓
┌─────────────────┐
│ Spring Gateway  │  ← Tầng 2: API Gateway + Internal LB
│  Port 8080      │     - Service Discovery (Eureka)
└────────┬────────┘     - Client-Side Load Balancing
         │              - Circuit Breaker
         ↓              - Retry Logic
┌─────────────────┐
│  Microservices  │  ← Các service có thể scale
│  (Multiple      │     - User, Product, Order, etc.
│   Instances)    │     - Auto-discovery via Eureka
└─────────────────┘
```


---

## 🏗️ KIẾN TRÚC LOAD BALANCING

### **1. NGINX Load Balancer (External)**

**Vai trò:** Entry point cho tất cả traffic từ bên ngoài

**Chức năng:**
- ✅ Load balancing cho Gateway Service
- ✅ Rate limiting (bảo vệ khỏi DDoS)
- ✅ SSL/TLS termination
- ✅ Static content serving
- ✅ Request/Response compression (gzip)
- ✅ Health check endpoints

**Thuật toán:** `least_conn` (Least Connections)
- Gửi request đến server có ít connection nhất
- Phù hợp cho long-lived connections

**File cấu hình:** `nginx/nginx.conf`

---

### **2. Spring Cloud Gateway (Internal)**

**Vai trò:** API Gateway + Internal Load Balancer

**Chức năng:**
- ✅ Service routing (định tuyến request đến đúng service)
- ✅ Client-side load balancing (via Ribbon/Spring Cloud LoadBalancer)
- ✅ Service discovery integration (Eureka)
- ✅ Circuit breaker (Resilience4j)
- ✅ Retry logic với exponential backoff
- ✅ Rate limiting per service
- ✅ CORS handling

**Thuật toán:** `Round Robin` (mặc định của Spring Cloud LoadBalancer)
- Phân phối request đều cho các instance

**File cấu hình:** `gateway-service/src/main/resources/application.yml`


---

## 🔧 NGINX LOAD BALANCER

### **Cấu Hình Upstream**

```nginx
upstream gateway_backend {
    least_conn;  # Thuật toán load balancing
    
    # Gateway instances
    server gateway-service:8080 max_fails=3 fail_timeout=30s;
    
    # Connection pooling
    keepalive 32;
    keepalive_requests 100;
    keepalive_timeout 60s;
}
```

**Giải thích:**
- `least_conn`: Chọn server có ít connection nhất
- `max_fails=3`: Đánh dấu server down sau 3 lần fail
- `fail_timeout=30s`: Thử lại sau 30 giây
- `keepalive 32`: Giữ 32 idle connections để tái sử dụng

---

### **Rate Limiting**

```nginx
# Định nghĩa zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Áp dụng
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
}

location /api/auth/login {
    limit_req zone=login_limit burst=3 nodelay;
}
```

**Giải thích:**
- `api_limit`: 100 requests/phút cho API thông thường
- `login_limit`: 5 requests/phút cho login (chống brute force)
- `burst=20`: Cho phép vượt quá 20 requests trong burst
- `conn_limit`: Tối đa 10 concurrent connections/IP


---

### **Health Check & Failover**

```nginx
location /api/ {
    proxy_pass http://gateway_backend;
    
    # Error handling - tự động chuyển sang server khác
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    proxy_next_upstream_tries 2;
    
    # Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Giải thích:**
- `proxy_next_upstream`: Tự động retry server khác khi gặp lỗi
- `proxy_next_upstream_tries 2`: Thử tối đa 2 servers
- Timeout ngắn để phát hiện lỗi nhanh

---

### **Performance Optimization**

```nginx
# Worker processes
worker_processes auto;  # Tự động theo số CPU cores
worker_connections 2048;  # Mỗi worker xử lý 2048 connections

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# Buffering
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
```


---

## ⚙️ SPRING CLOUD GATEWAY LOAD BALANCER

### **Service Discovery với Eureka**

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true

eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://discovery-service:8761/eureka/
```

**Cách hoạt động:**
1. Các microservices đăng ký với Eureka Server
2. Gateway fetch danh sách services từ Eureka
3. Gateway tự động load balance giữa các instances
4. Sử dụng `lb://service-name` để routing

---

### **Load Balancing URI**

```yaml
routes:
  - id: product-service
    uri: lb://product-service  # lb:// = Load Balanced
    predicates:
      - Path=/api/products/**
```

**Giải thích:**
- `lb://product-service`: Tự động load balance giữa các instance của product-service
- Gateway query Eureka để lấy danh sách instances
- Round-robin distribution (mặc định)


---

### **Retry Logic (Fault Tolerance)**

```yaml
filters:
  - name: Retry
    args:
      retries: 3
      statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE
      methods: GET
      backoff:
        firstBackoff: 3000ms
        maxBackoff: 10000ms
        factor: 2
        basedOnPreviousValue: true
```

**Giải thích:**
- Retry tối đa 3 lần khi gặp lỗi 502, 503
- Chỉ retry cho GET requests (idempotent)
- Exponential backoff: 3s → 6s → 10s
- Tự động chuyển sang instance khác

---

### **Circuit Breaker**

```yaml
resilience4j:
  circuitbreaker:
    instances:
      default:
        sliding-window-size: 10
        minimum-number-of-calls: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
```

**Trạng thái:**
1. **CLOSED** (Bình thường): Cho phép tất cả requests
2. **OPEN** (Lỗi): Block tất cả requests trong 30s
3. **HALF_OPEN** (Thử lại): Cho phép 3 requests để test

**Khi nào OPEN?**
- Có ít nhất 5 calls
- Failure rate ≥ 50%


---

### **Rate Limiting Per Service**

```yaml
- id: product-service
  filters:
    - name: RequestRateLimiter
      args:
        redis-rate-limiter.replenishRate: 20      # 20 tokens/giây
        redis-rate-limiter.burstCapacity: 40      # Max 40 requests burst
        redis-rate-limiter.requestedTokens: 1     # 1 token/request
        key-resolver: "#{@ipKeyResolver}"         # Theo IP
```

**Rate Limits cho từng service:**

| Service | Replenish Rate | Burst Capacity | Lý do |
|---------|---------------|----------------|-------|
| Product | 20/s | 40 | High traffic (browsing) |
| Auth | 10/s | 20 | Moderate traffic |
| User | 5/s | 10 | Normal traffic |
| Payment | 2/s | 5 | Security (strict limit) |
| Cart | 10/s | 20 | Frequent updates |
| Order | 5/s | 10 | Moderate traffic |

---

## 🔍 EUREKA SERVICE DISCOVERY

### **Cách hoạt động**

```
┌──────────────┐
│ Eureka Server│  Port 8761
│  (Discovery) │
└──────┬───────┘
       │
       ├─ Register ←─ User Service (8081)
       ├─ Register ←─ Product Service (8082) x3 instances
       ├─ Register ←─ Order Service (8083)
       └─ Register ←─ Gateway (8080)
       
Gateway fetch registry → Load balance requests
```


### **Health Check**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

**Giải thích:**
- Check health mỗi 30 giây
- Timeout 10 giây
- Retry 5 lần trước khi đánh dấu unhealthy
- Đợi 40 giây sau khi start mới bắt đầu check

---

## 📈 HORIZONTAL SCALING

### **Cấu hình Scale**

File: `docker-compose.scale.yml`

```yaml
services:
  product-service:
    container_name: !reset null  # Xóa fixed name
    ports: !override
      - "8082"  # Dynamic port mapping
    mem_limit: 1g
    mem_reservation: 512m
    cpus: 1.0
```

### **Lệnh Scale**

```bash
# Scale product-service lên 3 instances
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3

# Kiểm tra
docker ps | grep product-service
```


### **Kết quả sau khi scale**

```
┌─────────────────┐
│  Gateway (8080) │
└────────┬────────┘
         │
         ├─→ product-service-1 (port 32768)
         ├─→ product-service-2 (port 32769)
         └─→ product-service-3 (port 32770)
```

**Lợi ích:**
- ✅ Tăng throughput (xử lý nhiều requests hơn)
- ✅ High availability (1 instance down, còn 2 instance)
- ✅ Zero-downtime deployment
- ✅ Tự động load balancing qua Eureka

---

## 🎛️ CẤU HÌNH CHI TIẾT

### **1. NGINX Configuration**

**File:** `nginx/nginx.conf`

**Các tham số quan trọng:**

```nginx
# Performance
worker_processes auto;           # Số worker = số CPU cores
worker_connections 2048;         # Max connections/worker
keepalive_timeout 65;           # Keep connection alive 65s
client_max_body_size 20M;       # Max upload size

# Compression
gzip on;
gzip_comp_level 6;              # Compression level (1-9)
gzip_types text/plain text/css application/json;

# Timeouts
proxy_connect_timeout 5s;       # Timeout kết nối backend
proxy_send_timeout 60s;         # Timeout gửi request
proxy_read_timeout 60s;         # Timeout đọc response
```


### **2. Gateway Configuration**

**File:** `gateway-service/src/main/resources/application.yml`

**Timeout Settings:**

```yaml
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 5000      # 5 giây
        response-timeout: 30s      # 30 giây
```

**Resilience4j:**

```yaml
resilience4j:
  retry:
    instances:
      default:
        max-attempts: 3
        wait-duration: 3s
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 1.5
  
  circuitbreaker:
    instances:
      default:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
```

---

### **3. Service Health Checks**

**Tất cả services có health check:**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:PORT/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```


---

## 🧪 TESTING & MONITORING

### **1. Test Load Balancing**

**Test NGINX:**
```bash
# Gửi nhiều requests
for i in {1..100}; do
  curl -s http://localhost/api/products | grep -o "instance-[0-9]"
done | sort | uniq -c
```

**Kết quả mong đợi:**
```
33 instance-1
34 instance-2
33 instance-3
```

---

**Test Gateway Load Balancing:**
```bash
# Gửi requests qua Gateway
for i in {1..100}; do
  curl -s http://localhost:8080/api/products
done
```

**Kiểm tra logs:**
```bash
docker logs techshop-gateway | grep "Routing to"
```

---

### **2. Test Rate Limiting**

**Test NGINX rate limit:**
```bash
# Gửi 200 requests nhanh (vượt quá 100/phút)
for i in {1..200}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/products
done
```

**Kết quả mong đợi:**
- 100 requests đầu: `200 OK`
- 20 requests tiếp (burst): `200 OK`
- 80 requests còn lại: `429 Too Many Requests`


---

**Test Gateway rate limit:**
```bash
# Test login rate limit (5/phút)
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    -w "%{http_code}\n"
done
```

---

### **3. Test Retry & Circuit Breaker**

**Simulate service failure:**
```bash
# Stop 1 product-service instance
docker stop techshop-product-service-1

# Gửi requests - Gateway sẽ tự động retry instance khác
curl http://localhost:8080/api/products
```

**Kiểm tra logs:**
```bash
docker logs techshop-gateway | grep -i "retry"
```

---

**Test Circuit Breaker:**
```bash
# Stop tất cả product-service instances
docker stop $(docker ps -q --filter name=product-service)

# Gửi 10 requests
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/products
done
```

**Kết quả mong đợi:**
- 5 requests đầu: `503 Service Unavailable` (thử retry)
- 5 requests sau: `503` ngay lập tức (circuit OPEN)


---

### **4. Monitoring**

**Check Eureka Dashboard:**
```
http://localhost:8761
```

**Xem các service đã đăng ký:**
- USER-SERVICE
- PRODUCT-SERVICE (x3 instances nếu đã scale)
- ORDER-SERVICE
- CART-SERVICE
- PAYMENT-SERVICE
- NOTIFICATION-SERVICE
- INVENTORY-SERVICE
- REVIEW-SERVICE
- AI-SERVICE

---

**Check Gateway Routes:**
```bash
curl http://localhost:8080/actuator/gateway/routes | jq
```

---

**Check NGINX Status:**
```bash
# Access logs
docker exec techshop-nginx tail -f /var/log/nginx/access.log

# Error logs
docker exec techshop-nginx tail -f /var/log/nginx/error.log

# Health check
curl http://localhost/health
```

---

**Check Service Health:**
```bash
# Gateway health
curl http://localhost:8080/actuator/health | jq

# Product service health
curl http://localhost:8082/actuator/health | jq
```


---

## 📊 SO SÁNH LOAD BALANCING STRATEGIES

| Tiêu chí | NGINX | Spring Cloud Gateway |
|----------|-------|---------------------|
| **Layer** | Layer 7 (HTTP) | Application Layer |
| **Vị trí** | External (Entry point) | Internal (API Gateway) |
| **Thuật toán** | Least Connections | Round Robin |
| **Service Discovery** | Static config | Dynamic (Eureka) |
| **Health Check** | Active (ping) | Passive (Eureka heartbeat) |
| **Retry** | Manual config | Automatic (Resilience4j) |
| **Circuit Breaker** | ❌ | ✅ |
| **Rate Limiting** | ✅ (IP-based) | ✅ (Per service) |
| **SSL Termination** | ✅ | ❌ |
| **Static Content** | ✅ | ❌ |

---

## 🎯 BEST PRACTICES

### **1. NGINX**
- ✅ Sử dụng `least_conn` cho long-lived connections
- ✅ Enable keepalive để tái sử dụng connections
- ✅ Set timeout ngắn để phát hiện lỗi nhanh
- ✅ Enable gzip compression
- ✅ Implement rate limiting theo IP
- ✅ Log request time để monitor performance

### **2. Spring Cloud Gateway**
- ✅ Sử dụng `lb://` prefix cho load balancing
- ✅ Enable circuit breaker cho tất cả services
- ✅ Implement retry với exponential backoff
- ✅ Set timeout phù hợp cho từng service
- ✅ Rate limiting theo service và user
- ✅ Monitor Eureka registry


### **3. Scaling**
- ✅ Scale services có traffic cao (Product, User)
- ✅ Monitor resource usage (CPU, Memory)
- ✅ Set resource limits trong docker-compose
- ✅ Test load balancing sau khi scale
- ✅ Implement graceful shutdown

### **4. Monitoring**
- ✅ Check Eureka dashboard thường xuyên
- ✅ Monitor NGINX access logs
- ✅ Track rate limiting metrics
- ✅ Monitor circuit breaker state
- ✅ Set up alerts cho service down

---

## 🚀 DEPLOYMENT WORKFLOW

### **1. Start hệ thống**
```bash
# Start tất cả services
docker-compose up -d

# Kiểm tra health
docker ps
curl http://localhost:8761  # Eureka
curl http://localhost/health  # NGINX
```

### **2. Scale services**
```bash
# Scale product-service
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3

# Verify
docker ps | grep product-service
curl http://localhost:8761  # Check Eureka
```

### **3. Test load balancing**
```bash
# Test NGINX
for i in {1..10}; do curl http://localhost/api/products; done

# Test rate limiting
for i in {1..200}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/products; done
```


### **4. Monitor**
```bash
# Watch logs
docker logs -f techshop-gateway
docker logs -f techshop-nginx

# Check metrics
curl http://localhost:8080/actuator/metrics
```

---

## 🔥 TROUBLESHOOTING

### **Problem 1: Service không đăng ký với Eureka**

**Triệu chứng:**
- Service không xuất hiện trong Eureka dashboard
- Gateway trả về 503 Service Unavailable

**Giải pháp:**
```bash
# 1. Check service logs
docker logs techshop-product-service

# 2. Check Eureka URL
docker exec techshop-product-service env | grep EUREKA

# 3. Restart service
docker restart techshop-product-service

# 4. Wait 30s và check lại Eureka
curl http://localhost:8761
```

---

### **Problem 2: Load balancing không hoạt động**

**Triệu chứng:**
- Tất cả requests đều đến 1 instance
- Không có round-robin distribution

**Giải pháp:**
```bash
# 1. Check số instances trong Eureka
curl http://localhost:8761

# 2. Check Gateway routing
curl http://localhost:8080/actuator/gateway/routes | jq

# 3. Enable debug logging
# Thêm vào application.yml:
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
```


---

### **Problem 3: Rate limiting quá strict**

**Triệu chứng:**
- Nhận 429 Too Many Requests quá sớm
- Không thể test được

**Giải pháp:**
```nginx
# Tăng rate limit trong nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=1000r/m;  # Tăng lên 1000/phút

# Hoặc tăng burst capacity
limit_req zone=api_limit burst=100 nodelay;
```

```yaml
# Tăng rate limit trong Gateway
redis-rate-limiter.replenishRate: 100  # Tăng lên 100/s
redis-rate-limiter.burstCapacity: 200  # Tăng burst
```

---

### **Problem 4: Circuit breaker OPEN liên tục**

**Triệu chứng:**
- Service trả về 503 ngay lập tức
- Logs hiển thị "Circuit breaker is OPEN"

**Giải pháp:**
```bash
# 1. Check service health
curl http://localhost:8082/actuator/health

# 2. Restart service
docker restart techshop-product-service

# 3. Wait 30s để circuit breaker chuyển sang HALF_OPEN
sleep 30

# 4. Gửi vài requests để test
curl http://localhost:8080/api/products
```

---

### **Problem 5: NGINX không forward requests**

**Triệu chứng:**
- 502 Bad Gateway
- NGINX logs: "connect() failed"

**Giải pháp:**
```bash
# 1. Check Gateway có chạy không
docker ps | grep gateway

# 2. Check network
docker network inspect techshop-network

# 3. Test connectivity
docker exec techshop-nginx ping gateway-service

# 4. Restart NGINX
docker restart techshop-nginx
```


---

## 📚 TÀI LIỆU THAM KHẢO

### **NGINX**
- [NGINX Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [NGINX Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [NGINX Upstream Module](http://nginx.org/en/docs/http/ngx_http_upstream_module.html)

### **Spring Cloud Gateway**
- [Spring Cloud Gateway Docs](https://spring.io/projects/spring-cloud-gateway)
- [Load Balancing with Spring Cloud](https://spring.io/guides/gs/spring-cloud-loadbalancer/)
- [Resilience4j Circuit Breaker](https://resilience4j.readme.io/docs/circuitbreaker)

### **Eureka**
- [Netflix Eureka](https://github.com/Netflix/eureka/wiki)
- [Spring Cloud Netflix](https://spring.io/projects/spring-cloud-netflix)

---

## 📝 SUMMARY

### **Hệ thống TechShop sử dụng:**

1. **NGINX Load Balancer**
   - External load balancing
   - Rate limiting (100 req/min API, 5 req/min login)
   - SSL termination
   - Static content serving

2. **Spring Cloud Gateway**
   - Internal load balancing với Eureka
   - Circuit breaker (50% failure rate, 30s open)
   - Retry logic (3 attempts, exponential backoff)
   - Per-service rate limiting

3. **Eureka Service Discovery**
   - Dynamic service registration
   - Health monitoring
   - Auto-discovery cho load balancing

4. **Horizontal Scaling**
   - Product service có thể scale lên nhiều instances
   - Tự động load balance qua Eureka
   - Resource limits (1GB RAM, 1 CPU/instance)


### **Key Features:**

✅ **2-tier Load Balancing** (NGINX + Gateway)  
✅ **Dynamic Service Discovery** (Eureka)  
✅ **Fault Tolerance** (Circuit Breaker + Retry)  
✅ **Rate Limiting** (NGINX + Gateway)  
✅ **Horizontal Scaling** (Docker Compose Scale)  
✅ **Health Monitoring** (Health checks + Actuator)  
✅ **High Availability** (Multiple instances)  
✅ **Auto Failover** (Automatic retry on failure)  

---

## 🎓 DEMO SCRIPT (Cho thuyết trình)

### **1. Giới thiệu kiến trúc (2 phút)**
```
"Hệ thống TechShop sử dụng 2-tier load balancing:
- Tier 1: NGINX làm external load balancer
- Tier 2: Spring Cloud Gateway với Eureka service discovery
- Cho phép scale horizontal và fault tolerance"
```

### **2. Demo Eureka Dashboard (1 phút)**
```bash
# Mở browser
http://localhost:8761

# Giải thích:
"Đây là Eureka dashboard, hiển thị tất cả services đã đăng ký.
Khi scale service, sẽ thấy nhiều instances ở đây."
```

### **3. Demo Scaling (2 phút)**
```bash
# Scale product-service lên 3 instances
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3

# Refresh Eureka dashboard
# Giải thích: "Bây giờ có 3 instances của product-service"
```

### **4. Demo Load Balancing (2 phút)**
```bash
# Gửi 10 requests
for i in {1..10}; do 
  curl -s http://localhost/api/products | jq '.message'
done

# Giải thích: "Requests được phân phối đều cho 3 instances"
```

### **5. Demo Rate Limiting (1 phút)**
```bash
# Gửi 200 requests nhanh
for i in {1..200}; do 
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/products
done | sort | uniq -c

# Giải thích: "Sau 120 requests, hệ thống trả về 429 Too Many Requests"
```

### **6. Demo Fault Tolerance (2 phút)**
```bash
# Stop 1 instance
docker stop techshop-product-service-1

# Gửi requests - vẫn hoạt động
curl http://localhost/api/products

# Giải thích: "Gateway tự động retry instance khác, người dùng không bị ảnh hưởng"
```

---

**Tổng thời gian demo: ~10 phút**

---

## 📞 CONTACT & SUPPORT

**Tác giả:** TechShop Development Team  
**Ngày tạo:** 2025  
**Version:** 1.0  

---

**🎉 Chúc bạn thành công với dự án TechShop! 🎉**
