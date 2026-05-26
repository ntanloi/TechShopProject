package com.techshop.productservice.service;

import com.techshop.common.service.CloudinaryService;
import com.techshop.productservice.dto.ProductRequest;
import com.techshop.productservice.model.Category;
import com.techshop.productservice.model.Product;
import com.techshop.productservice.repository.CategoryRepository;
import com.techshop.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CloudinaryService cloudinaryService;

    public Page<Product> getAll(Pageable pageable) {
        log.info("Fetching all products from database (not cached - pagination)");
        return productRepository.findByActiveTrue(pageable);
    }

    public Page<Product> getByCategory(Long categoryId, Pageable pageable) {
        log.info("Fetching products by category {} from database (not cached - pagination)", categoryId);
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable);
    }

    public Page<Product> search(String keyword, Pageable pageable) {
        log.info("Searching products with keyword '{}' from database (not cached - pagination)", keyword);
        return productRepository.searchByKeyword(keyword, pageable);
    }

    /**
     * Get product by ID with Redis caching
     * Cache name: "products", Key: product ID
     * TTL: 10 minutes (configured in RedisConfig)
     */
    @Cacheable(value = "products", key = "#id")
    public Product getById(Long id) {
        log.info("Cache MISS - Fetching product {} from database", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy sản phẩm id=" + id));
    }

    /**
     * Create product and evict all products cache
     */
    @CacheEvict(value = "products", allEntries = true)
    public Product create(ProductRequest request) {
        log.info("Creating new product and clearing cache");
        // Validate price > 0
        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá phải lớn hơn 0");
        }

        // Validate salePrice > 0 (nếu có)
        if (request.getSalePrice() != null) {
            if (request.getSalePrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá khuyến mãi phải lớn hơn 0");
            }
            // Validate salePrice <= price
            if (request.getSalePrice().compareTo(request.getPrice()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc");
            }
        }

        // Check SKU unique
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            boolean skuExists = productRepository.existsBySku(request.getSku());
            if (skuExists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã SKU đã tồn tại");
            }
        }

        // Validate category exists
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy danh mục id=" + request.getCategoryId()));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .salePrice(request.getSalePrice())
                .imageUrl(request.getImageUrl())
                .brand(request.getBrand())
                .sku(request.getSku())
                .slug(request.getSlug())
                .category(category)
                .specifications(request.getSpecifications())
                .active(true)
                .build();

        return productRepository.save(product);
    }

    /**
     * Update product and update cache
     */
    @CachePut(value = "products", key = "#id")
    public Product update(Long id, ProductRequest request) {
        log.info("Updating product {} and refreshing cache", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy sản phẩm id=" + id));

        // Validate price > 0
        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá phải lớn hơn 0");
        }

        // Validate salePrice > 0 (nếu có)
        if (request.getSalePrice() != null) {
            if (request.getSalePrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá khuyến mãi phải lớn hơn 0");
            }
            // Validate salePrice <= price
            if (request.getSalePrice().compareTo(request.getPrice()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc");
            }
        }

        // Check SKU unique (exclude current product)
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            Product existingProduct = productRepository.findBySku(request.getSku());
            if (existingProduct != null && !existingProduct.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã SKU đã tồn tại");
            }
        }

        // Validate category exists
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy danh mục id=" + request.getCategoryId()));
            product.setCategory(category);
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setSalePrice(request.getSalePrice());
        product.setImageUrl(request.getImageUrl());
        product.setBrand(request.getBrand());
        product.setSku(request.getSku());
        product.setSlug(request.getSlug());
        product.setSpecifications(request.getSpecifications());

        return productRepository.save(product);
    }

    /**
     * Delete product and evict from cache
     */
    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        log.info("Deleting product {} and removing from cache", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy sản phẩm id=" + id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Product {} soft-deleted", id);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        return cloudinaryService.uploadImage(file, "products");
    }
}
