package com.techshop.inventoryservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Event nhận từ Kafka khi thanh toán hoàn thành thành công.
 * Mirror class của PaymentCompletedEvent bên Payment Service.
 *
 * Inventory Service lắng nghe event này:
 * - Hiện tại: Không làm gì thêm (stock đã reserve từ lúc tạo đơn)
 * - Tương lai: Có thể chuyển trạng thái inventory từ RESERVED → CONFIRMED
 *   để phân biệt hàng đã được thanh toán vs chưa thanh toán
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    private Long paymentId;
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private String receiverName;
    private BigDecimal amount;
    private String paymentMethod;
}
