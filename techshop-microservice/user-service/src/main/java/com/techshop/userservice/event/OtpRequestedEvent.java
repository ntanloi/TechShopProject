package com.techshop.userservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event bắn lên Kafka khi user yêu cầu gửi mã OTP.
 *
 * Topic: otp-requested-topic
 * Consumer: notification-service → sendOtpEmail()
 *
 * Partition key = email để đảm bảo thứ tự event của cùng một email.
 *
 * QUAN TRỌNG: otpCode là mã OTP plain-text.
 * Chỉ truyền qua Kafka nội bộ (không expose ra ngoài).
 * Trong DB user-service chỉ lưu hash (BCrypt).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpRequestedEvent {

    /** Email nhận OTP */
    private String email;

    /** Mã OTP 6 số plain-text — chỉ dùng để gửi email, không lưu DB dạng plain */
    private String otpCode;

    /** Số phút hiệu lực (thường = 5) */
    private int expiresInMinutes;
}
