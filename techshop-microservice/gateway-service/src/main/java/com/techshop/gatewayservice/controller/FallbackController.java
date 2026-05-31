package com.techshop.gatewayservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Fallback Controller for Circuit Breaker
 * Trả về response khi service không khả dụng
 */
@RestController
public class FallbackController {

    @RequestMapping("/fallback/products")
    public Mono<ResponseEntity<Map<String, Object>>> productFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "status", 503,
                        "message", "Product Service tạm thời không khả dụng. Vui lòng thử lại sau.",
                        "service", "product-service",
                        "timestamp", LocalDateTime.now().toString(),
                        "fallback", true
                )));
    }

    @RequestMapping("/fallback/orders")
    public Mono<ResponseEntity<Map<String, Object>>> orderFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "status", 503,
                        "message", "Order Service tạm thời không khả dụng. Vui lòng thử lại sau.",
                        "service", "order-service",
                        "timestamp", LocalDateTime.now().toString(),
                        "fallback", true
                )));
    }

    @RequestMapping("/fallback/cart")
    public Mono<ResponseEntity<Map<String, Object>>> cartFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "status", 503,
                        "message", "Cart Service tạm thời không khả dụng. Vui lòng thử lại sau.",
                        "service", "cart-service",
                        "timestamp", LocalDateTime.now().toString(),
                        "fallback", true
                )));
    }

    @RequestMapping("/fallback")
    public Mono<ResponseEntity<Map<String, Object>>> defaultFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "status", 503,
                        "message", "Service tạm thời không khả dụng. Vui lòng thử lại sau.",
                        "timestamp", LocalDateTime.now().toString(),
                        "fallback", true
                )));
    }
}
