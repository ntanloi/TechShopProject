package com.techshop.orderservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Event nhận từ Kafka khi Payment Service xác nhận thanh toán thành công.
 * Mirror class của PaymentCompletedEvent bên Payment Service.
 *
 * Order Service lắng nghe event này để:
 * - Cập nhật trạng thái đơn hàng thành CONFIRMED
 * - Cập nhật paymentStatus thành PAID
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
