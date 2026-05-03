package com.techshop.orderservice.dto;

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
    private String method;
    private String status;
    private String transactionId;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
