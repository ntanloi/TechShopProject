package com.techshop.paymentservice.service;

import com.techshop.paymentservice.config.KafkaTopicConstants;
import com.techshop.paymentservice.event.PaymentCompletedEvent;
import com.techshop.paymentservice.event.PaymentFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Producer Kafka cho Payment Service.
 * Bắn event khi thanh toán hoàn thành hoặc thất bại.
 *
 * Đây là trung tâm của Saga Pattern:
 * - PaymentCompletedEvent → Trigger cập nhật Order, commit Inventory, gửi email
 * - PaymentFailedEvent    → Trigger hủy Order, release Inventory
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Bắn event khi thanh toán thành công.
     * Partition Key = orderCode để đảm bảo thứ tự xử lý event của cùng một đơn hàng.
     *
     * @param event chứa đầy đủ thông tin payment và order
     */
    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        try {
            log.info("[Kafka Producer] Bắn event PaymentCompleted: orderId={}, orderCode={}, amount={}",
                    event.getOrderId(), event.getOrderCode(), event.getAmount());

            kafkaTemplate.send(
                    KafkaTopicConstants.PAYMENT_COMPLETED_TOPIC,
                    event.getOrderCode(), // partition key
                    event
            );

            log.info("[Kafka Producer] Đã bắn event PaymentCompleted thành công cho orderCode={}", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Producer] LỖI NGHIÊM TRỌNG: Không thể bắn event PaymentCompleted cho orderId={}: {}",
                    event.getOrderId(), e.getMessage());
            // QUAN TRỌNG: Lỗi này cần được alert ngay lập tức
            // Vì nếu payment đã lưu PAID nhưng event không đến được,
            // Order sẽ không được cập nhật (trạng thái không nhất quán)
            // Trong production: nên implement Outbox Pattern hoặc Dead Letter Queue
        }
    }

    /**
     * Bắn event khi thanh toán thất bại.
     * Trigger Saga rollback: Order bị hủy, Inventory được release.
     *
     * @param event chứa thông tin payment thất bại và lý do
     */
    public void publishPaymentFailed(PaymentFailedEvent event) {
        try {
            log.info("[Kafka Producer] Bắn event PaymentFailed: orderId={}, reason={}",
                    event.getOrderId(), event.getReason());

            kafkaTemplate.send(
                    KafkaTopicConstants.PAYMENT_FAILED_TOPIC,
                    event.getOrderCode(), // partition key
                    event
            );

            log.info("[Kafka Producer] Đã bắn event PaymentFailed thành công cho orderCode={}", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Producer] LỖI NGHIÊM TRỌNG: Không thể bắn event PaymentFailed cho orderId={}: {}",
                    event.getOrderId(), e.getMessage());
        }
    }
}
