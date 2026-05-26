package com.techshop.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {
    private List<ProductRecommendation> recommendations;
    private String algorithm;
    private Double confidence;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductRecommendation {
        private Long productId;
        private String productName;
        private Double score;
        private String reason;
    }
}
