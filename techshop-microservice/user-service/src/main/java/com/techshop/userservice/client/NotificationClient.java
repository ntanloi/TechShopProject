package com.techshop.userservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "notification-service", path = "/notifications")
public interface NotificationClient {

    @PostMapping("/email/welcome")
    ResponseEntity<String> sendWelcomeEmail(@RequestParam("email") String email,
                                             @RequestParam("fullName") String fullName);
}
