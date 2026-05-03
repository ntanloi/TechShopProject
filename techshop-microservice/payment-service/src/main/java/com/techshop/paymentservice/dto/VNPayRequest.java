package com.techshop.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for creating VNPay payment URL
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VNPayRequest {
    private Long orderId;
    private BigDecimal amount;
    private String orderInfo;
    private String bankCode;  // Optional: NCB, VNPAYQR, etc.
    private String language;  // vn or en
}
