package com.techshop.paymentservice.service;

import com.techshop.paymentservice.model.OutboxEvent;
import com.techshop.paymentservice.model.OutboxEvent.OutboxStatus;
import com.techshop.paymentservice.repository.OutboxEventRepository;
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
 *
 * Đây là "relay" của Transactional Outbox Pattern (kiểu Polling Publisher):
 * - Chạy định kỳ (mặc định mỗi 5s)
 * - Lấy batch event PENDING theo thứ tự FIFO
 * - Publish từng event lên Kafka (đồng bộ, chờ ack)
 * - Thành công → đánh dấu PUBLISHED
 * - Thất bại → tăng retryCount, giữ PENDING để thử lại lần sau
 * - Vượt số lần retry tối đa → đánh dấu FAILED (cần can thiệp thủ công)
 *
 * Khi Kafka down: publish thất bại → event vẫn PENDING → tự retry khi Kafka up lại.
 * → KHÔNG BAO GIỜ MẤT EVENT.
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

    /**
     * Quét outbox và publish các event PENDING.
     * fixedDelay = 5000: chạy lại sau 5s kể từ khi lần trước hoàn thành.
     */
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

    /**
     * Publish một event lên Kafka.
     * Dùng .get() với timeout để biết chắc chắn Kafka đã nhận (acks) hay chưa.
     */
    private void publishSingleEvent(OutboxEvent event) {
        event.setLastAttemptAt(LocalDateTime.now());
        try {
            kafkaTemplate.send(event.getTopic(), event.getPartitionKey(), event.getPayload())
                    .get(kafkaTimeoutSeconds, TimeUnit.SECONDS);

            event.setStatus(OutboxEvent.OutboxStatus.PUBLISHED);
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
                event.setStatus(OutboxEvent.OutboxStatus.FAILED);
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

    /**
     * Dọn dẹp các event PUBLISHED cũ hơn 7 ngày để tránh bảng outbox phình to.
     * Chạy mỗi giờ.
     */
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
