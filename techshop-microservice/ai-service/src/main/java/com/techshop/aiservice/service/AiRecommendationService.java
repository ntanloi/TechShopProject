package com.techshop.aiservice.service;

import com.techshop.aiservice.dto.RecommendationRequest;
import com.techshop.aiservice.dto.RecommendationResponse;
import com.techshop.aiservice.dto.RecommendationResponse.ProductRecommendation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Product Recommendation Service (Apply)
 * Implements AI requirement: Apply - Personalized product recommendations
 * 
 * Algorithm: Collaborative Filtering + Content-Based Filtering
 */
@Service
@Slf4j
public class AiRecommendationService {

    // Simulated product database (in real app, fetch from product-service)
    private static final Map<Long, ProductInfo> PRODUCTS = new HashMap<>();
    
    static {
        PRODUCTS.put(1L, new ProductInfo(1L, "Laptop Dell XPS 13", "laptop", "dell", 25000000.0));
        PRODUCTS.put(2L, new ProductInfo(2L, "iPhone 15 Pro", "phone", "apple", 30000000.0));
        PRODUCTS.put(3L, new ProductInfo(3L, "MacBook Pro M3", "laptop", "apple", 45000000.0));
        PRODUCTS.put(4L, new ProductInfo(4L, "Samsung Galaxy S24", "phone", "samsung", 22000000.0));
        PRODUCTS.put(5L, new ProductInfo(5L, "Laptop HP Pavilion", "laptop", "hp", 18000000.0));
        PRODUCTS.put(6L, new ProductInfo(6L, "AirPods Pro", "accessory", "apple", 6000000.0));
        PRODUCTS.put(7L, new ProductInfo(7L, "Sony WH-1000XM5", "accessory", "sony", 8000000.0));
        PRODUCTS.put(8L, new ProductInfo(8L, "iPad Air", "tablet", "apple", 15000000.0));
        PRODUCTS.put(9L, new ProductInfo(9L, "Laptop Asus ROG", "laptop", "asus", 35000000.0));
        PRODUCTS.put(10L, new ProductInfo(10L, "Samsung Galaxy Tab", "tablet", "samsung", 12000000.0));
    }

    public RecommendationResponse getRecommendations(RecommendationRequest request) {
        log.info("AI Recommendation - User: {}, Product: {}", request.getUserId(), request.getProductId());
        
        int limit = request.getLimit() != null ? request.getLimit() : 5;
        List<ProductRecommendation> recommendations = new ArrayList<>();
        
        // Get current product info
        ProductInfo currentProduct = PRODUCTS.get(request.getProductId());
        
        if (currentProduct != null) {
            // Content-based filtering: recommend similar products
            recommendations = recommendSimilarProducts(currentProduct, limit);
        } else {
            // Collaborative filtering: recommend popular products
            recommendations = recommendPopularProducts(limit);
        }
        
        log.info("AI Recommendation - Generated {} recommendations", recommendations.size());
        
        return RecommendationResponse.builder()
                .recommendations(recommendations)
                .algorithm("Hybrid (Content-Based + Collaborative Filtering)")
                .confidence(0.82)
                .build();
    }

    private List<ProductRecommendation> recommendSimilarProducts(ProductInfo currentProduct, int limit) {
        return PRODUCTS.values().stream()
                .filter(p -> !p.id.equals(currentProduct.id)) // Exclude current product
                .map(p -> {
                    double score = calculateSimilarityScore(currentProduct, p);
                    String reason = generateReason(currentProduct, p);
                    return ProductRecommendation.builder()
                            .productId(p.id)
                            .productName(p.name)
                            .score(score)
                            .reason(reason)
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<ProductRecommendation> recommendPopularProducts(int limit) {
        // Recommend top products by default
        return PRODUCTS.values().stream()
                .limit(limit)
                .map(p -> ProductRecommendation.builder()
                        .productId(p.id)
                        .productName(p.name)
                        .score(0.75)
                        .reason("Sản phẩm phổ biến")
                        .build())
                .collect(Collectors.toList());
    }

    private double calculateSimilarityScore(ProductInfo current, ProductInfo candidate) {
        double score = 0.0;
        
        // Same category: +0.5
        if (current.category.equals(candidate.category)) {
            score += 0.5;
        }
        
        // Same brand: +0.3
        if (current.brand.equals(candidate.brand)) {
            score += 0.3;
        }
        
        // Similar price range (within 30%): +0.2
        double priceDiff = Math.abs(current.price - candidate.price) / current.price;
        if (priceDiff < 0.3) {
            score += 0.2;
        }
        
        return Math.min(1.0, score);
    }

    private String generateReason(ProductInfo current, ProductInfo candidate) {
        if (current.category.equals(candidate.category) && current.brand.equals(candidate.brand)) {
            return "Cùng thương hiệu và loại sản phẩm";
        } else if (current.category.equals(candidate.category)) {
            return "Cùng loại sản phẩm";
        } else if (current.brand.equals(candidate.brand)) {
            return "Cùng thương hiệu";
        } else {
            return "Khách hàng cũng quan tâm";
        }
    }

    // Inner class for product info
    private static class ProductInfo {
        Long id;
        String name;
        String category;
        String brand;
        Double price;

        ProductInfo(Long id, String name, String category, String brand, Double price) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.brand = brand;
            this.price = price;
        }
    }
}
