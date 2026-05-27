package com.techshop.aiservice.service;

import com.techshop.aiservice.dto.ChatRequest;
import com.techshop.aiservice.dto.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * AI Chatbot Service (Agent)
 * Implements AI requirement: Agent - Intelligent customer support assistant
 */
@Service
@Slf4j
public class AiChatService {

    public ChatResponse chat(ChatRequest request) {
        log.info("AI Chat - Processing: {}", request.getMessage());
        
        String message = request.getMessage().toLowerCase();
        String intent = detectIntent(message);
        String response = generateResponse(intent, message);
        double confidence = calculateConfidence(message, intent);
        
        log.info("AI Chat - Intent: {}, Confidence: {}", intent, confidence);
        
        return ChatResponse.builder()
                .message(response)
                .intent(intent)
                .confidence(confidence)
                .timestamp(LocalDateTime.now())
                .sessionId(request.getSessionId())
                .build();
    }

    private String detectIntent(String message) {
        if (message.contains("hi") || message.contains("hello") || message.contains("chào")) {
            return "greeting";
        } else if (message.contains("product") || message.contains("sản phẩm") || message.contains("laptop")) {
            return "product_inquiry";
        } else if (message.contains("order") || message.contains("đơn hàng")) {
            return "order_status";
        } else if (message.contains("price") || message.contains("giá")) {
            return "price_inquiry";
        } else if (message.contains("return") || message.contains("trả hàng")) {
            return "return_refund";
        } else if (message.contains("help") || message.contains("giúp")) {
            return "help";
        }
        return "unknown";
    }

    private String generateResponse(String intent, String message) {
        return switch (intent) {
            case "greeting" -> "Xin chào! Tôi là AI Assistant của TechShop. Tôi có thể giúp gì cho bạn?";
            case "product_inquiry" -> "Tôi có thể giúp bạn tìm sản phẩm! Bạn đang tìm loại sản phẩm nào? (Laptop, điện thoại, tai nghe...)";
            case "order_status" -> "Để kiểm tra đơn hàng, vui lòng cung cấp mã đơn hàng hoặc đăng nhập vào tài khoản.";
            case "price_inquiry" -> "Giá sản phẩm rất cạnh tranh! Bạn có thể xem giá chi tiết trên trang sản phẩm.";
            case "return_refund" -> "TechShop hỗ trợ đổi trả trong 7 ngày. Vui lòng liên hệ CSKH để được hỗ trợ.";
            case "help" -> "Tôi có thể giúp: 1) Tìm sản phẩm, 2) Kiểm tra đơn hàng, 3) Tư vấn giá. Bạn cần gì?";
            default -> "Xin lỗi, tôi chưa hiểu. Bạn có thể hỏi về sản phẩm, đơn hàng, hoặc giá cả không?";
        };
    }

    private double calculateConfidence(String message, String intent) {
        return "unknown".equals(intent) ? 0.3 : 0.85;
    }
}
