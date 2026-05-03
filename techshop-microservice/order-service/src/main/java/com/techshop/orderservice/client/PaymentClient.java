package com.techshop.orderservice.client;

import com.techshop.orderservice.dto.CreatePaymentRequest;
import com.techshop.orderservice.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "payment-service")
public interface PaymentClient {
    
    @PostMapping("/payments")
    PaymentResponse createPayment(@RequestBody CreatePaymentRequest request);
}
