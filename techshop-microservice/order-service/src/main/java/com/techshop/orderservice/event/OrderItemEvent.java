package com.techshop.orderservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một sản phẩm trong đơn hàng, dùng trong OrderPlacedEvent.
 * Tách ra thành class riêng để tái sử dụng và dễ đọc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEvent {

    // ID sản phẩm từ Product Service
    private Long productId;

    // Tên sản phẩm (lưu snapshot để không phụ thuộc Product Service)
    private String productName;

    // Số lượng đặt mua
    private Integer quantity;

    // Giá một đơn vị tại thời điểm đặt hàng
    private BigDecimal unitPrice;

    // Tổng tiền của dòng sản phẩm = unitPrice * quantity
    private BigDecimal subtotal;
}
