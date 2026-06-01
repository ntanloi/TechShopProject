package com.techshop.paymentservice.config;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Cấu hình Kafka Producer cho Payment Service.
 *
 * Payment Service dùng Transactional Outbox Pattern:
 * - PaymentService lưu event (dạng JSON string) vào bảng outbox
 * - OutboxPublisher đọc và publish JSON string đó lên Kafka
 *
 * Vì payload trong outbox ĐÃ là JSON string serialize sẵn,
 * producer dùng StringSerializer (KHÔNG dùng JsonSerializer để tránh
 * bọc 2 lớp JSON → consumer dùng StringJsonMessageConverter sẽ parse được).
 *
 * Cấu hình độ tin cậy cao:
 * - acks=all: chờ tất cả replica xác nhận (an toàn nhất)
 * - retries: tự retry khi gặp lỗi tạm thời
 * - enable.idempotence=true: tránh ghi trùng message khi producer retry
 */
@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        // Độ tin cậy: chờ mọi replica ack
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        // Idempotent producer: không tạo bản ghi trùng khi retry
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        // Không block quá lâu khi Kafka down (OutboxPublisher sẽ retry sau)
        props.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 5000);
        props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 10000);
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 5000);

        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
