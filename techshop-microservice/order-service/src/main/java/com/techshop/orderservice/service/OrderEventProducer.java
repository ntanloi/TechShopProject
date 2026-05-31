package com.techshop.orderservice.service;

import com.techshop.orderservice.config.KafkaTopicConstants;
import com.techshop.orderservice.event.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Producer Kafka cho Order Service.
 * Chịu trách nhiệm bắn event OrderPlacedEvent lên Kafka
 * sau khi đơn hàng được tạo và lưu vào DB thành công.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventProducer {

    // KafkaTemplate với key=String (orderCode), value=Object (serialize thành JSON)
    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Bắn event khi đơn hàng mới được tạo.
     *
     * Partition Key = orderCode. Lý do:
     * - Các event liên quan đến cùng một đơn (OrderPlaced, PaymentCompleted, ...)
     *   sẽ vào cùng partition
     * - Kafka đảm bảo thứ tự xử lý trong cùng một partition
     *
     * @param event DTO chứa đầy đủ thông tin đơn hàng vừa tạo
     */
    public void publishOrderPlaced(OrderPlacedEvent event) {
        try {
            log.info("[Kafka Producer] Bắn event OrderPlaced: orderId={}, orderCode={}",
                    event.getOrderId(), event.getOrderCode());

            kafkaTemplate.send(
                    KafkaTopicConstants.ORDER_PLACED_TOPIC,
                    event.getOrderCode(), // partition key = orderCode
                    event                 // payload
            );

            log.info("[Kafka Producer] Đã bắn event OrderPlaced thành công: orderCode={}", event.getOrderCode());
        } catch (Exception e) {
            // Log lỗi nhưng không throw để không ảnh hưởng đến luồng tạo đơn hàng
            // Trong production: nên dùng Outbox Pattern hoặc retry với backoff
            log.error("[Kafka Producer] Lỗi bắn event OrderPlaced cho orderCode={}: {}",
                    event.getOrderCode(), e.getMessage());
        }
    }
}
