package com.techshop.productservice.repository;

import com.techshop.productservice.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    @Query("SELECT b FROM Banner b WHERE b.active = true AND " +
           "(b.startDate IS NULL OR b.startDate <= CURRENT_TIMESTAMP) AND " +
           "(b.endDate IS NULL OR b.endDate >= CURRENT_TIMESTAMP) AND " +
           "b.position = :position " +
           "ORDER BY b.displayOrder ASC")
    List<Banner> findActiveBanners(@Param("position") String position);
}
