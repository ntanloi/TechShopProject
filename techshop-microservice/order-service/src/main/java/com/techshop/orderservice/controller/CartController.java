package com.techshop.orderservice.controller;

import com.techshop.orderservice.model.CartItem;
import com.techshop.orderservice.security.JwtUtil;
import com.techshop.orderservice.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart(Authentication authentication,
                                                        HttpServletRequest request) {
        Long userId = getUserId(authentication, request);
        return ResponseEntity.ok(cartService.getCartSummary(userId));
    }

    @PostMapping
    public ResponseEntity<CartItem> addToCart(@RequestBody CartItem item,
                                               Authentication authentication,
                                               HttpServletRequest request) {
        Long userId = getUserId(authentication, request);
        item.setUserId(userId);
        return ResponseEntity.ok(cartService.addToCart(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CartItem> updateQuantity(@PathVariable Long id,
                                                    @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.updateQuantity(id, quantity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> removeItem(@PathVariable Long id) {
        cartService.removeItem(id);
        return ResponseEntity.ok("Đã xóa sản phẩm khỏi giỏ hàng");
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(Authentication authentication,
                                             HttpServletRequest request) {
        Long userId = getUserId(authentication, request);
        cartService.clearCart(userId);
        return ResponseEntity.ok("Đã xóa toàn bộ giỏ hàng");
    }

    private Long getUserId(Authentication authentication, HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String subject = jwtUtil.extractUsername(token);
                return Long.parseLong(subject);
            }
        } catch (NumberFormatException e) {
            if (authentication != null) {
                return (long) Math.abs(authentication.getName().hashCode());
            }
        } catch (Exception ignored) {}

        if (authentication != null) {
            return (long) Math.abs(authentication.getName().hashCode());
        }
        return 0L;
    }
}
