package com.techshop.orderservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Event được bắn lên Kafka khi có đơn hàng mới được tạo thành công.
 *
 * Các service lắng nghe topic 'order-placed-topic':
 * - Inventory Service: Reserve stock cho từng sản phẩm
 * - Notification Service: Gửi email xác nhận đơn hàng
 *
 * Mỗi event mang đủ thông tin để các consumer xử lý độc lập,
 * không cần gọi thêm API về Order Service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent {

    // ID đơn hàng (khóa chính trong DB của Order Service)
    private Long orderId;

    // Mã đơn hàng hiển thị cho người dùng
    private String orderCode;

    // Thông tin người đặt hàng
    private Long userId;
    private String userEmail;

    // Thông tin người nhận hàng
    private String receiverName;
    private String shippingAddress;

    // Tổng tiền đơn hàng
    private BigDecimal totalAmount;

    // Phương thức thanh toán: COD, VNPAY, BANK_TRANSFER
    private String paymentMethod;

    // Danh sách sản phẩm để Inventory Service biết cần reserve bao nhiêu cho từng sản phẩm
    private List<OrderItemEvent> items;
}
