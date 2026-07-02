package com.techshop.orderservice.constant;

/**
 * Hằng số tên các Kafka Topic sử dụng trong Order Service.
 * Bao gồm cả topic bắn ra (Producer) và topic lắng nghe (Consumer).
 */
public class KafkaTopicConstants {

    // ── PRODUCER TOPICS ──────────────────────────────────────────
    // Topic bắn ra khi tạo đơn hàng mới
    // Inventory Service lắng nghe để reserve stock
    // Notification Service lắng nghe để gửi email xác nhận
    public static final String ORDER_PLACED_TOPIC = "order-placed-topic";

    // ── CONSUMER TOPICS ──────────────────────────────────────────
    // Topic lắng nghe khi thanh toán thành công (từ Payment Service)
    // Order Service sẽ update trạng thái đơn hàng thành PAID/CONFIRMED
    public static final String PAYMENT_COMPLETED_TOPIC = "payment-completed-topic";

    // Topic lắng nghe khi thanh toán thất bại (từ Payment Service)
    // Order Service sẽ update trạng thái đơn hàng thành CANCELLED
    public static final String PAYMENT_FAILED_TOPIC = "payment-failed-topic";

    // Ngăn khởi tạo class tiện ích
    private KafkaTopicConstants() {}
}
