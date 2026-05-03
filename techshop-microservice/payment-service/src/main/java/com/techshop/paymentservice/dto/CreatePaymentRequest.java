package com.techshop.paymentservice.dto;

import com.techshop.paymentservice.model.Payment.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentRequest {
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private PaymentMethod method;
    private String returnUrl;  // URL để redirect sau khi thanh toán VNPay
}
