package com.techshop.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Event nhận từ Kafka khi có đơn hàng được tạo mới.
 * Mirror class của OrderPlacedEvent bên Order Service.
 *
 * Notification Service lắng nghe event này để:
 * - Gửi email xác nhận đơn hàng cho khách
 * - Gửi thông báo in-app cho khách
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent {

    // ID đơn hàng trong database của Order Service
    private Long orderId;

    // Mã đơn hàng hiển thị cho người dùng (VD: TS20241231123456001)
    private String orderCode;

    // ID và email người đặt hàng
    private Long userId;
    private String userEmail;

    // Tên người nhận hàng (có thể khác tên tài khoản)
    private String receiverName;

    // Địa chỉ giao hàng
    private String shippingAddress;

    // Tổng tiền đơn hàng
    private BigDecimal totalAmount;

    // Phương thức thanh toán: COD, VNPAY, BANK_TRANSFER
    private String paymentMethod;

    // Danh sách sản phẩm trong đơn (dùng để hiển thị trong email)
    private List<OrderItemEvent> items;

    /**
     * DTO con đại diện cho một sản phẩm trong đơn hàng.
     * Tách ra để không phụ thuộc vào OrderItem entity.
     */
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
