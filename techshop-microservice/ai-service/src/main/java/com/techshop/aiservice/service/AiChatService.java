package com.techshop.aiservice.service;

import com.techshop.aiservice.client.OrderServiceClient;
import com.techshop.aiservice.client.ProductServiceClient;
import com.techshop.aiservice.dto.ChatRequest;
import com.techshop.aiservice.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI Chatbot Service using Google Gemini API
 * Integrates with order-service and product-service for real data
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiChatService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final OrderServiceClient orderServiceClient;
    private final ProductServiceClient productServiceClient;
    private final RestTemplate restTemplate;

    private final Map<String, List<Map<String, Object>>> conversationHistory = new ConcurrentHashMap<>();

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    private static final String SYSTEM_PROMPT = """
            Bạn là AI Assistant của TechShop - một cửa hàng công nghệ trực tuyến.
            
            Nhiệm vụ:
            - Hỗ trợ khách hàng tìm sản phẩm, tư vấn mua hàng
            - Tra cứu đơn hàng dựa trên dữ liệu thực được cung cấp
            - Giải đáp thắc mắc về thanh toán, giao hàng, đổi trả
            
            Quy tắc:
            - Trả lời bằng tiếng Việt, thân thiện, ngắn gọn
            - Khi có dữ liệu đơn hàng/sản phẩm, hãy trả lời dựa trên dữ liệu thực
            - Nếu không có dữ liệu, hướng dẫn khách thao tác trên website
            - Chính sách đổi trả: 7 ngày
            - Thanh toán: VNPay, COD
            - Giao hàng: 2-5 ngày, nội thành 1-2 ngày
            """;

    public ChatResponse chat(ChatRequest request) {
        log.info("AI Chat - Processing: {}", request.getMessage());
        String sessionId = request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString();

        // Gather context data based on user message and userId
        String contextData = gatherContext(request);

        // Check if API key is configured
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("AI Chat - Gemini API key not configured, using fallback");
            return buildFallbackResponse(request.getMessage(), sessionId, contextData);
        }

        try {
            String aiResponse = callGemini(request.getMessage(), sessionId, contextData);
            return ChatResponse.builder()
                    .message(aiResponse)
                    .intent("ai_response")
                    .confidence(0.95)
                    .timestamp(LocalDateTime.now())
                    .sessionId(sessionId)
                    .build();
        } catch (Exception e) {
            log.error("AI Chat - Gemini error: {}", e.getMessage());
            return buildFallbackResponse(request.getMessage(), sessionId, contextData);
        }
    }

    private String gatherContext(ChatRequest request) {
        StringBuilder context = new StringBuilder();
        String message = request.getMessage().toLowerCase();

        // If user asks about orders and userId is provided
        if ((message.contains("đơn hàng") || message.contains("order") || message.contains("đơn")) 
                && request.getUserId() != null && !request.getUserId().isBlank()) {
            try {
                Long userId = Long.parseLong(request.getUserId());
                List<Map<String, Object>> orders = orderServiceClient.getOrdersByUserId(userId);
                if (orders != null && !orders.isEmpty()) {
                    context.append("\n[DỮ LIỆU ĐƠN HÀNG CỦA KHÁCH]\n");
                    for (Map<String, Object> order : orders) {
                        context.append(String.format("- Mã: %s | Trạng thái: %s | Tổng: %s | Ngày: %s\n",
                                order.getOrDefault("orderCode", "N/A"),
                                order.getOrDefault("status", "N/A"),
                                order.getOrDefault("totalAmount", "N/A"),
                                order.getOrDefault("createdAt", "N/A")));
                    }
                } else {
                    context.append("\n[Khách hàng chưa có đơn hàng nào]\n");
                }
            } catch (Exception e) {
                log.warn("Failed to fetch orders: {}", e.getMessage());
            }
        }

        // If user asks about products
        if (message.contains("sản phẩm") || message.contains("product") || message.contains("laptop")
                || message.contains("điện thoại") || message.contains("tai nghe") || message.contains("tìm")) {
            try {
                // Extract keyword for search
                String keyword = extractProductKeyword(message);
                Map<String, Object> products;
                if (keyword != null) {
                    products = productServiceClient.searchProducts(keyword, 0, 5);
                } else {
                    products = productServiceClient.getProducts(0, 5);
                }
                if (products != null && products.containsKey("content")) {
                    List<Map<String, Object>> productList = (List<Map<String, Object>>) products.get("content");
                    if (productList != null && !productList.isEmpty()) {
                        context.append("\n[SẢN PHẨM TÌM THẤY]\n");
                        for (Map<String, Object> p : productList) {
                            context.append(String.format("- %s | Giá: %s VNĐ | Mô tả: %s\n",
                                    p.getOrDefault("name", ""),
                                    p.getOrDefault("price", ""),
                                    String.valueOf(p.getOrDefault("description", "")).substring(0, 
                                            Math.min(50, String.valueOf(p.getOrDefault("description", "")).length()))));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch products: {}", e.getMessage());
            }
        }

        return context.toString();
    }

    private String extractProductKeyword(String message) {
        String[] keywords = {"laptop", "điện thoại", "phone", "tai nghe", "tablet", "iphone", "samsung", "macbook", "airpod"};
        for (String kw : keywords) {
            if (message.contains(kw)) return kw;
        }
        return null;
    }

    private String callGemini(String userMessage, String sessionId, String contextData) {
        List<Map<String, Object>> contents = new ArrayList<>();

        // Add history
        List<Map<String, Object>> history = conversationHistory.getOrDefault(sessionId, new ArrayList<>());
        contents.addAll(history);

        // Build user message with context
        String enrichedMessage = userMessage;
        if (!contextData.isBlank()) {
            enrichedMessage = userMessage + "\n\n" + contextData;
        }

        Map<String, Object> userContent = Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", enrichedMessage))
        );
        contents.add(userContent);

        // Build request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);
        requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
        ));
        requestBody.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 400
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = GEMINI_URL + "?key=" + geminiApiKey;

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        Map body = response.getBody();
        List<Map> candidates = (List<Map>) body.get("candidates");
        Map content = (Map) candidates.get(0).get("content");
        List<Map> parts = (List<Map>) content.get("parts");
        String text = (String) parts.get(0).get("text");

        // Save to history (save original message, not enriched)
        List<Map<String, Object>> updatedHistory = conversationHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
        updatedHistory.add(Map.of("role", "user", "parts", List.of(Map.of("text", userMessage))));
        updatedHistory.add(Map.of("role", "model", "parts", List.of(Map.of("text", text))));
        if (updatedHistory.size() > 20) {
            updatedHistory.subList(0, updatedHistory.size() - 20).clear();
        }

        return text;
    }

    private ChatResponse buildFallbackResponse(String message, String sessionId, String contextData) {
        String response;
        // If we have real data from services, use it even without Gemini
        if (!contextData.isBlank()) {
            response = "Đây là thông tin tôi tìm được:\n" + contextData + "\nBạn cần hỗ trợ thêm gì không?";
        } else {
            response = getFallbackResponse(message);
        }
        return ChatResponse.builder()
                .message(response)
                .intent("fallback")
                .confidence(0.5)
                .timestamp(LocalDateTime.now())
                .sessionId(sessionId)
                .build();
    }

    private String getFallbackResponse(String message) {
        String lower = message.toLowerCase();
        if (lower.contains("hi") || lower.contains("hello") || lower.contains("chào")) {
            return "Xin chào! Tôi là AI Assistant của TechShop. Tôi có thể giúp gì cho bạn?";
        } else if (lower.contains("sản phẩm") || lower.contains("product")) {
            return "Bạn có thể xem sản phẩm tại trang chủ. Bạn đang tìm loại sản phẩm nào?";
        } else if (lower.contains("đơn hàng") || lower.contains("order")) {
            return "Bạn có thể xem đơn hàng tại mục 'Đơn hàng của tôi' trên menu.";
        } else if (lower.contains("giá") || lower.contains("price")) {
            return "Giá sản phẩm được hiển thị trên trang chi tiết. Bạn muốn tìm sản phẩm nào?";
        } else if (lower.contains("trả hàng") || lower.contains("return") || lower.contains("đổi")) {
            return "TechShop hỗ trợ đổi trả trong 7 ngày. Vui lòng liên hệ hotline 1900-xxxx.";
        } else if (lower.contains("thanh toán") || lower.contains("payment")) {
            return "Chúng tôi hỗ trợ thanh toán qua VNPay và COD.";
        } else if (lower.contains("giao hàng") || lower.contains("ship")) {
            return "Giao hàng từ 2-5 ngày. Nội thành HCM/HN giao trong 1-2 ngày.";
        }
        return "Tôi có thể giúp bạn: tìm sản phẩm, kiểm tra đơn hàng, tư vấn mua hàng. Bạn cần gì?";
    }

    public void clearHistory(String sessionId) {
        conversationHistory.remove(sessionId);
    }
}
