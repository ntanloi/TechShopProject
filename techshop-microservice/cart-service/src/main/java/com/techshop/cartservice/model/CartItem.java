package com.techshop.cartservice.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "product_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    private String productName;
    private String productImage;
    private String productBrand;
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    private LocalDateTime addedAt;

    @Transient
    @JsonProperty("availableStock")
    private Integer availableStock;

    @Transient
    @JsonProperty("lowStockThreshold")
    private Integer lowStockThreshold;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }

    public BigDecimal getSubtotal() {
        if (unitPrice == null) return BigDecimal.ZERO;
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
