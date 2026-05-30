# 📊 LOAD BALANCER ARCHITECTURE DIAGRAM

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUESTS                          │
│                    (Browser, Mobile App, etc.)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX LOAD BALANCER                           │
│                         (Port 80/443)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Least Connections Algorithm                           │   │
│  │  • Rate Limiting: 100 req/min (API), 5 req/min (Login)  │   │
│  │  • SSL/TLS Termination                                   │   │
│  │  • Gzip Compression                                      │   │
│  │  • Static Content Serving                                │   │
│  │  • Health Checks (30s interval)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SPRING CLOUD GATEWAY (API Gateway)                  │
│                         (Port 8080)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Round Robin Load Balancing                            │   │
│  │  • Service Discovery (Eureka Integration)                │   │
│  │  • Circuit Breaker (50% failure → OPEN 30s)             │   │
│  │  • Retry Logic (3 attempts, exponential backoff)         │   │
│  │  • Per-Service Rate Limiting (Redis-based)               │   │
│  │  • Request Routing & Filtering                           │   │
│  │  • CORS Handling                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EUREKA SERVICE DISCOVERY                        │
│                         (Port 8761)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Service Registration & Discovery                      │   │
│  │  • Health Monitoring (Heartbeat)                         │   │
│  │  • Instance Management                                   │   │
│  │  • Load Balancer Integration                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES LAYER                         │
└─────────────────────────────────────────────────────────────────┘

         ┌──────────────┬──────────────┬──────────────┬──────────────┐
         │              │              │              │              │
         ▼              ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │ User   │    │Product │    │ Order  │    │  Cart  │    │Payment │
    │Service │    │Service │    │Service │    │Service │    │Service │
    │ :8081  │    │ :8082  │    │ :8083  │    │ :8084  │    │ :8085  │
    └───┬────┘    └───┬────┘    └───┬────┘    └───┬────┘    └───┬────┘
        │             │              │              │              │
        │         ┌───┴───┐          │              │              │
        │         │       │          │              │              │
        │    ┌────▼──┐ ┌──▼────┐     │              │              │
        │    │Product│ │Product│     │              │              │
        │    │ Inst-2│ │ Inst-3│     │              │              │
        │    │:32769 │ │:32770 │     │              │              │
        │    └───────┘ └───────┘     │              │              │
        │                             │              │              │
        ▼              ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │MySQL   │    │MySQL   │    │MySQL   │    │MySQL   │    │MySQL   │
    │UserDB  │    │Product │    │OrderDB │    │CartDB  │    │Payment │
    │ :3307  │    │  DB    │    │ :3309  │    │ :3310  │    │  DB    │
    │        │    │ :3308  │    │        │    │        │    │ :3311  │
    └────────┘    └────────┘    └────────┘    └────────┘    └────────┘

         ┌──────────────┬──────────────┬──────────────┐
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │Notific │    │Inventor│    │ Review │    │   AI   │
    │ation   │    │  y     │    │Service │    │Service │
    │Service │    │Service │    │ :8087  │    │ :8089  │
    │ :8086  │    │ :8088  │    └───┬────┘    └───┬────┘
    └───┬────┘    └───┬────┘        │              │
        │             │              │              │
        ▼             ▼              ▼              ▼
    ┌────────┐    ┌────────┐    (Uses Product DB)  (AI Model)
    │MySQL   │    │MySQL   │
    │Notif DB│    │Invent  │
    │ :3312  │    │  DB    │
    │        │    │ :3313  │
    └────────┘    └────────┘

                             ┌────────┐
                             │ Redis  │
                             │ :6379  │
                             │(Cache &│
                             │ Rate   │
                             │Limiting│
                             └────────┘


---

## 🔄 REQUEST FLOW

### **Scenario 1: Normal Request (GET /api/products)**

```
1. Client Request
   │
   ├─→ http://localhost/api/products
   │
2. NGINX Load Balancer
   │
   ├─→ Check rate limit (100 req/min) ✓
   ├─→ Select backend (least_conn algorithm)
   ├─→ Forward to Gateway: http://gateway-service:8080/api/products
   │
3. Spring Cloud Gateway
   │
   ├─→ Match route: /api/products/** → product-service
   ├─→ Check rate limit (20 req/s) ✓
   ├─→ Query Eureka for product-service instances
   ├─→ Get: [instance-1:8082, instance-2:32769, instance-3:32770]
   ├─→ Round-robin selection → instance-2:32769
   ├─→ Forward: http://product-service-2:32769/products
   │
4. Product Service (Instance 2)
   │
   ├─→ Check Redis cache
   ├─→ If miss: Query MySQL Product DB
   ├─→ Return product list
   │
5. Response Flow
   │
   ├─→ Product Service → Gateway → NGINX → Client
   └─→ Status: 200 OK
```

---

### **Scenario 2: Service Failure & Retry**

```
1. Client Request
   │
   ├─→ http://localhost/api/products
   │
2. NGINX → Gateway → Eureka
   │
   ├─→ Select instance-1:8082
   │
3. Product Service Instance 1 (DOWN ❌)
   │
   ├─→ Connection timeout (5s)
   │
4. Gateway Retry Logic
   │
   ├─→ Attempt 1: instance-1 → FAIL (timeout)
   ├─→ Wait 3 seconds (exponential backoff)
   ├─→ Attempt 2: instance-2 → SUCCESS ✓
   │
5. Response
   │
   └─→ Status: 200 OK (User không biết có lỗi)
```


---

### **Scenario 3: Circuit Breaker OPEN**

```
1. Multiple Failures
   │
   ├─→ 10 requests to product-service
   ├─→ 6 requests FAIL (60% failure rate)
   │
2. Circuit Breaker Triggered
   │
   ├─→ Failure rate (60%) > Threshold (50%)
   ├─→ Circuit state: CLOSED → OPEN
   │
3. Subsequent Requests
   │
   ├─→ Client: http://localhost/api/products
   ├─→ Gateway: Circuit is OPEN ⚠️
   ├─→ Response: 503 Service Unavailable (immediate, no retry)
   │
4. After 30 seconds
   │
   ├─→ Circuit state: OPEN → HALF_OPEN
   ├─→ Allow 3 test requests
   │
5. If test requests succeed
   │
   ├─→ Circuit state: HALF_OPEN → CLOSED
   └─→ Normal operation resumed ✓
```

---

### **Scenario 4: Rate Limiting**

```
1. Burst Traffic (200 requests in 1 minute)
   │
2. NGINX Rate Limiter
   │
   ├─→ Request 1-100: PASS (100 req/min limit)
   ├─→ Request 101-120: PASS (burst capacity 20)
   ├─→ Request 121-200: REJECT ❌
   │
3. Response
   │
   ├─→ Status: 429 Too Many Requests
   └─→ Header: Retry-After: 60
```


---

## 🔀 LOAD BALANCING ALGORITHMS

### **NGINX: Least Connections**

```
┌─────────────────────────────────────────────────┐
│  Gateway Instance 1: 5 active connections       │ ← Selected
│  Gateway Instance 2: 8 active connections       │
│  Gateway Instance 3: 12 active connections      │
└─────────────────────────────────────────────────┘

Logic: Chọn instance có ít connections nhất
```

### **Spring Cloud Gateway: Round Robin**

```
Request 1 → Product Instance 1 (8082)
Request 2 → Product Instance 2 (32769)
Request 3 → Product Instance 3 (32770)
Request 4 → Product Instance 1 (8082)  ← Quay lại đầu
Request 5 → Product Instance 2 (32769)
...

Logic: Phân phối đều theo vòng tròn
```

---

## 📊 SCALING VISUALIZATION

### **Before Scaling**

```
┌──────────┐
│ Gateway  │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Product  │
│ Service  │
│  :8082   │
└──────────┘

Throughput: ~100 req/s
```

### **After Scaling (3 instances)**

```
┌──────────┐
│ Gateway  │
└────┬─────┘
     │
     ├─────────┬─────────┐
     ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Product-1│ │Product-2│ │Product-3│
│  :8082  │ │ :32769  │ │ :32770  │
└─────────┘ └─────────┘ └─────────┘

Throughput: ~300 req/s (3x improvement)
High Availability: 66% uptime even if 1 instance fails
```


---

## 🔐 SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: NGINX                                         │
│  • Rate Limiting (DDoS Protection)                      │
│  • IP-based throttling                                  │
│  • SSL/TLS Termination                                  │
│  • Request validation                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 2: Gateway                                       │
│  • JWT Token Validation                                 │
│  • Per-service rate limiting                            │
│  • Request/Response filtering                           │
│  • CORS policy enforcement                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 3: Microservices                                 │
│  • Business logic validation                            │
│  • Database access control                              │
│  • Data encryption                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 MONITORING POINTS

```
┌─────────────────────────────────────────────────────────┐
│  NGINX Metrics                                          │
│  • Active connections                                   │
│  • Request rate                                         │
│  • Response time                                        │
│  • Error rate (4xx, 5xx)                                │
│  • Rate limit hits                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Gateway Metrics                                        │
│  • Route-specific metrics                               │
│  • Circuit breaker state                                │
│  • Retry attempts                                       │
│  • Service discovery health                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Eureka Metrics                                         │
│  • Registered instances                                 │
│  • Heartbeat status                                     │
│  • Instance health                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Service Metrics                                        │
│  • CPU/Memory usage                                     │
│  • Request latency                                      │
│  • Database connection pool                             │
│  • Cache hit rate                                       │
└─────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0 | **Created:** 2025
