package com.techshop.notificationservice.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Cấu hình Kafka Consumer cho Notification Service.
 *
 * Vấn đề gốc: JsonDeserializer<>(Object.class) trả về LinkedHashMap,
 * Spring không tự convert được sang PaymentCompletedEvent, OrderPlacedEvent...
 *
 * Fix: Dùng StringDeserializer cho value (nhận raw JSON string),
 * sau đó dùng StringJsonMessageConverter để Spring tự map JSON
 * vào đúng type của @KafkaListener method parameter.
 */
@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    /**
     * ConsumerFactory nhận value là String (raw JSON).
     * Việc convert sang đúng event class sẽ do StringJsonMessageConverter đảm nhiệm.
     */
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * ContainerFactory với StringJsonMessageConverter:
     * Nhận raw JSON string → tự động convert sang đúng type
     * của parameter trong @KafkaListener method.
     *
     * Ví dụ: handlePaymentCompleted(PaymentCompletedEvent event)
     * → converter đọc JSON string → deserialize thành PaymentCompletedEvent
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        // Key fix: dùng StringJsonMessageConverter thay vì mặc định
        // Nó sẽ dùng Jackson để map JSON → đúng class của method parameter
        factory.setRecordMessageConverter(new StringJsonMessageConverter());
        return factory;
    }
}
