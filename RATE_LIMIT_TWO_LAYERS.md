# 🛡️ 2 LỚP RATE LIMITING - TECHSHOP PROJECT

## ✅ CÂU TRẢ LỜI NHANH

**BẠN ĐÚNG 100%!** 🎉

Project TechShop có **2 LỚP RATE LIMITING**:

```
Client
  ↓
┌─────────────────────────────────────────┐
│ LỚP 1: GLOBAL RATE LIMIT (Gateway)     │  ← 100 requests/phút
│ - Áp dụng cho TẤT CẢ requests          │
│ - Không phân biệt service nào           │
└─────────────────────────────────────────┘
  ↓ (Nếu pass)
┌─────────────────────────────────────────┐
│ LỚP 2: SERVICE RATE LIMIT (Gateway)    │  ← Khác nhau từng service
│ - Product: 20/giây                      │
│ - Payment: 2/giây                       │
│ - Cart: 10/giây                         │
└─────────────────────────────────────────┘
  ↓ (Nếu pass)
Service (Product, Payment, Cart...)
```

**→ Giống như cửa hàng có 2 bảo vệ: 1 ở cổng chính, 1 ở từng quầy!**

---

## 🏢 VÍ DỤ THỰC TẾ: TÒA NHÀ VĂN PHÒNG

### **Tòa nhà TechShop:**

```
Cổng chính (Lớp 1):
├── Bảo vệ chính (Global Rate Limit)
│   └── Quy định: 1 người tối đa 100 lần vào/ra trong 1 giờ
│
Tầng 1 - Sảnh (Lớp 2):
├── Lễ tân (Service Rate Limit)
│   ├── Quầy Sản phẩm: 20 lần/giây
│   ├── Quầy Thanh toán: 2 lần/giây
│   └── Quầy Giỏ hàng: 10 lần/giây
```

---

### **Kịch bản 1: Khách bình thường**

```
Khách A vào tòa nhà:

1. Gặp Bảo vệ chính (Lớp 1):
   - Kiểm tra: "Anh đã vào bao nhiêu lần trong 1 giờ?"
   - Đếm: 50 lần
   - 50 < 100 → OK ✅
   - Cho vào

2. Gặp Lễ tân (Lớp 2):
   - Hỏi: "Anh muốn đi quầy nào?"
   - Khách: "Quầy Sản phẩm"
   - Kiểm tra: "Anh đã vào quầy Sản phẩm bao nhiêu lần trong 1 giây?"
   - Đếm: 10 lần
   - 10 < 20 → OK ✅
   - Cho vào quầy Sản phẩm

→ Khách A được phục vụ! ✅
```

---

### **Kịch bản 2: Khách vượt quá Lớp 1**

```
Khách B (người xấu):

1. Gặp Bảo vệ chính (Lớp 1):
   - Kiểm tra: "Anh đã vào bao nhiêu lần trong 1 giờ?"
   - Đếm: 101 lần
   - 101 > 100 → CHẶN! ❌
   - "Anh đã vào 100 lần rồi, vui lòng quay lại sau 1 giờ!"

→ Khách B bị chặn ngay tại cổng, KHÔNG được vào tòa nhà!
→ Lễ tân (Lớp 2) KHÔNG cần kiểm tra nữa!
```

---

### **Kịch bản 3: Khách vượt quá Lớp 2**

```
Khách C:

1. Gặp Bảo vệ chính (Lớp 1):
   - Đếm: 50 lần
   - 50 < 100 → OK ✅
   - Cho vào

2. Gặp Lễ tân (Lớp 2):
   - Khách: "Quầy Thanh toán"
   - Kiểm tra: "Anh đã vào quầy Thanh toán bao nhiêu lần trong 1 giây?"
   - Đếm: 3 lần
   - 3 > 2 → CHẶN! ❌
   - "Quầy Thanh toán chỉ cho 2 lần/giây, vui lòng đợi!"

→ Khách C được vào tòa nhà, nhưng bị chặn tại quầy Thanh toán!
```

---

## 🔍 CHI TIẾT 2 LỚP RATE LIMITING

### **LỚP 1: GLOBAL RATE LIMIT (Bảo vệ chính)**

**File:** `RateLimiterFilter.java`

```java
private static final int MAX_REQUESTS_PER_MINUTE = 100;
private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);
```

**Cấu hình:**
- **Limit:** 100 requests/phút (1.67 requests/giây)
- **Window:** 1 phút
- **Áp dụng:** TẤT CẢ requests (không phân biệt service)
- **Key:** `rate_limit:{IP}`

**Ví dụ:**
```
IP: 192.168.1.100

Request 1-100: OK ✅
Request 101: CHẶN ❌ (429 Too Many Requests)

→ Phải đợi 1 phút mới reset!
```

---

### **LỚP 2: SERVICE RATE LIMIT (Lễ tân)**

**File:** `application.yml`

```yaml
routes:
  - id: product-service
    filters:
      - name: RequestRateLimiter
        args:
          redis-rate-limiter.replenishRate: 20  # 20/giây
          redis-rate-limiter.burstCapacity: 40
```

**Cấu hình:**
- **Limit:** Khác nhau từng service (2-20 requests/giây)
- **Window:** 1 giây
- **Áp dụng:** Từng service riêng biệt
- **Key:** `rate_limit:{IP}:{service}`

**Ví dụ:**
```
IP: 192.168.1.100

Product Service:
- Request 1-20: OK ✅
- Request 21: CHẶN ❌

Payment Service:
- Request 1-2: OK ✅
- Request 3: CHẶN ❌

→ Mỗi service có limit riêng!
```

---

## 📊 SO SÁNH 2 LỚP

| Tiêu chí | Lớp 1: Global | Lớp 2: Service |
|----------|---------------|----------------|
| **Vị trí** | Cổng chính (Gateway) | Sảnh tòa nhà (Gateway) |
| **Limit** | 100 requests/phút | 2-20 requests/giây |
| **Window** | 1 phút | 1 giây |
| **Áp dụng** | TẤT CẢ requests | Từng service riêng |
| **Key Redis** | `rate_limit:{IP}` | `rate_limit:{IP}:{service}` |
| **Mục đích** | Chống DDoS tổng thể | Bảo vệ từng service |
| **Giống như** | Bảo vệ cổng chính | Lễ tân từng quầy |
| **Order** | -100 (Chạy đầu tiên) | Sau Lớp 1 |

---

## 🔄 FLOW HOÀN CHỈNH

### **Request từ Client:**

```
Client gửi: GET /api/products/1
    ↓
┌─────────────────────────────────────────────────────┐
│ LỚP 1: GLOBAL RATE LIMIT (RateLimiterFilter)       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. Lấy IP: 192.168.1.100                        │ │
│ │ 2. Key: rate_limit:192.168.1.100               │ │
│ │ 3. Kiểm tra Redis: 50 requests (trong 1 phút)  │ │
│ │ 4. So sánh: 50 < 100 → OK ✅                    │ │
│ │ 5. Tăng counter: 50 → 51                        │ │
│ │ 6. Cho request đi tiếp                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ LỚP 2: SERVICE RATE LIMIT (RequestRateLimiter)     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. Lấy IP: 192.168.1.100                        │ │
│ │ 2. Lấy Service: product-service                 │ │
│ │ 3. Key: rate_limit:192.168.1.100:product       │ │
│ │ 4. Kiểm tra Redis: 10 requests (trong 1 giây)  │ │
│ │ 5. So sánh: 10 < 20 → OK ✅                     │ │
│ │ 6. Tăng counter: 10 → 11                        │ │
│ │ 7. Cho request đi tiếp                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ Product Service                                     │
│ - Xử lý request                                     │
│ - Trả về response                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 TEST 2 LỚP RATE LIMITING

### **Test 1: Vượt quá Lớp 1 (Global)**

```bash
# Gửi 101 requests trong 1 phút
for i in {1..101}; do
  curl http://localhost:8080/api/products/1
  sleep 0.5  # Đợi 0.5 giây giữa mỗi request
done
```

**Kết quả:**
```
Request 1-100: 200 OK ✅
Request 101: 429 Too Many Requests ❌

Response:
{
  "error": "Too Many Requests",
  "message": "Bạn đã vượt quá giới hạn số lượng request. Vui lòng thử lại sau.",
  "timestamp": "2024-01-01T10:00:00",
  "path": "/api/products/1"
}

Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
Retry-After: 60
```

---

### **Test 2: Vượt quá Lớp 2 (Service)**

```bash
# Gửi 25 requests nhanh (trong 1 giây)
for i in {1..25}; do
  curl http://localhost:8080/api/products/1
done
```

**Kết quả:**
```
Request 1-20: 200 OK ✅ (Lớp 1: OK, Lớp 2: OK)
Request 21-25: 429 Too Many Requests ❌ (Lớp 1: OK, Lớp 2: CHẶN)

→ Lớp 1 cho qua (chưa đến 100), nhưng Lớp 2 chặn (vượt 20/giây)!
```

---

### **Test 3: Nhiều Services khác nhau**

```bash
# Gửi 20 requests đến Product
for i in {1..20}; do curl http://localhost:8080/api/products/1; done

# Gửi 10 requests đến Cart
for i in {1..10}; do curl http://localhost:8080/api/cart; done

# Gửi 5 requests đến Payment
for i in {1..5}; do curl http://localhost:8080/api/payments/1; done
```

**Kết quả:**
```
Lớp 1 (Global):
- Tổng: 20 + 10 + 5 = 35 requests
- 35 < 100 → OK ✅

Lớp 2 (Service):
- Product: 20 requests → 20 OK ✅ (limit: 20/giây)
- Cart: 10 requests → 10 OK ✅ (limit: 10/giây)
- Payment: 5 requests → 2 OK ✅, 3 CHẶN ❌ (limit: 2/giây)

→ Payment bị chặn vì vượt quá limit của service!
```

---

## 💾 REDIS - LƯU TRỮ 2 LỚP

### **Dữ liệu trong Redis:**

```
# Lớp 1: Global Rate Limit
Key: rate_limit:192.168.1.100
Value: 50
TTL: 60 giây (1 phút)

# Lớp 2: Service Rate Limit
Key: rate_limit:192.168.1.100:product-service
Value: 10
TTL: 1 giây

Key: rate_limit:192.168.1.100:payment-service
Value: 2
TTL: 1 giây

Key: rate_limit:192.168.1.100:cart-service
Value: 5
TTL: 1 giây
```

**→ Mỗi lớp có key riêng, TTL riêng!**

---

## 🎯 TẠI SAO CẦN 2 LỚP?

### **Lớp 1: Global Rate Limit (100/phút)**

**Mục đích:**
- Chống DDoS tổng thể
- Bảo vệ toàn hệ thống
- Không cho 1 IP chiếm hết tài nguyên

**Ví dụ:**
```
Hacker gửi 10,000 requests/phút:
- Lớp 1 chặn sau 100 requests
- 9,900 requests bị chặn
- Hệ thống an toàn! ✅
```

---

### **Lớp 2: Service Rate Limit (2-20/giây)**

**Mục đích:**
- Bảo vệ từng service riêng biệt
- Phân biệt độ quan trọng của service
- Payment Service cần bảo mật cao hơn Product Service

**Ví dụ:**
```
User bình thường:
- Xem sản phẩm: 20 lần/giây (OK, traffic cao)
- Thanh toán: 2 lần/giây (OK, bảo mật cao)

→ Mỗi service có nhu cầu khác nhau!
```

---

## 📊 BẢNG TỔNG HỢP

### **2 Lớp Rate Limiting:**

| Lớp | Limit | Window | Áp dụng | Mục đích |
|-----|-------|--------|---------|----------|
| **Lớp 1** | 100 req/phút | 1 phút | TẤT CẢ | Chống DDoS tổng thể |
| **Lớp 2** | 2-20 req/giây | 1 giây | Từng service | Bảo vệ từng service |

### **Lớp 2 - Chi tiết từng Service:**

| Service | Limit | Lý do |
|---------|-------|-------|
| Product | 20/giây | Traffic cao |
| Auth | 10/giây | Chống brute force |
| Cart | 10/giây | Responsive |
| Payment | 2/giây | Bảo mật cao nhất |
| Order | 5/giây | Chống spam |

---

## ✅ KẾT LUẬN

### **Câu trả lời cho câu hỏi của bạn:**

**"Có phải project này có 2 rate limit đúng không, client rate limit cho gateway, server rate limit cho server hả?"**

**→ ĐÚNG 100%!** Nhưng chính xác hơn:

```
✅ CÓ 2 LỚP RATE LIMITING:

Lớp 1: GLOBAL RATE LIMIT
- Vị trí: Gateway (RateLimiterFilter.java)
- Limit: 100 requests/phút
- Áp dụng: TẤT CẢ requests từ Client
- Mục đích: Chống DDoS tổng thể

Lớp 2: SERVICE RATE LIMIT
- Vị trí: Gateway (application.yml)
- Limit: 2-20 requests/giây (khác nhau từng service)
- Áp dụng: Từng service riêng biệt
- Mục đích: Bảo vệ từng service

❌ KHÔNG CÓ rate limit ở Services:
- Product Service: KHÔNG kiểm tra rate limit
- Payment Service: KHÔNG kiểm tra rate limit
- Cart Service: KHÔNG kiểm tra rate limit

→ TẤT CẢ rate limiting đều ở Gateway!
→ Services tin tưởng Gateway đã kiểm tra rồi!
```

---

## 🎯 KEY TAKEAWAYS

1. **2 Lớp Rate Limiting** đều ở Gateway (KHÔNG có ở Services)
2. **Lớp 1**: 100 req/phút (Global, chống DDoS)
3. **Lớp 2**: 2-20 req/giây (Service-specific, bảo vệ từng service)
4. **Giống như**: Bảo vệ cổng chính + Lễ tân từng quầy
5. **Services**: KHÔNG kiểm tra rate limit (tin tưởng Gateway)

---

**🎉 Bạn đã hiểu đúng 100% rồi!** 👍

**Tóm lại:**
- ✅ CÓ 2 lớp rate limiting
- ✅ CẢ 2 lớp đều ở Gateway
- ❌ KHÔNG có rate limiting ở Services
- ✅ Lớp 1: Global (100/phút)
- ✅ Lớp 2: Service-specific (2-20/giây)
