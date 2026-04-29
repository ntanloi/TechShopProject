package com.techshop.notificationservice.controller;

import com.techshop.notificationservice.dto.OrderConfirmEmailRequest;
import com.techshop.notificationservice.model.Notification;
import com.techshop.notificationservice.model.NotificationType;
import com.techshop.notificationservice.service.EmailService;
import com.techshop.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final EmailService emailService;

    // =================== IN-APP ===================

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getByUserId(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> countUnread(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.create(notification));
    }

    @PostMapping("/send")
    public ResponseEntity<Notification> send(@RequestParam Long userId,
                                              @RequestParam String title,
                                              @RequestParam String message,
                                              @RequestParam NotificationType type) {
        return ResponseEntity.ok(notificationService.send(userId, title, message, type));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<String> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok("Đã đánh dấu tất cả là đã đọc");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.ok("Đã xóa thông báo id=" + id);
    }

    // =================== EMAIL ===================

    @PostMapping("/email/order-confirm")
    public ResponseEntity<String> sendOrderConfirmEmail(@RequestBody OrderConfirmEmailRequest request) {
        try {
            emailService.sendOrderConfirmEmail(request);
            return ResponseEntity.ok("Email xác nhận đơn hàng đã được gửi");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi gửi email: " + e.getMessage());
        }
    }

    @PostMapping("/email/welcome")
    public ResponseEntity<String> sendWelcomeEmail(@RequestParam String email,
                                                    @RequestParam String fullName) {
        try {
            emailService.sendWelcomeEmail(email, fullName);
            return ResponseEntity.ok("Email chào mừng đã được gửi");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi gửi email: " + e.getMessage());
        }
    }

    // =================== ADMIN ===================

    @GetMapping
    public ResponseEntity<List<Notification>> getAll() {
        return ResponseEntity.ok(notificationService.getAll());
    }
}
