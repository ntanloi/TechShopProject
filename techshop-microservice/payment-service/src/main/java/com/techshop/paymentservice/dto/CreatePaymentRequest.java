package com.techshop.paymentservice.dto;

import com.techshop.paymentservice.model.Payment.PaymentMethod;
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
    private PaymentMethod method;
    private String returnUrl;  // URL để redirect sau khi thanh toán VNPay

    // Thông tin bổ sung để Payment Service lưu và dùng khi bắn Kafka event
    private String orderCode;   // Mã đơn hàng
    private String userEmail;   // Email người dùng
    private String receiverName; // Tên người nhận

    // Danh sách sản phẩm trong đơn hàng — dùng để bắn PaymentFailedEvent
    // cho Inventory Service tự động release stock khi thanh toán thất bại
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
