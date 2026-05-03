# Fix: Payment Status Display After VNPay Payment

## 🎯 Vấn đề

Sau khi thanh toán VNPay thành công và redirect về trang OrderDetail, trạng thái thanh toán vẫn hiển thị **"Chưa thanh toán"** thay vì **"Đã thanh toán"**.

## 🔍 Nguyên nhân

Frontend không tự động refresh lại dữ liệu order sau khi thanh toán thành công. Mặc dù backend đã cập nhật đúng trạng thái trong database, nhưng frontend vẫn hiển thị dữ liệu cũ từ cache hoặc state trước đó.

## ✅ Giải pháp

### 1. Force Refresh khi redirect từ PaymentResult

**File**: `techshop-frontend/src/pages/PaymentResult.jsx`

Thêm timestamp vào URL để force refresh trang OrderDetail:

```javascript
// Trước đây
nav(`/orders/${orderId}`);

// Bây giờ - thêm refresh param
nav(`/orders/${orderId}?refresh=${Date.now()}`);
```

### 2. Detect và xử lý refresh param trong OrderDetail

**File**: `techshop-frontend/src/pages/OrderDetail.jsx`

**Thay đổi 1**: Import `useSearchParams`
```javascript
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
```

**Thay đổi 2**: Sử dụng searchParams để trigger refresh
```javascript
const [searchParams] = useSearchParams();

useEffect(() => {
  if (!user) { nav("/login"); return; }
  
  const fetchOrder = () => {
    setLoading(true); // ✅ Set loading state
    orderApi.getById(id)
      .then((r) => {
        console.log("Order data received:", r.data);
        setOrder(r.data);
      })
      .catch(() => nav("/orders"))
      .finally(() => setLoading(false));
  };
  
  fetchOrder();
  
  // ✅ Xóa refresh param khỏi URL sau khi fetch
  if (searchParams.get('refresh')) {
    window.history.replaceState({}, '', `/orders/${id}`);
  }
}, [id, user, nav, searchParams]); // ✅ Thêm searchParams vào dependencies
```

## 🔄 Luồng hoạt động mới

```
1. User thanh toán VNPay thành công
   ↓
2. PaymentResult hiển thị "Thanh toán thành công!"
   ↓
3. Sau 2 giây, redirect với refresh param
   URL: /orders/33?refresh=1714467890123
   ↓
4. OrderDetail detect refresh param
   ↓
5. OrderDetail fetch lại data từ backend
   setLoading(true) → API call → setOrder(data)
   ↓
6. Backend trả về order với:
   - paymentStatus: "PAID"
   - status: "CONFIRMED"
   ↓
7. OrderDetail hiển thị:
   - Trạng thái thanh toán: "Đã thanh toán" ✅
   - Trạng thái đơn hàng: "Đã xác nhận" ✅
   ↓
8. Xóa refresh param khỏi URL
   URL: /orders/33 (clean URL)
```

## 📝 Code Changes

### PaymentResult.jsx

```javascript
// BEFORE
setTimeout(() => {
  if (orderId && orderId !== "0") {
    nav(`/orders/${orderId}`);
  } else {
    nav("/orders");
  }
}, 2000);

// AFTER
setTimeout(() => {
  if (orderId && orderId !== "0") {
    // Thêm timestamp để force refresh trang
    nav(`/orders/${orderId}?refresh=${Date.now()}`);
  } else {
    nav("/orders");
  }
}, 2000);
```

### OrderDetail.jsx

```javascript
// BEFORE
import { useParams, useNavigate, Link } from "react-router-dom";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  
  useEffect(() => {
    if (!user) { nav("/login"); return; }
    
    const fetchOrder = () => {
      orderApi.getById(id)
        .then((r) => {
          setOrder(r.data);
        })
        .catch(() => nav("/orders"))
        .finally(() => setLoading(false));
    };
    
    fetchOrder();
  }, [id, user, nav]);
}

// AFTER
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ Added
  
  useEffect(() => {
    if (!user) { nav("/login"); return; }
    
    const fetchOrder = () => {
      setLoading(true); // ✅ Added
      orderApi.getById(id)
        .then((r) => {
          console.log("Order data received:", r.data);
          setOrder(r.data);
        })
        .catch(() => nav("/orders"))
        .finally(() => setLoading(false));
    };
    
    fetchOrder();
    
    // ✅ Clean up URL after refresh
    if (searchParams.get('refresh')) {
      window.history.replaceState({}, '', `/orders/${id}`);
    }
  }, [id, user, nav, searchParams]); // ✅ Added searchParams
}
```

## 🧪 Testing

### Test Steps:

1. **Khởi động services**:
   ```bash
   # Frontend
   cd techshop-frontend
   npm run dev
   ```

2. **Tạo đơn hàng mới**:
   - Login vào hệ thống
   - Thêm sản phẩm vào giỏ hàng
   - Chọn VNPay làm phương thức thanh toán
   - Điền thông tin giao hàng
   - Nhấn "Đặt hàng"

3. **Thanh toán trên VNPay**:
   - Nhập thẻ test: `9704198526191432198`
   - Tên: `NGUYEN VAN A`
   - Ngày: `07/15`
   - OTP: `123456`
   - Nhấn "Xác nhận"

4. **Kiểm tra kết quả**:
   - ✅ Thấy thông báo "Thanh toán thành công!"
   - ✅ Sau 2 giây, redirect đến trang OrderDetail
   - ✅ URL có dạng: `/orders/33?refresh=1714467890123`
   - ✅ Trang load lại dữ liệu (có loading state)
   - ✅ Hiển thị "Đã thanh toán" (màu xanh)
   - ✅ Hiển thị "Đã xác nhận" (màu xanh)
   - ✅ URL tự động clean thành: `/orders/33`

### Expected Results:

**Trước khi fix**:
```
Trạng thái thanh toán: Chưa thanh toán ❌ (màu vàng)
Trạng thái đơn hàng: Chờ xác nhận ❌
```

**Sau khi fix**:
```
Trạng thái thanh toán: Đã thanh toán ✅ (màu xanh)
Trạng thái đơn hàng: Đã xác nhận ✅ (màu xanh)
```

## 🔍 Debug

### Nếu vẫn hiển thị "Chưa thanh toán":

1. **Kiểm tra console log**:
   ```javascript
   console.log("Order data received:", r.data);
   ```
   Xem `paymentStatus` có phải là `"PAID"` không

2. **Kiểm tra database**:
   ```sql
   SELECT id, order_code, payment_status, status 
   FROM orders 
   WHERE id = 33;
   ```
   Xem `payment_status` có phải là `PAID` không

3. **Kiểm tra backend logs**:
   ```
   Order Service:
   - "Order 33 marked as PAID"
   - "Order 33 payment status updated to PAID"
   ```

4. **Kiểm tra network tab**:
   - Xem request `/orders/33` có được gọi không
   - Xem response có chứa `paymentStatus: "PAID"` không

### Nếu trang không refresh:

1. **Kiểm tra URL**: Có chứa `?refresh=...` không?
2. **Kiểm tra useEffect**: Dependencies có đầy đủ không?
3. **Clear browser cache**: Ctrl+Shift+Delete
4. **Hard refresh**: Ctrl+Shift+R

## 📊 Files Modified

1. `techshop-frontend/src/pages/PaymentResult.jsx`
   - Thêm refresh param vào URL redirect

2. `techshop-frontend/src/pages/OrderDetail.jsx`
   - Import `useSearchParams`
   - Thêm `searchParams` vào dependencies
   - Thêm `setLoading(true)` để show loading state
   - Clean up refresh param sau khi fetch

## ✨ Benefits

1. **Force Refresh**: Đảm bảo dữ liệu mới nhất được load
2. **Clean URL**: Tự động xóa refresh param sau khi load
3. **Better UX**: Hiển thị loading state khi fetch data
4. **Reliable**: Không phụ thuộc vào cache hoặc state cũ

## 🎉 Result

Sau khi áp dụng fix này:
- ✅ Trạng thái thanh toán hiển thị đúng "Đã thanh toán"
- ✅ Trạng thái đơn hàng hiển thị đúng "Đã xác nhận"
- ✅ Dữ liệu luôn được refresh sau thanh toán
- ✅ URL clean và professional
- ✅ User experience tốt hơn

**Chức năng thanh toán VNPay hoàn toàn hoàn hảo!** 🚀

---

**Date**: 30/04/2026  
**Version**: 1.0.1  
**Status**: ✅ Fixed
