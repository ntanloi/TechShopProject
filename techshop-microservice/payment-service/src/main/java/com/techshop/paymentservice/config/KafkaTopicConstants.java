package com.techshop.paymentservice.config;

/**
 * Hằng số tên các Kafka Topic sử dụng trong Payment Service.
 * Payment Service chỉ là Producer (bắn event), không phải Consumer.
 */
public class KafkaTopicConstants {

    // Topic bắn ra khi thanh toán hoàn thành thành công
    // Order Service và Inventory Service lắng nghe để cập nhật
    public static final String PAYMENT_COMPLETED_TOPIC = "payment-completed-topic";

    // Topic bắn ra khi thanh toán thất bại
    // Order Service lắng nghe để hủy đơn (Saga rollback)
    // Inventory Service lắng nghe để release stock
    public static final String PAYMENT_FAILED_TOPIC = "payment-failed-topic";

    // Ngăn khởi tạo class tiện ích
    private KafkaTopicConstants() {}
}
