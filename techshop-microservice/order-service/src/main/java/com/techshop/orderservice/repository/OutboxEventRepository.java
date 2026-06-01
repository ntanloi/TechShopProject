package com.techshop.orderservice.repository;

import com.techshop.orderservice.model.OutboxEvent;
import com.techshop.orderservice.model.OutboxEvent.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    /**
     * Lấy các event PENDING theo thứ tự FIFO để publish.
     */
    @Query("SELECT e FROM OutboxEvent e WHERE e.status = :status ORDER BY e.createdAt ASC")
    List<OutboxEvent> findByStatusOrderByCreatedAt(@Param("status") OutboxStatus status, Pageable pageable);

    /**
     * Dọn dẹp các event PUBLISHED cũ hơn mốc thời gian cho trước.
     */
    @Modifying
    @Query("DELETE FROM OutboxEvent e WHERE e.status = :status AND e.publishedAt < :threshold")
    int deleteByStatusAndPublishedAtBefore(@Param("status") OutboxStatus status,
                                           @Param("threshold") LocalDateTime threshold);
}
