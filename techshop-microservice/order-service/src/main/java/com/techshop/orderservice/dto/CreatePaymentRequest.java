package com.techshop.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

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

    // Thông tin bổ sung để Payment Service lưu snapshot và dùng khi bắn Kafka event
    private String orderCode;    // Mã đơn hàng
    private String userEmail;    // Email người đặt hàng
    private String receiverName; // Tên người nhận hàng

    // Danh sách sản phẩm — để Payment Service lưu và bắn trong PaymentFailedEvent
    // Inventory Service dùng để auto-release stock khi thanh toán thất bại
    private List<OrderItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
