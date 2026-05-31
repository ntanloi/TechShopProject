# K6 Rate Limiter Tests

Test rate limiter cho TechShop microservices bằng Grafana K6.

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
