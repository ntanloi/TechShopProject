package com.techshop.aiservice.client;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class OrderServiceClientFallback implements OrderServiceClient {

    @Override
    public List<Map<String, Object>> getOrdersByUserId(Long userId) {
        return Collections.emptyList();
    }
}
