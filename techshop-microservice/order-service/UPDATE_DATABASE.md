# Database Update - Add Payment URL Support

## Vấn đề

Khi chọn thanh toán VNPay, frontend không nhận được `paymentUrl` để redirect user đến trang thanh toán VNPay.

## Giải pháp

Thêm column `payment_url` vào table `orders` để lưu URL thanh toán VNPay.

## Các thay đổi

### 1. Database Schema
- Thêm column `payment_url VARCHAR(1000)` vào table `orders`

### 2. Code Changes
- ✅ Updated `Order.java` - Thêm field `paymentUrl`
- ✅ Updated `OrderService.java` - Lưu `paymentUrl` từ PaymentResponse

## Cách chạy Migration

### Option 1: Tự động (JPA sẽ tự động tạo column)

Nếu bạn đang dùng `spring.jpa.hibernate.ddl-auto=update` trong `application.yml`, JPA sẽ tự động thêm column khi bạn restart service.

```bash
# Restart Order Service
cd techshop-microservice/order-service
mvn spring-boot:run
```

### Option 2: Chạy SQL script thủ công

```bash
# Connect to MySQL
mysql -u root -p

# Run migration script
source techshop-microservice/order-service/db/add_payment_url.sql
```

Hoặc:

```bash
mysql -u root -p techshop_orderdb < techshop-microservice/order-service/db/add_payment_url.sql
```

### Option 3: Chạy trực tiếp SQL

```sql
USE techshop_orderdb;

ALTER TABLE orders 
ADD COLUMN payment_url VARCHAR(1000) NULL 
COMMENT 'VNPay payment URL for online payment';
```

## Verify Migration

Kiểm tra column đã được thêm:

```sql
USE techshop_orderdb;

DESCRIBE orders;

-- Hoặc
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'techshop_orderdb' 
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME = 'payment_url';
```

Expected output:
```
+-------------+--------------+------------------------+-------------+------------------------------------------+
| COLUMN_NAME | DATA_TYPE    | CHARACTER_MAXIMUM_LENGTH| IS_NULLABLE | COLUMN_COMMENT                           |
+-------------+--------------+------------------------+-------------+------------------------------------------+
| payment_url | varchar      | 1000                   | YES         | VNPay payment URL for online payment     |
+-------------+--------------+------------------------+-------------+------------------------------------------+
```

## Test

### 1. Restart Order Service

```bash
cd techshop-microservice/order-service
mvn spring-boot:run
```

### 2. Test tạo order với VNPay

```bash
curl -X POST http://localhost:8083/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "receiverName": "Test User",
    "receiverPhone": "0901234567",
    "shippingAddress": "123 Test Street",
    "note": "Test order",
    "paymentMethod": "VNPAY",
    "items": [
      {
        "productId": 1,
        "productName": "Test Product",
        "quantity": 1,
        "unitPrice": 100000
      }
    ]
  }'
```

### 3. Kiểm tra response

Response phải có field `paymentUrl`:

```json
{
  "id": 1,
  "orderCode": "TS20240101120000001",
  "paymentMethod": "VNPAY",
  "paymentStatus": "UNPAID",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  ...
}
```

### 4. Test trên Frontend

1. Vào trang checkout
2. Chọn phương thức thanh toán VNPay
3. Click "Đặt hàng ngay"
4. **Expected:** Browser redirect đến trang VNPay
5. **Previous behavior:** Browser redirect đến order detail

## Rollback (nếu cần)

```sql
USE techshop_orderdb;

ALTER TABLE orders DROP COLUMN payment_url;
```

## Notes

- Column `payment_url` chỉ được set khi `paymentMethod` là `VNPAY` hoặc online payment methods
- COD orders sẽ có `payment_url = NULL`
- Column size 1000 characters đủ cho VNPay URL (thường ~500-800 characters)

## Troubleshooting

### Issue: Column không được tạo tự động

**Solution:** Kiểm tra `application.yml`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # Phải là 'update' hoặc 'create'
```

### Issue: Order Service không start

**Solution:** Kiểm tra log để xem lỗi database migration

```bash
tail -f logs/order-service.log
```

### Issue: Frontend vẫn không nhận được paymentUrl

**Solution:** 
1. Kiểm tra Payment Service đang chạy
2. Kiểm tra Payment Service có trả về `paymentUrl` không
3. Kiểm tra log của Order Service
4. Clear browser cache và test lại

## Related Files

- `Order.java` - Entity model
- `OrderService.java` - Business logic
- `add_payment_url.sql` - Migration script
- `VNPAY_INTEGRATION.md` - VNPay integration guide

## Status

- [x] Database schema updated
- [x] Code updated
- [x] Migration script created
- [ ] Migration executed
- [ ] Tested on local
- [ ] Tested on staging
- [ ] Deployed to production
