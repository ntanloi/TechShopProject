package com.techshop.userservice.repository;

import com.techshop.userservice.model.OutboxEvent;
import com.techshop.userservice.model.OutboxEvent.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = :status ORDER BY e.createdAt ASC")
    List<OutboxEvent> findByStatusOrderByCreatedAt(@Param("status") OutboxStatus status, Pageable pageable);

    @Modifying
    @Query("DELETE FROM OutboxEvent e WHERE e.status = :status AND e.publishedAt < :threshold")
    int deleteByStatusAndPublishedAtBefore(@Param("status") OutboxStatus status,
                                           @Param("threshold") LocalDateTime threshold);
}
