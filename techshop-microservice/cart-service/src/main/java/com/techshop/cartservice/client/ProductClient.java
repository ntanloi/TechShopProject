package com.techshop.cartservice.client;

import com.techshop.cartservice.dto.ProductDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service", path = "/products")
public interface ProductClient {

    @GetMapping("/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);
}
