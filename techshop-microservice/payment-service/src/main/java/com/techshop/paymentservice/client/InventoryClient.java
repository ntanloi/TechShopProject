package com.techshop.paymentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "inventory-service")
public interface InventoryClient {
    
    @PostMapping("/inventory/commit/{orderId}")
    void commitInventory(@PathVariable Long orderId);
}
