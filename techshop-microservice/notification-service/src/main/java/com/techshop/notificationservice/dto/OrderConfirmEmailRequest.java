package com.techshop.notificationservice.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderConfirmEmailRequest {
    private String email;
    private String customerName;
    private String orderCode;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String paymentMethod;
}
