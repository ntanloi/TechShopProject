package com.techshop.userservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lưu OTP tạm thời cho luồng đăng ký / đăng nhập.
 * Một bản ghi = một OTP request (email + otpCode + type + hết hạn).
 * Sau khi verify thành công hoặc hết hạn sẽ bị đánh dấu used / xóa bởi scheduled cleanup.
 */
@Entity
@Table(name = "otp_tokens", indexes = {
        @Index(name = "idx_otp_temp_token", columnList = "tempToken"),
        @Index(name = "idx_otp_email",      columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Email nhận OTP */
    @Column(nullable = false, length = 255)
    private String email;

    /** Mã OTP 6 chữ số (đã hash bcrypt) */
    @Column(nullable = false, length = 100)
    private String otpHash;

    /**
     * Token tạm thời (UUID) trả về cho frontend để map request.
     * Frontend giữ cái này, gửi lại cùng OTP khi verify.
     */
    @Column(nullable = false, unique = true, length = 64)
    private String tempToken;

    /** REGISTER hoặc LOGIN */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpType type;

    /**
     * Payload JSON chứa dữ liệu chờ xác thực.
     * - REGISTER: { fullName, email, password (hashed), phone, address }
     * - LOGIN:    { email }
     */
    @Column(columnDefinition = "TEXT")
    private String payload;

    /** Thời điểm hết hạn (5 phút sau khi tạo) */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Đã dùng rồi (verify thành công) */
    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    /** Số lần nhập sai */
    @Column(nullable = false)
    @Builder.Default
    private int failCount = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
