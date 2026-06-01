package com.techshop.paymentservice.repository;

import com.techshop.paymentservice.model.OutboxEvent;
import com.techshop.paymentservice.model.OutboxEvent.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    /**
     * Lấy các event đang PENDING để publish, sắp xếp theo thứ tự tạo (FIFO)
     * để đảm bảo event cũ được publish trước.
     * Giới hạn batch size qua Pageable để tránh load quá nhiều record cùng lúc.
     */
    @Query("SELECT e FROM OutboxEvent e WHERE e.status = :status ORDER BY e.createdAt ASC")
    List<OutboxEvent> findByStatusOrderByCreatedAt(@Param("status") OutboxStatus status, Pageable pageable);

    /**
     * Xóa các event đã publish thành công và cũ hơn mốc thời gian cho trước.
     * Dùng để dọn dẹp bảng outbox định kỳ, tránh phình to vô hạn.
     */
    @Modifying
    @Query("DELETE FROM OutboxEvent e WHERE e.status = :status AND e.publishedAt < :threshold")
    int deleteByStatusAndPublishedAtBefore(@Param("status") OutboxStatus status,
                                           @Param("threshold") LocalDateTime threshold);
}
