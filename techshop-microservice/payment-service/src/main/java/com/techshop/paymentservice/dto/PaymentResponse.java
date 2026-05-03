package com.techshop.paymentservice.dto;

import com.techshop.paymentservice.model.Payment.PaymentMethod;
import com.techshop.paymentservice.model.Payment.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private String transactionId;
    private String paymentUrl;  // URL để redirect đến VNPay (nếu method = VNPAY)
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
