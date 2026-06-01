package com.techshop.paymentservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Outbox Event entity — trái tim của Transactional Outbox Pattern.
 *
 * Thay vì bắn event thẳng lên Kafka (có thể mất nếu Kafka down),
 * ta lưu event vào bảng này TRONG CÙNG transaction với business data (Payment).
 *
 * Đảm bảo tính nguyên tử (atomicity):
 * - Hoặc cả Payment + OutboxEvent đều được lưu
 * - Hoặc cả hai đều rollback
 * → Không bao giờ có chuyện "payment PAID nhưng event bị mất"
 *
 * Một scheduler (OutboxPublisher) sẽ định kỳ đọc các record PENDING
 * và publish lên Kafka. Nếu Kafka down, record vẫn còn → retry sau.
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

    // Loại aggregate gốc sinh ra event, ví dụ: "Payment"
    @Column(nullable = false)
    private String aggregateType;

    // ID của aggregate, ví dụ: orderCode hoặc paymentId (dùng để trace)
    @Column(nullable = false)
    private String aggregateId;

    // Loại event: "PaymentCompleted" hoặc "PaymentFailed"
    @Column(nullable = false)
    private String eventType;

    // Tên Kafka topic sẽ publish tới
    @Column(nullable = false)
    private String topic;

    // Partition key khi publish (để giữ thứ tự event của cùng đơn hàng)
    private String partitionKey;

    // Payload JSON của event (đã serialize)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    // Trạng thái xử lý
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OutboxStatus status = OutboxStatus.PENDING;

    // Số lần đã thử publish (để giới hạn retry)
    @Builder.Default
    @Column(nullable = false)
    private Integer retryCount = 0;

    // Lỗi gần nhất (nếu publish thất bại)
    @Column(length = 1000)
    private String lastError;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm publish thành công
    private LocalDateTime publishedAt;

    // Thời điểm thử publish gần nhất
    private LocalDateTime lastAttemptAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Trạng thái của outbox event.
     */
    public enum OutboxStatus {
        // Chờ publish (mới tạo hoặc đang retry)
        PENDING,
        // Đã publish thành công lên Kafka
        PUBLISHED,
        // Thất bại vĩnh viễn sau khi vượt số lần retry tối đa (cần can thiệp thủ công)
        FAILED
    }
}
