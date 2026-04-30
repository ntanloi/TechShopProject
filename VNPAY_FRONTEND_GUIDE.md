# VNPay Frontend Integration Guide

Hướng dẫn tích hợp VNPay cho Frontend Developer

## 🎯 Overview

Frontend cần implement 2 luồng chính:
1. **Tạo payment và redirect đến VNPay**
2. **Xử lý callback sau khi thanh toán**

## 🔄 Luồng thanh toán

```
User chọn VNPay
    ↓
Frontend gọi API tạo payment
    ↓
Nhận payment URL
    ↓
Redirect user đến VNPay
    ↓
User thanh toán trên VNPay
    ↓
VNPay redirect về return URL
    ↓
Frontend xử lý callback
    ↓
Hiển thị kết quả
```

## 📡 API Endpoints

### Base URL
```
Development: http://localhost:8085
Production: https://api.techshop.com
```

### 1. Tạo Payment với Order

**Endpoint:** `POST /payments`

**Request:**
```typescript
interface CreatePaymentRequest {
  orderId: number;
  userId: number;
  amount: number;
  method: 'VNPAY' | 'COD' | 'BANK_TRANSFER';
  returnUrl?: string; // Optional, override default
}
```

**Example:**
```typescript
const response = await fetch('http://localhost:8085/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: 123,
    userId: 1,
    amount: 100000,
    method: 'VNPAY',
    returnUrl: 'http://localhost:5173/payment-result'
  })
});

const data = await response.json();
// data.paymentUrl - URL để redirect
```

**Response:**
```typescript
interface PaymentResponse {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  transactionId: string;
  paymentUrl: string; // URL để redirect đến VNPay
  createdAt: string;
  paidAt: string | null;
}
```

### 2. Tạo Payment URL trực tiếp (không cần order trước)

**Endpoint:** `POST /payments/vnpay/create`

**Request:**
```typescript
interface VNPayRequest {
  orderId: number;
  amount: number;
  orderInfo: string;
  bankCode?: string; // Optional: 'NCB', 'VNPAYQR', etc.
  language?: string; // Optional: 'vn' or 'en'
}
```

**Example:**
```typescript
const response = await fetch('http://localhost:8085/payments/vnpay/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: 123,
    amount: 100000,
    orderInfo: 'Thanh toan don hang #123',
    bankCode: 'NCB',
    language: 'vn'
  })
});

const data = await response.json();
```

**Response:**
```typescript
interface VNPayResponse {
  paymentUrl: string;
  transactionNo: string;
  orderId: string;
  message: string;
  success: boolean;
}
```

### 3. Verify Payment (Callback)

**Endpoint:** `GET /payments/vnpay/callback`

**Query Parameters:** (Tự động từ VNPay)
```typescript
interface VNPayCallbackParams {
  vnp_TxnRef: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_SecureHash: string;
  // ... other params
}
```

**Example:**
```typescript
// VNPay sẽ redirect về: http://localhost:5173/payment-result?vnp_TxnRef=...&vnp_ResponseCode=00&...

// Frontend gọi API để verify
const params = new URLSearchParams(window.location.search);
const response = await fetch(`http://localhost:8085/payments/vnpay/callback?${params.toString()}`);
const data = await response.json();

if (data.success) {
  // Payment thành công
  showSuccessMessage();
  redirectToOrderDetail(data.orderId);
} else {
  // Payment thất bại
  showErrorMessage(data.message);
}
```

## 💻 React Implementation

### 1. Create Payment Hook

```typescript
// hooks/useVNPayPayment.ts
import { useState } from 'react';

interface CreatePaymentParams {
  orderId: number;
  userId: number;
  amount: number;
}

export const useVNPayPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (params: CreatePaymentParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8085/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          method: 'VNPAY',
          returnUrl: `${window.location.origin}/payment-result`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      
      // Redirect to VNPay
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPayment, loading, error };
};
```

### 2. Checkout Component

```typescript
// components/Checkout.tsx
import React from 'react';
import { useVNPayPayment } from '../hooks/useVNPayPayment';

interface CheckoutProps {
  orderId: number;
  userId: number;
  amount: number;
}

export const Checkout: React.FC<CheckoutProps> = ({ orderId, userId, amount }) => {
  const { createPayment, loading, error } = useVNPayPayment();

  const handleVNPayPayment = async () => {
    try {
      await createPayment({ orderId, userId, amount });
      // User will be redirected to VNPay
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  return (
    <div className="checkout">
      <h2>Thanh toán</h2>
      <div className="payment-methods">
        <button 
          onClick={handleVNPayPayment}
          disabled={loading}
          className="btn-vnpay"
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán qua VNPay'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### 3. Payment Result Component

```typescript
// pages/PaymentResult.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `http://localhost:8085/payments/vnpay/callback?${searchParams.toString()}`
        );
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setResult({
          success: false,
          message: 'Có lỗi xảy ra khi xác thực thanh toán'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return <div className="loading">Đang xác thực thanh toán...</div>;
  }

  return (
    <div className="payment-result">
      {result?.success ? (
        <div className="success">
          <h2>✅ Thanh toán thành công!</h2>
          <p>{result.message}</p>
          <button onClick={() => navigate(`/orders/${result.orderId}`)}>
            Xem đơn hàng
          </button>
        </div>
      ) : (
        <div className="error">
          <h2>❌ Thanh toán thất bại</h2>
          <p>{result?.message}</p>
          <button onClick={() => navigate('/cart')}>
            Quay lại giỏ hàng
          </button>
        </div>
      )}
    </div>
  );
};
```

## 🎨 Vue.js Implementation

### 1. Composable

```typescript
// composables/useVNPayPayment.ts
import { ref } from 'vue';

export const useVNPayPayment = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const createPayment = async (params: {
    orderId: number;
    userId: number;
    amount: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('http://localhost:8085/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          method: 'VNPAY',
          returnUrl: `${window.location.origin}/payment-result`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { createPayment, loading, error };
};
```

### 2. Checkout Component

```vue
<!-- components/Checkout.vue -->
<template>
  <div class="checkout">
    <h2>Thanh toán</h2>
    <div class="payment-methods">
      <button 
        @click="handleVNPayPayment"
        :disabled="loading"
        class="btn-vnpay"
      >
        {{ loading ? 'Đang xử lý...' : 'Thanh toán qua VNPay' }}
      </button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { useVNPayPayment } from '@/composables/useVNPayPayment';

const props = defineProps<{
  orderId: number;
  userId: number;
  amount: number;
}>();

const { createPayment, loading, error } = useVNPayPayment();

const handleVNPayPayment = async () => {
  try {
    await createPayment({
      orderId: props.orderId,
      userId: props.userId,
      amount: props.amount
    });
  } catch (err) {
    console.error('Payment failed:', err);
  }
};
</script>
```

## 🔍 Response Codes

```typescript
const VNPAY_RESPONSE_CODES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
  '09': 'Chưa đăng ký InternetBanking',
  '10': 'Xác thực thông tin không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Sai mật khẩu xác thực (OTP)',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Vượt quá hạn mức giao dịch',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Nhập sai mật khẩu quá số lần quy định',
  '99': 'Lỗi không xác định'
};

const getResponseMessage = (code: string): string => {
  return VNPAY_RESPONSE_CODES[code] || 'Lỗi không xác định';
};
```

## 🎯 Best Practices

### 1. Error Handling

```typescript
try {
  await createPayment(params);
} catch (error) {
  if (error instanceof NetworkError) {
    showError('Lỗi kết nối. Vui lòng thử lại.');
  } else if (error instanceof ValidationError) {
    showError('Thông tin không hợp lệ.');
  } else {
    showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
  }
}
```

### 2. Loading States

```typescript
// Show loading indicator
setLoading(true);

// Disable payment button
<button disabled={loading}>
  {loading ? 'Đang xử lý...' : 'Thanh toán'}
</button>

// Hide loading after redirect or error
```

### 3. Validation

```typescript
const validatePayment = (params: CreatePaymentParams): boolean => {
  if (params.amount <= 0) {
    showError('Số tiền không hợp lệ');
    return false;
  }
  
  if (!params.orderId) {
    showError('Không tìm thấy đơn hàng');
    return false;
  }
  
  return true;
};
```

### 4. Security

```typescript
// Always use HTTPS in production
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.techshop.com'
  : 'http://localhost:8085';

// Don't store sensitive data in localStorage
// Don't log payment details
```

## 📱 Mobile Considerations

### Deep Linking

```typescript
// For mobile apps, use deep link as return URL
const returnUrl = Platform.OS === 'web'
  ? `${window.location.origin}/payment-result`
  : 'techshop://payment-result';
```

### WebView

```typescript
// Handle WebView navigation
const handleNavigationStateChange = (navState: any) => {
  if (navState.url.includes('/payment-result')) {
    // Extract params and verify payment
    const params = extractParams(navState.url);
    verifyPayment(params);
  }
};
```

## 🧪 Testing

### Test Data

```typescript
const TEST_CARD = {
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456'
};

const TEST_PAYMENT = {
  orderId: 1,
  userId: 1,
  amount: 100000
};
```

### Mock API

```typescript
// For development without backend
const mockCreatePayment = async (params: CreatePaymentParams) => {
  await delay(1000);
  return {
    id: 1,
    ...params,
    method: 'VNPAY',
    status: 'PENDING',
    transactionId: 'mock-txn-123',
    paymentUrl: 'https://sandbox.vnpayment.vn/...',
    createdAt: new Date().toISOString(),
    paidAt: null
  };
};
```

## 📝 Checklist

- [ ] Implement create payment function
- [ ] Implement redirect to VNPay
- [ ] Implement payment result page
- [ ] Implement callback verification
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add validation
- [ ] Test with sandbox
- [ ] Test error scenarios
- [ ] Update for production URLs

## 🔗 Resources

- [Payment Service API](http://localhost:8085/swagger-ui.html)
- [VNPay Demo](https://sandbox.vnpayment.vn/apis/vnpay-demo/)
- [Backend Integration Guide](techshop-microservice/payment-service/VNPAY_INTEGRATION.md)

## 💡 Tips

1. **Always verify payment on backend** - Không tin tưởng callback từ frontend
2. **Handle timeout** - VNPay có timeout 15 phút
3. **Show clear messages** - Hiển thị rõ ràng trạng thái thanh toán
4. **Log for debugging** - Log payment flow để debug
5. **Test thoroughly** - Test tất cả scenarios (success, cancel, fail)

## 🆘 Troubleshooting

### Payment URL không được tạo
- Kiểm tra backend đang chạy
- Kiểm tra request body đúng format
- Xem console log

### Redirect không hoạt động
- Kiểm tra paymentUrl có hợp lệ
- Kiểm tra popup blocker
- Thử window.location.href thay vì window.open

### Callback không được gọi
- Kiểm tra return URL đúng
- Kiểm tra routing trong app
- Kiểm tra query parameters

---

**Need help?** Contact backend team hoặc xem [VNPAY_INTEGRATION.md](techshop-microservice/payment-service/VNPAY_INTEGRATION.md)
