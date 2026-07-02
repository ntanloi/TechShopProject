package com.techshop.productservice.controller;

import com.techshop.productservice.dto.ProductRequest;
import com.techshop.productservice.model.Product;
import com.techshop.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // =================== PUBLIC ===================

    /**
     * GET /products?page=0&size=20&category=laptop-gaming&brand=ASUS&minPrice=5000000&maxPrice=30000000&sort=price_asc
     * Supports optional filters: category slug, brand, price range, keyword search, sort
     */
    @GetMapping
    public ResponseEntity<Page<Product>> getAll(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // If any filter active, use filtered query
        boolean hasFilters = (category != null && !category.isBlank())
                || (brand != null && !brand.isBlank())
                || minPrice != null
                || maxPrice != null
                || (keyword != null && !keyword.isBlank())
                || (sort != null && !sort.isBlank());

        if (hasFilters) {
            return ResponseEntity.ok(productService.getFiltered(
                    category, brand, minPrice, maxPrice, keyword, sort, page, size));
        }

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.getAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> search(@RequestParam String keyword, Pageable pageable) {
        return ResponseEntity.ok(productService.search(keyword, pageable));
    }

    /**
     * GET /products/category/{categoryIdOrSlug}
     * Supports both numeric ID and string slug
     */
    @GetMapping("/category/{categoryIdOrSlug}")
    public ResponseEntity<Page<Product>> getByCategory(
            @PathVariable String categoryIdOrSlug,
            Pageable pageable) {
        // Try numeric ID first
        try {
            Long categoryId = Long.parseLong(categoryIdOrSlug);
            return ResponseEntity.ok(productService.getByCategory(categoryId, pageable));
        } catch (NumberFormatException e) {
            // Treat as slug
            return ResponseEntity.ok(productService.getByCategorySlug(categoryIdOrSlug, pageable));
        }
    }

    // =================== ADMIN ===================

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id,
                                           @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok("Đã xóa sản phẩm id=" + id);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = productService.uploadImage(file);
            return ResponseEntity.ok(imageUrl);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
