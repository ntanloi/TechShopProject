package com.techshop.inventoryservice.repository;

import com.techshop.inventoryservice.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    /**
     * Lấy các bản ghi có số lượng khả dụng (quantity - reservedQuantity) <= ngưỡng cảnh báo
     */
    @Query("SELECT i FROM Inventory i WHERE (i.quantity - i.reservedQuantity) <= i.lowStockThreshold")
    List<Inventory> findLowStockItems();
}
