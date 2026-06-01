package com.techshop.orderservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Outbox Event entity — Transactional Outbox Pattern cho Order Service.
 *
 * Thay vì bắn OrderPlacedEvent thẳng lên Kafka (có thể mất nếu Kafka down),
 * ta lưu event vào bảng này TRONG CÙNG transaction với việc tạo Order.
 *
 * Đảm bảo atomicity: hoặc cả Order + OutboxEvent đều lưu, hoặc cả hai rollback.
 * → Không bao giờ có chuyện "đơn hàng đã tạo nhưng event bị mất".
 *
 * OutboxPublisher (scheduler) sẽ publish các record PENDING lên Kafka,
 * retry nếu Kafka tạm thời down.
 */
@Entity
@Table(name = "outbox_events", indexes = {
        @Index(name = "idx_outbox_status", columnList = "status"),
        @Index(name = "idx_outbox_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Loại aggregate gốc sinh ra event, ví dụ: "Order"
    @Column(nullable = false)
    private String aggregateType;

    // ID của aggregate để trace, ví dụ: orderCode
    @Column(nullable = false)
    private String aggregateId;

    // Loại event: "OrderPlaced"
    @Column(nullable = false)
    private String eventType;

    // Tên Kafka topic sẽ publish tới
    @Column(nullable = false)
    private String topic;

    // Partition key khi publish (giữ thứ tự event của cùng đơn hàng)
    private String partitionKey;

    // Payload JSON của event (đã serialize)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OutboxStatus status = OutboxStatus.PENDING;

    @Builder.Default
    @Column(nullable = false)
    private Integer retryCount = 0;

    @Column(length = 1000)
    private String lastError;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime publishedAt;

    private LocalDateTime lastAttemptAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum OutboxStatus {
        PENDING,    // Chờ publish
        PUBLISHED,  // Đã publish thành công
        FAILED      // Thất bại vĩnh viễn sau khi vượt retry tối đa
    }
}
