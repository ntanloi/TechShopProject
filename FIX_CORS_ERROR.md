# Fix: CORS Error - Payment Callback

## 🐛 Vấn đề

```
Access to XMLHttpRequest at 'http://localhost:8085/payments/vnpay/callback' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 Nguyên nhân

Payment Service không có CORS configuration, không cho phép frontend (localhost:5173) gọi API.

## ✅ Giải pháp

Đã tạo `CorsConfig.java` trong Payment Service để:
- ✅ Allow origin: `http://localhost:5173`
- ✅ Allow all headers
- ✅ Allow methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- ✅ Allow credentials

## 🚀 Cách áp dụng

### Bước 1: Restart Payment Service

```powershell
# Stop Payment Service (Ctrl+C)
# Then restart:
cd techshop-microservice/payment-service
mvn spring-boot:run
```

### Bước 2: Verify CORS

Sau khi restart, test CORS:

```powershell
curl -X OPTIONS http://localhost:8085/payments/vnpay/callback \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Expected response headers:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
```

### Bước 3: Test lại payment flow

1. Vào http://localhost:5173/checkout
2. Chọn VNPay
3. Click "Đặt hàng ngay"
4. Nhập thẻ test và OTP: `123456`
5. Click "Thanh toán"
6. ✅ Bạn sẽ thấy "Thanh toán thành công!"
7. ✅ Auto redirect đến order detail

## 📊 Flow sau khi fix

```
User xác nhận OTP
    ↓
VNPay redirect về: http://localhost:5173/payment-result?vnp_ResponseCode=00&...
    ↓
Frontend PaymentResult component
    ↓
Gọi API: GET http://localhost:8085/payments/vnpay/callback
    ↓
✅ CORS OK - Request được phép
    ↓
Backend verify signature và update payment
    ↓
Backend trả về success
    ↓
Frontend hiển thị "Thanh toán thành công!"
    ↓
Auto redirect đến order detail
```

## 🔍 Debug

### Check CORS trong browser

1. Mở DevTools (F12)
2. Tab Network
3. Tìm request đến `/payments/vnpay/callback`
4. Check Response Headers:
   - ✅ `Access-Control-Allow-Origin: http://localhost:5173`
   - ✅ `Access-Control-Allow-Credentials: true`

### Check Payment Service logs

Sau khi restart, bạn sẽ thấy:
```
INFO  [main] c.t.p.config.CorsConfig - CORS configuration loaded
```

## 🐛 Troubleshooting

### Issue 1: Vẫn bị CORS error

**Solution:**
1. Verify Payment Service đã restart
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Check CorsConfig.java có trong classpath không

### Issue 2: Preflight request failed

**Solution:**
CORS filter đã handle OPTIONS request. Nếu vẫn lỗi:
1. Check firewall
2. Check antivirus
3. Try different browser

### Issue 3: Credentials not allowed

**Solution:**
Đã set `allowCredentials(true)`. Nếu vẫn lỗi, check frontend axios config:
```javascript
axios.get(url, {
  withCredentials: true  // Nếu cần
})
```

## ✅ Success Criteria

Sau khi fix:
- ✅ No CORS error trong console
- ✅ API call thành công
- ✅ Payment được verify
- ✅ Hiển thị "Thanh toán thành công!"
- ✅ Auto redirect đến order detail

## 📝 Files Changed

1. `payment-service/src/main/java/com/techshop/paymentservice/config/CorsConfig.java` - NEW

## 🔐 Security Note

**Development:**
- Allow localhost origins OK

**Production:**
- Chỉ allow production domain
- Không allow `*` (all origins)
- Enable HTTPS only

Example production config:
```java
config.setAllowedOrigins(Arrays.asList(
    "https://techshop.com",
    "https://www.techshop.com"
));
```

---

**Status:** ✅ Fixed
**Priority:** Critical
**Impact:** Payment callback now works without CORS error
