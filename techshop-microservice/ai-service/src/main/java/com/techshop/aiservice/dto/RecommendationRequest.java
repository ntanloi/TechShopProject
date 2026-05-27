package com.techshop.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {
    private Long userId;
    private Long productId; // Current product being viewed
    private List<Long> viewedProducts; // Recently viewed products
    private Integer limit; // Number of recommendations
}
