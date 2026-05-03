# Hướng dẫn Test VNPay Integration

## Chuẩn bị

### 1. Khởi động các service cần thiết

```bash
# Start Discovery Service
cd techshop-microservice/discovery-service
mvn spring-boot:run

# Start Payment Service
cd techshop-microservice/payment-service
mvn spring-boot:run
```

### 2. Kiểm tra service đã chạy

- Payment Service: http://localhost:8085/actuator/health
- Discovery Service: http://localhost:8761

## Test Scenarios

### Scenario 1: Tạo Payment URL và thanh toán

#### Bước 1: Tạo Payment URL

**Request:**
```bash
curl -X POST http://localhost:8085/payments/vnpay/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "amount": 100000,
    "orderInfo": "Thanh toan don hang #1",
    "bankCode": "NCB",
    "language": "vn"
  }'
```

**Expected Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_BankCode=NCB&...",
  "transactionNo": "12345678",
  "orderId": "1",
  "success": true,
  "message": "Payment URL created successfully"
}
```

#### Bước 2: Mở Payment URL trong browser

1. Copy `paymentUrl` từ response
2. Paste vào browser
3. Trang VNPay sandbox sẽ hiển thị form nhập thẻ

#### Bước 3: Nhập thông tin thẻ test

```
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

#### Bước 4: Xác nhận thanh toán

- Click "Thanh toán"
- Nhập OTP: 123456
- VNPay sẽ redirect về return-url với các tham số callback

#### Bước 5: Kiểm tra callback

URL callback sẽ có dạng:
```
http://localhost:5173/payment-result?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=12345678&vnp_SecureHash=...
```

Frontend cần gọi API để verify:
```bash
curl "http://localhost:8085/payments/vnpay/callback?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=12345678&vnp_SecureHash=..."
```

**Expected Response:**
```json
{
  "success": true,
  "transactionNo": "14123456",
  "orderId": "12345678",
  "message": "Payment successful"
}
```

### Scenario 2: Tạo Payment với Order

#### Bước 1: Tạo Payment

**Request:**
```bash
curl -X POST http://localhost:8085/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "userId": 1,
    "amount": 100000,
    "method": "VNPAY",
    "returnUrl": "http://localhost:5173/payment-result"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "orderId": 1,
  "userId": 1,
  "amount": 100000,
  "method": "VNPAY",
  "status": "PENDING",
  "transactionId": "uuid-here",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "createdAt": "2024-01-01T10:00:00",
  "paidAt": null
}
```

#### Bước 2: Redirect user đến paymentUrl

Frontend redirect user đến `paymentUrl` từ response

#### Bước 3: User thanh toán trên VNPay

Nhập thông tin thẻ test như Scenario 1

#### Bước 4: VNPay callback

Backend tự động nhận callback và update payment status

#### Bước 5: Kiểm tra payment status

**Request:**
```bash
curl http://localhost:8085/payments/order/1
```

**Expected Response:**
```json
{
  "id": 1,
  "orderId": 1,
  "userId": 1,
  "amount": 100000,
  "method": "VNPAY",
  "status": "PAID",
  "transactionId": "uuid-here",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "createdAt": "2024-01-01T10:00:00",
  "paidAt": "2024-01-01T10:05:00"
}
```

### Scenario 3: Test Payment Failed

#### Bước 1: Tạo Payment URL

Giống Scenario 1

#### Bước 2: Mở Payment URL và Cancel

1. Mở payment URL trong browser
2. Click "Hủy giao dịch" hoặc đóng trang
3. VNPay sẽ redirect về return-url với response code khác 00

#### Bước 3: Kiểm tra callback

**Expected Response:**
```json
{
  "success": false,
  "transactionNo": "14123456",
  "orderId": "12345678",
  "message": "Payment failed with response code: 24"
}
```

## Test với Postman

### Import Collection

Tạo Postman collection với các request sau:

#### 1. Create VNPay Payment URL

```
POST http://localhost:8085/payments/vnpay/create
Content-Type: application/json

{
  "orderId": 1,
  "amount": 100000,
  "orderInfo": "Test payment",
  "bankCode": "NCB",
  "language": "vn"
}
```

#### 2. Create Payment

```
POST http://localhost:8085/payments
Content-Type: application/json

{
  "orderId": 1,
  "userId": 1,
  "amount": 100000,
  "method": "VNPAY",
  "returnUrl": "http://localhost:5173/payment-result"
}
```

#### 3. Get Payment by Order ID

```
GET http://localhost:8085/payments/order/1
```

#### 4. Get Payment by ID

```
GET http://localhost:8085/payments/1
```

#### 5. VNPay Callback (Manual Test)

```
GET http://localhost:8085/payments/vnpay/callback?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=12345678&vnp_SecureHash=...
```

## Test Response Codes

### Test Success (00)

Nhập đúng thông tin thẻ test và OTP

**Expected:**
- vnp_ResponseCode: 00
- vnp_TransactionStatus: 00
- Payment status: PAID

### Test Cancel (24)

Click "Hủy giao dịch" trên trang VNPay

**Expected:**
- vnp_ResponseCode: 24
- Payment status: FAILED

### Test Invalid OTP (13)

Nhập sai OTP 3 lần

**Expected:**
- vnp_ResponseCode: 13
- Payment status: FAILED

### Test Insufficient Balance (51)

Không test được trên sandbox (cần môi trường production)

## Debugging

### Enable Debug Logging

Thêm vào `application.yml`:

```yaml
logging:
  level:
    com.techshop.paymentservice: DEBUG
    org.springframework.web: DEBUG
```

### Check Logs

```bash
# Xem log của Payment Service
tail -f logs/payment-service.log

# Hoặc xem console output
```

### Common Issues

#### 1. Invalid Signature

**Symptom:** Response "Invalid signature"

**Solution:**
- Kiểm tra hash-secret có đúng không
- Kiểm tra các tham số có bị modify không
- Kiểm tra encoding

#### 2. Payment Not Found

**Symptom:** Response "Payment not found"

**Solution:**
- Kiểm tra transactionId có được lưu trong database không
- Kiểm tra mapping giữa vnp_TxnRef và transactionId

#### 3. Callback Not Received

**Symptom:** Payment status không được update

**Solution:**
- Kiểm tra return-url có đúng không
- Kiểm tra network/firewall
- Kiểm tra log để xem có request từ VNPay không

## Integration Test

### Test với JUnit

```java
@SpringBootTest
@AutoConfigureMockMvc
class VNPayIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testCreatePaymentUrl() throws Exception {
        VNPayRequest request = VNPayRequest.builder()
                .orderId(1L)
                .amount(new BigDecimal("100000"))
                .orderInfo("Test payment")
                .bankCode("NCB")
                .language("vn")
                .build();

        mockMvc.perform(post("/payments/vnpay/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.paymentUrl").exists());
    }

    @Test
    void testVNPayCallback() throws Exception {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "12345678");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        // ... add other params and signature

        mockMvc.perform(get("/payments/vnpay/callback")
                .params(params))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

## Monitoring

### Check Payment Statistics

```bash
# Count payments by status
curl http://localhost:8085/actuator/metrics/payment.status

# Check VNPay success rate
curl http://localhost:8085/actuator/metrics/vnpay.success.rate
```

### Database Queries

```sql
-- Check recent payments
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check VNPay payments
SELECT * FROM payments 
WHERE method = 'VNPAY' 
ORDER BY created_at DESC;

-- Check payment success rate
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM payments
WHERE method = 'VNPAY'
GROUP BY status;
```

## Production Checklist

Trước khi deploy lên production:

- [ ] Cập nhật tmn-code và hash-secret production
- [ ] Thay đổi pay-url sang production URL
- [ ] Cấu hình IPN URL trong VNPay Merchant Admin
- [ ] Test với thẻ thật (số tiền nhỏ)
- [ ] Setup monitoring và alerting
- [ ] Backup database trước khi deploy
- [ ] Chuẩn bị rollback plan
- [ ] Document các response codes và error handling
- [ ] Setup log aggregation (ELK, CloudWatch, etc.)
- [ ] Configure rate limiting
- [ ] Setup SSL/TLS cho callback URL
