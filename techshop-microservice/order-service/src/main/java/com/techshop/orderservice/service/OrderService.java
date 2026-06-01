package com.techshop.orderservice.service;

import com.techshop.orderservice.client.InventoryClient;
import com.techshop.orderservice.client.PaymentClient;
import com.techshop.orderservice.config.KafkaTopicConstants;
import com.techshop.orderservice.dto.*;
import com.techshop.orderservice.event.OrderItemEvent;
import com.techshop.orderservice.event.OrderPlacedEvent;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.model.OrderItem;
import com.techshop.orderservice.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ đơn hàng.
 *
 * Thay đổi so với phiên bản cũ (Event-Driven refactor):
 * - Bỏ NotificationClient: Thay bằng bắn OrderPlacedEvent lên Kafka
 *   Notification Service sẽ tự lắng nghe và gửi email/in-app
 * - Giữ InventoryClient cho bước kiểm tra stock (synchronous) và reserve stock
 *   Lý do: Cần biết ngay kết quả để phản hồi cho user
 * - Giữ PaymentClient cho bước tạo payment URL (synchronous)
 *   Lý do: Cần trả về payment URL ngay lập tức cho frontend redirect
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;

    // Feign clients vẫn dùng cho các tác vụ cần kết quả ngay (synchronous)
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;

    // Outbox service: lưu event vào bảng outbox TRONG CÙNG transaction với Order.
    // OutboxPublisher (scheduler) sẽ publish lên Kafka sau đó.
    // → Đảm bảo không mất event ngay cả khi Kafka down lúc tạo đơn.
    private final OutboxService outboxService;

    @Value("${payment.return-url:http://localhost:3000/payment-success}")
    private String paymentReturnUrl;

    // ──────────────────────────────────────────────────────────────
    // QUERY METHODS (không thay đổi)
    // ──────────────────────────────────────────────────────────────

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

            // Fetch items cùng lúc để tránh LazyInitializationException (N+1 query problem)
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

    // Dùng query fetch items cùng lúc, tránh LazyInitializationException
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

    // ──────────────────────────────────────────────────────────────
    // CREATE ORDER - Luồng chính đã được refactor sang Event-Driven
    // ──────────────────────────────────────────────────────────────

    /**
     * Tạo đơn hàng mới.
     *
     * Luồng Event-Driven:
     * 1. Kiểm tra tồn kho (synchronous - cần kết quả ngay)
     * 2. Tạo đơn hàng và lưu vào DB
     * 3. Reserve stock (synchronous - cần đảm bảo giữ hàng trước khi trả về)
     * 4. Bắn OrderPlacedEvent lên Kafka (async):
     *    - Notification Service tự gửi email xác nhận
     *    - (Trong tương lai: Inventory Service có thể xử lý thêm)
     * 5. Tạo payment URL nếu là VNPAY (synchronous - cần URL ngay)
     */
    @Transactional
    public Order createOrder(Long userId, String userEmail, CreateOrderRequest request) {
        String orderCode = "TS" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + userId;

        // ─────────────────────────────────────────────
        // BƯỚC 1: Kiểm tra tồn kho trước khi tạo đơn
        // Vẫn dùng Feign (synchronous) vì cần báo ngay cho user nếu hết hàng
        // ─────────────────────────────────────────────
        log.info("Kiểm tra tồn kho cho {} sản phẩm", request.getItems().size());
        for (CreateOrderRequest.OrderItemRequest item : request.getItems()) {
            try {
                ResponseEntity<Map<String, Object>> checkResponse = inventoryClient.checkStock(
                        item.getProductId(),
                        item.getQuantity()
                );

                Map<String, Object> checkResult = checkResponse.getBody();
                if (checkResult == null || !(Boolean) checkResult.get("available")) {
                    Integer availableStock = checkResult != null ? (Integer) checkResult.get("availableStock") : 0;
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            String.format("Sản phẩm '%s' không đủ hàng. Yêu cầu: %d, Còn lại: %d",
                                    item.getProductName(), item.getQuantity(), availableStock)
                    );
                }
                log.info("Tồn kho OK: productId={}, quantity={}", item.getProductId(), item.getQuantity());
            } catch (FeignException e) {
                log.error("Lỗi kiểm tra tồn kho productId={}: {}", item.getProductId(), e.getMessage());
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Không thể kiểm tra tồn kho. Vui lòng thử lại sau."
                );
            }
        }

        // ─────────────────────────────────────────────
        // BƯỚC 2: Tạo và lưu đơn hàng vào DB
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // BƯỚC 3: Reserve stock (synchronous)
        // Vẫn cần đồng bộ để đảm bảo giữ hàng trước khi phản hồi user
        // Nếu reserve thất bại → rollback toàn bộ (xóa đơn hàng)
        // ─────────────────────────────────────────────
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
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Không thể giữ hàng cho sản phẩm: " + item.getProductName()
                    );
                }
            }
        } catch (Exception e) {
            // ── ROLLBACK: Release tất cả đã reserve và xóa đơn hàng ──
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
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể tạo đơn hàng: " + e.getMessage()
            );
        }

        order = orderRepository.save(order);
        log.info("Đơn hàng {} đã tạo thành công với {} sản phẩm", order.getOrderCode(), order.getItems().size());

        // ─────────────────────────────────────────────
        // BƯỚC 4: Bắn OrderPlacedEvent lên Kafka (THAY THẾ NotificationClient)
        // Notification Service sẽ tự lắng nghe và:
        //  - Gửi email xác nhận đơn hàng
        //  - Gửi thông báo in-app
        // ─────────────────────────────────────────────
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

        // Bắn event (qua outbox - cùng transaction với việc tạo Order ở trên)
        outboxService.saveEvent(
                "Order",
                finalOrder.getOrderCode(),
                "OrderPlaced",
                KafkaTopicConstants.ORDER_PLACED_TOPIC,
                finalOrder.getOrderCode(),  // partition key = orderCode
                orderPlacedEvent
        );

        // ─────────────────────────────────────────────
        // BƯỚC 5: Tạo Payment URL (synchronous) - chỉ cho thanh toán online
        // COD không cần tạo payment ngay, thanh toán khi nhận hàng
        // ─────────────────────────────────────────────
        if (request.getPaymentMethod() != Order.PaymentMethod.COD) {
            try {
                log.info("Tạo payment cho đơn hàng: {}", order.getId());

                // Map order items sang DTO để truyền vào payment request
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
                        .orderCode(order.getOrderCode())       // Để Payment Service lưu vào DB và bắn Kafka event
                        .userEmail(userEmail)                  // Để Notification Service gửi email
                        .receiverName(order.getReceiverName()) // Để email cá nhân hóa
                        .items(paymentItems)                   // Để Inventory Service auto-release khi payment thất bại
                        .build();

                PaymentResponse payment = paymentClient.createPayment(paymentRequest);
                log.info("Tạo payment thành công: paymentId={}", payment.getId());

                // Lưu payment URL vào order để frontend có thể redirect sang VNPAY
                if (payment.getPaymentUrl() != null && !payment.getPaymentUrl().isEmpty()) {
                    order.setPaymentUrl(payment.getPaymentUrl());
                    log.info("Payment URL đã lưu cho đơn hàng {}: {}", order.getId(), payment.getPaymentUrl());
                }

                // Nếu payment thành công ngay (ít khi xảy ra với VNPAY) → update order
                if ("PAID".equals(payment.getStatus())) {
                    order.setPaymentStatus(Order.PaymentStatus.PAID);
                    order.setStatus(Order.OrderStatus.CONFIRMED);
                }

                order = orderRepository.save(order);

            } catch (Exception e) {
                log.error("Lỗi tạo payment cho đơn hàng: {}", order.getId(), e);
                // Không throw exception, đơn hàng vẫn được tạo
                // User có thể vào lịch sử đơn hàng để thanh toán lại
            }
        } else {
            log.info("Đơn COD tạo thành công: {}. Thanh toán khi nhận hàng.", order.getId());
        }

        return order;
    }

    // ──────────────────────────────────────────────────────────────
    // UPDATE STATUS - Khi admin cập nhật trạng thái thủ công
    // ──────────────────────────────────────────────────────────────

    /**
     * Cập nhật trạng thái đơn hàng (dùng bởi Admin).
     * Các tác vụ tồn kho (commit/release) vẫn gọi Inventory Service trực tiếp
     * vì đây là tác vụ admin cần biết kết quả ngay.
     */
    @Transactional
    public Order updateStatus(Long id, Order.OrderStatus status) {
        Order order = getById(id);
        Order.OrderStatus oldStatus = order.getStatus();

        order.setStatus(status);
        log.info("Đơn hàng {} chuyển trạng thái từ {} sang {}", id, oldStatus, status);

        // ─────────────────────────────────────────────
        // COMMIT stock khi đơn hàng chuyển sang DELIVERED
        // Xác nhận trừ hàng thực tế sau khi giao hàng thành công
        // ─────────────────────────────────────────────
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
                    // Không throw, vẫn cho phép cập nhật trạng thái
                    // Admin có thể xử lý tồn kho thủ công sau nếu cần
                }
            }
        }

        // ─────────────────────────────────────────────
        // RELEASE stock nếu admin hủy đơn hàng
        // ─────────────────────────────────────────────
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

    /**
     * Đánh dấu đơn hàng đã thanh toán (dùng bởi Payment Service callback hoặc Admin).
     * NOTE: Không COMMIT tồn kho ở đây. Chỉ COMMIT khi đơn hàng chuyển sang DELIVERED.
     * Vì hàng chỉ thực sự xuất kho khi giao hàng thành công.
     */
    @Transactional
    public Order markAsPaid(Long id) {
        Order order = getById(id);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        log.info("Đơn hàng {} được đánh dấu là PAID", id);
        return orderRepository.save(order);
    }

    /**
     * Hủy đơn hàng (dùng bởi người dùng - chỉ cho phép hủy khi đang PENDING).
     */
    @Transactional
    public Order cancelOrder(Long id, String userEmail) {
        Order order = getById(id);

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hủy đơn hàng ở trạng thái PENDING");
        }

        if (!order.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy đơn hàng này");
        }

        // ─────────────────────────────────────────────
        // Release stock khi user tự hủy đơn
        // ─────────────────────────────────────────────
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
                // Không throw exception, vẫn cho phép hủy đơn
            }
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}