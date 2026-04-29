package com.techshop.notificationservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String type;
    private boolean success;
    private String errorMessage;

    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();
}
