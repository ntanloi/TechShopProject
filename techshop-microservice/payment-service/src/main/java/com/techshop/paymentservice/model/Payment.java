package com.techshop.paymentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long userId;

    // Mã đơn hàng (lưu snapshot để event có đủ thông tin khi bắn Kafka)
    private String orderCode;

    // Email người dùng (để Notification Service gửi mail)
    private String userEmail;

    // Tên người nhận hàng (để email cá nhân hóa)
    private String receiverName;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    private String transactionId;  // VNPay transaction ID
    
    @Column(length = 1000)  // Tăng kích thước để chứa URL VNPay dài
    private String paymentUrl;     // VNPay redirect URL

    // Lưu snapshot danh sách sản phẩm dưới dạng JSON
    // Dùng khi bắn PaymentFailedEvent để Inventory Service tự release stock
    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum PaymentMethod {
        COD, VNPAY, BANK_TRANSFER
    }

    public enum PaymentStatus {
        PENDING, PAID, FAILED, REFUNDED
    }
}
