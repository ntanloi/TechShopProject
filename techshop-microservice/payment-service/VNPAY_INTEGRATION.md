# VNPay Integration Guide

## Thông tin tích hợp VNPay

### Môi trường Sandbox (Test)

**Cấu hình:**
- Terminal ID / Mã Website (vnp_TmnCode): `NWC83CLJ`
- Secret Key (vnp_HashSecret): `Z1T4ELP019FXYP8F1T7WINQVY5BHJC4V`
- URL thanh toán: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Return URL: `http://localhost:5173/payment-result` (có thể thay đổi)

**Merchant Admin:**
- URL: https://sandbox.vnpayment.vn/merchantv2/
- Tên đăng nhập: nloi79557@gmail.com
- Mật khẩu: (Mật khẩu bạn đã đăng ký)

**Kiểm tra (Test Case):**
- URL: https://sandbox.vnpayment.vn/vnpaygw-sit-testing/user/login
- Tên đăng nhập: nloi79557@gmail.com
- Mật khẩu: (Mật khẩu bạn đã đăng ký)

### Thẻ Test

**Ngân hàng NCB:**
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mật khẩu OTP: `123456`

## API Endpoints

### 1. Tạo Payment URL

**Endpoint:** `POST /payments/vnpay/create`

**Request Body:**
```json
{
  "orderId": 123,
  "amount": 100000,
  "orderInfo": "Thanh toan don hang #123",
  "bankCode": "NCB",
  "language": "vn"
}
```

**Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "transactionNo": "12345678",
  "orderId": "123",
  "success": true,
  "message": "Payment URL created successfully"
}
```

### 2. VNPay Callback (Return URL)

**Endpoint:** `GET /payments/vnpay/callback`

**Query Parameters:** (Tự động gửi từ VNPay)
- vnp_TxnRef: Transaction reference
- vnp_ResponseCode: Response code (00 = success)
- vnp_TransactionStatus: Transaction status
- vnp_SecureHash: Signature
- ... (và các tham số khác)

**Response:**
```json
{
  "success": true,
  "transactionNo": "14123456",
  "orderId": "12345678",
  "message": "Payment successful"
}
```

### 3. VNPay IPN (Instant Payment Notification)

**Endpoint:** `POST /payments/vnpay/ipn`

**Query Parameters:** (Tự động gửi từ VNPay server)
- Giống như callback

**Response:**
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

## Luồng thanh toán

### Luồng 1: Thanh toán trực tiếp (không tạo order trước)

1. Frontend gọi `POST /payments/vnpay/create` để tạo payment URL
2. Frontend redirect user đến `paymentUrl`
3. User nhập thông tin thẻ và xác nhận thanh toán trên VNPay
4. VNPay redirect về `return-url` với các tham số callback
5. Frontend gọi `GET /payments/vnpay/callback` để verify payment
6. Frontend tạo order sau khi payment thành công

### Luồng 2: Tạo order trước, thanh toán sau

1. Frontend tạo order qua `POST /orders`
2. Frontend tạo payment qua `POST /payments` với method = VNPAY
3. Backend tự động tạo payment URL và trả về trong response
4. Frontend redirect user đến `paymentUrl`
5. User nhập thông tin thẻ và xác nhận thanh toán trên VNPay
6. VNPay redirect về `return-url` với các tham số callback
7. Backend tự động update payment status qua callback
8. VNPay gọi IPN để confirm (optional, để đảm bảo)

## Response Codes

### VNPay Response Codes
- `00`: Giao dịch thành công
- `07`: Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)
- `09`: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng
- `10`: Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
- `11`: Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch
- `12`: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa
- `13`: Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)
- `24`: Giao dịch không thành công do: Khách hàng hủy giao dịch
- `51`: Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch
- `65`: Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày
- `75`: Ngân hàng thanh toán đang bảo trì
- `79`: Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định
- `99`: Các lỗi khác

## Cấu hình

### application.yml
```yaml
vnpay:
  tmn-code: NWC83CLJ
  hash-secret: Z1T4ELP019FXYP8F1T7WINQVY5BHJC4V
  pay-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  return-url: http://localhost:5173/payment-result
  api-url: https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
  version: 2.1.0
  command: pay
  order-type: other
```

### application-docker.yml
```yaml
vnpay:
  return-url: http://your-domain.com/payment-result
```

## Tài liệu tham khảo

- Tài liệu API: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
- Code demo: https://sandbox.vnpayment.vn/apis/vnpay-demo/code-demo-tích-hợp
- Demo trực tiếp: https://sandbox.vnpayment.vn/apis/vnpay-demo/

## Lưu ý quan trọng

1. **Môi trường Sandbox**: Thông tin trên chỉ dùng cho môi trường test. KHÔNG sử dụng cho production.

2. **IPN URL**: Cần cấu hình IPN URL trong Merchant Admin để VNPay có thể gọi callback:
   - URL: `http://your-domain.com/payments/vnpay/ipn`
   - Method: POST

3. **Return URL**: Có thể override return URL khi tạo payment bằng cách truyền trong request body.

4. **Security**: 
   - Secret key phải được bảo mật tuyệt đối
   - Luôn verify signature từ VNPay callback
   - Không tin tưởng dữ liệu từ frontend, luôn verify qua backend

5. **Production**: Khi chuyển sang production:
   - Đăng ký tài khoản VNPay chính thức
   - Cập nhật tmn-code và hash-secret mới
   - Thay đổi pay-url sang production URL
   - Cấu hình IPN URL production

## Testing

### Test với Postman

1. **Tạo Payment URL:**
```bash
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

2. **Copy paymentUrl từ response và mở trong browser**

3. **Nhập thông tin thẻ test:**
   - Số thẻ: 9704198526191432198
   - Tên: NGUYEN VAN A
   - Ngày: 07/15
   - OTP: 123456

4. **Sau khi thanh toán thành công, VNPay sẽ redirect về return-url**

## Troubleshooting

### Lỗi "Invalid signature"
- Kiểm tra hash-secret có đúng không
- Kiểm tra các tham số có bị thay đổi không
- Kiểm tra encoding (UTF-8)

### Lỗi "Transaction not found"
- Kiểm tra transactionId có được lưu trong database không
- Kiểm tra mapping giữa vnp_TxnRef và transactionId

### Payment không được update
- Kiểm tra IPN URL có được cấu hình đúng không
- Kiểm tra log để xem VNPay có gọi callback không
- Kiểm tra firewall/network có block request từ VNPay không
