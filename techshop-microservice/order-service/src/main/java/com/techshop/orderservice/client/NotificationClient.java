package com.techshop.orderservice.client;

import com.techshop.orderservice.dto.OrderConfirmEmailRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "notification-service", path = "/notifications")
public interface NotificationClient {

    @PostMapping("/email/order-confirm")
    ResponseEntity<String> sendOrderConfirmEmail(@RequestBody OrderConfirmEmailRequest request);

    @PostMapping("/email/order-cancel")
    ResponseEntity<String> sendOrderCancelEmail(@RequestBody OrderConfirmEmailRequest request);

    @PostMapping("/email/order-delivered")
    ResponseEntity<String> sendOrderDeliveredEmail(@RequestBody OrderConfirmEmailRequest request);
    
    @PostMapping("/email/payment-success")
    ResponseEntity<String> sendPaymentSuccessEmail(@RequestBody OrderConfirmEmailRequest request);

    @PostMapping("/send")
    ResponseEntity<Object> sendInAppNotification(@RequestParam("userId") Long userId,
                                                 @RequestParam("title") String title,
                                                 @RequestParam("message") String message,
                                                 @RequestParam("type") String type);
}
