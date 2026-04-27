package com.techshop.orderservice.dto;

import com.techshop.orderservice.model.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    private String shippingAddress;

    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    private String receiverPhone;

    private String note;

    private Order.PaymentMethod paymentMethod = Order.PaymentMethod.COD;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private String productName;
        private String productImage;
        private String productBrand;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
    }
}
