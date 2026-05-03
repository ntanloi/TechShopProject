# Fix: VNPay Callback Error

## 🐛 Vấn đề

Sau khi nhập OTP và xác nhận thanh toán trên VNPay, trang báo lỗi "Không thể truy cập trang web này" (ERR_CONNECTION_REFUSED).

## 🔍 Nguyên nhân

1. **Return URL sai:** Order Service đang dùng `http://localhost:3000/payment-success` thay vì `http://localhost:5173/payment-result`
2. **Frontend không verify payment:** PaymentResult component không gọi backend để verify payment

## ✅ Đã fix

### 1. Order Service - application.yml
```yaml
payment:
  return-url: http://localhost:5173/payment-result  # ✅ Fixed
```

### 2. PaymentResult.jsx
- ✅ Thêm API call để verify payment với backend
- ✅ Hiển thị message từ backend
- ✅ Redirect đúng order detail

## 🚀 Cách áp dụng fix

### Bước 1: Restart Order Service

```powershell
# Stop Order Service (Ctrl+C)
# Then restart
cd techshop-microservice/order-service
mvn spring-boot:run
```

### Bước 2: Restart Frontend (nếu cần)

```powershell
# Frontend sẽ tự reload nếu đang chạy dev mode
# Nếu không, restart:
cd techshop-frontend
npm run dev
```

### Bước 3: Test lại

1. Vào http://localhost:5173/checkout
2. Chọn VNPay
3. Click "Đặt hàng ngay"
4. Nhập thẻ test:
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày: `07/15`
   - OTP: `123456`
5. Click "Thanh toán"
6. ✅ Bạn sẽ thấy trang "Thanh toán thành công!"
7. ✅ Tự động chuyển đến order detail

## 📊 Flow sau khi fix

```
User nhập OTP và xác nhận
    ↓
VNPay xử lý thanh toán
    ↓
VNPay redirect về: http://localhost:5173/payment-result?vnp_ResponseCode=00&...
    ↓
Frontend PaymentResult component
    ↓
Gọi API: GET /payments/vnpay/callback với params
    ↓
Backend verify signature và update payment status
    ↓
Backend trả về success/failed
    ↓
Frontend hiển thị kết quả
    ↓
Auto redirect đến order detail (sau 3s)
```

## 🔍 Verify

### Check Return URL trong database

```sql
SELECT 
    id, 
    order_code, 
    payment_method,
    payment_status,
    SUBSTRING(payment_url, 1, 100) as payment_url_preview
FROM orders 
WHERE payment_method = 'VNPAY'
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Payment Service logs

```powershell
# Trong terminal đang chạy Payment Service
# Sau khi thanh toán, bạn sẽ thấy:
# "VNPay callback received for transaction: ..."
# "Payment verified and updated for transaction: ..."
```

### Check Order Service logs

```powershell
# Trong terminal đang chạy Order Service
# Bạn sẽ thấy:
# "Payment URL set for order X: https://sandbox.vnpayment.vn/..."
```

## 🐛 Troubleshooting

### Issue 1: Vẫn redirect về localhost:3000

**Solution:** 
1. Verify Order Service đã restart
2. Check application.yml có đúng return-url không
3. Clear browser cache

### Issue 2: Payment status không update

**Solution:**
1. Check Payment Service đang chạy
2. Check log của Payment Service
3. Verify signature đúng không

### Issue 3: Frontend báo lỗi CORS

**Solution:**
Add CORS config trong Payment Service:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE")
                        .allowedHeaders("*");
            }
        };
    }
}
```

## ✅ Success Criteria

Sau khi fix:
- ✅ Thanh toán thành công → Hiển thị "Thanh toán thành công!"
- ✅ Auto redirect đến order detail
- ✅ Payment status = PAID trong database
- ✅ Order status = CONFIRMED trong database

## 📝 Files Changed

1. `order-service/src/main/resources/application.yml` - Fixed return URL
2. `techshop-frontend/src/pages/PaymentResult.jsx` - Added API verification

---

**Status:** ✅ Fixed
**Priority:** High
**Impact:** Critical - Payment callback now works correctly
