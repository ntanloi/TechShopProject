package com.techshop.inventoryservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockOperationResult {
    private boolean success;
    private String message;
    private InventoryResponse inventory;

    public static StockOperationResult ok(String message, InventoryResponse inventory) {
        return StockOperationResult.builder()
                .success(true)
                .message(message)
                .inventory(inventory)
                .build();
    }

    public static StockOperationResult fail(String message) {
        return StockOperationResult.builder()
                .success(false)
                .message(message)
                .build();
    }
}
