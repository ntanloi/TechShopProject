package com.techshop.userservice.service;

import com.techshop.userservice.model.OutboxEvent;
import com.techshop.userservice.model.OutboxEvent.OutboxStatus;
import com.techshop.userservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Scheduler đọc các event PENDING trong outbox và publish lên Kafka.
 * Khi Kafka down → event vẫn PENDING → tự retry khi Kafka up lại.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${outbox.publisher.batch-size:50}")
    private int batchSize;

    @Value("${outbox.publisher.max-retries:10}")
    private int maxRetries;

    @Value("${outbox.publisher.kafka-timeout-seconds:5}")
    private int kafkaTimeoutSeconds;

    @Scheduled(fixedDelayString = "${outbox.publisher.poll-interval-ms:5000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository.findByStatusOrderByCreatedAt(
                OutboxStatus.PENDING, PageRequest.of(0, batchSize));

        if (pending.isEmpty()) {
            return;
        }

        log.info("[Outbox Publisher] Tìm thấy {} event PENDING, bắt đầu publish...", pending.size());

        for (OutboxEvent event : pending) {
            publishSingleEvent(event);
        }
    }

    private void publishSingleEvent(OutboxEvent event) {
        event.setLastAttemptAt(LocalDateTime.now());
        try {
            kafkaTemplate.send(event.getTopic(), event.getPartitionKey(), event.getPayload())
                    .get(kafkaTimeoutSeconds, TimeUnit.SECONDS);

            event.setStatus(OutboxStatus.PUBLISHED);
            event.setPublishedAt(LocalDateTime.now());
            event.setLastError(null);
            outboxEventRepository.save(event);

            log.info("[Outbox Publisher] ✅ PUBLISHED event={} id={} aggregateId={} topic={} (sau {} lần thử)",
                    event.getEventType(), event.getId(), event.getAggregateId(),
                    event.getTopic(), event.getRetryCount() + 1);

        } catch (Exception e) {
            int newRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(newRetryCount);
            event.setLastError(truncate(e.getMessage(), 1000));

            if (newRetryCount >= maxRetries) {
                event.setStatus(OutboxStatus.FAILED);
                outboxEventRepository.save(event);

                log.error("[Outbox Publisher] ❌ FAILED vĩnh viễn: event={} id={} aggregateId={}" +
                        " sau {} lần thử. Kafka có thể đang down hoặc lỗi nghiêm trọng." +
                        " Cần kiểm tra thủ công! Lỗi: {}",
                        event.getEventType(), event.getId(), event.getAggregateId(),
                        newRetryCount, e.getMessage());
                log.error("[Outbox Publisher] ❌ Payload bị mất: topic={} key={} payload={}",
                        event.getTopic(), event.getPartitionKey(),
                        truncate(event.getPayload(), 200));
            } else {
                outboxEventRepository.save(event);

                log.warn("[Outbox Publisher] 🔄 Retry {}/{}: event={} id={} aggregateId={}" +
                        " topic={} | Lỗi: {}",
                        newRetryCount, maxRetries,
                        event.getEventType(), event.getId(), event.getAggregateId(),
                        event.getTopic(),
                        truncate(e.getMessage(), 150));
            }
        }
    }

    @Scheduled(fixedDelayString = "${outbox.cleanup.interval-ms:3600000}")
    @Transactional
    public void cleanupPublishedEvents() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        int deleted = outboxEventRepository.deleteByStatusAndPublishedAtBefore(
                OutboxStatus.PUBLISHED, threshold);
        if (deleted > 0) {
            log.info("[Outbox Publisher] Đã dọn dẹp {} event PUBLISHED cũ hơn 7 ngày", deleted);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
