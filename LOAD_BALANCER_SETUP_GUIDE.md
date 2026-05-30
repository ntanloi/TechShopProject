# 🔧 HƯỚNG DẪN CÀI ĐẶT LOAD BALANCER - DỄ HIỂU

## ✅ CÂU TRẢ LỜI NHANH

**Load Balancer cần:**

### **1. NGINX Load Balancer:**
- ❌ **KHÔNG CẦN** cài thư viện
- ✅ Chỉ cần: File config + Docker container

### **2. Gateway Load Balancer:**
- ✅ **CẦN** cài thư viện (Spring Cloud)
- ✅ Cần: Dependencies + Config file

**→ Hệ thống TechShop ĐÃ CÀI ĐẶT Gateway, CHƯA CÀI NGINX!** ⚠️

---

## 🎯 PHẦN 1: NGINX LOAD BALANCER

### **NGINX KHÔNG CẦN THƯ VIỆN!**

**Tại sao?**
- NGINX là **phần mềm độc lập** (standalone software)
- Chạy trong Docker container riêng
- Không phải thư viện Java/Spring

**Giống như:**
- Redis: Phần mềm độc lập (không cần thư viện)
- MySQL: Phần mềm độc lập (không cần thư viện)
- NGINX: Phần mềm độc lập (không cần thư viện)

---

### **BƯỚC 1: Tạo file cấu hình NGINX**

**File:** `nginx/nginx.conf`

```nginx
# NGINX Load Balancer Configuration
user nginx;
worker_processes auto;

events {
    worker_connections 2048;
}

http {
    # Upstream - Gateway Load Balancing
    upstream gateway_backend {
        least_conn;  # Thuật toán load balancing
        
        # Gateway instances
        server gateway-service:8080 max_fails=3 fail_timeout=30s;
        
        # Nếu có nhiều Gateway (sau khi scale):
        # server gateway-service-1:8080;
        # server gateway-service-2:8080;
        # server gateway-service-3:8080;
        
        keepalive 32;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    
    # Server configuration
    server {
        listen 80;
        server_name localhost;
        
        # Health check
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # API Gateway proxy
        location /api/ {
            # Rate limiting
            limit_req zone=api_limit burst=20 nodelay;
            
            # Proxy to Gateway
            proxy_pass http://gateway_backend;
            proxy_http_version 1.1;
            
            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_read_timeout 60s;
            
            # Error handling
            proxy_next_upstream error timeout http_502 http_503;
        }
    }
}
```

**Vị trí file:**
```
TechShopProject/
└── nginx/
    └── nginx.conf  ← Tạo file này
```

**✅ TechShop đã có:** File này đã tồn tại!

---

### **BƯỚC 2: Thêm NGINX vào docker-compose.yml**

**File:** `docker-compose.yml`

```yaml
services:
  # ... các services khác ...
  
  # NGINX Load Balancer
  nginx:
    image: nginx:alpine        # ← Không cần cài, chỉ cần image
    container_name: techshop-nginx
    ports:
      - "80:80"                # Expose port 80
      - "443:443"              # Expose port 443 (HTTPS)
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  # Mount config
    networks:
      - techshop-network
    depends_on:
      - gateway-service
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

**Giải thích:**
- `image: nginx:alpine`: Dùng NGINX image (đã có sẵn load balancer)
- `volumes`: Mount file config vào container
- `ports`: Expose port 80 (HTTP)
- `depends_on`: Đợi Gateway start trước

**❌ TechShop chưa có:** Cần thêm vào docker-compose.yml!

---

## 🎯 PHẦN 2: GATEWAY LOAD BALANCER

### **GATEWAY CẦN THƯ VIỆN!**

**Tại sao?**
- Gateway là **ứng dụng Spring Boot**
- Cần thư viện Spring Cloud để load balance
- Load balance dựa trên Eureka Service Discovery

**Giống như:**
- Redis caching: Cần thư viện `spring-boot-starter-data-redis`
- Gateway load balancing: Cần thư viện `spring-cloud-starter-loadbalancer`

---

### **BƯỚC 3: Thêm Dependencies vào Gateway**

**File:** `techshop-microservice/gateway-service/pom.xml`

```xml
<dependencies>
    <!-- 1. Spring Cloud Gateway - Core gateway functionality -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
    </dependency>
    
    <!-- 2. Eureka Client - Service Discovery -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    
    <!-- 3. Load Balancer - QUAN TRỌNG! -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-loadbalancer</artifactId>
    </dependency>
    
    <!-- 4. Resilience4j - Circuit Breaker & Retry -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
    </dependency>
    
    <!-- 5. Redis - Rate Limiting -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>
</dependencies>
```

**Giải thích từng thư viện:**

| Thư viện | Công dụng | Giống như |
|----------|-----------|-----------|
| `spring-cloud-starter-gateway` | Core Gateway | Bộ não của Gateway |
| `spring-cloud-starter-netflix-eureka-client` | Kết nối Eureka | Danh bạ điện thoại |
| `spring-cloud-starter-loadbalancer` | **Load Balancing** | **Người phân phối công việc** |
| `spring-cloud-starter-circuitbreaker-reactor-resilience4j` | Circuit Breaker | Cầu dao tự động |
| `spring-boot-starter-data-redis-reactive` | Rate Limiting | Bảo vệ cửa hàng |

**✅ TechShop đã có:** Tất cả dependencies đã được cài đặt!

---

### **BƯỚC 4: Cấu hình Load Balancer trong application.yml**

**File:** `techshop-microservice/gateway-service/src/main/resources/application.yml`

```yaml
spring:
  cloud:
    gateway:
      routes:
        # ======================================================
        # Product Service - Load Balanced
        # ======================================================
        - id: product-service
          uri: lb://product-service  # ← lb:// = Load Balancer!
          predicates:
            - Path=/api/products/**, /api/categories/**
          filters:
            - StripPrefix=1
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE
                methods: GET
                backoff:
                  firstBackoff: 3000ms
                  maxBackoff: 10000ms
                  factor: 2
        
        # ======================================================
        # User Service - Load Balanced
        # ======================================================
        - id: user-service
          uri: lb://user-service  # ← lb:// = Load Balancer!
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
        
        # ======================================================
        # Order Service - Load Balanced
        # ======================================================
        - id: order-service
          uri: lb://order-service  # ← lb:// = Load Balancer!
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE

      discovery:
        locator:
          enabled: true  # ← Tự động phát hiện services từ Eureka
          lower-case-service-id: true

# Eureka Configuration
eureka:
  client:
    register-with-eureka: true  # Đăng ký Gateway với Eureka
    fetch-registry: true        # Lấy danh sách services từ Eureka
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**🔑 KEY POINT: `lb://` là Load Balancer!**

```yaml
# ❌ KHÔNG LOAD BALANCE (hard-coded URL)
uri: http://localhost:8082

# ✅ CÓ LOAD BALANCE (dynamic discovery)
uri: lb://product-service
```

**Cách hoạt động:**
1. Gateway nhận request: `/api/products/123`
2. Gateway tìm `product-service` trong Eureka
3. Eureka trả về: `product-service-1`, `product-service-2`, `product-service-3`
4. Load Balancer chọn 1 instance (Round Robin)
5. Gateway gửi request đến instance đó

**✅ TechShop đã có:** Tất cả routes đã dùng `lb://`!

---

### **BƯỚC 5: Setup Eureka Server (Service Discovery)**

**Eureka là gì?**
- **Danh bạ điện thoại** của hệ thống
- Lưu địa chỉ của tất cả services
- Gateway hỏi Eureka: "Product Service ở đâu?"
- Eureka trả lời: "Có 3 instances: 8082, 8092, 8102"

**File:** `techshop-microservice/discovery-service/pom.xml`

```xml
<dependencies>
    <!-- Eureka Server -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
    </dependency>
</dependencies>
```

**File:** `techshop-microservice/discovery-service/src/main/resources/application.yml`

```yaml
server:
  port: 8761

spring:
  application:
    name: discovery-service

eureka:
  client:
    register-with-eureka: false  # Eureka không đăng ký chính nó
    fetch-registry: false
  server:
    enable-self-preservation: false  # Tắt self-preservation (dev mode)
```

**File:** `techshop-microservice/discovery-service/src/main/java/com/techshop/discoveryservice/DiscoveryServiceApplication.java`

```java
@SpringBootApplication
@EnableEurekaServer  // ← Bật Eureka Server
public class DiscoveryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServiceApplication.class, args);
    }
}
```

**✅ TechShop đã có:** Eureka Server đã được setup!

---

### **BƯỚC 6: Đăng ký Services với Eureka**

**Mỗi service cần:**

**1. Thêm Eureka Client dependency:**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

**2. Cấu hình application.yml:**

```yaml
spring:
  application:
    name: product-service  # ← Tên service (quan trọng!)

eureka:
  client:
    register-with-eureka: true   # Đăng ký với Eureka
    fetch-registry: true         # Lấy danh sách services
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

**3. Thêm @EnableDiscoveryClient (optional):**

```java
@SpringBootApplication
@EnableDiscoveryClient  // ← Optional (auto-enabled)
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
```

**✅ TechShop đã có:** Tất cả services đã đăng ký với Eureka!

---

### **BƯỚC 7: Scale Services (Horizontal Scaling)**

**Cách scale Product Service:**

**Option 1: Docker Compose Scale**

```bash
# Scale Product Service lên 3 instances
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3
```

**File:** `docker-compose.scale.yml`

```yaml
services:
  product-service:
    container_name: !reset null  # ← Xóa fixed container name
    ports: !override
      - "8082"  # ← Dynamic port (Docker tự chọn)
    mem_limit: 1g
    cpus: 1.0
```

**Option 2: Manual Scale (Dev mode)**

```bash
# Instance 1
java -jar product-service.jar --server.port=8082

# Instance 2
java -jar product-service.jar --server.port=8092

# Instance 3
java -jar product-service.jar --server.port=8102
```

**Kết quả:**
- Eureka Dashboard: `http://localhost:8761`
- Sẽ thấy 3 instances của `product-service`
- Gateway tự động load balance giữa 3 instances

**✅ TechShop đã có:** File `docker-compose.scale.yml` đã sẵn sàng!

---

### **BƯỚC 8: Testing Load Balancer**

**Test 1: Kiểm tra Eureka Dashboard**

```bash
# Mở browser
http://localhost:8761
```

**Kết quả mong đợi:**
```
Instances currently registered with Eureka:
- GATEWAY-SERVICE: 1 instance
- PRODUCT-SERVICE: 3 instances
- USER-SERVICE: 1 instance
- ORDER-SERVICE: 1 instance
```

---

**Test 2: Test Load Balancing**

```bash
# Gửi 10 requests
for i in {1..10}; do
  curl http://localhost:8080/api/products/1
  echo ""
done
```

**Kiểm tra logs:**
```bash
# Xem logs của 3 Product Service instances
docker logs techshop-product-service-1
docker logs techshop-product-service-2
docker logs techshop-product-service-3
```

**Kết quả mong đợi:**
- Mỗi instance nhận ~3-4 requests (Round Robin)
- Không có instance nào nhận tất cả 10 requests

---

**Test 3: Test Failover (Tính năng tự động chuyển đổi)**

```bash
# Stop 1 instance
docker stop techshop-product-service-1

# Gửi requests
curl http://localhost:8080/api/products/1
```

**Kết quả mong đợi:**
- Request vẫn thành công
- Gateway tự động chuyển sang instance 2 hoặc 3
- Không có downtime

---

**Test 4: Test với JMeter (Load Testing)**

```bash
# Cài JMeter
# Tạo test plan: 100 users, 1000 requests

# Kết quả mong đợi:
- Throughput: 500-1000 req/s
- Response time: < 100ms
- Error rate: < 1%
```

---

## 📋 CHECKLIST TỔNG HỢP

### **NGINX Load Balancer:**

- [x] File `nginx/nginx.conf` đã tồn tại
- [ ] Thêm NGINX vào `docker-compose.yml`
- [ ] Start NGINX: `docker-compose up -d nginx`
- [ ] Test: `curl http://localhost/health`

### **Gateway Load Balancer:**

- [x] Dependencies trong `pom.xml`
  - [x] `spring-cloud-starter-gateway`
  - [x] `spring-cloud-starter-netflix-eureka-client`
  - [x] `spring-cloud-starter-loadbalancer`
- [x] Routes dùng `lb://` trong `application.yml`
- [x] Eureka Server đã setup
- [x] Services đã đăng ký với Eureka
- [x] File `docker-compose.scale.yml` đã sẵn sàng
- [ ] Test scaling: `docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3`
- [ ] Kiểm tra Eureka Dashboard: `http://localhost:8761`

---

## 🔄 SO SÁNH: NGINX vs GATEWAY

| Tiêu chí | NGINX | Gateway |
|----------|-------|---------|
| **Cài đặt** | ❌ Không cần thư viện | ✅ Cần thư viện Spring Cloud |
| **Loại** | Phần mềm độc lập | Ứng dụng Spring Boot |
| **Config** | File `nginx.conf` | File `application.yml` |
| **Load Balance** | Upstream block | `lb://` + Eureka |
| **Discovery** | Static (hard-coded) | Dynamic (Eureka) |
| **Scaling** | Manual update config | Automatic (Eureka) |
| **Vị trí** | Trước Gateway | Trước Services |
| **Công dụng** | Load balance Gateway | Load balance Services |

---

## 🎯 TÓM TẮT NHANH

### **NGINX:**
```bash
# 1. Tạo file config
nginx/nginx.conf

# 2. Thêm vào docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro

# 3. Start
docker-compose up -d nginx
```

### **Gateway:**
```xml
<!-- 1. Thêm dependencies -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

```yaml
# 2. Cấu hình routes
spring:
  cloud:
    gateway:
      routes:
        - id: product-service
          uri: lb://product-service  # ← Load Balancer!
```

```bash
# 3. Scale services
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3
```

---

## ✅ KẾT LUẬN

**Hệ thống TechShop:**

| Component | Status | Action Needed |
|-----------|--------|---------------|
| **Gateway Load Balancer** | ✅ Đã cài đặt | Không cần làm gì |
| **Eureka Server** | ✅ Đã cài đặt | Không cần làm gì |
| **Services Registration** | ✅ Đã cài đặt | Không cần làm gì |
| **Scaling Config** | ✅ Đã cài đặt | Chỉ cần chạy lệnh scale |
| **NGINX Load Balancer** | ❌ Chưa deploy | Cần thêm vào docker-compose.yml |

**→ Chỉ cần thêm NGINX vào docker-compose.yml là xong!** 🎉

---

## 🚀 HƯỚNG DẪN DEPLOY NHANH (2 PHÚT)

### **Bước 1: Thêm NGINX vào docker-compose.yml**

```yaml
services:
  # ... các services khác ...
  
  nginx:
    image: nginx:alpine
    container_name: techshop-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - techshop-network
    depends_on:
      - gateway-service
    restart: unless-stopped
```

### **Bước 2: Start toàn bộ hệ thống**

```bash
# Start tất cả services
docker-compose up -d

# Scale Product Service
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3

# Kiểm tra
docker ps
curl http://localhost/health
curl http://localhost:8761
```

### **Bước 3: Test Load Balancer**

```bash
# Test NGINX → Gateway
curl http://localhost/api/products

# Test Gateway → Product Service (3 instances)
for i in {1..10}; do curl http://localhost:8080/api/products/1; done
```

**→ DONE! Load Balancer đã hoạt động!** ✅

---

## 📚 TÀI LIỆU THAM KHẢO

- [LOAD_BALANCER_DOCUMENTATION.md](./LOAD_BALANCER_DOCUMENTATION.md) - Tài liệu chi tiết
- [LOAD_BALANCER_EXPLAINED.md](./LOAD_BALANCER_EXPLAINED.md) - Giải thích dễ hiểu
- [LOAD_BALANCER_QUICK_REFERENCE.md](./LOAD_BALANCER_QUICK_REFERENCE.md) - Tham khảo nhanh
- [LOAD_BALANCER_ASSESSMENT.md](./LOAD_BALANCER_ASSESSMENT.md) - Đánh giá hệ thống

---

**🎉 Chúc bạn thành công!**
