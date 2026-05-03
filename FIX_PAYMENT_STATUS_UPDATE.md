# Fix: Payment Status Not Updating After Successful VNPay Payment

## Problem Description

After completing VNPay payment successfully, the order detail page still showed:
- Payment Status: "Chưa thanh toán" (UNPAID)
- Order Status: Not updated to CONFIRMED

Even though the payment was successful and verified by VNPay.

## Root Cause Analysis

The issue was in the payment verification flow:

1. **VNPay Callback Flow**:
   - VNPay redirects to frontend with `vnp_TxnRef` (transaction ID, which is a UUID)
   - Frontend calls backend `/payments/vnpay/callback` with all VNPay params
   - Backend verifies payment and updates payment status to PAID
   - Backend calls Order Service to update order payment status

2. **The Problem**:
   - `PaymentController.handleVNPayCallback()` was returning `VNPayResponse` with `orderId` set to the **transaction ID** (UUID), not the actual **order ID**
   - Frontend was trying to redirect to `/orders/{transactionId}` instead of `/orders/{orderId}`
   - This caused confusion and the order detail page wasn't showing the updated status

3. **Why Payment Status Wasn't Updating**:
   - The payment status WAS being updated in the database correctly
   - The issue was that the frontend was redirecting to the wrong order ID
   - When user manually navigated to the correct order, the status would show as PAID

## Solution Implemented

### 1. Backend: PaymentController.java

**File**: `techshop-microservice/payment-service/src/main/java/com/techshop/paymentservice/controller/PaymentController.java`

**Changes**:
- Modified `handleVNPayCallback()` to return the actual order ID from the payment record
- After calling `paymentService.verifyPayment()`, extract the `orderId` from the `PaymentResponse`
- Rebuild the `VNPayResponse` with the correct order ID
- Added better error handling and logging

```java
@GetMapping("/vnpay/callback")
public ResponseEntity<VNPayResponse> handleVNPayCallback(@RequestParam Map<String, String> params) {
    log.info("VNPay callback received for transaction: {}", params.get("vnp_TxnRef"));
    
    VNPayResponse response = vnPayService.processCallback(params);
    
    if (response.isSuccess()) {
        String transactionId = params.get("vnp_TxnRef");
        String vnpResponseCode = params.get("vnp_ResponseCode");
        
        try {
            // Get the payment record which contains the actual order ID
            PaymentResponse payment = paymentService.verifyPayment(transactionId, vnpResponseCode);
            log.info("Payment verified and updated for transaction: {}, orderId: {}", 
                     transactionId, payment.getOrderId());
            
            // Rebuild response with actual order ID
            response = VNPayResponse.builder()
                    .success(response.isSuccess())
                    .message(response.getMessage())
                    .transactionNo(response.getTransactionNo())
                    .orderId(String.valueOf(payment.getOrderId())) // ✅ Real order ID
                    .build();
            
        } catch (Exception e) {
            log.error("Error updating payment status for transaction: {}", transactionId, e);
            return ResponseEntity.ok(VNPayResponse.builder()
                    .success(false)
                    .message("Error verifying payment: " + e.getMessage())
                    .build());
        }
    }
    
    return ResponseEntity.ok(response);
}
```

**Same fix applied to IPN endpoint** for consistency.

### 2. Frontend: PaymentResult.jsx

**File**: `techshop-frontend/src/pages/PaymentResult.jsx`

**Changes**:
- Updated to use `response.data.orderId` directly (which is now the real order ID)
- Removed fallback to `params.vnp_TxnRef` (which was the transaction ID)
- Reduced redirect timeout from 3 seconds to 2 seconds for better UX
- Added better console logging for debugging

```javascript
if (response.data.success) {
  setStatus("success");
  setMessage(response.data.message || "Thanh toán thành công!");
  
  // Get the REAL order ID from response (not transaction ID)
  const orderId = response.data.orderId;
  
  console.log("Order ID from response:", orderId);
  
  // Redirect to correct order detail page
  setTimeout(() => {
    if (orderId && orderId !== "0") {
      nav(`/orders/${orderId}`);
    } else {
      nav("/orders");
    }
  }, 2000);
}
```

### 3. Frontend: OrderDetail.jsx

**File**: `techshop-frontend/src/pages/OrderDetail.jsx`

**Changes**:
- Fixed useEffect dependencies to include `nav` to prevent warnings
- Ensured order data is fetched fresh when page loads
- This ensures the updated payment status is displayed immediately

```javascript
useEffect(() => {
  if (!user) { nav("/login"); return; }
  
  const fetchOrder = () => {
    orderApi.getById(id)
      .then((r) => {
        console.log("Order data received:", r.data);
        setOrder(r.data);
      })
      .catch(() => nav("/orders"))
      .finally(() => setLoading(false));
  };
  
  fetchOrder();
}, [id, user, nav]); // ✅ Added nav to dependencies
```

## How the Fixed Flow Works

### Complete Payment Flow:

1. **User creates order** → Order Service creates order with status PENDING, paymentStatus UNPAID
2. **Order Service calls Payment Service** → Creates payment record with unique transaction ID (UUID)
3. **Payment Service returns payment URL** → Order Service saves it to `order.paymentUrl`
4. **Frontend redirects to VNPay** → User enters OTP and confirms payment
5. **VNPay redirects back** → Frontend receives callback with `vnp_TxnRef` (transaction ID)
6. **Frontend calls backend** → `/payments/vnpay/callback` with all VNPay params
7. **Backend verifies signature** → VNPayService validates HMAC-SHA512 signature
8. **Backend updates payment** → PaymentService finds payment by transaction ID, sets status to PAID
9. **Backend updates order** → PaymentService calls OrderClient to update order payment status
10. **Order Service updates** → Sets paymentStatus to PAID, orderStatus to CONFIRMED
11. **Backend returns response** → With the REAL order ID (not transaction ID)
12. **Frontend redirects** → To `/orders/{orderId}` with the correct order ID
13. **Order detail page loads** → Shows updated status "Đã thanh toán" (PAID)

### Key Points:

- **Transaction ID (vnp_TxnRef)**: UUID generated by Payment Service, used to track payment
- **Order ID**: Sequential ID from Order Service, used to identify the order
- **Mapping**: Payment record links transaction ID to order ID
- **Status Update**: Happens in PaymentService.verifyPayment() → calls OrderClient.updatePaymentStatus()
- **Frontend Redirect**: Now uses the correct order ID from the payment record

## Testing Instructions

### 1. Start Services

```bash
# Start Discovery Service (port 8761)
cd techshop-microservice/discovery-service
mvn spring-boot:run

# Start Order Service (port 8083)
cd techshop-microservice/order-service
mvn spring-boot:run

# Start Payment Service (port 8085)
cd techshop-microservice/payment-service
mvn spring-boot:run

# Start Frontend (port 5173)
cd techshop-frontend
npm run dev
```

### 2. Test Payment Flow

1. Login to the application
2. Add products to cart
3. Go to checkout
4. Fill in shipping information
5. Select "VNPay" as payment method
6. Click "Đặt hàng" (Place Order)
7. You should be redirected to VNPay payment page
8. Use test card:
   - Card Number: `9704198526191432198`
   - Card Holder: `NGUYEN VAN A`
   - Issue Date: `07/15`
   - OTP: `123456`
9. Complete payment
10. You should see "Thanh toán thành công!" message
11. After 2 seconds, you'll be redirected to order detail page
12. **Verify**: Payment status shows "Đã thanh toán" (PAID)
13. **Verify**: Order status shows "Đã xác nhận" (CONFIRMED)

### 3. Check Backend Logs

Look for these log messages:

```
Payment Service:
- "VNPay callback received for transaction: {uuid}"
- "Payment verified and updated for transaction: {uuid}, orderId: {id}"

Order Service:
- "Order {id} payment status updated to PAID"
- "Order {id} marked as PAID"
```

### 4. Check Database

```sql
-- Check payment record
SELECT * FROM payments WHERE transaction_id = '{uuid}';
-- Should show: status = 'PAID', paid_at = {timestamp}

-- Check order record
SELECT * FROM orders WHERE id = {orderId};
-- Should show: payment_status = 'PAID', status = 'CONFIRMED'
```

## Files Modified

1. **Backend**:
   - `techshop-microservice/payment-service/src/main/java/com/techshop/paymentservice/controller/PaymentController.java`

2. **Frontend**:
   - `techshop-frontend/src/pages/PaymentResult.jsx`
   - `techshop-frontend/src/pages/OrderDetail.jsx`

## Related Documentation

- `VNPAY_INTEGRATION.md` - Complete VNPay integration guide
- `VNPAY_TEST_GUIDE.md` - Testing instructions
- `FIX_VNPAY_REDIRECT.md` - Previous fix for payment URL issue
- `FIX_PAYMENT_CALLBACK.md` - Previous fix for return URL issue
- `FIX_CORS_ERROR.md` - CORS configuration fix

## Notes

- The payment status update was working correctly in the backend all along
- The issue was purely a frontend redirect problem using the wrong ID
- No database changes were needed for this fix
- The fix ensures the correct order ID is returned to the frontend
- This allows proper navigation to the order detail page with updated status

## Success Criteria

✅ After successful VNPay payment:
- Payment status in database is PAID
- Order status in database is CONFIRMED
- Frontend redirects to correct order detail page
- Order detail page shows "Đã thanh toán" (PAID)
- Order detail page shows "Đã xác nhận" (CONFIRMED)
- No more "Cannot access this page" errors
- No more wrong order ID in URL

## Troubleshooting

### If payment status still not updating:

1. **Check backend logs** - Look for errors in PaymentService.verifyPayment()
2. **Check OrderClient** - Ensure Feign client can reach Order Service
3. **Check database** - Verify payment and order records are being updated
4. **Check frontend console** - Look for the order ID being logged
5. **Restart services** - Ensure all services are running latest code

### If redirect goes to wrong page:

1. **Check response.data.orderId** - Should be a number, not a UUID
2. **Check backend logs** - Should show "orderId: {number}"
3. **Clear browser cache** - Ensure latest frontend code is loaded

## Conclusion

The payment status update issue has been resolved by ensuring the correct order ID is returned from the backend payment verification endpoint and used by the frontend for navigation. The payment verification and status update logic was working correctly; the issue was purely in the ID mapping between transaction ID and order ID in the response.
