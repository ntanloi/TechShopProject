package com.techshop.productservice.service;

import com.techshop.common.service.CloudinaryService;
import com.techshop.productservice.dto.ProductRequest;
import com.techshop.productservice.enums.ErrorCode;
import com.techshop.productservice.exception.AppException;
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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

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

    public Page<Product> getByCategorySlug(String slug, Pageable pageable) {
        log.info("Fetching products by category slug '{}' from database", slug);
        return productRepository.findByCategorySlugAndActiveTrue(slug, pageable);
    }

    public Page<Product> getFiltered(
            String categorySlug,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            String sortBy,
            int page,
            int size) {
        log.info("Fetching products with filters: category={}, brand={}, minPrice={}, maxPrice={}, keyword={}, sort={}",
                categorySlug, brand, minPrice, maxPrice, keyword, sortBy);

        // Build sort
        Sort sort = Sort.unsorted();
        if ("price_asc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price_desc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("newest".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // Normalize empty strings to null for JPQL
        String catSlug = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug.trim() : null;
        String brandFilter = (brand != null && !brand.isBlank()) ? brand.trim() : null;
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;

        return productRepository.findWithFilters(catSlug, brandFilter, minPrice, maxPrice, kw, pageable);
    }

    public Page<Product> search(String keyword, Pageable pageable) {
        log.info("Searching products with keyword '{}' from database (not cached - pagination)", keyword);
        return productRepository.searchByKeyword(keyword, pageable);
    }

    @Cacheable(value = "products", key = "#id")
    public Product getById(Long id) {
        log.info("Cache MISS - Fetching product {} from database", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product create(ProductRequest request) {
        log.info("Creating new product and clearing cache");
        
        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PRICE);
        }

        if (request.getSalePrice() != null) {
            if (request.getSalePrice().compareTo(java.math.BigDecimal.ZERO) <= 0 || 
                request.getSalePrice().compareTo(request.getPrice()) > 0) {
                throw new AppException(ErrorCode.INVALID_SALE_PRICE);
            }
        }

        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            boolean skuExists = productRepository.existsBySku(request.getSku());
            if (skuExists) {
                throw new AppException(ErrorCode.SKU_EXISTED);
            }
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
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
                .images(request.getImages())
                .subcategory(request.getSubcategory())
                .accessoryType(request.getAccessoryType())
                .active(true)
                .build();

        return productRepository.save(product);
    }

    @CachePut(value = "products", key = "#id")
    public Product update(Long id, ProductRequest request) {
        log.info("Updating product {} and refreshing cache", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (request.getPrice() == null || request.getPrice().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PRICE);
        }

        if (request.getSalePrice() != null) {
            if (request.getSalePrice().compareTo(java.math.BigDecimal.ZERO) <= 0 || 
                request.getSalePrice().compareTo(request.getPrice()) > 0) {
                throw new AppException(ErrorCode.INVALID_SALE_PRICE);
            }
        }

        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            Product existingProduct = productRepository.findBySku(request.getSku());
            if (existingProduct != null && !existingProduct.getId().equals(id)) {
                throw new AppException(ErrorCode.SKU_EXISTED);
            }
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
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
        product.setImages(request.getImages());
        product.setSubcategory(request.getSubcategory());
        product.setAccessoryType(request.getAccessoryType());

        return productRepository.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        log.info("Deleting product {} and removing from cache", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setActive(false);
        productRepository.save(product);
        log.info("Product {} soft-deleted", id);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        return cloudinaryService.uploadImage(file, "products");
    }
}
