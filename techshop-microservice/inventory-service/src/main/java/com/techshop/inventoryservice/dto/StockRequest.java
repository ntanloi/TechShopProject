package com.techshop.inventoryservice.dto;

import lombok.Data;

@Data
public class StockRequest {
    private Integer quantity;
    private String orderId; // tham chiếu đơn hàng (tuỳ chọn, dùng để trace)
}
