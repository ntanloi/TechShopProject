package com.techshop.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private String message;
    private String intent;
    private Double confidence;
    private LocalDateTime timestamp;
    private String sessionId;
}
