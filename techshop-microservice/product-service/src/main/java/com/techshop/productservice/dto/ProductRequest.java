package com.techshop.productservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @Positive(message = "Giá khuyến mãi phải lớn hơn 0")
    private BigDecimal salePrice;
    
    private String imageUrl;
    private String brand;
    private String sku;
    private String slug;
    private Long categoryId;
    private String specifications;
}
