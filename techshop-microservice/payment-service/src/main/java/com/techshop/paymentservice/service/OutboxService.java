package com.techshop.paymentservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techshop.paymentservice.model.OutboxEvent;
import com.techshop.paymentservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service ghi event vào bảng outbox.
 *
 * QUAN TRỌNG: Các phương thức ở đây KHÔNG tự mở transaction riêng.
 * Chúng phải được gọi BÊN TRONG transaction của business logic (PaymentService),
 * để việc lưu Payment và lưu OutboxEvent diễn ra atomic (cùng commit/rollback).
 *
 * Đây chính là điểm mấu chốt của Transactional Outbox Pattern:
 * không bao giờ có chuyện business data đã lưu nhưng event bị mất.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Lưu một event vào outbox. Phải gọi trong transaction của caller.
     *
     * @param aggregateType loại aggregate, ví dụ "Payment"
     * @param aggregateId   id để trace, ví dụ orderCode
     * @param eventType     loại event: "PaymentCompleted" / "PaymentFailed"
     * @param topic         Kafka topic đích
     * @param partitionKey  key để giữ thứ tự (thường là orderCode)
     * @param payload       object event sẽ được serialize thành JSON
     */
    public void saveEvent(String aggregateType,
                          String aggregateId,
                          String eventType,
                          String topic,
                          String partitionKey,
                          Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);

            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .topic(topic)
                    .partitionKey(partitionKey)
                    .payload(json)
                    .status(OutboxEvent.OutboxStatus.PENDING)
                    .retryCount(0)
                    .build();

            outboxEventRepository.save(outboxEvent);

            log.info("[Outbox] Đã lưu event {} cho {}={} vào outbox (topic={})",
                    eventType, aggregateType, aggregateId, topic);
        } catch (Exception e) {
            // Nếu serialize lỗi, throw để rollback cả transaction business
            // Vì không lưu được event = vi phạm tính toàn vẹn
            log.error("[Outbox] Lỗi serialize event {} cho {}={}: {}",
                    eventType, aggregateType, aggregateId, e.getMessage());
            throw new RuntimeException("Không thể serialize outbox event", e);
        }
    }
}
