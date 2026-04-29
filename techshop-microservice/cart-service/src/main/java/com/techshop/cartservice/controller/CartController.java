package com.techshop.cartservice.controller;

import com.techshop.cartservice.model.CartItem;
import com.techshop.cartservice.security.JwtUtil;
import com.techshop.cartservice.service.CartService;
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

    /**
     * Lấy userId từ JWT token (subject = email, dùng hashCode làm userId tạm thời)
     * Hoặc dùng email làm key cho cart
     */
    private Long getUserId(Authentication authentication, HttpServletRequest request) {
        try {
            // Thử lấy từ JWT claims nếu subject là số
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String subject = jwtUtil.extractUsername(token);
                return Long.parseLong(subject);
            }
        } catch (NumberFormatException e) {
            // Subject là email → dùng hashCode làm userId
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
