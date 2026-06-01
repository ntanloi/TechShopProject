package com.techshop.userservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Outbox Event entity — Transactional Outbox Pattern cho User Service.
 *
 * Lưu event UserRegistered (và các event khác sau này) vào DB cùng transaction
 * với việc tạo User. OutboxPublisher (scheduler) sẽ publish lên Kafka sau.
 * Đảm bảo không mất event nếu Kafka down ngay lúc đăng ký.
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

    @Column(nullable = false)
    private String aggregateType;       // "User"

    @Column(nullable = false)
    private String aggregateId;         // userId

    @Column(nullable = false)
    private String eventType;           // "UserRegistered"

    @Column(nullable = false)
    private String topic;

    private String partitionKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;             // JSON đã serialize

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
        PENDING, PUBLISHED, FAILED
    }
}
