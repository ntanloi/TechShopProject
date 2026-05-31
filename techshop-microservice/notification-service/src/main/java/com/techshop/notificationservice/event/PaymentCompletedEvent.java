package com.techshop.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Event nhận từ Kafka khi thanh toán hoàn thành thành công.
 * Mirror class của PaymentCompletedEvent bên Payment Service.
 *
 * Notification Service lắng nghe event này để:
 * - Gửi email xác nhận thanh toán thành công
 * - Gửi thông báo in-app cho khách
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {

    // ID payment trong database của Payment Service
    private Long paymentId;

    // ID đơn hàng liên quan
    private Long orderId;

    // Mã đơn hàng (hiển thị cho người dùng)
    private String orderCode;

    // ID và email người dùng
    private Long userId;
    private String userEmail;

    // Tên người nhận (để cá nhân hóa email)
    private String receiverName;

    // Số tiền đã thanh toán
    private BigDecimal amount;

    // Phương thức thanh toán: COD, VNPAY, BANK_TRANSFER
    private String paymentMethod;
}
