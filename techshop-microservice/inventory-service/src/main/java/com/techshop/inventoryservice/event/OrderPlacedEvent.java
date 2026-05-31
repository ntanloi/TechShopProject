package com.techshop.inventoryservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

// /**
//  * Event nhận từ Kafka khi có đơn hàng mới được tạo.
//  * Mirror class của OrderPlacedEvent bên Order Service.
//  *
//  * Inventory Service lắng nghe event này để:
//  * - Thực hiện reserve stock cho từng sản phẩm trong đơn
//  * - Nếu hàng không đủ → bắn InventoryFailedEvent (Saga rollback - tùy chọn)
//  *
//  * LƯU Ý THIẾT KẾ:
//  * Hiện tại, Order Service vẫn gọi Inventory Service trực tiếp (Feign) để reserve.
//  * Listener này là bước bổ sung trong tương lai nếu muốn fully async.
//  * Hiện tại chỉ dùng để log và theo dõi.
//  */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderPlacedEvent {
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private String receiverName;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private String paymentMethod;
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
