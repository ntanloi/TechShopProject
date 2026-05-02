package com.techshop.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Feign Client để gọi Inventory Service
 * Sử dụng Eureka service discovery với tên service "inventory-service"
 */
@FeignClient(name = "inventory-service")
public interface InventoryClient {

    /**
     * Kiểm tra xem có đủ hàng để đặt không
     * GET /inventory/product/{productId}/check?quantity=5
     */
    @GetMapping("/inventory/product/{productId}/check")
    ResponseEntity<Map<String, Object>> checkStock(
            @PathVariable("productId") Long productId,
            @RequestParam("quantity") Integer quantity
    );

    /**
     * Giữ hàng khi khách đặt đơn
     * POST /inventory/product/{productId}/reserve
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/inventory/product/{productId}/reserve")
    ResponseEntity<StockOperationResponse> reserveStock(
            @PathVariable("productId") Long productId,
            @RequestBody StockRequest request
    );

    /**
     * Trả hàng về kho khi hủy đơn
     * POST /inventory/product/{productId}/release
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/inventory/product/{productId}/release")
    ResponseEntity<StockOperationResponse> releaseStock(
            @PathVariable("productId") Long productId,
            @RequestBody StockRequest request
    );

    /**
     * Xác nhận trừ hàng thực tế khi đơn hoàn thành
     * POST /inventory/product/{productId}/commit
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/inventory/product/{productId}/commit")
    ResponseEntity<StockOperationResponse> commitStock(
            @PathVariable("productId") Long productId,
            @RequestBody StockRequest request
    );

    // DTO classes for Feign Client
    record StockRequest(Integer quantity, String orderId) {}

    record StockOperationResponse(
            boolean success,
            String message,
            InventoryData inventory
    ) {}

    record InventoryData(
            Long id,
            Long productId,
            Integer quantity,
            Integer reservedQuantity,
            Integer availableQuantity,
            Integer lowStockThreshold,
            boolean lowStock
    ) {}
}
