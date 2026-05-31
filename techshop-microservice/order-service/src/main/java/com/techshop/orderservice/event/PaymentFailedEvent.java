package com.techshop.orderservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Event nhận từ Kafka khi Payment Service báo thanh toán thất bại.
 * Mirror class của PaymentFailedEvent bên Payment Service.
 *
 * Order Service lắng nghe event này để:
 * - Cập nhật trạng thái đơn hàng thành CANCELLED (Saga rollback)
 * - Cập nhật paymentStatus thành FAILED
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

    // Lý do thanh toán thất bại (mã lỗi từ VNPay hoặc mô tả khác)
    private String reason;
}
