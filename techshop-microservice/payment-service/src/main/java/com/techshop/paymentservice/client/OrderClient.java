package com.techshop.paymentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "order-service")
public interface OrderClient {
    
    @PutMapping("/orders/{orderId}/payment-status")
    void updatePaymentStatus(@PathVariable Long orderId, @org.springframework.web.bind.annotation.RequestParam String status);
}
