# 🚀 VNPay Integration - Start Here

## 📋 Tóm tắt

Bạn đang gặp vấn đề: **Chọn VNPay nhưng không redirect đến trang thanh toán VNPay**.

**Nguyên nhân:** Order Service không trả về `paymentUrl` cho frontend.

**Giải pháp:** Thêm field `paymentUrl` vào Order model và database.

## ⚡ Quick Fix (5 phút)

### Bước 1: Chạy script tự động

**Windows:**
```bash
fix-vnpay.bat
```

**Linux/Mac:**
```bash
chmod +x fix-vnpay.sh
./fix-vnpay.sh
```

Script sẽ:
- ✅ Thêm column `payment_url` vào database
- ✅ Verify column đã được thêm

### Bước 2: Restart Order Service

```bash
cd techshop-microservice/order-service
mvn spring-boot:run
```

### Bước 3: Test

1. Mở http://localhost:5173/checkout
2. Chọn **VNPay**
3. Click **"Đặt hàng ngay"**
4. ✅ Bạn sẽ được redirect đến VNPay!

### Bước 4: Thanh toán test

Nhập thông tin thẻ test:
```
Số thẻ: 9704198526191432198
Tên: NGUYEN VAN A
Ngày: 07/15
OTP: 123456
```

## 📚 Chi tiết

### Đã thay đổi gì?

1. **Order.java** - Thêm field `paymentUrl`
2. **OrderService.java** - Lưu `paymentUrl` từ PaymentResponse
3. **Database** - Thêm column `payment_url`

### Files quan trọng

- 📖 **[VNPAY_FIX_SUMMARY.md](VNPAY_FIX_SUMMARY.md)** - Tóm tắt fix
- 📖 **[FIX_VNPAY_REDIRECT.md](FIX_VNPAY_REDIRECT.md)** - Hướng dẫn chi tiết
- 📖 **[VNPAY_INTEGRATION_SUMMARY.md](VNPAY_INTEGRATION_SUMMARY.md)** - Tổng quan VNPay
- 📖 **[VNPAY_FRONTEND_GUIDE.md](VNPAY_FRONTEND_GUIDE.md)** - Hướng dẫn frontend

## 🔧 Nếu gặp vấn đề

### Script không chạy được?

**Chạy SQL thủ công:**
```sql
USE techshop_orderdb;

ALTER TABLE orders 
ADD COLUMN payment_url VARCHAR(1000) NULL;
```

### Payment URL vẫn null?

**Check Payment Service:**
```bash
curl http://localhost:8085/actuator/health
```

**Check logs:**
```bash
tail -f techshop-microservice/order-service/logs/order-service.log
```

### Vẫn không redirect?

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check console log (F12)
4. Xem [FIX_VNPAY_REDIRECT.md](FIX_VNPAY_REDIRECT.md)

## ✅ Checklist

- [ ] Chạy fix script
- [ ] Restart Order Service
- [ ] Test checkout với VNPay
- [ ] Verify redirect đến VNPay
- [ ] Test thanh toán với thẻ test
- [ ] Verify callback xử lý đúng

## 🎯 Expected Result

**Before:**
```
Chọn VNPay → Chuyển đến order detail ❌
```

**After:**
```
Chọn VNPay → Redirect đến VNPay → Thanh toán → Callback ✅
```

## 📞 Need Help?

1. Đọc [FIX_VNPAY_REDIRECT.md](FIX_VNPAY_REDIRECT.md) - Troubleshooting chi tiết
2. Đọc [VNPAY_INTEGRATION.md](techshop-microservice/payment-service/VNPAY_INTEGRATION.md) - VNPay docs
3. Check logs trong `techshop-microservice/*/logs/`

## 🎉 Success!

Sau khi fix xong, bạn có thể:
- ✅ Thanh toán qua VNPay
- ✅ Test với thẻ sandbox
- ✅ Xem order detail sau thanh toán
- ✅ Verify payment status

---

**Bắt đầu ngay:** Chạy `fix-vnpay.bat` (Windows) hoặc `./fix-vnpay.sh` (Linux/Mac)
