package com.techshop.orderservice.client;

import com.techshop.orderservice.dto.ProductDto;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client for Product Service with Retry mechanism
 * Implements Fault Tolerance: Retry 3-5s (API call 1 service)
 */
@FeignClient(name = "product-service", path = "/products")
public interface ProductClient {

    @Retry(name = "productService")
    @GetMapping("/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);
}
