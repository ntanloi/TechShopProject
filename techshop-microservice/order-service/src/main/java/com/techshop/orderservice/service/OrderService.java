package com.techshop.orderservice.service;

import com.techshop.orderservice.dto.CreateOrderRequest;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.model.OrderItem;
import com.techshop.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;

    public Page<Order> getMyOrders(String email, Pageable pageable) {
        return orderRepository.findByUserEmail(email, pageable);
    }

    public Page<Order> getByUserId(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable);
    }

    public Order getById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng id=" + id));
    }

    public Order getByOrderCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng: " + orderCode));
    }

    public Page<Order> getAll(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    public Order createOrder(Long userId, String userEmail, CreateOrderRequest request) {
        // Tạo order code: TS + timestamp
        String orderCode = "TS" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + userId;

        // Map items
        List<OrderItem> items = request.getItems().stream().map(i -> {
            BigDecimal subtotal = i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity()));
            return OrderItem.builder()
                    .productId(i.getProductId())
                    .productName(i.getProductName())
                    .productImage(i.getProductImage())
                    .productBrand(i.getProductBrand())
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .subtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());

        // Tính tổng tiền
        BigDecimal total = items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .userId(userId)
                .userEmail(userEmail)
                .orderCode(orderCode)
                .shippingAddress(request.getShippingAddress())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .note(request.getNote())
                .paymentMethod(request.getPaymentMethod())
                .totalAmount(total)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.UNPAID)
                .build();

        order = orderRepository.save(order);

        // Gán order cho từng item
        final Order savedOrder = order;
        items.forEach(item -> item.setOrder(savedOrder));
        order.setItems(items);

        return orderRepository.save(order);
    }

    public Order updateStatus(Long id, Order.OrderStatus status) {
        Order order = getById(id);
        order.setStatus(status);
        log.info("Order {} status updated to {}", id, status);
        return orderRepository.save(order);
    }

    public Order markAsPaid(Long id) {
        Order order = getById(id);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        log.info("Order {} marked as PAID", id);
        return orderRepository.save(order);
    }

    public Order cancelOrder(Long id, String userEmail) {
        Order order = getById(id);

        // Chỉ cho phép hủy khi PENDING
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hủy đơn hàng ở trạng thái PENDING");
        }

        // Chỉ chủ đơn hoặc admin mới được hủy
        if (!order.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy đơn hàng này");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}
