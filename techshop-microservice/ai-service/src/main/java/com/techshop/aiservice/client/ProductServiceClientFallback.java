package com.techshop.aiservice.client;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

@Component
public class ProductServiceClientFallback implements ProductServiceClient {

    @Override
    public Map<String, Object> getProducts(int page, int size) {
        return Collections.emptyMap();
    }

    @Override
    public Map<String, Object> searchProducts(String keyword, int page, int size) {
        return Collections.emptyMap();
    }
}
