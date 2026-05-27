package com.techshop.aiservice.controller;

import com.techshop.aiservice.dto.ChatRequest;
import com.techshop.aiservice.dto.ChatResponse;
import com.techshop.aiservice.dto.RecommendationRequest;
import com.techshop.aiservice.dto.RecommendationResponse;
import com.techshop.aiservice.service.AiChatService;
import com.techshop.aiservice.service.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI Controller
 * Implements AI requirement: Apply + Agent
 * 
 * Features:
 * 1. AI Chatbot (Agent) - Customer support assistant
 * 2. AI Product Recommendations (Apply) - Personalized suggestions
 */
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AiController {

    private final AiChatService aiChatService;
    private final AiRecommendationService aiRecommendationService;

    /**
     * AI Chatbot Endpoint (Agent)
     * Provides intelligent customer support
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("AI Chat request: {}", request.getMessage());
        ChatResponse response = aiChatService.chat(request);
        return ResponseEntity.ok(response);
    }

    /**
     * AI Product Recommendations Endpoint (Apply)
     * Provides personalized product recommendations
     */
    @PostMapping("/recommendations")
    public ResponseEntity<RecommendationResponse> getRecommendations(
            @RequestBody RecommendationRequest request) {
        log.info("AI Recommendation request for user: {}", request.getUserId());
        RecommendationResponse response = aiRecommendationService.getRecommendations(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Service is running");
    }
}
