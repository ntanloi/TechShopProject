# Fix: VNPay Redirect Issue

## 🐛 Vấn đề

Khi chọn thanh toán VNPay, trang web chuyển thẳng đến order detail thay vì redirect đến trang thanh toán VNPay.

## 🔍 Nguyên nhân

Order Service tạo payment nhưng không trả về `paymentUrl` cho frontend vì:
1. Order model thiếu field `paymentUrl`
2. OrderService không lưu `paymentUrl` từ PaymentResponse vào Order

## ✅ Giải pháp

### Bước 1: Update Database

Thêm column `payment_url` vào table `orders`:

```sql
USE techshop_orderdb;

ALTER TABLE orders 
ADD COLUMN payment_url VARCHAR(1000) NULL 
COMMENT 'VNPay payment URL for online payment';
```

**Hoặc chạy script:**

```bash
mysql -u root -p techshop_orderdb < techshop-microservice/order-service/db/add_payment_url.sql
```

### Bước 2: Restart Order Service

```bash
cd techshop-microservice/order-service
mvn spring-boot:run
```

### Bước 3: Test

1. Vào trang checkout: http://localhost:5173/checkout
2. Chọn phương thức thanh toán **VNPay**
3. Click **"Đặt hàng ngay"**
4. ✅ Browser sẽ redirect đến trang VNPay
5. Nhập thông tin thẻ test:
   - Số thẻ: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày: `07/15`
   - OTP: `123456`

## 📝 Chi tiết thay đổi

### 1. Order.java
```java
@Column(length = 1000)
private String paymentUrl; // URL để redirect đến VNPay
```

### 2. OrderService.java
```java
// ✅ Lưu payment URL vào order
if (payment.getPaymentUrl() != null && !payment.getPaymentUrl().isEmpty()) {
    order.setPaymentUrl(payment.getPaymentUrl());
    log.info("Payment URL set for order {}: {}", order.getId(), payment.getPaymentUrl());
}
```

### 3. Database
```sql
ALTER TABLE orders ADD COLUMN payment_url VARCHAR(1000) NULL;
```

## 🧪 Verify

### Check Database
```sql
SELECT id, order_code, payment_method, payment_url 
FROM orders 
WHERE payment_method = 'VNPAY' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check API Response
```bash
curl -X POST http://localhost:8083/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "receiverName": "Test",
    "receiverPhone": "0901234567",
    "shippingAddress": "Test Address",
    "paymentMethod": "VNPAY",
    "items": [{"productId": 1, "quantity": 1, "unitPrice": 100000}]
  }' | jq '.paymentUrl'
```

Expected: URL VNPay được trả về
```
"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
```

### Check Frontend Console
Mở DevTools Console (F12) khi đặt hàng, bạn sẽ thấy:
```
✅ Redirecting to VNPay: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...
```

## 🚨 Troubleshooting

### Issue 1: Column already exists error

**Error:**
```
Duplicate column name 'payment_url'
```

**Solution:**
Column đã tồn tại, không cần chạy migration. Chỉ cần restart service.

### Issue 2: Payment URL vẫn null

**Check 1:** Payment Service có chạy không?
```bash
curl http://localhost:8085/actuator/health
```

**Check 2:** Payment Service có trả về paymentUrl không?
```bash
curl -X POST http://localhost:8085/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "userId": 1,
    "amount": 100000,
    "method": "VNPAY",
    "returnUrl": "http://localhost:5173/payment-result"
  }' | jq '.paymentUrl'
```

**Check 3:** Xem log của Order Service
```bash
tail -f logs/order-service.log | grep -i payment
```

### Issue 3: Frontend vẫn redirect đến order detail

**Check:** Console log trong browser (F12)

Nếu thấy:
```
6. Payment URL: null
✅ Navigating to order detail: /orders/123
```

→ Backend không trả về paymentUrl

**Solution:**
1. Verify database column đã được thêm
2. Restart Order Service
3. Clear browser cache
4. Test lại

### Issue 4: VNPay URL không hợp lệ

**Check:** VNPay credentials trong Payment Service

```yaml
# application.yml
vnpay:
  tmn-code: NWC83CLJ
  hash-secret: Z1T4ELP019FXYP8F1T7WINQVY5BHJC4V
  pay-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

## 📋 Checklist

- [ ] Database column `payment_url` đã được thêm
- [ ] Order Service đã restart
- [ ] Payment Service đang chạy
- [ ] Test tạo order với VNPay
- [ ] Verify paymentUrl trong response
- [ ] Test redirect đến VNPay
- [ ] Test thanh toán với thẻ test
- [ ] Verify callback xử lý đúng

## 🎯 Expected Flow

```
User chọn VNPay
    ↓
Frontend gọi POST /orders
    ↓
Order Service tạo order
    ↓
Order Service gọi Payment Service
    ↓
Payment Service tạo payment và trả về paymentUrl
    ↓
Order Service lưu paymentUrl vào order
    ↓
Order Service trả về order với paymentUrl
    ↓
Frontend nhận paymentUrl
    ↓
Frontend redirect: window.location.href = paymentUrl
    ↓
User thanh toán trên VNPay
    ↓
VNPay redirect về return-url
    ↓
Frontend xử lý callback
```

## 📚 Related Documentation

- [VNPAY_INTEGRATION.md](techshop-microservice/payment-service/VNPAY_INTEGRATION.md)
- [UPDATE_DATABASE.md](techshop-microservice/order-service/UPDATE_DATABASE.md)
- [VNPAY_FRONTEND_GUIDE.md](VNPAY_FRONTEND_GUIDE.md)

## ✅ Success Criteria

Sau khi fix:
- ✅ Chọn VNPay → redirect đến trang VNPay
- ✅ Nhập thẻ test → thanh toán thành công
- ✅ VNPay redirect về → hiển thị kết quả
- ✅ Order status được update đúng
- ✅ Payment status được update đúng

---

**Status:** Ready to fix
**Priority:** High
**Estimated Time:** 5-10 minutes
