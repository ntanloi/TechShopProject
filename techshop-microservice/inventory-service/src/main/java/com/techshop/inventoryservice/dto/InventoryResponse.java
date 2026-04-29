package com.techshop.inventoryservice.dto;

import com.techshop.inventoryservice.model.Inventory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InventoryResponse {

    private Long id;
    private Long productId;
    private Integer quantity;          // tổng tồn kho
    private Integer reservedQuantity;  // đang giữ
    private Integer availableQuantity; // có thể bán
    private Integer lowStockThreshold;
    private boolean lowStock;
    private LocalDateTime updatedAt;

    public static InventoryResponse from(Inventory inv) {
        return InventoryResponse.builder()
                .id(inv.getId())
                .productId(inv.getProductId())
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .availableQuantity(inv.getAvailableQuantity())
                .lowStockThreshold(inv.getLowStockThreshold())
                .lowStock(inv.isLowStock())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
