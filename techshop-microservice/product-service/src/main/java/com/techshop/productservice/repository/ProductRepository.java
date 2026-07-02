package com.techshop.productservice.repository;

import com.techshop.productservice.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    boolean existsBySku(String sku);
    
    Product findBySku(String sku);

    // Filter by category slug
    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.active = true AND LOWER(c.slug) = LOWER(:slug)")
    Page<Product> findByCategorySlugAndActiveTrue(@Param("slug") String slug, Pageable pageable);

    // Filter by category slug with keyword
    @Query("SELECT p FROM Product p JOIN p.category c WHERE p.active = true AND LOWER(c.slug) = LOWER(:slug) AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> findByCategorySlugAndKeyword(@Param("slug") String slug, @Param("keyword") String keyword, Pageable pageable);

    // Advanced filter: optional brand, optional minPrice, optional maxPrice, optional category slug
    @Query("SELECT p FROM Product p LEFT JOIN p.category c WHERE p.active = true " +
           "AND (:categorySlug IS NULL OR LOWER(c.slug) = LOWER(:categorySlug)) " +
           "AND (:brand IS NULL OR LOWER(p.brand) = LOWER(:brand)) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
           "AND (:keyword IS NULL OR " +
           "     LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> findWithFilters(
            @Param("categorySlug") String categorySlug,
            @Param("brand") String brand,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("keyword") String keyword,
            Pageable pageable);

    // Count active products by category slug
    @Query("SELECT COUNT(p) FROM Product p JOIN p.category c WHERE p.active = true AND LOWER(c.slug) = LOWER(:slug)")
    long countByCategorySlug(@Param("slug") String slug);
}
