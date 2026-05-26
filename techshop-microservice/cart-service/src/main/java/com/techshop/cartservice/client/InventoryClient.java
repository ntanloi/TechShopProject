package com.techshop.cartservice.client;

import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

/**
 * Feign Client for Inventory Service with Retry mechanism
 * Implements Fault Tolerance: Retry 3-5s (API call 1 service)
 */
@FeignClient(name = "inventory-service", path = "/inventory")
public interface InventoryClient {

    @Retry(name = "inventoryService")
    @GetMapping("/product/{productId}/check")
    Map<String, Object> checkStock(@PathVariable("productId") Long productId, @RequestParam("quantity") Integer quantity);
}
