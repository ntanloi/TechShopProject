# K6 Tests - TechShop Microservices

Test rate limiter và scalability cho TechShop microservices bằng Grafana K6.

## Cài đặt K6

```bash
# Windows (Chocolatey)
choco install k6

# Windows (MSI installer)
# Download từ: https://github.com/grafana/k6/releases

# macOS
brew install k6

# Docker
docker run --rm -i grafana/k6 run - <script.js
```

## Chạy Tests

### 1. Test Server-side Rate Limiter (Gateway + Redis)

```bash
# Test product service (default)
k6 run test-server-rate-limiter.js

# Test service cụ thể
k6 run -e SERVICE=payment test-server-rate-limiter.js
k6 run -e SERVICE=user test-server-rate-limiter.js
k6 run -e SERVICE=order test-server-rate-limiter.js
k6 run -e SERVICE=cart test-server-rate-limiter.js

# Custom base URL
k6 run -e BASE_URL=http://192.168.1.100:8080 -e SERVICE=product test-server-rate-limiter.js
```

### 2. Test Client-side Rate Limiter (Frontend logic)

```bash
# Test default endpoint (/api/products)
k6 run test-client-rate-limiter.js

# Test endpoint cụ thể
k6 run -e ENDPOINT=/api/orders test-client-rate-limiter.js
k6 run -e ENDPOINT=/api/payments test-client-rate-limiter.js
```

## Cấu hình Rate Limit hiện tại

### Server-side (Gateway - Redis Token Bucket)

| Service    | replenishRate (req/s) | burstCapacity |
|------------|----------------------|---------------|
| Product    | 20                   | 40            |
| Auth       | 10                   | 20            |
| Cart       | 10                   | 20            |
| Inventory  | 10                   | 20            |
| User       | 5                    | 10            |
| Order      | 5                    | 10            |
| Review     | 5                    | 10            |
| Notification | 5                  | 10            |
| AI         | 5                    | 10            |
| Payment    | 2                    | 5             |

### Client-side (Frontend Axios Interceptor)

- 20 requests / 60 giây / endpoint
- Chặn request ở interceptor trước khi gửi lên server

## Kết quả

Kết quả được lưu tại `results/` folder dưới dạng JSON.

## Lưu ý

- Đảm bảo gateway-service và Redis đang chạy trước khi test
- Server rate limiter dùng IP-based key resolver, nên tất cả request từ K6 sẽ cùng 1 IP
- Client rate limiter test mô phỏng logic frontend (K6 không chạy trên browser)

---

## 3. Scalability Test - Load Balancer (0 → 4000 VUs)

### Mục tiêu
Chứng minh kỹ thuật **Horizontal Scaling**: scale `product-service` lên 3 instances, Eureka + Spring Cloud Gateway tự động phân phối request theo Round Robin. Log rõ từng request được xử lý bởi instance nào.

### Bước 1: Scale product-service lên 3 instances

```bash
# Từ thư mục gốc project
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3
```

### Bước 2: Kiểm tra 3 instances đã đăng ký Eureka

```bash
# Xem Eureka dashboard
curl http://localhost:8761/eureka/apps/PRODUCT-SERVICE

# Hoặc mở browser: http://localhost:8761
# Tìm PRODUCT-SERVICE → phải thấy 3 instances
```

### Bước 3: Chạy scalability test

```bash
# Chạy từ thư mục gốc
k6 run k6-tests/test-scalability-load-balancer.js

# Với custom base URL
k6 run -e BASE_URL=http://localhost:8080 k6-tests/test-scalability-load-balancer.js

# Windows
"C:\Program Files\k6\k6.exe" run k6-tests/test-scalability-load-balancer.js

# Lưu log ra file để phân tích instance distribution
k6 run k6-tests/test-scalability-load-balancer.js 2>&1 | tee k6-tests/results/scalability-result.log
```

### Bước 4: Phân tích phân phối theo instance

```bash
# Linux/macOS - đếm request theo instance
grep "Instance:" k6-tests/results/scalability-result.log \
  | grep -oP "Instance: \[\K[^\]]+" \
  | sort | uniq -c | sort -rn

# Windows PowerShell
Select-String -Path k6-tests/results/scalability-result.log -Pattern "Instance: \[" |
  ForEach-Object { ($_ -match "Instance: \[([^\]]+)\]") | Out-Null; $Matches[1] } |
  Group-Object | Sort-Object Count -Descending | Format-Table Count, Name
```

### Load Profile

| Giai đoạn   | Thời gian | VUs          | Mục đích                    |
|-------------|-----------|--------------|------------------------------|
| Warm-up     | 0-1m      | 0 → 50       | Khởi động, kiểm tra cơ bản  |
| Ramp Low    | 1-4m      | 50 → 500     | Tăng dần, quan sát LB        |
| Ramp Medium | 4-7m      | 500 → 2000   | Stress test                  |
| Peak Load   | 8-13m     | 2000 → 4000  | Chứng minh scalability       |
| Ramp Down   | 13-15m    | 4000 → 0     | Graceful shutdown            |

### Thresholds (SLA)

| Metric              | Target       |
|---------------------|--------------|
| p95 response time   | < 3000ms     |
| p99 response time   | < 5000ms     |
| Error rate          | < 5%         |
| Product API p95     | < 2000ms     |

### Kết quả mong đợi

- Requests phân phối đều ~33% cho mỗi trong 3 instances
- Hệ thống xử lý được 4000 VUs concurrent
- Log format: `✅ VU:0042 | GET  /api/products?page=0         | 200 |   145ms | Instance: [abc123:8082]`

### Tạo test users (nếu chưa có)

Test cần 5 accounts pre-seeded. Nếu chưa có, tạo bằng:

```bash
for i in 1 2 3 4 5; do
  curl -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"testuser${i}@techshop.com\",\"password\":\"Test@123456\",\"fullName\":\"Test User ${i}\"}"
done
```

