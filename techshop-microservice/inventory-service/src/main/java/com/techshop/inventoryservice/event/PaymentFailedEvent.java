package com.techshop.inventoryservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Event nhận từ Kafka khi thanh toán thất bại.
 * Mirror class của PaymentFailedEvent bên Payment Service.
 *
 * Inventory Service lắng nghe event này để thực hiện Saga rollback:
 * - Release (trả lại) stock đã reserve cho từng sản phẩm trong đơn hàng
 * - Đảm bảo hàng không bị "nhốt" vô thời hạn khi đơn hàng bị hủy
 *
 * Đây là bước "compensating transaction" trong Saga Pattern:
 * OrderPlaced → reserve → PaymentFailed → release (undo reserve)
 *
 * QUAN TRỌNG: Các field phải khớp với class bên Payment Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {
    private Long paymentId;
    private Long orderId;
    private String orderCode;
    private Long userId;
    private BigDecimal amount;
    private String reason;

    // Danh sách sản phẩm — để Inventory Service biết chính xác cần release gì
    private List<OrderItemEvent> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemEvent {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
