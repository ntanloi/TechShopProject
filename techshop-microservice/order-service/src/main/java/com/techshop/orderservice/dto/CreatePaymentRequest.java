package com.techshop.orderservice.dto;

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
    private String method;  // COD, VNPAY, BANK_TRANSFER
    private String returnUrl;
}
