# Payment Service

Payment Service quản lý các giao dịch thanh toán cho TechShop, hỗ trợ nhiều phương thức thanh toán bao gồm VNPay, COD, và Bank Transfer.

## Tính năng

- ✅ Thanh toán qua VNPay (Cổng thanh toán trực tuyến)
- ✅ Thanh toán COD (Cash on Delivery)
- ✅ Chuyển khoản ngân hàng
- ✅ Quản lý trạng thái thanh toán
- ✅ Callback và IPN từ VNPay
- ✅ Tích hợp với Order Service và Inventory Service
- ✅ Transaction tracking

## Công nghệ sử dụng

- **Spring Boot 3.3.5** - Framework chính
- **Spring Data JPA** - ORM
- **MySQL** - Database
- **Spring Cloud Netflix Eureka** - Service Discovery
- **Spring Cloud OpenFeign** - Service Communication
- **Lombok** - Giảm boilerplate code

## Cấu trúc thư mục

```
payment-service/
├── src/
│   └── main/
│       ├── java/com/techshop/paymentservice/
│       │   ├── client/          # Feign clients
│       │   ├── config/          # Configuration classes
│       │   ├── controller/      # REST controllers
│       │   ├── dto/             # Data Transfer Objects
│       │   ├── model/           # Entity models
│       │   ├── repository/      # JPA repositories
│       │   └── service/         # Business logic
│       └── resources/
│           ├── application.yml
│           └── application-docker.yml
├── .env.example                 # Environment variables template
├── VNPAY_INTEGRATION.md        # VNPay integration guide
├── VNPAY_TEST_GUIDE.md         # VNPay testing guide
└── README.md                    # This file
```

## Cài đặt

### Prerequisites

- Java 21
- Maven 3.8+
- MySQL 8.0+
- Discovery Service đang chạy

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd techshop-microservice/payment-service
```

### Bước 2: Cấu hình database

Tạo database:
```sql
CREATE DATABASE techshop_paymentdb;
```

### Bước 3: Cấu hình environment variables

Copy file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

Hoặc cập nhật trực tiếp trong `application.yml`

### Bước 4: Build và chạy

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run
```

Service sẽ chạy tại: http://localhost:8085

## API Endpoints

### Payment Management

#### Create Payment
```http
POST /payments
Content-Type: application/json

{
  "orderId": 1,
  "userId": 1,
  "amount": 100000,
  "method": "VNPAY",
  "returnUrl": "http://localhost:5173/payment-result"
}
```

#### Get Payment by ID
```http
GET /payments/{id}
```

#### Get Payment by Order ID
```http
GET /payments/order/{orderId}
```

#### Update Payment Status
```http
PUT /payments/{id}/status?status=PAID
```

### VNPay Integration

#### Create VNPay Payment URL
```http
POST /payments/vnpay/create
Content-Type: application/json

{
  "orderId": 1,
  "amount": 100000,
  "orderInfo": "Thanh toan don hang #1",
  "bankCode": "NCB",
  "language": "vn"
}
```

#### VNPay Callback (Return URL)
```http
GET /payments/vnpay/callback?vnp_TxnRef=...&vnp_ResponseCode=00&...
```

#### VNPay IPN
```http
POST /payments/vnpay/ipn?vnp_TxnRef=...&vnp_ResponseCode=00&...
```

## Payment Methods

### 1. VNPay (Online Payment)

Thanh toán trực tuyến qua cổng VNPay, hỗ trợ:
- Thẻ ATM nội địa
- Thẻ tín dụng/ghi nợ quốc tế
- QR Code
- Ví điện tử

**Luồng:**
1. Tạo payment với method = VNPAY
2. Nhận payment URL
3. Redirect user đến VNPay
4. User thanh toán
5. VNPay callback về return URL
6. Backend verify và update status

**Chi tiết:** Xem [VNPAY_INTEGRATION.md](VNPAY_INTEGRATION.md)

### 2. COD (Cash on Delivery)

Thanh toán khi nhận hàng.

**Luồng:**
1. Tạo payment với method = COD
2. Status tự động set = PAID
3. Order được xử lý ngay

### 3. Bank Transfer

Chuyển khoản ngân hàng.

**Luồng:**
1. Tạo payment với method = BANK_TRANSFER
2. Status = PENDING
3. Admin verify và update status manually

## Payment Status Flow

```
PENDING → PAID → (REFUNDED)
   ↓
FAILED
```

- **PENDING**: Chờ thanh toán
- **PAID**: Đã thanh toán thành công
- **FAILED**: Thanh toán thất bại
- **REFUNDED**: Đã hoàn tiền

## Database Schema

### payments table

```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(255),
    payment_url VARCHAR(1000),
    created_at TIMESTAMP,
    paid_at TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_id (transaction_id)
);
```

## Service Communication

Payment Service giao tiếp với:

### Order Service
- Update payment status của order
- Endpoint: `PUT /orders/{orderId}/payment-status`

### Inventory Service
- Commit inventory sau khi thanh toán thành công
- Endpoint: `POST /inventory/commit/{orderId}`

## Configuration

### application.yml

```yaml
server:
  port: 8085

spring:
  application:
    name: payment-service
  datasource:
    url: jdbc:mysql://localhost:3306/techshop_paymentdb
    username: root
    password: 123456

vnpay:
  tmn-code: NWC83CLJ
  hash-secret: Z1T4ELP019FXYP8F1T7WINQVY5BHJC4V
  pay-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  return-url: http://localhost:5173/payment-result
```

### Environment Variables

Có thể override config bằng environment variables:

```bash
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/techshop_paymentdb
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_RETURN_URL=https://your-domain.com/payment-result
```

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
mvn verify
```

### Manual Testing

Xem hướng dẫn chi tiết trong [VNPAY_TEST_GUIDE.md](VNPAY_TEST_GUIDE.md)

### Test với Postman

Import collection từ `postman/payment-service.json`

## Monitoring

### Health Check

```bash
curl http://localhost:8085/actuator/health
```

### Metrics

```bash
curl http://localhost:8085/actuator/metrics
```

### Logs

```bash
# View logs
tail -f logs/payment-service.log

# Enable debug logging
logging.level.com.techshop.paymentservice=DEBUG
```

## Troubleshooting

### Common Issues

#### 1. Cannot connect to database

**Solution:**
- Kiểm tra MySQL đang chạy
- Kiểm tra credentials trong application.yml
- Kiểm tra database đã được tạo

#### 2. VNPay signature invalid

**Solution:**
- Kiểm tra hash-secret có đúng không
- Kiểm tra các tham số không bị modify
- Xem log để debug

#### 3. Service not registered with Eureka

**Solution:**
- Kiểm tra Discovery Service đang chạy
- Kiểm tra eureka.client.service-url.defaultZone
- Restart service

## Security

### Best Practices

1. **Không commit sensitive data:**
   - Hash secret
   - Database password
   - API keys

2. **Verify VNPay signature:**
   - Luôn verify signature từ callback
   - Không tin tưởng data từ frontend

3. **Use HTTPS:**
   - Production phải dùng HTTPS
   - Callback URL phải HTTPS

4. **Rate Limiting:**
   - Implement rate limiting cho API
   - Prevent abuse

5. **Logging:**
   - Log tất cả transactions
   - Không log sensitive data (card number, etc.)

## Deployment

### Docker

```bash
# Build image
docker build -t payment-service .

# Run container
docker run -p 8085:8085 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/techshop_paymentdb \
  -e VNPAY_TMN_CODE=your-code \
  -e VNPAY_HASH_SECRET=your-secret \
  payment-service
```

### Kubernetes

```bash
kubectl apply -f k8s/payment-service.yaml
```

## Production Checklist

Trước khi deploy production:

- [ ] Cập nhật VNPay credentials production
- [ ] Thay đổi database password
- [ ] Enable HTTPS
- [ ] Configure IPN URL trong VNPay Merchant Admin
- [ ] Setup monitoring và alerting
- [ ] Configure backup strategy
- [ ] Test với real transactions (small amount)
- [ ] Setup log aggregation
- [ ] Configure rate limiting
- [ ] Review security settings
- [ ] Document rollback procedure

## Support

### Documentation

- [VNPay Integration Guide](VNPAY_INTEGRATION.md)
- [VNPay Test Guide](VNPAY_TEST_GUIDE.md)
- [VNPay Official Docs](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)

### Contact

- Email: support@techshop.com
- Slack: #payment-service

## License

Copyright © 2024 TechShop. All rights reserved.
