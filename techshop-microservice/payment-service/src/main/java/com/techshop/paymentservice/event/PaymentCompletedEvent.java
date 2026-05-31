package com.techshop.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Event được bắn lên Kafka khi thanh toán hoàn thành thành công.
 *
 * Các service lắng nghe topic 'payment-completed-topic':
 * - Order Service: Cập nhật trạng thái đơn hàng → CONFIRMED + PAID
 * - Inventory Service: Xác nhận reserve (hàng đã được đặt, chờ giao)
 * - Notification Service: Gửi email xác nhận thanh toán
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {

    // ID payment (khóa chính trong DB Payment Service)
    private Long paymentId;

    // ID đơn hàng liên quan
    private Long orderId;

    // Mã đơn hàng (để Order Service và Notification Service xử lý)
    private String orderCode;

    // Thông tin người dùng (để Notification Service gửi email)
    private Long userId;
    private String userEmail;
    private String receiverName;

    // Số tiền đã thanh toán
    private BigDecimal amount;

    // Phương thức: COD, VNPAY, BANK_TRANSFER
    private String paymentMethod;
}
