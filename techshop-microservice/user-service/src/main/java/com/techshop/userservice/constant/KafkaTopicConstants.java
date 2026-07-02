package com.techshop.userservice.constant;

/**
 * Hằng số tên các Kafka Topic sử dụng trong User Service.
 * Đặt tập trung ở đây để dễ quản lý, tránh magic string rải rác trong code.
 */
public class KafkaTopicConstants {

    // Topic nhận sự kiện người dùng đăng ký mới
    // Notification Service sẽ lắng nghe topic này để gửi email Welcome
    public static final String USER_REGISTERED_TOPIC = "user-registered-topic";

    // Topic nhận sự kiện yêu cầu gửi OTP
    // Notification Service lắng nghe → gửi email OTP xác thực
    public static final String OTP_REQUESTED_TOPIC = "otp-requested-topic";

    // Ngăn khởi tạo class tiện ích này (utility class pattern)
    private KafkaTopicConstants() {}
}
