package com.techshop.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Event được bắn lên Kafka khi thanh toán thất bại.
 *
 * Các service lắng nghe topic 'payment-failed-topic':
 * - Order Service: Saga rollback - hủy đơn hàng (status = CANCELLED)
 * - Inventory Service: Saga rollback - trả lại stock đã reserve
 * - (Tùy chọn) Notification Service: Thông báo cho user về việc thanh toán thất bại
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {

    // ID payment
    private Long paymentId;

    // ID và mã đơn hàng
    private Long orderId;
    private String orderCode;

    // Thông tin người dùng
    private Long userId;
    private BigDecimal amount;

    // Lý do thất bại (mã lỗi VNPay hoặc mô tả khác)
    // Ví dụ: "07" = tài khoản bị trừ tiền nhưng giao dịch chưa thành công
    //         "09" = thẻ/tài khoản chưa đăng ký dịch vụ
    private String reason;

    // Danh sách sản phẩm trong đơn hàng — để Inventory Service tự release stock
    // Đây là fix cho known bug: trước đây Inventory không biết items nào cần release
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
