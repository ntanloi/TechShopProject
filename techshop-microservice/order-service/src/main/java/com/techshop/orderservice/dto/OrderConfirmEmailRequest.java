package com.techshop.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfirmEmailRequest {
    private Long orderId;
    private String email;
    private String customerName;
    private String orderCode;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
}
