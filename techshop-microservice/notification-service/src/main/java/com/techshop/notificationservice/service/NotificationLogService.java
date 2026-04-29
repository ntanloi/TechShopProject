package com.techshop.notificationservice.service;

import com.techshop.notificationservice.model.NotificationLog;
import com.techshop.notificationservice.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationLogService {

    private final NotificationLogRepository logRepository;

    public void saveSendLog(Long userId, String type, boolean success, String errorMessage) {
        NotificationLog log = NotificationLog.builder()
                .userId(userId)
                .type(type)
                .success(success)
                .errorMessage(errorMessage)
                .build();
        logRepository.save(log);
    }

    public List<NotificationLog> getByUserId(Long userId) {
        return logRepository.findByUserId(userId);
    }
}
