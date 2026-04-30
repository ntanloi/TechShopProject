package com.techshop.orderservice.service;

import com.techshop.orderservice.client.PaymentClient;
import com.techshop.orderservice.dto.CreateOrderRequest;
import com.techshop.orderservice.dto.CreatePaymentRequest;
import com.techshop.orderservice.dto.PaymentResponse;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.model.OrderItem;
import com.techshop.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final PaymentClient paymentClient;

    @Value("${payment.return-url:http://localhost:3000/payment-success}")
    private String paymentReturnUrl;

    public Page<Order> getMyOrders(String email, Pageable pageable) {
        log.info("Getting orders for email: {}, page: {}, size: {}", email, pageable.getPageNumber(), pageable.getPageSize());

        Page<Order> ordersPage = orderRepository.findByUserEmail(email, pageable);

        log.info("Found {} orders, total elements: {}, total pages: {}",
                ordersPage.getNumberOfElements(), ordersPage.getTotalElements(), ordersPage.getTotalPages());

        if (!ordersPage.isEmpty()) {
            List<Long> orderIds = ordersPage.getContent().stream()
                    .map(Order::getId)
                    .collect(Collectors.toList());

            log.debug("Fetching items for order IDs: {}", orderIds);

            List<Order> ordersWithItems = orderRepository.findByIdInWithItems(orderIds);

            log.debug("Fetched {} orders with items", ordersWithItems.size());

            ordersPage.getContent().forEach(order -> {
                ordersWithItems.stream()
                        .filter(o -> o.getId().equals(order.getId()))
                        .findFirst()
                        .ifPresent(o -> order.setItems(o.getItems()));
            });
        }

        return ordersPage;
    }

    public Page<Order> getByUserId(Long userId, Pageable pageable) {
        Page<Order> ordersPage = orderRepository.findByUserId(userId, pageable);

        if (!ordersPage.isEmpty()) {
            List<Long> orderIds = ordersPage.getContent().stream()
                    .map(Order::getId)
                    .collect(Collectors.toList());

            List<Order> ordersWithItems = orderRepository.findByIdInWithItems(orderIds);

            ordersPage.getContent().forEach(order -> {
                ordersWithItems.stream()
                        .filter(o -> o.getId().equals(order.getId()))
                        .findFirst()
                        .ifPresent(o -> order.setItems(o.getItems()));
            });
        }

        return ordersPage;
    }

    // ✅ SỬA: Dùng query fetch items cùng lúc, tránh LazyInitializationException
    public Order getById(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng id=" + id));
    }

    public Order getByOrderCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng: " + orderCode));
    }

    public Page<Order> getAll(Pageable pageable) {
        Page<Order> ordersPage = orderRepository.findAll(pageable);

        if (!ordersPage.isEmpty()) {
            List<Long> orderIds = ordersPage.getContent().stream()
                    .map(Order::getId)
                    .collect(Collectors.toList());

            List<Order> ordersWithItems = orderRepository.findByIdInWithItems(orderIds);

            ordersPage.getContent().forEach(order -> {
                ordersWithItems.stream()
                        .filter(o -> o.getId().equals(order.getId()))
                        .findFirst()
                        .ifPresent(o -> order.setItems(o.getItems()));
            });
        }

        return ordersPage;
    }

    @Transactional
    public Order createOrder(Long userId, String userEmail, CreateOrderRequest request) {
        String orderCode = "TS" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + userId;

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

        final Order savedOrder = order;
        items.forEach(item -> item.setOrder(savedOrder));
        order.setItems(items);

        order = orderRepository.save(order);

        // TỰ ĐỘNG TẠO PAYMENT (chỉ cho phương thức online, không phải COD)
        // COD sẽ thanh toán khi nhận hàng, không cần tạo payment ngay
        if (request.getPaymentMethod() != Order.PaymentMethod.COD) {
            try {
                log.info("Creating payment for order: {}", order.getId());
                CreatePaymentRequest paymentRequest = CreatePaymentRequest.builder()
                        .orderId(order.getId())
                        .userId(userId)
                        .amount(total)
                        .method(request.getPaymentMethod().name())
                        .returnUrl(paymentReturnUrl)
                        .build();

                PaymentResponse payment = paymentClient.createPayment(paymentRequest);
                log.info("Payment created successfully: {}", payment.getId());

                // ✅ Lưu payment URL vào order để frontend có thể redirect
                if (payment.getPaymentUrl() != null && !payment.getPaymentUrl().isEmpty()) {
                    order.setPaymentUrl(payment.getPaymentUrl());
                    log.info("Payment URL set for order {}: {}", order.getId(), payment.getPaymentUrl());
                }

                // Nếu thanh toán online thành công ngay → update order
                if ("PAID".equals(payment.getStatus())) {
                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                    order.setStatus(Order.OrderStatus.CONFIRMED);
                }
                
                order = orderRepository.save(order);

            } catch (Exception e) {
                log.error("Failed to create payment for order: {}", order.getId(), e);
            }
        } else {
            log.info("COD order created: {}. Payment will be collected on delivery.", order.getId());
        }

        return order;
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

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hủy đơn hàng ở trạng thái PENDING");
        }

        if (!order.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy đơn hàng này");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}