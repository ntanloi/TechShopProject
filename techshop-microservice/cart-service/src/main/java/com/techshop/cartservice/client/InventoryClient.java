package com.techshop.cartservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

@FeignClient(name = "inventory-service", path = "/inventory")
public interface InventoryClient {

    @GetMapping("/product/{productId}/check")
    Map<String, Object> checkStock(@PathVariable("productId") Long productId, @RequestParam("quantity") Integer quantity);
}
