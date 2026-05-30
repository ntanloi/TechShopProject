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

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

    private static final String SYSTEM_PROMPT = """
            Bạn là AI Assistant của TechShop - một cửa hàng công nghệ trực tuyến chuyên cung cấp laptop, điện thoại, tai nghe và các thiết bị công nghệ.
            
            Nhiệm vụ:
            - Hỗ trợ khách hàng tìm sản phẩm, tư vấn mua sắm công nghệ dựa trên thông tin thực tế của cửa hàng.
            - Tra cứu và cung cấp trạng thái đơn hàng dựa trên dữ liệu thực tế được cung cấp.
            - Giải đáp thắc mắc về chính sách thanh toán, giao hàng, đổi trả.
            
            Quy tắc tư vấn sản phẩm:
            1. Khi khách hỏi mua, tìm kiếm hoặc cần tư vấn sản phẩm, hãy LUÔN kiểm tra phần dữ liệu thực tế [SẢN PHẨM TÌM THẤY] được cung cấp trong ngữ cảnh.
            2. Nếu có sản phẩm phù hợp trong danh sách [SẢN PHẨM TÌM THẤY], bạn PHẢI giới thiệu các sản phẩm đó, ghi rõ: Tên sản phẩm, Giá bán (bằng VNĐ) và Mô tả ngắn. Tuyệt đối không tự bịa ra sản phẩm hoặc giá cả không có trong danh sách.
            3. Nếu không có dữ liệu [SẢN PHẨM TÌM THẤY] hoặc danh sách trống hoặc không tìm thấy sản phẩm nào khớp với yêu cầu của khách, hãy lịch sự phản hồi: "Dạ hiện tại TechShop chưa có sẵn sản phẩm này hoặc sản phẩm đang tạm hết hàng ạ." Sau đó gợi ý khách hàng tham khảo các danh mục sản phẩm khác trên website hoặc tìm kiếm từ khóa khác.
            
            Quy tắc chung:
            - Trả lời bằng tiếng Việt lịch sự, thân thiện, ngắn gọn và tập trung vào nhu cầu của khách hàng.
            - Chính sách đổi trả: 7 ngày.
            - Thanh toán: hỗ trợ qua cổng VNPay và thanh toán khi nhận hàng (COD).
            - Giao hàng: Giao hàng toàn quốc từ 2-5 ngày, nội thành Hà Nội/TP.HCM giao nhanh trong 1-2 ngày.
            """;

    public ChatResponse chat(ChatRequest request) {
        log.info("AI Chat - Processing: '{}' | API key present: {}", request.getMessage(), !geminiApiKey.isBlank());

        String sessionId = request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString();

        // Gather context data based on user message and userId
        String contextData = gatherContext(request);

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
            log.error("AI Chat - Gemini call failed: {}", e.getMessage(), e);
            // Return a simple error message instead of hardcoded if-else fallback
            String errorMsg = "Xin lỗi, hiện tại tôi đang gặp sự cố kỹ thuật. " +
                    "Vui lòng thử lại sau hoặc liên hệ TechShop qua email/hotline để được hỗ trợ.";
            return ChatResponse.builder()
                    .message(errorMsg)
                    .intent("error")
                    .confidence(0.0)
                    .timestamp(LocalDateTime.now())
                    .sessionId(sessionId)
                    .build();
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
        String keyword = extractProductKeyword(message);
        if (keyword != null
                || message.contains("sản phẩm") || message.contains("product") || message.contains("laptop")
                || message.contains("điện thoại") || message.contains("tai nghe") || message.contains("tìm")
                || message.contains("mua") || message.contains("cần") || message.contains("giá") || message.contains("bán")) {
            try {
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
        String[] keywords = {
            "laptop", "điện thoại", "phone", "tai nghe", "tablet", "máy tính",
            "iphone", "samsung", "macbook", "airpod", "ipad", "xiaomi", "oppo",
            "dell", "hp", "asus", "lenovo", "acer", "sony", "logitech",
            "bàn phím", "chuột", "sạc", "tai nghe"
        };
        for (String kw : keywords) {
            if (message.contains(kw)) return kw;
        }
        return null;
    }

    private String callGemini(String userMessage, String sessionId, String contextData) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured in environment variables");
        }

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
        String url = GEMINI_URL + "?key=" + geminiApiKey.trim();

        log.info("Calling Gemini API, key length={}", geminiApiKey.trim().length());
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

    public void clearHistory(String sessionId) {
        conversationHistory.remove(sessionId);
    }
}
