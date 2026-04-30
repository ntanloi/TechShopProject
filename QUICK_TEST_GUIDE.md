# Quick Test Guide - VNPay Payment Status Update

## 🚀 Quick Start

### 1. Start All Services (in separate terminals)

```bash
# Terminal 1 - Discovery Service
cd techshop-microservice/discovery-service
mvn spring-boot:run

# Terminal 2 - Order Service  
cd techshop-microservice/order-service
mvn spring-boot:run

# Terminal 3 - Payment Service
cd techshop-microservice/payment-service
mvn spring-boot:run

# Terminal 4 - Frontend
cd techshop-frontend
npm run dev
```

### 2. Test Payment Flow (5 minutes)

1. **Open browser**: http://localhost:5173
2. **Login** with your account
3. **Add products** to cart
4. **Go to checkout**
5. **Fill shipping info**:
   - Name: Test User
   - Phone: 0123456789
   - Address: 123 Test Street
6. **Select payment**: VNPay
7. **Click**: Đặt hàng (Place Order)
8. **On VNPay page**, enter test card:
   ```
   Card Number: 9704198526191432198
   Card Holder: NGUYEN VAN A
   Issue Date: 07/15
   OTP: 123456
   ```
9. **Click**: Xác nhận (Confirm)
10. **Wait for redirect** (2 seconds)
11. **Check order detail page**:
    - ✅ Payment Status: "Đã thanh toán" (PAID)
    - ✅ Order Status: "Đã xác nhận" (CONFIRMED)

## ✅ What Should Happen

### Success Flow:
1. VNPay payment page opens ✅
2. Enter OTP and confirm ✅
3. See "Thanh toán thành công!" message ✅
4. Auto-redirect to order detail page ✅
5. Payment status shows "Đã thanh toán" ✅
6. Order status shows "Đã xác nhận" ✅

### Backend Logs (Payment Service):
```
VNPay callback received for transaction: {uuid}
Payment verified and updated for transaction: {uuid}, orderId: {id}
```

### Backend Logs (Order Service):
```
Order {id} payment status updated to PAID
Order {id} marked as PAID
```

## ❌ Common Issues

### Issue 1: "Cannot access this page"
**Cause**: Wrong return URL
**Fix**: Check `order-service/application.yml`:
```yaml
payment:
  return-url: http://localhost:5173/payment-result
```

### Issue 2: CORS Error
**Cause**: Payment Service CORS not configured
**Fix**: Ensure `CorsConfig.java` exists in Payment Service

### Issue 3: Payment status not updating
**Cause**: Order ID not returned correctly
**Fix**: This is what we just fixed! Ensure you're running the latest code.

### Issue 4: Services not connecting
**Cause**: Discovery Service not running
**Fix**: Start Discovery Service first, wait 30 seconds, then start other services

## 🔍 Debug Checklist

If something doesn't work:

- [ ] All 4 services are running
- [ ] Discovery Service started first
- [ ] Frontend shows VNPay payment URL
- [ ] Backend logs show callback received
- [ ] Backend logs show payment verified
- [ ] Backend logs show order updated
- [ ] Database payment status is PAID
- [ ] Database order status is CONFIRMED
- [ ] Frontend console shows correct order ID
- [ ] Browser redirects to correct URL

## 📊 Database Verification

```sql
-- Check latest payment
SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
-- Expected: status = 'PAID', paid_at = {timestamp}

-- Check latest order
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
-- Expected: payment_status = 'PAID', status = 'CONFIRMED'
```

## 🎯 Expected Results

### Before Payment:
- Order Status: PENDING
- Payment Status: UNPAID

### After Payment:
- Order Status: CONFIRMED
- Payment Status: PAID
- Payment URL: (VNPay URL)
- Paid At: (timestamp)

## 📝 Test Card Details

```
Bank: NCB
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Issue Date: 07/15
OTP: 123456
```

## 🔗 Service URLs

- Frontend: http://localhost:5173
- Discovery: http://localhost:8761
- Order Service: http://localhost:8083
- Payment Service: http://localhost:8085
- VNPay Sandbox: https://sandbox.vnpayment.vn

## 💡 Tips

1. **Always start Discovery Service first** and wait 30 seconds
2. **Check browser console** for frontend errors
3. **Check backend logs** for service errors
4. **Use Postman** to test APIs directly if needed
5. **Clear browser cache** if frontend doesn't update

## 🎉 Success!

If you see "Đã thanh toán" on the order detail page after payment, everything is working correctly! 🎊
