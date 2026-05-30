# 🛡️ RATE LIMIT CONFIGURATION - TECHSHOP PROJECT

## ✅ CÂU TRẢ LỜI NHANH

**Bạn hiểu đúng 100%!** 👍

```
Client → Gateway (Rate Limit ở đây) → Services
         ↓
    Gateway kiểm tra:
    - Client gửi bao nhiêu requests?
    - Vượt quá limit chưa?
    - Nếu vượt → CHẶN (429)
    - Nếu OK → Chuyển đến Service
```

**→ Gateway là "Bảo vệ cửa hàng", kiểm tra từng Client trước khi cho vào Services!**

---

## 📊 RATE LIMIT CỦA PROJECT TECHSHOP

### **Tổng quan:**

| Service | Replenish Rate | Burst Capacity | Mức độ |
|---------|----------------|----------------|--------|
| **Product Service** | 20/giây | 40 | 🔥 Cao nhất |
| **Auth Service** | 10/giây | 20 | 🔶 Cao |
| **Cart Service** | 10/giây | 20 | 🔶 Cao |
| **Inventory Service** | 10/giây | 20 | 🔶 Cao |
| **User Service** | 5/giây | 10 | 🔷 Trung bình |
| **Order Service** | 5/giây | 10 | 🔷 Trung bình |
| **Notification Service** | 5/giây | 10 | 🔷 Trung bình |
| **Review Service** | 5/giây | 10 | 🔷 Trung bình |
| **AI Service** | 5/giây | 10 | 🔷 Trung bình |
| **Payment Service** | 2/giây | 5 | 🔴 Thấp nhất (Bảo mật cao) |

---

## 🎯 CHI TIẾT TỪNG SERVICE

### **1. Product Service - 20/giây, Max 40** 🔥

```yaml
replenishRate: 20  # Mỗi giây được 20 requests
burstCapacity: 40  # Tối đa 40 requests cùng lúc
```

**Tại sao cao nhất?**
- Nhiều người xem sản phẩm
- Traffic cao nhất trong hệ thống
- Không nhạy cảm về bảo mật

**Ví dụ thực tế:**
```
Giây 1: User gửi 40 requests → 40 OK ✅ (dùng hết 40 thẻ)
Giây 2: Nạp thêm 20 thẻ → User gửi 30 requests → 20 OK ✅, 10 CHẶN ❌
Giây 3: Nạp thêm 20 thẻ → User gửi 10 requests → 10 OK ✅
```

---

### **2. Auth Service - 10/giây, Max 20** 🔶

```yaml
replenishRate: 10  # Mỗi giây được 10 requests
burstCapacity: 20  # Tối đa 20 requests cùng lúc
```

**Tại sao cao?**
- Đăng nhập, đăng ký thường xuyên
- Cần xử lý nhanh
- Nhưng cần bảo vệ khỏi brute force

**Ví dụ thực tế:**
```
User thử đăng nhập:
- Lần 1-20: OK ✅
- Lần 21: CHẶN ❌ (Phải đợi 1 giây)
→ Chống brute force attack!
```

---

### **3. Cart Service - 10/giây, Max 20** 🔶

```yaml
replenishRate: 10  # Mỗi giây được 10 requests
burstCapacity: 20  # Tối đa 20 requests cùng lúc
```

**Tại sao cao?**
- Người dùng thêm/xóa giỏ hàng nhiều
- Cần responsive (phản hồi nhanh)

**Ví dụ thực tế:**
```
User mua sắm:
- Thêm sản phẩm 1 → OK ✅
- Thêm sản phẩm 2 → OK ✅
- Xóa sản phẩm 1 → OK ✅
- Thêm sản phẩm 3 → OK ✅
... (tối đa 20 lần cùng lúc)
```

---

### **4. User Service - 5/giây, Max 10** 🔷

```yaml
replenishRate: 5   # Mỗi giây được 5 requests
burstCapacity: 10  # Tối đa 10 requests cùng lúc
```

**Tại sao trung bình?**
- Xem profile, cập nhật thông tin (ít hơn)
- Không cần quá cao

**Ví dụ thực tế:**
```
User xem profile:
- Xem profile → OK ✅
- Cập nhật tên → OK ✅
- Cập nhật email → OK ✅
- Cập nhật địa chỉ → OK ✅
- Cập nhật SĐT → OK ✅
- Request thứ 6 trong 1 giây → CHẶN ❌
```

---

### **5. Order Service - 5/giây, Max 10** 🔷

```yaml
replenishRate: 5   # Mỗi giây được 5 requests
burstCapacity: 10  # Tối đa 10 requests cùng lúc
```

**Tại sao trung bình?**
- Đặt hàng không thường xuyên
- Cần bảo vệ khỏi spam orders

**Ví dụ thực tế:**
```
User đặt hàng:
- Tạo order → OK ✅
- Xem order → OK ✅
- Hủy order → OK ✅
- Tạo order mới → OK ✅
- Tạo order thứ 6 trong 1 giây → CHẶN ❌
→ Chống spam orders!
```

---

### **6. Payment Service - 2/giây, Max 5** 🔴

```yaml
replenishRate: 2   # Mỗi giây được 2 requests
burstCapacity: 5   # Tối đa 5 requests cùng lúc
```

**Tại sao thấp nhất?**
- **BẢO MẬT CAO NHẤT!**
- Thanh toán liên quan đến tiền
- Chống fraud (gian lận)
- Chống spam payment requests

**Ví dụ thực tế:**
```
User thanh toán:
- Request 1: Tạo payment → OK ✅
- Request 2: Kiểm tra status → OK ✅
- Request 3: Retry payment → OK ✅
- Request 4: Kiểm tra lại → OK ✅
- Request 5: Retry lần 2 → OK ✅
- Request 6: CHẶN ❌ (Phải đợi 1 giây)

→ Chống spam payment, bảo vệ tiền!
```

---

## 🏢 KIẾN TRÚC RATE LIMITING

### **Cách hoạt động:**

```
┌─────────────────────────────────────────────────────┐
│  Client (Browser/Mobile App)                        │
└─────────────────────────────────────────────────────┘
                    ↓
        Gửi request: GET /api/products/1
                    ↓
┌─────────────────────────────────────────────────────┐
│  Gateway (Port 8080) - BẢO VỆ CỬA HÀNG             │
│  ┌───────────────────────────────────────────────┐  │
│  │  Rate Limiter (Redis)                         │  │
│  │  1. Lấy IP của Client: 192.168.1.100         │  │
│  │  2. Kiểm tra Redis:                           │  │
│  │     - Key: rate_limit:192.168.1.100          │  │
│  │     - Value: 15 requests (trong 1 giây)     │  │
│  │  3. So sánh với limit:                        │  │
│  │     - Product Service limit: 20/giây         │  │
│  │     - 15 < 20 → OK ✅                         │  │
│  │  4. Tăng counter: 15 → 16                    │  │
│  │  5. Cho request đi qua                        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                    ↓
        Request được chuyển đến Service
                    ↓
┌─────────────────────────────────────────────────────┐
│  Product Service (Port 8082)                        │
│  - Xử lý request                                    │
│  - Trả về response                                  │
└─────────────────────────────────────────────────────┘
```

---

### **Khi vượt quá limit:**

```
┌─────────────────────────────────────────────────────┐
│  Client gửi request thứ 21 trong 1 giây            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Gateway - Rate Limiter                             │
│  1. Lấy IP: 192.168.1.100                          │
│  2. Kiểm tra Redis: 20 requests                    │
│  3. So sánh: 20 ≥ 20 → VƯỢT QUÁ! ❌                │
│  4. CHẶN request                                    │
│  5. Trả về: 429 Too Many Requests                  │
└─────────────────────────────────────────────────────┘
                    ↓
        Response: 429 Too Many Requests
                    ↓
┌─────────────────────────────────────────────────────┐
│  Client nhận response:                              │
│  {                                                  │
│    "error": "Too Many Requests",                   │
│    "message": "Rate limit exceeded"                │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 KEY RESOLVER (PHÂN BIỆT CLIENT)

### **Cấu hình:**

```yaml
key-resolver: "#{@ipKeyResolver}"
```

### **Code Java:**

```java
@Bean
public KeyResolver ipKeyResolver() {
    return exchange -> Mono.just(
        exchange.getRequest()
                .getRemoteAddress()
                .getAddress()
                .getHostAddress()
    );
}
```

### **Giải thích:**

**Mỗi IP có 1 bucket riêng:**

```
IP 192.168.1.100 (User A):
├── Product Service: 20/giây
├── Payment Service: 2/giây
└── Cart Service: 10/giây

IP 192.168.1.101 (User B):
├── Product Service: 20/giây
├── Payment Service: 2/giây
└── Cart Service: 10/giây

→ User A và User B KHÔNG ẢNH HƯỞNG lẫn nhau!
```

**Ví dụ:**
```
User A gửi 20 requests/giây → OK ✅
User B gửi 20 requests/giây → OK ✅
User C gửi 20 requests/giây → OK ✅

→ Mỗi user có limit riêng!
```

---

## 💾 REDIS - LƯU TRỮ RATE LIMIT

### **Tại sao dùng Redis?**

```
Gateway 1 ←→ Redis ←→ Gateway 2
                ↕
            Gateway 3

→ Tất cả Gateway đều xem chung 1 Redis
→ Rate limit được đồng bộ!
```

### **Cấu hình Redis:**

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 60000
```

### **Dữ liệu trong Redis:**

```
Key: rate_limit:192.168.1.100:product-service
Value: 15
TTL: 1 giây

Key: rate_limit:192.168.1.100:payment-service
Value: 1
TTL: 1 giây

→ Sau 1 giây, Redis tự động xóa → Reset counter!
```

---

## 🎯 SO SÁNH: CLIENT vs SERVER RATE LIMIT

### **Bạn hỏi: "Client cho gateway và server limit cho các service đúng không?"**

**✅ ĐÚNG 100%!** Nhưng cần hiểu rõ hơn:

### **1. Client → Gateway (Rate Limit ở Gateway)**

```
Client (IP: 192.168.1.100)
    ↓
Gateway kiểm tra:
- Product Service: 20/giây
- Payment Service: 2/giây
- Cart Service: 10/giây
    ↓
Nếu vượt quá → CHẶN (429)
Nếu OK → Chuyển đến Service
```

**→ Gateway là "Bảo vệ cửa hàng", kiểm tra TRƯỚC KHI vào!**

---

### **2. Gateway → Service (Không có Rate Limit)**

```
Gateway
    ↓
Product Service (Không kiểm tra rate limit)
    ↓
Xử lý request
    ↓
Trả về response
```

**→ Service KHÔNG kiểm tra rate limit, vì Gateway đã kiểm tra rồi!**

---

### **Tóm lại:**

| Vị trí | Rate Limit? | Ai kiểm tra? | Mục đích |
|--------|-------------|--------------|----------|
| **Client → Gateway** | ✅ CÓ | Gateway | Bảo vệ toàn hệ thống |
| **Gateway → Service** | ❌ KHÔNG | Không ai | Service tin tưởng Gateway |

**→ Giống như:**
- **Bảo vệ cửa hàng** (Gateway): Kiểm tra khách trước khi vào
- **Nhân viên trong cửa hàng** (Service): Không kiểm tra nữa, vì bảo vệ đã kiểm tra rồi!

---

## 📊 BẢNG TỔNG HỢP

### **Rate Limit của TechShop:**

| Service | Path | Replenish Rate | Burst Capacity | Requests/phút | Requests/giờ |
|---------|------|----------------|----------------|---------------|--------------|
| **Product** | /api/products/** | 20/s | 40 | 1,200 | 72,000 |
| **Auth** | /api/auth/** | 10/s | 20 | 600 | 36,000 |
| **Cart** | /api/cart/** | 10/s | 20 | 600 | 36,000 |
| **Inventory** | /api/inventory/** | 10/s | 20 | 600 | 36,000 |
| **User** | /api/users/** | 5/s | 10 | 300 | 18,000 |
| **Order** | /api/orders/** | 5/s | 10 | 300 | 18,000 |
| **Notification** | /api/notifications/** | 5/s | 10 | 300 | 18,000 |
| **Review** | /api/reviews/** | 5/s | 10 | 300 | 18,000 |
| **AI** | /api/ai/** | 5/s | 10 | 300 | 18,000 |
| **Payment** | /api/payments/** | 2/s | 5 | 120 | 7,200 |

---

## 🧪 TEST RATE LIMITING

### **Test 1: Product Service (20/giây)**

```bash
# Gửi 25 requests nhanh
for i in {1..25}; do
  curl http://localhost:8080/api/products/1
done
```

**Kết quả:**
```
Request 1-20: 200 OK ✅
Request 21-25: 429 Too Many Requests ❌
```

---

### **Test 2: Payment Service (2/giây)**

```bash
# Gửi 5 requests nhanh
for i in {1..5}; do
  curl http://localhost:8080/api/payments/1
done
```

**Kết quả:**
```
Request 1-2: 200 OK ✅
Request 3-5: 429 Too Many Requests ❌
```

---

### **Test 3: Đợi 1 giây rồi gửi lại**

```bash
# Gửi 20 requests
for i in {1..20}; do curl http://localhost:8080/api/products/1; done

# Đợi 1 giây
sleep 1

# Gửi 20 requests nữa
for i in {1..20}; do curl http://localhost:8080/api/products/1; done
```

**Kết quả:**
```
Lần 1: 20 requests → 20 OK ✅
Đợi 1 giây → Redis reset counter
Lần 2: 20 requests → 20 OK ✅
```

---

## ✅ KẾT LUẬN

### **Câu trả lời cho câu hỏi của bạn:**

**1. Rate limit của project này đang là bao nhiêu?**
- Product: 20/giây (cao nhất)
- Payment: 2/giây (thấp nhất)
- Các service khác: 5-10/giây

**2. Client cho gateway và server limit cho các service đúng không?**
- ✅ **ĐÚNG!** Client gửi request → Gateway kiểm tra rate limit → Nếu OK → Chuyển đến Service
- Gateway là "Bảo vệ cửa hàng", kiểm tra TRƯỚC KHI cho vào
- Service KHÔNG kiểm tra rate limit nữa (tin tưởng Gateway)

---

## 🎯 KEY TAKEAWAYS

1. **Gateway** = Bảo vệ cửa hàng (kiểm tra rate limit)
2. **Service** = Nhân viên trong cửa hàng (không kiểm tra nữa)
3. **Redis** = Sổ ghi chép của bảo vệ (lưu counter)
4. **IP-based** = Mỗi IP có limit riêng
5. **Product cao nhất** (20/s), **Payment thấp nhất** (2/s)

---

**🎉 Bạn đã hiểu đúng 100% rồi!** 👍
