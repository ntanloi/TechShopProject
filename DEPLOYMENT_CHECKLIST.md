# Deployment Checklist - Payment Status Update Fix

## 📋 Pre-Deployment Checklist

### 1. Code Changes Verification
- [x] PaymentController.java updated
- [x] PaymentResult.jsx updated
- [x] OrderDetail.jsx updated
- [x] All files saved
- [x] No syntax errors

### 2. Build & Compile
```bash
# Payment Service
cd techshop-microservice/payment-service
mvn clean compile
# Should complete without errors

# Frontend
cd techshop-frontend
npm run build
# Should complete without errors
```

### 3. Database Check
```sql
-- Verify payment_url column exists
DESCRIBE orders;
-- Should show payment_url column (VARCHAR 1000)

-- Check existing data
SELECT id, order_code, payment_status, status, payment_url 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🚀 Deployment Steps

### Step 1: Stop Services
```bash
# Stop all running services
# Press Ctrl+C in each terminal running:
# - Discovery Service
# - Order Service
# - Payment Service
# - Frontend
```

### Step 2: Pull Latest Code
```bash
cd TechShopProject
git pull origin main
# Or ensure you have the latest code
```

### Step 3: Rebuild Services
```bash
# Payment Service (has changes)
cd techshop-microservice/payment-service
mvn clean package -DskipTests

# Order Service (no changes, but rebuild for safety)
cd techshop-microservice/order-service
mvn clean package -DskipTests

# Discovery Service (no changes)
cd techshop-microservice/discovery-service
mvn clean package -DskipTests
```

### Step 4: Rebuild Frontend
```bash
cd techshop-frontend
npm install
npm run build
```

### Step 5: Start Services (in order)
```bash
# Terminal 1 - Discovery Service (wait 30 seconds after starting)
cd techshop-microservice/discovery-service
mvn spring-boot:run

# Terminal 2 - Order Service (wait 20 seconds)
cd techshop-microservice/order-service
mvn spring-boot:run

# Terminal 3 - Payment Service (wait 20 seconds)
cd techshop-microservice/payment-service
mvn spring-boot:run

# Terminal 4 - Frontend
cd techshop-frontend
npm run dev
```

### Step 6: Verify Services
```bash
# Check Discovery Service
curl http://localhost:8761

# Check Order Service
curl http://localhost:8083/actuator/health

# Check Payment Service
curl http://localhost:8085/actuator/health

# Check Frontend
curl http://localhost:5173
```

## ✅ Post-Deployment Testing

### Test 1: Create Order with VNPay
1. Login to http://localhost:5173
2. Add products to cart
3. Go to checkout
4. Select VNPay payment
5. Complete order
6. **Verify**: Redirected to VNPay page ✅

### Test 2: Complete Payment
1. On VNPay page, enter test card:
   - Card: 9704198526191432198
   - Name: NGUYEN VAN A
   - Date: 07/15
   - OTP: 123456
2. Click confirm
3. **Verify**: See "Thanh toán thành công!" ✅
4. **Verify**: Redirected to order detail page ✅

### Test 3: Verify Status Update
1. On order detail page, check:
   - **Payment Status**: "Đã thanh toán" ✅
   - **Order Status**: "Đã xác nhận" ✅
2. Check database:
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
   -- status should be 'PAID'
   
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
   -- payment_status should be 'PAID'
   -- status should be 'CONFIRMED'
   ```

### Test 4: Check Logs
```bash
# Payment Service logs should show:
"VNPay callback received for transaction: {uuid}"
"Payment verified and updated for transaction: {uuid}, orderId: {id}"

# Order Service logs should show:
"Order {id} payment status updated to PAID"
"Order {id} marked as PAID"
```

## 🔍 Verification Checklist

### Frontend
- [ ] Payment page loads correctly
- [ ] VNPay redirect works
- [ ] Payment success message displays
- [ ] Redirect to order detail works
- [ ] Order detail shows correct status
- [ ] No console errors

### Backend
- [ ] Payment Service starts without errors
- [ ] Order Service starts without errors
- [ ] Services register with Discovery
- [ ] Payment callback endpoint works
- [ ] Payment status updates in database
- [ ] Order status updates in database
- [ ] Logs show correct order ID

### Database
- [ ] Payment record created
- [ ] Payment status is PAID
- [ ] Order payment_status is PAID
- [ ] Order status is CONFIRMED
- [ ] payment_url is saved

## 🐛 Troubleshooting

### Issue: Services won't start
**Solution**: 
1. Check if ports are already in use
2. Kill existing processes: `lsof -ti:8761,8083,8085,5173 | xargs kill -9`
3. Restart services

### Issue: Payment status not updating
**Solution**:
1. Check Payment Service logs for errors
2. Verify OrderClient can reach Order Service
3. Check database connection
4. Restart Payment Service

### Issue: Frontend shows old code
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Rebuild frontend: `npm run build`

### Issue: CORS error
**Solution**:
1. Verify CorsConfig.java exists in Payment Service
2. Check allowed origins include http://localhost:5173
3. Restart Payment Service

## 📊 Rollback Plan

If issues occur, rollback to previous version:

```bash
# Stop all services
# Ctrl+C in all terminals

# Revert code changes
git checkout HEAD~1

# Rebuild and restart services
# Follow deployment steps again
```

## 📝 Post-Deployment Notes

### What Changed:
- Payment callback now returns real order ID
- Frontend redirects to correct order page
- Payment status updates immediately
- Better error handling and logging

### What Didn't Change:
- Database schema (no migrations needed)
- API contracts (backward compatible)
- VNPay integration (same credentials)
- Order creation flow (unchanged)

### Monitoring:
- Watch Payment Service logs for callback errors
- Monitor Order Service for status update failures
- Check database for payment/order status consistency
- Monitor frontend for redirect issues

## ✨ Success Criteria

Deployment is successful when:
- [x] All services start without errors
- [x] Services register with Discovery
- [x] VNPay payment completes successfully
- [x] Payment status updates to PAID
- [x] Order status updates to CONFIRMED
- [x] Frontend redirects to correct order page
- [x] Order detail shows "Đã thanh toán"
- [x] No errors in logs
- [x] Database records are correct

## 🎉 Deployment Complete!

Once all checks pass, the deployment is complete and the payment status update issue is resolved!

---

**Deployed by**: [Your Name]  
**Date**: [Deployment Date]  
**Version**: 1.0.0  
**Status**: ✅ Success / ❌ Failed / ⏸️ Rolled Back
