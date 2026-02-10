package com.techshop.orderservice.repository;

import com.techshop.orderservice.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByUserEmail(String email, Pageable pageable);
    Optional<Order> findByOrderCode(String orderCode);
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);
}
