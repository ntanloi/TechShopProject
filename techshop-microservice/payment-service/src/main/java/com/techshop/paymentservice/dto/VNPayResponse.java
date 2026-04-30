package com.techshop.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for VNPay payment operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VNPayResponse {
    private String paymentUrl;
    private String transactionNo;
    private String orderId;
    private String message;
    private boolean success;
}
