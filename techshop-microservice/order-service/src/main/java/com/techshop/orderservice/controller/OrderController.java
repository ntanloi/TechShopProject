package com.techshop.orderservice.controller;

import com.techshop.orderservice.dto.CreateOrderRequest;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.security.JwtUtil;
import com.techshop.orderservice.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final JwtUtil jwtUtil;

    // =================== USER ===================

    @GetMapping("/my")
    public ResponseEntity<Page<Order>> getMyOrders(Authentication authentication, Pageable pageable) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                              Authentication authentication,
                                              HttpServletRequest httpRequest) {
        String email = authentication.getName();

        // Lấy userId từ JWT token
        Long userId = getUserIdFromToken(httpRequest);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(userId, email, request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(orderService.cancelOrder(id, authentication.getName()));
    }

    // =================== INTERNAL ===================

    @PutMapping("/{orderId}/payment-status")
    public ResponseEntity<String> updatePaymentStatus(@PathVariable Long orderId, 
                                                       @RequestParam String status) {
        if ("PAID".equals(status)) {
            orderService.markAsPaid(orderId);
            return ResponseEntity.ok("Order " + orderId + " payment status updated to PAID");
        }
        return ResponseEntity.ok("Payment status updated");
    }

    @PutMapping("/{id}/paid")
    public ResponseEntity<String> markAsPaid(@PathVariable Long id) {
        orderService.markAsPaid(id);
        return ResponseEntity.ok("Đơn hàng " + id + " đã được thanh toán");
    }

    // =================== ADMIN ===================

    @GetMapping("/admin/all")
    public ResponseEntity<Page<Order>> getAll(Pageable pageable) {
        return ResponseEntity.ok(orderService.getAll(pageable));
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id,
                                               @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    // =================== HELPER ===================

    private Long getUserIdFromToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Long userId = jwtUtil.extractUserId(token);
                return userId != null ? userId : 1L; // Default to 1 if not found
            }
        } catch (Exception ignored) {}
        return 1L; // Default userId
    }
}
