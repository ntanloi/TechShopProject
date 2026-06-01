package com.techshop.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event nhận từ Kafka khi có người dùng đăng ký thành công.
 * Mirror class của UserRegisteredEvent bên User Service.
 *
 * QUAN TRỌNG: Các field phải khớp với class bên User Service.
 * Không import trực tiếp từ User Service để tránh tight coupling giữa các service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {
    private Long userId;
    private String email;
    private String fullName;
}
