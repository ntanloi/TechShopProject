package com.techshop.userservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event bắn lên Kafka khi user đăng ký thành công.
 *
 * Các service lắng nghe topic 'user-registered-topic':
 * - Notification Service: Gửi email Welcome cho user mới
 *
 * Partition Key = userId để đảm bảo thứ tự xử lý event của cùng một user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {

    // ID user vừa đăng ký
    private Long userId;

    // Email để Notification Service gửi mail Welcome
    private String email;

    // Tên đầy đủ để cá nhân hóa email
    private String fullName;
}
