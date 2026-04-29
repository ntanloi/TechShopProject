package com.techshop.notificationservice.service;

import com.techshop.notificationservice.model.Notification;
import com.techshop.notificationservice.model.NotificationType;
import com.techshop.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationLogService logService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Notification> getAll() {
        return repository.findAll();
    }

    public List<Notification> getByUserId(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    public Notification create(Notification notification) {
        if (notification.getCreatedAt() == null) notification.setCreatedAt(LocalDateTime.now());
        if (notification.getType() == null) notification.setType(NotificationType.SYSTEM);
        Notification saved = repository.save(notification);
        pushRealtime(saved);
        logService.saveSendLog(notification.getUserId(), notification.getType().name(), true, null);
        return saved;
    }

    public Notification send(Long userId, String title, String message, NotificationType type) {
        try {
            Notification notif = Notification.builder()
                    .userId(userId)
                    .title(title)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            Notification saved = repository.save(notif);
            pushRealtime(saved);
            logService.saveSendLog(userId, type.name(), true, null);
            return saved;
        } catch (Exception e) {
            logService.saveSendLog(userId, type.name(), false, e.getMessage());
            throw e;
        }
    }

    public Notification markAsRead(Long id) {
        Notification notif = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        notif.setIsRead(true);
        return repository.save(notif);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.getIsRead()).toList();
        unread.forEach(n -> n.setIsRead(true));
        repository.saveAll(unread);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) throw new RuntimeException("Notification not found: " + id);
        repository.deleteById(id);
    }

    private void pushRealtime(Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(notification.getUserId()),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            log.warn("WebSocket push failed: {}", e.getMessage());
        }
    }
}
