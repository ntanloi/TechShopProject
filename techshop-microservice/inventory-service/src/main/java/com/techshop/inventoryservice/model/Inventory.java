package com.techshop.inventoryservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long productId;

    @Column(nullable = false)
    private Integer quantity;

    @Builder.Default
    @Column(nullable = false)
    private Integer reservedQuantity = 0;  // số lượng đang được giữ chờ xác nhận đơn hàng

    @Builder.Default
    @Column(nullable = false)
    private Integer lowStockThreshold = 5; // ngưỡng cảnh báo hàng sắp hết

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Số lượng thực tế có thể bán = tổng tồn kho - số đang giữ
     */
    public Integer getAvailableQuantity() {
        return quantity - (reservedQuantity != null ? reservedQuantity : 0);
    }

    /**
     * Kiểm tra hàng sắp hết dựa trên ngưỡng cấu hình (không tính hàng đã hết hoàn toàn)
     */
    public boolean isLowStock() {
        int available = getAvailableQuantity();
        int threshold = lowStockThreshold != null ? lowStockThreshold : 5;
        return available > 0 && available <= threshold;
    }
}
