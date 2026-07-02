package com.techshop.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event nhận từ Kafka khi user-service tạo OTP xác thực.
 * Mirror class của OtpRequestedEvent bên User Service.
 *
 * Topic: otp-requested-topic
 * Producer: user-service (qua Outbox Pattern)
 * Consumer: notification-service → sendOtpEmail()
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpRequestedEvent {

    /** Email nhận OTP */
    private String email;

    /** Mã OTP 6 số plain-text */
    private String otpCode;

    /** Số phút hiệu lực */
    private int expiresInMinutes;
}
