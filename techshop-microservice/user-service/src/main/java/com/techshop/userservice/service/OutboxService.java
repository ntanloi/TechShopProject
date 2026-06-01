package com.techshop.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techshop.userservice.model.OutboxEvent;
import com.techshop.userservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service ghi event vào bảng outbox.
 * Phải gọi trong transaction của caller (AuthService.register)
 * để đảm bảo atomic với việc lưu User.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

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
            log.error("[Outbox] Lỗi serialize event {} cho {}={}: {}",
                    eventType, aggregateType, aggregateId, e.getMessage());
            throw new RuntimeException("Không thể serialize outbox event", e);
        }
    }
}
