package com.techshop.userservice.service;

import com.techshop.userservice.config.KafkaTopicConstants;
import com.techshop.userservice.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Producer Kafka cho User Service.
 * Chịu trách nhiệm bắn các event liên quan đến người dùng lên Kafka.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventProducer {

    // KafkaTemplate dùng để gửi message lên Kafka broker
    // Spring Boot tự động cấu hình bean này dựa vào application.yml
    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Bắn event UserRegisteredEvent lên Kafka sau khi user đăng ký thành công.
     *
     * Partition Key = userId (dạng String).
     * Kafka đảm bảo các message cùng key sẽ vào cùng partition,
     * đảm bảo thứ tự xử lý cho từng user.
     *
     * @param event DTO chứa thông tin user vừa đăng ký
     */
    public void publishUserRegistered(UserRegisteredEvent event) {
        try {
            log.info("[Kafka Producer] Bắn event UserRegistered cho userId={}, email={}",
                    event.getUserId(), event.getEmail());

            // Gửi message lên topic, dùng userId làm key để đảm bảo thứ tự
            kafkaTemplate.send(
                    KafkaTopicConstants.USER_REGISTERED_TOPIC,
                    String.valueOf(event.getUserId()), // partition key
                    event                               // payload (sẽ serialize thành JSON)
            );

            log.info("[Kafka Producer] Đã bắn event UserRegistered thành công cho userId={}", event.getUserId());
        } catch (Exception e) {
            // Log lỗi nhưng KHÔNG throw exception để không rollback transaction lưu user
            // Trong production nên implement Outbox Pattern hoặc retry mechanism
            log.error("[Kafka Producer] Lỗi khi bắn event UserRegistered cho userId={}: {}",
                    event.getUserId(), e.getMessage());
        }
    }
}
