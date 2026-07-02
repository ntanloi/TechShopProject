package com.techshop.productservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String imageUrl;

    private String linkUrl;

    @Column(nullable = false)
    private String position; // e.g., "HERO_SLIDE", "HERO_RIGHT", "PROMO_TOP", "PROMO_BOTTOM"

    @Builder.Default
    private int displayOrder = 0;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
