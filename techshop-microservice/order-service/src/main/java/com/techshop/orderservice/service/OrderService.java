package com.techshop.orderservice.service;

import com.techshop.orderservice.client.InventoryClient;
import com.techshop.orderservice.client.PaymentClient;
import com.techshop.orderservice.constant.KafkaTopicConstants;
import com.techshop.orderservice.dto.*;
import com.techshop.orderservice.enums.ErrorCode;
import com.techshop.orderservice.event.OrderItemEvent;
import com.techshop.orderservice.event.OrderPlacedEvent;
import com.techshop.orderservice.exception.AppException;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.model.OrderItem;
import com.techshop.orderservice.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final OutboxService outboxService;

    @Value("${payment.return-url:http://localhost:3000/payment-success}")
    private String paymentReturnUrl;

    public Page<Order> getMyOrders(String email, Pageable pageable) {
        log.info("Lấy đơn hàng của email: {}, trang: {}, kích thước: {}",
                email, pageable.getPageNumber(), pageable.getPageSize());

        Page<Order> ordersPage = orderRepository.findByUserEmail(email, pageable);

        log.info("Tìm thấy {} đơn hàng, tổng: {}, tổng trang: {}",
                ordersPage.getNumberOfElements(), ordersPage.getTotalElements(), ordersPage.getTotalPages());

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

    public Order getById(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    public Order getByOrderCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
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

        log.info("Kiểm tra tồn kho cho {} sản phẩm", request.getItems().size());
        for (CreateOrderRequest.OrderItemRequest item : request.getItems()) {
            try {
                ResponseEntity<Map<String, Object>> checkResponse = inventoryClient.checkStock(
                        item.getProductId(),
                        item.getQuantity()
                );

                Map<String, Object> checkResult = checkResponse.getBody();
                if (checkResult == null || !(Boolean) checkResult.get("available")) {
                    throw new AppException(ErrorCode.OUT_OF_STOCK);
                }
                log.info("Tồn kho OK: productId={}, quantity={}", item.getProductId(), item.getQuantity());
            } catch (FeignException e) {
                log.error("Lỗi kiểm tra tồn kho productId={}: {}", item.getProductId(), e.getMessage());
                throw new AppException(ErrorCode.SERVICE_UNAVAILABLE);
            }
        }

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

        List<Long> reservedProducts = new ArrayList<>();
        try {
            for (OrderItem item : order.getItems()) {
                log.info("Reserve stock: productId={}, quantity={}, orderCode={}",
                        item.getProductId(), item.getQuantity(), order.getOrderCode());

                InventoryClient.StockRequest stockRequest = new InventoryClient.StockRequest(
                        item.getQuantity(),
                        order.getOrderCode()
                );

                ResponseEntity<InventoryClient.StockOperationResponse> reserveResponse =
                        inventoryClient.reserveStock(item.getProductId(), stockRequest);

                if (reserveResponse.getStatusCode().is2xxSuccessful()) {
                    reservedProducts.add(item.getProductId());
                    log.info("Reserve stock thành công: productId={}", item.getProductId());
                } else {
                    throw new AppException(ErrorCode.OUT_OF_STOCK);
                }
            }
        } catch (Exception e) {
            log.error("Reserve stock thất bại, rollback đơn hàng {}: {}", order.getOrderCode(), e.getMessage());

            for (Long productId : reservedProducts) {
                try {
                    OrderItem item = order.getItems().stream()
                            .filter(i -> i.getProductId().equals(productId))
                            .findFirst()
                            .orElse(null);

                    if (item != null) {
                        InventoryClient.StockRequest releaseRequest = new InventoryClient.StockRequest(
                                item.getQuantity(),
                                order.getOrderCode()
                        );
                        inventoryClient.releaseStock(productId, releaseRequest);
                        log.info("Đã rollback reserve cho productId={}", productId);
                    }
                } catch (Exception rollbackEx) {
                    log.error("Lỗi rollback reserve cho productId={}: {}", productId, rollbackEx.getMessage());
                }
            }

            orderRepository.delete(order);
            throw new AppException(ErrorCode.OUT_OF_STOCK);
        }

        order = orderRepository.save(order);
        log.info("Đơn hàng {} đã tạo thành công với {} sản phẩm", order.getOrderCode(), order.getItems().size());

        final Order finalOrder = order;
        List<OrderItemEvent> itemEvents = order.getItems().stream()
                .map(item -> OrderItemEvent.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        OrderPlacedEvent orderPlacedEvent = OrderPlacedEvent.builder()
                .orderId(finalOrder.getId())
                .orderCode(finalOrder.getOrderCode())
                .userId(userId)
                .userEmail(userEmail)
                .receiverName(finalOrder.getReceiverName())
                .shippingAddress(finalOrder.getShippingAddress())
                .totalAmount(finalOrder.getTotalAmount())
                .paymentMethod(finalOrder.getPaymentMethod().name())
                .items(itemEvents)
                .build();

        outboxService.saveEvent(
                "Order",
                finalOrder.getOrderCode(),
                "OrderPlaced",
                KafkaTopicConstants.ORDER_PLACED_TOPIC,
                finalOrder.getOrderCode(),
                orderPlacedEvent
        );

        if (request.getPaymentMethod() != Order.PaymentMethod.COD) {
            try {
                log.info("Tạo payment cho đơn hàng: {}", order.getId());

                List<CreatePaymentRequest.OrderItemDto> paymentItems = order.getItems().stream()
                        .map(item -> CreatePaymentRequest.OrderItemDto.builder()
                                .productId(item.getProductId())
                                .productName(item.getProductName())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .build())
                        .collect(Collectors.toList());

                CreatePaymentRequest paymentRequest = CreatePaymentRequest.builder()
                        .orderId(order.getId())
                        .userId(userId)
                        .amount(total)
                        .method(request.getPaymentMethod().name())
                        .returnUrl(paymentReturnUrl)
                        .orderCode(order.getOrderCode())
                        .userEmail(userEmail)
                        .receiverName(order.getReceiverName())
                        .items(paymentItems)
                        .build();

                PaymentResponse payment = paymentClient.createPayment(paymentRequest);
                log.info("Tạo payment thành công: paymentId={}", payment.getId());

                if (payment.getPaymentUrl() != null && !payment.getPaymentUrl().isEmpty()) {
                    order.setPaymentUrl(payment.getPaymentUrl());
                    log.info("Payment URL đã lưu cho đơn hàng {}: {}", order.getId(), payment.getPaymentUrl());
                }

                if ("PAID".equals(payment.getStatus())) {
                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                    order.setStatus(Order.OrderStatus.CONFIRMED);
                }

                order = orderRepository.save(order);

            } catch (Exception e) {
                log.error("Lỗi tạo payment cho đơn hàng: {}", order.getId(), e);
            }
        } else {
            log.info("Đơn COD tạo thành công: {}. Thanh toán khi nhận hàng.", order.getId());
        }

        return order;
    }

    @Transactional
    public Order updateStatus(Long id, Order.OrderStatus status) {
        Order order = getById(id);
        Order.OrderStatus oldStatus = order.getStatus();

        order.setStatus(status);
        log.info("Đơn hàng {} chuyển trạng thái từ {} sang {}", id, oldStatus, status);

        if (status == Order.OrderStatus.DELIVERED && oldStatus != Order.OrderStatus.DELIVERED) {
            log.info("Đơn hàng {} giao thành công, commit stock (trừ hàng thực tế)", order.getOrderCode());

            for (OrderItem item : order.getItems()) {
                try {
                    InventoryClient.StockRequest commitRequest = new InventoryClient.StockRequest(
                            item.getQuantity(),
                            order.getOrderCode()
                    );

                    ResponseEntity<InventoryClient.StockOperationResponse> commitResponse =
                            inventoryClient.commitStock(item.getProductId(), commitRequest);

                    if (commitResponse.getStatusCode().is2xxSuccessful()) {
                        log.info("Commit stock thành công: productId={}, quantity={} (Đơn: {})",
                                item.getProductId(), item.getQuantity(), order.getOrderCode());
                    } else {
                        log.warn("Commit stock thất bại: productId={}", item.getProductId());
                    }
                } catch (FeignException e) {
                    log.error("Lỗi commit stock productId={}: {}", item.getProductId(), e.getMessage());
                }
            }
        }

        if (status == Order.OrderStatus.CANCELLED && oldStatus != Order.OrderStatus.CANCELLED) {
            log.info("Admin hủy đơn hàng {}, release stock", order.getOrderCode());

            for (OrderItem item : order.getItems()) {
                try {
                    InventoryClient.StockRequest releaseRequest = new InventoryClient.StockRequest(
                            item.getQuantity(),
                            order.getOrderCode()
                    );

                    ResponseEntity<InventoryClient.StockOperationResponse> releaseResponse =
                            inventoryClient.releaseStock(item.getProductId(), releaseRequest);

                    if (releaseResponse.getStatusCode().is2xxSuccessful()) {
                        log.info("Release stock thành công: productId={}, quantity={}",
                                item.getProductId(), item.getQuantity());
                    } else {
                        log.warn("Release stock thất bại: productId={}", item.getProductId());
                    }
                } catch (FeignException e) {
                    log.error("Lỗi release stock productId={}: {}", item.getProductId(), e.getMessage());
                }
            }
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order markAsPaid(Long id) {
        Order order = getById(id);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        log.info("Đơn hàng {} được đánh dấu là PAID", id);
        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Long id, String userEmail) {
        Order order = getById(id);

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new AppException(ErrorCode.CANCEL_NOT_ALLOWED);
        }

        if (!order.getUserEmail().equals(userEmail)) {
            throw new AppException(ErrorCode.FORBIDDEN_ORDER_ACCESS);
        }

        log.info("User hủy đơn hàng {}, release stock", order.getOrderCode());
        for (OrderItem item : order.getItems()) {
            try {
                InventoryClient.StockRequest releaseRequest = new InventoryClient.StockRequest(
                        item.getQuantity(),
                        order.getOrderCode()
                );

                ResponseEntity<InventoryClient.StockOperationResponse> releaseResponse =
                        inventoryClient.releaseStock(item.getProductId(), releaseRequest);

                if (releaseResponse.getStatusCode().is2xxSuccessful()) {
                    log.info("Release stock thành công: productId={}, quantity={}",
                            item.getProductId(), item.getQuantity());
                } else {
                    log.warn("Release stock thất bại: productId={}", item.getProductId());
                }
            } catch (FeignException e) {
                log.error("Lỗi release stock productId={}: {}", item.getProductId(), e.getMessage());
            }
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}